const axios = require("axios")
const { expect } = require("chai")

describe("Microservices Integration Tests", () => {
  const services = {
    identity: process.env.IDENTITY_SERVICE_URL || "http://localhost:3001",
    catalog: process.env.CATALOG_SERVICE_URL || "http://localhost:3002",
    orders: process.env.ORDERS_SERVICE_URL || "http://localhost:3003",
    gateway: process.env.API_GATEWAY_URL || "http://localhost:8000",
  }

  describe("Service Health Checks", () => {
    Object.entries(services).forEach(([serviceName, serviceUrl]) => {
      it(`should connect to ${serviceName} service`, async () => {
        try {
          const response = await axios.get(`${serviceUrl}/health`, { timeout: 5000 })
          expect(response.status).to.equal(200)
          expect(response.data).to.have.property("status", "ok")
        } catch (error) {
          console.log(`${serviceName} service not available at ${serviceUrl}`)
          throw error
        }
      })
    })
  })

  describe("Service Communication", () => {
    let authToken

    before(async () => {
      // Get auth token for testing
      try {
        const loginResponse = await axios.post(`${services.identity}/auth/login`, {
          email: "admin@example.com",
          password: "password123",
        })
        authToken = loginResponse.data.access_token
      } catch (error) {
        console.log("Could not authenticate for integration tests")
        throw error
      }
    })

    it("should authenticate user through Identity service", async () => {
      const response = await axios.post(`${services.identity}/auth/login`, {
        email: "admin@example.com",
        password: "password123",
      })
      expect(response.status).to.equal(200)
      expect(response.data).to.have.property("access_token")
    })

    it("should fetch products from Catalog service", async () => {
      const response = await axios.get(`${services.catalog}/products`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      })
      expect(response.status).to.equal(200)
      expect(response.data).to.be.an("array")
    })

    it("should create order through Orders service", async () => {
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

      const response = await axios.post(`${services.orders}/orders`, orderData, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      expect(response.status).to.equal(201)
      expect(response.data).to.have.property("id")
    })
  })

  describe("API Gateway Routing", () => {
    it("should route requests to Identity service through gateway", async () => {
      const response = await axios.get(`${services.gateway}/api/identity/health`)
      expect(response.status).to.equal(200)
    })

    it("should route requests to Catalog service through gateway", async () => {
      const response = await axios.get(`${services.gateway}/api/catalog/health`)
      expect(response.status).to.equal(200)
    })

    it("should route requests to Orders service through gateway", async () => {
      const response = await axios.get(`${services.gateway}/api/orders/health`)
      expect(response.status).to.equal(200)
    })
  })
})
