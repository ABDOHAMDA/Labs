const express = require("express");
const cors = require("cors");

const gameConfigRoute = require("./routes/gameConfig");
const labCompleteRoute = require("./routes/labComplete");

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

const completedLabs = {};
app.locals.completedLabs = completedLabs;

app.use("/api/game-config", gameConfigRoute);
app.use("/api/lab/complete", labCompleteRoute);

app.get("/health", (_req, res) => {
  res.json({ service: "lab-service", status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Lab Service listening on port ${PORT}`);
});
