const express = require("express");

const router = express.Router();
const MAIN_PLATFORM_EVENTS_URL =
  process.env.MAIN_PLATFORM_EVENTS_URL || "http://localhost:4000/api/events";

router.post("/", async (req, res) => {
  const { userId, labId } = req.body || {};

  if (!userId || !labId) {
    return res.status(400).json({
      message: "userId and labId are required",
    });
  }

  const completedLabs = req.app.locals.completedLabs;
  if (!completedLabs[userId]) {
    completedLabs[userId] = new Set();
  }

  if (completedLabs[userId].has(labId)) {
    return res.json({
      message: "Already completed",
      pointsAdded: 0,
      userId,
      labId,
    });
  }

  completedLabs[userId].add(labId);

  const eventPayload = {
    event: "LAB_COMPLETED",
    userId,
    labId,
    points: 200,
  };

  try {
    const eventResponse = await fetch(MAIN_PLATFORM_EVENTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventPayload),
    });

    const eventData = await eventResponse.json().catch(() => ({}));
    if (!eventResponse.ok) {
      completedLabs[userId].delete(labId);
      return res.status(502).json({
        message: "Failed to deliver event to main platform",
        detail: eventData?.message || `HTTP_${eventResponse.status}`,
      });
    }

    return res.json({
      message: "Lab completion accepted",
      event: eventPayload,
      mainPlatform: eventData,
    });
  } catch (error) {
    completedLabs[userId].delete(labId);
    return res.status(502).json({
      message: "Main platform unavailable",
      detail: error.message,
    });
  }
});

module.exports = router;
