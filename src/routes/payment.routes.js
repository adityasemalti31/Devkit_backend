
const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/payment.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/create", protect, paymentController.createPayment);
router.post("/verify", protect, paymentController.verifyPayment);

module.exports = router;