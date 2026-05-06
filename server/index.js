import express from 'express';
import multer from 'multer';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT        = process.env.PORT        || 3001;
const PROMPT_PATH = path.join(__dirname, '..', 'prompt.md');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const DB_PATH     = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'events.db');
const JWT_SECRET  = process.env.JWT_SECRET;
const JWT_EXPIRY  = '7d';

if (!JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET is not set. Refusing to start.');
  process.exit(1);
}

for (const dir of [UPLOADS_DIR, path.dirname(DB_PATH)]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ── Database ──────────────────────────────────────────────────────────────────
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS events (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    date        TEXT NOT NULL,
    time        TEXT,
    type        TEXT NOT NULL,
    description TEXT,
    source_file TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );
`);

// Seed admin user from env on first run
const { ADMIN_USERNAME = 'SchiffmanCalendar', ADMIN_PASSWORD } = process.env;
if (ADMIN_PASSWORD) {
  const exists = db.prepare('SELECT 1 FROM users WHERE username = ?').get(ADMIN_USERNAME);
  if (!exists) {
    const hash = bcrypt.hashSync(ADMIN_PASSWORD, 12);
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(ADMIN_USERNAME, hash);
    console.log(`[db] Admin user "${ADMIN_USERNAME}" created`);
  }
}

// ── Express ───────────────────────────────────────────────────────────────────
const app = express();

app.use(helmet());
app.use(express.json({ limit: '1mb' }));

// CORS: allows *.vercel.app and configured origins
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:4173',
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : []),
]);

app.use((req, res, next) => {
  const origin = req.headers.origin ?? '';
  if (!origin || allowedOrigins.has(origin) || origin.endsWith('.vercel.app')) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalid or expired' });
  }
}

// ── Auth endpoints ────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});

app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { username, password } = req.body ?? {};

  if (typeof username !== 'string' || typeof password !== 'string' ||
      !username.trim() || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());

  // Compare even on miss to avoid timing attacks
  const hashToCompare = user?.password_hash ?? '$2a$12$invalidhashpaddingtoconsistenttime';
  const match = bcrypt.compareSync(password, hashToCompare);

  if (!user || !match) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  res.json({ token });
});

app.get('/api/auth/verify', requireAuth, (req, res) => {
  res.json({ valid: true, username: req.user.username });
});

// ── Events API (protected) ────────────────────────────────────────────────────
app.get('/api/events', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM events ORDER BY date ASC').all();
  res.json({
    events: rows.map(r => ({
      id: r.id,
      title: r.title,
      date: r.date,
      ...(r.time        && { time: r.time }),
      type: r.type,
      ...(r.description && { description: r.description }),
      ...(r.source_file && { sourceFile: r.source_file }),
    })),
  });
});

app.post('/api/events', requireAuth, (req, res) => {
  const { id, title, date, time, type, description, sourceFile } = req.body ?? {};
  if (!id || !title || !date || !type) {
    return res.status(400).json({ error: 'id, title, date, and type are required' });
  }
  // Basic date format validation
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
  }
  try {
    db.prepare(`
      INSERT OR REPLACE INTO events (id, title, date, time, type, description, source_file)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, date, time ?? null, type, description ?? null, sourceFile ?? null);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/events/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── Document analysis (protected) ────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50 MB max

function runClaude(fullPrompt) {
  return new Promise((resolve, reject) => {
    const proc = spawn('claude', ['-p', fullPrompt, '--allowedTools', 'Read'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', chunk => { stdout += chunk.toString(); });
    proc.stderr.on('data', chunk => { stderr += chunk.toString(); });

    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error('Claude analysis timed out after 2 minutes'));
    }, 120_000);

    proc.on('close', code => {
      clearTimeout(timer);
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(`claude exited ${code}${stderr ? ': ' + stderr.slice(0, 300) : ''}`));
    });

    proc.on('error', err => {
      clearTimeout(timer);
      if (err.code === 'ENOENT') reject(new Error('claude CLI not found — ensure it is in PATH'));
      else reject(err);
    });
  });
}

function parseClaudeJSON(raw) {
  const text = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error('Claude response was not a JSON array');
  return parsed;
}

app.post('/api/analyze', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  const filePath = req.file.path;
  try {
    const promptTemplate = fs.readFileSync(PROMPT_PATH, 'utf-8');
    const fullPrompt = `${promptTemplate}\n\n---\nFile to analyze: ${path.resolve(filePath)}`;

    console.log(`[analyze] → ${req.file.originalname}`);
    const raw    = await runClaude(fullPrompt);
    const events = parseClaudeJSON(raw);
    console.log(`[analyze] ✓ ${req.file.originalname} — ${events.length} event(s) extracted`);

    res.json({ events });
  } catch (err) {
    console.error(`[analyze] ✗ ${req.file.originalname}:`, err.message);
    res.status(500).json({ error: err.message });
  } finally {
    fs.unlink(filePath, () => {});
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\nSchiffman Calendar server  →  http://localhost:${PORT}`);
  console.log(`  DB:     ${DB_PATH}`);
  console.log(`  Prompt: ${PROMPT_PATH}\n`);
});
