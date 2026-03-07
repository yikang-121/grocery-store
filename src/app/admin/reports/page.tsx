"use client";

import React, { useEffect, useState } from "react";
import {
    FaChartBar, FaMoneyBillWave, FaExclamationTriangle, FaCalendarDay,
    FaArrowLeft, FaFileCsv, FaFilePdf, FaBoxes, FaBoxOpen, FaClock,
    FaArrowUp, FaShoppingCart, FaTags, FaHistory
} from "react-icons/fa";
import Link from "next/link";

// Types matching backend DTOs
interface TopStockedProduct {
    productId: number;
    productName: string;
    currentStock: number;
    price: number;
}

interface LowStockProduct {
    productId: number;
    productName: string;
    category: string;
    currentStock: number;
    price: number;
}

interface ExpiringSoonBatch {
    productId: number;
    productName: string;
    batchNo: string;
    availableQuantity: number;
    expiryDate: string;
}

interface StockReport {
    totalProducts: number;
    totalStockQuantity: number;
    lowStockCount: number;
    outOfStockCount: number;
    expiringSoonCount: number;
    topStockedProducts: TopStockedProduct[];
    lowStockProducts: LowStockProduct[];
    expiringSoonBatches: ExpiringSoonBatch[];
}

interface DailySales {
    date: string;
    revenue: number;
    orderCount: number;
}

interface TopProduct {
    productId: number;
    productName: string;
    quantitySold: number;
    revenue: number;
}

interface CategorySales {
    category: string;
    revenue: number;
    quantitySold: number;
    orderCount: number;
}

interface OrderSummary {
    orderNo: string;
    date: string;
    total: number;
    status: string;
    itemCount: number;
}

