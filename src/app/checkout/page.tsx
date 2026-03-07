"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/context/CartContext";
import { isAuthenticated, getCurrentUser, getAuthToken } from "@/utils/auth";
import {
  FaShoppingCart, FaCreditCard, FaMoneyBillWave, FaUniversity,
  FaMobile, FaMapMarkerAlt, FaTruck, FaClock, FaCheckCircle, FaQrcode
} from "react-icons/fa";
import { Address } from "@/types/address";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripePaymentForm from "@/components/checkout/StripePaymentForm";
import TngPaymentSimulation from "@/components/checkout/TngPaymentSimulation";

// Replace with your real Publishable Key from Stripe Dashboard
const stripePromise = loadStripe("pk_test_51T7dTdAOBZ0b6qbnDpkrq93QUnGSLkBaneztyfuVhHRnDg3kUkdUYHzMuXFrPTY31qJwhmmPDExBRrsS4s32L0mF00x37P1PJ7");

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, removeFromCart } = useCart();

  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [showAddressStep, setShowAddressStep] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("STRIPE"); // Default to Stripe
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [paymentDetailsJson, setPaymentDetailsJson] = useState("");
  const [isPaid, setIsPaid] = useState(false);

  const handlePaymentSuccess = (pId: string, details?: string) => {
    setPaymentIntentId(pId);
    setPaymentDetailsJson(details || JSON.stringify({ stripePaymentIntentId: pId }));
    setIsPaid(true);
    // After payment succeeded, we can auto-submit the order
  };

  useEffect(() => {
    if (isPaid) {
      handleSubmit();
    }
  }, [isPaid]);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
    eWalletType: "",
    bankAccount: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderedItems, setOrderedItems] = useState<any[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);

  // total logic to match backend
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = subtotal >= 100 ? 0 : 8;
  const total = subtotal + shippingFee;

  // Normalize API -> UI
  const normalizeAddress = (a: any): Address => ({
    id: Number(a.id),
    label: a.label ?? a.name ?? "",
    name: a.name ?? a.label ?? "",
    phone: a.phone ?? "",
    address_line: a.address_line ?? a.addressLine ?? "", // <- no spaces
    city: a.city ?? "",
    state: a.state ?? "",
    postal: a.postal ?? "",                    // <- normalized to postalCode
    isDefault:
      a.is_default === 1 ||
      a.is_default === true ||
      a.isDefault === true,
    userId: a.userId,
  });

  // Auth check
  useEffect(() => {
    if (!isAuthenticated()) {
      sessionStorage.setItem("redirectAfterLogin", "/checkout");
      router.push("/login");
      return;
    }
    const currentUser = getCurrentUser();
    if (currentUser) setUser(currentUser);
    setAuthLoading(false);
  }, [router]);

  // Fetch addresses when entering step 2
  const fetchUserAddresses = async () => {
    setAddressLoading(true);
    setError("");
    try {
      const token = getAuthToken();
      const u = getCurrentUser();
      if (!u?.id) throw new Error("Missing user id");

      const res = await fetch(
        `http://localhost:8080/api/addresses?userId=${u.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Failed to fetch addresses (${res.status}) ${body}`);
      }
      const data = await res.json();
      const list = (data || []).map(normalizeAddress) as Address[];
      setAddresses(list);
      setSelectedAddress(list.find(x => x.isDefault) || list[0] || null);
      setShowAddressStep(true);
    } catch (e) {
      console.error(e);
      setError("Failed to fetch addresses. Please try again.");
    } finally {
      setAddressLoading(false);
    }
  };

  const handleProceedToAddress = () => fetchUserAddresses();
  const handleBackToSummary = () => { setShowAddressStep(false); setError(""); };
  const handleAddressSelect = (addr: Address) => setSelectedAddress(addr);

  const validatePayment = () => {
    // With Stripe and TNG Simulation, validation is handled within the components or implicit
    return null;
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    if (!selectedAddress) { setError("Please select a shipping address."); setLoading(false); return; }
    if (cart.length === 0) { setError("Your cart is empty."); setLoading(false); return; }

    const paymentError = validatePayment();
    if (paymentError) { setError(paymentError); setLoading(false); return; }



    try {
      const token = getAuthToken();
      if (!user?.id) throw new Error("User authentication error.");
      if (!token) throw new Error("Authentication token missing. Please log in again.");

      // Use the payment details/status from the payment step
      const orderData = {
        userId: user.id,
        items: cart.map(item => ({ productId: item.id, qty: item.quantity })),
        shippingAddressJson: JSON.stringify({
          name: selectedAddress.name,
          address: selectedAddress.address_line,
          city: selectedAddress.city,
          state: selectedAddress.state,
          postal: selectedAddress.postal,
        }),
        notes: "",
        paymentMethod,
        paymentDetails: paymentDetailsJson, // From Stripe or TNG Simulation
      };

      const response = await fetch("http://localhost:8080/api/orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        await response.json();
        // Save current cart items and total before clearing
        setOrderedItems([...cart]);
        setOrderTotal(total);
        cart.forEach(item => removeFromCart(item.id));
        setSuccess(true);
      } else {
        let msg = "Failed to place order. Please try again.";
        try {
          const body = await response.json();
          msg = body.message || body.error || body.details || msg;
        } catch {
          const text = await response.text();
          if (response.status === 400) msg = "Invalid order data. Please check your information.";
          else if (response.status === 401) msg = "Authentication failed. Please log in again.";
          else if (response.status === 500) msg = "Server error. Please try again later.";
          console.error("Raw error:", text);
        }
        setError(msg);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  if (authLoading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  // Success page should be shown first, before checking cart
  if (success) {
    return (
      <div className="bg-gradient-to-br from-green-50 via-white to-green-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-4">
                Order Successfully Placed! 🎉
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Thank you for your purchase! Your order has been successfully placed and is being processed. You will receive an email confirmation shortly.
              </p>
            </div>
          </div>

          {/* Order Details Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="bg-green-600 text-white p-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <FaShoppingCart size={24} />
                Order Summary
              </h2>
              <p className="text-green-100 mt-1">Order #{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
            </div>

            <div className="p-6">
              {/* Order Items */}
              <div className="space-y-4 mb-6">
                <h3 className="font-bold text-lg text-gray-800 mb-3">Items Ordered</h3>
                {orderedItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-contain bg-white rounded-lg p-2"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{item.name}</h4>
                      <p className="text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-green-600 font-bold">RM{item.price.toFixed(2)} each</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-800">
                        RM{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Totals */}
              <div className="border-t border-gray-200 pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold">RM{orderTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery</span>
                    <span className="font-semibold text-green-600">
                      {shippingFee === 0 ? "FREE" : `RM${shippingFee.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="border-t border-gray-300 pt-3">
                    <div className="flex justify-between text-2xl font-bold text-gray-800">
                      <span>Total Paid</span>
                      <span>RM{orderTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="bg-blue-600 text-white p-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <FaTruck size={24} />
                Delivery Information
              </h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-lg text-gray-800 mb-3">Delivery Address</h3>
                  {selectedAddress && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-semibold text-gray-800">{selectedAddress.name}</p>
                      <p className="text-gray-600">{selectedAddress.address_line}</p>
                      <p className="text-gray-600">
                        {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postal}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-lg text-gray-800 mb-3">Estimated Delivery</h3>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FaClock className="text-green-600" />
                      <span className="font-semibold text-green-800">Same Day Delivery</span>
                    </div>
                    <p className="text-green-700 text-sm">
                      Order by 2PM, delivered today between 4PM - 8PM
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="bg-purple-600 text-white p-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <FaCreditCard size={24} />
                Payment Details
              </h2>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">Payment Method</p>
                    <p className="text-gray-600 capitalize">{paymentMethod.replace('_', ' ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">Amount Paid</p>
                    <p className="text-green-600 font-bold text-lg">RM{orderTotal.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="bg-orange-600 text-white p-6">
              <h2 className="text-2xl font-bold">What's Next?</h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold text-lg">1</span>
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">Order Confirmation</h3>
                  <p className="text-gray-600 text-sm">You'll receive an email confirmation with order details</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600 font-bold text-lg">2</span>
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">Order Processing</h3>
                  <p className="text-gray-600 text-sm">We're preparing your fresh groceries for delivery</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-purple-600 font-bold text-lg">3</span>
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">Delivery</h3>
                  <p className="text-gray-600 text-sm">Your order will be delivered to your doorstep</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/orders"
                className="bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-all duration-300 inline-flex items-center justify-center gap-2"
              >
                <FaShoppingCart size={20} />
                View My Orders
              </Link>
              <Link
                href="/products"
                className="bg-white text-green-600 border-2 border-green-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-50 transition-all duration-300 inline-flex items-center justify-center gap-2"
              >
                Continue Shopping
              </Link>
            </div>

            <div className="text-sm text-gray-500">
              <p>Need help? Contact our support team at support@vgrocery.com</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show empty cart message (only if not in success state)
  if (cart.length === 0 && !success) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <FaShoppingCart size={64} className="text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-8">
            Add some items to your cart before proceeding to checkout.
          </p>
          <Link
            href="/products"
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold text-lg uppercase tracking-wider hover:bg-green-700 transition-all duration-300 inline-flex items-center gap-3"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2 text-gray-800">
            {showAddressStep ? "Delivery Details" : "Order Summary"}
          </h1>
          <p className="text-gray-600">
            {showAddressStep
              ? "Choose your delivery address and payment method"
              : "Review your items before checkout"
            }
          </p>
        </div>

        {/* Step Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${!showAddressStep ? 'bg-green-600 text-white' : 'bg-green-600 text-white'
                }`}>
                1
              </div>
              <span className={`ml-2 font-medium ${!showAddressStep ? 'text-green-600' : 'text-gray-600'}`}>
                Order Summary
              </span>
            </div>
            <div className={`w-8 h-1 ${showAddressStep ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${showAddressStep ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-500'
                }`}>
                2
              </div>
              <span className={`ml-2 font-medium ${showAddressStep ? 'text-green-600' : 'text-gray-500'}`}>
                Delivery & Payment
              </span>
            </div>
          </div>
        </div>

        {!showAddressStep ? (
          /* ORDER SUMMARY STEP */
          <>
            {/* Main Order Summary Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
              {/* Order Items Header */}
              <div className="bg-green-600 text-white p-6">
                <h2 className="text-2xl font-bold">Your Order</h2>
                <p className="text-green-100">{cart.length} item{cart.length !== 1 ? 's' : ''} in your cart</p>
              </div>

              {/* Order Items List */}
              <div className="p-6 space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-contain bg-white rounded-lg p-2"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{item.name}</h3>
                      <p className="text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-green-600 font-bold">RM{item.price.toFixed(2)} each</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-800">
                        RM{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Totals */}
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold">RM{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery</span>
                    <span className="font-semibold text-green-600">FREE</span>
                  </div>
                  <div className="border-t border-gray-300 pt-3">
                    <div className="flex justify-between text-2xl font-bold text-gray-800">
                      <span>Total</span>
                      <span>RM{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Proceed to Next Step Button */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <button
                onClick={handleProceedToAddress}
                disabled={addressLoading}
                className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
              >
                {addressLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Loading...
                  </div>
                ) : (
                  "Continue to Address & Payment"
                )}
              </button>
            </div>
          </>
        ) : (
          /* ADDRESS & PAYMENT STEP */
          <>
            {/* Back Button */}
            <div className="mb-6">
              <button
                onClick={handleBackToSummary}
                className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
              >
                ← Back to Order Summary
              </button>
            </div>

            {/* Order Summary (Compact) */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <h3 className="font-bold text-gray-800 mb-2">Order Total: RM{total.toFixed(2)}</h3>
              <p className="text-gray-600 text-sm">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
            </div>

            {/* Shipping Address Selection */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-green-600" />
                  Delivery Address
                </h3>
                <Link
                  href="/address"
                  className="text-green-600 hover:text-green-700 font-medium text-sm"
                >
                  Manage Addresses
                </Link>
              </div>

              <p className="text-gray-600 mb-4">
                Choose your delivery address from the options below, or add a new one if needed.
              </p>

              {addressLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your addresses...</p>
                </div>
              )}

              {!addressLoading && addresses.length > 0 && (
                <div className="space-y-4">
                  {!selectedAddress && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-700 text-sm">
                        💡 Please select a delivery address from the options below
                      </p>
                    </div>
                  )}

                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedAddress?.id === address.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                      onClick={() => handleAddressSelect(address)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-800">{address.name}</h4>
                            {address.isDefault && (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600">{address.address_line}</p>
                          <p className="text-gray-600">
                            {address.city}, {address.state} {address.postal}
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedAddress?.id === address.id
                          ? 'border-green-500 bg-green-500'
                          : 'border-gray-300'
                          }`}>
                          {selectedAddress?.id === address.id && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                      </div>

                      {selectedAddress?.id === address.id && (
                        <div className="mt-3 p-2 bg-green-100 border border-green-200 rounded-lg">
                          <p className="text-green-700 text-sm font-medium">
                            ✅ Selected for delivery
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!addressLoading && addresses.length === 0 && (
                <div className="text-center py-8">
                  <FaMapMarkerAlt size={48} className="text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">No Delivery Address Found</h4>
                  <p className="text-gray-600 mb-6">You need to add a delivery address to continue with your order.</p>
                  <Link
                    href="/address"
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-300 font-semibold"
                  >
                    Add New Address
                  </Link>
                  <p className="text-sm text-gray-500 mt-3">
                    After adding an address, you'll be redirected back here to complete your order.
                  </p>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className={`rounded-2xl shadow-lg p-6 mb-6 ${selectedAddress ? 'bg-white' : 'bg-gray-50'
              }`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold ${selectedAddress ? 'text-gray-800' : 'text-gray-500'
                  }`}>Payment Method</h3>
                {selectedAddress && (
                  <div className="text-sm text-green-600 font-medium">
                    ✅ Address selected: {selectedAddress.name}
                  </div>
                )}
              </div>

              {!selectedAddress && addresses.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Please select a delivery address first</p>
                </div>
              )}

              {selectedAddress && (
                <>

                  {/* Payment Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === "STRIPE" ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <input
                        type="radio"
                        name="payment"
                        value="STRIPE"
                        checked={paymentMethod === "STRIPE"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                      />
                      <FaCreditCard className="mr-3 text-indigo-600" size={20} />
                      <span className="font-medium">Credit/Debit Card (Stripe)</span>
                    </label>

                    <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === "TNG" ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <input
                        type="radio"
                        name="payment"
                        value="TNG"
                        checked={paymentMethod === "TNG"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                      />
                      <FaQrcode className="mr-3 text-blue-600" size={20} />
                      <span className="font-medium">Touch 'n Go eWallet</span>
                    </label>

                    <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === "COD" ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <input
                        type="radio"
                        name="payment"
                        value="COD"
                        checked={paymentMethod === "COD"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                      />
                      <FaMoneyBillWave className="mr-3 text-orange-600" size={20} />
                      <span className="font-medium">Cash on Delivery</span>
                    </label>
                  </div>

                  {/* Payment Forms */}
                  {paymentMethod === "STRIPE" && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                      <Elements stripe={stripePromise}>
                        <StripePaymentForm
                          amount={total}
                          onSuccess={(id) => handlePaymentSuccess(id)}
                          onError={(err) => setError(err)}
                        />
                      </Elements>
                    </div>
                  )}

                  {paymentMethod === "TNG" && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                      <TngPaymentSimulation
                        amount={total}
                        onSuccess={(details) => handlePaymentSuccess("TNG-" + Date.now(), details)}
                      />
                    </div>
                  )}

                  {paymentMethod === "COD" && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-800">Cash on Delivery</h4>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Pay when your order is delivered to your doorstep.</p>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Total to pay:</span>
                          <span className="font-bold text-green-600">RM{total.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-gray-500">Please have exact change ready for the delivery person.</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Address Selection Reminder */}
        {!selectedAddress && addresses.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-700 font-medium">
              ⚠️ Please select a delivery address before proceeding with payment
            </p>
          </div>
        )}

        {/* Place Order Button (Only for COD) */}
        {paymentMethod === "COD" && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedAddress}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Placing Order...
                </div>
              ) : (
                `Place Order - RM${total.toFixed(2)}`
              )}
            </button>
          </div>
        )}

        {(paymentMethod === "STRIPE" || paymentMethod === "TNG") && !isPaid && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 text-center shadow-inner">
            <p className="text-indigo-800 font-semibold mb-2">Almost there! 🚀</p>
            <p className="text-indigo-600 text-sm">Please complete your payment in the section above to finalize your order.</p>
          </div>
        )}
      </div>
    </main>
  );
} 