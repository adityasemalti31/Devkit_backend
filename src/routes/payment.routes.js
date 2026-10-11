const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/payment.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/create", protect, paymentController.createPayment);
router.post("/verify", protect, paymentController.verifyPayment);

router.post(
  "/contribution/create",
  paymentController.createContribution
);

router.post(
  "/contribution/verify",
  paymentController.verifyContribution
);

module.exports = router;