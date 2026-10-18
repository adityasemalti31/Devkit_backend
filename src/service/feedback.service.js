const Feedback = require("../models/feedback.model");

const createFeedback = async (data) => {
  return await Feedback.create({
    name: data.name,
    email: data.email,
    feedback: data.feedback,
  });
};

const getAllFeedback = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [feedback, total] = await Promise.all([
    Feedback.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Feedback.countDocuments(),
  ]);

  return {
    feedback,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  createFeedback,
  getAllFeedback,
};