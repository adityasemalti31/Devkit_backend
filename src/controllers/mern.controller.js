// MERN Stack Learning Platform - Basic Plan API Controller

const snippetsData = [
  {
    id: "react-fetch-data",
    tech: "React",
    category: "Frontend Data Fetching",
    difficulty: "Zero-Knowledge",
    title: "Fetching Data from Express API in React",
    description: "How a React component asks the Express backend for data using useEffect and fetch.",
    code: `import { useState, useEffect } from 'react';

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Send HTTP GET request to Express Backend
    fetch('http://localhost:5000/api/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => console.error('Error fetching users:', err));
  }, []);

  if (loading) return <p>Loading users...</p>;

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name} - {user.email}</li>
      ))}
    </ul>
  );
}`,
    explanation: [
      "useState stores the users retrieved from backend in React component memory.",
      "useEffect runs once when the screen mounts, triggering the HTTP fetch request.",
      "fetch('http://localhost:5000/api/users') sends a request over the network to Node/Express.",
      "res.json() converts the raw HTTP response into JavaScript objects.",
      "setUsers(data) updates component state, causing React to render the list automatically."
    ],
    outputPreview: JSON.stringify([
      { id: "1", name: "Alice Johnson", email: "alice@example.com" },
      { id: "2", name: "Bob Smith", email: "bob@example.com" }
    ], null, 2)
  },
  {
    id: "express-route-controller",
    tech: "Express",
    category: "Backend API Routes",
    difficulty: "Beginner",
    title: "Creating an Express REST API Endpoint",
    description: "How Express listens for requests and sends JSON back to React.",
    code: `const express = require('express');
const router = express.Router();

// Simulated database array
const users = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com' }
];

// GET /api/users - Return all users
router.get('/users', (req, res) => {
  // Return HTTP 200 status with JSON data
  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

module.exports = router;`,
    explanation: [
      "express.Router() organizes backend URL endpoints cleanly.",
      "router.get('/users', ...) handles GET requests sent from React.",
      "req (request) holds browser data, res (response) sends data back.",
      "res.status(200).json(...) sets success code 200 and converts JS objects to JSON format."
    ],
    outputPreview: JSON.stringify({
      success: true,
      count: 2,
      data: [
        { id: 1, name: "Alice Johnson", email: "alice@example.com" },
        { id: 2, name: "Bob Smith", email: "bob@example.com" }
      ]
    }, null, 2)
  },
  {
    id: "mongoose-schema-model",
    tech: "MongoDB",
    category: "Database Schemas",
    difficulty: "Beginner",
    title: "MongoDB Mongoose Model & Schema",
    description: "Defining how data looks before storing it inside MongoDB.",
    code: `const mongoose = require('mongoose');

// Define the blueprint for User documents
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true
  },
  role: {
    type: String,
    enum: ['student', 'developer', 'admin'],
    default: 'student'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compile Schema into a Mongoose Model
module.exports = mongoose.model('User', userSchema);`,
    explanation: [
      "mongoose.Schema defines structure, validation rules, and default values.",
      "required: true ensures missing fields are rejected automatically by database.",
      "unique: true prevents duplicate emails in MongoDB collection.",
      "mongoose.model('User', userSchema) creates a queryable Model object for Node.js."
    ],
    outputPreview: JSON.stringify({
      _id: "650f1a2b3c4d5e6f7a8b9c0d",
      name: "Alice Johnson",
      email: "alice@example.com",
      role: "student",
      createdAt: "2026-10-06T20:00:00.000Z"
    }, null, 2)
  },
  {
    id: "node-express-server",
    tech: "Node.js",
    category: "Server Setup",
    difficulty: "Zero-Knowledge",
    title: "Basic Node & Express HTTP Server",
    description: "Setting up a backend server listening on a port.",
    code: `const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS so React (localhost:3000) can talk to Express (localhost:5000)
app.use(cors());
// Parse incoming JSON body payloads
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'MERN Backend active!' });
});

app.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});`,
    explanation: [
      "express() creates the core server application instance.",
      "app.use(cors()) enables cross-origin browser communications.",
      "app.use(express.json()) allows reading JSON send in POST requests.",
      "app.listen(PORT) binds backend to network port 5000."
    ],
    outputPreview: JSON.stringify({
      status: "OK",
      message: "MERN Backend active!"
    }, null, 2)
  },
  {
    id: "fullstack-post-request",
    tech: "Full-Stack",
    category: "Full-Stack Flow",
    difficulty: "Intermediate",
    title: "Submitting Form from React to MongoDB via Express",
    description: "Complete flow of sending a POST request to add a new document in MongoDB.",
    code: `// REACT FRONTEND FORM HANDLER
async function handleSubmit(formData) {
  const response = await fetch('http://localhost:5000/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  const result = await response.json();
  console.log('Saved to DB:', result);
}

// EXPRESS CONTROLLER (NODE.JS)
async function createUser(req, res) {
  try {
    const newUser = await User.create(req.body); // Saves to MongoDB
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}`,
    explanation: [
      "React sends HTTP POST method with stringified JSON body payload.",
      "Express receives request, passes body to User.create(req.body).",
      "Mongoose validates payload against schema and inserts document into MongoDB.",
      "Express responds with HTTP 201 Created and return document object back to React."
    ],
    outputPreview: JSON.stringify({
      success: true,
      data: {
        _id: "650f88889999000011112222",
        name: "New Student",
        email: "student@mern.dev",
        role: "student",
        createdAt: "2026-10-06T21:00:00.000Z"
      }
    }, null, 2)
  }
];

