"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
import { API_BASE } from '@/utils/apiBase';
  FaArrowLeft, FaArrowUp, FaArrowDown, FaExchangeAlt, FaSearch,
  FaFilter, FaWarehouse, FaBoxOpen,
} from "react-icons/fa";

const API = `${API_BASE}/api/admin/accounting`;

interface StockMovement {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  batchId: number | null;
  movementType: string;
  quantity: number;
  referenceType: string;
  referenceId: number | null;
  notes: string;
  createdAt: string;
}

interface Summary {
  totalIn: number;
  totalOut: number;
  netChange: number;
  totalMovements: number;
}

const MOVEMENT_TYPES = [
  { value: "", label: "All Types" },
  { value: "STOCK_IN", label: "Stock In" },
  { value: "ORDER_DEDUCT", label: "Order Deduct" },
  { value: "SPOILAGE", label: "Spoilage" },
  { value: "RESTOCK", label: "Restock" },
  { value: "CANCEL_RETURN", label: "Cancel Return" },
];

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set("type", typeFilter);
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);

      const [movRes, sumRes] = await Promise.all([
        fetch(`${API}/stock-movements?${params}`),
        fetch(`${API}/stock-movements/summary?${params}`),
      ]);
      if (movRes.ok) setMovements(await movRes.json());
      if (sumRes.ok) setSummary(await sumRes.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchMovements(); }, [typeFilter, fromDate, toDate]);

  const filteredMovements = movements.filter(m =>
    (m.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     m.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     m.notes?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isInbound = (type: string) =>
    ["STOCK_IN", "RESTOCK", "CANCEL_RETURN"].includes(type);

  const typeStyle = (type: string): { bg: string; icon: React.ReactNode } => {
    switch (type) {
      case "STOCK_IN":
        return { bg: "bg-green-100 text-green-700", icon: <FaArrowUp /> };
      case "RESTOCK":
        return { bg: "bg-emerald-100 text-emerald-700", icon: <FaArrowUp /> };
      case "CANCEL_RETURN":
        return { bg: "bg-blue-100 text-blue-700", icon: <FaArrowUp /> };
      case "ORDER_DEDUCT":
        return { bg: "bg-red-100 text-red-700", icon: <FaArrowDown /> };
      case "SPOILAGE":
        return { bg: "bg-orange-100 text-orange-700", icon: <FaArrowDown /> };
      default:
        return { bg: "bg-gray-100 text-gray-600", icon: <FaExchangeAlt /> };
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-MY", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-sm text-gray-500 hover:text-green-600 flex items-center gap-1 mb-2">
            <FaArrowLeft size={10} /> Back to Admin
          </Link>
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-4 rounded-2xl shadow-lg shadow-violet-200">
              <FaExchangeAlt size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-gray-900">Stock Movements</h1>
              <p className="text-gray-500 mt-0.5">Track every stock in and out event</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <FaArrowUp className="text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{summary.totalIn}</div>
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-0.5">Total In</div>
                </div>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <FaArrowDown className="text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-600">{summary.totalOut}</div>
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-0.5">Total Out</div>
                </div>
              </div>
            </div>
            <div className={`${summary.netChange >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-orange-50 border-orange-200"} border rounded-xl p-5`}>
              <div className="flex items-center gap-3">
                <FaExchangeAlt className={summary.netChange >= 0 ? "text-emerald-600" : "text-orange-600"} />
                <div>
                  <div className={`text-2xl font-bold ${summary.netChange >= 0 ? "text-emerald-600" : "text-orange-600"}`}>
                    {summary.netChange >= 0 ? "+" : ""}{summary.netChange}
                  </div>
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-0.5">Net Change</div>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <FaWarehouse className="text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">{summary.totalMovements}</div>
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-0.5">Total Events</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
            <input
              type="text"
              placeholder="Search product, SKU, notes..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 min-w-[150px]">
            {MOVEMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50" />
          <span className="text-gray-400 text-sm">to</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50" />
        </div>

        {/* Movements Table */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-gray-200 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Qty</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Reference</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                      <FaBoxOpen size={40} className="mx-auto mb-3 opacity-20" />
                      No stock movements found.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map(m => {
                    const style = typeStyle(m.movementType);
                    const inbound = isInbound(m.movementType);
                    return (
                      <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 text-sm text-gray-500 whitespace-nowrap text-center">
                          {formatDate(m.createdAt)}
                        </td>
                        <td className="px-6 py-3">
                          <div className="font-semibold text-gray-900 text-sm">{m.productName || "—"}</div>
                          <div className="text-xs text-gray-400 font-mono">{m.sku}</div>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${style.bg}`}>
                            {style.icon} {m.movementType.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className={`font-bold text-sm ${inbound ? "text-green-600" : "text-red-600"}`}>
                            {inbound ? "+" : "-"}{m.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500">
                          {m.referenceType && (
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">
                              {m.referenceType}{m.referenceId ? ` #${m.referenceId}` : ""}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500 max-w-[200px] truncate">
                          {m.notes}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
