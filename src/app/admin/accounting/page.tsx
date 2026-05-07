"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FaArrowLeft, FaFileInvoiceDollar, FaChartPie, FaTruck,
  FaCheckCircle, FaTimesCircle, FaClock, FaPlus, FaBoxOpen,
  FaMoneyBillWave, FaReceipt, FaWarehouse, FaDownload,
  FaArrowUp, FaArrowDown, FaBrain, FaLeaf
} from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";

const API = "http://localhost:8080/api/admin/accounting";

interface AccountingSummary {
  year: number;
  month: number;
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  sstTaxCollected: number;
  spoilageLoss: number;
  purchaseCost: number;
  netProfit: number;
  ordersCount: number;
  itemsSoldCount: number;
  spoilageCount: number;
  purchaseOrdersCount: number;
  currentStockValue: number;
  revenueTrend?: number;
  profitTrend?: number;
  spoilageTrend?: number;
  wastePreventedCost?: number;
  stockoutsAvoided?: number;
  forecastAccuracy?: number;
  weeklyPerformance?: { week: string; revenue: number; cost: number; spoilage: number }[];
}

interface PurchaseOrderItem {
  id: number;
  productId: number;
  sku: string;
  productName: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  lineTotal: number;
}

interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplierName: string;
  status: string;
  totalCost: number;
  taxAmount: number;
  notes: string;
  createdAt: string;
  approvedAt: string;
  receivedAt: string;
  items: PurchaseOrderItem[];
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function AccountingPage() {
  const [tab, setTab] = useState<"pnl" | "invoices" | "po">("pnl");
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState<AccountingSummary | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [poLoading, setPoLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [expandedPo, setExpandedPo] = useState<number | null>(null);

  // Invoice state
  const [invoiceOrderNo, setInvoiceOrderNo] = useState("");
  const [invoice, setInvoice] = useState<any>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");

  const fmt = (val: number) => `RM ${Number(val || 0).toFixed(2)}`;

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/summary?year=${year}&month=${month}`);
      if (res.ok) setSummary(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchPOs = async () => {
    setPoLoading(true);
    try {
      const res = await fetch(`${API}/purchase-orders`);
      if (res.ok) setPurchaseOrders(await res.json());
    } catch (e) { console.error(e); }
    setPoLoading(false);
  };

  useEffect(() => { fetchSummary(); }, [year, month]);
  useEffect(() => { if (tab === "po") fetchPOs(); }, [tab]);

  const autoGenerate = async () => {
    setPoLoading(true);
    try {
      const res = await fetch(`${API}/purchase-orders/auto-generate`, { method: "POST" });
      if (res.ok) { await fetchPOs(); }
    } catch (e) { console.error(e); }
    setPoLoading(false);
  };

  const approvePO = async (id: number) => {
    setActionLoading(id);
    try {
      await fetch(`${API}/purchase-orders/${id}/approve`, { method: "POST" });
      await fetchPOs();
    } catch (e) { console.error(e); }
    setActionLoading(null);
  };

  const receivePO = async (id: number) => {
    setActionLoading(id);
    try {
      await fetch(`${API}/purchase-orders/${id}/receive`, { method: "POST" });
      await fetchPOs();
    } catch (e) { console.error(e); }
    setActionLoading(null);
  };

  const downloadPOCSV = async (id: number, poNumber: string) => {
    try {
      const res = await fetch(`${API}/purchase-orders/${id}/export-csv`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PO_Export_${poNumber}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download error:", e);
      alert("Failed to export PO CSV");
    }
  };

  const lookupInvoice = async () => {
    if (!invoiceOrderNo.trim()) return;
    setInvoiceLoading(true);
    setInvoiceError("");
    setInvoice(null);
    try {
      const res = await fetch(`${API}/invoice/${invoiceOrderNo.trim()}`);
      if (!res.ok) throw new Error("Not found");
      setInvoice(await res.json());
    } catch { setInvoiceError("Invoice not found. Check the order number."); }
    setInvoiceLoading(false);
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING_APPROVAL: "bg-yellow-100 text-yellow-700",
      APPROVED: "bg-blue-100 text-blue-700",
      RECEIVED: "bg-green-100 text-green-700",
      CANCELLED: "bg-red-100 text-red-700",
    };
    return (
      <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${styles[status] || "bg-gray-100 text-gray-600"}`}>
        {status.replace("_", " ")}
      </span>
    );
  };

  const tabs = [
    { key: "pnl", label: "Profit & Loss", icon: <FaChartPie /> },
    { key: "invoices", label: "Invoices", icon: <FaFileInvoiceDollar /> },
    { key: "po", label: "Purchase Orders", icon: <FaTruck /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-sm text-gray-500 hover:text-green-600 flex items-center gap-1 mb-2">
            <FaArrowLeft size={10} /> Back to Admin
          </Link>
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-2xl shadow-lg shadow-emerald-200">
              <FaMoneyBillWave size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-gray-900">Accounting</h1>
              <p className="text-gray-500 mt-0.5">Profit & Loss, Invoices, Purchase Orders</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white border border-gray-200 rounded-xl p-1.5">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tab === t.key
                  ? "bg-emerald-500 text-white shadow-md"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ===== PROFIT & LOSS TAB ===== */}
        {tab === "pnl" && (
          <div>
            {/* Month selector + Export buttons */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <select value={month} onChange={e => setMonth(+e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <select value={year} onChange={e => setYear(+e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {/* Export Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`http://localhost:8080/api/admin/reports/export/csv?year=${year}&month=${month}`);
                      if (!res.ok) throw new Error("Export failed");
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `Financial_Report_${MONTHS[month - 1]}_${year}.csv`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    } catch (e) {
                      console.error(e);
                      alert("Failed to export CSV report.");
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                >
                  <FaDownload size={12} /> Export CSV
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`http://localhost:8080/api/admin/reports/export/pdf?year=${year}&month=${month}`);
                      if (!res.ok) throw new Error("Export failed");
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `Financial_Report_${MONTHS[month - 1]}_${year}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    } catch (e) {
                      console.error(e);
                      alert("Failed to export PDF report.");
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200"
                >
                  <FaDownload size={12} /> Export PDF
                </button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse" />)}
              </div>
            ) : summary && (
              <>
                 {/* Algorithm Impact Hero */}
                {summary.wastePreventedCost !== undefined && (
                  <div className="bg-gradient-to-r from-blue-900 to-indigo-800 rounded-2xl shadow-xl p-6 mb-6 text-white flex flex-col md:flex-row items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                        <FaBrain className="text-blue-300" />
                        Predictive Algorithm Performance
                      </h2>
                      <p className="text-blue-200 text-sm max-w-xl">
                        Your custom inventory optimization algorithm is actively minimizing waste and preventing stockouts compared to the baseline manual process.
                      </p>
                    </div>
                    <div className="flex gap-6 mt-4 md:mt-0">
                      <div className="text-center">
                        <div className="text-3xl font-black text-green-400">RM {summary.wastePreventedCost?.toFixed(2)}</div>
                        <div className="text-xs uppercase tracking-wider text-blue-200 mt-1 flex items-center gap-1">
                          <FaLeaf /> Est. Waste Prevented
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-black text-blue-300">{summary.forecastAccuracy?.toFixed(1)}%</div>
                        <div className="text-xs uppercase tracking-wider text-blue-200 mt-1">
                          Forecast Accuracy
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Card label="Total Revenue" value={fmt(summary.totalRevenue)} sub={`${summary.ordersCount} orders`} color="text-green-600" bg="bg-green-50 border-green-200" icon={<FaMoneyBillWave />} trend={summary.revenueTrend} />
                  <Card label="Cost of Goods Sold" value={fmt(summary.totalCOGS)} sub={`${summary.itemsSoldCount} items sold`} color="text-orange-600" bg="bg-orange-50 border-orange-200" icon={<FaBoxOpen />} />
                  <Card label="Gross Profit" value={fmt(summary.grossProfit)} sub="Revenue − COGS" color="text-blue-600" bg="bg-blue-50 border-blue-200" icon={<FaChartPie />} />
                  <Card label="SST Tax (6%)" value={fmt(summary.sstTaxCollected)} sub="Collected on sales" color="text-purple-600" bg="bg-purple-50 border-purple-200" icon={<FaReceipt />} />
                  <Card label="Spoilage Loss" value={fmt(summary.spoilageLoss)} sub={`${summary.spoilageCount} events`} color="text-red-700" bg="bg-red-50 border-red-300 shadow-sm" icon={<FaTimesCircle />} trend={summary.spoilageTrend} invertTrend />
                  <Card label="Purchase Cost" value={fmt(summary.purchaseCost)} sub={`${summary.purchaseOrdersCount} POs received`} color="text-amber-600" bg="bg-amber-50 border-amber-200" icon={<FaTruck />} />
                  <Card label="Net Profit" value={fmt(summary.netProfit)} sub="Gross − Spoilage" color={summary.netProfit >= 0 ? "text-emerald-700" : "text-red-700"} bg={summary.netProfit >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"} icon={<FaCheckCircle />} trend={summary.profitTrend} />
                  <Card label="Stock Value" value={fmt(summary.currentStockValue)} sub="At cost price" color="text-teal-600" bg="bg-teal-50 border-teal-200" icon={<FaWarehouse />} />
                </div>

                {/* Weekly Performance Visualizations */}
                {summary.weeklyPerformance && summary.weeklyPerformance.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 mb-6">Revenue vs Expenses — {MONTHS[summary.month - 1]} {summary.year}</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={summary.weeklyPerformance} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} tickFormatter={(value) => `RM ${value}`} />
                          <RechartsTooltip 
                            cursor={{fill: '#F3F4F6'}}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            formatter={(value: number) => [`RM ${value.toFixed(2)}`, '']}
                          />
                          <Legend wrapperStyle={{ paddingTop: '20px' }} />
                          <Bar dataKey="revenue" name="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                          <Bar dataKey="cost" name="Expenses (COGS + POs)" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={50} />
                          <Bar dataKey="spoilage" name="Spoilage Loss" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ===== INVOICES TAB ===== */}
        {tab === "invoices" && (
          <div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-4">Look Up Invoice</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter Order No (e.g. A1B2C3D4E5F6G7H8)"
                  value={invoiceOrderNo}
                  onChange={e => setInvoiceOrderNo(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && lookupInvoice()}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button onClick={lookupInvoice} disabled={invoiceLoading}
                  className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold text-sm hover:bg-emerald-600 transition disabled:opacity-50">
                  {invoiceLoading ? "Loading..." : "Look Up"}
                </button>
              </div>
              {invoiceError && <p className="text-red-500 text-sm mt-3">{invoiceError}</p>}
            </div>

            {invoice && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b bg-gradient-to-r from-emerald-50 to-teal-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">Invoice</div>
                      <div className="text-xl font-black text-gray-900 mt-1">{invoice.invoiceNo}</div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>{invoice.date ? new Date(invoice.date).toLocaleDateString("en-MY") : ""}</div>
                      <div className="mt-1">{statusBadge(invoice.status)}</div>
                    </div>
                  </div>
                </div>

                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Item</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">Qty</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Unit Price</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoice.items?.map((it: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">{it.productName}</td>
                        <td className="px-6 py-3 text-sm text-gray-600 text-center">{it.quantity}</td>
                        <td className="px-6 py-3 text-sm text-gray-600 text-right">{fmt(it.unitPrice)}</td>
                        <td className="px-6 py-3 text-sm font-semibold text-gray-900 text-right">{fmt(it.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t px-6 py-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{fmt(invoice.subtotal)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Shipping</span><span>{fmt(invoice.shippingFee)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Discount</span><span>-{fmt(invoice.discount)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">SST ({invoice.sstRate})</span><span>{fmt(invoice.sstAmount)}</span></div>
                  <div className="flex justify-between text-base font-bold border-t pt-3 mt-2"><span>Total (incl. tax)</span><span className="text-emerald-600">{fmt(invoice.totalWithTax)}</span></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== PURCHASE ORDERS TAB ===== */}
        {tab === "po" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900 text-lg">Purchase Orders</h3>
              <button onClick={autoGenerate} disabled={poLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold text-sm hover:bg-emerald-600 transition shadow-md shadow-emerald-200 disabled:opacity-50">
                <FaPlus size={12} /> Auto-Generate from Restock
              </button>
            </div>

            {poLoading && purchaseOrders.length === 0 ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}
              </div>
            ) : purchaseOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border p-16 text-center">
                <FaTruck size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 text-sm">No purchase orders yet. Click &quot;Auto-Generate&quot; to create one.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {purchaseOrders.map(po => (
                  <div key={po.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
                      onClick={() => setExpandedPo(expandedPo === po.id ? null : po.id)}>
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-100 text-blue-600 p-2.5 rounded-xl">
                          <FaTruck size={18} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{po.poNumber}</div>
                          <div className="text-xs text-gray-500">
                            {po.supplierName} · {po.items?.length || 0} items · {po.createdAt ? new Date(po.createdAt).toLocaleDateString("en-MY") : ""}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-gray-900">{fmt(po.totalCost)}</span>
                        {statusBadge(po.status)}
                        {(po.status === "RECEIVED" || po.status === "APPROVED") && (
                          <button onClick={e => { e.stopPropagation(); downloadPOCSV(po.id, po.poNumber); }}
                            title="Export CSV for bulk upload"
                            className="p-1.5 text-gray-400 hover:text-emerald-500 transition-colors">
                            <FaDownload size={14} />
                          </button>
                        )}
                        {po.status === "PENDING_APPROVAL" && (
                          <button onClick={e => { e.stopPropagation(); approvePO(po.id); }}
                            disabled={actionLoading === po.id}
                            className="px-4 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600 transition disabled:opacity-50">
                            {actionLoading === po.id ? "..." : "Approve"}
                          </button>
                        )}
                        {po.status === "APPROVED" && (
                          <button onClick={e => { e.stopPropagation(); receivePO(po.id); }}
                            disabled={actionLoading === po.id}
                            className="px-4 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition disabled:opacity-50">
                            {actionLoading === po.id ? "..." : "Receive Stock"}
                          </button>
                        )}
                      </div>
                    </div>

                    {expandedPo === po.id && po.items && (
                      <div className="border-t">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-6 py-2 text-[10px] font-bold text-gray-500 uppercase">Product</th>
                              <th className="px-6 py-2 text-[10px] font-bold text-gray-500 uppercase text-center">Ordered</th>
                              <th className="px-6 py-2 text-[10px] font-bold text-gray-500 uppercase text-center">Received</th>
                              <th className="px-6 py-2 text-[10px] font-bold text-gray-500 uppercase text-right">Unit Cost</th>
                              <th className="px-6 py-2 text-[10px] font-bold text-gray-500 uppercase text-right">Line Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {po.items.map(item => (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-2.5">
                                  <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                                  <div className="text-xs text-gray-400 font-mono">{item.sku}</div>
                                </td>
                                <td className="px-6 py-2.5 text-sm text-center">{item.quantityOrdered}</td>
                                <td className="px-6 py-2.5 text-sm text-center font-bold text-green-600">{item.quantityReceived}</td>
                                <td className="px-6 py-2.5 text-sm text-right">{fmt(item.unitCost)}</td>
                                <td className="px-6 py-2.5 text-sm font-semibold text-right">{fmt(item.lineTotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* Reusable components */
function Card({ label, value, sub, color, bg, icon, trend, invertTrend }: { label: string; value: string; sub: string; color: string; bg: string; icon: React.ReactNode, trend?: number, invertTrend?: boolean }) {
  const isPositive = trend ? trend >= 0 : true;
  const isGood = invertTrend ? !isPositive : isPositive;
  const trendColor = isGood ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';

  return (
    <div className={`${bg} border rounded-xl p-5 transition-all hover:shadow-md relative overflow-hidden`}>
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg bg-white/50 ${color}`}>{icon}</div>
        {trend !== undefined && (
           <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${trendColor}`}>
             {isPositive ? <FaArrowUp size={8} /> : <FaArrowDown size={8} />}
             {Math.abs(trend).toFixed(1)}% MoM
           </div>
        )}
      </div>
      <div>
        <div className={`text-2xl font-black ${color}`}>{value}</div>
        <div className="text-xs text-gray-600 font-bold uppercase tracking-wide mt-1">{label}</div>
        <div className="text-xs text-gray-500 mt-1">{sub}</div>
      </div>
    </div>
  );
}

function PLRow({ label, value, bold, accent }: { label: string; value: number; bold?: boolean; accent?: boolean }) {
  const isNeg = value < 0;
  return (
    <div className={`px-6 py-3 flex justify-between items-center ${accent ? "bg-emerald-50/50" : ""}`}>
      <span className={`text-sm ${bold ? "font-bold text-gray-900" : "text-gray-600"}`}>{label}</span>
      <span className={`text-sm ${bold ? "font-bold" : ""} ${isNeg ? "text-red-600" : accent ? "text-emerald-600" : "text-gray-900"}`}>
        {isNeg ? "-" : ""}RM {Math.abs(value).toFixed(2)}
      </span>
    </div>
  );
}
