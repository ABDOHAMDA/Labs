# Cyber Event Backend

Two isolated Node.js services connected through API events.

## Services

- `lab-service` (port `5000`)
  - `GET /api/game-config`
  - `POST /api/lab/complete`
- `main-platform` (port `4000`)
  - `POST /api/events`
  - `GET /api/users/:userId`

## Run locally

### Option A: Docker Compose

```bash
docker compose up --build
```

### Option B: Node directly

```bash
cd main-platform && npm install && npm start
cd lab-service && npm install && npm start
```

## Example flow

1. Solve lab:

```bash
curl -X POST http://localhost:5000/api/lab/complete \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"u1\",\"labId\":\"level-3\"}"
```

2. Check user points:

```bash
curl http://localhost:4000/api/users/u1
```

3. Re-submit same lab (no duplicate points):

```bash
curl -X POST http://localhost:5000/api/lab/complete \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"u1\",\"labId\":\"level-3\"}"
```
