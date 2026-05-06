import express from 'express';
import multer from 'multer';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3001;
const PROMPT_PATH = path.join(__dirname, '..', 'prompt.md');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Preserve original file extension so Claude knows the format
const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});
const upload = multer({ storage });

function runClaude(fullPrompt) {
  return new Promise((resolve, reject) => {
    const proc = spawn('claude', ['-p', fullPrompt, '--allowedTools', 'Read'], {
      stdio: ['ignore', 'pipe', 'pipe'],
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
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`claude exited ${code}${stderr ? ': ' + stderr.slice(0, 300) : ''}`));
      }
    });

    proc.on('error', err => {
      clearTimeout(timer);
      if (err.code === 'ENOENT') {
        reject(new Error('Claude Code CLI not found — make sure `claude` is in your PATH'));
      } else {
        reject(err);
      }
    });
  });
}

function parseClaudeJSON(raw) {
  // Strip any accidental markdown fences Claude might wrap around the array
  const text = raw
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim();

  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error('Claude response was not a JSON array');
  return parsed;
}

app.post('/api/analyze', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  const filePath = req.file.path;

  try {
    const promptTemplate = fs.readFileSync(PROMPT_PATH, 'utf-8');
    const fullPrompt = `${promptTemplate}\n\n---\nFile to analyze: ${path.resolve(filePath)}`;

    console.log(`[analyze] → ${req.file.originalname}`);
    const raw = await runClaude(fullPrompt);
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

app.listen(PORT, () => {
  console.log(`\nSchiffman Calendar analysis server`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  Prompt: ${PROMPT_PATH}\n`);
});
