# Postgres 16 + pgvector. The base image already has the vector extension
# installed; init.sql enables it on first DB creation.
FROM pgvector/pgvector:pg16
COPY init.sql /docker-entrypoint-initdb.d/01-init.sql
