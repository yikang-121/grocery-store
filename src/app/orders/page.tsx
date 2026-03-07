"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaBox, FaTruck, FaCheck, FaExclamationTriangle, FaTimes } from "react-icons/fa";
import { isAuthenticated, getCurrentUser, getAuthToken } from "@/utils/auth";
import Link from "next/link";

type OrderItem = {
  id: number;
  name: string;
  quantity: number;  // UI expects quantity
  price: number;     // unit price
  lineTotal?: number;
};

type Order = {
  id: string;
  date: string;
  status: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  paymentMethod?: string;
  shippingAddress?: {
    name: string;
    address: string;
    city: string;
    postal: string;
  };
};

const getStatusIcon = (status: string) => {
  switch (status?.toUpperCase()) {
    case "DELIVERED":
    case "COMPLETED":
      return <FaCheck className="text-green-600" />;
    case "IN_TRANSIT":
    case "SHIPPED":
      return <FaTruck className="text-blue-600" />;
    case "CANCELLED":
      return <FaTimes className="text-red-600" />;
    default:
      return <FaBox className="text-gray-600" />;
  }
};

type CancellationForm = {
  reason: string;
  refundType: 'refund' | 'substitute';
  additionalNotes: string;
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const [showCancellationForm, setShowCancellationForm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cancellationForm, setCancellationForm] = useState<CancellationForm>({
    reason: '',
    refundType: 'refund',
    additionalNotes: ''
  });

  // safe number coercion
  // safe number coercion
  const num = (v: any, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  };

  // robust shipping address parser
  const parseShipping = (o: any) => {
    // 1) already an object
    if (o?.shippingAddress && typeof o.shippingAddress === "object") {
      const a = o.shippingAddress;
      return {
        name: a.name ?? "",
        address: a.address ?? a.addressLine ?? "",
        city: a.city ?? "",
        postal: a.postal ?? a.postalCode ?? "",
      };
    }

    // 2) JSON string in shippingAddressJson (or shipping_address_json)
    const raw =
      o.shippingAddressJson ??
      o.shipping_address_json ??
      o.shipping_address ??
      null;

    if (raw && typeof raw === "string") {
      try {
        const a = JSON.parse(raw);
        return {
          name: a.name ?? "",
          address: a.address ?? a.addressLine ?? "",
          city: a.city ?? "",
          postal: a.postal ?? a.postalCode ?? "",
        };
      } catch {
        // fall through if not valid JSON
      }
    }

    // 3) scattered root fields (rare)
    if (o.shippingName || o.shippingAddressLine || o.shippingCity || o.shippingPostal) {
      return {
        name: o.shippingName ?? "",
        address: o.shippingAddressLine ?? "",
        city: o.shippingCity ?? "",
        postal: o.shippingPostal ?? "",
      };
    }

    return undefined;
  };

  const normalizeOrder = (o: any): Order => {
    const items = (o.items || o.orderItems || []).map((it: any) => {
      const quantity = num(it.quantity ?? it.qty ?? 0);
      const price = num(it.price ?? it.unitPrice ?? it.unit_price ?? 0);
      return {
        id: num(it.id),
        name: it.name ?? it.productName ?? "",
        quantity,
        price,
        lineTotal: num(it.lineTotal ?? it.line_total ?? price * quantity),
      };
    });

    return {
      id: o.id ?? o.orderNo ?? "",
      date: o.date ?? o.createdAt ?? o.created_at ?? new Date().toISOString(),
      status: (o.status ?? "PENDING").toUpperCase(),
      subtotal: num(o.subtotal),
      shippingFee: num(o.shippingFee),
      discount: num(o.discount),
      total: num(o.total ?? o.totalAmount ?? o.amount),
      paymentMethod: o.paymentMethod,
      items,
      shippingAddress: parseShipping(o),
    };
  };


  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    fetchOrders();
  }, [router]);

  const fetchOrders = async () => {
    try {
      const token = getAuthToken();
      const user = getCurrentUser();         // <-- read current user
      if (!user?.id) throw new Error("Missing user id");

      const res = await fetch(
        `http://localhost:8080/api/orders?userId=${user.id}`,  // <-- add userId
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed: ${res.status} ${text}`);
      }

      const data = await res.json();
      const normalized = (data || []).map(normalizeOrder);
      setOrders(normalized);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    const reason = window.prompt("Why are you cancelling this order?", "Ordered by mistake");
    if (!reason) return;

    const actionRaw = window.prompt("Choose action: REFUND or SUBSTITUTE", "REFUND");
    const action = (actionRaw || "").toUpperCase() === "SUBSTITUTE" ? "SUBSTITUTE" : "REFUND";

    if (!confirm(`Confirm cancel order ${orderId}?\nReason: ${reason}\nAction: ${action}`)) {
      return;
    }

    try {
      setCancellingOrder(orderId);

      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`http://localhost:8080/api/orders/${orderId}/cancel`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: reason,
          action: action,
          extraNotes: ""
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to cancel order: ${res.status} ${text}`);
      }

      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: "CANCELLED" } : o))
      );

      alert("Order cancelled successfully!");
    } catch (err) {
      console.error("Error cancelling order:", err);
      alert((err as Error).message || "Failed to cancel order. Please try again.");
    } finally {
      setCancellingOrder(null);
    }
  };



  const handleCancelClick = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowCancellationForm(true);
  };

  const handleCancellationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOrderId) return;

    setCancellingOrder(selectedOrderId);
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`http://localhost:8080/api/orders/${selectedOrderId}/cancel`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          reason: cancellationForm.reason,
          action: cancellationForm.refundType.toUpperCase() === 'SUBSTITUTE' ? 'SUBSTITUTE' : 'REFUND',
          extraNotes: cancellationForm.additionalNotes
        }),

      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to cancel order: ${res.status} ${text}`);
      }

      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === selectedOrderId
            ? { ...order, status: 'CANCELLED' }
            : order
        )
      );

      alert("Order cancelled successfully! We'll process your request shortly.");

      setCancellationForm({
        reason: '',
        refundType: 'refund',
        additionalNotes: ''
      });
      setShowCancellationForm(false);
      setSelectedOrderId(null);
    } catch (err) {
      console.error("Error cancelling order:", err);
      alert("Failed to cancel order. Please try again.");
    } finally {
      setCancellingOrder(null);
    }
  };


  const closeCancellationForm = () => {
    setShowCancellationForm(false);
    setSelectedOrderId(null);
    setCancellationForm({
      reason: '',
      refundType: 'refund',
      additionalNotes: ''
    });
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <FaExclamationTriangle size={64} className="text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Loading Orders</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={fetchOrders}
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold text-lg uppercase tracking-wider hover:bg-green-700 transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-white min-h-screen py-10 px-2">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 text-green-700">Order & Tracking</h1>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <FaBox size={64} className="text-gray-400 mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-gray-700 mb-4">No Orders Yet</h2>
            <p className="text-gray-600 mb-8">You haven't placed any orders yet. Start shopping to see your orders here!</p>
            <Link
              href="/products"
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold text-lg uppercase tracking-wider hover:bg-green-700 transition-all duration-300 inline-block"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-gray-50 rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="font-semibold text-lg">{order.id}</div>
                    <div className="text-gray-600 text-sm">
                      Ordered on {new Date(order.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100">
                      {getStatusIcon(order.status)}
                      <span className="text-sm font-medium">{order.status}</span>
                    </div>
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancelClick(order.id)}
                        disabled={cancellingOrder === order.id}
                        className="ml-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {cancellingOrder === order.id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>

                {order.shippingAddress && (
                  <div className="mb-4 p-3 bg-white rounded border">
                    <h4 className="font-medium text-gray-700 mb-2">Shipping Address</h4>
                    <div className="text-sm text-gray-600">
                      <div>{order.shippingAddress.name}</div>
                      <div>{order.shippingAddress.address}</div>
                      <div>{order.shippingAddress.city}, {order.shippingAddress.postal}</div>
                    </div>
                  </div>
                )}

                <div className="divide-y divide-gray-200">
                  {order.items.map((item) => (
                    <div key={item.id} className="py-3 flex justify-between">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-gray-600 ml-2">x{item.quantity}</span>
                      </div>
                      <div className="text-gray-700">
                        RM{((item.lineTotal ?? item.price * item.quantity)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-4 p-2 bg-gray-100 rounded text-sm">
                    <span className="text-gray-600 font-medium">Payment Method</span>
                    <span className="font-bold text-gray-800 uppercase">
                      {(order.paymentMethod || "COD").replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal</span>
                      <span>RM{order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Delivery Fee</span>
                      <span>{order.shippingFee > 0 ? `RM${order.shippingFee.toFixed(2)}` : "FREE"}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Discount</span>
                        <span>-RM{order.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="font-semibold text-gray-800">Total</span>
                      <span className="font-bold text-xl text-green-700">RM{order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancellation Form Modal */}
      {showCancellationForm && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Cancel Order</h2>
                <button
                  onClick={closeCancellationForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <form onSubmit={handleCancellationSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Cancellation *
                  </label>
                  <select
                    value={cancellationForm.reason}
                    onChange={(e) => setCancellationForm(prev => ({ ...prev, reason: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select a reason</option>
                    <option value="changed_mind">Changed my mind</option>
                    <option value="found_better_price">Found better price elsewhere</option>
                    <option value="duplicate_order">Duplicate order</option>
                    <option value="wrong_items">Wrong items selected</option>
                    <option value="delivery_issues">Delivery time too long</option>
                    <option value="personal_emergency">Personal emergency</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Refund Preference *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="refundType"
                        value="refund"
                        checked={cancellationForm.refundType === 'refund'}
                        onChange={(e) => setCancellationForm(prev => ({ ...prev, refundType: e.target.value as 'refund' | 'substitute' }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Full refund to original payment method</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="refundType"
                        value="substitute"
                        checked={cancellationForm.refundType === 'substitute'}
                        onChange={(e) => setCancellationForm(prev => ({ ...prev, refundType: e.target.value as 'refund' | 'substitute' }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Substitute with similar items</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={cancellationForm.additionalNotes}
                    onChange={(e) => setCancellationForm(prev => ({ ...prev, additionalNotes: e.target.value }))}
                    rows={3}
                    placeholder="Please provide any additional details about your cancellation..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeCancellationForm}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={cancellingOrder === selectedOrderId}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {cancellingOrder === selectedOrderId ? 'Processing...' : 'Submit Cancellation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
