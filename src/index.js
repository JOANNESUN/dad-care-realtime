import { DurableObject } from "cloudflare:workers";

const VALID_TYPES = new Set([
  "Food / Drink",
  "Medicine",
  "IV / Treatment",
  "Temperature",
  "Sleep / Rest",
  "Symptoms",
  "Other",
]);

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

    // Everything past this point requires one of the two passwords.
    const role = await sessionRole(request, env);

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

    if (!amount && !detail) {
      return json({ error: "Please record what happened" }, 400);
    }

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
