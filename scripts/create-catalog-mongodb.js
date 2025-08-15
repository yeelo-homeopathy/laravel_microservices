// Catalog Service MongoDB Schema
// MongoDB collections and indexes for product catalog management

// Connect to the catalog database
const use = require("mongodb").use
const db = use("ecom_catalog")
const NumberDecimal = require("mongodb").NumberDecimal

// =============================================================================
// PRODUCTS COLLECTION
// =============================================================================

// Create products collection with schema validation
db.createCollection("products", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "slug", "status", "type", "createdAt"],
      properties: {
        _id: { bsonType: "objectId" },

        // Basic Information
        name: { bsonType: "string", minLength: 1, maxLength: 255 },
        slug: { bsonType: "string", pattern: "^[a-z0-9-]+$" },
        description: { bsonType: "string" },
        shortDescription: { bsonType: "string", maxLength: 500 },

        // Product Classification
        type: {
          bsonType: "string",
          enum: ["simple", "variable", "grouped", "external", "digital", "subscription"],
        },
        status: {
          bsonType: "string",
          enum: ["draft", "active", "inactive", "archived"],
        },
        visibility: {
          bsonType: "string",
          enum: ["public", "private", "hidden"],
        },

        // Categorization
        categories: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["id", "name"],
            properties: {
              id: { bsonType: "string" },
              name: { bsonType: "string" },
              slug: { bsonType: "string" },
              level: { bsonType: "int", minimum: 0 },
            },
          },
        },

        // Tags and Labels
        tags: {
          bsonType: "array",
          items: { bsonType: "string" },
        },

        // SEO Information
        seo: {
          bsonType: "object",
          properties: {
            title: { bsonType: "string", maxLength: 60 },
            description: { bsonType: "string", maxLength: 160 },
            keywords: {
              bsonType: "array",
              items: { bsonType: "string" },
            },
            canonicalUrl: { bsonType: "string" },
          },
        },

        // Media
        images: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["url"],
            properties: {
              id: { bsonType: "string" },
              url: { bsonType: "string" },
              alt: { bsonType: "string" },
              title: { bsonType: "string" },
              position: { bsonType: "int", minimum: 0 },
              isPrimary: { bsonType: "bool" },
            },
          },
        },

        // Variants (for variable products)
        variants: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["id", "sku"],
            properties: {
              id: { bsonType: "string" },
              sku: { bsonType: "string" },
              name: { bsonType: "string" },
              attributes: {
                bsonType: "object",
              },
              pricing: {
                bsonType: "object",
                properties: {
                  regular: { bsonType: "decimal" },
                  sale: { bsonType: "decimal" },
                  cost: { bsonType: "decimal" },
                },
              },
              inventory: {
                bsonType: "object",
                properties: {
                  tracked: { bsonType: "bool" },
                  quantity: { bsonType: "int" },
                  lowStockThreshold: { bsonType: "int" },
                },
              },
              images: {
                bsonType: "array",
                items: { bsonType: "string" },
              },
              weight: { bsonType: "decimal" },
              dimensions: {
                bsonType: "object",
                properties: {
                  length: { bsonType: "decimal" },
                  width: { bsonType: "decimal" },
                  height: { bsonType: "decimal" },
                },
              },
            },
          },
        },

        // Attributes (flexible product properties)
        attributes: {
          bsonType: "object",
        },

        // Specifications
        specifications: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["name", "value"],
            properties: {
              name: { bsonType: "string" },
              value: { bsonType: "string" },
              group: { bsonType: "string" },
              unit: { bsonType: "string" },
              position: { bsonType: "int" },
            },
          },
        },

        // Seller Information (for marketplace)
        seller: {
          bsonType: "object",
          properties: {
            id: { bsonType: "string" },
            name: { bsonType: "string" },
            slug: { bsonType: "string" },
            rating: { bsonType: "decimal", minimum: 0, maximum: 5 },
            reviewCount: { bsonType: "int", minimum: 0 },
          },
        },

        // Brand Information
        brand: {
          bsonType: "object",
          properties: {
            id: { bsonType: "string" },
            name: { bsonType: "string" },
            slug: { bsonType: "string" },
            logo: { bsonType: "string" },
          },
        },

        // Reviews and Ratings
        reviews: {
          bsonType: "object",
          properties: {
            averageRating: { bsonType: "decimal", minimum: 0, maximum: 5 },
            totalReviews: { bsonType: "int", minimum: 0 },
            ratingDistribution: {
              bsonType: "object",
              properties: {
                1: { bsonType: "int", minimum: 0 },
                2: { bsonType: "int", minimum: 0 },
                3: { bsonType: "int", minimum: 0 },
                4: { bsonType: "int", minimum: 0 },
                5: { bsonType: "int", minimum: 0 },
              },
            },
          },
        },

        // Related Products
        relatedProducts: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["id", "type"],
            properties: {
              id: { bsonType: "string" },
              type: {
                bsonType: "string",
                enum: ["cross_sell", "up_sell", "related", "alternative"],
              },
              position: { bsonType: "int" },
            },
          },
        },

        // Metadata
        metadata: { bsonType: "object" },

        // Timestamps
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
        publishedAt: { bsonType: "date" },
      },
    },
  },
})

