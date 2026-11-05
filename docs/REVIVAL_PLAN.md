# Kijiji / Nairobi Nest — Revival Plan

## Status (2026-11-05)

**Done:**
- Search went from 171 s to under 0.2 s by serving from the DB. Live fetch is opt-in with an 8 s budget, and search results now follow the query text.
- `.env` loads before settings are read.
- 4xx responses are no longer retried. `OVERPASS_URL` is configurable.
- The M-Pesa flow works end to end: DB-backed callback, status endpoint with STK-query fallback, amount taken from the booking, owner checks, a polling checkout UI, and bookings listed on Profile.
- `vercel.json`, a 404 page, and lazy routes (main bundle went from 620 KB to 425 KB). Lint is clean.
- Token errors return 401 and the frontend redirects to sign in. JWTs last 7 days. Auth is rate-limited and validated.
- Wikipedia/OSM junk is filtered out (cities, airports, hotels), plus a new `cleanup_catalog` task.
- Dead files removed. Junk untracked in the backend repo. venv recreated.
- Free-tier `render.yaml`, GitHub Actions for daily ingest and CI, and 33 backend tests.

**Still open:**
- Decide monorepo vs two repos. The backend still has its own `.git`.
- Add your Daraja sandbox keys to `nairobi-nest-backend/.env`. It currently matches `.env.example`.
- Create the Neon project, Render service, and Vercel env var, then deploy.
- README screenshots and demo link once deployed.

---

Audit date: 2026-11-05. Based on reading the code, running `npm run build`, `npm run lint`,
the backend tests, and a smoke test of every main API route against a fresh SQLite DB.

## Current state at a glance

| Area | Status |
|------|--------|
| Frontend build (`npm run build`) | ✅ Builds, but one 620 KB JS bundle |
| Frontend lint (`npm run lint`) | ❌ 16 errors / 6 warnings (mostly config noise) |
| Backend boots | ✅ 40 routes, auto-seeds places + guides |
| Places, guides, weather, auth, favourites, itineraries, guide booking | ✅ Work (200/201) |
| `/api/recommendations` | ⚠️ 12 s per request |
| `/api/search` | ❌ **171 s** per request (the main jam) |
| M-Pesa payment | ❌ "credentials not configured" even though `.env` has them |
| Backend tests | ⚠️ 4 pass, but `test_models.py` and `test_routes.py` are empty |
| Backend `venv/` | ❌ Broken (no `python.exe` in `venv/Scripts`) |

---

## 1. What's causing the jam (fix first)

1. **Live OpenStreetMap calls run inside the search request.**
   `app/services/live_discovery.py` calls Overpass, Wikipedia and RSS while the user waits.
   Overpass currently answers `406 Not Acceptable`, and `ingestion/http_client.py` retries
   every error 3× with 30 s timeouts plus back-off sleeps → ~3 minutes per search.
   - Don't retry 4xx responses (only 429/5xx). Overpass maintainers ban clients that keep retrying after 406/429.
   - Send a real User-Agent with a reachable contact (not `admin@kijiji.local`), plus `Referer` and `Accept` headers.
   - Give the live path a hard budget (~5–8 s total). If it runs out, return results from the DB/cache.
   - Better for a portfolio: **serve search from the database only** and refresh the data with a scheduled job.
2. **`.env` is loaded too late.** `config.py`, `mpesa_payment.py` and `weather.py` read `os.environ`
   when they're imported, but `load_dotenv()` runs *after* those imports in `app/__init__.py`.
   So with `python run.py` or gunicorn, `SECRET_KEY`, `DATABASE_URL`, `MPESA_*` and `OPENWEATHER_API_KEY`
   from `.env` are ignored. (I confirmed this: M-Pesa reported missing credentials.) Fix: call `load_dotenv()`
   at the top of `run.py`/`config.py` before anything else is imported, and read keys from `current_app.config`.
