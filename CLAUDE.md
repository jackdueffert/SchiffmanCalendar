# Schiffman Calendar

## Purpose

Internal calendar application for managing commercial real estate lease documents. The core workflow is: drop a document (PDF, DOCX, XLSX, etc.) onto the calendar → Claude Code CLI analyzes it in headless mode locally → extracted dates and deadlines populate directly on the calendar.

**Why headless CLI instead of the cloud API:** Document analysis runs through the local `claude` CLI (`claude -p ...`) so documents never leave the machine and no Anthropic API billing is incurred.

---

## Business Context

Documents being analyzed are commercial real estate leases, lease abstracts, rent rolls, amendments, and related contracts. The four event types the AI extracts are:

| Type | Color | Meaning |
|---|---|---|
| `expiration` | Rose/red | Lease expirations, contract end dates |
| `rent_increase` | Orange | Scheduled rent escalations, CPI bumps, parking rate changes |
| `option` | Violet | Purchase options, renewal/extension options, ROFR deadlines — the date the option *must be exercised* |
| `critical` | Dark red | Notice periods, cure periods, CAM audit windows, insurance renewals, co-tenancy triggers, any other hard deadline |

Four additional general-purpose types exist for manually added events: `deadline`, `meeting`, `task`, `reminder`.

---

## Architecture

Two processes run side-by-side:

```
npm run dev     → Vite dev server   → http://localhost:5173  (React frontend)
npm run server  → Express server    → http://localhost:3001  (Claude CLI bridge)
```

### How document analysis works

1. User drops a file onto the calendar (anywhere on the page)
2. Frontend POSTs the file to `POST /api/analyze` on the Express server
3. Server saves the file to `uploads/` with its original extension preserved
4. Server reads `prompt.md` and appends the absolute file path
5. Server spawns: `claude -p "<prompt + file path>" --allowedTools Read`
6. Claude reads the file using its native Read tool, extracts events, returns a JSON array
7. Server strips any accidental markdown fences, parses JSON, deletes the temp file, returns events
8. Frontend maps the response to `CalendarEvent` objects and adds them to the calendar
9. Events are persisted to `localStorage` so they survive page refreshes

Multiple files dropped at once are processed in parallel via `Promise.allSettled`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, Inter font |
| Icons | lucide-react |
| File drop | react-dropzone |
| Dates | date-fns |
| Backend | Node.js, Express, multer |
| AI | Claude Code CLI (`claude`) in headless/print mode |
| Persistence | Browser localStorage (events), none (server is stateless) |

---

## Key Files

```
CLAUDE.md                        ← you are here
prompt.md                        ← extraction instructions sent to Claude on every analysis
server/index.js                  ← Express bridge: receives files, calls claude CLI, returns events
src/
  App.tsx                        ← auth gate: shows Login or CalendarApp
  types/index.ts                 ← CalendarEvent, DroppedFile, EventType, EVENT_TYPE_CONFIG
  hooks/useAuth.ts               ← login/logout; password stored as SHA-256 hash only
  components/
    CalendarApp.tsx              ← root layout, all state, file drop orchestration
    CalendarGrid.tsx             ← month view grid; cell click → AddEventModal
    Header.tsx                   ← nav with month/year picker dropdown (2023–present+5)
    Sidebar.tsx                  ← mini calendar, upcoming events, file queue
    AddEventModal.tsx            ← manual event creation form (click any calendar cell)
    EventModal.tsx               ← event detail/delete view
    FileDropOverlay.tsx          ← full-screen drag overlay
    FileQueue.tsx                ← sidebar document analysis status list
    Login.tsx                    ← auth gate UI
    MiniCalendar.tsx             ← compact month overview in sidebar
    EventChip.tsx                ← colored event pill in calendar cells
samples/
  lease-abstract-123-commerce-dr.pdf   ← test PDF (run: node scripts/generate-samples.mjs)
  rent-roll-pacific-ventures.xlsx      ← test XLSX
scripts/
  generate-samples.mjs          ← generates the two sample test documents
```

---

## Running the Project

```bash
# Terminal 1 — frontend
npm run dev

# Terminal 2 — analysis server
npm run server

# Regenerate sample test documents
node scripts/generate-samples.mjs
```

---

## Auth

Simple hardcoded credential gate — no backend auth, no database.

- **Username:** `SchiffmanCalendar`
- **Password:** stored only as a SHA-256 hash in `src/hooks/useAuth.ts`; plaintext never persists anywhere
- Session stored in `localStorage` key `schiffman_cal_auth`

To change the password: compute `echo -n "newpassword" | shasum -a 256` and update `STORED_PASSWORD_HASH` and `STORED_USERNAME` in `src/hooks/useAuth.ts`.

---

## Event Persistence

Events are stored in `localStorage` under the key `schiffman_cal_events` as a JSON array. `Date` objects serialize to ISO strings and are revived on load. The server is fully stateless — it does not store anything.

---

## Prompt Tuning

`prompt.md` is the single file that controls what Claude extracts from documents. It is read fresh on every analysis request — no server restart needed after editing it. Tune it here when extraction quality needs improvement for specific document types.

The prompt instructs Claude to return **only** a raw JSON array (no markdown fences, no explanation) with fields: `title`, `date` (ISO 8601), `type` (one of the four business types), `description`.

---

## Adding New Event Types

1. Add the new type string to `EventType` in `src/types/index.ts`
2. Add its config entry to `EVENT_TYPE_CONFIG` (label, bg, text, light, dot Tailwind classes)
3. Add it to `VALID_TYPES` (already derived automatically from `Object.keys(EVENT_TYPE_CONFIG)`)
4. Add it to the `TYPE_ROWS` grid in `src/components/AddEventModal.tsx`
5. Update `prompt.md` if it should also be extracted from documents

---

## Conventions

- All state lives in `CalendarApp.tsx` and is passed down via props — no global state library
- TypeScript strict mode is on; `noUnusedLocals` / `noUnusedParameters` are off to allow prototype flexibility
- Tailwind utility classes only — no custom CSS except the global scrollbar and keyframe animations in `src/index.css`
- The `color` field was removed from `CalendarEvent`; colors are always derived from `EVENT_TYPE_CONFIG[event.type]`
- Dates from document analysis are stored at midnight local time; manually added events may carry an optional `time?: string` (HH:MM) field displayed separately
