"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  FaUserShield, FaBoxOpen, FaClipboardList, FaWarehouse, FaUpload,
  FaArrowRight, FaChartLine, FaExclamationTriangle, FaShoppingCart,
  FaMoneyBillWave, FaExchangeAlt, FaBell, FaCheckDouble, FaTruck,
} from "react-icons/fa";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  referenceId: number | null;
  isRead: boolean;
  createdAt: string;
}

const NOTIF_API = "http://localhost:8080/api/admin/notifications";

export default function AdminDashboard() {

  const admin = {
    name: "Admin User",
    email: "admin@vgrocery.com",
    role: "Administrator",
  };

  // --- Dashboard stats state (synced with database) ---
  const [totalProducts, setTotalProducts] = useState<number | null>(null);
  const [ordersToday, setOrdersToday] = useState<number | null>(null);
  const [lowStockItems, setLowStockItems] = useState<number | null>(null);
  const [revenueToday, setRevenueToday] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // --- Notification state ---
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch dashboard stats from backend
  useEffect(() => {
    const fetchDashboardStats = async () => {
      setStatsLoading(true);
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        // Fetch stock report and sales report in parallel
        const [stockRes, salesRes] = await Promise.all([
          fetch("http://localhost:8080/api/admin/reports/stock"),
          fetch(`http://localhost:8080/api/admin/reports/sales?year=${year}&month=${month}`),
        ]);

        if (stockRes.ok) {
          const stockData = await stockRes.json();
          setTotalProducts(stockData.totalProducts ?? 0);
          setLowStockItems(stockData.lowStockCount ?? 0);
        }

        if (salesRes.ok) {
          const salesData = await salesRes.json();
          // Filter for today's orders and revenue from daily sales breakdown
          const todayStr = now.toISOString().split("T")[0]; // "YYYY-MM-DD"
          const todaySales = salesData.dailySales?.find(
            (d: { date: string }) => d.date === todayStr
          );
          setOrdersToday(todaySales?.orderCount ?? 0);
          setRevenueToday(todaySales?.revenue ?? 0);
        }
      } catch (e) {
        console.error("Error fetching dashboard stats:", e);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchDashboardStats();
    // Refresh stats every 60 seconds
    const interval = setInterval(fetchDashboardStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch(`${NOTIF_API}/unread-count`);
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch (e) { /* silent */ }
  };

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const res = await fetch(NOTIF_API);
      if (res.ok) setNotifications(await res.json());
    } catch (e) { /* silent */ }
    setNotifLoading(false);
  };

  const markAsRead = async (id: number) => {
    try {
      await fetch(`${NOTIF_API}/${id}/read`, { method: "PUT" });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) { /* silent */ }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${NOTIF_API}/read-all`, { method: "PUT" });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) { /* silent */ }
  };

  // Poll unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch full list when panel is opened
  useEffect(() => {
    if (showNotifPanel) fetchNotifications();
  }, [showNotifPanel]);

  // Close panel if clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotifPanel(false);
      }
    };
    if (showNotifPanel) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifPanel]);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const navLinks = [
    {
      href: "/admin/products",
      icon: <FaBoxOpen size={24} />,
      label: "Products",
      description: "Add, edit, and manage individual products & batches",
      color: "from-green-500 to-emerald-600",
      iconBg: "bg-green-100 text-green-600",
    },
    {
      href: "/admin/restock",
      icon: <FaUpload size={24} />,
      label: "Bulk Restock",
      description: "Upload CSV files for bulk inventory restocking",
      color: "from-blue-500 to-indigo-600",
      iconBg: "bg-blue-100 text-blue-600",
    },
    {
      href: "/admin/orders",
      icon: <FaClipboardList size={24} />,
      label: "Orders",
      description: "View and manage customer orders",
      color: "from-purple-500 to-violet-600",
      iconBg: "bg-purple-100 text-purple-600",
    },
    {
      href: "/admin/restock-suggestions",
      icon: <FaChartLine size={24} />,
      label: "Restock Suggestions",
      description: "AI-powered restocking with trend & volatility analysis",
      color: "from-cyan-500 to-blue-600",
      iconBg: "bg-cyan-100 text-cyan-600",
    },
    {
      href: "/admin/reports",
      icon: <FaChartLine size={24} />,
      label: "Stock Report",
      description: "Stock levels, movement trends, and inventory analysis",
      color: "from-rose-500 to-pink-600",
      iconBg: "bg-rose-100 text-rose-600",
    },
    {
      href: "/admin/accounting",
      icon: <FaMoneyBillWave size={24} />,
      label: "Accounting",
      description: "Profit & loss, invoices, tax, and purchase orders",
      color: "from-emerald-500 to-teal-600",
      iconBg: "bg-emerald-100 text-emerald-600",
    },
    {
      href: "/admin/stock-movements",
      icon: <FaExchangeAlt size={24} />,
      label: "Stock Movements",
      description: "Track every stock in/out event with full audit trail",
      color: "from-violet-500 to-purple-600",
      iconBg: "bg-violet-100 text-violet-600",
    },
  ];

  const stats = [
    { label: "Total Products", value: statsLoading ? "—" : String(totalProducts ?? 0), icon: <FaBoxOpen size={20} />, color: "text-green-600", bg: "bg-green-50 border-green-200" },
    { label: "Orders Today", value: statsLoading ? "—" : String(ordersToday ?? 0), icon: <FaShoppingCart size={20} />, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
    { label: "Low Stock Items", value: statsLoading ? "—" : String(lowStockItems ?? 0), icon: <FaExclamationTriangle size={20} />, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
    { label: "Revenue (Today)", value: statsLoading ? "—" : `RM ${(revenueToday ?? 0).toFixed(2)}`, icon: <FaChartLine size={20} />, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
  ];



  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl shadow-lg shadow-green-200">
                <FaUserShield size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-500 text-sm mt-0.5">Welcome back, {admin.name}</p>
              </div>
            </div>

            {/* Notification Bell */}
            <div className="relative" ref={panelRef}>
              <button
                id="notification-bell"
                onClick={() => setShowNotifPanel(!showNotifPanel)}
                className="relative p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-200 group"
                title="Notifications"
              >
                <FaBell size={20} className="text-gray-600 group-hover:text-gray-800 transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifPanel && (
                <>
                  {/* Backdrop overlay */}
                  <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                    onClick={() => setShowNotifPanel(false)}
                  />
                  <div className="absolute right-0 top-14 w-[400px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  {/* Panel Header */}
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">Notifications</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{unreadCount} unread</p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <FaCheckDouble size={10} /> Mark all read
                      </button>
                    )}
                  </div>

                  {/* Notification List */}
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifLoading ? (
                      <div className="p-6 space-y-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                        ))}
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-10 text-center">
                        <FaBell size={32} className="mx-auto text-gray-200 mb-3" />
                        <p className="text-sm text-gray-400">No notifications yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {notifications.map(notif => {
                          const isLowStock = notif.type === "LOW_STOCK_ALERT";
                          const linkHref = "/admin/accounting";
                          return (
                          <Link
                            key={notif.id}
                            href={linkHref}
                            onClick={() => {
                              if (!notif.isRead) markAsRead(notif.id);
                              setShowNotifPanel(false);
                            }}
                            className={`block px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                              !notif.isRead ? "bg-blue-50/40" : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`flex-shrink-0 p-2 rounded-lg mt-0.5 ${
                                !notif.isRead
                                  ? isLowStock
                                    ? "bg-red-100 text-red-600"
                                    : "bg-orange-100 text-orange-600"
                                  : "bg-gray-100 text-gray-400"
                              }`}>
                                {isLowStock ? <FaExclamationTriangle size={14} /> : <FaTruck size={14} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-semibold truncate ${
                                    !notif.isRead ? "text-gray-900" : "text-gray-600"
                                  }`}>
                                    {notif.title}
                                  </span>
                                  {!notif.isRead && (
                                    <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full" />
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                  {notif.message}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1.5 font-medium uppercase tracking-wide">
                                  {timeAgo(notif.createdAt)}
                                </p>
                              </div>
                            </div>
                          </Link>
                        )})}
                      </div>
                    )}
                  </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className={`${stat.bg} border rounded-xl p-5 transition-all duration-200 hover:shadow-md`}>
              <div className="flex items-center gap-3">
                <div className={stat.color}>{stat.icon}</div>
                <div>
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-0.5">{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Cards */}
        <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:border-gray-300 flex items-start gap-4"
            >
              <div className={`${link.iconBg} p-3 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                {link.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 text-base">{link.label}</h3>
                  <FaArrowRight size={12} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all duration-200" />
                </div>
                <p className="text-gray-500 text-sm mt-1 leading-relaxed">{link.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
