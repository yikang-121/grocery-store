"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaUser, FaLock, FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";

export default function LoginRegisterPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  
  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      // Check if response is JSON or text
      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // Handle plain text response
        const textData = await response.text();
        data = { message: textData };
      }

      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Show success message
        alert("Login successful! Welcome back!");
        
        // Check user role and redirect accordingly
        if (data.user && data.user.role === "admin") {
          // Redirect to admin dashboard
          router.push("/admin");
        } else {
          // Check if there's a redirect URL stored for regular users
          const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
          if (redirectUrl) {
            sessionStorage.removeItem('redirectAfterLogin');
            router.push(redirectUrl);
          } else {
            // Redirect to home page for regular users
            router.push("/");
          }
        }
      } else {
        setLoginError(data.message || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("Network error. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError("");

    // Validate passwords match
    if (regPassword !== regConfirmPassword) {
      setRegError("Passwords do not match");
      setRegLoading(false);
      return;
    }

    // Validate password length
    if (regPassword.length < 6) {
      setRegError("Password must be at least 6 characters long");
      setRegLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
        }),
      });

      // Check if response is JSON or text
      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // Handle plain text response
        const textData = await response.text();
        data = { message: textData };
      }

      if (response.ok) {
        // Show success message
        alert("Registration successful! Please log in with your new account.");
        
        // Clear form and switch to login tab
        setRegName("");
        setRegEmail("");
        setRegPassword("");
        setRegConfirmPassword("");
        setTab("login");
      } else {
        setRegError(data.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setRegError("Network error. Please try again.");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="bg-white text-black min-h-screen flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2 tracking-tight">
            {tab === "login" ? "WELCOME BACK" : "JOIN VGROCERY"}
          </h1>
          <p className="text-gray-600">
            {tab === "login" 
              ? "Sign in to your account to continue shopping" 
              : "Create your account to start shopping fresh groceries"
            }
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-8">
          {/* Tabs */}
          <div className="flex mb-8 border-b border-gray-200">
            <button
              className={`flex-1 py-3 font-bold text-lg border-b-2 transition-all duration-300 ${
                tab === "login" 
                  ? "border-green-600 text-green-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setTab("login")}
            >
              Login
            </button>
            <button
              className={`flex-1 py-3 font-bold text-lg border-b-2 transition-all duration-300 ${
                tab === "register" 
                  ? "border-green-600 text-green-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setTab("register")}
            >
              Register
            </button>
          </div>

          {/* Login Form */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block mb-2 font-semibold text-gray-700" htmlFor="login-email">
                  Email Address
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="login-email"
                    type="email"
                    className="w-full border border-gray-300 rounded-lg px-10 py-3 focus:border-green-500 focus:outline-none transition-colors"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              
              <div>
                <label className="block mb-2 font-semibold text-gray-700" htmlFor="login-password">
                  Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="login-password"
                    type={showLoginPassword ? "text" : "password"}
                    className="w-full border border-gray-300 rounded-lg px-10 py-3 focus:border-green-500 focus:outline-none transition-colors"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                  >
                    {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg uppercase tracking-wider hover:bg-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loginLoading}
              >
                {loginLoading ? "Signing In..." : "Sign In"}
              </button>

              <div className="text-center text-sm text-gray-600">
                Forgot your password?{' '}
                <span className="text-green-600 cursor-pointer hover:text-green-700 font-semibold">
                  Reset Password
                </span>
              </div>
            </form>
          )}

          {/* Register Form */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label className="block mb-2 font-semibold text-gray-700" htmlFor="reg-name">
                  Full Name
                </label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="reg-name"
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-10 py-3 focus:border-green-500 focus:outline-none transition-colors"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    autoComplete="name"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700" htmlFor="reg-email">
                  Email Address
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="reg-email"
                    type="email"
                    className="w-full border border-gray-300 rounded-lg px-10 py-3 focus:border-green-500 focus:outline-none transition-colors"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700" htmlFor="reg-password">
                  Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="reg-password"
                    type={showRegPassword ? "text" : "password"}
                    className="w-full border border-gray-300 rounded-lg px-10 py-3 focus:border-green-500 focus:outline-none transition-colors"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                  >
                    {showRegPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700" htmlFor="reg-confirm-password">
                  Confirm Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="reg-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full border border-gray-300 rounded-lg px-10 py-3 focus:border-green-500 focus:outline-none transition-colors"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Confirm your password"
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

              {regError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                  {regError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg uppercase tracking-wider hover:bg-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={regLoading}
              >
                {regLoading ? "Creating Account..." : "Create Account"}
              </button>

              <div className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <span 
                  className="text-green-600 cursor-pointer hover:text-green-700 font-semibold"
                  onClick={() => setTab("login")}
                >
                  Sign In
                </span>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          By continuing, you agree to our{' '}
          <span className="text-green-600 cursor-pointer hover:text-green-700">Terms of Service</span>
          {' '}and{' '}
          <span className="text-green-600 cursor-pointer hover:text-green-700">Privacy Policy</span>
        </div>
      </div>
    </div>
  );
}