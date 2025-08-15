// MongoDB initialization script for e-commerce catalog database
// Creates necessary collections with proper indexes for optimal performance

// Declare the db variable
const db = db.getSiblingDB("ecom_catalog")

// Create collections with validation schemas and indexes

// =============================================================================
// PRODUCTS COLLECTION
// =============================================================================
db.createCollection("products", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["sku", "title", "status", "sellerId"],
      properties: {
        sku: {
          bsonType: "string",
          description: "Unique product identifier - required",
        },
        title: {
          bsonType: "string",
          minLength: 1,
          maxLength: 200,
          description: "Product title - required",
        },
        slug: {
          bsonType: "string",
          description: "URL-friendly product identifier",
        },
        description: {
          bsonType: "string",
          maxLength: 5000,
          description: "Product description",
        },
        sellerId: {
          bsonType: "string",
          description: "Reference to seller - required",
        },
        brandId: {
          bsonType: "string",
          description: "Reference to brand",
        },
        categoryIds: {
          bsonType: "array",
          items: {
            bsonType: "string",
          },
          description: "Array of category references",
        },
        attributes: {
          bsonType: "object",
          description: "Flexible product attributes (color, size, etc.)",
        },
        images: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["url", "alt"],
            properties: {
              url: { bsonType: "string" },
              alt: { bsonType: "string" },
              isPrimary: { bsonType: "bool" },
              sortOrder: { bsonType: "int" },
            },
          },
        },
        variants: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["sku", "attributes"],
            properties: {
              sku: { bsonType: "string" },
              attributes: { bsonType: "object" },
              images: { bsonType: "array" },
            },
          },
        },
        status: {
          bsonType: "string",
          enum: ["draft", "active", "inactive", "blocked"],
          description: "Product status - required",
        },
        seoTitle: {
          bsonType: "string",
          maxLength: 60,
        },
        seoDescription: {
          bsonType: "string",
          maxLength: 160,
        },
        tags: {
          bsonType: "array",
          items: {
            bsonType: "string",
          },
        },
        createdAt: {
          bsonType: "date",
          description: "Creation timestamp",
        },
        updatedAt: {
          bsonType: "date",
          description: "Last update timestamp",
        },
      },
    },
  },
})

// Create indexes for products collection
db.products.createIndex({ sku: 1 }, { unique: true })
db.products.createIndex({ slug: 1 }, { unique: true, sparse: true })
db.products.createIndex({ sellerId: 1 })
db.products.createIndex({ brandId: 1 })
db.products.createIndex({ categoryIds: 1 })
db.products.createIndex({ status: 1 })
db.products.createIndex({ createdAt: -1 })
db.products.createIndex({ updatedAt: -1 })
// Text index for search functionality
db.products.createIndex(
  {
    title: "text",
    description: "text",
    tags: "text",
  },
  {
    weights: {
      title: 10,
      tags: 5,
      description: 1,
    },
    name: "product_text_search",
  },
)

// =============================================================================
// CATEGORIES COLLECTION
// =============================================================================
db.createCollection("categories", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "slug", "status"],
      properties: {
        name: {
          bsonType: "string",
          minLength: 1,
          maxLength: 100,
          description: "Category name - required",
        },
        slug: {
          bsonType: "string",
          description: "URL-friendly category identifier - required",
        },
        description: {
          bsonType: "string",
          maxLength: 1000,
        },
        parentId: {
          bsonType: "string",
          description: "Reference to parent category for hierarchy",
        },
        level: {
          bsonType: "int",
          minimum: 0,
          description: "Category hierarchy level",
        },
        path: {
          bsonType: "string",
          description: "Full category path for efficient queries",
        },
        image: {
          bsonType: "object",
          properties: {
            url: { bsonType: "string" },
            alt: { bsonType: "string" },
          },
        },
        attributes: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["name", "type"],
            properties: {
              name: { bsonType: "string" },
              type: {
                bsonType: "string",
                enum: ["text", "number", "boolean", "select", "multiselect"],
              },
              required: { bsonType: "bool" },
              options: { bsonType: "array" },
            },
          },
        },
        status: {
          bsonType: "string",
          enum: ["active", "inactive"],
          description: "Category status - required",
        },
        sortOrder: {
          bsonType: "int",
          minimum: 0,
        },
        seoTitle: {
          bsonType: "string",
          maxLength: 60,
        },
        seoDescription: {
          bsonType: "string",
          maxLength: 160,
        },
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
db.categories.createIndex({ sortOrder: 1 })

// =============================================================================
// BRANDS COLLECTION
// =============================================================================
db.createCollection("brands", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "slug", "status"],
      properties: {
        name: {
          bsonType: "string",
          minLength: 1,
          maxLength: 100,
          description: "Brand name - required",
        },
        slug: {
          bsonType: "string",
          description: "URL-friendly brand identifier - required",
        },
        description: {
          bsonType: "string",
          maxLength: 1000,
        },
        logo: {
          bsonType: "object",
          properties: {
            url: { bsonType: "string" },
            alt: { bsonType: "string" },
          },
        },
        website: {
          bsonType: "string",
        },
        status: {
          bsonType: "string",
          enum: ["active", "inactive"],
          description: "Brand status - required",
        },
      },
    },
  },
})

// Create indexes for brands collection
db.brands.createIndex({ slug: 1 }, { unique: true })
db.brands.createIndex({ name: 1 })
db.brands.createIndex({ status: 1 })

// =============================================================================
// SEED DATA
// =============================================================================

// Insert sample categories
const electronicsId = db.categories.insertOne({
  name: "Electronics",
  slug: "electronics",
  description: "Electronic devices and accessories",
  level: 0,
  path: "/electronics",
  status: "active",
  sortOrder: 1,
  attributes: [
    {
      name: "Brand",
      type: "select",
      required: true,
      options: [],
    },
    {
      name: "Warranty",
      type: "text",
      required: false,
    },
  ],
}).insertedId

const smartphonesId = db.categories.insertOne({
  name: "Smartphones",
  slug: "smartphones",
  description: "Mobile phones and accessories",
  parentId: electronicsId.toString(), // Updated after electronics is inserted
  level: 1,
  path: "/electronics/smartphones",
  status: "active",
  sortOrder: 1,
  attributes: [
    {
      name: "Storage",
      type: "select",
      required: true,
      options: ["64GB", "128GB", "256GB", "512GB", "1TB"],
    },
    {
      name: "Color",
      type: "select",
      required: true,
      options: ["Black", "White", "Blue", "Red", "Gold"],
    },
  ],
}).insertedId

// Insert sample brands
db.brands.insertMany([
  {
    name: "Apple",
    slug: "apple",
    description: "Premium technology products",
    website: "https://apple.com",
    status: "active",
  },
  {
    name: "Samsung",
    slug: "samsung",
    description: "Innovation for everyone",
    website: "https://samsung.com",
    status: "active",
  },
])

print("MongoDB initialization completed successfully!")
print("Created collections: products, categories, brands")
print("Created indexes for optimal query performance")
print("Inserted sample seed data")
