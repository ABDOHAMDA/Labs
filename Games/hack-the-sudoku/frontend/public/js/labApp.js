/**
 * Hack The Sudoku — linked from index.html (inspect Elements to see: script type=module src="/js/labApp.js")
 * The React UI loads from the Vite bundle; this file is where window hooks are defined for the lab.
 */
const EVT = "hackme-sudoku-exploit";

function emit(detail) {
  window.dispatchEvent(new CustomEvent(EVT, { detail }));
}

function winGame() {
  emit({ kind: "winGame", reason: "winGame() from js/labApp.js" });
}

window.winGame = winGame;
window.getEncodedSudokuSecret = function getEncodedSudokuSecret() {
  return "VGhlIHNvbHV0aW9uIGlzIG5vdCBpbiB0aGUgZ3JpZC4gV2luIGJ5IGNoYW5naW5nIHRydXN0Lg==";
};

window.setSudokuState = function setSudokuState(arr) {
  if (Array.isArray(arr) && arr.length === 81) {
    emit({ kind: "setSudokuState", grid: arr });
  }
};

window.__unlockWithSecret = function __unlockWithSecret(decodedText) {
  emit({ kind: "unlock", text: String(decodedText) });
};

console.debug("%c[Lab] js/labApp.js", "color:#3fb950", "— window.winGame, getEncodedSudokuSecret, setSudokuState, __unlockWithSecret");