3. **Broken virtualenv.** Delete `nairobi-nest-backend/venv` and recreate it (`python -m venv venv`, then `pip install -r requirements.txt`).
4. **Nested git repo.** `nairobi-nest-backend/` has its own `.git` (remote `Esther-chepunton/nairobi-nest-backend`)
   and is untracked in the main repo. If you `git add` it, git records an empty pointer and the backend code
   never reaches GitHub, while `render.yaml` expects `rootDir: nairobi-nest-backend` in the same repo.
   Pick one: **monorepo** (recommended — remove the inner `.git` after pushing its last state, then commit it here)
   or two separate repos (then move `render.yaml` into the backend repo).

## 2. What needs fixing

### Backend
- **M-Pesa flow is unfinished:**
  - `payment_status` is an in-memory dict. It's lost on restart or with more than one worker, so the callback
    never confirms the booking. Look up `GuideBooking` by `mpesa_checkout_id` in the callback instead.
  - There's no endpoint to check payment status and the frontend never polls → add `GET /api/guide-bookings/<id>`
    (or `/status`) and poll it from `GuideCheckout.jsx` for ~60 s after the STK push.
  - `MPESA_CALLBACK_URL` defaults to localhost, which Safaricom can't reach. Use the deployed Render URL, or an ngrok tunnel locally.
  - Don't return raw exception text to the client.
- **Migrations:** `migrations/versions/001_initial_ingestion_schema.py` is an empty placeholder, so
  `flask db upgrade` in `render.yaml` does nothing. The schema actually comes from `db.create_all()` plus the
  hand-written `migrate_sqlite_schema`. Either generate a real initial migration (`flask db migrate`) or drop
  `flask db upgrade` from the build command.
- **Security basics:** no default `SECRET_KEY` fallback in production (fail loudly instead); rate-limit
  `/api/auth/login` and `/signup` (Flask-Limiter is already installed but unused); remove the demo
  `/api/auth/protected` route; validate email/password length on signup.
- **Tests:** fill `tests/test_routes.py` (auth, favourites, booking, search with live discovery mocked).

### Frontend
- **No SPA rewrite for Vercel.** Refreshing `/places/12` will 404. Add `vercel.json`:
  `{"rewrites":[{"source":"/(.*)","destination":"/"}]}`.
