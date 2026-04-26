/**
 * localStorage-based scoring. Weak on purpose (training lab).
 * Duplicate awards blocked via lab_sudoku_solved.
 */
import { SUDOKU_LAB_CONFIG } from "./labConfig.js";

function getNum(key, def) {
  const n = parseInt(localStorage.getItem(key) || String(def), 10);
  return isNaN(n) ? def : n;
}

export function recomputeTotalFromParts() {
  const keys = Object.keys(localStorage);
  let sum = 0;
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].indexOf("score_") === 0) {
      sum += getNum(keys[i], 0);
    }
  }
  return sum;
}

export function getTotalScore() {
  const k = SUDOKU_LAB_CONFIG.storage.totalScore;
  const t = getNum(k, 0);
  if (t > 0) return t;
  return recomputeTotalFromParts();
}

function setTotalScore(n) {
  localStorage.setItem(SUDOKU_LAB_CONFIG.storage.totalScore, String(n));
}

/**
 * @returns {{ awarded: boolean, points: number, total: number, duplicate: boolean, reason: string }}
 */
export function awardSudokuIfEligible(method) {
  const cfg = SUDOKU_LAB_CONFIG;
  const labKey = cfg.storage.labSolved;
  if (localStorage.getItem(labKey) === "true") {
    console.log("%c[Lab] Duplicate reward prevented", "color:#f59e0b");
    return { awarded: false, points: 0, total: getTotalScore(), duplicate: true, reason: "already_scored" };
  }

  localStorage.setItem(labKey, "true");
  const pts = cfg.points;
  localStorage.setItem(cfg.storage.labScore, String(pts));
  if (localStorage.getItem(cfg.storage.legacySolved) !== "true")
    localStorage.setItem(cfg.storage.legacySolved, "true");

  const newTotal = getTotalScore() + pts;
  setTotalScore(newTotal);

  return { awarded: true, points: pts, total: newTotal, duplicate: false, reason: "first_solve" };
}

export function hasSudokuProgress() {
  const cfg = SUDOKU_LAB_CONFIG;
  return (
    localStorage.getItem(cfg.storage.labSolved) === "true" ||
    localStorage.getItem(cfg.storage.legacySolved) === "true"
  );
}

/** For "Reset challenge" in UI — re-opens the lab and removes this lab’s points from total. */
export function resetSudokuLabForReplay() {
  const cfg = SUDOKU_LAB_CONFIG;
  const pts = getNum(cfg.storage.labScore, 0);
  if (pts > 0) {
    const cur = getTotalScore();
    setTotalScore(Math.max(0, cur - pts));
  }
  localStorage.removeItem(cfg.storage.labSolved);
  localStorage.removeItem(cfg.storage.labScore);
  localStorage.removeItem(cfg.storage.legacySolved);
  try {
    localStorage.removeItem("sudoku_method_label");
    localStorage.removeItem("sudoku_hackme_last");
  } catch {
    /* */
  }
}

if (typeof window !== "undefined") {
  window.SudokuScoring = {
    getTotalScore,
    awardSudokuIfEligible,
    recomputeTotalFromParts,
    hasSudokuProgress
  };
}
