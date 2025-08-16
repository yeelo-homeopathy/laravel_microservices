const { Client } = require("pg")
const MongoClient = require("mongodb").MongoClient
const Redis = require("ioredis")
const { expect } = require("chai")

describe("Database Integration Tests", () => {
  let pgClient, mongoClient, redisClient

  before(async () => {
    // PostgreSQL connection
    pgClient = new Client({
      connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/ecommerce_core",
    })

    // MongoDB connection
    mongoClient = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce_catalog")

    // Redis connection
    redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379")
  })

  after(async () => {
    if (pgClient) await pgClient.end()
    if (mongoClient) await mongoClient.close()
    if (redisClient) redisClient.disconnect()
  })

  describe("PostgreSQL Connections", () => {
    it("should connect to main PostgreSQL database", async () => {
      await pgClient.connect()
      const result = await pgClient.query("SELECT NOW()")
      expect(result.rows).to.have.length(1)
    })

    it("should have required tables in PostgreSQL", async () => {
      const tables = ["users", "roles", "permissions", "user_roles", "orders", "order_items"]

      for (const table of tables) {
        const result = await pgClient.query(
          `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
          [table],
        )
        expect(result.rows[0].exists).to.be.true
      }
    })

    it("should have sample data in users table", async () => {
      const result = await pgClient.query("SELECT COUNT(*) FROM users")
      expect(Number.parseInt(result.rows[0].count)).to.be.greaterThan(0)
    })
  })

  describe("MongoDB Connections", () => {
    it("should connect to MongoDB database", async () => {
      await mongoClient.connect()
      const db = mongoClient.db()
      const collections = await db.listCollections().toArray()
      expect(collections).to.be.an("array")
    })

    it("should have required collections in MongoDB", async () => {
      const db = mongoClient.db()
      const collections = ["products", "categories", "brands"]

      for (const collection of collections) {
        const exists = await db.collection(collection).findOne({})
        // Collection exists if we can query it without error
        expect(exists).to.not.be.null
      }
    })
  })

  describe("Redis Connections", () => {
    it("should connect to Redis", async () => {
      const pong = await redisClient.ping()
      expect(pong).to.equal("PONG")
    })

    it("should set and get values from Redis", async () => {
      await redisClient.set("test_key", "test_value")
      const value = await redisClient.get("test_key")
      expect(value).to.equal("test_value")
      await redisClient.del("test_key")
    })
  })
})
