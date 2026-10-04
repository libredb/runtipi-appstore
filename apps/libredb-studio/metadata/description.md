# LibreDB Studio

Self-hosted browser based SQL IDE for 46 database engines.

LibreDB Studio is an open source database editor under the MIT licence that you
run on your own server and use from a browser. There is no desktop client: the
server runs in a container and the interface is the browser, so the tool sits
inside the same network as your databases and a database never has to be exposed
to the internet.

## Engines

Eighteen built in drivers: PostgreSQL, MySQL, Oracle, SQL Server, SQLite, libSQL,
DuckDB, MongoDB, Redis, Couchbase, ClickHouse, Apache Druid, Elasticsearch,
OpenSearch, Apache Trino, Apache Cassandra, Prometheus and Apache Kafka.

Beyond those, twenty eight more engines have no driver of their own but speak the
wire protocol of one of ours, which is how eighteen drivers reach forty six named
engines. Among them: TiDB, MariaDB, Percona Server, Vitess, OceanBase,
SingleStore, StarRocks, Apache Doris, Databend, CockroachDB, TimescaleDB, Citus,
YugabyteDB, Materialize, RisingWave, OrioleDB, AlloyDB Omni, ParadeDB,
Apache Cloudberry, Valkey, DragonflyDB, KeyDB, Garnet, FerretDB, ScyllaDB,
VictoriaMetrics and Redpanda.

## What is measured, not claimed

A client does not only open a connection. It reads the table list, row counts and
sizes, indexes and foreign keys, the execution plan, sessions and statistics, and
all of that comes from each engine's own system catalogue rather than from the
protocol. The protocol can be identical while the catalogue is completely
different, so the connection succeeds and the screen opens empty.

Every one of the twenty eight borrowed engines was therefore run through the same
screens before any number was published. Of the twenty eight, eighteen answered on
every surface, nine answered partially, and on one only the query editor worked.
The per engine result, including which screen fails and why, is published with the
product rather than summarised away.

## Read only by design

Three of the eighteen are read only because their own SQL is: Apache Druid,
Elasticsearch and OpenSearch have no UPDATE and no CREATE TABLE in the grammar at
all, so those controls are reported as unsupported instead of failing when used.
Prometheus speaks PromQL over its HTTP API and Studio calls none of the write or
admin endpoints. Apache Kafka is read only by construction: Studio never produces
a message, commits an offset, joins a consumer group or creates a topic.

## Features

- SQL editor with completion, history and saved queries
- Object browser for schemas, tables, indexes, keys and views
- ER diagrams and schema comparison between two databases
- EXPLAIN plan trees with cost and row estimates
- Monitoring: sessions, slow queries and server statistics where the engine
  publishes them
- Query audit log of who ran what and when
- OIDC single sign on and role based access control
- An optional read only agent that drafts SQL, reads the results and cites them,
  using Gemini, OpenAI or a local Ollama model so data stays on your network

## First login

Runtipi asks for an admin password when you install the app, and passes it to the
container as ADMIN_PASSWORD. Pick one you will remember: it is the password for the
only account that exists at that point.

Sign in with:

- Email: `admin@libredb.org`
- Password: the admin password you set during install

Then add a database connection. Point it at a database that is already reachable
from your server, for example another Runtipi app on the same network. The database
itself never needs to be exposed to the internet.

Your connections, saved queries and audit log live in the app's data folder, so they
survive restarts and updates.

## Links

<https://libredb.org>

<https://github.com/libredb/libredb-studio>

<https://hub.docker.com/r/libredb/libredb-studio>
