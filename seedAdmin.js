require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/user.model");

const seedAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI is not set in .env");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const adminEmail = process.env.ADMIN_EMAIL || "admin@devkit.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "AdminDevkit@2026";
    const adminName = "DevKit Super Admin";

    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      admin.role = "admin";
      admin.subscription = {
        plan: "pro",
        status: "active",
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        paymentId: "admin_permanent_access",
      };
      await admin.save();
      console.log(`✅ Existing user updated to ADMIN role: ${adminEmail}`);
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      admin = await User.create({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        subscription: {
          plan: "pro",
          status: "active",
          startedAt: new Date(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          paymentId: "admin_permanent_access",
        },
      });
      console.log(`✅ New ADMIN user created: ${adminEmail}`);
    }

    // Also upgrade aditya@gmail.com to admin if it exists
    const devUser = await User.findOne({ email: "aditya@gmail.com" });
    if (devUser) {
      devUser.role = "admin";
      await devUser.save();
      console.log("✅ Also assigned ADMIN role to dev account: aditya@gmail.com");
    }

    console.log("\n==========================================");
    console.log("🔑 ADMIN CREDENTIALS:");
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role:     admin`);
    console.log("==========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Admin Seeding failed:", error.message);
    process.exit(1);
  }
};

seedAdmin();
