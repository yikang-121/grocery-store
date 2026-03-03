"use client";

import React, { useEffect, useState } from "react";
import { FaTrashAlt, FaBoxOpen, FaArrowLeft, FaCalendarAlt, FaFilter, FaSearch } from "react-icons/fa";
import Link from "next/link";

interface SpoilageLog {
  id: number;
  batchId: number;
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  costPrice: number;
  totalLoss: number;
  reason: string;
  createdAt: string;
}

export default function AdminInventoryPage() {
  const [logs, setLogs] = useState<SpoilageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8080/api/admin/restock/spoilage");
      if (!res.ok) throw new Error("Failed to fetch logs");
      setLogs(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log =>
    log.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (val: number) => `RM ${Number(val || 0).toFixed(2)}`;
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-MY", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Link href="/admin/reports" className="text-sm text-gray-500 hover:text-green-600 flex items-center gap-1 mb-2">
              <FaArrowLeft size={10} /> Back to Reports
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Spoilage Logs</h1>
            <p className="text-gray-500 mt-1">Audit trail of all stock deductions due to spoilage or expiry</p>
          </div>

          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search by product, SKU or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none shadow-sm text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse"></div>)}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Batch</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Qty</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Unit Cost</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Total Loss</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-center">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center text-gray-400">
                      <FaBoxOpen size={40} className="mx-auto mb-3 opacity-20" />
                      No spoilage logs found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap text-center">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-left">
                        <div className="font-semibold text-gray-900 text-sm">{log.productName || "Unknown Product"}</div>
                        <div className="text-xs text-gray-400 font-mono">{log.sku}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono text-center">
                        #{log.batchId}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-red-600 text-center">
                        -{log.quantity}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 text-right">
                        {formatCurrency(log.costPrice)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                        {formatCurrency(log.totalLoss)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${log.reason === 'EXPIRED' ? 'bg-orange-100 text-orange-700' :
                            log.reason === 'DAMAGED' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-600'
                          }`}>
                          {log.reason}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}