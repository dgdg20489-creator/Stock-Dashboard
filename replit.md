# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Project: 원광증권 모의투자 대시보드

Korean stock mock-trading dashboard (원광증권) with real 2026 market data.

**Features:**
- Difficulty selection (초보/중수/고수) with 1000만/500만/100만 KRW seed money
- **296 Korean stocks from Naver Finance** — KOSPI top 200 + KOSDAQ top 100 (dynamically loaded at startup)
- **Real 2026 Naver Finance prices** — fetched from `m.stock.naver.com/api/stock/{ticker}/basic` every 30s
- **Real Yahoo Finance indices** — KOSPI, KOSDAQ, USD/KRW, S&P500, NASDAQ
- **241 days of real OHLCV history** per stock from pykrx, served via `/stocks/:ticker/history`
- **Python KRX Data Fetcher** (`python/krx_fetcher.py`) — dynamic stock list, real prices every 30s, indices every 60s; hourly stock list refresh
- **1-second UI polling** — Home.tsx and StockDetail.tsx refresh every 1 second for live price updates
- **KST timezone fix** — News timestamps from Naver stored with correct Korea Standard Time (UTC+9)
- **Wonkwang University phoenix logo** (`/phoenix-logo.svg`) — SVG in navbar and difficulty screen
- **StockChart zoom/pan** — mouse wheel to zoom, drag to pan across historical bars
- **30-min time axis** — shows 09:00, 09:30, 10:00... labels for intraday candle charts (default 30m TF)
- Buy/sell trading with balance checks; portfolio P&L vs real market prices
- Ranked leaderboard (all / by difficulty)
- Promotion/demotion system (초보→중수 at +20%, 중수→고수 at +50%, demote at -20%)
- 3D avatar wardrobe (Three.js), 5-tab navigation
- Stock search (name/ticker/sector/market), watchlist, daily missions, candle chart with indicators
- Korean color convention: red=up (상승), blue=down (하락)

**Artifacts:**
- `artifacts/toss-stocks` — React + Vite frontend (`@workspace/toss-stocks`) at `/`
- `artifacts/api-server` — Express 5 API server (`@workspace/api-server`) at port 8080
- `python/krx_fetcher.py` — Background Python data service

**API Routes (all under `/api`):**
- `GET /stocks` — all stocks from DB (up to 296), ordered by market cap
- `GET /stocks/search?q=` — search by name/ticker/sector/market in DB
- `GET /stocks/:ticker` — stock detail (from DB, STOCKS_DATA fallback)
- `GET /stocks/:ticker/history?period=1d|1w|1m|3m|1y` — real pykrx OHLCV history
- `GET /stocks/:ticker/news` — related news
- `GET /market/summary` — real Yahoo Finance index values
- `POST /users` — create user
- `GET /users/:id` — get user
- `GET /users/:id/portfolio` — portfolio with P&L vs real market prices
- `GET /users/:id/trades` — trade history
- `POST /trades` — execute buy/sell
- `GET /rankings?difficulty=all|beginner|intermediate|expert` — leaderboard

**DB Tables:** `users`, `holdings`, `trades`, `stocks_realtime` (21 cols incl. sector, high52w, low52w, per, pbr, eps, dividend_yield, open_price, high_price, low_price, market, logo_url), `stocks_history`, `market_indices`, `market_news`

**Real Data Notes:**
- Naver Finance dynamic stock list: KOSPI top 200 + KOSDAQ top 100 (fetched at startup, refreshed hourly)
- Naver Finance API: `m.stock.naver.com/api/stock/{ticker}/basic` → closePrice, compareToPreviousClosePrice, fluctuationsRatio
- News timestamps are KST (Korea Standard Time, UTC+9) — stored as timezone-aware datetimes
- Stock prices simulate realistic intraday movement between Naver price fetches
- History uses actual trading days (241 days from 2024-03-24 to 2025-03-24)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── toss-stocks/        # React + Vite frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