- **Lint:** add `nairobi-nest-backend` to `ignores` in `eslint.config.js` (it's linting `venv`).
  The `'motion' is defined but never used` errors are false positives (ESLint can't see `<motion.div>`).
  Add `eslint-plugin-react` with `react/jsx-uses-vars`. Fix the real one in `ErrorBoundary.jsx` and the `useEffect` dependency warnings.
- **Bundle size:** lazy-load pages with `React.lazy` + `Suspense` (Leaflet and framer-motion are heavy).
- **Cold-start UX:** the free backend sleeps. Show "Waking up the server…" instead of an error when the first request is slow.
- **Payment UI:** after "M-Pesa prompt sent", show pending → confirmed/failed using the new status endpoint.
- `PrivateRoute` only checks that a token exists. Handle 401s by clearing the token and redirecting to `/auth`.
- `vite.config.js` proxies `/api`, but `api.js` always uses an absolute `VITE_API_URL`, so the proxy is never used. Use one or the other.

## 3. What to remove

| Item | Why |
|------|-----|
| `public/images/*` (22 files incl. `Sample Project Report(2).pdf`) | Nothing in `src/` references them (leftovers from the old hotel app). The PDF shouldn't be public. |
| `src/components/ReceiptDetails.jsx` | Empty file |
| `nairobi-nest-backend/app/ai_recommendations.py` + `app/hotel.json` | Old hotel recommender, never registered |
| `app/services/seed.py` | Deprecated shim |
| `migrations/versions/env.py` | Empty, misplaced |
| `__pycache__/`, `instance/users.db`, `.env` in the backend repo | Tracked in git. Untrack them and add them to `.gitignore` (`.env` only had placeholders, so nothing leaked). |
| `dist/` | Build output, already git-ignored. Safe to delete locally. |
| `/api/auth/protected` | Demo route |
| Naming drift | Pick one name: "Kijiji" (UI) vs "Nairobi Nest" (repo/Vercel URL) vs `"name": "frontend"` in `package.json` |

## 4. What to add

- `vercel.json` (SPA rewrites)
- Payment status endpoint + polling UI
- `.github/workflows/ingest.yml`: a scheduled GitHub Action that runs `python -m jobs.worker run --task ingest --source openstreetmap` (and `reindex`) against the production DB. Replaces the 6 paid Render cron jobs.
- Route tests + a CI workflow that runs `npm run lint && npm run build` and `pytest`
- README: screenshots, live demo link, architecture diagram, M-Pesa sandbox test number (`254708374149`)
- Optional: a demo account (seeded) so recruiters can try favourites/itineraries without signing up

## 5. Free infrastructure (best picks)

| Need | Pick | Free tier notes | Why |
|------|------|-----------------|-----|
| Frontend hosting | **Vercel Hobby** | Free for personal projects | Already targeted (`nairobi-nest.vercel.app`) |
| Backend hosting | **Render free web service** | Sleeps after ~15 min idle, ~30–60 s cold start, 750 instance-hours/month | `render.yaml` already exists. Just switch plans. |
| Database | **Neon Postgres (free)** | 0.5 GB/project, 100 CU-hours/month, scales to zero, **no expiry** | Render's free Postgres expires after ~30 days. Supabase free pauses after a week of inactivity. Neon is the best fit for a demo that sits idle. |
| Scheduled ingestion | **GitHub Actions cron** | Free on public repos | Render cron jobs aren't free |
| Payments | **Safaricom Daraja sandbox** (keep) | Free, test credentials + test phone numbers | M-Pesa STK Push is a strong, Kenya-specific portfolio talking point. Alternative: Paystack test mode (cards + M-Pesa). Stripe can't do M-Pesa. |
| Maps | Leaflet + OSM tiles (keep) | Free with attribution | Already in place |
| Weather | OpenWeather free key | 1,000 calls/day | Optional. The app falls back gracefully. |
| Images | Wikimedia URLs (keep) | — | Only add Cloudinary free if you add user uploads |
| Error monitoring (optional) | Sentry free | 5k errors/month | Nice extra, not required |

**Changes to `render.yaml`:** set `plan: free` on the web service, delete the `databases:` block and all
`type: cron` services, set `DATABASE_URL` manually to the Neon connection string (keep `?sslmode=require`), set
`FLASK_ENV=production`, `MPESA_*` and `MPESA_CALLBACK_URL=https://<render-app>.onrender.com/api/mpesa-callback`.
Also bump `PYTHON_VERSION` to 3.12 or 3.13 (you develop on 3.13).

## 6. Not needed for a portfolio project

- **Six cron jobs + job queue table + worker loop.** One daily GitHub Action that ingests OSM and reindexes is enough. Drop `refresh_stale` and `prune_cache` scheduling.
- **RSS and YouTube ingestion** (`youtube.enabled: false` already). Keep OSM + Wikipedia.
- **Live per-request Overpass discovery.** Biggest source of slowness and fragility. Serve from the DB.
- **Anonymous identity cookies + "claim search session" on login.** Clever, but it adds cross-site cookie headaches (SameSite=None/Secure across Vercel ↔ Render). Keep it only if it already works in production.
- **Real (production) M-Pesa:** sandbox is the right scope.
- **Redis / caching layers, Flask-Limiter on every route:** rate-limit auth only.
- **Hand-written SQLite schema migrator** (`migrate_sqlite_schema`) once real Alembic migrations exist.

## 7. Suggested order of work

1. Monorepo decision + clean git (untrack junk, recreate venv)
2. Fix `.env` loading order
3. Make search DB-first with a strict live-discovery budget (removes the 3-minute hang)
4. `vercel.json`, lint config, lazy routes
5. M-Pesa: callback via DB lookup, status endpoint, polling UI
6. Remove dead files and assets
7. Neon + Render free + GitHub Actions ingest. Deploy.
8. Tests + CI + README polish with screenshots and demo link
