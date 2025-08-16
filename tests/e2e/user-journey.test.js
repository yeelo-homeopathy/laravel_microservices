const axios = require("axios")
const { expect } = require("chai")

describe("End-to-End User Journey Tests", () => {
  const gatewayUrl = process.env.API_GATEWAY_URL || "http://localhost:8000"
  let userToken, userId, orderId, productId

  describe("Complete User Registration and Shopping Journey", () => {
    it("should register a new user", async () => {
      const userData = {
        email: `journey${Date.now()}@example.com`,
        password: "password123",
        firstName: "Journey",
        lastName: "User",
      }

      const response = await axios.post(`${gatewayUrl}/api/auth/register`, userData)
      expect(response.status).to.equal(201)
      expect(response.data).to.have.property("access_token")

      userToken = response.data.access_token
      userId = response.data.user.id
    })

    it("should fetch user profile", async () => {
      const response = await axios.get(`${gatewayUrl}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${userToken}` },
      })
      expect(response.status).to.equal(200)
      expect(response.data.user.id).to.equal(userId)
    })

    it("should browse product catalog", async () => {
      const response = await axios.get(`${gatewayUrl}/api/products`)
      expect(response.status).to.equal(200)
      expect(response.data).to.be.an("array")

      if (response.data.length > 0) {
        productId = response.data[0].id
      }
    })

    it("should search for products", async () => {
      const response = await axios.get(`${gatewayUrl}/api/products/search?q=laptop`)
      expect(response.status).to.equal(200)
      expect(response.data).to.have.property("products")
    })

    it("should view product details", async () => {
      if (!productId) {
        console.log("Skipping product details test - no product available")
        return
      }

      const response = await axios.get(`${gatewayUrl}/api/products/${productId}`)
      expect(response.status).to.equal(200)
      expect(response.data).to.have.property("id", productId)
    })

    it("should add product to cart and create order", async () => {
      const orderData = {
        items: [
          {
            productId: productId || "1",
            quantity: 2,
            price: 1999,
          },
        ],
        shippingAddress: {
          street: "123 Journey St",
          city: "Test City",
          state: "TS",
          zipCode: "12345",
          country: "US",
        },
        billingAddress: {
          street: "123 Journey St",
          city: "Test City",
          state: "TS",
          zipCode: "12345",
          country: "US",
        },
      }

      const response = await axios.post(`${gatewayUrl}/api/orders`, orderData, {
        headers: { Authorization: `Bearer ${userToken}` },
      })
      expect(response.status).to.equal(201)
      expect(response.data).to.have.property("id")
      expect(response.data.status).to.equal("pending")

      orderId = response.data.id
    })

    it("should view order details", async () => {
      if (!orderId) {
        console.log("Skipping order details test - no order created")
        return
      }

      const response = await axios.get(`${gatewayUrl}/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      })
      expect(response.status).to.equal(200)
      expect(response.data.id).to.equal(orderId)
    })

    it("should fetch user order history", async () => {
      const response = await axios.get(`${gatewayUrl}/api/orders`, {
        headers: { Authorization: `Bearer ${userToken}` },
      })
      expect(response.status).to.equal(200)
      expect(response.data).to.be.an("array")

      if (orderId) {
        const userOrder = response.data.find((order) => order.id === orderId)
        expect(userOrder).to.exist
      }
    })

    it("should process payment for order", async () => {
      if (!orderId) {
        console.log("Skipping payment test - no order created")
        return
      }

      const paymentData = {
        orderId: orderId,
        paymentMethod: "credit_card",
        amount: 3998, // 2 * 1999
        currency: "USD",
        paymentDetails: {
          cardNumber: "4111111111111111",
          expiryMonth: "12",
          expiryYear: "2025",
          cvv: "123",
        },
      }

      const response = await axios.post(`${gatewayUrl}/api/payments`, paymentData, {
        headers: { Authorization: `Bearer ${userToken}` },
      })
      expect(response.status).to.equal(201)
      expect(response.data).to.have.property("status")
    })

    it("should update user profile", async () => {
      const updateData = {
        firstName: "Updated Journey",
        phone: "+1234567890",
      }

      const response = await axios.put(`${gatewayUrl}/api/auth/profile`, updateData, {
        headers: { Authorization: `Bearer ${userToken}` },
      })
      expect(response.status).to.equal(200)
      expect(response.data.user.firstName).to.equal("Updated Journey")
    })

    it("should logout user", async () => {
      const response = await axios.post(
        `${gatewayUrl}/api/auth/logout`,
        {},
        {
          headers: { Authorization: `Bearer ${userToken}` },
        },
      )
      expect(response.status).to.equal(200)
    })
  })

  describe("Admin User Journey", () => {
    let adminToken

    it("should login as admin", async () => {
      const response = await axios.post(`${gatewayUrl}/api/auth/login`, {
        email: "admin@example.com",
        password: "password123",
      })
      expect(response.status).to.equal(200)
      adminToken = response.data.access_token
    })

    it("should access admin dashboard metrics", async () => {
      const response = await axios.get(`${gatewayUrl}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(response.status).to.equal(200)
      expect(response.data).to.have.property("metrics")
    })

    it("should manage products as admin", async () => {
      const productData = {
        name: "Test Product",
        description: "A test product for E2E testing",
        price: 2999,
        category: "Electronics",
        sku: `TEST-${Date.now()}`,
        stock: 100,
      }

      const response = await axios.post(`${gatewayUrl}/api/admin/products`, productData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(response.status).to.equal(201)
      expect(response.data).to.have.property("id")
    })

    it("should view all orders as admin", async () => {
      const response = await axios.get(`${gatewayUrl}/api/admin/orders`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(response.status).to.equal(200)
      expect(response.data).to.be.an("array")
    })

    it("should manage users as admin", async () => {
      const response = await axios.get(`${gatewayUrl}/api/admin/users`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(response.status).to.equal(200)
      expect(response.data).to.be.an("array")
    })
  })
})
