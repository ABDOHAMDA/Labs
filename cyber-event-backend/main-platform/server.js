const express = require("express");
const cors = require("cors");

const eventsRoute = require("./routes/events");
const usersRoute = require("./routes/users");

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

const users = {};
const processedEvents = {};

app.locals.users = users;
app.locals.processedEvents = processedEvents;

app.use("/api/events", eventsRoute);
app.use("/api/users", usersRoute);

app.get("/health", (_req, res) => {
  res.json({ service: "main-platform", status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Main Platform listening on port ${PORT}`);
});
