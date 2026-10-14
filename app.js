const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const app = express();

// Security
app.use(helmet());

// CORS
app.use(cors());

// Logging
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Body parser
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Cookies
app.use(cookieParser());

// Compression
app.use(compression());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

// Routes
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DevKit API is running 🚀",
  });
});

// Future routes
app.use("/api/auth", require('./src/routes/auth.routes'));
app.use("/api/mern", require('./src/routes/mern.routes'));
app.use("/api/payments", require('./src/routes/payment.routes'));
app.use("/api/component", require('./src/routes/component.routes'));
// app.use("/api/users", userRoutes);
// app.use("/api/resources", resourceRoutes);
// app.use("/api/projects", projectRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;