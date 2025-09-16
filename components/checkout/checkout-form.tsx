"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CreditCard, Lock, ShoppingBag, MapPin, User, Mail, Phone } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { paymentService, formatCurrency } from "@/lib/services/payment.service"
import { useToast } from "@/hooks/use-toast"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
}

interface CheckoutFormProps {
  cartItems: CartItem[]
  onOrderComplete: (orderId: string) => void
}

export function CheckoutForm({ cartItems, onOrderComplete }: CheckoutFormProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    // Billing Information
    firstName: user?.name?.split(" ")[0] || "",
    lastName: user?.name?.split(" ")[1] || "",
    email: user?.email || "",
    phone: user?.phone || "",

    // Billing Address
    billingAddress: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "US",
    },

    // Shipping Address
    shippingAddress: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "US",
    },

    // Payment
    paymentMethod: "card",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardName: "",

    // Options
    sameAsShipping: true,
    savePaymentMethod: false,
    subscribeNewsletter: false,
  })

  const [processing, setProcessing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal > 5000 ? 0 : 999 // Free shipping over $50
  const tax = Math.round(subtotal * 0.08) // 8% tax
  const total = subtotal + shipping + tax

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleAddressChange = (type: "billingAddress" | "shippingAddress", field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.firstName) newErrors.firstName = "First name is required"
    if (!formData.lastName) newErrors.lastName = "Last name is required"
    if (!formData.email) newErrors.email = "Email is required"
    if (!formData.phone) newErrors.phone = "Phone number is required"

    // Billing address
    if (!formData.billingAddress.street) newErrors.billingStreet = "Street address is required"
    if (!formData.billingAddress.city) newErrors.billingCity = "City is required"
    if (!formData.billingAddress.state) newErrors.billingState = "State is required"
    if (!formData.billingAddress.zipCode) newErrors.billingZipCode = "ZIP code is required"

    // Shipping address (if different)
    if (!formData.sameAsShipping) {
      if (!formData.shippingAddress.street) newErrors.shippingStreet = "Street address is required"
      if (!formData.shippingAddress.city) newErrors.shippingCity = "City is required"
      if (!formData.shippingAddress.state) newErrors.shippingState = "State is required"
      if (!formData.shippingAddress.zipCode) newErrors.shippingZipCode = "ZIP code is required"
    }

    // Payment information
    if (formData.paymentMethod === "card") {
      if (!formData.cardNumber) newErrors.cardNumber = "Card number is required"
      if (!formData.expiryDate) newErrors.expiryDate = "Expiry date is required"
      if (!formData.cvv) newErrors.cvv = "CVV is required"
      if (!formData.cardName) newErrors.cardName = "Cardholder name is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Please fix the errors",
        description: "Check the form for required fields and correct any errors.",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)

    try {
      // Create order first
      const orderData = {
        customerId: user?.id || "guest",
        items: cartItems,
        billingAddress: formData.billingAddress,
        shippingAddress: formData.sameAsShipping ? formData.billingAddress : formData.shippingAddress,
        subtotal,
        shipping,
        tax,
        total,
        customerInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        },
      }

      // Mock order creation - in real app, this would call your order service
      const orderId = `order_${Date.now()}`

      // Process payment
      const paymentResult = await paymentService.processPayment({
        amount: total,
        currency: "USD",
        paymentMethodId: "pm_mock_card", // In real app, this would be from Stripe Elements
        orderId,
        customerId: user?.id || "guest",
        description: `Order ${orderId} - ${cartItems.length} items`,
        metadata: {
          customerEmail: formData.email,
          itemCount: cartItems.length,
        },
      })

      if (paymentResult.success) {
        toast({
          title: "Order placed successfully!",
          description: `Your order ${orderId} has been confirmed.`,
        })
        onOrderComplete(orderId)
      } else {
        throw new Error(paymentResult.message || "Payment failed")
      }
    } catch (error) {
      console.error("Checkout error:", error)
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Please try again or use a different payment method.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Checkout Form */}
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className={`pl-10 ${errors.phone ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Billing Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Billing Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="billingStreet">Street Address</Label>
                <Input
                  id="billingStreet"
                  value={formData.billingAddress.street}
                  onChange={(e) => handleAddressChange("billingAddress", "street", e.target.value)}
                  className={errors.billingStreet ? "border-red-500" : ""}
                />
                {errors.billingStreet && <p className="text-sm text-red-500 mt-1">{errors.billingStreet}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="billingCity">City</Label>
                  <Input
                    id="billingCity"
                    value={formData.billingAddress.city}
                    onChange={(e) => handleAddressChange("billingAddress", "city", e.target.value)}
                    className={errors.billingCity ? "border-red-500" : ""}
                  />
                  {errors.billingCity && <p className="text-sm text-red-500 mt-1">{errors.billingCity}</p>}
                </div>
                <div>
                  <Label htmlFor="billingState">State</Label>
                  <Select
                    value={formData.billingAddress.state}
                    onValueChange={(value) => handleAddressChange("billingAddress", "state", value)}
                  >
                    <SelectTrigger className={errors.billingState ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CA">California</SelectItem>
                      <SelectItem value="NY">New York</SelectItem>
                      <SelectItem value="TX">Texas</SelectItem>
                      <SelectItem value="FL">Florida</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.billingState && <p className="text-sm text-red-500 mt-1">{errors.billingState}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="billingZipCode">ZIP Code</Label>
                  <Input
                    id="billingZipCode"
                    value={formData.billingAddress.zipCode}
                    onChange={(e) => handleAddressChange("billingAddress", "zipCode", e.target.value)}
                    className={errors.billingZipCode ? "border-red-500" : ""}
                  />
                  {errors.billingZipCode && <p className="text-sm text-red-500 mt-1">{errors.billingZipCode}</p>}
                </div>
                <div>
                  <Label htmlFor="billingCountry">Country</Label>
                  <Select
                    value={formData.billingAddress.country}
                    onValueChange={(value) => handleAddressChange("billingAddress", "country", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={formData.paymentMethod}
                onValueChange={(value) => handleInputChange("paymentMethod", value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card">Credit/Debit Card</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="paypal" id="paypal" />
                  <Label htmlFor="paypal">PayPal</Label>
                </div>
              </RadioGroup>

              {formData.paymentMethod === "card" && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={formData.cardNumber}
                      onChange={(e) => handleInputChange("cardNumber", e.target.value)}
                      className={errors.cardNumber ? "border-red-500" : ""}
                    />
                    {errors.cardNumber && <p className="text-sm text-red-500 mt-1">{errors.cardNumber}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        placeholder="MM/YY"
                        value={formData.expiryDate}
                        onChange={(e) => handleInputChange("expiryDate", e.target.value)}
                        className={errors.expiryDate ? "border-red-500" : ""}
                      />
                      {errors.expiryDate && <p className="text-sm text-red-500 mt-1">{errors.expiryDate}</p>}
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        value={formData.cvv}
                        onChange={(e) => handleInputChange("cvv", e.target.value)}
                        className={errors.cvv ? "border-red-500" : ""}
                      />
                      {errors.cvv && <p className="text-sm text-red-500 mt-1">{errors.cvv}</p>}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cardName">Cardholder Name</Label>
                    <Input
                      id="cardName"
                      value={formData.cardName}
                      onChange={(e) => handleInputChange("cardName", e.target.value)}
                      className={errors.cardName ? "border-red-500" : ""}
                    />
                    {errors.cardName && <p className="text-sm text-red-500 mt-1">{errors.cardName}</p>}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="savePaymentMethod"
                  checked={formData.savePaymentMethod}
                  onCheckedChange={(checked) => handleInputChange("savePaymentMethod", checked.toString())}
                />
                <Label htmlFor="savePaymentMethod" className="text-sm">
                  Save payment method for future purchases
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button type="submit" size="lg" className="w-full" disabled={processing}>
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Complete Order - {formatCurrency(total)}
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Order Summary */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cart Items */}
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-sm font-medium">{formatCurrency(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : formatCurrency(shipping)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Security Badge */}
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                Your payment information is encrypted and secure. We never store your card details.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
