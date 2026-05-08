#!/usr/bin/env bash
# Create the multiple databases listed in $POSTGRES_MULTIPLE_DATABASES.
# Used by the official postgres image entrypoint mechanism.
set -euo pipefail

if [ -z "${POSTGRES_MULTIPLE_DATABASES:-}" ]; then
    echo "POSTGRES_MULTIPLE_DATABASES is empty, skipping"
    exit 0
fi

for db in $(echo "$POSTGRES_MULTIPLE_DATABASES" | tr ',' ' '); do
    echo "Creating database '$db'"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
        CREATE DATABASE "$db";
        GRANT ALL PRIVILEGES ON DATABASE "$db" TO "$POSTGRES_USER";
EOSQL
done
