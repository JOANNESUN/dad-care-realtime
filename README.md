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

## Restrict access to the six family members

Because this contains private health information, protect the Worker with Cloudflare Access.

In Cloudflare:

1. Open **Workers & Pages**.
2. Open `dad-care-log`.
3. Enable **Cloudflare Access** for production.
4. Create an **Allow** policy containing only the six approved email addresses.
5. Use a login method such as **One-time PIN** if convenient.

Each approved person signs in with their own email.

The application records the authenticated email with each entry so the timeline can show who recorded it.

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
- `wrangler.jsonc` — Cloudflare configuration
- `package.json` — local/deploy commands
