"""Kafka → ClickHouse ETL.

Subscribes to the canonical Kaori event topics and inserts each event into
the matching `kaori.fact_*` table. ClickHouse buffer engine (or batched
insert here) keeps latency low. Idempotency: ClickHouse de-dupes by
(tenant_id, booking_id, item_id, event_ts).

Run:
    poetry run python -m kaori_analytics.main
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import signal
from datetime import datetime, timezone
from typing import Any, Iterable

from aiokafka import AIOKafkaConsumer
import clickhouse_connect

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
log = logging.getLogger("etl")


KAFKA_BROKERS = os.environ.get("KAFKA_BROKERS", "localhost:9092")
CH_HOST = os.environ.get("CH_HOST", "localhost")
CH_PORT = int(os.environ.get("CH_PORT", "8123"))
CH_DB = os.environ.get("CH_DB", "kaori")

TOPICS = [
    "kaori.booking.created.v1",
    "kaori.booking.completed.v1",
    "kaori.booking.cancelled.v1",
    "kaori.audit.event.v1"
]

ch = clickhouse_connect.get_client(host=CH_HOST, port=CH_PORT, database=CH_DB)


def _parse_ts(value: str | None) -> datetime:
    if not value:
        return datetime.now(timezone.utc)
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return datetime.now(timezone.utc)


def _route(topic: str, payload: dict[str, Any]) -> tuple[str, list[Any]] | None:
    """Map an event to (table, row) — return None to drop."""
    if topic.startswith("kaori.booking."):
        return "fact_bookings", [
            _parse_ts(payload.get("ts")),
            payload["tenantId"],
            payload["branchId"],
            payload["bookingId"],
            payload.get("code", ""),
            payload.get("status", ""),
            payload.get("source", "web"),
            payload.get("locale", "vi"),
            payload.get("phone", ""),
            _parse_ts(payload.get("startAt")),
            int(payload.get("durationMin", 0) or 0),
            float(payload.get("totalAmount", 0) or 0)
        ]
    if topic == "kaori.audit.event.v1":
        return "fact_audit_events", [
            _parse_ts(payload.get("ts")),
            payload.get("tenantId") or "00000000-0000-0000-0000-000000000000",
            payload.get("actorId"),
            payload.get("action", ""),
            payload.get("entityType", ""),
            str(payload.get("entityId", "")),
            payload.get("ip")
        ]
    return None


async def consume() -> None:
    consumer = AIOKafkaConsumer(
        *TOPICS,
        bootstrap_servers=KAFKA_BROKERS,
        group_id="analytics-etl",
        enable_auto_commit=False,
        auto_offset_reset="earliest",
        value_deserializer=lambda v: v.decode("utf-8")
    )
    await consumer.start()
    log.info("Subscribed to %s", TOPICS)

    buffers: dict[str, list[list[Any]]] = {}
    last_flush = asyncio.get_event_loop().time()
    FLUSH_AFTER_S = 2
    BATCH_LIMIT = 200

    try:
        async for msg in consumer:
            try:
                payload = json.loads(msg.value)
            except json.JSONDecodeError:
                log.warning("Bad JSON on %s, skipping", msg.topic)
                await consumer.commit()
                continue

            routed = _route(msg.topic, payload)
            if routed is None:
                await consumer.commit()
                continue

            table, row = routed
            buffers.setdefault(table, []).append(row)

            now = asyncio.get_event_loop().time()
            if any(len(b) >= BATCH_LIMIT for b in buffers.values()) or now - last_flush > FLUSH_AFTER_S:
                _flush(buffers)
                buffers.clear()
                await consumer.commit()
                last_flush = now
    finally:
        if buffers:
            _flush(buffers)
        await consumer.stop()


def _flush(buffers: dict[str, list[list[Any]]]) -> None:
    for table, rows in buffers.items():
        if not rows:
            continue
        log.info("Flushing %d rows → %s.%s", len(rows), CH_DB, table)
        try:
            ch.insert(table, rows)
        except Exception as ex:
            log.error("ClickHouse insert failed for %s: %s", table, ex)


def main() -> None:
    loop = asyncio.new_event_loop()
    stop = loop.create_future()
    for s in (signal.SIGINT, signal.SIGTERM):
        try: loop.add_signal_handler(s, lambda: stop.set_result(None))
        except NotImplementedError: pass  # Windows
    task = loop.create_task(consume())
    try:
        loop.run_until_complete(asyncio.wait({task, stop}, return_when=asyncio.FIRST_COMPLETED))
    finally:
        task.cancel()
        loop.run_until_complete(asyncio.sleep(0.1))
        loop.close()


if __name__ == "__main__":
    main()
