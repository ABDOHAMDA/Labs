# Hack The Sudoku

`Hack The Sudoku` is a cybersecurity training lab disguised as a Sudoku game.

The UI looks like a normal puzzle, but the challenge is intentionally vulnerable and intentionally unwinnable through normal play.  
Your objective is to **hack the game**, not solve Sudoku mathematically.

## Stack

- Frontend: React + Vite (imports shared `labSystem` via the `@lab` alias)
- Optional backend: whatever you expose for `/api/validate` / hints (not required to complete the lab)
- Lab persistence: `localStorage` only (for training realism)
- Containerization: Docker + Docker Compose

## Project Structure

```text
hack-the-sudoku/
  labSystem/     # shared lab config, scoring, progress, HackMe client (imported as @lab in Vite)
  frontend/      # React + Vite; `public/js/labApp.js` is the visible `winGame` module
  backend/       # optional Node mock API for Docker
  docker-compose.yml
  README.md
```

## Lab platform (client-side, intentionally weak)

When the **exploit** succeeds (not normal Sudoku completion), the app:

- Sets `localStorage` keys, including `lab_sudoku_solved` = `"true"`, and on first clear `score_sudoku` = `"100"`.
- Updates `totalScore` (sum-style running total; extend with more `score_*` keys in other labs).
- Blocks duplicate point awards: console logs **Duplicate reward prevented** (open DevTools) if a repeat is attempted.
- After refresh, the solved panel stays and points are not re-awarded.
### HackMe integration (authoritative score + leaderboard)

When a student uses **Start Lab** in the HackMe app, the browser opens the game with a URL like:

`http://localhost:4011/?labId=40&token=…`

The lab calls HackMe’s **`POST …/server/controllers/labs/labs_api/lab_solved.php`** with `{ "lab_id": 40, "token": "…" }` right after the first local exploit success. That is the same flow as other external labs: points and submissions go through the main platform (see `lab_completion_helper.php`).

- If there is **no** `token` in the query string (e.g. opening the game directly), local scoring still works, but the success panel tells the user to start from HackMe to sync the account.
- **Vite / Docker build:** set `VITE_HACKME_BASE` to your HackMe origin (default `http://localhost/HackMe`). Static pages can set `window.__HACKME_BASE__` to override the base URL.

## Run with Docker

From `hack-the-sudoku`:

```bash
docker compose up --build
```

Then open the web UI (Compose maps the container to **port 4011**):

- **http://localhost:4011**

`docker-compose.yml` also defines a `backend` service (port 8080) for hints/validation; wire your own API to match, or use the app without it for pure client-only training.

## API Endpoints

- `POST /api/validate` -> always returns `isValid: false`
- `GET /api/hint` -> returns misleading hint text
- `GET /api/secret` -> hidden-style endpoint with base64 clue
- `GET /api/docker-debug` -> intentionally exposed debug info

## Cybersecurity Lab Intent

This game is intentionally insecure for educational use:

- Client-side trust issues (localStorage controls win state)
- Hidden runtime functions callable from DevTools
- Encoded clue using `atob()`
- Disabled UI control that can be manipulated in DevTools
- Fake anti-cheat that can be bypassed

## Objective: Hack the Game

Possible win paths include:

1. Modify `localStorage`:
   - Set `sudokuSolved` to `"true"`
2. Call hidden function from DevTools:
   - `winGame()`
3. Discover and decode secret endpoint:
   - `GET /api/secret` then decode `encodedSolution`
4. Bypass anti-cheat:
   - Set `localStorage.bypassAntiCheat = "true"` or override runtime flag

## Guided Hints

- "The solution is not in the grid."
- "Trust nothing on the client side."
- "Check your browser tools."
- "If normal gameplay fails forever, inspect runtime behavior."
- "Do not ignore Docker/service debug surfaces."

## Success Condition

When exploited correctly, the app shows:

`You didn’t solve Sudoku… you exploited it.`

---

For training environments, this lab should be deployed in isolation and used only for defensive education and secure coding awareness.
