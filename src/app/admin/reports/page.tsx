"use client";

import React, { useEffect, useState } from "react";
import { FaChartBar, FaMoneyBillWave, FaExclamationTriangle, FaCalendarDay, FaArrowLeft, FaFileCsv, FaFilePdf } from "react-icons/fa";
import Link from "next/link";

interface MonthlySummary {
    year: number;
    month: number;
    totalRevenue: number;
    totalSpoilageLoss: number;
    ordersCount: number;
    spoilageCount: number;
}

export default function ReportsPage() {
    const [summary, setSummary] = useState<MonthlySummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(new Date());
    const [downloading, setDownloading] = useState<string | null>(null);

    const fetchSummary = async (y: number, m: number) => {
        try {
            setLoading(true);
            const res = await fetch(`http://localhost:8080/api/admin/reports/monthly-summary?year=${y}&month=${m}`);
            if (!res.ok) throw new Error("Failed to fetch");
            setSummary(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary(date.getFullYear(), date.getMonth() + 1);
    }, [date]);

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
            const res = await fetch(`http://localhost:8080/api/admin/reports/export/${format}?year=${y}&month=${m}`);
            if (!res.ok) throw new Error("Export failed");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;

            const contentDisposition = res.headers.get("Content-Disposition");
            const match = contentDisposition?.match(/filename="?([^"]+)"?/);
            a.download = match ? match[1] : `Financial_Report.${format}`;

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
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Link href="/admin/products" className="text-sm text-gray-500 hover:text-green-600 flex items-center gap-1 mb-2">
                            <FaArrowLeft size={10} /> Back to Products
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Download Buttons */}
                        <button
                            onClick={() => handleDownload("csv")}
                            disabled={downloading !== null || loading}
                            className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FaFileCsv className="text-emerald-600" size={14} />
                            {downloading === "csv" ? "Exporting..." : "Export CSV"}
                        </button>
                        <button
                            onClick={() => handleDownload("pdf")}
                            disabled={downloading !== null || loading}
                            className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FaFilePdf className="text-red-500" size={14} />
                            {downloading === "pdf" ? "Exporting..." : "Export PDF"}
                        </button>

                        <Link
                            href="/admin/inventory"
                            className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition shadow-sm"
                        >
                            <FaExclamationTriangle className="text-red-500" size={14} />
                            Spoilage Logs
                        </Link>

                        <div className="flex items-center bg-white rounded-xl shadow-sm border p-1">
                            <button onClick={() => changeMonth(-1)} className="px-4 py-2 hover:bg-gray-100 rounded-lg transition text-gray-600">&larr;</button>
                            <div className="px-6 font-bold text-gray-900 min-w-[160px] text-center">
                                {date.toLocaleDateString("en-MY", { month: "long", year: "numeric" })}
                            </div>
                            <button onClick={() => changeMonth(1)} className="px-4 py-2 hover:bg-gray-100 rounded-lg transition text-gray-600">&rarr;</button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>)}
                    </div>
                ) : summary ? (
                    <div className="space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                icon={<FaMoneyBillWave className="text-emerald-600" />}
                                label="Total Revenue"
                                value={formatCurrency(summary.totalRevenue)}
                                sub={`${summary.ordersCount} Successful Orders`}
                                color="emerald"
                            />
                            <StatCard
                                icon={<FaExclamationTriangle className="text-red-500" />}
                                label="Spoilage Loss"
                                value={formatCurrency(summary.totalSpoilageLoss)}
                                sub={`${summary.spoilageCount} Loss Events`}
                                color="red"
                            />
                            <StatCard
                                icon={<FaChartBar className="text-blue-600" />}
                                label="Net Performance"
                                value={formatCurrency(summary.totalRevenue - summary.totalSpoilageLoss)}
                                sub="Revenue minus Loss"
                                color="blue"
                            />
                            <StatCard
                                icon={<FaCalendarDay className="text-purple-600" />}
                                label="Loss Ratio"
                                value={summary.totalRevenue > 0 ? `${((summary.totalSpoilageLoss / summary.totalRevenue) * 100).toFixed(1)}%` : "0.0%"}
                                sub="Loss relative to Revenue"
                                color="purple"
                            />
                        </div>

                        {/* Visual Breakdown */}
                        <div className="bg-white rounded-2xl p-8 border shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Profit vs Loss Breakdown</h2>
                            <div className="h-12 w-full bg-gray-100 rounded-full overflow-hidden flex">
                                <div
                                    className="bg-emerald-500 flex items-center justify-center text-white text-xs font-bold transition-all duration-700"
                                    style={{ width: `${Math.max(5, (summary.totalRevenue / (summary.totalRevenue + summary.totalSpoilageLoss || 1)) * 100)}%` }}
                                >
                                    REVENUE
                                </div>
                                <div
                                    className="bg-red-500 flex items-center justify-center text-white text-xs font-bold transition-all duration-700"
                                    style={{ width: `${Math.max(5, (summary.totalSpoilageLoss / (summary.totalRevenue + summary.totalSpoilageLoss || 1)) * 100)}%` }}
                                >
                                    LOSS
                                </div>
                            </div>
                            <div className="mt-4 flex gap-8 justify-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    <span className="text-sm text-gray-500 font-medium">Sales Revenue</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <span className="text-sm text-gray-500 font-medium">Inventory Loss (Spoilage)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl border">
                        <p className="text-gray-500">No data available for this month.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, sub, color }: { icon: any, label: string, value: string, sub: string, color: string }) {
    const bgColors: any = {
        emerald: "bg-emerald-50",
        red: "bg-red-50",
        blue: "bg-blue-50",
        purple: "bg-purple-50"
    };

    return (
        <div className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 ${bgColors[color]} rounded-xl flex items-center justify-center mb-4`}>
                {icon}
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            <p className="text-xs text-gray-400 mt-2">{sub}</p>
        </div>
    );
}
