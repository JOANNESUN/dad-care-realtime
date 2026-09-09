# Dad Care Log — Cloudflare real-time version

This version is shared and real-time.

## Architecture

Browser
→ Cloudflare Access
→ Cloudflare Worker
→ one shared `CareRoom` Durable Object
→ SQLite storage

Every open browser also has a WebSocket connection to the same `CareRoom`.

When someone adds a record:

1. The Worker sends it to the Durable Object.
2. The Durable Object validates it.
3. The record is inserted into SQLite.
4. The Durable Object broadcasts `record_added` to all connected browsers.
5. Everyone's timeline and charts update immediately without refreshing.

## Deploy

```bash
npm install
npx wrangler login
npm run deploy
```

Wrangler prints the deployed URL.

## Restrict write access to the six family members

The public page is intentionally read-only. Only the six approved family members have a protected editor page.

In Cloudflare:

1. Open **Workers & Pages**.
2. Open `dad-care-log`.
3. Enable **Cloudflare Access** for production.
4. Create an **Allow** policy containing only the six approved email addresses.
5. Use a login method such as **One-time PIN** if convenient.

The app does not display or store which family member created a record.

## Local development

```bash
npm run dev
```

Then open the local Wrangler URL, usually:

`http://localhost:8787`

When developing locally, Cloudflare Access is not present by default, so the record author may appear as `unknown`.

## Why there is no separate D1 database

For this particular app, one SQLite-backed Durable Object is simpler than using both D1 and Durable Objects.

The Durable Object provides:

- persistent SQLite storage
- real-time coordination
- WebSocket broadcasting
- one consistent shared room for all family members

For six users and one care log, that is a very small workload.

## Files

- `public/index.html` — the page
- `src/index.js` — API, SQLite database, and WebSocket server
- `public/manifest.webmanifest` — lets phones add the app to the home screen
- `tools/make-icons.js` — regenerates the home-screen icons
- `wrangler.jsonc` — Cloudflare configuration
- `package.json` — local/deploy commands

## Home screen icon

The icons in `public/icons/` are generated, not hand-drawn. To change the
artwork, edit the geometry at the top of `tools/make-icons.js` and re-run:

```sh
node tools/make-icons.js public/icons
```

Note that phones cache the icon once it is on a home screen, so anyone who
already added it has to remove and re-add it to see a new one.
