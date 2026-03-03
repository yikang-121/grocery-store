"use client";
import React, { useEffect, useState } from "react";
import {
  FaPlus, FaBoxOpen, FaChevronDown, FaChevronRight,
  FaExclamationTriangle, FaCheckCircle, FaClock,
  FaSearch, FaTimes, FaTag, FaCubes, FaCalendarAlt,
  FaDollarSign, FaImage, FaBarcode, FaTrashAlt
} from "react-icons/fa";

/* ---------- Types ---------- */
type Batch = {
  id: number;
  productId: number;
  batchNo: string;
  expiryDate: string;
  availableQuantity: number;
};

type Product = {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  imageUrl: string;
  batches?: Batch[];
};

/* ---------- Helpers ---------- */
const getExpiryStatus = (expiryDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return { text: "Expired", color: "bg-red-100 text-red-700", icon: <FaExclamationTriangle size={10} /> };
  if (diffDays <= 7) return { text: `${diffDays}d left`, color: "bg-orange-100 text-orange-700", icon: <FaClock size={10} /> };
  if (diffDays <= 30) return { text: `${diffDays}d left`, color: "bg-yellow-100 text-yellow-700", icon: <FaClock size={10} /> };
  return { text: `${diffDays}d left`, color: "bg-green-100 text-green-700", icon: <FaCheckCircle size={10} /> };
};

/* ---------- Mock Data (fallback) ---------- */
const mockProducts: Product[] = [];

