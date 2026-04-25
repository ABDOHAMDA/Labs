const express = require("express");

const router = express.Router();

router.post("/", (req, res) => {
  const { event, userId, labId, points } = req.body || {};

  if (event !== "LAB_COMPLETED" || !userId || !labId) {
    return res.status(400).json({ message: "Invalid event payload" });
  }

  const users = req.app.locals.users;
  const processedEvents = req.app.locals.processedEvents;

  const eventKey = `${userId}:${labId}`;
  if (processedEvents[eventKey]) {
    const existingUser = users[userId] || { points: 0, completedLabs: [] };
    return res.json({
      message: "Already completed",
      pointsAdded: 0,
      totalPoints: existingUser.points,
      labId,
    });
  }

  if (!users[userId]) {
    users[userId] = {
      points: 0,
      completedLabs: [],
    };
  }

  const safePoints = Number.isFinite(points) ? Number(points) : 200;
  users[userId].points += safePoints;
  users[userId].completedLabs.push(labId);
  processedEvents[eventKey] = true;

  return res.json({
    message: "Lab Solved Successfully",
    pointsAdded: safePoints,
    totalPoints: users[userId].points,
    labId,
  });
});

module.exports = router;
