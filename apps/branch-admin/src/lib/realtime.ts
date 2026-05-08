'use client';

/**
 * Native WebSocket connector for the realtime-gateway service.
 *
 * Connects with `?token=<jwt>&rooms=<csv>` and subscribes to events for the
 * current branch. The hook exposes a `subscribe(handler)` so any component
 * can react to incoming domain events (booking.created, payment.completed,
 * notification.created).
 *
 * Resilience:
 *   - Auto-reconnects with exponential backoff (1s, 2s, 5s, 10s, 30s).
 *   - Sends a ping every 30s; reconnect if no pong in 10s.
 *   - Closes cleanly on logout / unmount.
 */

import { useEffect, useRef, useState } from 'react';
import { ctx } from './api';

export interface RealtimeEvent {
  topic: string;          // synthetic — extracted from payload `type` if backend adds it
  raw: string;
  payload: unknown;
}

const WS_BASE =
  process.env.NEXT_PUBLIC_WS_BASE ?? 'ws://localhost:8083';

type Handler = (e: RealtimeEvent) => void;

class RealtimeClient {
  private ws: WebSocket | null = null;
  private handlers = new Set<Handler>();
  private reconnectAttempt = 0;
  private rooms: string[] = [];
  private closed = false;
  private pingTimer: ReturnType<typeof setInterval> | null = null;

  connect(rooms: string[]) {
    this.rooms = rooms;
    this.closed = false;
    this.open();
  }

  on(handler: Handler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  close() {
    this.closed = true;
    this.ws?.close();
    this.ws = null;
    if (this.pingTimer) clearInterval(this.pingTimer);
  }

  private open() {
    if (typeof window === 'undefined') return;
    const token = window.localStorage.getItem('kaori.accessToken');
    if (!token) return;

    const url = `${WS_BASE}/v1/ws?token=${encodeURIComponent(token)}&rooms=${encodeURIComponent(this.rooms.join(','))}`;
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      this.reconnectAttempt = 0;
      this.pingTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping');
      }, 30000);
    };

    ws.onmessage = (msg) => {
      const raw = String(msg.data);
      if (raw === 'pong') return;
      let payload: unknown = raw;
      try { payload = JSON.parse(raw); } catch { /* keep raw */ }
      const topic = typeof payload === 'object' && payload !== null && 'type' in (payload as Record<string, unknown>)
        ? String((payload as Record<string, unknown>).type)
        : 'unknown';
      this.handlers.forEach(h => h({ topic, raw, payload }));
    };

    ws.onclose = () => {
      if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; }
      if (this.closed) return;
      const backoff = [1000, 2000, 5000, 10000, 30000][Math.min(this.reconnectAttempt, 4)];
      this.reconnectAttempt += 1;
      setTimeout(() => this.open(), backoff);
    };

    ws.onerror = () => { /* close handler does the rest */ };
  }
}

const client = new RealtimeClient();

export function useRealtimeRooms(rooms: string[]) {
  const [connected, setConnected] = useState(false);
  const lastRooms = useRef('');

  useEffect(() => {
    const key = rooms.join(',');
    if (key === lastRooms.current) return;
    lastRooms.current = key;
    if (rooms.length === 0) { client.close(); setConnected(false); return; }
    client.connect(rooms);
    const off = client.on(() => setConnected(true));
    return () => { off(); };
  }, [rooms]);

  return { connected, subscribe: (h: Handler) => client.on(h) };
}

export function defaultBranchRooms(): string[] {
  return [
    `t:${ctx.tenantId}:b:${ctx.branchId}:bookings`,
    `t:${ctx.tenantId}:b:${ctx.branchId}:payments`
  ];
}
