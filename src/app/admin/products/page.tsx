"use client";
import React, { useState } from "react";
import { FaEdit, FaTrash, FaPlus, FaBoxOpen } from "react-icons/fa";

// Mock product and batch data
const initialProducts = [
  {
    id: 1,
    name: "Apple",
    batches: [
      { id: 101, stock: 50, expiry: "2024-02-10" },
      { id: 102, stock: 50, expiry: "2024-02-20" },
    ],
  },
  {
    id: 2,
    name: "Banana",
    batches: [{ id: 201, stock: 50, expiry: "2024-02-05" }],
  },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState(initialProducts);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", stock: "", expiry: "" });
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProductId) {
      setProducts(
        products.map((p) =>
          p.id === editingProductId
            ? {
                ...p,
                batches: [
                  ...p.batches,
                  {
                    id: Date.now(),
                    stock: parseInt(formData.stock),
                    expiry: formData.expiry,
                  },
                ],
              }
            : p
        )
      );
    }
    setShowForm(false);
    setEditingProductId(null);
    setFormData({ name: "", stock: "", expiry: "" });
  };

  const handleEdit = (product: any) => {
    setFormData({ name: product.name, stock: "", expiry: "" });
    setEditingProductId(product.id);
    setShowForm(true);
  };

  return (
    <main className="bg-white min-h-screen py-10 px-2">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 text-green-700">Product & Batch Management</h1>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Add Batch to "{formData.name}"</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">Stock</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiry}
                  onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
              >
                Add Batch
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="bg-gray-50 rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <button
                  onClick={() => handleEdit(product)}
                  className="flex items-center gap-2 text-blue-600 px-3 py-1 rounded hover:bg-blue-50 text-sm"
                >
                  <FaPlus size={14} /> Add Batch
                </button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left bg-gray-100">
                    <th className="p-2">Batch ID</th>
                    <th className="p-2">Stock</th>
                    <th className="p-2">Expiry Date</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {product.batches.map((batch) => (
                    <tr key={batch.id} className="border-b border-gray-100">
                      <td className="p-2">{batch.id}</td>
                      <td className="p-2">{batch.stock}</td>
                      <td className="p-2">{batch.expiry}</td>
                      <td className="p-2">
                        <button className="text-red-600 p-1 hover:bg-red-50 rounded">
                          <FaTrash size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
