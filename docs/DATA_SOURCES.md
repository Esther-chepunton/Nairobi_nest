# Kijiji Data Sources

Kijiji is a discovery platform, not a booking service. All place data is aggregated from publicly available sources with attribution. We prefer official APIs over web scraping and respect robots.txt and Terms of Service.

## Active Sources (v1)

| Source | Method | Legal basis | Reliability | Refresh cadence |
|--------|--------|-------------|-------------|-----------------|
| OpenStreetMap | Overpass API | ODbL — attribution required | 0.90 | Daily |
| Wikipedia | MediaWiki REST API | CC BY-SA — attribution required | 0.85 | Daily |
| RSS feeds | Public feed URLs | Public syndication; link back to publisher | 0.80 | Every 6 hours |
| Bootstrap seed | One-time DB migration | Internal curated starter catalog | 0.95 | N/A (legacy migration only) |

## Deferred Sources (v2+)

| Source | Status | Notes |
|--------|--------|-------|
| YouTube Data API | Configurable (`youtube.enabled: false`) | Metadata and embed URLs only per YouTube ToS |
| Official tourism HTML | Allowlist only | robots.txt enforced; domain allowlist in `config/sources.yaml` |
| Instagram / TikTok | Not implemented | Only permitted via official oEmbed when embedding is allowed |

## Sources We Do Not Scrape

- Google Maps (ToS prohibits scraping; we generate Maps links from coordinates only)
- Hotel/booking OTAs (out of scope for experience discovery)
- Any site that disallows our bot in robots.txt
- Private or login-gated content

## Attribution Policy

Every canonical place stores one or more rows in `place_sources` with:

- `source_name` — adapter identifier
- `source_url` — link to upstream record
- `attribution_text` — human-readable credit
- `fetched_at` — last successful ingest timestamp

The React frontend displays source attribution on place detail pages via `SourceAttribution`.

## Image Policy

- Store image URLs and license metadata only (no binary storage on Render ephemeral disk)
- Prefer Wikimedia Commons and Wikipedia thumbnails (known licenses)
- Max 10 images per place; deduplicated by URL
- DMCA: contact admin to request removal of specific media URLs

## Data Freshness

| Tier | Categories | Max staleness before re-fetch |
|------|------------|-------------------------------|
| Hot | events | 7 days |
| Warm | restaurants, cafés | 30 days |
| Cold | trails, museums, parks | 90 days |

Stale places are re-enqueued by the `refresh-stale` cron job.

## User Disclaimer

Kijiji helps users discover experiences. We do not process bookings, guarantee availability, or verify opening hours in real time. Users should confirm details on official venue websites before visiting.
