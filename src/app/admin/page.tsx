"use client";
import React from "react";
import Link from "next/link";
import { FaUserShield, FaBoxOpen, FaClipboardList, FaWarehouse, FaUpload } from "react-icons/fa";

export default function AdminDashboard() {
  // Mock admin user
  const admin = {
    name: "Admin User",
    email: "admin@vgrocery.com",
    role: "Administrator",
  };

  const navLinks = [
    {
      href: "/admin/products",
      icon: <FaBoxOpen size={22} color="#16a34a" />,
      label: "Manage Products",
    },
    {
      href: "/admin/orders",
      icon: <FaClipboardList size={22} color="#16a34a" />,
      label: "Manage Orders",
    },
    {
      href: "/admin/inventory",
      icon: <FaWarehouse size={22} color="#16a34a" />,
      label: "Inventory & Spoilage",
    },
    {
      href: "/admin/restock",
      icon: <FaUpload size={22} color="#16a34a" />,
      label: "Restocking & Bulk Upload",
    },
  ];

  return (
    <main className="bg-white min-h-screen py-10 px-2">
      <div className="max-w-2xl mx-auto">
        {/* Admin Info Card */}
        <div className="flex items-center gap-4 bg-green-50 rounded-lg shadow p-6 mb-8">
          <FaUserShield size={48} color="#16a34a" />
          <div>
            <div className="font-bold text-lg text-green-800">{admin.name}</div>
            <div className="text-gray-600 text-sm">{admin.email}</div>
            <div className="text-green-700 text-xs font-semibold mt-1">{admin.role}</div>
          </div>
        </div>
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="flex items-center gap-4 bg-gray-50 rounded-lg shadow p-5 hover:bg-green-50 transition"
            >
              {link.icon}
              <span className="font-medium text-gray-800">{link.label}</span>
            </Link>
          ))}
        </div>
        {/* Stats Section (optional) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-100 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-800">42</div>
            <div className="text-green-700 mt-1 text-sm">Total Products</div>
          </div>
          <div className="bg-green-100 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-800">12</div>
            <div className="text-green-700 mt-1 text-sm">Orders Today</div>
          </div>
        </div>
      </div>
    </main>
  );
}
