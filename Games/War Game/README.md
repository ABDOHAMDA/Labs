# War Game (Lab 30)

This lab is part of the `Games` Docker app (port **4005**).

## Idea

- Choose a side:
  - **Red Team**: exploit vulnerabilities to score points.
  - **Blue Team**: patch vulnerabilities / arm traps before the attacker exploits.
- Game duration: **2 minutes**.
- Vulnerabilities simulated:
  - **XSS**
  - **SQL Injection**
  - **Broken Access Control (IDOR)**

## Run

From `Labs/Games/War Game`:

```bash
docker compose up --build
```

Open:

- `http://localhost:4005`

Then pick **War Game (Lab 30)** from the top tabs.