const flowStepsData = [
  {
    step: 1,
    component: "React (Frontend)",
    action: "User Clicks Button / Component Mounts",
    title: "1. User Action in Browser",
    description: "The user interacts with the UI in the browser. React manages local state and invokes an async function containing fetch() or axios().",
    codeSnippet: "fetch('https://api.myapp.com/products')\n  .then(res => res.json())\n  .then(data => setProducts(data));",
    analogy: "Think of React as the touchscreen counter at a restaurant. You tap what you want to order."
  },
  {
    step: 2,
    component: "Network / REST API",
    action: "HTTP Request Sent Over Internet",
    title: "2. HTTP Request Transmission",
    description: "An HTTP GET or POST request travels across the network formatted with headers, path, parameters, and optional JSON body payload.",
    codeSnippet: "GET /api/products HTTP/1.1\nHost: api.myapp.com\nContent-Type: application/json",
    analogy: "Think of the network as the waiter taking your order ticket back to the kitchen."
  },
  {
    step: 3,
    component: "Express.js (Router & Middleware)",
    action: "Route Matching & Security Check",
    title: "3. Express Intercepts Request",
    description: "Express matches the request path `/api/products` against defined routes, running CORS, Rate Limiter, and Auth Token middlewares.",
    codeSnippet: "app.get('/api/products', protectRoute, getProductsController);",
    analogy: "Think of Express as the kitchen receptionist who verifies your ticket and checks if you have permission."
  },
  {
    step: 4,
    component: "Node.js (Server Controller Logic)",
    action: "Executes JavaScript Business Logic",
    title: "4. Node Controller Execution",
    description: "Node.js runs the controller function. It processes input, performs validation, and prepares queries for MongoDB.",
    codeSnippet: "const products = await Product.find({ inStock: true }).sort('-createdAt');",
    analogy: "Think of Node.js as the chef following the recipe and preparing the raw ingredients."
  },
  {
    step: 5,
    component: "MongoDB (Database Query)",
    action: "Document Retrieval / Storage",
    title: "5. MongoDB Database Query",
    description: "Mongoose sends a BSON query driver command to MongoDB database engine. MongoDB finds matching BSON documents on disk and returns them.",
    codeSnippet: "db.products.find({ inStock: true })",
    analogy: "Think of MongoDB as the refrigerated storage pantry holding all stored items in organized bins."
  },
  {
    step: 6,
    component: "Express & React (Response & UI Render)",
    action: "JSON Returned & React State Updated",
    title: "6. Response Returned & UI Updated",
    description: "Node converts DB documents to JSON, Express sends HTTP 200 OK. React receives JSON response, updates state, and renders instant UI update!",
    codeSnippet: "res.status(200).json(products);\n// React: setProducts(data); -> Virtual DOM updates view!",
    analogy: "Think of this as your delicious hot food arriving at your table and bringing your meal to life!"
  }
];