/* ---------- Page ---------- */
export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [addBatchForId, setAddBatchForId] = useState<number | null>(null);
  const [spoilageForBatchId, setSpoilageForBatchId] = useState<number | null>(null);
  const [spoilageForm, setSpoilageForm] = useState({ qty: "", reason: "EXPIRED" });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8080/api/products");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // New Product Form
  const [newProduct, setNewProduct] = useState({
    name: "", sku: "", category: "", costPrice: "", price: "", imageUrl: "",
    batchQty: "", batchExpiry: "", batchNo: "",
  });

  // Add Batch Form
  const [newBatch, setNewBatch] = useState({ qty: "", expiry: "", batchNo: "" });

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const id = Date.now();
    const product: Product = {
      id,
      name: newProduct.name,
      sku: newProduct.sku,
      category: newProduct.category || "General",
      costPrice: parseFloat(newProduct.costPrice) || 0,
      price: parseFloat(newProduct.price) || 0,
      stockQuantity: parseInt(newProduct.batchQty) || 0,
      imageUrl: newProduct.imageUrl,
      batches: newProduct.batchQty
        ? [{
          id: id + 1,
          productId: id,
          batchNo: newProduct.batchNo || `B${String(id).slice(-4)}`,
          expiryDate: newProduct.batchExpiry,
          availableQuantity: parseInt(newProduct.batchQty) || 0,
        }]
        : [],
    };
    setProducts([product, ...products]);
    setShowNewProductForm(false);
    setNewProduct({ name: "", sku: "", category: "", costPrice: "", price: "", imageUrl: "", batchQty: "", batchExpiry: "", batchNo: "" });
    setExpandedIds((prev) => new Set(prev).add(id));
  };

  const handleAddBatch = async (e: React.FormEvent, productId: number) => {
    e.preventDefault();
    const qty = parseInt(newBatch.qty) || 0;
    const batchData = {
      productId,
      batchNo: newBatch.batchNo || `B${String(Date.now()).slice(-4)}`,
      expiryDate: newBatch.expiry,
      availableQuantity: qty,
    };

    try {
      const res = await fetch("http://localhost:8080/api/admin/restock/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batchData),
      });

      if (!res.ok) throw new Error("Failed to add batch");
      const savedBatch = await res.json();

      setProducts(
        products.map((p) =>
          p.id === productId
            ? {
              ...p,
              stockQuantity: p.stockQuantity + qty,
              batches: [...(p.batches || []), savedBatch],
            }
            : p
        )
      );
      setAddBatchForId(null);
      setNewBatch({ qty: "", expiry: "", batchNo: "" });
    } catch (err) {
      console.error("Error adding batch:", err);
      alert("Failed to add batch. Please check if backend is running.");
    }
  };

  const handleCleanupExpired = async () => {
    if (!confirm("Are you sure you want to clear all expired batches? This will move all remaining quantities to spoilage logs.")) return;
    try {
      const res = await fetch("http://localhost:8080/api/admin/restock/cleanup-expired", { method: "POST" });
      if (!res.ok) throw new Error("Cleanup failed");
      const count = await res.json();
      alert(`Cleanup successful! ${count} batches processed.`);
      fetchProducts(); // Refresh list
    } catch (err) {
      console.error(err);
      alert("Failed to cleanup expired items.");
    }
  };

  const handleMarkSpoiled = async (e: React.FormEvent, batchId: number, productId: number) => {
    e.preventDefault();
    const qty = parseInt(spoilageForm.qty) || 0;
    try {
      const res = await fetch("http://localhost:8080/api/admin/restock/spoilage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId, quantity: qty, reason: spoilageForm.reason }),
      });
      if (!res.ok) throw new Error("Failed to record spoilage");

      setSpoilageForBatchId(null);
      setSpoilageForm({ qty: "", reason: "EXPIRED" });
      fetchProducts(); // Refresh list to sync stock
    } catch (err) {
      console.error(err);
      alert("Failed to record spoilage. Check quantity availability.");
    }
  };

  const totalStock = products.reduce((s, p) => s + p.stockQuantity, 0);
  const totalBatches = products.reduce((s, p) => s + (p.batches?.length || 0), 0);
  const expiringCount = products.reduce((s, p) => {
    return s + (p.batches?.filter((b) => {
      const diff = Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return diff > 0 && diff <= 7;
    }).length || 0);
  }, 0);

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-gray-900">Product & Batch Management</h1>
              <p className="text-gray-500 mt-1">Manage individual products and their inventory batches</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCleanupExpired}
                className="flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-5 py-3 font-semibold text-sm uppercase tracking-wider hover:bg-amber-100 transition-all duration-200 rounded-lg shadow-sm"
              >
                <FaTrashAlt size={14} />
                Cleanup Expired
              </button>
              <button
                onClick={() => { setShowNewProductForm(!showNewProductForm); setAddBatchForId(null); }}
                className="flex items-center gap-2 bg-green-600 text-white px-5 py-3 font-semibold text-sm uppercase tracking-wider hover:bg-green-700 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
              >
                <FaPlus size={14} />
                Add New Product
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2.5 rounded-lg">
                  <FaBoxOpen className="text-green-600" size={18} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-800">{products.length}</div>
                  <div className="text-xs text-green-600 font-medium uppercase tracking-wide">Products</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2.5 rounded-lg">
                  <FaCubes className="text-blue-600" size={18} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-800">{totalBatches}</div>
                  <div className="text-xs text-blue-600 font-medium uppercase tracking-wide">Active Batches</div>
                </div>
              </div>
            </div>
            <div className={`bg-gradient-to-br border rounded-xl p-4 ${expiringCount > 0 ? "from-orange-50 to-amber-50 border-orange-200" : "from-gray-50 to-slate-50 border-gray-200"}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${expiringCount > 0 ? "bg-orange-100" : "bg-gray-100"}`}>
                  <FaExclamationTriangle className={expiringCount > 0 ? "text-orange-600" : "text-gray-400"} size={18} />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${expiringCount > 0 ? "text-orange-800" : "text-gray-800"}`}>{expiringCount}</div>
                  <div className={`text-xs font-medium uppercase tracking-wide ${expiringCount > 0 ? "text-orange-600" : "text-gray-500"}`}>Expiring Soon</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* New Product Form */}
        {showNewProductForm && (
          <form onSubmit={handleAddProduct} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6 animate-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FaPlus className="text-green-600" size={16} />
                Add New Product
              </h2>
              <button type="button" onClick={() => setShowNewProductForm(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <FaTimes size={18} />
              </button>
            </div>

            {/* Product Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                  <FaTag size={12} className="text-gray-400" /> Product Name *
                </label>
                <input type="text" required value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="e.g. Organic Avocado"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-sm" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                  <FaBarcode size={12} className="text-gray-400" /> SKU *
                </label>
                <input type="text" required value={newProduct.sku}
                  onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  placeholder="e.g. AVO001"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-sm" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                  <FaBoxOpen size={12} className="text-gray-400" /> Category
                </label>
                <input type="text" value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  placeholder="e.g. Fruits"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                  <FaDollarSign size={12} className="text-gray-400" /> Cost Price (RM)
                </label>
                <input type="number" step="0.01" value={newProduct.costPrice}
                  onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-sm" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                  <FaDollarSign size={12} className="text-gray-400" /> Selling Price (RM)
                </label>
                <input type="number" step="0.01" value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-sm" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                  <FaImage size={12} className="text-gray-400" /> Image URL
                </label>
                <input type="url" value={newProduct.imageUrl}
                  onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-sm" />
              </div>
            </div>

            {/* Initial Batch */}
            <div className="bg-gray-50 rounded-lg p-4 mb-5 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FaCubes size={12} className="text-blue-500" />
                Initial Batch (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Batch Number</label>
                  <input type="text" value={newProduct.batchNo}
                    onChange={(e) => setNewProduct({ ...newProduct, batchNo: e.target.value })}
                    placeholder="e.g. B001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Quantity</label>
                  <input type="number" min={0} value={newProduct.batchQty}
                    onChange={(e) => setNewProduct({ ...newProduct, batchQty: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Expiry Date</label>
                  <input type="date" value={newProduct.batchExpiry}
                    onChange={(e) => setNewProduct({ ...newProduct, batchExpiry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit"
                className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 text-sm uppercase tracking-wider">
                Create Product
              </button>
              <button type="button" onClick={() => setShowNewProductForm(false)}
                className="px-6 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition text-sm">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text" value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, SKU, or category..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm shadow-sm"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <FaTimes size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Product List */}
        <div className="space-y-3">
          {filteredProducts.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <FaBoxOpen size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No products found</p>
              <p className="text-gray-400 text-sm mt-1">Try a different search or add a new product</p>
            </div>
          )}

          {filteredProducts.map((product) => {
            const isExpanded = expandedIds.has(product.id);
            const batchCount = product.batches?.length || 0;
            const displayStock = product.batches && product.batches.length > 0
              ? product.batches.reduce((sum, b) => sum + b.availableQuantity, 0)
              : product.stockQuantity;

            return (
              <div key={product.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                {/* Product Row */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none hover:bg-gray-50 transition-colors"
                  onClick={() => toggleExpand(product.id)}
                >
                  {/* Expand Icon */}
                  <div className="text-gray-400">
                    {isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                  </div>

                  {/* Product Image / Placeholder */}
                  <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <FaBoxOpen className="text-green-500" size={16} />
                    )}
                  </div>

                  {/* Name & SKU */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{product.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{product.sku}</div>
                  </div>

                  {/* Category Badge */}
                  <span className="hidden sm:inline-flex px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    {product.category}
                  </span>

                  {/* Price */}
                  <div className="text-right hidden md:block">
                    <div className="font-semibold text-gray-900 text-sm">
                      RM {product.price?.toFixed(2) ?? "0.00"}
                    </div>
                    <div className="text-xs text-gray-400">
                      Cost: RM {product.costPrice?.toFixed(2) ?? "0.00"}
                    </div>
                  </div>

                  {/* Stock */}
                  <div className="text-right min-w-[80px]">
                    <div className={`font-bold text-sm ${product.stockQuantity <= 20 ? "text-red-600" : "text-gray-900"}`}>
                      {displayStock} units
                    </div>
                    <div className="text-xs text-gray-400">{batchCount} batch{batchCount !== 1 ? "es" : ""}</div>
                  </div>
                </div>

                {/* Expanded Batch Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50">
                    {product.batches && product.batches.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {product.batches.map((batch) => {
                          const status = getExpiryStatus(batch.expiryDate);
                          return (
                            <React.Fragment key={batch.id}>
                              <div className="flex items-center gap-4 px-5 py-3 pl-16 hover:bg-gray-50 transition-colors">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"></div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium text-gray-700">Batch #{batch.batchNo}</span>
                                </div>
                                <div className="text-sm text-gray-600 font-medium">
                                  {batch.availableQuantity} units
                                </div>
                                <div className="text-sm text-gray-500">
                                  <FaCalendarAlt size={10} className="inline mr-1" />
                                  {new Date(batch.expiryDate).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
                                </div>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${status.color}`}>
                                  {status.icon} {status.text}
                                </span>

                                <button
                                  onClick={(e) => { e.stopPropagation(); setSpoilageForBatchId(batch.id); }}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                  title="Mark Spoiled"
                                >
                                  <FaTrashAlt size={12} />
                                </button>
                              </div>

                              {/* Spoilage Form Inline */}
                              {spoilageForBatchId === batch.id && (
                                <div className="bg-red-50/50 px-5 py-3 pl-16 border-t border-red-100">
                                  <form onSubmit={(e) => handleMarkSpoiled(e, batch.id, product.id)} className="flex items-end gap-3">
                                    <div className="flex-1 max-w-[120px]">
                                      <label className="text-[10px] font-bold text-red-600 uppercase mb-1 block">Qty Spoiled</label>
                                      <input
                                        type="number" required min={1} max={batch.availableQuantity}
                                        value={spoilageForm.qty}
                                        onChange={(e) => setSpoilageForm({ ...spoilageForm, qty: e.target.value })}
                                        className="w-full px-3 py-1.5 border border-red-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                                        placeholder={`Max ${batch.availableQuantity}`}
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <label className="text-[10px] font-bold text-red-600 uppercase mb-1 block">Reason</label>
                                      <select
                                        value={spoilageForm.reason}
                                        onChange={(e) => setSpoilageForm({ ...spoilageForm, reason: e.target.value })}
                                        className="w-full px-3 py-1.5 border border-red-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                                      >
                                        <option value="EXPIRED">Expired</option>
                                        <option value="DAMAGED">Damaged / Broken</option>
                                        <option value="STOLEN">Lost / Stolen</option>
                                        <option value="OTHER">Other</option>
                                      </select>
                                    </div>
                                    <div className="flex gap-2">
                                      <button type="submit" className="px-4 py-1.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700">Confirm</button>
                                      <button type="button" onClick={() => setSpoilageForBatchId(null)} className="px-3 py-1.5 bg-gray-200 text-gray-600 text-sm rounded-lg">Cancel</button>
                                    </div>
                                  </form>
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-400 text-sm">No batches yet</div>
                    )}

                    {/* Add Batch Inline Form */}
                    {addBatchForId === product.id ? (
                      <form onSubmit={(e) => handleAddBatch(e, product.id)} className="px-5 py-4 pl-16 border-t border-gray-200 bg-blue-50/50">
                        <div className="grid grid-cols-4 gap-3 items-end">
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Batch No.</label>
                            <input type="text" value={newBatch.batchNo}
                              onChange={(e) => setNewBatch({ ...newBatch, batchNo: e.target.value })}
                              placeholder="B006"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Quantity *</label>
                            <input type="number" required min={1} value={newBatch.qty}
                              onChange={(e) => setNewBatch({ ...newBatch, qty: e.target.value })}
                              placeholder="50"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Expiry Date *</label>
                            <input type="date" required value={newBatch.expiry}
                              onChange={(e) => setNewBatch({ ...newBatch, expiry: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                          </div>
                          <div className="flex gap-2">
                            <button type="submit"
                              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
                              Add
                            </button>
                            <button type="button" onClick={() => setAddBatchForId(null)}
                              className="px-3 bg-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-300 transition">
                              <FaTimes size={12} />
                            </button>
                          </div>
                        </div>
                      </form>
                    ) : (
                      <div className="px-5 py-3 pl-16 border-t border-gray-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); setAddBatchForId(product.id); setShowNewProductForm(false); }}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium hover:bg-blue-50 px-3 py-1.5 rounded-lg transition"
                        >
                          <FaPlus size={10} /> Add New Batch
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
