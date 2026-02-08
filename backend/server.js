import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8787;
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "change-me";
const DATA_DIR = path.join(__dirname, "data");
const REQUESTS_FILE = path.join(DATA_DIR, "requests.json");
const TOKENS_FILE = path.join(DATA_DIR, "tokens.json");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

ensureDataFiles();

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(REQUESTS_FILE)) fs.writeFileSync(REQUESTS_FILE, "[]");
  if (!fs.existsSync(TOKENS_FILE)) fs.writeFileSync(TOKENS_FILE, "[]");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function authBasic(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, encoded] = header.split(" ");
  if (type !== "Basic" || !encoded) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Admin"');
    return res.status(401).json({ error: "Unauthorized" });
  }
  const [user, pass] = Buffer.from(encoded, "base64").toString("utf8").split(":");
  if (user !== ADMIN_USER || pass !== ADMIN_PASS) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

function makeToken() {
  return crypto.randomBytes(24).toString("hex");
}

function ttlToMs(ttl) {
  if (ttl === "7d") return 7 * 24 * 60 * 60 * 1000;
  if (ttl === "30d") return 30 * 24 * 60 * 60 * 1000;
  return 24 * 60 * 60 * 1000;
}

function pruneExpired(tokens) {
  const now = Date.now();
  return tokens.filter(t => t.expiresAt > now);
}

app.get("/", (req, res) => {
  res.json({ ok: true, service: "wok-importer-gate" });
});

app.post("/api/request", (req, res) => {
  const { name, contact, reason } = req.body || {};
  if (!name || !reason) {
    return res.status(400).json({ error: "name and reason required" });
  }
  const requests = readJson(REQUESTS_FILE);
  const id = crypto.randomUUID();
  const entry = {
    id,
    name,
    contact: contact || "",
    reason,
    status: "pending",
    createdAt: new Date().toISOString()
  };
  requests.push(entry);
  writeJson(REQUESTS_FILE, requests);
  res.json({ ok: true, id });
});

app.get("/api/import/validate", (req, res) => {
  const token = req.query.token || "";
  const tokens = pruneExpired(readJson(TOKENS_FILE));
  writeJson(TOKENS_FILE, tokens);
  const match = tokens.find(t => t.token === token);
  if (!match) return res.json({ valid: false });
  return res.json({
    valid: true,
    expiresAt: match.expiresAt,
    remainingMs: match.expiresAt - Date.now()
  });
});

app.get("/admin", authBasic, (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/api/admin/requests", authBasic, (req, res) => {
  const requests = readJson(REQUESTS_FILE);
  res.json({ requests });
});

app.post("/api/admin/approve", authBasic, (req, res) => {
  const { id, ttl } = req.body || {};
  if (!id) return res.status(400).json({ error: "id required" });
  const requests = readJson(REQUESTS_FILE);
  const reqItem = requests.find(r => r.id === id);
  if (!reqItem) return res.status(404).json({ error: "request not found" });
  reqItem.status = "approved";
  reqItem.approvedAt = new Date().toISOString();
  writeJson(REQUESTS_FILE, requests);

  const tokens = pruneExpired(readJson(TOKENS_FILE));
  const token = makeToken();
  const expiresAt = Date.now() + ttlToMs(ttl);
  tokens.push({
    token,
    requestId: id,
    issuedAt: Date.now(),
    expiresAt
  });
  writeJson(TOKENS_FILE, tokens);
  res.json({ ok: true, token, expiresAt });
});

app.post("/api/admin/revoke", authBasic, (req, res) => {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: "token required" });
  const tokens = readJson(TOKENS_FILE).filter(t => t.token !== token);
  writeJson(TOKENS_FILE, tokens);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`[wok-importer-gate] listening on http://localhost:${PORT}`);
});
