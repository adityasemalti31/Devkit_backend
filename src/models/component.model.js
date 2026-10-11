
const mongoose = require("mongoose");

const componentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Component name is required"],
      trim: true,
      maxlength: [100, "Component name cannot exceed 100 characters"],
    },

    slug: {
      type: String,
      required: [true, "Component slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain lowercase letters, numbers and hyphens",
      ],
      maxlength: 120,
    },

    description: {
      type: String,
      required: [true, "Component description is required"],
      trim: true,
      maxlength: 1000,
    },

    category: {
      type: String,
      required: [true, "Component category is required"],
      lowercase: true,
      trim: true,
      enum: [
        "navbar",
        "hero",
        "footer",
        "buttons",
        "cards",
        "forms",
        "modals",
        "pricing",
        "dashboard",
        "sidebar",
        "tables",
        "loaders",
        "animations",
        "authentication",
        "other",
      ],
      index: true,
    },

    tags: {
      type: [String],
      default: [],
      set: (tags) =>
        Array.isArray(tags)
          ? [...new Set(tags.map((tag) => tag.trim().toLowerCase()))]
          : tags,
    },

    // Access control
    access: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
      required: true,
      index: true,
    },

    // Supported frontend technology
    framework: {
      type: String,
      enum: ["react", "nextjs", "html"],
      default: "react",
      required: true,
      index: true,
    },

    styling: {
      type: String,
      enum: ["tailwind", "css", "inline"],
      default: "tailwind",
      required: true,
    },

    language: {
      type: String,
      enum: ["tsx", "jsx", "html"],
      default: "tsx",
      required: true,
    },

    // Live preview configuration.
    // This references trusted, predefined preview implementations.
    preview: {
      type: {
        type: String,
        enum: ["registry", "iframe"],
        default: "registry",
      },

      registryKey: {
        type: String,
        trim: true,
        maxlength: 150,
      },

      html: {
        type: String,
        default: undefined,
      },

      css: {
        type: String,
        default: undefined,
      },

      js: {
        type: String,
        default: undefined,
      },

      thumbnailUrl: {
        type: String,
        trim: true,
        maxlength: 2048,
      },
    },

    // Source code should only be returned to users with access.
    sourceCode: {
      code: {
        type: String,
        required: [true, "Component source code is required"],
      },

      styles: {
        type: String,
        default: "",
      },

      usageExample: {
        type: String,
        default: "",
      },

      dependencies: {
        type: [
          {
            name: {
              type: String,
              required: true,
              trim: true,
            },

            version: {
              type: String,
              trim: true,
              default: "",
            },
          },
        ],
        default: [],
      },
    },

    // Optional setup instructions
    installation: {
      type: String,
      default: "",
      maxlength: 5000,
    },

    // Publication and administration
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },

    featured: {
      type: Boolean,
      default: false,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Increment when the component's implementation changes.
    version: {
      type: Number,
      default: 1,
      min: 1,
    },

    // Optional discovery metrics
    stats: {
      views: {
        type: Number,
        default: 0,
        min: 0,
      },

      copies: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: "throw",
  }
);

// Efficient library queries
componentSchema.index({
  status: 1,
  category: 1,
  access: 1,
  createdAt: -1,
});

componentSchema.index({
  status: 1,
  featured: -1,
  createdAt: -1,
});

// Search component names and descriptions
componentSchema.index(
  {
    name: "text",
    description: "text",
    tags: "text",
  },
  {
    default_language: "english",
    language_override: "searchLanguage",
  }
);

// Prevent accidental modification of the slug on updates
componentSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();

  if (
    update?.slug !== undefined ||
    update?.$set?.slug !== undefined
  ) {
    throw new Error("Component slug cannot be changed through this operation");
  }
});

const Component = mongoose.model("Component", componentSchema);

module.exports = Component;
