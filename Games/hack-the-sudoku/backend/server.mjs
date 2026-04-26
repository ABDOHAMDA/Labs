/**
 * Minimal mock API for the Hack The Sudoku lab (training only).
 * Matches what the Vite app calls at VITE_API_BASE.
 */
import http from "node:http";
import { URL } from "node:url";

const port = Number(process.env.PORT) || 8080;

const json = (res, status, body) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
  });
  res.end(JSON.stringify(body));
};

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
    });
    return res.end();
  }

  const base = `http://127.0.0.1:${port}`;
  let pathname;
  try {
    pathname = new URL(req.url, base).pathname;
  } catch {
    return json(res, 400, { error: "bad request" });
  }

  if (req.method === "GET" && pathname === "/api/hint") {
    return json(res, 200, {
      hint: "The grid is a distraction. Who decides “solved” on the client?",
      message: "Hint loaded."
    });
  }

  if (req.method === "GET" && pathname === "/api/secret") {
    const line = "The solution is not in the grid. Win by changing trust.";
    return json(res, 200, { encodedSolution: Buffer.from(line, "utf8").toString("base64") });
  }

  if (req.method === "GET" && pathname === "/api/docker-debug") {
    return json(res, 200, {
      message: "Intentional debug surface for training; lock down in production.",
      processEnvHint: "COMPOSE_HINT is set in Docker if you read env"
    });
  }

  if (req.method === "POST" && pathname === "/api/validate") {
    let body = "";
    req.on("data", (c) => {
      body += c;
    });
    return req.on("end", () => {
      // Intentionally never validates as a real Sudoku win (exploit the client instead).
      return json(res, 200, { isValid: false, message: "Invalid solution. Try again." });
    });
  }

  if (req.method === "POST" && pathname === "/api/submit-solution") {
    return json(res, 200, { success: true, scoreAwarded: 100 });
  }

  return json(res, 404, { error: "not found" });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`[hack-the-sudoku] mock API listening on :${port}`);
});
