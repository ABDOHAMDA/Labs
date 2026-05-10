/**
 * Sync local exploit win with HackMe (POST server/api/labs/lab_solved.php).
 * When the student clicks "Start Lab", HackMe opens: ?labId=40&token=...
 */
import { SUDOKU_LAB_CONFIG } from "./labConfig.js";

const LS_HACKME = "sudoku_hackme_last";

export function getHackMeBase() {
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_HACKME_BASE) {
    return String(import.meta.env.VITE_HACKME_BASE).replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.__HACKME_BASE__) {
    return String(window.__HACKME_BASE__).replace(/\/$/, "");
  }
  return "http://localhost/HackMe";
}

export function readLaunchContext() {
  if (typeof window === "undefined" || !window.location) {
    return { baseUrl: getHackMeBase(), labId: 0, token: "" };
  }
  const p = new URLSearchParams(window.location.search);
  let labId = Number(p.get("labId") || p.get("lab_id") || 0);
  const token = (p.get("token") || "").trim();
  const deviceBind = (p.get("device_bind") || "").trim();
  const macAddress = (p.get("mac_address") || "").trim();
  const clientLocalIp = (p.get("client_local_ip") || "").trim();
  const def = SUDOKU_LAB_CONFIG.hackme?.defaultLabId ?? 40;
  if (labId < 1 && token) labId = def;
  return { baseUrl: getHackMeBase(), labId, token, deviceBind, macAddress, clientLocalIp };
}

// readStoredHackMeResult removed - frontend is now stateless between sessions.
export function readStoredHackMeResult() {
  return null;
}

/**
 * @returns {Promise<{
 *   syncAttempted: boolean,
 *   skipped?: boolean,
 *   skipReason?: string,
 *   userHint?: string,
 *   ok?: boolean,
 *   message?: string,
 *   pointsEarned?: number,
 *   alreadyOnServer?: boolean
 * }>}
 */
export async function syncHackMeAfterLocalSolve() {
  const { baseUrl, labId, token, deviceBind, macAddress, clientLocalIp } = readLaunchContext();
  if (labId < 1 || !token) {
    return {
      syncAttempted: false,
      skipped: true,
      skipReason: "not_from_hackme",
      userHint: "Start this lab from HackMe (Start Lab) so the URL includes your token — then this window will add points to your HackMe account."
    };
  }
  const url = `${baseUrl}/server/controllers/labs/labs_api/lab_solved.php`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lab_id: labId,
        token,
        device_bind: deviceBind,
        mac_address: macAddress,
        client_local_ip: clientLocalIp
      })
    });
    const data = await res.json().catch(() => ({}));
    const ok = res.ok && data.success;
    const pts = (data.data && data.data.points_earned) != null ? Number(data.data.points_earned) : 0;
    const msg = String(data.message || "");
    const already = msg === "LAB_ALREADY_SOLVED" || (data.data && (data.data.already_solved === true));

    return {
      syncAttempted: true,
      ok,
      message: msg,
      pointsEarned: pts,
      alreadyOnServer: already
    };
  } catch (e) {
    return {
      syncAttempted: true,
      ok: false,
      message: (e && e.message) || "Network error",
      pointsEarned: 0
    };
  }
}

export function formatHackmeSummary(h) {
  if (!h) return { className: "hackme-line muted", text: "" };
  if (h.skipReason === "not_from_hackme" || (h.skipped && !h.syncAttempted)) {
    return {
      className: "hackme-line muted",
      text: h.userHint || "HackMe: start this lab from the HackMe platform to link your solve and update your score."
    };
  }
  if (h.message === "LAB_ALREADY_SOLVED" || h.alreadyOnServer) {
    return {
      className: "hackme-line ok",
      text: "HackMe: this lab is already on your account — no duplicate points."
    };
  }
  if (h.ok) {
    const n = h.pointsEarned != null ? h.pointsEarned : h.points;
    return {
      className: "hackme-line ok",
      text: `HackMe: +${n || 0} points applied on the platform. Check your dashboard / leaderboard.`
    };
  }
  if (h.syncAttempted) {
    return {
      className: "hackme-line warn",
      text: `HackMe: could not sync (${h.message || "error"}). If your token expired, use Start Lab in HackMe again.`
    };
  }
  return { className: "hackme-line muted", text: "HackMe: —" };
}
