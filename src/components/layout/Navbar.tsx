// src/components/layout/Navbar.tsx

'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaShoppingCart, FaUserCircle, FaHome, FaThLarge, FaSearch, FaStore, FaSignOutAlt, FaUserShield, FaClipboardList, FaStar } from "react-icons/fa";
import { useCart } from "@/components/context/CartContext";
import { isAuthenticated, getCurrentUser, clearAuth } from "@/utils/auth";

export default function Navbar() {
  const { cart } = useCart();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      setIsLoggedIn(authenticated);
      
      if (authenticated) {
        const currentUser = getCurrentUser();
        setUser(currentUser);
      } else {
        setUser(null);
      }
    };

    // Check immediately
    checkAuth();

    // Check periodically in case auth state changes in another tab
    const interval = setInterval(checkAuth, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      clearAuth();
      setIsLoggedIn(false);
      setUser(null);
      router.push("/");
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      {/* Left: Logo and Store Selection */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-3">
          <FaStore size={28} className="text-black" />
          <span className="font-bold text-2xl text-black tracking-tight">
            VGROCERY
          </span>
        </Link>

      </div>

      {/* Center: Main Navigation */}
      <div className="hidden md:flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-black font-medium text-sm uppercase tracking-wide transition-colors duration-200">
          <FaHome size={16} />
          Home
        </Link>
        <Link href="/products" className="flex items-center gap-2 text-gray-700 hover:text-black font-medium text-sm uppercase tracking-wide transition-colors duration-200">
          <FaThLarge size={16} />
          Collection
        </Link>
        <Link href="/points" className="flex items-center gap-2 text-gray-700 hover:text-black font-medium text-sm uppercase tracking-wide transition-colors duration-200" title="Points">
          <FaStar size={16} />
          <span className="hidden xl:block">Points</span>
        </Link>
        <Link href="/orders" className="flex items-center gap-2 text-gray-700 hover:text-black font-medium text-sm uppercase tracking-wide transition-colors duration-200" title="Orders">
          <FaClipboardList size={16} />
          <span className="hidden xl:block">Orders</span>
        </Link>
      </div>

      {/* Right: Search, Cart, Account */}
      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="hidden sm:flex items-center bg-gray-100 border border-gray-200 rounded-full px-4 py-2">
          <FaSearch size={14} className="text-gray-500 mr-2" />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="bg-transparent outline-none text-black placeholder-gray-500 text-sm w-32 lg:w-48"
          />
        </div>

        {/* Cart */}
        <Link href="/cart" className="relative flex items-center text-gray-700 hover:text-black transition-colors duration-200">
          <FaShoppingCart size={20} />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {cart.length}
            </span>
          )}
        </Link>

        {/* Account */}
        <Link href="/me" className="flex items-center text-gray-700 hover:text-black transition-colors duration-200">
          <FaUserCircle size={20} />
        </Link>

        {/* Login/Logout */}
        {isLoggedIn ? (
          <div className="flex items-center gap-3">
            {/* User Name (optional, hidden on small screens) */}
            {user?.name && (
              <span className="hidden lg:block text-sm text-gray-700 font-medium">
                Hi, {user.name.split(' ')[0]}
              </span>
            )}
            
            {/* Admin Dashboard Button (only show for admin users) */}
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className="flex items-center justify-center w-10 h-10 border border-green-500 text-green-600 hover:bg-green-500 hover:text-white transition-all duration-200 rounded-full"
                title="Admin Dashboard"
              >
                <FaUserShield size={16} />
              </Link>
            )}
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-10 h-10 border border-red-500 text-red-600 hover:bg-red-500 hover:text-white transition-all duration-200 rounded-full"
              title="Logout"
            >
              <FaSignOutAlt size={16} />
            </button>
          </div>
        ) : (
          <Link href="/login" className="hidden sm:block px-6 py-2 border border-black text-black hover:bg-black hover:text-white font-medium text-sm uppercase tracking-wide transition-all duration-200">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}