// Create indexes for products collection
db.products.createIndex({ slug: 1 }, { unique: true })
db.products.createIndex({ status: 1 })
db.products.createIndex({ type: 1 })
db.products.createIndex({ visibility: 1 })
db.products.createIndex({ "categories.id": 1 })
db.products.createIndex({ "categories.slug": 1 })
db.products.createIndex({ tags: 1 })
db.products.createIndex({ "seller.id": 1 })
db.products.createIndex({ "brand.id": 1 })
db.products.createIndex({ "variants.sku": 1 })
db.products.createIndex({ "reviews.averageRating": -1 })
db.products.createIndex({ createdAt: -1 })
db.products.createIndex({ updatedAt: -1 })

// Text search index for product search
db.products.createIndex(
  {
    name: "text",
    description: "text",
    shortDescription: "text",
    tags: "text",
    "brand.name": "text",
    "categories.name": "text",
  },
  {
    weights: {
      name: 10,
      tags: 5,
      "brand.name": 3,
      "categories.name": 2,
      description: 1,
      shortDescription: 1,
    },
    name: "product_search_index",
  },
)

// Compound indexes for common queries
db.products.createIndex({ status: 1, visibility: 1, createdAt: -1 })
db.products.createIndex({ "categories.id": 1, status: 1, "reviews.averageRating": -1 })
db.products.createIndex({ "seller.id": 1, status: 1, createdAt: -1 })

// =============================================================================
// CATEGORIES COLLECTION
// =============================================================================

db.createCollection("categories", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "slug", "level", "status", "createdAt"],
      properties: {
        _id: { bsonType: "objectId" },

        // Basic Information
        name: { bsonType: "string", minLength: 1, maxLength: 255 },
        slug: { bsonType: "string", pattern: "^[a-z0-9-]+$" },
        description: { bsonType: "string" },

        // Hierarchy
        parentId: { bsonType: ["objectId", "null"] },
        level: { bsonType: "int", minimum: 0 },
        path: { bsonType: "string" }, // e.g., "/electronics/computers/laptops"

        // Status
        status: {
          bsonType: "string",
          enum: ["active", "inactive"],
        },

        // Display
        image: { bsonType: "string" },
        icon: { bsonType: "string" },
        color: { bsonType: "string" },
        position: { bsonType: "int", minimum: 0 },

        // SEO
        seo: {
          bsonType: "object",
          properties: {
            title: { bsonType: "string", maxLength: 60 },
            description: { bsonType: "string", maxLength: 160 },
            keywords: {
              bsonType: "array",
              items: { bsonType: "string" },
            },
          },
        },

        // Statistics
        productCount: { bsonType: "int", minimum: 0 },

        // Metadata
        metadata: { bsonType: "object" },

        // Timestamps
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
})

// Create indexes for categories collection
db.categories.createIndex({ slug: 1 }, { unique: true })
db.categories.createIndex({ parentId: 1 })
db.categories.createIndex({ level: 1 })
db.categories.createIndex({ path: 1 })
db.categories.createIndex({ status: 1 })
db.categories.createIndex({ position: 1 })
db.categories.createIndex({ parentId: 1, position: 1 })

// =============================================================================
// BRANDS COLLECTION
// =============================================================================