const resourcesData = {
  githubRepos: [
    {
      name: "mern-starter-kit-basic",
      author: "dev-community",
      description: "Clean, zero-dependency starter template for MongoDB, Express, React, and Node. Ideal for beginners.",
      stars: 4820,
      url: "https://github.com/topics/mern-starter",
      level: "Zero-Knowledge",
      tags: ["Template", "Starter", "MERN"]
    },
    {
      name: "express-mongoose-cheatsheet",
      author: "backend-mastery",
      description: "Comprehensive code cheat sheets for Express routing, middleware, and Mongoose schema design patterns.",
      stars: 3210,
      url: "https://github.com/topics/expressjs",
      level: "Beginner",
      tags: ["CheatSheet", "Express", "Mongoose"]
    },
    {
      name: "react-19-hooks-guide",
      author: "react-community",
      description: "Interactive visual guide and repository showcasing modern React hooks (useState, useEffect, useMemo).",
      stars: 8900,
      url: "https://github.com/facebook/react",
      level: "Beginner",
      tags: ["React", "Hooks", "Frontend"]
    },
    {
      name: "fullstack-auth-boilerplate",
      author: "security-patterns",
      description: "Production-ready MERN authentication system with JWT tokens, HTTP-Only cookies, and password hashing.",
      stars: 5640,
      url: "https://github.com/topics/mern-stack",
      level: "Intermediate",
      tags: ["Auth", "JWT", "Security"]
    }
  ],
  cheatSheets: [
    { title: "MongoDB Query Operations", count: "25+ Commands", description: "find(), insertOne(), updateOne(), aggregate() basics." },
    { title: "Express Middleware & Status Codes", count: "18+ Statuses", description: "200, 201, 400, 401, 403, 404, 500 cheat sheet." },
    { title: "React Component Lifecycle & Hooks", count: "12+ Hooks", description: "useState, useEffect, useContext, useRef cheatsheet." },
    { title: "Node.js Async / Await Patterns", count: "10+ Patterns", description: "Promises, try/catch, async error handling templates." }
  ],
  docsLinks: [
    { name: "React Official Docs", url: "https://react.dev", tag: "Frontend UI" },
    { name: "Express.js Guide", url: "https://expressjs.com", tag: "Backend Framework" },
    { name: "MongoDB Manual", url: "https://www.mongodb.com/docs/", tag: "NoSQL Database" },
    { name: "Node.js Documentation", url: "https://nodejs.org/en/docs/", tag: "Runtime Environment" },
    { name: "Mongoose ODM Docs", url: "https://mongoosejs.com/docs/", tag: "Database Modeling" }
  ]
};

