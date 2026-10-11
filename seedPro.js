
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/user.model"); // Apne model ka path check kar lena
require("dotenv").config();

const seedUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = "prouser@devkit.com";
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("User already exists:", email);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("ProUser@123", 12);

    const user = await User.create({
      name: "DevKit Pro User",
      email,
      password: hashedPassword,
      subscription: {
        plan: "pro",
        status: "active",
        startedAt: new Date(),
        expiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ),
        paymentId: "seed_pro_subscription",
      },
    });

    console.log("Pro user seeded successfully!");
    console.log("Email:", user.email);
    console.log("Password: ProUser@123");
    console.log("Plan:", user.subscription.plan);

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
};

seedUser();
