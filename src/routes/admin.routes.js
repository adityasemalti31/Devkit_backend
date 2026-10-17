const express = require("express");
const router = express.Router();

const { protect, adminOnly } = require("../middleware/auth.middleware");
const adminController = require("../controllers/admin.controller");

// All admin routes require authentication and admin role
router.use(protect, adminOnly);

// ==================== DASHBOARD STATS ====================
router.get("/stats", adminController.getStats);

// ==================== COMPONENTS ====================
router.get("/components", adminController.getComponents);
router.get("/components/:id", adminController.getComponentById);
router.post("/components", adminController.createComponent);
router.put("/components/:id", adminController.updateComponent);
router.delete("/components/:id", adminController.deleteComponent);
router.patch("/components/:id/status", adminController.updateComponentStatus);
router.patch("/components/:id/featured", adminController.toggleComponentFeatured);
router.post("/seed-components", adminController.seedLibraryComponents);

// ==================== USERS ====================
router.get("/users", adminController.getUsers);
router.get("/users/:id", adminController.getUserById);
router.patch("/users/:id/role", adminController.updateUserRole);
router.patch("/users/:id/subscription", adminController.updateUserSubscription);
router.delete("/users/:id", adminController.deleteUser);

// ==================== PAYMENTS ====================
router.get("/payments", adminController.getPayments);
router.get("/payments/:id", adminController.getPaymentById);
router.patch("/payments/:id/status", adminController.updatePaymentStatus);

module.exports = router;
