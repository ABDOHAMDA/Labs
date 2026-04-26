# Hack The Sudoku

`Hack The Sudoku` is a cybersecurity training lab disguised as a Sudoku game.

The UI looks like a normal puzzle, but the challenge is intentionally vulnerable and intentionally unwinnable through normal play.  
Your objective is to **hack the game**, not solve Sudoku mathematically.

## Stack

- Frontend: React + Vite
- Backend: .NET 8 Minimal Web API
- Database: none (in-memory style behavior)
- Containerization: Docker + Docker Compose

## Project Structure

```text
hack-the-sudoku/
  frontend/
  backend/
  docker-compose.yml
  README.md
```

## Run with Docker

From `hack-the-sudoku`:

```bash
docker compose up --build
```

Then open:

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:8080](http://localhost:8080)

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

`You did not solve Sudoku... you exploited it.`

---

For training environments, this lab should be deployed in isolation and used only for defensive education and secure coding awareness.
