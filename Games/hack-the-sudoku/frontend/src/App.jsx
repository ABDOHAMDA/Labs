import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SUDOKU_LAB_CONFIG } from "@lab/labConfig.js";
import { formatHackmeSummary, readStoredHackMeResult } from "@lab/hackmeClient.js";
import { returnToHackMeFromLab } from "@lab/navHackMe.js";
import { getTotalScore, resetSudokuLabForReplay } from "@lab/scoring.js";
import { recordSolve } from "@lab/useLabProgress.js";
import "./App.css";

const SIZE = 9;
const CELL_COUNT = SIZE * SIZE;
const STORAGE_GRID_KEY = "sudokuGrid";
const STORAGE_SOLVED_KEY = "sudokuSolved";
const STORAGE_BYPASS_KEY = "bypassAntiCheat";

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

function reasonToMethod(reason) {
  const s = String(reason).toLowerCase();
  if (s.includes("localstorage") || s.includes("trust chain (migration)")) return "localStorage";
  if (s.includes("setsudokustate") || s.includes("injection") || s.includes("injected") || s.includes("state inj"))
    return "injection";
  if (s.includes("secret") && s.includes("decoder")) return "injection";
  if (s.includes("wingame") || s.includes("runtime") || s.includes("called from")) return "winGame";
  return "winGame";
}

export default function App() {
  const [grid, setGrid] = useState(readInitialGrid);
  const [message, setMessage] = useState("Fill the grid and check solution.");
  const [won, setWon] = useState(false);
  const [labRec, setLabRec] = useState(null);
  const [antiCheatLock, setAntiCheatLock] = useState(false);
  const [lastHint, setLastHint] = useState("");
  const editTimestampsRef = useRef([]);

  const handledRef = useRef(false);

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

  const handleExploitWin = useCallback(async (reason) => {
    if (handledRef.current) return;
    handledRef.current = true;
    const m = reasonToMethod(reason);
    const rec = await recordSolve({ method: m });
    setLabRec(rec);
    setWon(true);
    setMessage(`Access granted: ${reason}`);
    try {
      localStorage.setItem(STORAGE_SOLVED_KEY, "true");
    } catch {
      /* */
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem(SUDOKU_LAB_CONFIG.storage.labSolved) === "true") {
      handledRef.current = true;
      setWon(true);
      setLabRec({
        methodLabel: (() => {
          try {
            return localStorage.getItem("sudoku_method_label");
          } catch {
            return null;
          }
        })() || "— (restored)",
        duplicate: true,
        total: getTotalScore(),
        hackme: readStoredHackMeResult() || { skipped: true, syncAttempted: false }
      });
      return;
    }
    if (localStorage.getItem(STORAGE_SOLVED_KEY) === "true") {
      void handleExploitWin("localStorage trust chain (legacy migration).");
    }
  }, [handleExploitWin]);

  useEffect(() => {
    localStorage.setItem(STORAGE_GRID_KEY, JSON.stringify(grid));
  }, [grid]);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.debug("[HackTheSudoku] Training hints: check localStorage, window (e.g. winGame), and the mock API.");
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (handledRef.current) return;
      if (localStorage.getItem(STORAGE_SOLVED_KEY) === "true") {
        handleExploitWin("localStorage trust chain accepted.");
        return;
      }
      if (window.__SUDOKU_SOLUTION_INJECTED) {
        handleExploitWin("State injection accepted (internal flag).");
      }
    }, 500);
    return () => clearInterval(interval);
  }, [handleExploitWin]);

  useEffect(() => {
    const onExploit = (e) => {
      const d = e && e.detail;
      if (!d || !d.kind) return;
      if (d.kind === "winGame") {
        void handleExploitWin(d.reason || "winGame()");
        return;
      }
      if (d.kind === "setSudokuState" && Array.isArray(d.grid) && d.grid.length === 81) {
        setGrid(d.grid.map((v) => String(v ?? "").slice(0, 1)));
        window.__SUDOKU_SOLUTION_INJECTED = true;
        void handleExploitWin("setSudokuState: full state injection (logic bypass).");
        return;
      }
      if (d.kind === "unlock") {
        if (String(d.text).toLowerCase().includes("solution is not in the grid")) {
          void handleExploitWin("secret decoder accepted your token.");
        } else {
          setMessage("Secret token rejected.");
        }
      }
    };
    window.addEventListener("hackme-sudoku-exploit", onExploit);
    return () => window.removeEventListener("hackme-sudoku-exploit", onExploit);
  }, [handleExploitWin]);

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
        handleExploitWin("unexpected valid path");
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

  function onResetPlatform() {
    resetSudokuLabForReplay();
    setGrid([...seedGrid]);
    setWon(false);
    setLabRec(null);
    handledRef.current = false;
    setMessage("Session reset. Challenge again.");
  }

  if (won) {
    const total = getTotalScore();
    const method =
      (labRec && labRec.methodLabel) ||
      (() => {
        try {
          return localStorage.getItem("sudoku_method_label");
        } catch {
          return "—";
        }
      })() ||
      "—";
    const dup = labRec && labRec.duplicate;
    const hm = (labRec && labRec.hackme) || readStoredHackMeResult() || { skipped: true, syncAttempted: false };
    const hackmeLine = formatHackmeSummary(hm);
    return (
      <div className="app-shell">
        <header className="head-line">
          <span className="lab-id">{SUDOKU_LAB_CONFIG.id}</span>
          <span className="lab-badge">{SUDOKU_LAB_CONFIG.badge}</span>
          <span className="lab-diff">{SUDOKU_LAB_CONFIG.difficulty}</span>
        </header>
        <main className="screen">
          <section className="solved-card pop-in" role="status">
            <p className="solved-ribbon"> Lab Solved</p>
            <p className="solved-sub">You didn’t solve Sudoku… you exploited it.</p>
            <p className="method-row">
              Method: <strong>{method}</strong>
            </p>


            {hackmeLine.text && (
              <p className={hackmeLine.className} role="status">
                {hackmeLine.text}
              </p>
            )}
            <p className="lab-meta-tiny">
              {SUDOKU_LAB_CONFIG.id} · {SUDOKU_LAB_CONFIG.difficulty}
            </p>
            <div className="solved-actions">
              <button type="button" className="next-lab" onClick={() => returnToHackMeFromLab()}>
                Next Lab
              </button>
            </div>
            <p className="solved-note">Returns to the HackMe labs list (or closes this tab if you opened the lab with Start Lab).</p>
            <button type="button" className="reset-outline" onClick={onResetPlatform}>
              Reset challenge
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="head-line">
        <span className="lab-id">{SUDOKU_LAB_CONFIG.id}</span>
        <span className="lab-badge">{SUDOKU_LAB_CONFIG.badge}</span>
        <span className="lab-diff">{SUDOKU_LAB_CONFIG.difficulty}</span>
      </header>
      <main className="screen">
        <section className="card">
          <h1>{SUDOKU_LAB_CONFIG.title}</h1>
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
    </div>
  );
}
