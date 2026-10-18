const mongoose = require("mongoose");
const {
  createContactQuery,
  getAllContactQueries,
  getContactQueryById,
} = require("../service/query.service");

const QUERY_TYPES = [
  "General Inquiry",
  "Technical Support",
  "Billing",
  "Bug Report",
  "Feature Request",
  "Partnership",
  "Other",
];

const createQuery = async (req, res) => {
  try {
    const { name, email, queryType, query } = req.body;

    if (!name || !email || !queryType || !query) {
      return res.status(400).json({
        success: false,
        message: "Name, email, query type and query are required",
      });
    }

    if (name.trim().length < 2 || name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 100 characters",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    if (!QUERY_TYPES.includes(queryType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid query type",
        allowedTypes: QUERY_TYPES,
      });
    }

    if (query.trim().length < 5 || query.trim().length > 3000) {
      return res.status(400).json({
        success: false,
        message: "Query must be between 5 and 3000 characters",
      });
    }

    const contactQuery = await createContactQuery({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      queryType,
      query: query.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Your query has been submitted successfully",
      data: contactQuery,
    });
  } catch (error) {
    console.error("Create Contact Query Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit your query",
    });
  }
};

const getQueries = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );
    const { queryType } = req.query;

    if (queryType && !QUERY_TYPES.includes(queryType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid query type",
        allowedTypes: QUERY_TYPES,
      });
    }

    const result = await getAllContactQueries(page, limit, queryType);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get Contact Queries Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch contact queries",
    });
  }
};

const getQueryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid query ID",
      });
    }

    const contactQuery = await getContactQueryById(id);

    if (!contactQuery) {
      return res.status(404).json({
        success: false,
        message: "Contact query not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: contactQuery,
    });
  } catch (error) {
    console.error("Get Contact Query Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch contact query",
    });
  }
};

module.exports = {
  createQuery,
  getQueries,
  getQueryById,
};