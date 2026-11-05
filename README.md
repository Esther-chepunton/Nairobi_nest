# Kijiji

Discover experiences worth remembering: a discovery platform for Kenya. Tell it your mood,
how much time you have, your budget and who you're with, and it ranks places to go.
Save favourites, build day plans you can share, and book a local guide with **M-Pesa**.

**Stack:** React 19 + Vite + Tailwind · Flask + SQLAlchemy · Postgres (Neon) · OpenStreetMap & Wikipedia data · Safaricom Daraja (M-Pesa STK Push)

## Features

- **Intent search & recommendations.** Scores places on search text, distance, budget, time, mood, companions and your saved interests, and explains each match.
- **Favourites, visited places, "because you liked…"**
- **Day planner** with shareable public links
- **Guide booking + M-Pesa STK Push.** The phone gets a PIN prompt. The booking is confirmed by the Daraja callback, or by polling Daraja's STK query when the callback can't reach the server (e.g. localhost).
- **Data pipeline.** A daily GitHub Action ingests OpenStreetMap + Wikipedia, de-duplicates, filters out non-experiences (cities, airports, hotels) and rebuilds the search index. Every place shows its source attribution.

## Local development

### Backend (port 10000)

```bash
cd nairobi-nest-backend
python -m venv venv
venv\Scripts\activate        # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env       # macOS/Linux: cp .env.example .env
python run.py
```

On first start it creates the SQLite database and seeds curated places and guides.
Optional: pull real data with `python -m jobs.worker run --task ingest --source openstreetmap`
(set `OVERPASS_URL` in `.env` if the default Overpass server is slow from your network).

### Frontend (port 5173)

```bash
npm install
npm run dev
```

`.env.development` points the app at `http://localhost:10000`.

### M-Pesa sandbox

1. Create an app at [developer.safaricom.co.ke](https://developer.safaricom.co.ke) and copy its consumer key/secret.
2. Put them in `nairobi-nest-backend/.env` with `MPESA_SHORTCODE=174379` and the sandbox passkey from the Daraja simulator.
3. Book a guide and pay with the sandbox test number `0708374149`.

### Tests

```bash
cd nairobi-nest-backend && python -m pytest     # backend (network calls are blocked in tests)
npm run lint && npm run build                    # frontend
```

CI runs both on every push (`.github/workflows/ci.yml`).

## Deployment (all free tiers)

| Piece | Service |
|-------|---------|
| Frontend | Vercel (`vercel.json` handles client-side routes). Set `VITE_API_URL` to the Render URL. |
| API | Render free web service, via `render.yaml` |
| Database | Neon Postgres free. Paste the connection string as `DATABASE_URL` on Render. |
| Daily data refresh | GitHub Actions (`.github/workflows/ingest.yml`). Add `DATABASE_URL` as a repo secret. |
| Payments | Safaricom Daraja sandbox |

Free Render services sleep when idle, so the first request after a quiet spell takes ~30–60 s.
The app shows a "waking up the server" message meanwhile.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home: trending, hidden gems, map, moods |
| `/discover` | Intent search form |
| `/results` | Personalised recommendations |
| `/places/:id` | Place detail with sources |
| `/map` | Map explorer |
| `/favorites` | Saved places (sign-in) |
| `/itineraries` | Day planner (sign-in) |
| `/itinerary/:token` | Shared day plan (public) |
| `/guides`, `/guides/book` | Local guides, booking + M-Pesa (sign-in) |
| `/profile` | Preferences and guide bookings (sign-in) |

See [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) for data sources and attribution policy.
