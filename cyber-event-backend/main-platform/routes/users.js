const express = require("express");

const router = express.Router();

router.get("/:userId", (req, res) => {
  const { userId } = req.params;
  const users = req.app.locals.users;

  if (!users[userId]) {
    users[userId] = {
      points: 0,
      completedLabs: [],
    };
  }

  res.json({
    userId,
    points: users[userId].points,
    completedLabs: users[userId].completedLabs,
  });
});

module.exports = router;
