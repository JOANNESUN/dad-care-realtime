import { DurableObject } from "cloudflare:workers";

const VALID_TYPES = new Set([
  "Food / Drink",
  "Medicine",
  "IV / Treatment",
  "Temperature",
  "Sleep / Rest",
  "Symptoms",
  "Location",
  "Wellness",
  "Other",
]);

// Location is a state with duration, not a one-off event: each record marks a
// change, and the page shows the most recent one as the current status.
const LOCATION_VALUES = new Set(["Home", "Hospital"]);

const SLEEP_TYPE = "Sleep / Rest";

// A sleep someone is still having is a normal record carrying this marker as
// its amount. That way every client already receives it over the socket and
// already renders it in the timeline - no second channel to keep in sync. It
// never survives: waking replaces it with the finished duration, so a stored
// sleep only ever has one shape.
const SLEEP_OPEN = "Asleep";
const SLEEP_DURATION = /^(?:(\d{1,3})h)?(?:\s*(\d{1,2})m)?$/;

function sleepMinutes(amount) {
  const parts = SLEEP_DURATION.exec(amount);
  if (!parts || (!parts[1] && !parts[2])) return null;
  return Number(parts[1] || 0) * 60 + Number(parts[2] || 0);
}

function formatSleep(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}m`;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

// Every time in this app is the family's local wall clock, never UTC - the
// Worker's own clock is in the wrong timezone and is never consulted. Reading
// both ends as UTC cancels the offset out and leaves the elapsed minutes.
function wallClock(date, time) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return Date.UTC(year, month - 1, day, hour, minute);
}

// 1-5 wellness scale. Stored as a number so it can be charted; the emoji and
// the wording live in the client dictionary.
const WELLNESS_VALUES = new Set(["1", "2", "3", "4", "5"]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

const SESSION_COOKIE = "dcl_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

const encoder = new TextEncoder();

function base64url(bytes) {
  let binary = "";
  for (const b of new Uint8Array(bytes)) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(text) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(text)));
}

// Compare two equal-length byte arrays without leaking position via timing.
function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function passwordMatches(supplied, expected) {
  if (!expected) return false;
  // Hash both sides first so the comparison is always over fixed-length input.
  const [a, b] = await Promise.all([sha256(supplied), sha256(expected)]);
  return constantTimeEqual(a, b);
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return base64url(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

function readCookie(request, name) {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

const ROLES = new Set(["editor", "viewer"]);

// Returns "editor", "viewer", or null. The role is inside the signed payload,
// so it cannot be edited client-side without invalidating the signature.
async function sessionRole(request, env) {
  const secret = env.SESSION_SECRET;
  if (!secret) return null;

  const raw = readCookie(request, SESSION_COOKIE);
  if (!raw) return null;

  const [expires, role, signature] = raw.split(".");
  if (!expires || !role || !signature) return null;
  if (!ROLES.has(role)) return null;

  if (!/^\d+$/.test(expires) || Number(expires) < Math.floor(Date.now() / 1000)) {
    return null;
  }

  const expected = await sign(`${expires}.${role}`, secret);
  if (!constantTimeEqual(encoder.encode(expected), encoder.encode(signature))) {
    return null;
  }

  return role;
}

async function makeSessionCookie(env, role) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const signature = await sign(`${expires}.${role}`, env.SESSION_SECRET);
  return `${SESSION_COOKIE}=${expires}.${role}.${signature}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;
}

