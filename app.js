const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const app = express();

// Security
app.use(helmet({ contentSecurityPolicy: false }));

// CORS
app.use(cors());

// Logging
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Body parser
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true, limit: "50kb" }));

// Cookies
app.use(cookieParser());

// Compression
app.use(compression());

// Static files for Admin Panel SPA
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DevKit API is running 🚀",
    endpoints: {
      auth: "/api/auth",
      components: "/api/component",
      payments: "/api/payments",
      admin: "/api/admin",
      adminPanel: "/admin",
    },
  });
});

// Admin Panel Web Dashboard route
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin", "index.html"));
});

// API Routes
app.use("/api/auth", require("./src/routes/auth.routes"));
app.use("/api/mern", require("./src/routes/mern.routes"));
app.use("/api/payments", require("./src/routes/payment.routes"));
app.use("/api/component", require("./src/routes/component.routes"));
app.use("/api/admin", require("./src/routes/admin.routes"));

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