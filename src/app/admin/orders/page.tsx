"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FaArrowLeft, FaClipboardList, FaSearch, FaFilter,
  FaChevronDown, FaChevronUp, FaUser, FaMapMarkerAlt,
  FaBoxOpen, FaCreditCard, FaTimes, FaCheck,
  FaTruck, FaSpinner, FaClock, FaBan,
} from "react-icons/fa";

const API = "http://localhost:8080/api/orders";

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  lineTotal: number;
}

interface ShippingAddress {
  name: string;
  address: string;
  city: string;
  postal: string;
}

interface Order {
  id: string; // orderNo
  date: string;
  status: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  userId: number;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress | null;
}

const STATUSES = ["PAID", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"];

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  PENDING: { color: "text-gray-600", bg: "bg-gray-100", icon: <FaClock size={10} /> },
  PAID: { color: "text-blue-700", bg: "bg-blue-100", icon: <FaCreditCard size={10} /> },
  PROCESSING: { color: "text-orange-700", bg: "bg-orange-100", icon: <FaSpinner size={10} /> },
  SHIPPED: { color: "text-indigo-700", bg: "bg-indigo-100", icon: <FaTruck size={10} /> },
  COMPLETED: { color: "text-green-700", bg: "bg-green-100", icon: <FaCheck size={10} /> },
  CANCELLED: { color: "text-red-700", bg: "bg-red-100", icon: <FaBan size={10} /> },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Status update
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      if (res.ok) setOrders(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderNo: string, newStatus: string) => {
    setUpdatingOrder(orderNo);
    try {
      const res = await fetch(`${API}/${orderNo}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(o =>
          o.id === orderNo ? { ...o, status: newStatus } : o
        ));
      }
    } catch (e) { console.error(e); }
    setUpdatingOrder(null);
  };

  const bulkUpdateStatus = async (newStatus: string) => {
    if (selectedOrders.length === 0) return;
    setBulkUpdating(true);
    try {
      const res = await fetch(`${API}/bulk-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNos: selectedOrders, status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(prev => prev.map(o =>
          selectedOrders.includes(o.id) ? { ...o, status: newStatus } : o
        ));
        setSelectedOrders([]);
        alert(`Successfully updated ${data.updated} orders to ${newStatus}`);
      }
    } catch (e) { console.error(e); }
    setBulkUpdating(false);
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  const toggleSelectOrder = (orderNo: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderNo) ? prev.filter(id => id !== orderNo) : [...prev, orderNo]
    );
  };

  // Filter logic
  const filteredOrders = orders.filter(o => {
    if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (
        !o.id.toLowerCase().includes(term) &&
        !(o.customerName || "").toLowerCase().includes(term) &&
        !(o.customerEmail || "").toLowerCase().includes(term)
      ) return false;
    }
    if (dateFrom && o.date) {
      const orderDate = new Date(o.date).toISOString().slice(0, 10);
      if (orderDate < dateFrom) return false;
    }
    if (dateTo && o.date) {
      const orderDate = new Date(o.date).toISOString().slice(0, 10);
      if (orderDate > dateTo) return false;
    }
    return true;
  });

  const fmt = (val: number) => `RM ${Number(val || 0).toFixed(2)}`;

  const statusBadge = (status: string) => {
    const cfg = statusConfig[status] || statusConfig.PENDING;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
        {cfg.icon} {status.replace("_", " ")}
      </span>
    );
  };

  const timeAgo = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })
      + " " + d.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
  };

  // Stats
  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((s, o) => s + (o.total || 0), 0);
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Link href="/admin" className="text-sm text-gray-500 hover:text-green-600 flex items-center gap-1 mb-3">
            <FaArrowLeft size={10} /> Back to Admin
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-4 rounded-2xl shadow-lg shadow-purple-200">
                <FaClipboardList size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-gray-900">Order Management</h1>
                <p className="text-gray-500 mt-0.5">View details, update status, and filter orders</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Status Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${statusFilter === "ALL"
                ? "bg-gray-900 text-white shadow-md"
                : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
              }`}
          >
            All ({orders.length})
          </button>
          {STATUSES.map(s => {
            const cfg = statusConfig[s] || statusConfig.PENDING;
            const count = statusCounts[s] || 0;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? "ALL" : s)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-1.5 ${statusFilter === s
                    ? `${cfg.bg} ${cfg.color} shadow-md ring-2 ring-offset-1 ring-current`
                    : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                  }`}
              >
                {cfg.icon} {s} ({count})
              </button>
            );
          })}
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <FaSearch size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Order No, Customer Name, or Email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${showFilters
                  ? "bg-purple-100 text-purple-700 border border-purple-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
            >
              <FaFilter size={12} /> Filters
            </button>
          </div>

          {/* Extended Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Showing</div>
            <div className="text-2xl font-black text-gray-900 mt-1">{totalOrders}</div>
            <div className="text-xs text-gray-500">orders</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Revenue</div>
            <div className="text-2xl font-black text-green-600 mt-1">{fmt(totalRevenue)}</div>
            <div className="text-xs text-gray-500">from filtered orders</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Pending Action</div>
            <div className="text-2xl font-black text-orange-600 mt-1">{(statusCounts["PAID"] || 0) + (statusCounts["PROCESSING"] || 0)}</div>
            <div className="text-xs text-gray-500">need processing</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Completed</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{statusCounts["COMPLETED"] || 0}</div>
            <div className="text-xs text-gray-500">fulfilled orders</div>
          </div>
        </div>

        {/* Bulk Actions & Selection Control */}
        {!loading && filteredOrders.length > 0 && (
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <span className="text-sm font-semibold text-gray-600">
                {selectedOrders.length > 0 ? `${selectedOrders.length} orders selected` : "Select All"}
              </span>
            </div>

            {selectedOrders.length > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                <span className="text-xs font-bold text-gray-400 uppercase mr-2">Bulk Status:</span>
                {STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => bulkUpdateStatus(s)}
                    disabled={bulkUpdating}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-black text-gray-700 hover:bg-gray-50 hover:border-purple-300 hover:text-purple-600 transition-all shadow-sm disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
                <button
                  onClick={() => setSelectedOrders([])}
                  className="ml-2 p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  title="Clear selection"
                >
                  <FaTimes size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Order List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <FaClipboardList size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 text-sm">No orders found matching your filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                {/* Order Row */}
                <div
                  className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0 flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelectOrder(order.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      {expandedOrder === order.id ? <FaChevronUp size={12} className="text-gray-400" /> : <FaChevronDown size={12} className="text-gray-400" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 font-mono text-sm">{order.id}</span>
                        {statusBadge(order.status)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <FaUser size={9} /> {order.customerName || "Guest"}
                        </span>
                        <span>{timeAgo(order.date)}</span>
                        <span>{order.items?.length || 0} items</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-900 text-lg">{fmt(order.total)}</span>

                    {/* Quick Status Update */}
                    {order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
                      <select
                        value={order.status}
                        onClick={e => e.stopPropagation()}
                        onChange={e => { e.stopPropagation(); updateStatus(order.id, e.target.value); }}
                        disabled={updatingOrder === order.id}
                        className="text-xs font-semibold border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer disabled:opacity-50"
                      >
                        {STATUSES.filter(s => s !== "CANCELLED").map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Expanded Detail */}
                {expandedOrder === order.id && (
                  <div className="border-t border-gray-100">
                    <div className="grid lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
                      {/* Customer Details */}
                      <div className="p-6">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <FaUser size={10} /> Customer Details
                        </h4>
                        <div className="space-y-2">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{order.customerName || "N/A"}</div>
                            <div className="text-xs text-gray-500">{order.customerEmail || "N/A"}</div>
                          </div>
                          {order.shippingAddress && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <FaMapMarkerAlt size={9} /> Shipping Address
                              </div>
                              <div className="text-sm text-gray-700 leading-relaxed">
                                <div className="font-medium">{order.shippingAddress.name}</div>
                                <div>{order.shippingAddress.address}</div>
                                <div>{order.shippingAddress.city} {order.shippingAddress.postal}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="p-6">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <FaBoxOpen size={10} /> Order Items
                        </h4>
                        <div className="space-y-2">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between py-1.5">
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
                                <div className="text-xs text-gray-500">
                                  {fmt(item.price)} × {item.quantity}
                                </div>
                              </div>
                              <div className="text-sm font-bold text-gray-900 ml-4">{fmt(item.lineTotal)}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="p-6">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <FaCreditCard size={10} /> Payment Summary
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="text-gray-900">{fmt(order.subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Shipping</span>
                            <span className="text-gray-900">{fmt(order.shippingFee)}</span>
                          </div>
                          {order.discount > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Discount</span>
                              <span className="text-green-600">-{fmt(order.discount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-bold border-t border-gray-100 pt-2 mt-2">
                            <span className="text-gray-900">Total</span>
                            <span className="text-green-600">{fmt(order.total)}</span>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="text-xs text-gray-400">Payment Method</div>
                            <div className="text-sm font-semibold text-gray-700 mt-0.5 capitalize">{order.paymentMethod || "N/A"}</div>
                          </div>

                          {/* Status Update Section */}
                          {order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Update Status</div>
                              <div className="flex flex-wrap gap-2">
                                {STATUSES.filter(s => s !== order.status).map(s => {
                                  const cfg = statusConfig[s];
                                  return (
                                    <button
                                      key={s}
                                      onClick={() => updateStatus(order.id, s)}
                                      disabled={updatingOrder === order.id}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all hover:shadow-sm disabled:opacity-50 ${cfg.bg} ${cfg.color} border-current/20`}
                                    >
                                      {cfg.icon} {s}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
