const feedbackService = require("../service/feedback.service");

const createFeedback = async (req, res) => {
  try {
    const { name, email, feedback } = req.body;

    if (!name?.trim() || !email?.trim() || !feedback?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name, email and feedback are required",
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

    if (feedback.trim().length < 5 || feedback.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Feedback must be between 5 and 2000 characters",
      });
    }

    const result = await feedbackService.createFeedback({
      name,
      email,
      feedback,
    });

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      data: result,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create feedback error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit feedback",
    });
  }
};

const getAllFeedback = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );

    const result = await feedbackService.getAllFeedback(page, limit);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get feedback error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch feedback",
    });
  }
};

module.exports = {
  createFeedback,
  getAllFeedback,
};