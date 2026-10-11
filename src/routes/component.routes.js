
const express = require("express");

const router = express.Router();

const {
  getComponents,
  getCategories,
  getComponentBySlug,
} = require("../controllers/component.controller");

router.get("/", getComponents);
router.get("/categories", getCategories);
router.get("/:slug", getComponentBySlug);

module.exports = router;
