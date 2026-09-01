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

function getUserEmail(request) {
  return request.headers.get("cf-access-authenticated-user-email") || "unknown";
}

function requireEditorAccess(request) {
  const email = request.headers.get("cf-access-authenticated-user-email");
  if (!email) {
    return { ok: false, error: "Editor access required" };
  }
  return { ok: true, email };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/editor" || url.pathname === "/editor.html") {
      const access = requireEditorAccess(request);
      if (!access.ok) {
        return json({ error: access.error }, 403);
      }
      return env.ASSETS.fetch(new Request(new URL("/editor.html", request.url), request));
    }

    if (url.pathname.startsWith("/api/") || url.pathname === "/ws") {
      const id = env.CARE_ROOM.idFromName("dad-care-room");
      const room = env.CARE_ROOM.get(id);

      const forwarded = new Request(request);
      forwarded.headers.set("x-care-user-email", getUserEmail(request));

      return room.fetch(forwarded);
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
      return this.deleteRecord(id, request);
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
    const access = requireEditorAccess(request);
    if (!access.ok) {
      return json({ error: access.error }, 403);
    }

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

  deleteRecord(id, request) {
    const access = requireEditorAccess(request);
    if (!access.ok) {
      return json({ error: access.error }, 403);
    }

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