exports.getSnippets = async (req, res) => {
  try {
    const { tech, difficulty, search } = req.query;
    let filtered = [...snippetsData];

    if (tech && tech !== 'All') {
      filtered = filtered.filter(s => s.tech.toLowerCase() === tech.toLowerCase());
    }

    if (difficulty && difficulty !== 'All') {
      filtered = filtered.filter(s => s.difficulty.toLowerCase() === difficulty.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(s => 
        s.title.toLowerCase().includes(q) || 
        s.description.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q)
      );
    }

    res.status(200).json({
      success: true,
      plan: "Basic",
      count: filtered.length,
      data: filtered
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getFlowSteps = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      plan: "Basic",
      steps: flowStepsData
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getResources = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      plan: "Basic",
      resources: resourcesData
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const proSubscriptionModules = [
  {
    id: "payment-gateways",
    title: "Integration of Payment Gateways",
    tagline: "Razorpay & Stripe end-to-end integration with webhooks and signature verification",
    category: "Fintech & Payments",
    icon: "CreditCard",
    overview: "Master full-cycle payment integrations in full-stack MERN apps. Learn order lifecycle, webhook security, RBI recurring mandate compliance, and idempotent transactions.",
    topics: [
      {
        title: "Razorpay Standard Checkout & Orders API",
        description: "Generate server-side order IDs, render client Razorpay checkout script, and handle payment callbacks safely.",
        code: `// Express.js Razorpay Order Creation
const Razorpay = require("razorpay");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post("/api/pay/order", async (req, res) => {
  const { amount, planId } = req.body;
  const order = await razorpay.orders.create({
    amount: amount * 100, // in paise
    currency: "INR",
    receipt: \`rcpt_\${Date.now()}\`,
    notes: { planId, userId: req.user.id },
  });
  res.json({ success: true, orderId: order.id, key: process.env.RAZORPAY_KEY_ID });
});`,
      },
      {
        title: "HMAC-SHA256 Cryptographic Signature Verification",
        description: "Prevent payment spoofing by verifying signature hash against Razorpay Secret Key.",
        code: `const crypto = require("crypto");

function verifyRazorpaySignature({ orderId, paymentId, signature, secret }) {
  const body = \`\${orderId}|\${paymentId}\`;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}`,
      },
      {
        title: "Robust Webhooks & Idempotency",
        description: "Handle async payment events (order.paid, subscription.charged, refund.processed) with idempotency keys.",
        code: `app.post("/api/payments/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];
  const isValid = Razorpay.validateWebhookSignature(req.body, signature, secret);
  if (!isValid) return res.status(400).send("Invalid signature");

  const event = JSON.parse(req.body.toString());
  // Process event with idempotency check in MongoDB
  res.json({ status: "ok" });
});`,
      },
      {
        title: "Stripe Recurring Subscriptions & Customer Portal",
        description: "Stripe Billing, monthly & annual recurring tiers, webhook handling, and self-serve customer billing portal.",
        code: `const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const session = await stripe.checkout.sessions.create({
  mode: "subscription",
  payment_method_types: ["card"],
  line_items: [{ price: "price_12345", quantity: 1 }],
  customer_email: user.email,
  success_url: "https://yourapp.com/dashboard?session_id={CHECKOUT_SESSION_ID}",
  cancel_url: "https://yourapp.com/pricing",
});`,
      },
    ],
  },
  {
    id: "technical-architecture",
    title: "Technical Architecture & Clean Code",
    tagline: "Enterprise MERN design patterns, TypeScript strict typing, and resilient service layer",
    category: "Architecture & Engineering",
    icon: "Layers",
    overview: "Build scalable, clean architectures used in high-growth startups. Implement Controller-Service-Repository pattern, centralized error handling, and type safety.",
    topics: [
      {
        title: "Modular Clean Architecture (Controller-Service-Repository)",
        description: "Decouple routing logic from business services and database queries for maximum testability.",
        code: `// Service Layer (User Management)
class UserService {
  constructor(userRepo, emailService) {
    this.userRepo = userRepo;
    this.emailService = emailService;
  }
  async register(dto) {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) throw new AppError("Email already in use", 409);
    const user = await this.userRepo.create(dto);
    await this.emailService.sendWelcome(user);
    return user;
  }
}`,
      },
      {
        title: "End-to-End TypeScript Validation with Zod",
        description: "Enforce contract safety between client and server with runtime schema verification.",
        code: `import { z } from "zod";

export const CreateUserSchema = z.object({
  name: z.string().min(2, "Name too short").max(50),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["user", "admin"]).default("user"),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;`,
      },
      {
        title: "Centralized Global Error Handler & Logging",
        description: "Graceful error trapping with custom operational errors, stack trace suppression in production, and structured Winston logging.",
        code: `class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});`,
      },
    ],
  },
  {
    id: "seo-performance",
    title: "SEO & Web Performance Mastery",
    tagline: "Dynamic OpenGraph, automated XML sitemaps, JSON-LD schemas, and Core Web Vitals",
    category: "Growth & Visibility",
    icon: "Search",
    overview: "Get ranked on search engines and achieve a 100/100 Lighthouse score. Discover SSR/SSG rendering, structured metadata, and performance tuning.",
    topics: [
      {
        title: "Next.js 14+ Dynamic Metadata & Open Graph Tags",
        description: "Automatically generate rich preview social cards on Twitter/LinkedIn for any page or route.",
        code: `import type { Metadata, ResolvingMetadata } from "next";

export async function generateMetadata({ params }): Promise<Metadata> {
  const item = await fetchProduct(params.id);
  return {
    title: \`\${item.title} | DevKit\`,
    description: item.summary,
    openGraph: {
      title: item.title,
      description: item.summary,
      images: [{ url: item.imageUrl, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: { card: "summary_large_image", title: item.title },
  };
}`,
      },
      {
        title: "Automated Dynamic Sitemaps (sitemap.ts) & robots.txt",
        description: "Serve search engine spiders with fresh dynamic sitemaps with daily update priorities.",
        code: `// app/sitemap.ts
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  const postUrls = posts.map((p) => ({
    url: \`https://devkit.dev/blog/\${p.slug}\`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  return [
    { url: "https://devkit.dev", lastModified: new Date(), priority: 1 },
    ...postUrls,
  ];
}`,
      },
      {
        title: "JSON-LD Structured Data Schema for Rich Google Snippets",
        description: "Embed JSON-LD schemas to win star ratings, software badges, and FAQ rich snippets on Google.",
        code: `export function JsonLdSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "DevKit MERN Platform",
    operatingSystem: "Web",
    applicationCategory: "DeveloperApplication",
    offers: { "@type": "Offer", price: "299", priceCurrency: "INR" },
    aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", ratingCount: "340" },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}`,
      },
    ],
  },
  {
    id: "third-party-apis",
    title: "Integrating Third-Party APIs",
    tagline: "OAuth 2.0 social auth, AI LLM streaming (OpenAI & Gemini), and cloud asset pipelines",
    category: "Integrations & APIs",
    icon: "PlugZap",
    overview: "Connect enterprise third-party services smoothly: Google & GitHub OAuth, OpenAI/Gemini AI SDKs, Resend email triggers, and AWS S3 direct uploads.",
    topics: [
      {
        title: "Google & GitHub OAuth 2.0 Single Sign-On",
        description: "Integrate multi-provider social authentication with token exchange and profile sync.",
        code: `const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await User.create({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
      });
    }
    return done(null, user);
  }
));`,
      },
      {
        title: "AI Streaming with Google Gemini & OpenAI SDKs",
        description: "Stream conversational AI responses token-by-token directly into React using Server-Sent Events.",
        code: `import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.post("/api/ai/stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  const result = await model.generateContentStream(req.body.prompt);
  for await (const chunk of result.stream) {
    res.write(\`data: \${JSON.stringify({ text: chunk.text() })}\\n\\n\`);
  }
  res.end();
});`,
      },
      {
        title: "Cloud File Uploads via AWS S3 Presigned URLs",
        description: "Offload bandwidth by letting the client upload heavy images/videos directly to S3 with signed upload URLs.",
        code: `import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: process.env.AWS_REGION });

app.post("/api/upload/presign", async (req, res) => {
  const { filename, fileType } = req.body;
  const key = \`uploads/\${Date.now()}-\${filename}\`;
  const command = new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, ContentType: fileType });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  res.json({ uploadUrl, key });
});`,
      },
    ],
  },
  {
    id: "scaling-applications",
    title: "Scaling Applications & High Availability",
    tagline: "Database indexing, Redis caching, job queues, load balancing, and containerization",
    category: "DevOps & Scale",
    icon: "Server",
    overview: "Scale MERN architectures to handle 100,000+ daily concurrent users. Implement distributed Redis caches, BullMQ task runners, and Docker containers.",
    topics: [
      {
        title: "MongoDB Indexing Strategies & Query Optimization",
        description: "Avoid full collection scans (COLLSCAN) using compound indexes, TTL expiration indexes, and index intersection.",
        code: `// Compound Index for High-Traffic Query
userSchema.index({ organizationId: 1, createdAt: -1 });

// Text Index for Instant Search
snippetSchema.index({ title: "text", description: "text" });

// Query Explain Plan Check
const explain = await User.find({ organizationId: "org_1" })
  .sort({ createdAt: -1 })
  .explain("executionStats");
console.log("Docs Examined vs Returned:", explain.executionStats.totalDocsExamined);`,
      },
      {
        title: "Redis In-Memory Caching (Cache-Aside Pattern)",
        description: "Speed up response times from 350ms to 4ms by caching expensive DB responses in Redis.",
        code: `const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URL);

async function getCachedData(key, fetcher, ttl = 3600) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const fresh = await fetcher();
  await redis.set(key, JSON.stringify(fresh), "EX", ttl);
  return fresh;
}`,
      },
      {
        title: "Background Job Queues with BullMQ & Worker Nodes",
        description: "Process slow jobs (video compression, PDF generation, batch emails) asynchronously without blocking HTTP requests.",
        code: `const { Queue, Worker } = require("bullmq");

const emailQueue = new Queue("emailQueue", { connection: redisConfig });

// Dispatcher (API Route)
await emailQueue.add("sendReport", { userId: "123", email: "user@example.com" }, { attempts: 3, backoff: { type: "exponential", delay: 2000 } });

// Background Worker Process
const worker = new Worker("emailQueue", async (job) => {
  await sendComplexPdfReport(job.data);
}, { connection: redisConfig });`,
      },
      {
        title: "Production Docker & Multi-Stage Containers",
        description: "Package the frontend and backend into lightweight, secure Docker containers with PM2 cluster clustering.",
        code: `# Dockerfile (Node.js Backend Multi-Stage)
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

EXPOSE 5000
CMD ["node", "server.js"]`,
      },
    ],
  },
];

exports.getProContent = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      count: proSubscriptionModules.length,
      modules: proSubscriptionModules,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPlanDetails = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      currentPlan: {
        name: "Basic Plan",
        status: "Active",
        price: "₹0 / Forever",
        features: [
          "Access to 25+ essential MERN Code Snippets",
          "Interactive 6-Step MERN Request Visualizer",
          "Line-by-line Zero-Knowledge explanations",
          "Curated GitHub Repositories & Cheat Sheets",
          "3 Real-World Full-Stack Architecture Blueprints",
        ],
      },
      availableUpgrades: [
        {
          name: "Pro Developer Plan",
          price: "₹299 / month",
          yearlyPrice: "₹2,999 / year (Save 16%)",
          itemCode: "pro_monthly",
          yearlyItemCode: "pro_yearly",
          features: [
            "Everything in Basic Plan",
            "💳 Integration of Payment Gateways (Razorpay & Stripe end-to-end + Webhooks)",
            "🏗️ Technical Architecture & Clean Code (Controller-Service-Repo & TypeScript Zod)",
            "🔍 SEO Mastery & Web Performance (Dynamic OpenGraph, Sitemaps, JSON-LD Schema)",
            "🔌 Integrating Third-Party APIs (Google/GitHub OAuth, Gemini AI, AWS S3)",
            "🚀 Scaling Applications (Redis Cache-Aside, BullMQ Queues, MongoDB Indexes, Docker)",
            "50+ Full-Stack Production Templates",
            "In-Browser Node & Mongo Live Playground Sandbox",
            "1-on-1 Code Review & VIP Discord Access",
          ],
          modules: proSubscriptionModules.map((m) => ({
            id: m.id,
            title: m.title,
            tagline: m.tagline,
            category: m.category,
            topicsCount: m.topics.length,
          })),
        },
      ],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
