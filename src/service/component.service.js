
const Component = require("../models/component.model");
const User = require("../models/user.model");

const hasPremiumAccess = async (user) => {
  if (!user) return false;
  try {
    const userId = user._id || user.id;
    if (!userId) return false;

    // If subscription already populated on user object
    if (user.subscription?.plan === "pro" && user.subscription?.status === "active") {
      if (!user.subscription.expiresAt || new Date(user.subscription.expiresAt) > new Date()) {
        return true;
      }
    }

    // Check directly in database
    const userDoc = await User.findById(userId);
    if (!userDoc) return false;

    if (userDoc.subscription?.plan === "pro" && userDoc.subscription?.status === "active") {
      if (!userDoc.subscription?.expiresAt || new Date(userDoc.subscription.expiresAt) > new Date()) {
        return true;
      }
    }
    return false;
  } catch (err) {
    return false;
  }
};

const getComponents = async (query = {}, user = null) => {
  const {
    page = 1,
    limit = 12,
    category,
    search,
    framework,
    styling,
    access,
    featured,
  } = query;

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));

  const filter = { status: "published" };

  if (category) filter.category = category.toLowerCase().trim();
  if (framework) filter.framework = framework.toLowerCase().trim();
  if (styling) filter.styling = styling.toLowerCase().trim();

  if (featured !== undefined) {
    if (!["true", "false"].includes(String(featured))) {
      throw new Error("featured must be true or false");
    }

    filter.featured = String(featured) === "true";
  }

  const premiumAccess = await hasPremiumAccess(user);

  if (access) {
    const requestedAccess = access.toLowerCase().trim();

    if (!["free", "premium"].includes(requestedAccess)) {
      throw new Error("Invalid access filter");
    }

    if (requestedAccess === "premium" && !premiumAccess) {
      return {
        components: [],
        pagination: {
          page: pageNumber,
          limit: pageSize,
          total: 0,
          totalPages: 0,
        },
      };
    }

    filter.access = requestedAccess;
  } else if (!premiumAccess) {
    filter.access = "free";
  }

  if (search?.trim()) {
    filter.$text = { $search: search.trim() };
  }

  const skip = (pageNumber - 1) * pageSize;

  const [components, total] = await Promise.all([
    Component.find(filter)
      .select(
        "name slug description category tags access framework styling language preview.registryKey preview.thumbnailUrl sourceCode.code sourceCode.styles sourceCode.usageExample sourceCode.dependencies installation featured version createdAt updatedAt"
      )
      .sort(
        search?.trim()
          ? { score: { $meta: "textScore" }, createdAt: -1 }
          : { featured: -1, createdAt: -1 }
      )
      .skip(skip)
      .limit(pageSize)
      .lean(),

    Component.countDocuments(filter),
  ]);

  return {
    components,
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasNextPage: pageNumber * pageSize < total,
      hasPrevPage: pageNumber > 1,
    },
  };
};

const getComponentBySlug = async (slug, user = null) => {
  const normalizedSlug = slug?.trim().toLowerCase();

  if (!normalizedSlug) {
    throw new Error("Component slug is required");
  }

  const component = await Component.findOne({
    slug: normalizedSlug,
    status: "published",
  }).lean();

  if (!component) {
    const error = new Error("Component not found");
    error.statusCode = 404;
    throw error;
  }

  const premiumAccess = await hasPremiumAccess(user);

  if (component.access === "premium" && !premiumAccess) {
    const error = new Error("Premium subscription required");
    error.statusCode = 403;
    throw error;
  }

  return component;
};

const getCategories = async (user = null) => {
  const premiumAccess = await hasPremiumAccess(user);

  const match = { status: "published" };

  if (!premiumAccess) match.access = "free";

  return Component.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        name: "$_id",
        count: 1,
      },
    },
    { $sort: { name: 1 } },
  ]);
};

module.exports = {
  getComponents,
  getComponentBySlug,
  getCategories,
};
