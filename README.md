# InsightCanvas

**Upload CSV → Build Charts → Share Dashboards**

Project built as a real-world MVP to showcase full-stack skills (Next.js, TypeScript, Postgres, Prisma).

## 🚀 Tech Stack
- Next.js (App Router, Server/Client Components)
- TypeScript
- TailwindCSS
- Prisma (ORM)
- PostgreSQL (Neon/Supabase in prod)

## 🧭 Roadmap (MVP)
- [x] Day 1: Scaffold, Navbar, Button component
- [x] Day 2: GitHub, README, DB schema planning
- [ ] Day 3: Postgres + Prisma setup
- [ ] Day 4: Auth (NextAuth GitHub OAuth)
- [ ] Day 6–12: CSV upload → schema inference → chart builder → mocked data endpoint
- [ ] Day 13–14: Dashboard + public share link
- [ ] Day 17: Real aggregations
- [ ] Day 18–21: Deploy, polish, docs

## 📊 Planned Database Schema

**User**
- `id` (cuid), `name`, `email`

**Dataset**
- `id`, `teamId?`, `ownerId`, `name`, `storageKey`, `schemaJson` (columns/types), `rowsCount`, `createdAt`

**Chart**
- `id`, `teamId?`, `ownerId`, `datasetId`, `name`, `configJson` (x/y/agg/type/filters), `createdAt`

**Dashboard**
- `id`, `teamId?`, `ownerId`, `name`, `isPublic`, `createdAt`

**DashboardItem**
- `id`, `dashboardId`, `chartId`, `layoutJson`

## 🛠️ Run locally

```bash
git clone https://github.com/YOUR-USERNAME/insightcanvas.git
cd insightcanvas
npm install
npm run dev
# open http://localhost:3000
