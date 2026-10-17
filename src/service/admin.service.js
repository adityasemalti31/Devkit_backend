const Component = require("../models/component.model");
const User = require("../models/user.model");
const Payment = require("../models/payment.model");

// ==================== DASHBOARD & STATS ====================

const getDashboardStats = async () => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Parallel Aggregations for High Performance
  const [
    totalUsers,
    proUsers,
    freeUsers,
    adminUsers,
    newUsers7d,
    newUsers30d,
    totalComponents,
    publishedComponents,
    draftComponents,
    archivedComponents,
    freeComponents,
    premiumComponents,
    categoryBreakdown,
    paymentStats,
    recentPayments,
    recentUsers,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ "subscription.plan": "pro", "subscription.status": "active" }),
    User.countDocuments({
      $or: [
        { "subscription.plan": "free" },
        { "subscription.status": { $ne: "active" } },
        { "subscription.plan": { $exists: false } },
      ],
    }),
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),

    Component.countDocuments(),
    Component.countDocuments({ status: "published" }),
    Component.countDocuments({ status: "draft" }),
    Component.countDocuments({ status: "archived" }),
    Component.countDocuments({ access: "free" }),
    Component.countDocuments({ access: "premium" }),

    Component.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          published: {
            $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
          },
          premium: {
            $sum: { $cond: [{ $eq: ["$access", "premium"] }, 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
    ]),

    Payment.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmountPaise: { $sum: "$amount" },
        },
      },
    ]),

    Payment.find()
      .populate("user", "name email subscription")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),

    User.find()
      .select("name email role subscription createdAt")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
  ]);

  // Compute Financial Aggregates
  let totalRevenuePaise = 0;
  let successfulPaymentsCount = 0;
  let failedPaymentsCount = 0;
  let pendingPaymentsCount = 0;

  paymentStats.forEach((p) => {
    if (p._id === "captured") {
      totalRevenuePaise += p.totalAmountPaise;
      successfulPaymentsCount += p.count;
    } else if (["failed", "cancelled", "expired"].includes(p._id)) {
      failedPaymentsCount += p.count;
    } else if (["created", "pending", "attempted", "authorized"].includes(p._id)) {
      pendingPaymentsCount += p.count;
    }
  });

  const [subscriptionRevenueAgg, contributionRevenueAgg] = await Promise.all([
    Payment.aggregate([
      { $match: { type: "subscription", status: "captured" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { type: "contribution", status: "captured" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
  ]);

  const subscriptionRevenue = subscriptionRevenueAgg[0]?.total
    ? subscriptionRevenueAgg[0].total / 100
    : 0;
  const contributionRevenue = contributionRevenueAgg[0]?.total
    ? contributionRevenueAgg[0].total / 100
    : 0;

  return {
    overview: {
      users: {
        total: totalUsers,
        pro: proUsers,
        free: freeUsers,
        admins: adminUsers,
        newLast7Days: newUsers7d,
        newLast30Days: newUsers30d,
        conversionRate: totalUsers > 0 ? ((proUsers / totalUsers) * 100).toFixed(1) : 0,
      },
      revenue: {
        totalRevenueRupees: (totalRevenuePaise / 100).toFixed(2),
        subscriptionRevenueRupees: subscriptionRevenue.toFixed(2),
        contributionRevenueRupees: contributionRevenue.toFixed(2),
        successfulPayments: successfulPaymentsCount,
        failedPayments: failedPaymentsCount,
        pendingPayments: pendingPaymentsCount,
        totalPayments: paymentStats.reduce((sum, p) => sum + p.count, 0),
      },
      components: {
        total: totalComponents,
        published: publishedComponents,
        draft: draftComponents,
        archived: archivedComponents,
        free: freeComponents,
        premium: premiumComponents,
      },
    },
    categories: categoryBreakdown.map((c) => ({
      name: c._id,
      total: c.count,
      published: c.published,
      premium: c.premium,
    })),
    recentPayments: recentPayments.map((p) => ({
      id: p._id,
      amountRupees: (p.amount / 100).toFixed(2),
      currency: p.currency,
      type: p.type,
      status: p.status,
      user: p.user ? { name: p.user.name, email: p.user.email } : { name: "Anonymous Contributor", email: p.contribution?.contributorEmail || "N/A" },
      gateway: p.gateway?.cashfreeOrderId ? "Cashfree" : p.gateway?.razorpayPaymentId ? "Razorpay" : "Direct",
      createdAt: p.createdAt,
    })),
    recentUsers,
  };
};

// ==================== COMPONENTS MANAGEMENT ====================

const getAdminComponents = async (query = {}) => {
  const {
    page = 1,
    limit = 15,
    search,
    category,
    status,
    access,
    framework,
    styling,
    sort = "-createdAt",
  } = query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
  const filter = {};

  if (category && category !== "all") {
    filter.category = category.toLowerCase().trim();
  }
  if (status && status !== "all") {
    filter.status = status.toLowerCase().trim();
  }
  if (access && access !== "all") {
    filter.access = access.toLowerCase().trim();
  }
  if (framework && framework !== "all") {
    filter.framework = framework.toLowerCase().trim();
  }
  if (styling && styling !== "all") {
    filter.styling = styling.toLowerCase().trim();
  }

  if (search && search.trim()) {
    const s = search.trim();
    filter.$or = [
      { name: { $regex: s, $options: "i" } },
      { slug: { $regex: s, $options: "i" } },
      { description: { $regex: s, $options: "i" } },
      { tags: { $regex: s, $options: "i" } },
    ];
  }

  const skip = (pageNum - 1) * pageSize;

  const [components, total] = await Promise.all([
    Component.find(filter)
      .populate("createdBy", "name email")
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .lean(),
    Component.countDocuments(filter),
  ]);

  return {
    components,
    pagination: {
      page: pageNum,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasNextPage: pageNum * pageSize < total,
      hasPrevPage: pageNum > 1,
    },
  };
};

const getAdminComponentById = async (id) => {
  const component = await Component.findById(id).populate("createdBy", "name email").lean();
  if (!component) {
    const err = new Error("Component not found");
    err.statusCode = 404;
    throw err;
  }
  return component;
};

const createAdminComponent = async (data, adminUser) => {
  let {
    name,
    slug,
    description,
    category,
    tags,
    access = "free",
    framework = "react",
    styling = "tailwind",
    language = "jsx",
    preview,
    sourceCode,
    installation = "",
    status = "published",
    featured = false,
  } = data;

  if (!name || !description || !category) {
    const err = new Error("Name, description, and category are required");
    err.statusCode = 400;
    throw err;
  }

  // Generate unique slug if not provided
  if (!slug || !slug.trim()) {
    slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  } else {
    slug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // Ensure slug uniqueness
  let finalSlug = slug;
  let counter = 1;
  while (await Component.findOne({ slug: finalSlug })) {
    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  // Ensure tags is array
  let formattedTags = [];
  if (Array.isArray(tags)) {
    formattedTags = tags;
  } else if (typeof tags === "string") {
    formattedTags = tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
  }

  // Ensure sourceCode structure
  const formattedSourceCode = {
    code: typeof sourceCode === "string" ? sourceCode : sourceCode?.code || "// Component code",
    styles: sourceCode?.styles || "",
    usageExample: sourceCode?.usageExample || `<${name.replace(/\s+/g, "")} />`,
    dependencies: Array.isArray(sourceCode?.dependencies) ? sourceCode.dependencies : [],
  };

  // Preview structure
  const formattedPreview = {
    type: preview?.type || "registry",
    registryKey: preview?.registryKey || finalSlug,
    html: preview?.html || undefined,
    css: preview?.css || undefined,
    js: preview?.js || undefined,
    thumbnailUrl: preview?.thumbnailUrl || undefined,
  };

  const newComponent = await Component.create({
    name: name.trim(),
    slug: finalSlug,
    description: description.trim(),
    category: category.toLowerCase().trim(),
    tags: formattedTags,
    access: ["free", "premium"].includes(access) ? access : "free",
    framework: ["react", "nextjs", "html"].includes(framework) ? framework : "react",
    styling: ["tailwind", "css", "inline"].includes(styling) ? styling : "tailwind",
    language: ["tsx", "jsx", "html"].includes(language) ? language : "jsx",
    preview: formattedPreview,
    sourceCode: formattedSourceCode,
    installation: installation || `Install dependencies and copy into your project.`,
    status: ["draft", "published", "archived"].includes(status) ? status : "published",
    featured: Boolean(featured),
    createdBy: adminUser?._id || null,
  });

  return newComponent;
};

const updateAdminComponent = async (id, data) => {
  const component = await Component.findById(id);
  if (!component) {
    const err = new Error("Component not found");
    err.statusCode = 404;
    throw err;
  }

  // Slug cannot be modified through normal update due to mongoose hook
  const safeUpdates = {};
  if (data.name !== undefined) safeUpdates.name = data.name.trim();
  if (data.description !== undefined) safeUpdates.description = data.description.trim();
  if (data.category !== undefined) safeUpdates.category = data.category.toLowerCase().trim();
  if (data.access !== undefined) safeUpdates.access = data.access;
  if (data.framework !== undefined) safeUpdates.framework = data.framework;
  if (data.styling !== undefined) safeUpdates.styling = data.styling;
  if (data.language !== undefined) safeUpdates.language = data.language;
  if (data.installation !== undefined) safeUpdates.installation = data.installation;
  if (data.status !== undefined) safeUpdates.status = data.status;
  if (data.featured !== undefined) safeUpdates.featured = Boolean(data.featured);

  if (data.tags !== undefined) {
    safeUpdates.tags = Array.isArray(data.tags)
      ? data.tags
      : String(data.tags)
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean);
  }

  if (data.sourceCode !== undefined) {
    safeUpdates.sourceCode = {
      code: typeof data.sourceCode === "string" ? data.sourceCode : data.sourceCode.code || component.sourceCode.code,
      styles: data.sourceCode.styles !== undefined ? data.sourceCode.styles : component.sourceCode.styles,
      usageExample: data.sourceCode.usageExample !== undefined ? data.sourceCode.usageExample : component.sourceCode.usageExample,
      dependencies: Array.isArray(data.sourceCode.dependencies) ? data.sourceCode.dependencies : component.sourceCode.dependencies,
    };
  }

  if (data.preview !== undefined) {
    safeUpdates.preview = {
      ...component.preview,
      ...data.preview,
    };
  }

  // Increment version if code or styles changed
  if (data.sourceCode) {
    safeUpdates.version = (component.version || 1) + 1;
  }

  const updated = await Component.findByIdAndUpdate(
    id,
    { $set: safeUpdates },
    { new: true, runValidators: true }
  ).lean();

  return updated;
};

const deleteAdminComponent = async (id) => {
  const component = await Component.findByIdAndDelete(id);
  if (!component) {
    const err = new Error("Component not found");
    err.statusCode = 404;
    throw err;
  }
  return { message: "Component deleted successfully", id };
};

const updateComponentStatus = async (id, status) => {
  if (!["draft", "published", "archived"].includes(status)) {
    const err = new Error("Invalid status. Allowed: draft, published, archived");
    err.statusCode = 400;
    throw err;
  }

  const updated = await Component.findByIdAndUpdate(
    id,
    { $set: { status } },
    { new: true, runValidators: true }
  ).lean();

  if (!updated) {
    const err = new Error("Component not found");
    err.statusCode = 404;
    throw err;
  }

  return updated;
};

const toggleComponentFeatured = async (id) => {
  const component = await Component.findById(id);
  if (!component) {
    const err = new Error("Component not found");
    err.statusCode = 404;
    throw err;
  }

  component.featured = !component.featured;
  await component.save();
  return component;
};

// ==================== USER MANAGEMENT ====================

const getAdminUsers = async (query = {}) => {
  const {
    page = 1,
    limit = 15,
    search,
    role,
    plan,
    status,
    sort = "-createdAt",
  } = query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
  const filter = {};

  if (role && role !== "all") {
    filter.role = role.toLowerCase().trim();
  }

  if (plan && plan !== "all") {
    filter["subscription.plan"] = plan.toLowerCase().trim();
  }

  if (status && status !== "all") {
    filter["subscription.status"] = status.toLowerCase().trim();
  }

  if (search && search.trim()) {
    const s = search.trim();
    filter.$or = [
      { name: { $regex: s, $options: "i" } },
      { email: { $regex: s, $options: "i" } },
    ];
  }

  const skip = (pageNum - 1) * pageSize;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("name email role subscription createdAt updatedAt")
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      page: pageNum,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasNextPage: pageNum * pageSize < total,
      hasPrevPage: pageNum > 1,
    },
  };
};

const getAdminUserById = async (id) => {
  const [user, payments] = await Promise.all([
    User.findById(id).select("-password").lean(),
    Payment.find({ user: id }).sort({ createdAt: -1 }).lean(),
  ]);

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  return {
    ...user,
    payments: payments.map((p) => ({
      id: p._id,
      amountRupees: (p.amount / 100).toFixed(2),
      type: p.type,
      status: p.status,
      currency: p.currency,
      createdAt: p.createdAt,
      gateway: p.gateway?.cashfreeOrderId ? "Cashfree" : "Razorpay",
    })),
  };
};

const updateUserRole = async (id, role, currentAdminId) => {
  if (!["user", "admin"].includes(role)) {
    const err = new Error("Role must be 'user' or 'admin'");
    err.statusCode = 400;
    throw err;
  }

  // Prevent demoting self
  if (id === currentAdminId?.toString() && role !== "admin") {
    const err = new Error("You cannot remove admin privileges from your own account");
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findByIdAndUpdate(
    id,
    { $set: { role } },
    { new: true }
  ).select("name email role subscription");

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  return user;
};

const updateUserSubscription = async (id, { plan = "pro", status = "active", days = 30 }) => {
  const user = await User.findById(id);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const durationDays = parseInt(days, 10) || 30;
  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

  user.subscription = {
    plan: ["free", "pro"].includes(plan) ? plan : "pro",
    status: ["active", "expired", "cancelled", "pending"].includes(status) ? status : "active",
    startedAt: plan === "pro" ? startedAt : null,
    expiresAt: plan === "pro" ? expiresAt : null,
    paymentId: user.subscription?.paymentId || "admin_manual_grant",
  };

  user.markModified("subscription");
  await user.save();

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    subscription: user.subscription,
  };
};

const deleteAdminUser = async (id, currentAdminId) => {
  if (id === currentAdminId?.toString()) {
    const err = new Error("You cannot delete your own admin account");
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findByIdAndDelete(id);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  return { message: "User deleted successfully", id };
};

// ==================== PAYMENTS MANAGEMENT ====================

const getAdminPayments = async (query = {}) => {
  const {
    page = 1,
    limit = 15,
    search,
    type,
    status,
    gateway,
    sort = "-createdAt",
  } = query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
  const filter = {};

  if (type && type !== "all") {
    filter.type = type.toLowerCase().trim();
  }

  if (status && status !== "all") {
    filter.status = status.toLowerCase().trim();
  }

  if (gateway && gateway !== "all") {
    if (gateway === "cashfree") {
      filter["gateway.cashfreeOrderId"] = { $exists: true, $ne: null };
    } else if (gateway === "razorpay") {
      filter["gateway.razorpayOrderId"] = { $exists: true, $ne: null };
    }
  }

  if (search && search.trim()) {
    const s = search.trim();
    filter.$or = [
      { "gateway.cashfreeOrderId": { $regex: s, $options: "i" } },
      { "gateway.razorpayOrderId": { $regex: s, $options: "i" } },
      { "contribution.contributorEmail": { $regex: s, $options: "i" } },
    ];
  }

  const skip = (pageNum - 1) * pageSize;

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate("user", "name email subscription")
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .lean(),
    Payment.countDocuments(filter),
  ]);

  return {
    payments: payments.map((p) => ({
      ...p,
      amountRupees: (p.amount / 100).toFixed(2),
    })),
    pagination: {
      page: pageNum,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasNextPage: pageNum * pageSize < total,
      hasPrevPage: pageNum > 1,
    },
  };
};

const getAdminPaymentById = async (id) => {
  const payment = await Payment.findById(id).populate("user", "name email subscription").lean();
  if (!payment) {
    const err = new Error("Payment record not found");
    err.statusCode = 404;
    throw err;
  }

  return {
    ...payment,
    amountRupees: (payment.amount / 100).toFixed(2),
  };
};

const updatePaymentStatus = async (id, { status, reason = "Admin manual update" }, adminUser) => {
  const allowed = [
    "created",
    "pending",
    "authorized",
    "captured",
    "failed",
    "cancelled",
    "expired",
    "refunded",
    "partially_refunded",
  ];

  if (!allowed.includes(status)) {
    const err = new Error(`Invalid payment status. Allowed: ${allowed.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }

  const payment = await Payment.findById(id);
  if (!payment) {
    const err = new Error("Payment not found");
    err.statusCode = 404;
    throw err;
  }

  payment.status = status;
  if (!payment.statusHistory) {
    payment.statusHistory = [];
  }

  payment.statusHistory.push({
    status,
    source: "admin",
    reason: `${reason} (Updated by: ${adminUser.email})`,
    changedAt: new Date(),
  });

  if (status === "captured" && !payment.capturedAt) {
    payment.capturedAt = new Date();
  }

  await payment.save();

  return payment;
};

module.exports = {
  getDashboardStats,
  getAdminComponents,
  getAdminComponentById,
  createAdminComponent,
  updateAdminComponent,
  deleteAdminComponent,
  updateComponentStatus,
  toggleComponentFeatured,
  getAdminUsers,
  getAdminUserById,
  updateUserRole,
  updateUserSubscription,
  deleteAdminUser,
  getAdminPayments,
  getAdminPaymentById,
  updatePaymentStatus,
};
