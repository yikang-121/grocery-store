"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaUserCircle, FaClipboardList, FaHeart, FaMapMarkerAlt, FaStar, FaSignOutAlt, FaExclamationTriangle } from "react-icons/fa";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      // Redirect to login if not authenticated
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error("Error parsing user data:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
      return;
    }

    setLoading(false);
  }, [router]);

  const handleLogout = async () => {
    setLogoutLoading(true);
    
    try {
      // Clear local storage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Show success message
      alert("Logged out successfully!");
      
      // Redirect to home page
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Error during logout. Please try again.");
    } finally {
      setLogoutLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  // Show error state if no user data
  if (!user) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <FaExclamationTriangle size={64} className="text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-8">
            Please log in to access your account information.
          </p>
          <Link
            href="/login"
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold text-lg uppercase tracking-wider hover:bg-green-700 transition-all duration-300 inline-flex items-center gap-3"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const navLinks = [
    {
      href: "/orders",
      icon: <FaClipboardList size={22} className="text-green-600" />,
      label: "Order & Tracking",
    },
    {
      href: "/wishlist",
      icon: <FaHeart size={22} className="text-green-600" />,
      label: "Wishlist",
    },
    {
      href: "/address",
      icon: <FaMapMarkerAlt size={22} className="text-green-600" />,
      label: "My Address",
    },
    {
      href: "/points",
      icon: <FaStar size={22} className="text-green-600" />,
      label: "My Extra Points (0)",
    },
  ];

  return (
    <main className="bg-white min-h-screen py-10 px-2">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2 tracking-tight text-gray-800">
            MY ACCOUNT
          </h1>
          <p className="text-gray-600">
            Manage your profile and preferences
          </p>
        </div>

        {/* User Info Card */}
        <div className="flex items-center gap-4 bg-green-50 rounded-lg shadow-lg p-6 mb-8 border border-green-200">
          <FaUserCircle size={48} className="text-green-600" />
          <div className="flex-1">
            <div className="font-bold text-lg text-green-800 mb-1">
              {user.name || "User"}
            </div>
            <div className="text-gray-600 text-sm">
              {user.email || "No email provided"}
            </div>
            <div className="text-green-600 text-xs font-medium mt-1">
              Member since {new Date().getFullYear()}
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:border-green-300 hover:shadow-md transition-all duration-300 group"
            >
              <div className="group-hover:scale-110 transition-transform duration-300">
                {link.icon}
              </div>
              <span className="font-medium text-gray-800 group-hover:text-green-700 transition-colors duration-300">
                {link.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Account Actions */}
        <div className="space-y-4 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-blue-800 mb-2">Account Security</h3>
            <p className="text-blue-700 text-sm mb-3">
              Keep your account safe and secure
            </p>
            <div className="space-y-2">
              <Link 
                href="/change-password"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200 block"
              >
                Change Password
              </Link>
              <div className="text-xs text-blue-600">
                • Two-factor authentication
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-bold text-yellow-800 mb-2">Preferences</h3>
            <p className="text-yellow-700 text-sm mb-3">
              Customize your shopping experience
            </p>
            <div className="space-y-2">
              <button className="text-yellow-600 hover:text-yellow-800 text-sm font-medium transition-colors duration-200">
                Notification Settings
              </button>
              <div className="text-xs text-yellow-600">
                • Email preferences
              </div>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          disabled={logoutLoading}
          className="flex items-center gap-2 w-full justify-center bg-red-50 text-red-700 font-semibold py-4 rounded-lg shadow-sm hover:bg-red-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-red-200"
        >
          <FaSignOutAlt size={20} />
          {logoutLoading ? "Logging Out..." : "Logout"}
        </button>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Need help? Contact our support team</p>
          <p className="mt-1">
            <span className="text-green-600 cursor-pointer hover:text-green-700">
              support@vgrocery.com
            </span>
          </p>
        </div>
      </div>
    </main>
  );
} 