interface SalesReport {
    totalRevenue: number;
    totalOrders: number;
    totalItemsSold: number;
    avgOrderValue: number;
    dailySales: DailySales[];
    topSellingProducts: TopProduct[];
    categorySales: CategorySales[];
    recentOrders: OrderSummary[];
}

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState<"sales" | "stock">("sales");
    const [stockData, setStockData] = useState<StockReport | null>(null);
    const [salesData, setSalesData] = useState<SalesReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(new Date());
    const [downloading, setDownloading] = useState<string | null>(null);

    const fetchStockReport = async () => {
        try {
            const res = await fetch(`http://localhost:8080/api/admin/reports/stock`);
            if (!res.ok) throw new Error("Failed to fetch stock report");
            setStockData(await res.json());
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSalesReport = async (y: number, m: number) => {
        try {
            const res = await fetch(`http://localhost:8080/api/admin/reports/sales?year=${y}&month=${m}`);
            if (!res.ok) throw new Error("Failed to fetch sales report");
            setSalesData(await res.json());
        } catch (err) {
            console.error(err);
        }
    };

    const loadData = async () => {
        setLoading(true);
        if (activeTab === "stock") {
            await fetchStockReport();
        } else {
            await fetchSalesReport(date.getFullYear(), date.getMonth() + 1);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [activeTab, date]);

    const changeMonth = (offset: number) => {
        const next = new Date(date);
        next.setMonth(next.getMonth() + offset);
        setDate(next);
    };

    const handleDownload = async (format: "csv" | "pdf") => {
        try {
            setDownloading(format);
            const y = date.getFullYear();
            const m = date.getMonth() + 1;

            const endpoint = activeTab === "stock"
                ? `http://localhost:8080/api/admin/reports/export/stock/${format}`
                : `http://localhost:8080/api/admin/reports/export/${format}?year=${y}&month=${m}`;

            const res = await fetch(endpoint);
            if (!res.ok) throw new Error("Export failed");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;

            const contentDisposition = res.headers.get("Content-Disposition");
            const match = contentDisposition?.match(/filename="?([^"]+)"?/);
            const defaultFilename = activeTab === "stock" ? `Stock_Report.${format}` : `Financial_Report.${format}`;
            a.download = match ? match[1] : defaultFilename;

            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            alert("Failed to download report. Please try again.");
        } finally {
            setDownloading(null);
        }
    };

    const formatCurrency = (val: number) => `RM ${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="min-h-screen bg-[#f8f9fc] p-6 lg:p-10">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
                    <div>
                        <Link href="/admin/products" className="text-sm text-indigo-500 font-medium hover:text-indigo-700 flex items-center gap-1 mb-2">
                            <FaArrowLeft size={10} /> Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                            Stock Out & Sales Report
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {activeTab === "sales" && (
                            <div className="flex items-center bg-white rounded-2xl shadow-sm border border-slate-200 p-1 mr-2">
                                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 rounded-xl transition text-slate-400 hover:text-indigo-600">&larr;</button>
                                <div className="px-4 font-bold text-slate-700 min-w-[140px] text-center text-sm">
                                    {date.toLocaleDateString("en-MY", { month: "long", year: "numeric" })}
                                </div>
                                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 rounded-xl transition text-slate-400 hover:text-indigo-600">&rarr;</button>
                            </div>
                        )}

                        <button
                            onClick={() => handleDownload("csv")}
                            disabled={downloading !== null || loading}
                            className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-2.5 rounded-2xl text-sm font-bold text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition shadow-sm disabled:opacity-50"
                        >
                            <FaFileCsv className="text-indigo-500" size={14} />
                            {downloading === "csv" ? "Exporting..." : "Export CSV"}
                        </button>
                        <button
                            onClick={() => handleDownload("pdf")}
                            disabled={downloading !== null || loading}
                            className="flex items-center gap-2 bg-slate-900 border border-slate-900 px-5 py-2.5 rounded-2xl text-sm font-bold text-white hover:bg-slate-800 transition shadow-lg shadow-slate-200 disabled:opacity-50"
                        >
                            <FaFilePdf className="text-indigo-400" size={14} />
                            {downloading === "pdf" ? "Exporting..." : "Export PDF"}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex p-1.5 bg-slate-200/50 rounded-2xl w-fit mb-8">
                    <button
                        onClick={() => setActiveTab("sales")}
                        className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all duration-300 uppercase tracking-wider ${activeTab === 'sales' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Sales Report
                    </button>
                    <button
                        onClick={() => setActiveTab("stock")}
                        className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all duration-300 uppercase tracking-wider ${activeTab === 'stock' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Stock Report
                    </button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-3xl"></div>)}
                        <div className="md:col-span-4 h-96 bg-slate-200 rounded-3xl"></div>
                    </div>
                ) : activeTab === "sales" ? (
                    salesData && <SalesReportContent data={salesData} formatCurrency={formatCurrency} />
                ) : (
                    stockData && <StockReportContent data={stockData} formatCurrency={formatCurrency} />
                )}
            </div>
        </div>
    );
}

function SalesReportContent({ data, formatCurrency }: { data: SalesReport, formatCurrency: (v: number) => string }) {
    return (
        <div className="space-y-8">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Revenue"
                    value={formatCurrency(data.totalRevenue)}
                    sub="Gross earnings this month"
                    icon={<FaMoneyBillWave className="text-white" />}
                    color="bg-indigo-600"
                    glow="shadow-indigo-100"
                />
                <StatCard
                    label="Total Orders"
                    value={data.totalOrders.toString()}
                    sub="Completed transactions"
                    icon={<FaShoppingCart className="text-white" />}
                    color="bg-emerald-500"
                    glow="shadow-emerald-100"
                />
                <StatCard
                    label="Items Sold"
                    value={data.totalItemsSold.toString()}
                    sub="Total quantity distributed"
                    icon={<FaBoxOpen className="text-white" />}
                    color="bg-amber-500"
                    glow="shadow-amber-100"
                />
                <StatCard
                    label="Avg. Order Value"
                    value={formatCurrency(data.avgOrderValue)}
                    sub="Mean spending per customer"
                    icon={<FaTags className="text-white" />}
                    color="bg-indigo-400"
                    glow="shadow-indigo-50"
                />
            </div>

            {/* Daily Trends Chart */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Daily Sales Trends</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
                            <span className="text-xs font-bold text-slate-500 uppercase">Revenue</span>
                        </div>
                    </div>
                </div>

                <div className="h-64 flex items-end gap-2 px-2">
                    {data.dailySales.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold uppercase tracking-widest italic">No Data Available</div>
                    ) : (
                        data.dailySales.map((d, i) => {
                            const maxRev = Math.max(...data.dailySales.map(x => x.revenue)) || 1;
                            const height = (d.revenue / maxRev) * 100;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center group relative">
                                    <div
                                        className="w-full bg-slate-100 rounded-lg group-hover:bg-indigo-600 transition-all duration-500 relative flex items-end"
                                        style={{ height: '100%' }}
                                    >
                                        <div
                                            className="w-full bg-indigo-500 rounded-lg group-hover:bg-indigo-400 transition-all duration-500"
                                            style={{ height: `${height}%` }}
                                        ></div>

                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg whitespace-nowrap z-10 pointer-events-none">
                                            {formatCurrency(d.revenue)}
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 mt-2 rotate-45 origin-left">
                                        {new Date(d.date).getDate()}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Category Sales */}
                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-6">Sales by Category</h3>
                    <div className="space-y-4">
                        {data.categorySales.map((cat, i) => (
                            <div key={i} className="group">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-black text-slate-700 uppercase">{cat.category}</span>
                                    <span className="text-xs font-bold text-indigo-600">{formatCurrency(cat.revenue)}</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 group-hover:bg-indigo-600 transition-all duration-700"
                                        style={{ width: `${(cat.revenue / data.totalRevenue) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Products */}
                <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm overflow-hidden">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-6">Top Selling Products</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qty Sold</th>
                                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {data.topSellingProducts.map((p, i) => (
                                    <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 font-bold text-slate-700 text-sm">{p.productName}</td>
                                        <td className="py-4 text-center">
                                            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-black">{p.quantitySold}</span>
                                        </td>
                                        <td className="py-4 text-right font-black text-slate-900 text-sm">{formatCurrency(p.revenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm overflow-hidden">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-2">
                    <FaHistory className="text-indigo-400" /> Recent Activity
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order No</th>
                                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Items</th>
                                <th className="pb-4 text-[10px) font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.recentOrders.map((o, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 text-sm font-black text-slate-900">#{o.orderNo}</td>
                                    <td className="py-4 text-xs font-bold text-slate-500">{new Date(o.date).toLocaleDateString()}</td>
                                    <td className="py-4 text-center text-xs font-bold text-slate-700">{o.itemCount} Items</td>
                                    <td className="py-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${o.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                            o.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                                            }`}>{o.status}</span>
                                    </td>
                                    <td className="py-4 text-right font-black text-slate-900 text-sm">{formatCurrency(o.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StockReportContent({ data, formatCurrency }: { data: StockReport, formatCurrency: (v: number) => string }) {
    return (
        <div className="space-y-8">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <MiniStatCard label="Total Products" value={data.totalProducts.toString()} color="bg-indigo-600" />
                <MiniStatCard label="Total Stock" value={data.totalStockQuantity.toString()} color="bg-slate-900" />
                <MiniStatCard label="Low Stock" value={data.lowStockCount.toString()} color="bg-amber-500" highlight={data.lowStockCount > 0} />
                <MiniStatCard label="Out of Stock" value={data.outOfStockCount.toString()} color="bg-rose-500" highlight={data.outOfStockCount > 0} />
                <MiniStatCard label="Expiring Soon" value={data.expiringSoonCount.toString()} color="bg-indigo-400" highlight={data.expiringSoonCount > 0} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Top Stocked Products */}
                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-6">Top Stocked Products</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-slate-50">
                                {data.topStockedProducts.map((p, i) => (
                                    <tr key={i}>
                                        <td className="py-3 pr-4">
                                            <div className="text-xs font-black text-slate-900 uppercase">{p.productName}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatCurrency(p.price)}</div>
                                        </td>
                                        <td className="py-3 text-right">
                                            <span className="text-sm font-black text-indigo-600">{p.currentStock}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm overflow-hidden">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-2">
                        <FaExclamationTriangle className="text-amber-500" /> Low Stock Alerts
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Stock</th>
                                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {data.lowStockProducts.length === 0 ? (
                                    <tr><td colSpan={4} className="py-10 text-center text-slate-300 font-bold uppercase tracking-widest">All Stock Levels Healthy</td></tr>
                                ) : (
                                    data.lowStockProducts.map((p, i) => (
                                        <tr key={i}>
                                            <td className="py-4 font-bold text-slate-700 text-sm">{p.productName}</td>
                                            <td className="py-4 text-xs font-black text-slate-400 uppercase tracking-tight">{p.category}</td>
                                            <td className="py-4 text-center">
                                                <span className={`px-2 py-1 rounded-lg text-xs font-black ${p.currentStock === 0 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                                    {p.currentStock}
                                                </span>
                                            </td>
                                            <td className="py-4 text-right font-black text-slate-900 text-sm">{formatCurrency(p.price)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Expiring Soon Table */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm overflow-hidden border-t-4 border-t-indigo-500">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-2">
                    <FaClock className="text-indigo-400" /> Batches Expiring Soon (Next 7 Days)
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch No</th>
                                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Quantity</th>
                                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Expiry Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.expiringSoonBatches.length === 0 ? (
                                <tr><td colSpan={4} className="py-10 text-center text-slate-300 font-bold uppercase tracking-widest">No Batches Expiring Soon</td></tr>
                            ) : (
                                data.expiringSoonBatches.map((b, i) => (
                                    <tr key={i}>
                                        <td className="py-4 font-bold text-slate-700 text-sm">{b.productName}</td>
                                        <td className="py-4 text-xs font-mono text-slate-500">{b.batchNo}</td>
                                        <td className="py-4 text-center">
                                            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-black">{b.availableQuantity}</span>
                                        </td>
                                        <td className="py-4 text-right text-rose-500 font-black text-sm">
                                            {new Date(b.expiryDate).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, sub, icon, color, glow }: { label: string, value: string, sub: string, icon: any, color: string, glow: string }) {
    return (
        <div className={`bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-xl ${glow} transition-all duration-300 hover:scale-[1.02]`}>
            <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                {icon}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <h3 className="text-2xl font-black text-slate-900 mb-1">{value}</h3>
            <p className="text-[10px] font-bold text-slate-400 tracking-tight">{sub}</p>
        </div>
    );
}

function MiniStatCard({ label, value, color, highlight = false }: { label: string, value: string, color: string, highlight?: boolean }) {
    return (
        <div className={`p-6 rounded-3xl transition-all duration-300 ${highlight ? color + ' shadow-lg shadow-indigo-100 scale-[1.03]' : 'bg-white border border-slate-100 shadow-sm'}`}>
            <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${highlight ? 'text-white/70' : 'text-slate-400'}`}>{label}</p>
            <p className={`text-xl font-black ${highlight ? 'text-white' : 'text-slate-800'}`}>{value}</p>
        </div>
    );
}
