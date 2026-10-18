const ContactQuery = require("../models/query.model");

const createContactQuery = async (data) => {
  return await ContactQuery.create({
    name: data.name,
    email: data.email,
    queryType: data.queryType,
    query: data.query,
  });
};

const getAllContactQueries = async (page = 1, limit = 10, queryType) => {
  const skip = (page - 1) * limit;

  const filter = {};

  if (queryType) {
    filter.queryType = queryType;
  }

  const [queries, total] = await Promise.all([
    ContactQuery.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ContactQuery.countDocuments(filter),
  ]);

  return {
    queries,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getContactQueryById = async (id) => {
  return await ContactQuery.findById(id).lean();
};

module.exports = {
  createContactQuery,
  getAllContactQueries,
  getContactQueryById,
};