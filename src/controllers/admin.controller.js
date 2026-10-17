const adminService = require("../service/admin.service");
const Component = require("../models/component.model");

// GET /api/admin/stats
const getStats = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.status(200).json({
      success: true,
      message: "Admin dashboard stats retrieved successfully",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== COMPONENTS ====================

// GET /api/admin/components
const getComponents = async (req, res, next) => {
  try {
    const result = await adminService.getAdminComponents(req.query);
    res.status(200).json({
      success: true,
      message: "Components fetched successfully",
      data: result.components,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/components/:id
const getComponentById = async (req, res, next) => {
  try {
    const component = await adminService.getAdminComponentById(req.params.id);
    res.status(200).json({
      success: true,
      message: "Component retrieved successfully",
      data: component,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/components
const createComponent = async (req, res, next) => {
  try {
    const component = await adminService.createAdminComponent(req.body, req.user);
    res.status(201).json({
      success: true,
      message: "Component created successfully",
      data: component,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/components/:id
const updateComponent = async (req, res, next) => {
  try {
    const component = await adminService.updateAdminComponent(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: "Component updated successfully",
      data: component,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/components/:id
const deleteComponent = async (req, res, next) => {
  try {
    const result = await adminService.deleteAdminComponent(req.params.id);
    res.status(200).json({
      success: true,
      message: result.message,
      data: { id: result.id },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/components/:id/status
const updateComponentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const component = await adminService.updateComponentStatus(req.params.id, status);
    res.status(200).json({
      success: true,
      message: `Component status changed to ${status}`,
      data: component,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/components/:id/featured
const toggleComponentFeatured = async (req, res, next) => {
  try {
    const component = await adminService.toggleComponentFeatured(req.params.id);
    res.status(200).json({
      success: true,
      message: `Component featured set to ${component.featured}`,
      data: component,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== USERS ====================

// GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const result = await adminService.getAdminUsers(req.query);
    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users/:id
const getUserById = async (req, res, next) => {
  try {
    const user = await adminService.getAdminUserById(req.params.id);
    res.status(200).json({
      success: true,
      message: "User details retrieved successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/role
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await adminService.updateUserRole(req.params.id, role, req.user?._id);
    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/subscription
const updateUserSubscription = async (req, res, next) => {
  try {
    const user = await adminService.updateUserSubscription(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: "User subscription updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res, next) => {
  try {
    const result = await adminService.deleteAdminUser(req.params.id, req.user?._id);
    res.status(200).json({
      success: true,
      message: result.message,
      data: { id: result.id },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== PAYMENTS ====================

// GET /api/admin/payments
const getPayments = async (req, res, next) => {
  try {
    const result = await adminService.getAdminPayments(req.query);
    res.status(200).json({
      success: true,
      message: "Payments fetched successfully",
      data: result.payments,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/payments/:id
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await adminService.getAdminPaymentById(req.params.id);
    res.status(200).json({
      success: true,
      message: "Payment details retrieved successfully",
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/payments/:id/status
const updatePaymentStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    const payment = await adminService.updatePaymentStatus(
      req.params.id,
      { status, reason },
      req.user
    );
    res.status(200).json({
      success: true,
      message: `Payment status updated to ${status}`,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/seed-components
const seedLibraryComponents = async (req, res, next) => {
  try {
    // Dynamically require and run seed data
    const fs = require("fs");
    const path = require("path");
    const seedPath = path.resolve(__dirname, "../../componentSeed.js");

    if (fs.existsSync(seedPath)) {
      // Execute the seeding
      const { exec } = require("child_process");
      exec(`node "${seedPath}"`, (err, stdout, stderr) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Failed to seed components: " + err.message,
          });
        }
        return res.status(200).json({
          success: true,
          message: "Component library seeded successfully from default presets!",
          output: stdout,
        });
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Seed script not found",
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getComponents,
  getComponentById,
  createComponent,
  updateComponent,
  deleteComponent,
  updateComponentStatus,
  toggleComponentFeatured,
  getUsers,
  getUserById,
  updateUserRole,
  updateUserSubscription,
  deleteUser,
  getPayments,
  getPaymentById,
  updatePaymentStatus,
  seedLibraryComponents,
};
