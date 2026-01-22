"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match");
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      return;
    }

    // Validate old password is provided
    if (!oldPassword.trim()) {
      setError("Current password is required");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("Authentication required. Please login again.");
        setTimeout(() => router.push("/login"), 2000);
        return;
      }

      console.log("Making request to change password..."); // Debug log

      const response = await fetch("http://localhost:8080/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
        body: JSON.stringify({ 
          oldPassword, // This maps to currentPassword in backend via @JsonProperty
          newPassword 
        }),
      });

      console.log("Response status:", response.status); // Debug log

      // Check if response is JSON or text
      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textData = await response.text();
        console.log("Non-JSON response:", textData); // Debug log
        data = { message: textData };
      }

      console.log("Response data:", data); // Debug log

      if (response.ok) {
        setMessage("Password changed successfully! Redirecting...");
        // Clear form
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        // Redirect after 2 seconds
        setTimeout(() => router.push("/me"), 2000);
      } else {
        // Handle different error statuses
        if (response.status === 401) {
          setError("Session expired. Please login again.");
          setTimeout(() => router.push("/login"), 2000);
        } else if (response.status === 400) {
          setError(data.message || "Invalid input provided");
        } else if (response.status === 500) {
          setError("Server error occurred. Please try again later.");
        } else {
          setError(data.message || `Server error: ${response.status}`);
        }
      }
    } catch (err) {
      console.error("Password change error:", err);
      
      // More specific error handling
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Cannot connect to server. Please check if the backend is running on port 8080.");
      } else if (err instanceof SyntaxError) {
        setError("Server returned invalid response format.");
      } else {
        setError(`Network error: ${(err as Error).message || "Please try again."}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-white min-h-screen py-10 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2 tracking-tight text-gray-800">
            CHANGE PASSWORD
          </h1>
          <p className="text-gray-600">
            Update your account password
          </p>
        </div>

        {/* Back Link */}
        <div className="mb-6">
          <Link 
            href="/me" 
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FaArrowLeft size={14} />
            Back to Account
          </Link>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700" htmlFor="old-password">
                Current Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  id="old-password"
                  type={showOldPassword ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-10 py-3 focus:border-green-500 focus:outline-none transition-colors"
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                >
                  {showOldPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700" htmlFor="new-password">
                New Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-10 py-3 focus:border-green-500 focus:outline-none transition-colors"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700" htmlFor="confirm-password">
                Confirm New Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-10 py-3 focus:border-green-500 focus:outline-none transition-colors"
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Success Message */}
            {message && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-600 text-sm">
                {message}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg uppercase tracking-wider hover:bg-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Changing Password..." : "Change Password"}
            </button>
          </form>
        </div>

        {/* Security Note */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Make sure your new password is strong and secure</p>
          <p className="mt-1">Use at least 6 characters with a mix of letters, numbers, and symbols</p>
        </div>
      </div>
    </main>
  );
}