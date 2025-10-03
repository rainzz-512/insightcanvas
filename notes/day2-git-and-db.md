# Day 2 — Git, GitHub, and Database Planning

## Git commands I used
- `git init`, `git add -A`, `git commit -m "..."`
- `git remote set-url origin git@github.com:rainzz-512/insightcanvas.git`
- `git push -u origin main`
- SSH setup: `ssh-keygen -t ed25519 -C "me@email"`, `ssh-add --apple-use-keychain ~/.ssh/id_ed25519`
- Test: `ssh -T git@github.com` → success message

## README checklist
- Project purpose + stack
- How to run locally
- Roadmap with checkboxes
- Planned DB schema
- License

## DB schema plan (first pass)
- User, Dataset, Chart, Dashboard, DashboardItem
- Keep `schemaJson` for inferred columns/types
- Store CSV raw file via `storageKey` (local dev → S3 later)
- Aggregations served via API (Postgres first; maybe ClickHouse later)

## Questions to self
- Where to store rows (Postgres table vs. external columnar store)?
- How to version charts/dashboards later?
