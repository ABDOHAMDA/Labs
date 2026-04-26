/**
 * Return flow when the lab was opened via HackMe's window.open(…, "hackme_lab_…").
 * Cross-port (e.g. :4011 vs :80) means we cannot set opener.location; we still try close() + focus() + new navigation fallback.
 */
import { getHackMeBase } from "./hackmeClient.js";

export function getHackMeLabsUrl() {
  return `${getHackMeBase()}/labs`;
}

export function returnToHackMeFromLab() {
  const target = getHackMeLabsUrl();
  try {
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage(
          { source: "hack-the-sudoku", event: "lab-finished" },
          "*"
        );
      } catch {
        /* */
      }
      try {
        window.opener.focus();
      } catch {
        /* */
      }
    }
  } catch {
    /* */
  }
  try {
    window.close();
  } catch {
    /* */
  }
  setTimeout(() => {
    try {
      if (!window.closed) {
        window.location.assign(target);
      }
    } catch {
      /* */
    }
  }, 250);
}
