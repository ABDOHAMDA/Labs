/**
 * localStorage-based scoring. Weak on purpose (training lab).
 * Duplicate awards blocked via lab_sudoku_solved.
 */
import { SUDOKU_LAB_CONFIG } from "./labConfig.js";

function getNum(key, def) {
  return def;
}

export function recomputeTotalFromParts() {
  return 0;
}

export function getTotalScore() {
  return 0;
}

function setTotalScore(n) {
  // Stateless: no persistence
}

/**
 * @returns {{ awarded: boolean, points: number, total: number, duplicate: boolean, reason: string }}
 */
export function awardSudokuIfEligible(method) {
  const cfg = SUDOKU_LAB_CONFIG;
  const pts = cfg.points;

  // We no longer check localStorage. We let the backend handle duplication detection.
  // Frontend will always report "awarded: true" locally for the current session's solve UI,
  // but the real truth about points/duplication comes from syncHackMeAfterLocalSolve.
  
  return { awarded: true, points: pts, total: pts, duplicate: false, reason: "session_solve" };
}

export function hasSudokuProgress() {
  return false;
}

/** For "Reset challenge" in UI — now just a no-op as reload handles it. */
export function resetSudokuLabForReplay() {
  // Stateless: no-op
}

if (typeof window !== "undefined") {
  window.SudokuScoring = {
    getTotalScore,
    awardSudokuIfEligible,
    recomputeTotalFromParts,
    hasSudokuProgress
  };
}
