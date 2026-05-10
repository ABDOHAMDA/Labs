/**
 * Lab progress: detect labels for exploit paths and call scoring.
 */
import { SUDOKU_LAB_CONFIG } from "./labConfig.js";
import { awardSudokuIfEligible, getTotalScore } from "./scoring.js";
import { readStoredHackMeResult, syncHackMeAfterLocalSolve } from "./hackmeClient.js";

export function methodFromContext(ctx) {
  if (ctx === "localStorage") return "localStorage manipulation";
  if (ctx === "winGame" || ctx === "runtime") return "runtime override";
  if (ctx === "injection" || ctx === "inject") return "logic bypass";
  return "exploit";
}

/**
 * @param { { method?: string } } detail
 * @returns {Promise<{ ok: boolean, methodLabel: string, pointsThisLab: number, total: number, duplicate: boolean, awarded: boolean, hackme: object }>}
 */
export async function recordSolve(detail) {
  const m = (detail && detail.method) || "runtime";
  const label = methodFromContext(m);
  let ctx = m;
  if (m === "localStorage manipulation") ctx = "localStorage";
  if (m === "runtime override") ctx = "winGame";
  if (m === "logic bypass") ctx = "injection";

  const r = awardSudokuIfEligible(ctx);

  let hackme = { skipped: true, syncAttempted: false };
  if (r.awarded) {
    hackme = await syncHackMeAfterLocalSolve();
  } else {
    const prev = readStoredHackMeResult();
    if (prev) {
      hackme = { ...prev, syncAttempted: true, skipped: false };
    }
  }

  return {
    ok: true,
    methodLabel: label,
    pointsThisLab: r.points,
    total: r.total != null ? r.total : getTotalScore(),
    duplicate: r.duplicate,
    awarded: !!r.awarded,
    hackme
  };
}

export function isSolved() {
  return false;
}

export function snapshot() {
  return {
    labId: SUDOKU_LAB_CONFIG.id,
    badge: SUDOKU_LAB_CONFIG.badge,
    difficulty: SUDOKU_LAB_CONFIG.difficulty,
    totalScore: getTotalScore()
  };
}

if (typeof window !== "undefined") {
  window.SudokuLabProgress = { recordSolve, isSolved, snapshot, methodFromContext };
}
// Note: recordSolve is async; await it from DevTools: await SudokuLabProgress.recordSolve({ method: "winGame" })
