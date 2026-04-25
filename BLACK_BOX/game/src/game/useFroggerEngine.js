import { useEffect, useRef, useState } from "react";
import { GAME, clamp, getStartPos, overlap } from "./constants";

function makeCars(speedMultiplier, level) {
  const cars = [];
  const levelBoost = 1 + (level - 1) * 0.09;
  for (let lane = 0; lane < GAME.laneCount; lane += 1) {
    const dir = lane % 2 === 0 ? 1 : -1;
    for (let i = 0; i < 3; i += 1) {
      const w = 94 + ((lane + i) % 2) * 16;
      const h = 36;
      cars.push({
        id: `lane-${lane}-car-${i}`,
        lane,
        x: 40 + i * 250 + lane * 24,
        y: GAME.safeZoneHeight + lane * GAME.laneHeight + 12,
        w,
        h,
        dir,
        speedPx: GAME.baseCarSpeed * speedMultiplier * levelBoost * (0.9 + lane * 0.06),
        color: lane % 3 === 0 ? "#ef4444" : lane % 3 === 1 ? "#3b82f6" : "#f59e0b",
      });
    }
  }
  return cars;
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawRoad(ctx) {
  ctx.fillStyle = "#19311f";
  ctx.fillRect(0, 0, GAME.width, GAME.safeZoneHeight);
  ctx.fillRect(0, GAME.height - GAME.safeZoneHeight, GAME.width, GAME.safeZoneHeight);

  for (let lane = 0; lane < GAME.laneCount; lane += 1) {
    const y = GAME.safeZoneHeight + lane * GAME.laneHeight;
    ctx.fillStyle = lane % 2 === 0 ? "#1f2937" : "#111827";
    ctx.fillRect(0, y, GAME.width, GAME.laneHeight);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(GAME.width, y);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.setLineDash([12, 14]);
    ctx.beginPath();
    ctx.moveTo(0, y + GAME.laneHeight / 2);
    ctx.lineTo(GAME.width, y + GAME.laneHeight / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawCars(ctx, cars) {
  for (const car of cars) {
    const { x, y, w, h, color, dir } = car;
    const grad = ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, color);
    grad.addColorStop(1, "#111827");
    ctx.fillStyle = grad;
    drawRoundedRect(ctx, x, y, w, h, 10);
    ctx.fill();

    ctx.fillStyle = "rgba(226,232,240,0.78)";
    drawRoundedRect(ctx, x + w * 0.22, y + h * 0.2, w * 0.34, h * 0.44, 6);
    ctx.fill();

    ctx.fillStyle = "#0b1020";
    drawRoundedRect(ctx, x + 12, y + h - 7, 24, 11, 5);
    ctx.fill();
    drawRoundedRect(ctx, x + w - 36, y + h - 7, 24, 11, 5);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.88)";
    const hx = dir > 0 ? x + w - 8 : x + 4;
    ctx.fillRect(hx, y + h * 0.33, 4, 10);
  }
}

function drawFrog(ctx, player) {
  const { x, y, w, h } = player;
  const grad = ctx.createRadialGradient(x + w * 0.36, y + h * 0.33, 2, x, y, w);
  grad.addColorStop(0, "#4ade80");
  grad.addColorStop(1, "#14532d");
  ctx.fillStyle = grad;
  drawRoundedRect(ctx, x, y, w, h, 10);
  ctx.fill();

  ctx.fillStyle = "rgba(226,232,240,0.96)";
  ctx.beginPath();
  ctx.arc(x + w * 0.28, y + h * 0.27, 3.4, 0, Math.PI * 2);
  ctx.arc(x + w * 0.72, y + h * 0.27, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(x + w * 0.28, y + h * 0.27, 1.5, 0, Math.PI * 2);
  ctx.arc(x + w * 0.72, y + h * 0.27, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

export function useFroggerEngine({ speedMultiplier, onWin, enabled = true }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);
  const keysRef = useRef({ up: false, down: false, left: false, right: false });
  const playerRef = useRef({ ...getStartPos(), w: GAME.playerSize, h: GAME.playerSize });
  const carsRef = useRef(makeCars(speedMultiplier, 1));
  const livesRef = useRef(3);
  const levelRef = useRef(1);
  const scoreRef = useRef(0);
  const winLockRef = useRef(false);
  const fpsSamplesRef = useRef([]);
  const hudTsRef = useRef(0);
  const onWinRef = useRef(onWin);
  const [hud, setHud] = useState({ level: 1, score: 0, lives: 3, fps: 60 });

  useEffect(() => {
    onWinRef.current = onWin;
  }, [onWin]);

  useEffect(() => {
    carsRef.current = makeCars(speedMultiplier, levelRef.current);
  }, [speedMultiplier]);

  const resetPlayer = () => {
    const pos = getStartPos();
    playerRef.current.x = pos.x;
    playerRef.current.y = pos.y;
  };

  const loseLife = () => {
    livesRef.current = Math.max(0, livesRef.current - 1);
    resetPlayer();
  };

  const levelUp = () => {
    scoreRef.current += 120;
    levelRef.current += 1;
    carsRef.current = makeCars(speedMultiplier, levelRef.current);
    resetPlayer();
    if (!winLockRef.current) {
      winLockRef.current = true;
      onWinRef.current?.();
      setTimeout(() => {
        winLockRef.current = false;
      }, 400);
    }
  };

  useEffect(() => {
    const onDown = (e) => {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(k)) {
        e.preventDefault();
      }
      if (k === "arrowup" || k === "w") keysRef.current.up = true;
      if (k === "arrowdown" || k === "s") keysRef.current.down = true;
      if (k === "arrowleft" || k === "a") keysRef.current.left = true;
      if (k === "arrowright" || k === "d") keysRef.current.right = true;
    };
    const onUp = (e) => {
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") keysRef.current.up = false;
      if (k === "arrowdown" || k === "s") keysRef.current.down = false;
      if (k === "arrowleft" || k === "a") keysRef.current.left = false;
      if (k === "arrowright" || k === "d") keysRef.current.right = false;
    };
    window.addEventListener("keydown", onDown, { passive: false });
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(GAME.width * dpr);
    canvas.height = Math.floor(GAME.height * dpr);
    canvas.style.width = `${GAME.width}px`;
    canvas.style.height = `${GAME.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const update = (dt) => {
      const player = playerRef.current;
      const keys = keysRef.current;

      let vx = 0;
      let vy = 0;
      if (keys.left) vx -= 1;
      if (keys.right) vx += 1;
      if (keys.up) vy -= 1;
      if (keys.down) vy += 1;
      if (vx !== 0 && vy !== 0) {
        const n = Math.sqrt(2);
        vx /= n;
        vy /= n;
      }

      const moveX = vx * GAME.playerSpeed * dt;
      const moveY = vy * GAME.playerSpeed * dt;
      const dist = Math.max(Math.abs(moveX), Math.abs(moveY));
      const steps = Math.max(1, Math.ceil(dist / 8));
      const stepX = moveX / steps;
      const stepY = moveY / steps;

      for (let i = 0; i < steps; i += 1) {
        player.x = clamp(player.x + stepX, 0, GAME.width - player.w);
        player.y = clamp(player.y + stepY, 0, GAME.height - player.h);
      }

      for (const car of carsRef.current) {
        car.x += car.dir * car.speedPx * dt;
        if (car.dir > 0 && car.x > GAME.width + car.w) car.x = -car.w - 40;
        if (car.dir < 0 && car.x < -car.w - 40) car.x = GAME.width + 40;
      }

      for (const car of carsRef.current) {
        if (overlap(player, { x: car.x, y: car.y, w: car.w, h: car.h })) {
          loseLife();
          break;
        }
      }

      if (player.y <= 12) {
        levelUp();
      }
      if (livesRef.current <= 0) {
        livesRef.current = 3;
        levelRef.current = 1;
        scoreRef.current = 0;
        carsRef.current = makeCars(speedMultiplier, 1);
        resetPlayer();
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, GAME.width, GAME.height);
      drawRoad(ctx);
      drawCars(ctx, carsRef.current);
      drawFrog(ctx, playerRef.current);
    };

    const frame = (ts) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = Math.min((ts - lastTsRef.current) / 1000, 0.05);
      lastTsRef.current = ts;

      update(dt);
      draw();

      const fps = Math.round(1 / Math.max(0.0001, dt));
      fpsSamplesRef.current.push(fps);
      if (fpsSamplesRef.current.length > 18) fpsSamplesRef.current.shift();

      if (ts - hudTsRef.current > 120) {
        hudTsRef.current = ts;
        const sum = fpsSamplesRef.current.reduce((acc, n) => acc + n, 0);
        const avgFps = fpsSamplesRef.current.length ? Math.round(sum / fpsSamplesRef.current.length) : 60;
        setHud({
          level: levelRef.current,
          score: scoreRef.current,
          lives: livesRef.current,
          fps: avgFps,
        });
      }

      rafRef.current = requestAnimationFrame(frame);
    };

    lastTsRef.current = 0;
    rafRef.current = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, speedMultiplier]);

  return { canvasRef, hud };
}
