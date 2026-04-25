const express = require("express");

const router = express.Router();

router.get("/", (_req, res) => {
  res.json({ carSpeed: 10 });
});

module.exports = router;
