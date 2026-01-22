"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaMapMarkerAlt,
  FaExclamationTriangle,
} from "react-icons/fa";
import { getCurrentUser, getAuthToken, isAuthenticated } from "@/utils/auth";

/** UI Address shape (matches how we render + edit) */
type UIAddress = {
  id: number;
  label?: string | null;
  name: string;
  phone?: string | null;
  address_line: string;
  city: string;
  state?: string | null;
  postal: string;
  isDefault?: boolean;
};

export default function AddressPage() {
  const router = useRouter();

  const [addresses, setAddresses] = useState<UIAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [fromCheckout, setFromCheckout] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [formData, setFormData] = useState<UIAddress>({
    id: 0,
    label: "",
    name: "",
    phone: "",
    address_line: "",
    city: "",
    state: "",
    postal: "",
    isDefault: false,
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const redirectAfterAddress = sessionStorage.getItem("redirectAfterAddress");
    if (redirectAfterAddress) setFromCheckout(true);

    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  /** Map API -> UI */
  const normalizeFromApi = (a: any) => ({
    id: Number(a.id),
    label: a.label ?? null,
    name: a.name ?? "",
    phone: a.phone ?? null,
    address_line: a.address_line ?? a.addressLine ?? "", // <— accepts both
    city: a.city ?? "",
    state: a.state ?? null,
    postal: a.postal ?? "",
    isDefault: a.is_default === 1 || a.is_default === true || a.isDefault === true,
  });

  /** Map UI -> API */
  const toApiPayload = (ui: UIAddress, userId: number) => ({
    userId,
    label: ui.label || null,
    name: ui.name,
    phone: ui.phone || null,
    addressLine: ui.address_line, // ✅ backend expects camelCase addressLine
    city: ui.city,
    state: ui.state || null,
    postal: ui.postal,
    isDefault: !!ui.isDefault,
  });

  const fetchAddresses = async () => {
    setLoading(true);
    setError("");
    try {
      const token = getAuthToken();
      const user = getCurrentUser();
      if (!user) throw new Error("User not found. Please log in again.");

      const res = await fetch(
        `http://localhost:8080/api/addresses?userId=${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error(`Failed to fetch addresses (${res.status})`);

      const data = await res.json();
      setAddresses((data || []).map(normalizeFromApi));
    } catch (e: any) {
      console.error(e);
      setError("Failed to fetch addresses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");

    try {
      const token = getAuthToken();
      const user = getCurrentUser();
      if (!user?.id) throw new Error("User not found. Please log in again.");

      const payload = toApiPayload(formData, user.id);

      let res: Response;
      if (editingId !== null) {
        res = await fetch(`http://localhost:8080/api/addresses/${editingId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("http://localhost:8080/api/addresses", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        let msg = `Save failed (${res.status})`;
        try {
          const body = await res.json();
          msg = body?.message || body?.error || msg;
        } catch {}
        throw new Error(msg);
      }

      const saved = normalizeFromApi(await res.json());

      if (editingId !== null) {
        setAddresses((prev) =>
          prev.map((a) => (a.id === editingId ? saved : a))
        );
      } else {
        setAddresses((prev) => [...prev, saved]);

        if (fromCheckout) {
          const redirectUrl = sessionStorage.getItem("redirectAfterAddress");
          if (redirectUrl) {
            sessionStorage.removeItem("redirectAfterAddress");
            router.push(redirectUrl);
            return;
          }
        }
      }

      // reset
      setShowForm(false);
      setEditingId(null);
      setFormData({
        id: 0,
        label: "",
        name: "",
        phone: "",
        address_line: "",
        city: "",
        state: "",
        postal: "",
        isDefault: false,
      });
    } catch (err: any) {
      console.error("Error submitting address:", err);
      setError(err.message || "Network/Server error.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleBackToCheckout = () => {
    const redirectUrl = sessionStorage.getItem("redirectAfterAddress");
    if (redirectUrl) {
      sessionStorage.removeItem("redirectAfterAddress");
      router.push(redirectUrl);
    }
  };

  const handleEdit = (address: UIAddress) => {
    setFormData({
      id: address.id,
      label: address.label || "",
      name: address.name,
      phone: address.phone || "",
      address_line: address.address_line,
      city: address.city,
      state: address.state || "",
      postal: address.postal,
      isDefault: !!address.isDefault,
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      const token = getAuthToken();
      const user = getCurrentUser();

      const res = await fetch(
        `http://localhost:8080/api/addresses/${id}?userId=${user?.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error(`Failed to delete (${res.status})`);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
      setError("Failed to delete address.");
    }
  };

  // ---------- RENDER ----------
  if (loading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading addresses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-black min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FaMapMarkerAlt size={32} className="text-green-600" />
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              DELIVERY ADDRESSES
            </h1>
          </div>
          <p className="text-xl text-gray-600">
            Manage your delivery addresses for fresh grocery delivery
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <FaExclamationTriangle className="text-red-500" />
              <p className="text-red-600 font-medium">{error}</p>
            </div>
            <button
              onClick={fetchAddresses}
              className="mt-2 text-red-600 hover:text-red-700 underline text-sm"
            >
              Try again
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">My Addresses</h2>
          <div className="flex gap-3">
            {fromCheckout && (
              <button
                onClick={handleBackToCheckout}
                className="px-6 py-3 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-all duration-300 font-semibold"
              >
                Back to Checkout
              </button>
            )}
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setFormData({
                  id: 0,
                  label: "",
                  name: "",
                  phone: "",
                  address_line: "",
                  city: "",
                  state: "",
                  postal: "",
                  isDefault: false,
                });
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-300 font-semibold"
            >
              <FaPlus size={16} />
              Add New Address
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-lg p-8 mb-8">
            <h3 className="text-xl font-bold mb-6 text-gray-800">
              {editingId ? "Edit Address" : "Add New Address"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Address Label
                </label>
                <input
                  type="text"
                  value={formData.label ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none transition-colors"
                  placeholder="e.g., Home, Office"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none transition-colors"
                  required
                  placeholder="Recipient's full name"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none transition-colors"
                  placeholder="Phone"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.address_line}
                  onChange={(e) =>
                    setFormData({ ...formData, address_line: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none transition-colors"
                  required
                  placeholder="Street, building, etc."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-2 font-semibold text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none transition-colors"
                    required
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-gray-700">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none transition-colors"
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-gray-700">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={formData.postal}
                    onChange={(e) =>
                      setFormData({ ...formData, postal: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none transition-colors"
                    required
                    placeholder="Postal Code"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 font-semibold"
                >
                  {formLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {editingId ? "Updating..." : "Saving..."}
                    </div>
                  ) : editingId ? (
                    "Update Address"
                  ) : (
                    "Save Address"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({
                      id: 0,
                      label: "",
                      name: "",
                      phone: "",
                      address_line: "",
                      city: "",
                      state: "",
                      postal: "",
                      isDefault: false,
                    });
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-all duration-300 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Address list */}
        <div className="space-y-6">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-all duration-300"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-bold text-xl text-gray-800">
                      {address.label || "Address"}
                    </h3>
                    {address.isDefault && (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-gray-600">
                    <p className="text-lg font-medium text-gray-800">
                      {address.name}
                    </p>
                    {address.phone && <p className="text-md">{address.phone}</p>}
                    <p className="text-lg">{address.address_line}</p>
                    <p className="text-lg">
                      {address.city}
                      {address.state ? `, ${address.state}` : ""} {address.postal}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(address)}
                    className="text-green-600 p-3 hover:bg-green-50 rounded-lg transition-colors duration-200"
                    title="Edit Address"
                  >
                    <FaEdit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="text-red-500 p-3 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    title="Delete Address"
                  >
                    <FaTrash size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {addresses.length === 0 && (
          <div className="text-center py-12">
            <FaMapMarkerAlt size={64} className="text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-700 mb-4">
              No addresses found
            </h2>
            <p className="text-gray-500 mb-8">
              Add your first delivery address to get started
            </p>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
              }}
              className="bg-green-600 text-white px-8 py-4 font-bold text-lg uppercase tracking-wider hover:bg-green-700 transition-all duration-300 inline-flex items-center gap-3"
            >
              <FaPlus size={16} />
              Add Your First Address
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
