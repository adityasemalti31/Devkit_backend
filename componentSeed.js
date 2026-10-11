
require("dotenv").config();

const mongoose = require("mongoose");
const Component = require("./src/models/component.model");

const components = [
  {
    name: "Modern Navbar",
    slug: "modern-navbar",
    description: "Responsive navbar with logo, navigation links and CTA button.",
    category: "navbar",
    tags: ["navbar", "responsive", "navigation", "tailwind"],
    access: "free",
    framework: "react",
    styling: "tailwind",
    language: "jsx",
    preview: {
      type: "registry",
      registryKey: "modern-navbar",
    },
    sourceCode: {
      code: `export default function Navbar() {
  return (
    <nav className="flex items-center justify-between bg-[#050505] px-6 py-4 text-white">
      <h1 className="text-xl font-bold">DevKit</h1>
      <div className="flex items-center gap-6">
        <a href="#home">Home</a>
        <a href="#components">Components</a>
        <a href="#pricing">Pricing</a>
        <button className="rounded-lg bg-white px-4 py-2 text-black">
          Get Started
        </button>
      </div>
    </nav>
  );
}`,
      styles: "",
      usageExample: "<Navbar />",
      dependencies: [],
    },
    installation: "Create Navbar.jsx and import it into your page.",
    status: "published",
    featured: true,
  },
  {
    name: "Gradient Hero",
    slug: "gradient-hero",
    description: "A modern landing page hero with a headline, description and CTA.",
    category: "hero",
    tags: ["hero", "landing-page", "gradient", "cta"],
    access: "free",
    framework: "react",
    styling: "tailwind",
    language: "jsx",
    preview: {
      type: "registry",
      registryKey: "gradient-hero",
    },
    sourceCode: {
      code: `export default function Hero() {
  return (
    <section className="bg-[#050505] px-6 py-24 text-center text-white">
      <span className="rounded-full border border-white/20 px-4 py-2 text-sm text-gray-300">
        Built for developers
      </span>
      <h1 className="mx-auto mt-8 max-w-3xl text-5xl font-bold tracking-tight">
        Build better products, faster.
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-gray-400">
        Explore reusable components and build your next project with confidence.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <button className="rounded-lg bg-white px-6 py-3 font-medium text-black">
          Explore Components
        </button>
        <button className="rounded-lg border border-white/20 px-6 py-3">
          Learn More
        </button>
      </div>
    </section>
  );
}`,
      styles: "",
      usageExample: "<Hero />",
      dependencies: [],
    },
    installation: "Create Hero.jsx and import it into your landing page.",
    status: "published",
    featured: true,
  },
  {
    name: "Feature Card",
    slug: "feature-card",
    description: "Reusable feature card with an icon area, title and description.",
    category: "cards",
    tags: ["card", "features", "reusable", "tailwind"],
    access: "free",
    framework: "react",
    styling: "tailwind",
    language: "jsx",
    preview: {
      type: "registry",
      registryKey: "feature-card",
    },
    sourceCode: {
      code: `export default function FeatureCard() {
  return (
    <div className="max-w-sm rounded-2xl border border-white/10 bg-[#0b0b0b] p-6 text-white transition hover:border-white/30">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-xl">
        ⚡
      </div>
      <h2 className="text-xl font-semibold">Fast Development</h2>
      <p className="mt-3 leading-6 text-gray-400">
        Start with reusable building blocks and spend more time creating.
      </p>
    </div>
  );
}`,
      styles: "",
      usageExample: "<FeatureCard />",
      dependencies: [],
    },
    installation: "Create FeatureCard.jsx and import it wherever required.",
    status: "published",
    featured: false,
  },
  {
    name: "Primary Button",
    slug: "primary-button",
    description: "Reusable primary action button with hover interaction.",
    category: "buttons",
    tags: ["button", "cta", "interactive"],
    access: "free",
    framework: "react",
    styling: "tailwind",
    language: "jsx",
    preview: {
      type: "registry",
      registryKey: "primary-button",
    },
    sourceCode: {
      code: `export default function PrimaryButton({ children = "Get Started", onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg bg-white px-6 py-3 font-semibold text-black transition hover:bg-gray-200 active:scale-95"
    >
      {children}
    </button>
  );
}`,
      styles: "",
      usageExample: '<PrimaryButton onClick={() => alert("Clicked!")} />',
      dependencies: [],
    },
    installation: "Create PrimaryButton.jsx and import it into your component.",
    status: "published",
    featured: false,
  },
  {
    name: "Premium Pricing Section",
    slug: "premium-pricing-section",
    description: "A pricing section with a highlighted plan and feature list.",
    category: "pricing",
    tags: ["pricing", "subscription", "plans"],
    access: "premium",
    framework: "react",
    styling: "tailwind",
    language: "jsx",
    preview: {
      type: "registry",
      registryKey: "premium-pricing-section",
    },
    sourceCode: {
      code: `const features = [
  "Unlimited projects",
  "Premium components",
  "Source code access",
  "Priority updates",
];

export default function PricingCard() {
  return (
    <div className="max-w-sm rounded-2xl border border-white/20 bg-[#0b0b0b] p-8 text-white">
      <p className="text-sm text-gray-400">PRO PLAN</p>
      <h2 className="mt-3 text-3xl font-bold">₹499/month</h2>
      <p className="mt-3 text-gray-400">
        Everything you need to build faster.
      </p>
      <ul className="my-6 space-y-3">
        {features.map((feature) => (
          <li key={feature}>✓ {feature}</li>
        ))}
      </ul>
      <button className="w-full rounded-lg bg-white py-3 font-semibold text-black">
        Choose Plan
      </button>
    </div>
  );
}`,
      styles: "",
      usageExample: "<PricingCard />",
      dependencies: [],
    },
    installation: "Create PricingCard.jsx and import it into your pricing page.",
    status: "published",
    featured: true,
  },
  {
    name: "Premium Dashboard Stats",
    slug: "premium-dashboard-stats",
    description: "A dashboard metric card showing a value and its growth.",
    category: "dashboard",
    tags: ["dashboard", "analytics", "metrics"],
    access: "premium",
    framework: "react",
    styling: "tailwind",
    language: "jsx",
    preview: {
      type: "registry",
      registryKey: "premium-dashboard-stats",
    },
    sourceCode: {
      code: `export default function StatsCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6 text-white">
      <p className="text-sm text-gray-400">Total Revenue</p>
      <div className="mt-3 flex items-end justify-between">
        <h2 className="text-3xl font-bold">₹84,250</h2>
        <span className="text-sm text-green-400">+12.8%</span>
      </div>
      <p className="mt-3 text-sm text-gray-500">
        Compared to the previous month
      </p>
    </div>
  );
}`,
      styles: "",
      usageExample: "<StatsCard />",
      dependencies: [],
    },
    installation: "Create StatsCard.jsx and import it into your dashboard.",
    status: "published",
    featured: false,
  },
];

const seedComponents = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    for (const component of components) {
     await Component.findOneAndUpdate(
  { slug: component.slug },
  {
    $set: Object.fromEntries(
      Object.entries(component).filter(([key]) => key !== "slug")
    ),
    $setOnInsert: {
      slug: component.slug,
    },
  },
  {
    upsert: true,
    new: true,
    runValidators: true,
  }
);
    }

    console.log(`${components.length} components seeded successfully`);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedComponents();
