const express = require("express");
const router = express.Router();

const {
  createQuery,
  getQueries,
  getQueryById,
} = require("../controllers/query.controller");

// Public: submit a contact query
router.post("/", createQuery);

// Protect these routes with your admin authentication middleware
router.get("/", getQueries);
router.get("/:id", getQueryById);

module.exports = router;