function loginPage(message = "") {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<meta name="theme-color" content="#f6f7f8">
<!-- Opened from the home screen these drop the browser chrome, so it reads
     as an app rather than a page. -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Dad Care">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<title>Dad Care Log · 爸爸照护记录</title>
<style>
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
         font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
         background:#f6f7f8; color:#1f2937; }
  .card { background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:28px;
          width:min(360px, calc(100vw - 32px)); box-shadow:0 1px 3px rgba(0,0,0,.06); }
  h1 { margin:0 0 2px; font-size:20px; }
  .zh-title { font-size:15px; color:#6b7280; margin-bottom:10px; }
  .zh { color:#6b7280; }
  p { margin:0 0 20px; color:#6b7280; font-size:14px; }
  label { display:block; font-size:13px; margin-bottom:6px; color:#374151; }
  input { width:100%; box-sizing:border-box; padding:11px 12px; font-size:16px;
          border:1px solid #e5e7eb; border-radius:10px; background:#f9fafb; }
  button { width:100%; margin-top:14px; padding:11px 12px; font-size:15px; cursor:pointer;
           border:0; border-radius:10px; background:#374151; color:#fff; }
  .err { margin:0 0 14px; padding:10px 12px; border-radius:10px;
         background:#fef2f2; color:#991b1b; font-size:13px; }
</style>
</head>
<body>
  <form class="card" method="POST" action="/login">
    <h1>Dad Care Log</h1>
    <div class="zh-title">爸爸照护记录</div>
    <p>Enter your family password to continue.<br><span class="zh">请输入家庭密码以继续。</span></p>
    ${message ? `<div class="err">${message}</div>` : ""}
    <label for="password">Password · 密码</label>
    <input id="password" name="password" type="password" autocomplete="current-password" autofocus required>
    <button type="submit">Sign in · 登录</button>
  </form>
</body>
</html>`,
    { status: message ? 401 : 200, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

function isLocalRequest(request) {
  const host = (request.headers.get("host") || "").split(":")[0];
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

function devBypassRole(request, env) {
  if (env.DEV_SKIP_AUTH !== "true") return null;
  if (!isLocalRequest(request)) return null;
  return env.DEV_SKIP_AUTH_ROLE === "viewer" ? "viewer" : "editor";
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (!env.SESSION_SECRET || !env.SITE_PASSWORD) {
      return json({ error: "Server is missing SITE_PASSWORD/SESSION_SECRET" }, 500);
    }

    if (url.pathname === "/login") {
      if (request.method === "GET") return loginPage();

      if (request.method === "POST") {
        const form = await request.formData();
        const supplied = String(form.get("password") || "");

        // Check both passwords so either one signs you in, at its own level.
        let role = null;
        if (await passwordMatches(supplied, env.SITE_PASSWORD)) role = "editor";
        else if (await passwordMatches(supplied, env.VIEWER_PASSWORD)) role = "viewer";

        if (!role) {
          return loginPage("That password is not correct. · 密码不正确。");
        }

        return new Response(null, {
          status: 303,
          headers: {
            location: "/",
            "set-cookie": await makeSessionCookie(env, role),
          },
        });
      }

      return json({ error: "Method not allowed" }, 405);
    }

    if (url.pathname === "/logout") {
      return new Response(null, {
        status: 303,
        headers: {
          location: "/login",
          "set-cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
        },
      });
    }

    // The manifest and the icons are served before the password check on
    // purpose: browsers fetch a manifest without cookies unless it is marked
    // crossorigin, so gating it would hand the phone the login page instead of
    // the manifest and the home-screen icon would fall back to a screenshot.
    // Neither file says anything the login page does not already say.
    if (url.pathname === "/manifest.webmanifest" || url.pathname.startsWith("/icons/")) {
      return env.ASSETS.fetch(request);
    }

    // Everything past this point requires one of the two passwords.
    // DEV_SKIP_AUTH lets `wrangler dev` render the pages without signing in.
    // It is double-guarded: the flag lives only in .dev.vars (gitignored and
    // never uploaded), and it is ignored unless the request is to localhost,
    // so setting it in production still cannot expose anything.
    const role = devBypassRole(request, env) || (await sessionRole(request, env));

    if (!role) {
      if (url.pathname.startsWith("/api/") || url.pathname === "/ws") {
        return json({ error: "Sign in required" }, 401);
      }
      return loginPage();
    }

    // Lets the page hide controls the signed-in role cannot use. The server
    // enforces the same rule below regardless of what the page does.
    if (url.pathname === "/api/me") {
      return json({ role });
    }

    if (url.pathname === "/editor" || url.pathname === "/editor.html") {
      if (role !== "editor") {
        return json({ error: "This password is view-only. · 此密码仅可查看。" }, 403);
      }
      // Ask the asset router for the extension-less path it canonicalizes to,
      // otherwise it 307s back to /editor and we loop.
      return env.ASSETS.fetch(new Request(new URL("/editor", request.url), request));
    }

    if (url.pathname.startsWith("/api/") || url.pathname === "/ws") {
      // Viewers may read and receive live updates, but never write.
      const isWrite = request.method !== "GET" && request.method !== "HEAD";

      if (isWrite && role !== "editor") {
        return json({ error: "This password is view-only. · 此密码仅可查看。" }, 403);
      }

      const id = env.CARE_ROOM.idFromName("dad-care-room");
      const room = env.CARE_ROOM.get(id);
      return room.fetch(new Request(request));
    }

    return env.ASSETS.fetch(request);
  },
};

export class CareRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;

    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS records (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        type TEXT NOT NULL,
        amount TEXT NOT NULL DEFAULT '',
        detail TEXT NOT NULL DEFAULT '',
        notes TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_records_date_time
      ON records(date, time);
    `);
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/ws") {
      return this.handleWebSocket(request);
    }

    if (url.pathname === "/api/records" && request.method === "GET") {
      return this.listRecords();
    }

    if (url.pathname === "/api/records" && request.method === "POST") {
      return this.createRecord(request);
    }

    if (url.pathname === "/api/sleep/start" && request.method === "POST") {
      return this.startSleep(request);
    }

    if (url.pathname === "/api/sleep/stop" && request.method === "POST") {
      return this.stopSleep(request);
    }

    if (url.pathname.startsWith("/api/records/") && request.method === "DELETE") {
      const id = decodeURIComponent(url.pathname.slice("/api/records/".length));
      return this.deleteRecord(id);
    }

    return json({ error: "Not found" }, 404);
  }

  listRecords() {
    const rows = this.ctx.storage.sql.exec(`
      SELECT
        id,
        date,
        time,
        type,
        amount,
        detail,
        notes,
        created_at AS createdAt
      FROM records
      ORDER BY date DESC, time DESC, created_at DESC
    `).toArray();

    return json(rows);
  }

  async createRecord(request) {
    let body;

    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    const date = String(body.date || "");
    const time = String(body.time || "");
    const type = String(body.type || "");
    const amount = String(body.amount || "").trim().slice(0, 300);
    const detail = String(body.detail || "").trim().slice(0, 2000);
    const notes = String(body.notes || "").trim().slice(0, 1000);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return json({ error: "Invalid date" }, 400);
    }

    if (!/^\d{2}:\d{2}$/.test(time)) {
      return json({ error: "Invalid time" }, 400);
    }

    if (!VALID_TYPES.has(type)) {
      return json({ error: "Invalid record type" }, 400);
    }

    if (type === "Location" && !LOCATION_VALUES.has(amount)) {
      return json({ error: "Location must be Home or Hospital" }, 400);
    }

    if (type === "Wellness" && !WELLNESS_VALUES.has(amount)) {
      return json({ error: "Wellness must be 1 to 5" }, 400);
    }

    // Keeps every new sleep countable. Records written before the picker
    // existed keep whatever text they have - this only guards new writes.
    if (type === SLEEP_TYPE && amount && sleepMinutes(amount) === null) {
      return json({ error: "Sleep must be a length like 1h 30m" }, 400);
    }

    if (!amount && !detail) {
      return json({ error: "Please record what happened" }, 400);
    }

    return json(this.insertRecord({ date, time, type, amount, detail, notes }), 201);
  }

  insertRecord({ date, time, type, amount, detail = "", notes = "" }) {
    const record = {
      id: crypto.randomUUID(),
      date,
      time,
      type,
      amount,
      detail,
      notes,
      createdAt: new Date().toISOString(),
    };

    this.ctx.storage.sql.exec(
      `INSERT INTO records
       (id, date, time, type, amount, detail, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      record.id,
      record.date,
      record.time,
      record.type,
      record.amount,
      record.detail,
      record.notes,
      record.createdAt
    );

    this.broadcast({ event: "record_added", record });
    return record;
  }

  // The sleep he is still having, if there is one.
  openSleep() {
    return this.ctx.storage.sql.exec(
      `SELECT id, date, time, detail, notes
       FROM records
       WHERE type = ? AND amount = ?
       ORDER BY date DESC, time DESC, created_at DESC
       LIMIT 1`,
      SLEEP_TYPE,
      SLEEP_OPEN
    ).toArray()[0] || null;
  }

  // The page sends its own clock, the same as every other record does.
  async whenFrom(request) {
    let body;

    try {
      body = await request.json();
    } catch {
      return null;
    }

    const date = String(body.date || "");
    const time = String(body.time || "");

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    if (!/^\d{2}:\d{2}$/.test(time)) return null;

    return { date, time };
  }

  async startSleep(request) {
    const when = await this.whenFrom(request);
    if (!when) return json({ error: "Invalid date or time" }, 400);

    // One sleep at a time. Two people tapping at once is the normal case here,
    // not an edge case, and the second tap should not open a second session.
    if (this.openSleep()) {
      return json({ error: "He is already marked asleep" }, 409);
    }

    return json(this.insertRecord({ ...when, type: SLEEP_TYPE, amount: SLEEP_OPEN }), 201);
  }

  // Closing is one call rather than a delete plus a post from the page, so two
  // people tapping "he woke up" together cannot produce two records: this
  // object handles one request at a time, and the second finds nothing open.
  async stopSleep(request) {
    const when = await this.whenFrom(request);
    if (!when) return json({ error: "Invalid date or time" }, 400);

    const open = this.openSleep();
    if (!open) return json({ error: "No sleep is open" }, 409);

    const minutes = Math.round(
      (wallClock(when.date, when.time) - wallClock(open.date, open.time)) / 60000
    );

    if (minutes < 0) {
      return json({ error: "He cannot wake before falling asleep" }, 400);
    }

    this.ctx.storage.sql.exec("DELETE FROM records WHERE id = ?", open.id);
    this.broadcast({ event: "record_deleted", id: open.id });

    // Timed at the moment he fell asleep, so the nap sits where it happened.
    const record = this.insertRecord({
      date: open.date,
      time: open.time,
      type: SLEEP_TYPE,
      amount: formatSleep(Math.max(minutes, 1)),
      detail: open.detail,
      notes: open.notes,
    });

    return json(record, 201);
  }

  deleteRecord(id) {
    if (!id) return json({ error: "Missing id" }, 400);

    this.ctx.storage.sql.exec("DELETE FROM records WHERE id = ?", id);
    this.broadcast({ event: "record_deleted", id });

    return json({ ok: true });
  }

  handleWebSocket(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    this.ctx.acceptWebSocket(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  broadcast(message) {
    const payload = JSON.stringify(message);

    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(payload);
      } catch {}
    }
  }

  webSocketMessage(ws, message) {
    if (message === "ping") {
      ws.send("pong");
    }
  }

  webSocketClose(ws, code, reason) {
    try {
      ws.close(code, reason);
    } catch {}
  }

  webSocketError(ws) {
    try {
      ws.close(1011, "WebSocket error");
    } catch {}
  }
}
