const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const petRoutes = require("./routes/petRoutes");
const requestRoutes = require("./routes/requestRoutes");
const userRoutes = require("./routes/userRoutes");
const knowledgeRoutes = require("./routes/knowledgeRoutes");
const adminRoutes = require("./routes/adminRoutes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Verifies API running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/users", userRoutes);
app.use("/api/knowledge", knowledgeRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

module.exports = app;
