# LibreDB Studio app store for Runtipi

A custom [Runtipi](https://runtipi.io) app store with one app in it:
[LibreDB Studio](https://github.com/libredb/libredb-studio), an open source
(MIT) database editor that runs on your own server and is used from a browser.

## Add it to Runtipi

1. Open your Runtipi dashboard and go to Settings.
2. Click App Stores, then Add App Store.
3. Paste this repository URL and give the store a name:

```
https://github.com/libredb/runtipi-appstore
```

LibreDB Studio then appears in your app list and installs like any other app.
Requires Runtipi v4.5.0 or above.

## What is in the app

Eighteen built in drivers reach forty six named engines. PostgreSQL, MySQL,
Oracle, SQL Server, SQLite, libSQL, DuckDB, MongoDB, Redis, Couchbase,
ClickHouse, Apache Druid, Elasticsearch, OpenSearch, Apache Trino, Apache
Cassandra, Prometheus and Apache Kafka have their own driver. Twenty eight more
engines speak one of those wire protocols, among them TiDB, MariaDB,
CockroachDB, TimescaleDB, Citus, Valkey, ScyllaDB and Redpanda.

Full details, including which screen works on which engine, are in
[apps/libredb-studio/metadata/description.md](apps/libredb-studio/metadata/description.md).

## Install details

| Item | Value |
|---|---|
| Image | `libredb/libredb-studio:0.17.0`, amd64 and arm64 |
| Port inside the container | 3000 |
| Default port on the host | 8547 |
| Data folder | `/app/data`, mounted from the app's data directory |
| Admin email | `admin@libredb.org` |
| Admin password | you set it during install, passed in as `ADMIN_PASSWORD` |

## Why both compose formats are committed

Each app ships `docker-compose.yml` and `docker-compose.json`.

Runtipi reads `docker-compose.yml` from an app store only from v4.7.0 onwards. On
v4.5.0 through v4.6.2 the app store reader looks for `docker-compose.json` and
nothing else, so a store that ships the yaml alone cannot be installed there. Both
files are therefore kept, and the test suite checks that they pin the same image so
the two cannot drift apart.

## Tests

```
bun install
bun test
```

The suite checks that every app has the required files, that `config.json` is
valid, that the `id` matches the folder name, that both compose files are valid
and agree, and that no image is pinned to a floating `latest` tag.

## Maintaining this store

When a new LibreDB Studio release comes out, bump the version in three places:

- `apps/libredb-studio/config.json`, the `version` field
- `apps/libredb-studio/docker-compose.yml`, the image tag
- `apps/libredb-studio/docker-compose.json`, the image tag

Then run the tests and open a pull request. Avoid the `latest` tag: the suite
rejects it, because an app that silently changes underneath a user is worse than
an app that is a release behind.
