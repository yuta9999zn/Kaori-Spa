FROM python:3.12-slim AS build
WORKDIR /app
RUN pip install --no-cache-dir poetry==1.8.3
COPY pyproject.toml poetry.lock* ./
RUN poetry config virtualenvs.in-project true && \
    poetry install --only main --no-root --no-interaction
COPY src ./src
RUN poetry install --only main --no-interaction

FROM python:3.12-slim
WORKDIR /app
RUN useradd --create-home --shell /bin/bash kaori
COPY --from=build --chown=kaori /app/.venv /app/.venv
COPY --from=build --chown=kaori /app/src /app/src
ENV PATH="/app/.venv/bin:$PATH" PYTHONPATH="/app/src"
USER kaori
EXPOSE 8090
CMD ["uvicorn", "kaori_ai.main:app", "--host", "0.0.0.0", "--port", "8090"]
