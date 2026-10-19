# NeuroTrack

NeuroTrack is a local-first cognitive self-tracking and neuroscience education demo. It is not a medical device, diagnostic system, or clinically validated assessment.

## Architecture

- `client/`: React, TypeScript, Vite, Recharts. Includes the responsive dashboard, N-back task, daily optional check-in, analytics, insight view, learning hub, and privacy/settings UI.
- `server/`: Express and TypeScript. Validates inputs, persists sessions/check-ins with SQLite, exports/deletes data, and calls the TinyFish Web Agent only from the backend.
- `server/data/neurotrack.sqlite`: created on first run using SQLite compiled to WebAssembly. First startup includes four explicitly synthetic N-back sessions to make the dashboard demonstrable. The data reset action can clear it; `/api/demo/reset` restores the synthetic records.

No account system or cloud sync is configured. TinyFish receives only a fixed topic/task request; the app never includes personal performance or check-in data in that request.

## Start on Windows

Requires Node.js 20+ and npm. Open PowerShell in this project folder and install the dependencies:

```powershell
npm install
```

Start the API in the first PowerShell window:

```powershell
npm run dev:server
```

Start the frontend in a second PowerShell window, also in the project folder:

```powershell
npm run dev:client
```

Open `http://localhost:5173`. The API runs on `http://localhost:3001`; Vite forwards `/api` requests to it. To stop either server, press `Ctrl+C` in its PowerShell window.

### Enable TinyFish research

1. Sign in to TinyFish, open the [API Keys page](https://agent.tinyfish.ai/api-keys), create a key, and copy it immediately. TinyFish shows keys only once; NeuroTrack cannot create or retrieve one for you.
2. In the project folder, make a private server-side environment file:

   ```powershell
   if (-not (Test-Path server/.env)) { Copy-Item .env.example server/.env }
   notepad server/.env
   ```

3. Replace the placeholder value for `TINYFISH_API_KEY` with your key, save, and close Notepad. Keep this value in `server/.env` only.
4. Restart the API (`Ctrl+C`, then `npm run dev:server`).
5. Open Testing Lab and select **Explore the science behind this task**. This uses the one predefined topic: **working memory and the N-back task**. A `LIVE TINYFISH` label appears only after a successful response passes validation. Without a key, the app shows the built-in overview.

The Testing Lab shows whether a key is configured, using only a true/false server response. `/api/config` returns `{ "tinyfishConfigured": true|false }`; it never returns the key. The backend explicitly loads `server/.env`, checks it into `.gitignore`, and sends the key only in the server-to-TinyFish `X-API-Key` header. It is not exposed through Vite or sent to the browser. The fixed task/topic request excludes personal session and check-in data.

The integration uses `POST https://agent.tinyfish.ai/v1/automation/run`, `X-API-Key`, and a top-level-object `output_schema`. Those request fields and the `COMPLETED` response status match the [official Agent API reference](https://docs.tinyfish.ai/agent-api/reference) and [structured output guide](https://docs.tinyfish.ai/key-concepts/structured-output). Results are validated and source URLs restricted to HTTPS on an approved research/education domain. Missing keys use the built-in overview. Failed runs, unreadable or malformed responses, empty approved-source lists, upstream errors, and timeouts show a concise error plus the built-in overview; they are not presented as live research.

## Verify

```powershell
npm test
npm run build
```

The live call requires your valid TinyFish API key and an internet connection. Automated tests/builds do not call TinyFish or claim that a live request succeeded.

## Demo data and privacy

Use **Privacy & Settings → Export my data** for a JSON export or **Delete all local data** to clear records. Synthetic example sessions are marked `isSynthetic: true` in the API and export. `/api/demo/reset` re-seeds those labeled samples. Every check-in field is optional and check-in data is never sent to TinyFish.

## Scope

The first implementation prioritizes N-back, persistent sessions, analytics, check-in capture, local data management, and one live research integration. Other requested tasks (reaction time, Stroop, Go/No-Go, digit span, Corsi, Trail Making, visual search, and time estimation) are not implemented yet. No auth, reminders, cross-user isolation, or PostgreSQL adapter is included; this local demo is intended for one local workspace.

The N-back task includes an unscored practice round and a visible three-step countdown. Each saved session contains per-trial match type, correctness, reaction time, and missed responses. Synthetic sample rows are excluded from personal insight calculations; demo charts and history identify them explicitly.

The optional check-in captures sleep duration/quality, caffeine, exercise, last-meal time, mood, stress, energy, device type, and environmental notes. Time of day comes from the session timestamp. Medication, supplement, and menstrual-cycle details are not collected in this demo.
