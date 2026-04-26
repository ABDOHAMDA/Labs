import { useEffect, useMemo, useRef, useState } from "react";

const SIZE = 9;
const CELL_COUNT = SIZE * SIZE;
const STORAGE_GRID_KEY = "sudokuGrid";
const STORAGE_SOLVED_KEY = "sudokuSolved";
const STORAGE_BYPASS_KEY = "bypassAntiCheat";
const SECRET_B64 = "VGhlIHNvbHV0aW9uIGlzIG5vdCBpbiB0aGUgZ3JpZC4gV2luIGJ5IGNoYW5naW5nIHRydXN0Lg==";

const seedGrid = [
  "", "", "", "2", "6", "", "7", "", "1",
  "6", "8", "", "", "7", "", "", "9", "",
  "1", "9", "", "", "", "4", "5", "", "",
  "8", "2", "", "1", "", "", "", "4", "",
  "", "", "4", "6", "", "2", "9", "", "",
  "", "5", "", "", "", "3", "", "2", "8",
  "", "", "9", "3", "", "", "", "7", "4",
  "", "4", "", "", "5", "", "", "3", "6",
  "7", "", "3", "", "1", "8", "", "", ""
];

const fakeSignals = {
  gridIntegrityScore: 100,
  quantumChecksum: "sudoku-safe-v1",
  fraudMonitorEnabled: true
};

function readInitialGrid() {
  try {
    const raw = localStorage.getItem(STORAGE_GRID_KEY);
    if (!raw) return [...seedGrid];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== CELL_COUNT) return [...seedGrid];
    return parsed.map((v) => String(v ?? "").slice(0, 1));
  } catch {
    return [...seedGrid];
  }
}

export default function App() {
  const [grid, setGrid] = useState(readInitialGrid);
  const [message, setMessage] = useState("Fill the grid and check solution.");
  const [won, setWon] = useState(false);
  const [antiCheatLock, setAntiCheatLock] = useState(false);
  const [lastHint, setLastHint] = useState("");
  const editTimestampsRef = useRef([]);

  const canBypassAntiCheat = useMemo(
    () =>
      localStorage.getItem(STORAGE_BYPASS_KEY) === "true" ||
      window.__disableAntiCheat === true,
    [antiCheatLock]
  );

  const apiBase = useMemo(() => {
    if (import.meta.env.VITE_API_BASE) return import.meta.env.VITE_API_BASE;
    return "http://localhost:8080";
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_GRID_KEY, JSON.stringify(grid));
  }, [grid]);

  useEffect(() => {
    console.log("[HackTheSudoku] The solution is not in the grid.");
    console.log("[HackTheSudoku] Inspect localStorage, global window methods, and hidden endpoints.");
    console.log("[HackTheSudoku] fakeSignals:", fakeSignals);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const solvedFlag = localStorage.getItem(STORAGE_SOLVED_KEY);
      if (solvedFlag === "true") {
        internalWin("localStorage trust chain accepted.");
      }
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    window.winGame = () => internalWin("winGame() was called from runtime.");
    window.getEncodedSudokuSecret = () => SECRET_B64;
    window.__unlockWithSecret = (decodedText) => {
      if (String(decodedText).toLowerCase().includes("solution is not in the grid")) {
        internalWin("secret decoder accepted your token.");
      } else {
        setMessage("Secret token rejected.");
      }
    };
    return () => {
      delete window.winGame;
      delete window.getEncodedSudokuSecret;
      delete window.__unlockWithSecret;
    };
  }, []);

  function internalWin(reason) {
    setWon(true);
    setMessage(`Access granted: ${reason}`);
    localStorage.setItem(STORAGE_SOLVED_KEY, "true");
  }

  function onCellChange(index, value) {
    const digit = value.replace(/[^1-9]/g, "").slice(0, 1);
    setGrid((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    const now = Date.now();
    editTimestampsRef.current = editTimestampsRef.current.filter((t) => now - t < 3000);
    editTimestampsRef.current.push(now);
    if (editTimestampsRef.current.length > 20) {
      setAntiCheatLock(true);
      setTimeout(() => setAntiCheatLock(false), 5000);
      setMessage("Anti-cheat: too many edits detected.");
    }
  }

  async function checkSolution() {
    if (antiCheatLock && !canBypassAntiCheat) {
      setMessage("Check is temporarily disabled by anti-cheat.");
      return;
    }

    try {
      const payload = grid.map((v) => Number(v || 0));
      const response = await fetch(`${apiBase}/api/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grid: payload })
      });
      const data = await response.json();

      if (data?.isValid === true && false) {
        internalWin("unexpected valid path");
      } else {
        setMessage(data?.message || "Invalid solution. Try again.");
      }
    } catch {
      setMessage("Backend unreachable. Maybe this is a clue.");
    }
  }

  async function fetchHint() {
    try {
      const response = await fetch(`${apiBase}/api/hint`);
      const data = await response.json();
      setLastHint(data?.hint || "No hint available.");
      setMessage(data?.message || "Hint loaded.");
    } catch {
      setMessage("No hint from server.");
    }
  }

  async function trySecretEndpoint() {
    try {
      const response = await fetch(`${apiBase}/api/secret`);
      const data = await response.json();
      if (data?.encodedSolution) {
        const decoded = atob(data.encodedSolution);
        setMessage(`Decoded clue: ${decoded}`);
      } else {
        setMessage("No secret found.");
      }
    } catch {
      setMessage("Secret endpoint not found.");
    }
  }

  if (won) {
    return (
      <main className="screen">
        <section className="card success">
          <h1>Hack The Sudoku</h1>
          <p className="subtitle">You did not solve Sudoku... you exploited it.</p>
          <p className="message">{message}</p>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(STORAGE_SOLVED_KEY);
              setWon(false);
              setMessage("Session reset. Challenge again.");
            }}
          >
            Reset Challenge
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="screen">
      <section className="card">
        <h1>Hack The Sudoku</h1>
        <p className="subtitle">Looks like Sudoku. Plays like a CTF lab.</p>
        <div className="grid">
          {grid.map((value, idx) => (
            <input
              key={idx}
              className="cell"
              value={value}
              onChange={(e) => onCellChange(idx, e.target.value)}
              inputMode="numeric"
              maxLength={1}
            />
          ))}
        </div>
        <div className="actions">
          <button type="button" onClick={checkSolution}>
            Check Solution
          </button>
          <button type="button" onClick={fetchHint}>
            Request Hint
          </button>
          <button type="button" onClick={trySecretEndpoint}>
            Probe Secret
          </button>
          <button type="button" disabled title="Restricted by internal policy">
            Admin Override
          </button>
        </div>
        <p className="message">{message}</p>
        {lastHint && <p className="hint">Hint: {lastHint}</p>}
      </section>
    </main>
  );
}