db.createCollection("brands", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "slug", "status", "createdAt"],
      properties: {
        _id: { bsonType: "objectId" },

        // Basic Information
        name: { bsonType: "string", minLength: 1, maxLength: 255 },
        slug: { bsonType: "string", pattern: "^[a-z0-9-]+$" },
        description: { bsonType: "string" },

        // Branding
        logo: { bsonType: "string" },
        banner: { bsonType: "string" },
        website: { bsonType: "string" },

        // Status
        status: {
          bsonType: "string",
          enum: ["active", "inactive"],
        },

        // SEO
        seo: {
          bsonType: "object",
          properties: {
            title: { bsonType: "string", maxLength: 60 },
            description: { bsonType: "string", maxLength: 160 },
            keywords: {
              bsonType: "array",
              items: { bsonType: "string" },
            },
          },
        },

        // Statistics
        productCount: { bsonType: "int", minimum: 0 },

        // Metadata
        metadata: { bsonType: "object" },

        // Timestamps
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
})

// Create indexes for brands collection
db.brands.createIndex({ slug: 1 }, { unique: true })
db.brands.createIndex({ status: 1 })
db.brands.createIndex({ name: 1 })

// =============================================================================
// SAMPLE DATA INSERTION
// =============================================================================

// Insert sample categories
db.categories.insertMany([
  {
    name: "Electronics",
    slug: "electronics",
    description: "Electronic devices and accessories",
    parentId: null,
    level: 0,
    path: "/electronics",
    status: "active",
    position: 1,
    productCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Computers",
    slug: "computers",
    description: "Desktop and laptop computers",
    parentId: null, // Will be updated with actual ObjectId
    level: 1,
    path: "/electronics/computers",
    status: "active",
    position: 1,
    productCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
])

// Insert sample brands
db.brands.insertMany([
  {
    name: "Apple",
    slug: "apple",
    description: "Premium consumer electronics",
    logo: "/brands/apple-logo.png",
    website: "https://apple.com",
    status: "active",
    productCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Samsung",
    slug: "samsung",
    description: "Global technology company",
    logo: "/brands/samsung-logo.png",
    website: "https://samsung.com",
    status: "active",
    productCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
])

// Insert sample product
db.products.insertOne({
  name: "iPhone 15 Pro",
  slug: "iphone-15-pro",
  description: "The most advanced iPhone with titanium design and A17 Pro chip",
  shortDescription: "Premium smartphone with advanced camera system",
  type: "variable",
  status: "active",
  visibility: "public",
  categories: [
    {
      id: "electronics",
      name: "Electronics",
      slug: "electronics",
      level: 0,
    },
    {
      id: "smartphones",
      name: "Smartphones",
      slug: "smartphones",
      level: 1,
    },
  ],
  tags: ["smartphone", "premium", "5g", "camera"],
  seo: {
    title: "iPhone 15 Pro - Advanced Smartphone | Apple",
    description: "Experience the iPhone 15 Pro with titanium design, A17 Pro chip, and advanced camera system.",
    keywords: ["iphone", "smartphone", "apple", "premium", "5g"],
  },
  images: [
    {
      id: "img1",
      url: "/products/iphone-15-pro-1.jpg",
      alt: "iPhone 15 Pro front view",
      position: 0,
      isPrimary: true,
    },
  ],
  variants: [
    {
      id: "iphone-15-pro-128gb-natural",
      sku: "IPH15P-128-NAT",
      name: "iPhone 15 Pro 128GB Natural Titanium",
      attributes: {
        storage: "128GB",
        color: "Natural Titanium",
      },
      pricing: {
        regular: NumberDecimal("999.00"),
        sale: null,
        cost: NumberDecimal("600.00"),
      },
      inventory: {
        tracked: true,
        quantity: 50,
        lowStockThreshold: 10,
      },
    },
  ],
  attributes: {
    brand: "Apple",
    model: "iPhone 15 Pro",
    operatingSystem: "iOS 17",
  },
  specifications: [
    {
      name: "Display",
      value: "6.1-inch Super Retina XDR",
      group: "Display",
      position: 1,
    },
    {
      name: "Chip",
      value: "A17 Pro",
      group: "Performance",
      position: 2,
    },
  ],
  brand: {
    id: "apple",
    name: "Apple",
    slug: "apple",
  },
  reviews: {
    averageRating: NumberDecimal("4.5"),
    totalReviews: 0,
    ratingDistribution: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
  },
  relatedProducts: [],
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  publishedAt: new Date(),
})

print("Catalog MongoDB schema created successfully!")
print("Collections created: products, categories, brands")
print("Indexes created for optimal query performance")
print("Sample data inserted for testing")
