"use client";
import React, { useState } from "react";
import { FaEdit, FaTrash, FaPlus, FaBoxOpen, FaExclamationTriangle, FaHistory } from "react-icons/fa";

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

type SpoilageLog = {
    productName: string;
    batchId: number;
    quantity: number;
    date: string;
};

const getExpiryStatus = (expiryDate: string) => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return { text: "Expired", color: "text-red-600 font-bold" };
  if (diffDays <= 5) return { text: `Expires in ${diffDays} days`, color: "text-orange-600 font-semibold" };
  return { text: `Expires in ${diffDays} days`, color: "text-gray-600" };
};

export default function InventoryPage() {
  const [products, setProducts] = useState(initialProducts);
  const [showForm, setShowForm] = useState(false);
  const [spoilageData, setSpoilageData] = useState({ productId: 0, batchId: 0 });
  const [spoilageLog, setSpoilageLog] = useState<SpoilageLog[]>([]);

  const handleLogSpoilage = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.id === spoilageData.productId);
    const batch = product?.batches.find(b => b.id === spoilageData.batchId);
    if (product && batch && batch.stock > 0) {
      // Set batch stock to 0
      setProducts(
        products.map((p) =>
          p.id === spoilageData.productId
            ? {
                ...p,
                batches: p.batches.map((b) =>
                  b.id === spoilageData.batchId ? { ...b, stock: 0 } : b
                ),
              }
            : p
        )
      );
      // Add to spoilage log
      const newLog: SpoilageLog = {
        productName: product.name,
        batchId: batch.id,
        quantity: batch.stock,
        date: new Date().toISOString(),
      };
      setSpoilageLog([newLog, ...spoilageLog]);
    }
    setShowForm(false);
    setSpoilageData({ productId: 0, batchId: 0 });
  };

  return (
    <main className="bg-white min-h-screen py-10 px-2">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 text-green-700">Inventory & Spoilage</h1>

        {showForm && (
          <form onSubmit={handleLogSpoilage} className="bg-gray-50 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Log Spoilage</h2>
            <div className="mb-4 text-gray-700">
              This will mark the entire batch as spoiled and set its stock to 0.
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="submit"
                className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
              >
                Log Spoilage
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

        <div className="space-y-4 mb-10">
          {products.map((product) => (
            <div key={product.id} className="bg-gray-50 rounded-lg shadow p-4">
              <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
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
                  {product.batches.map((batch) => {
                    const expiry = getExpiryStatus(batch.expiry);
                    return (
                      <tr key={batch.id} className="border-b border-gray-100">
                        <td className="p-2">{batch.id}</td>
                        <td className="p-2">{batch.stock}</td>
                        <td className={`p-2 ${expiry.color}`}>{expiry.text}</td>
                        <td className="p-2">
                          <button
                            onClick={() => {
                              setSpoilageData({ productId: product.id, batchId: batch.id });
                              setShowForm(true);
                            }}
                            className="flex items-center gap-1 text-red-600 p-1 hover:bg-red-50 rounded"
                          >
                            <FaExclamationTriangle size={14} /> Log Spoilage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
        
        {/* Spoilage Log Section */}
        <div>
            <div className="flex items-center gap-2 mb-4">
                <FaHistory size={20} className="text-green-600" />
                <h2 className="text-xl font-bold text-green-700">Spoilage Log History</h2>
            </div>
            {spoilageLog.length === 0 ? (
                <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-lg shadow">No spoilage logged yet.</div>
            ) : (
                <div className="bg-gray-50 rounded-lg shadow p-4">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left bg-gray-100">
                                <th className="p-2">Product</th>
                                <th className="p-2">Batch ID</th>
                                <th className="p-2">Spoiled Qty</th>
                                <th className="p-2">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {spoilageLog.map((log, index) => (
                                <tr key={index} className="border-b border-gray-100">
                                    <td className="p-2">{log.productName}</td>
                                    <td className="p-2">{log.batchId}</td>
                                    <td className="p-2">{log.quantity}</td>
                                    <td className="p-2">{new Date(log.date).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>
    </main>
  );
} 