"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { FaTrashAlt, FaArrowLeft, FaShoppingBag, FaExclamationTriangle, FaCheckCircle, FaSync } from "react-icons/fa";
import { useCart } from "@/components/context/CartContext";
import { useState, useEffect } from "react";
import Link from "next/link";
import { isAuthenticated } from "@/utils/auth";

export default function CartPage() {
  const router = useRouter();
  const { cart, updateQuantity, removeFromCart } = useCart();
  const [voucher, setVoucher] = useState("");
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [voucherError, setVoucherError] = useState("");
  const [discount, setDiscount] = useState(0);
  const [stockData, setStockData] = useState<Record<number, number>>({});
  const [stockLoading, setStockLoading] = useState(false);
  const [stockErrors, setStockErrors] = useState<Record<number, string>>({});
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const base = process.env.NEXT_PUBLIC_API ?? "http://localhost:8080";

  // Fetch stock data for all cart items
  const fetchStockData = async () => {
    if (cart.length === 0) return;
    
    setStockLoading(true);
    const newStockData: Record<number, number> = {};
    const newStockErrors: Record<number, string> = {};

    try {
      await Promise.all(
        cart.map(async (item) => {
          try {
            const res = await fetch(`${base}/api/products/${item.id}`, {
              cache: "no-store",
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            });
            if (res.ok) {
              const product = await res.json();
              newStockData[item.id] = product.stockQuantity || product.stock_quantity || 0;
            } else {
              newStockErrors[item.id] = "Unable to verify stock";
            }
          } catch (error) {
            newStockErrors[item.id] = "Stock check failed";
          }
        })
      );
    } catch (error) {
      console.error('Stock validation error:', error);
    } finally {
      setStockData(newStockData);
      setStockErrors(newStockErrors);
      setStockLoading(false);
    }
  };

  // Check if cart has stock issues
  const hasStockIssues = () => {
    return cart.some(item => {
      const availableStock = stockData[item.id] || 0;
      return item.quantity > availableStock;
    });
  };

  // Get stock issues for display
  const getStockIssues = () => {
    return cart.filter(item => {
      const availableStock = stockData[item.id] || 0;
      return item.quantity > availableStock;
    });
  };

  // Auto-fix stock issues by reducing quantities
  const autoFixStockIssues = () => {
    const issues = getStockIssues();
    issues.forEach(item => {
      const availableStock = stockData[item.id] || 0;
      if (availableStock > 0) {
        updateQuantity(item.id, availableStock);
      } else {
        removeFromCart(item.id);
      }
    });
  };

  // Fetch stock data when cart changes
  useEffect(() => {
    fetchStockData();
  }, [cart]);

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (voucher.trim().toUpperCase() === "SAVE10") {
      setDiscount(total * 0.1);
      setVoucherApplied(true);
      setVoucherError("");
    } else {
      setDiscount(0);
      setVoucherApplied(false);
      setVoucherError("Invalid voucher code");
    }
  };

  const handleProceedToCheckout = () => {
    if (hasStockIssues()) {
      return; // Don't proceed if there are stock issues
    }
    
    if (!isAuthenticated()) {
      // Store the intended destination in sessionStorage so we can redirect after login
      sessionStorage.setItem('redirectAfterLogin', '/checkout');
      router.push('/login');
    } else {
      router.push('/checkout');
    }
  };

  return (
    <div className="bg-white text-black min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <Link href="/products" className="inline-flex items-center gap-2 text-gray-500 hover:text-black mb-4 transition-colors duration-200">
            <FaArrowLeft size={16} />
            Continue Shopping
          </Link>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            SHOPPING CART
          </h1>
          <p className="text-xl text-gray-600">
            Review your items and proceed to checkout
          </p>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-20">
            <FaShoppingBag size={64} className="text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Your cart is empty</h2>
            <p className="text-gray-500 mb-8">Add some products to get started</p>
            <Link 
              href="/products" 
              className="bg-black text-white px-8 py-4 font-bold text-lg uppercase tracking-wider hover:bg-gray-800 transition-all duration-300 inline-flex items-center gap-3"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Stock Validation Banner */}
            {hasStockIssues() && (
              <div className="lg:col-span-3 mb-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <FaExclamationTriangle className="text-orange-600 mt-1 flex-shrink-0" size={20} />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-orange-800 mb-2">
                        Stock Availability Issue
                      </h3>
                      <p className="text-orange-700 mb-4">
                        Some items in your cart exceed the available stock quantity. Please review and adjust the quantities below.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={autoFixStockIssues}
                          className="bg-orange-600 text-white px-4 py-2 rounded font-semibold hover:bg-orange-700 transition-colors"
                        >
                          Auto-Fix Quantities
                        </button>
                        <button
                          onClick={fetchStockData}
                          disabled={stockLoading}
                          className="flex items-center gap-2 bg-white border border-orange-300 text-orange-700 px-4 py-2 rounded font-semibold hover:bg-orange-50 transition-colors disabled:opacity-50"
                        >
                          <FaSync className={stockLoading ? 'animate-spin' : ''} size={14} />
                          Refresh Stock
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {cart.map((item) => {
                const availableStock = stockData[item.id] || 0;
                const hasStockIssue = item.quantity > availableStock;
                const stockError = stockErrors[item.id];
                
                return (
                <div key={item.id} className={`bg-white border rounded-lg p-6 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-lg ${
                  hasStockIssue ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-center gap-6">
                    <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-black text-lg mb-2">{item.name}</h3>
                      <div className="text-2xl font-black text-black mb-2">RM{item.price.toFixed(2)}</div>
                      
                      {/* Stock Status */}
                      <div className="mb-4">
                        {stockError ? (
                          <div className="flex items-center gap-2 text-red-600 text-sm">
                            <FaExclamationTriangle size={14} />
                            <span>{stockError}</span>
                          </div>
                        ) : hasStockIssue ? (
                          <div className="flex items-center gap-2 text-orange-600 text-sm">
                            <FaExclamationTriangle size={14} />
                            <span>
                              Only {availableStock} {availableStock === 1 ? 'item' : 'items'} available 
                              (you have {item.quantity})
                            </span>
                          </div>
                        ) : availableStock > 0 ? (
                          <div className="flex items-center gap-2 text-green-600 text-sm">
                            <FaCheckCircle size={14} />
                            <span>{availableStock} {availableStock === 1 ? 'item' : 'items'} in stock</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-600 text-sm">
                            <FaExclamationTriangle size={14} />
                            <span>Out of stock</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-gray-300 rounded">
                          <button
                            className="px-4 py-2 text-gray-500 hover:text-black transition-colors duration-200"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="px-4 py-2 font-bold text-black border-x border-gray-300">
                            {item.quantity}
                          </span>
                          <button
                            className={`px-4 py-2 transition-colors duration-200 ${
                              item.quantity >= availableStock 
                                ? 'text-gray-300 cursor-not-allowed' 
                                : 'text-gray-500 hover:text-black'
                            }`}
                            onClick={() => {
                              if (item.quantity < availableStock) {
                                updateQuantity(item.id, item.quantity + 1);
                              }
                            }}
                            disabled={item.quantity >= availableStock}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        
                        {/* Quick Fix Button for Stock Issues */}
                        {hasStockIssue && availableStock > 0 && (
                          <button
                            onClick={() => updateQuantity(item.id, availableStock)}
                            className="text-orange-600 hover:text-orange-700 text-sm font-semibold underline"
                          >
                            Fix to {availableStock}
                          </button>
                        )}
                        <button
                          className="text-gray-500 hover:text-red-500 transition-colors duration-200 flex items-center gap-2"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <FaTrashAlt size={14} />
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-black">
                        RM{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24 shadow-sm">
                <h2 className="text-2xl font-black mb-6 tracking-tight">ORDER SUMMARY</h2>
                
                {/* Voucher Input */}
                <form onSubmit={handleApplyVoucher} className="mb-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Voucher code"
                      value={voucher}
                      onChange={e => setVoucher(e.target.value)}
                      className="bg-white border border-gray-300 rounded px-4 py-3 text-black flex-1 placeholder-gray-500"
                      disabled={voucherApplied}
                    />
                    <button
                      type="submit"
                      className="bg-black text-white px-6 py-3 rounded font-bold text-sm uppercase tracking-wide hover:bg-gray-800 transition-all duration-300"
                      disabled={voucherApplied}
                    >
                      {voucherApplied ? "Applied" : "Apply"}
                    </button>
                  </div>
                  {voucherError && <div className="text-red-500 text-sm mt-2">{voucherError}</div>}
                </form>

                {/* Summary Details */}
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="text-black font-semibold">RM{total.toFixed(2)}</span>
                  </div>
                  {voucherApplied && (
                    <div className="flex justify-between text-gray-600">
                      <span>Discount (SAVE10)</span>
                      <span className="text-green-600 font-semibold">- RM{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery</span>
                    <span className="text-green-600 font-semibold">FREE</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-xl font-black">
                      <span>Total</span>
                      <span>RM{(total - discount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  className={`w-full py-4 font-bold text-lg uppercase tracking-wider transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                    hasStockIssues() 
                      ? 'bg-orange-500 text-white hover:bg-orange-600' 
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                  disabled={cart.length === 0}
                  onClick={handleProceedToCheckout}
                >
                  {hasStockIssues() ? (
                    <div className="flex items-center justify-center gap-2">
                      <FaExclamationTriangle size={16} />
                      Fix Stock Issues First
                    </div>
                  ) : (
                    'Proceed to Checkout'
                  )}
                </button>
                
                {hasStockIssues() && (
                  <p className="text-sm text-orange-600 mt-2 text-center">
                    Please resolve stock availability issues before proceeding to checkout.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
