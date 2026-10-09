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

exports.getPlanDetails = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      currentPlan: {
        name: "Basic Plan",
        status: "Active",
        price: "$0 / Forever",
        features: [
          "Access to 25+ essential MERN Code Snippets",
          "Interactive 6-Step MERN Request Visualizer",
          "Line-by-line Zero-Knowledge explanations",
          "Curated GitHub Repositories & Cheat Sheets",
          "3 Real-World Full-Stack Architecture Blueprints"
        ]
      },
      availableUpgrades: [
        {
          name: "Pro Developer Plan",
          price: "$19 / month",
          features: [
            "Everything in Basic Plan",
            "50+ Production-ready MERN Full-Stack Starters",
            "In-Browser Node & Mongo Live Playground Sandbox",
            "AI Code Explainer & Debugger",
            "1-on-1 Code Review & Discord VIP Access"
          ]
        }
      ]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
