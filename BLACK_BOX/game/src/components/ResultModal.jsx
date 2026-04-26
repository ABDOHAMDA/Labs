import React from "react";

export default function ResultModal({ title, message, points, onClose }) {
  return (
    <div className="overlay">
      <div className="modal modernModal">
        <h3>{title}</h3>
        <p>{message}</p>
        {typeof points === "number" && points > 0 ? <div className="points">+{points} Points</div> : null}
        <button type="button" onClick={onClose}>Continue</button>
      </div>
    </div>
  );
}
