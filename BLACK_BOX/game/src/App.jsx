import React, { useCallback, useEffect, useState } from "react";
import GameHud from "./components/GameHud";
import ResultModal from "./components/ResultModal";
import { GAME } from "./game/constants";
import { useFroggerEngine } from "./game/useFroggerEngine";

const LAB_FLAG = "FLAG{FROGGER_DEVTOOLS_OVERRIDE}";
const HACKME_API_BASE =
  window.location.protocol + "//" + window.location.hostname + "/HackMe/server/api";
const LAB_POINTS = 300;

export default function App() {
  const [accessState, setAccessState] = useState("checking");
  const [labSession, setLabSession] = useState({ labId: null, token: null, userId: null });

  const [submittingSolve, setSubmittingSolve] = useState(false);
  const [resultState, setResultState] = useState({ open: false, title: "", message: "", points: 0 });
  const [speed, setSpeed] = useState(10);
  const handleWin = useCallback(() => {
    setSubmittingSolve((prev) => (prev ? prev : true));
  }, []);
  const { canvasRef, hud } = useFroggerEngine({
    speedMultiplier: speed,
    onWin: handleWin,
    enabled: accessState === "granted",
  });

  const isLocalPreviewHost =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const labId = params.get("labId");
    const token = params.get("token");
    if (!labId || !token) {
      if (isLocalPreviewHost) {
        // Keep frontend visible in local dev even without HackMe launch params.
        setAccessState("granted");
        setLabSession({ labId: null, token: null, userId: 0 });
      } else {
        setAccessState("denied");
      }
      return;
    }
    const check = async () => {
      try {
        const url = `${HACKME_API_BASE}/verify_lab_token.php?token=${encodeURIComponent(token)}&lab_id=${encodeURIComponent(labId)}`;
        const res = await fetch(url);
        const data = await res.json().catch(() => ({}));
        if (data.valid) {
          setAccessState("granted");
          setLabSession({ labId, token, userId: data.user_id ?? 0 });
        } else {
          if (isLocalPreviewHost) {
            setAccessState("granted");
            setLabSession({ labId, token, userId: data.user_id ?? 0 });
          } else {
            setAccessState("denied");
          }
        }
      } catch (_) {
        if (isLocalPreviewHost) {
          setAccessState("granted");
          setLabSession({ labId, token, userId: 0 });
        } else {
          setAccessState("denied");
        }
      }
    };
    check();
  }, [isLocalPreviewHost]);

  useEffect(() => {
    fetch("http://localhost:5000/api/game-config", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const apiSpeed = Number(data?.carSpeed);
        const localRaw = window.localStorage.getItem("froggerCarSpeed");
        const localSpeed = Number(localRaw);
        const value = Number.isFinite(apiSpeed) ? apiSpeed : Number.isFinite(localSpeed) ? localSpeed : 10;
        setSpeed(value);
      })
      .catch(() => {
        const localRaw = window.localStorage.getItem("froggerCarSpeed");
        const localSpeed = Number(localRaw);
        setSpeed(Number.isFinite(localSpeed) ? localSpeed : 10);
      });
  }, []);

  const submitSolved = async () => {
    const { labId, token, userId } = labSession;
    if (!labId || !token) {
      return {
        ok: false,
        solved: false,
        points: 0,
        message: "Missing lab session. Open this lab from HackMe (Start Lab).",
      };
    }
    const payload = {
      lab_id: Number(labId),
      flag: LAB_FLAG,
      user_id: Number(userId) || 0,
      access_token: token,
    };
    try {
      const res = await fetch(`${HACKME_API_BASE}/submit_flag.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const raw = await res.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        return {
          ok: false,
          solved: false,
          points: 0,
          message: "Invalid response from HackMe.",
        };
      }

      const message = data?.message;
      const accepted =
        Boolean(data?.success) ||
        message === "FLAG_CAPTURED" ||
        message === "LAB_ALREADY_SOLVED" ||
        message === "FLAG_ALREADY_SUBMITTED";
      if (!accepted) {
        return {
          ok: false,
          solved: false,
          points: 0,
          message: data?.detail || message || `HackMe error (HTTP ${res.status})`,
        };
      }

      const isFirstTime = message === "FLAG_CAPTURED";
      const points = isFirstTime ? Number(data?.points ?? LAB_POINTS) : 0;
      const safePoints = Number.isFinite(points) && points > 0 ? points : 0;

      if (window.opener) {
        window.opener.postMessage(
          { type: "HACKME_LAB_SOLVED", labId: Number(labId), lab_id: Number(labId), points: safePoints },
          "*"
        );
        window.opener.postMessage({ type: "LAB_SOLVED", labId: Number(labId) }, "*");
      }

      return {
        ok: true,
        solved: true,
        points: safePoints,
        alreadySolved: !isFirstTime,
        message: isFirstTime ? "The lab has been solved successfully." : "You've solved this lab before. No additional points awarded.",
      };
    } catch (_) {
      return {
        ok: false,
        solved: false,
        points: 0,
        message: "Network error while contacting HackMe API.",
      };
    }
  };

  // Auto-submit solve and close the tab when player wins.
  useEffect(() => {
    if (!submittingSolve) return;
    (async () => {
      const result = await submitSolved();
      setResultState({
        open: true,
        title: result.ok ? "Lab Solved" : "Submission Failed",
        message: result.message,
        points: result.points,
      });
      setSubmittingSolve(false);
    })();
  }, [submittingSolve]);

  if (accessState === "checking") return <div className="status">Loading...</div>;
  if (accessState === "denied") {
    return (
      <div className="status denied">
        Open this lab from HackMe using Start Lab so the URL has labId and token.
      </div>
    );
  }

  return (
    <div className="page">
      <header className="top">
        <h1>Frogger Cyber Lab</h1>
        <p>
          Your goal is to cross the road safely. To make crossing possible, use DevTools to modify the
          runtime game configuration.
        </p>
      </header>

      <GameHud level={hud.level} score={hud.score} lives={hud.lives} fps={hud.fps} />

      <main className="game" style={{ width: GAME.width, height: GAME.height }} aria-label="Frogger game canvas">
        <canvas ref={canvasRef} className="gameCanvas" />
      </main>

      {resultState.open && (
        <ResultModal
          title={resultState.title}
          message={resultState.message}
          points={resultState.points}
          onClose={() => setResultState({ open: false, title: "", message: "", points: 0 })}
        />
      )}
    </div>
  );
}
