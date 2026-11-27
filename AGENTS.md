# AGENTS.md

Notes for any AI agent or developer working in this repo (OpenFrame, deployed at openframes.vercel.app).

## Things the owner does NOT care about (accepted risks)

The owner knows about the following, has decided it's fine as it is, and does not want it "fixed" unless he asks. Don't refactor, rotate, lock down or rewrite any of this on your own initiative. I DON'T GIVE A SHIT, IT'S FINE LIKE THIS.

1. **Row Level Security is OFF** on `openfram_visitor_analytics` and `openfram_admin_access_ids`. Both tables are fully open to the `anon` role (`GRANT ALL ... TO anon, authenticated`). Anyone holding the public anon key can read, edit or delete every row.
2. **Admin passcodes are stored in plain text** in `openfram_admin_access_ids` (column `passcode`), and anyone with the anon key can read them.
3. **A default admin row is seeded** by `SUPABASE_SETUP_SQL` in `lib/supabase-config.ts`, and that login is visible in the public GitHub repo. It's already in the live database. Not deleting it.
4. **Everything runs on the anon key.** There is no service-role key and no server-only locked-down access. Not planned.
5. **The Supabase project URL is hardcoded** in `lib/supabase-config.ts` and committed to a public repo. That's intentional.

Everything above is a known, deliberate trade-off. If something breaks, it is not a reason to change the security setup.

## What this project is

- A Next.js (TypeScript, App Router) site with a public landing/pricing/guide side and a password-protected **Admin dashboard** that shows visitor analytics.
- Admin tabs: Overview, Day by Day, Visit Log. Buttons: Live Site, Refresh, Log Out. (The Supabase SQL & Sync tab and the Clear Events button were removed on 2026-11-27.)
- Hosted on Vercel, project name `openframes`, auto-deploys from the `main` branch of `teddyricch247-spec/Openframes`.
- Backend storage is a Supabase project (shared with other apps, hence the `openfram_` prefix on every table, bucket and file name).

## Repo layout (top level)

- `app/` routes and API handlers
- `components/` UI
- `hooks/` React hooks
- `lib/` server and shared logic (see below)
- `public/` static assets
- `.env.example` documents the env vars

Key files in `lib/`:

- `analytics-store.ts` reads and writes events in Supabase, with an in-memory fallback
- `analytics.ts` event types and aggregation for the dashboard
- `track-client.ts` client-side event tracking
- `admin-auth.ts` admin login and session handling
- `supabase-config.ts` Supabase URLs, table and bucket names, and the setup SQL
- `pricing.ts`, `guide-data.ts` site content
- `flash-sale.ts` per-visitor rolling flash sale (see "Checkout and sales")
- `whop.ts` Whop plan id, loader URL and the `#checkout` hash

## Checkout and sales

- **Payment page:** `components/CheckoutPage.tsx` is a full-screen payment "page" that is always mounted inside the landing page (rendered by `LandingClient`). It embeds the Whop checkout for plan `plan_sAwl4XRuK5cR9` (set in `lib/whop.ts`) using Whop's `loader.js` and starts loading right after the page hydrates. It is only hidden (`visibility` + `opacity`, never `display:none` or unmounted), so clicking any buy button just reveals the already-loaded checkout. Don't change it to conditional rendering or it will load slowly again.
- Opening it sets the URL hash to `#checkout`, so the browser Back button closes it and `/#checkout` opens it directly.
- `components/CheckoutModal.tsx` (the old fake name/email form) is no longer used and can be deleted.
- **The price Whop charges comes from the Whop plan, not from this site.** The site shows $17 (sale) / $47 (regular). Keep the Whop plan price in line with what the site displays.
- **Black Friday sale:** ends at `BLACK_FRIDAY_END_ISO` in `lib/pricing.ts` (11:59:59 PM, viewer's local time).
- **Flash sale (after Black Friday):** `lib/flash-sale.ts`. Once Black Friday has ended, each visitor gets their own random 24h to 48h sale window, saved in `localStorage` under `openframe_flash_sale_end`. When it reaches 00:00 a new random window starts, forever. Price stays $17 while a sale is running. This is a temporary design the owner plans to revisit.
- `LandingClient` ticks every second and passes `calculateSalePricing` / `getSaleCountdown` results down. Sale names in the UI come from `pricing.saleName` and `pricing.saleAccessLabel`, not hardcoded text.

## Environment variables (set in Vercel, Production and Preview)

- `SUPABASE_ANON_KEY` is **required**. Without it every Supabase call returns 401 and no events are saved.
- `SESSION_SECRET` signs admin login sessions.
- `ADMIN_PASSWORD` is the admin login password.

Env var changes only apply to **new** deployments, so redeploy after changing them.

## How analytics works

- Events are `page_visit` and `cta_click`. The dashboard only reads those two types.
- Who is NOT counted: bots/crawlers/link previews (`lib/bot-detection.ts`, checked in the browser and again in `app/api/analytics/route.ts`), any browser that ever logged in as admin (`openframe_ignore` flag in localStorage + cookie, set at login), and any request made while an admin session is active.
- A visit is only sent after a real person interacts with the page (touch, scroll, mouse, key) and has stayed ~1.5s (`trackVisitWhenHuman` in `lib/track-client.ts`).
- One person = one visit: the browser keeps a visitor id plus a "visit recorded" flag, and the server also stores a salted hash of IP + user agent + coarse browser traits (in the `metadata` column as `fp:...`, page visits only) and ignores a second visit with the same hash.
- Table: `openfram_visitor_analytics`. A unique index allows only one `page_visit` per `visitor_id`, so a person is never counted twice.
- Writes go to Supabase REST first. On success, a JSON snapshot is also uploaded to the public Storage bucket `openfram_analytics` (`openfram_events.json`).
- If Supabase is unreachable or returns 401, events only live in server memory, which Vercel wipes between invocations. They are lost.
- The yellow "Events may not be saved... (401)" banner on the admin page means the anon key is missing, invalid or disabled.
- The DB schema allows a `checkout_submit` event type and a `revenue_usd` column, but the app code doesn't read or map either yet.

## Incident log

- **2026-11-26:** Admin showed "Events may not be saved (401)" with 0 visitors. Cause: `SUPABASE_ANON_KEY` was missing from Vercel. Fix: added the key to Production and Preview, then redeployed. Events saved before this date were never stored and can't be recovered.
- An optional hardening change to `lib/analytics-store.ts` (accepts alternative key env var names, doesn't send `sb_` keys as Bearer tokens, clearer 401 message) was prepared as a zip for manual push.

## Working rules

- Prefer small, targeted edits. Don't reformat or restructure files you aren't asked to touch.
- Use the `openfram_` prefix for any new Supabase table, bucket or file, since the project is shared.
- Don't commit real secrets (`SESSION_SECRET`, `ADMIN_PASSWORD`, any service key) to the repo. Set them in Vercel.
- The owner pushes changes to GitHub manually, so give complete files or zips with only the changed files.
