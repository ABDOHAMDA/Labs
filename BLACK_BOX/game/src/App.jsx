import React, { useEffect, useMemo, useRef, useState } from "react";

const LAB_FLAG = "FLAG{FROGGER_DEVTOOLS_OVERRIDE}";
const HACKME_API_BASE =
  window.location.protocol + "//" + window.location.hostname + "/HackMe/server/api";

const GAME = {
  width: 680,
  height: 420,
  laneHeight: 56,
  lanes: 6,
  playerSize: 26,
};

const startPos = {
  x: GAME.width / 2 - GAME.playerSize / 2,
  y: GAME.height - GAME.playerSize - 12,
};

function createCars(speed) {
  const cars = [];
  for (let lane = 0; lane < GAME.lanes; lane += 1) {
    for (let i = 0; i < 4; i += 1) {
      cars.push({
        id: `${lane}-${i}`,
        lane,
        x: 50 + i * 190,
        y: lane * GAME.laneHeight + 10,
        w: 160,
        h: 34,
        dir: lane % 2 === 0 ? 1 : -1,
        speed,
      });
    }
  }
  return cars;
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function SuccessModal({ level, onNext }) {
  return (
    <div className="overlay">
      <div className="modal">
        <h3>Lab Solved!</h3>
        <p>You successfully hacked the system.</p>
        <div className="points">+150 Points</div>
        <button type="button" onClick={onNext}>
          {level === 3 ? "Next Level" : "Finish"}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [accessState, setAccessState] = useState("checking");
  const [labSession, setLabSession] = useState({ labId: null, token: null, userId: null });

  const [level, setLevel] = useState(3);
  const [score, setScore] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [speed, setSpeed] = useState(10);
  const [player, setPlayer] = useState(startPos);
  const [cars, setCars] = useState(() => createCars(10));
  const [resetKey, setResetKey] = useState(0);
  const rafRef = useRef(null);

  const hint = useMemo(
    () =>
      level === 3
        ? "The game settings are not stored locally. Observe how data is loaded."
        : "The browser may store useful data. Check what is saved.",
    [level]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const labId = params.get("labId");
    const token = params.get("token");
    if (!labId || !token) {
      setAccessState("denied");
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
          setAccessState("denied");
        }
      } catch (_) {
        setAccessState("denied");
      }
    };
    check();
  }, []);

  useEffect(() => {
    if (level === 3) {
      fetch("http://localhost:5000/api/game-config", { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          const value = Number(data?.carSpeed);
          setSpeed(Number.isFinite(value) ? value : 10);
        })
        .catch(() => setSpeed(10));
      return;
    }
    let value = localStorage.getItem("gameSpeed");
    if (!value) {
      localStorage.setItem("gameSpeed", "10");
      value = "10";
    }
    const parsed = Number(value);
    setSpeed(Number.isFinite(parsed) ? parsed : 10);
  }, [level]);

  useEffect(() => {
    setPlayer(startPos);
    setCars(createCars(speed));
  }, [speed, resetKey]);

  useEffect(() => {
    const onKey = (e) => {
      const key = e.key.toLowerCase();
      const step = 22;
      setPlayer((prev) => {
        let nextX = prev.x;
        let nextY = prev.y;
        if (key === "arrowleft" || key === "a") nextX -= step;
        if (key === "arrowright" || key === "d") nextX += step;
        if (key === "arrowup" || key === "w") nextY -= step;
        if (key === "arrowdown" || key === "s") nextY += step;
        return {
          x: Math.max(0, Math.min(nextX, GAME.width - GAME.playerSize)),
          y: Math.max(0, Math.min(nextY, GAME.height - GAME.playerSize)),
        };
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const tick = () => {
      setCars((prev) =>
        prev.map((car) => {
          let next = car.x + car.speed * car.dir;
          if (car.dir > 0 && next > GAME.width + car.w) next = -car.w;
          if (car.dir < 0 && next < -car.w) next = GAME.width + car.w;
          return { ...car, x: next };
        })
      );
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const box = { x: player.x, y: player.y, w: GAME.playerSize, h: GAME.playerSize };
    const collided = cars.some((car) => overlap(box, { x: car.x, y: car.y, w: car.w, h: car.h }));
    if (collided) {
      setPlayer(startPos);
      return;
    }
    if (player.y <= 0) {
      setShowModal(true);
      setScore((prev) => prev + 150);
      setPlayer(startPos);
    }
  }, [cars, player]);

  const submitSolved = async () => {
    const { labId, token, userId } = labSession;
    if (!labId || !token) return;
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
      const data = await res.json().catch(() => ({}));
      const points = data?.message === "FLAG_CAPTURED" ? Number(data?.points ?? 150) : 0;
      if (window.opener) {
        window.opener.postMessage({ type: "HACKME_LAB_SOLVED", labId: Number(labId), points }, "*");
        window.opener.postMessage({ type: "LAB_SOLVED", labId: Number(labId) }, "*");
      }
    } catch (_) {}
  };

  const onModalAction = async () => {
    setShowModal(false);
    if (level === 3) {
      setLevel(4);
      setResetKey((v) => v + 1);
      return;
    }
    await submitSolved();
  };

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
        <h1>Frogger Cyber Lab - Level {level}</h1>
        <div className="score">Score: {score}</div>
      </header>

      <main className="game" style={{ width: GAME.width, height: GAME.height }}>
        {Array.from({ length: GAME.lanes }, (_, lane) => (
          <div
            key={`lane-${lane}`}
            className="lane"
            style={{ top: lane * GAME.laneHeight, height: GAME.laneHeight }}
          />
        ))}
        <div className="goal" />
        {cars.map((car) => (
          <div
            key={car.id}
            className="car"
            style={{ left: car.x, top: car.y, width: car.w, height: car.h }}
          />
        ))}
        <div className="player" style={{ left: player.x, top: player.y }} />
      </main>

      <aside className="hint">
        <strong>Hint:</strong> {hint}
      </aside>

      {showModal && <SuccessModal level={level} onNext={onModalAction} />}
    </div>
  );
}
