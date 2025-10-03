# InsightCanvas

**Upload CSV → Build Charts → Share Dashboards**

InsightCanvas is a full-stack application exploring real-world engineering concepts: file handling, schema inference, data visualization, authentication, and database-backed dashboards. The aim is to feel like a real startup MVP while showcasing a modern web stack.

---

## 🚀 Tech Stack
- **Frontend:** Next.js (App Router) + TypeScript  
- **Styling:** Tailwind CSS  
- **ORM:** Prisma  
- **Database:** PostgreSQL (Neon or Supabase for production)  

---

## 🧭 Roadmap & Progress

**Completed**
- ✅ Project scaffold: Next.js + TypeScript + Tailwind; basic pages and shared layout (navbar).  
- ✅ Git/GitHub setup: repository configured, SSH auth, professional README.  
- ✅ Database foundation: Prisma initialized, PostgreSQL provisioned (Neon/Supabase), schema defined, initial migration applied.  

**In Progress / Up Next**
- ⏳ Authentication with NextAuth (GitHub OAuth) and Prisma adapter (persist sessions/users).  
- ⏳ CSV upload API: parse on server, infer column types, store dataset meta.  
- ⏳ Chart builder UI: pick dataset, X/Y/aggregation/type; save chart configs.  
- ⏳ Dashboard view: render multiple charts; simple layout data.  
- ⏳ Public share links for read-only dashboards.  
- ⏳ Real aggregations in the API (group-by + sum/avg/count) against stored rows.  
- ⏳ Deployment (Vercel) + production Postgres + polish & docs.  

---

## 📊 Planned Database Schema (high level)

**User**  
- `id` (cuid), `name`, `email`, `createdAt`

**Dataset**  
- `id`, `ownerId`, `name`, `storageKey`, `schemaJson` (columns/types), `rowCount`, `createdAt`

**Chart**  
- `id`, `datasetId`, `name`, `type`, `configJson` (x/y/agg/filters), `createdAt`

**Dashboard**  
- `id`, `ownerId`, `name`, `isPublic`, `createdAt`

**DashboardItem**  
- `id`, `dashboardId`, `chartId`, `layoutJson`

> Note: `Json` fields (`schemaJson`, `configJson`, `layoutJson`) keep the MVP flexible while iterating.

---

## 🛠️ Local Development

### 1. Clone and install

# SSH (recommended if you set up keys)  
git clone git@github.com:rainzz-512/insightcanvas.git  

# or HTTPS  
# git clone https://github.com/rainzz-512/insightcanvas.git  

cd insightcanvas  
npm install  

---

### 2. Set environment variables

Create a `.env` file in the project root with:

DATABASE_URL="postgresql://<user>:<password>@<host>/<db>?sslmode=require"

👉 Never commit real secrets. Instead, commit a `.env.example` file like this:

# .env.example  
DATABASE_URL="postgresql://username:password@host/dbname?sslmode=require"

Developers copy it to `.env` and fill in their own credentials.

---

### 3. Run database migrations

npx prisma migrate dev --name init  

(Optional) Open the Prisma GUI to inspect your DB:  

npx prisma studio  

---

### 4. Start the dev server

npm run dev  
# open http://localhost:3000  

---

## 📂 Project Structure (abridged)

insightcanvas/  
  app/  
    layout.tsx          # global layout (navbar, theming)  
    page.tsx            # homepage  
    datasets/page.tsx   # /datasets  
    charts/page.tsx     # /charts  
    dashboard/page.tsx  # /dashboard  
  components/  
    Button.tsx  
  prisma/  
    schema.prisma  
  .env.example          # placeholder for environment variables  
  README.md  
  package.json  
  tsconfig.json  

---

## 📄 License
MIT
