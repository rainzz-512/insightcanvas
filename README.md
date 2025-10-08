# 🧠 InsightCanvas

**Upload CSV → Build Charts → Share Dashboards**

**InsightCanvas** is a full-stack web app that lets you upload CSV datasets, visualize them as charts, and organize those charts into shareable dashboards. It’s designed like a real MVP: modern stack, clean UX, and production-ready patterns.

---

## 🚀 Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript  
- **Styling:** Tailwind CSS  
- **ORM:** Prisma  
- **Database:** PostgreSQL (Neon / Supabase friendly)  
- **Auth:** NextAuth.js (GitHub OAuth)  
- **Charts:** Recharts  
- **Deploy:** Vercel

---

## ✨ Features

- Upload CSVs with **server-side** parsing + schema inference  
- Dataset detail: detected columns + sample rows preview  
- Chart builder: **Bar / Line / Pie** with interactive field selection  
- Chart CRUD: create, rename, delete; each linked to its dataset  
- Dashboards: add charts, reorder items, toggle **public/private**  
- Authz: users can only see & modify their own assets  
- JSON configs for flexible, evolvable visualization types

---

## 🗂️ Database Schema (high-level)

| Table            | Key columns                                           | Purpose                                  |
|------------------|--------------------------------------------------------|------------------------------------------|
| **User**         | `id`, `name`, `email`, `createdAt`                    | Authenticated users                      |
| **Dataset**      | `id`, `ownerId`, `name`, `schemaJson`, `rowCount`, `sampleRowsJson`, `createdAt` | Uploaded CSV metadata            |
| **Chart**        | `id`, `datasetId`, `name`, `type`, `configJson`, `createdAt` | Chart definition + linkage       |
| **Dashboard**    | `id`, `ownerId`, `name`, `isPublic`, `createdAt`      | Container of charts                      |
| **DashboardItem**| `id`, `dashboardId`, `chartId`, `layoutJson`          | Order/position for charts on dashboard   |

> JSON fields (`schemaJson`, `configJson`, `layoutJson`) keep the MVP flexible while iterating.

---

## 🧭 Roadmap & Status

**Completed**
- Project scaffold (Next.js + TS + Tailwind), navbar layout  
- Prisma schema + migrations; Postgres ready  
- CSV upload, schema inference, sample rows  
- Chart builder + renderer (Recharts)  
- Dashboard creation, add/remove charts, reorder items  
- NextAuth GitHub login; per-user ownership  
- Public dashboards (read-only) toggle  
- Revalidate UI after mutations; error states & polish

**Nice-to-have (future)**
- Server aggregations (group-by sum/avg/count)  
- Resizable/drag grid (eg. react-grid-layout)  
- Larger dataset handling + pagination/virtualization  
- Filters & grouping in the chart UI  
- E2E tests; one-click Vercel + managed Postgres recipe

---

## 🛠️ Local Development

### 1) Clone & Install

    git clone git@github.com:rainzz-512/insightcanvas.git
    cd insightcanvas
    npm install

### 2) Configure Environment

Create a `.env` file:

    DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
    NEXTAUTH_SECRET="your_random_secret"
    GITHUB_ID="your_github_oauth_id"
    GITHUB_SECRET="your_github_oauth_secret"

Also include a safe `.env.example` (checked-in):

    DATABASE_URL="postgresql://username:password@host/dbname?sslmode=require"
    NEXTAUTH_SECRET=""
    GITHUB_ID=""
    GITHUB_SECRET=""

### 3) Run Migrations

    npx prisma migrate dev --name init
    npx prisma studio   # optional: inspect your DB

### 4) Start Dev Server

    npm run dev

Then open: http://localhost:3000

---

## 📁 Project Structure (abridged)

    insightcanvas/
      app/
        api/…                    # datasets, charts, dashboards endpoints
        datasets/…               # list + detail
        charts/…                 # list + detail + edit
        dashboard/…              # view + edit layout
        layout.tsx               # global layout (navbar, theme)
        page.tsx                 # homepage
      components/
        Button.tsx
        ChartRenderer.tsx
        DashboardCard.tsx
      prisma/
        schema.prisma
      public/
      .env.example
      package.json
      README.md
      tsconfig.json

---

## 🌐 Deploy

Recommended:
- **Vercel** for Next.js hosting  
- **Neon / Supabase PostgreSQL** for the database

Set the same environment variables in Vercel → Project Settings → Environment Variables.

Deploy from main:

    git add .
    git commit -m "Finalize InsightCanvas MVP: datasets, charts, dashboards"
    git push origin main

Vercel will build & deploy automatically.

---

## 🧩 Example Flow

1. Sign in with GitHub  
2. Upload a CSV (e.g. `sales_by_region.csv`)  
3. Verify detected columns + sample rows  
4. Create a chart (choose type + fields) and save  
5. Add the chart to a dashboard and reorder  
6. Toggle dashboard **public** to share a read-only link

---

## 📜 License

MIT License © 2025 Rain Zhao
