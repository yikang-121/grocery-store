"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FaUserShield, FaBoxOpen, FaClipboardList, FaWarehouse, FaUpload,
  FaArrowRight, FaChartLine, FaExclamationTriangle, FaShoppingCart,
} from "react-icons/fa";

export default function AdminDashboard() {
  const admin = {
    name: "Admin User",
    email: "admin@vgrocery.com",
    role: "Administrator",
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
      href: "/admin/inventory",
      icon: <FaWarehouse size={24} />,
      label: "Inventory & Spoilage",
      description: "Track batches, expiry dates, and log spoilage",
      color: "from-orange-500 to-amber-600",
      iconBg: "bg-orange-100 text-orange-600",
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
      href: "/admin/reports",
      icon: <FaChartLine size={24} />,
      label: "Financial Reports",
      description: "Monthly revenue, spoilage loss, and profit analysis",
      color: "from-rose-500 to-pink-600",
      iconBg: "bg-rose-100 text-rose-600",
    },
  ];

  const stats = [
    { label: "Total Products", value: "42", icon: <FaBoxOpen size={20} />, color: "text-green-600", bg: "bg-green-50 border-green-200" },
    { label: "Orders Today", value: "12", icon: <FaShoppingCart size={20} />, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
    { label: "Low Stock Items", value: "5", icon: <FaExclamationTriangle size={20} />, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
    { label: "Revenue (Today)", value: "RM 847", icon: <FaChartLine size={20} />, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
  ];

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center gap-5">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl shadow-lg shadow-green-200">
              <FaUserShield size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-500 text-sm mt-0.5">Welcome back, {admin.name}</p>
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
