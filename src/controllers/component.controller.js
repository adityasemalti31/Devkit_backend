
const componentService = require("../service/component.service");

// GET /api/components
const getComponents = async (req, res, next) => {
  try {
    const result = await componentService.getComponents(
      req.query,
      req.user || null
    );

    return res.status(200).json({
      success: true,
      message: "Components fetched successfully",
      data: result.components,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/components/categories
const getCategories = async (req, res, next) => {
  try {
    const categories = await componentService.getCategories(
      req.user || null
    );

    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/components/:slug
const getComponentBySlug = async (req, res, next) => {
  try {
    const component = await componentService.getComponentBySlug(
      req.params.slug,
      req.user || null
    );

    return res.status(200).json({
      success: true,
      message: "Component fetched successfully",
      data: component,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getComponents,
  getCategories,
  getComponentBySlug,
};
