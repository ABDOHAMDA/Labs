/** Hack The Sudoku — lab metadata (intentionally client-side) */
export const SUDOKU_LAB_CONFIG = {
  id: "LAB-SUDOKU-001",
  slug: "sudoku",
  badge: "Client-Side Exploitation",
  difficulty: "Medium",
  title: "Hack The Sudoku",
  points: 150,
  /** Must match HackMe `mockData` / DB lab_id for "Hack The Sudoku" (used if URL has ?token= but no labId). */
  hackme: {
    defaultLabId: 40
  },
  storage: {
    legacySolved: "sudokuSolved",
    labSolved: "lab_sudoku_solved",
    labScore: "score_sudoku",
    totalScore: "totalScore"
  }
};

if (typeof window !== "undefined")
  window.SUDOKU_LAB_CONFIG = SUDOKU_LAB_CONFIG;
