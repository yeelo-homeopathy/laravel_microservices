const axios = require("axios")
const { expect } = require("chai")
const before = require("mocha").before

describe("API Gateway Integration Tests", () => {
  const gatewayUrl = process.env.API_GATEWAY_URL || "http://localhost:8000"
  let authToken

  before(async () => {
    // Authenticate to get token for protected routes
    try {
      const response = await axios.post(`${gatewayUrl}/api/auth/login`, {
        email: "admin@example.com",
        password: "password123",
      })
      authToken = response.data.access_token
    } catch (error) {
      console.log("Authentication failed, some tests may be skipped")
    }
  })

  describe("Gateway Health and Status", () => {
    it("should return gateway health status", async () => {
      const response = await axios.get(`${gatewayUrl}/health`)
      expect(response.status).to.equal(200)
      expect(response.data).to.have.property("status", "ok")
      expect(response.data).to.have.property("services")
    })

    it("should return service discovery information", async () => {
      const response = await axios.get(`${gatewayUrl}/api/services/status`)
      expect(response.status).to.equal(200)
      expect(response.data).to.have.property("services")
      expect(response.data.services).to.be.an("object")
    })
  })

  describe("Authentication Routes", () => {
    it("should handle user registration", async () => {
      const userData = {
        email: `test${Date.now()}@example.com`,
        password: "password123",
        firstName: "Test",
        lastName: "User",
      }

      const response = await axios.post(`${gatewayUrl}/api/auth/register`, userData)
      expect(response.status).to.equal(201)
      expect(response.data).to.have.property("user")
      expect(response.data).to.have.property("access_token")
    })

    it("should handle user login", async () => {
      const response = await axios.post(`${gatewayUrl}/api/auth/login`, {
        email: "admin@example.com",
        password: "password123",
      })
      expect(response.status).to.equal(200)
      expect(response.data).to.have.property("access_token")
      expect(response.data).to.have.property("user")
    })

    it("should validate JWT tokens", async () => {
      if (!authToken) {
        console.log("Skipping token validation test - no auth token")
        return
      }

      const response = await axios.get(`${gatewayUrl}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      expect(response.status).to.equal(200)
      expect(response.data).to.have.property("user")
    })
  })

  describe("Product Catalog Routes", () => {
    it("should fetch products through gateway", async () => {
      const response = await axios.get(`${gatewayUrl}/api/products`)
      expect(response.status).to.equal(200)
      expect(response.data).to.be.an("array")
    })

    it("should fetch categories through gateway", async () => {
      const response = await axios.get(`${gatewayUrl}/api/categories`)
      expect(response.status).to.equal(200)
      expect(response.data).to.be.an("array")
    })

    it("should search products through gateway", async () => {
      const response = await axios.get(`${gatewayUrl}/api/products/search?q=test`)
      expect(response.status).to.equal(200)
      expect(response.data).to.have.property("products")
      expect(response.data).to.have.property("total")
    })
  })

  describe("Order Management Routes", () => {
    it("should create order through gateway", async () => {
      if (!authToken) {
        console.log("Skipping order creation test - no auth token")
        return
      }

      const orderData = {
        items: [{ productId: "1", quantity: 2, price: 1999 }],
        shippingAddress: {
          street: "123 Test St",
          city: "Test City",
          state: "TS",
          zipCode: "12345",
          country: "US",
        },
      }

      const response = await axios.post(`${gatewayUrl}/api/orders`, orderData, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      expect(response.status).to.equal(201)
      expect(response.data).to.have.property("id")
      expect(response.data).to.have.property("status")
    })

    it("should fetch user orders through gateway", async () => {
      if (!authToken) {
        console.log("Skipping order fetch test - no auth token")
        return
      }

      const response = await axios.get(`${gatewayUrl}/api/orders`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      expect(response.status).to.equal(200)
      expect(response.data).to.be.an("array")
    })
  })

  describe("Rate Limiting and Security", () => {
    it("should enforce rate limiting on auth endpoints", async () => {
      const requests = []
      const maxRequests = 10

      // Make multiple rapid requests
      for (let i = 0; i < maxRequests; i++) {
        requests.push(
          axios
            .post(`${gatewayUrl}/api/auth/login`, {
              email: "invalid@example.com",
              password: "invalid",
            })
            .catch((err) => err.response),
        )
      }

      const responses = await Promise.all(requests)
      const rateLimitedResponses = responses.filter((res) => res && res.status === 429)

      // Should have at least some rate limited responses
      expect(rateLimitedResponses.length).to.be.greaterThan(0)
    })

    it("should return proper CORS headers", async () => {
      const response = await axios.get(`${gatewayUrl}/health`)
      expect(response.headers).to.have.property("access-control-allow-origin")
    })
  })
})
