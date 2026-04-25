import React from "react";

export default function GameHud({ level, score, lives, fps }) {
  return (
    <section className="hud" aria-label="Game stats">
      <div className="hudItem">
        <span>Level</span>
        <strong>{level}</strong>
      </div>
      <div className="hudItem">
        <span>Score</span>
        <strong>{score}</strong>
      </div>
      <div className="hudItem">
        <span>Lives</span>
        <strong>{lives}</strong>
      </div>
      <div className="hudItem">
        <span>FPS</span>
        <strong>{fps}</strong>
      </div>
    </section>
  );
}
