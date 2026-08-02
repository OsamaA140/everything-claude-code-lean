---
name: clickhouse-io
description: ClickHouse database patterns, query optimization, analytics, and data engineering best practices for high-performance analytical workloads.
---

# ClickHouse Analytics Patterns

Column-oriented OLAP database for fast analytics on large datasets (compression, parallel/distributed queries, real-time aggregation).

## Table Engines
- **MergeTree** (default): `PARTITION BY toYYYYMM(date) ORDER BY (date, id)` — the standard choice for time-series/event data.
- **ReplacingMergeTree**: same as MergeTree but deduplicates rows sharing the `ORDER BY` key on background merge — use when a source may emit duplicates.
- **AggregatingMergeTree**: stores partial aggregate states (`sumState`, `avgState`) for cheap incremental rollups via materialized views.

## Query Optimization
- Filter on columns in the `ORDER BY`/primary key first — ClickHouse skips whole granules that can't match.
- Prefer `GROUP BY` with pre-aggregated/materialized data over raw scans for dashboards.
- Window functions (`ROW_NUMBER() OVER (...)`) work but are heavier than a plain aggregation — use only when ranking/running totals are actually needed.

## Data Insertion
- **Bulk insert** in large batches (thousands of rows) — ClickHouse is optimized for infrequent large writes, not many small ones.
- For streaming, buffer client-side and flush on size/time threshold rather than inserting row-by-row.

## Materialized Views
Use a materialized view + `AggregatingMergeTree` target table to maintain real-time rollups (e.g., hourly counts) instead of re-aggregating raw events on every query.

## Common Analytics Queries
Time-series bucketing (`toStartOfHour/Day`), funnel analysis (`windowFunnel()`), cohort analysis (join by first-seen date) are all native/idiomatic in ClickHouse SQL — prefer built-in functions over reimplementing in application code.

## Best Practices
- **Partition** by date range matching query patterns (usually month); avoid too many small partitions.
- **Order key**: put the lowest-cardinality/most-filtered columns first.
- Use the narrowest data type that fits (`UInt32` not `String` for IDs); avoid `Nullable` columns where avoidable (storage/perf cost).
- Avoid: frequent single-row inserts/updates/deletes (use `ALTER TABLE ... UPDATE` sparingly — it's async and heavy), `SELECT *` on wide tables.
- Monitor `system.query_log` for slow queries and `system.parts` for partition/part bloat.
