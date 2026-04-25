export const GAME = {
  width: 720,
  height: 480,
  safeZoneHeight: 56,
  laneCount: 6,
  laneHeight: 60,
  playerSize: 30,
  playerSpeed: 265,
  baseCarSpeed: 145,
};

export function getStartPos() {
  return {
    x: GAME.width / 2 - GAME.playerSize / 2,
    y: GAME.height - GAME.safeZoneHeight + 10,
  };
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
