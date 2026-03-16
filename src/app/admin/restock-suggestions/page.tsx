"use client";

import React, { useEffect, useState } from "react";
import { FaArrowLeft, FaBalanceScale, FaChartLine, FaLeaf, FaFire } from "react-icons/fa";
import Link from "next/link";

interface RestockCalculationResponse {
    skuId: string;
    orderQuantity: number;
    momentum: number;
    cv: number;
    dynamicZ: number;
    safetyStock: number;
    decayFactor: number;
    adjustedDemand: number;
    targetStock: number;
    netRequirement: number;
    rawOrderQty: number;
}

interface ProductComparison {
    skuId: string;
    productName: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    adaptive: RestockCalculationResponse | null;
    baseline: RestockCalculationResponse | null;
}

export default function RestockSuggestionsPage() {
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [comparisons, setComparisons] = useState<ProductComparison[]>([]);

    const INITIAL_SKUS = ["STRAW-001", "SAUCE-001", "BEAN-001"];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch calculations
            const [adaptiveRes, baselineRes] = await Promise.all([
                fetch("http://localhost:8080/api/v1/inventory/calculate-restock", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(INITIAL_SKUS)
                }),
                fetch("http://localhost:8080/api/v1/inventory/calculate-baseline", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(INITIAL_SKUS)
                })
            ]);

            const adaptiveData: RestockCalculationResponse[] = await adaptiveRes.json();
            const baselineData: RestockCalculationResponse[] = await baselineRes.json();

            // Map to our UI structure
            const newComparisons: ProductComparison[] = INITIAL_SKUS.map(sku => {
                const adaptive = adaptiveData.find(d => d.skuId === sku) || null;
                const baseline = baselineData.find(d => d.skuId === sku) || null;
                
                // Determine display properties based on SKU
                let name = sku;
                let desc = "Inventory data from database";
                let icon = <FaChartLine size={24} className="text-slate-400" />;
                let color = "indigo";

                if (sku === "STRAW-001") {
                    name = "Fresh Strawberries";
                    desc = "Short shelf-life. Watch for Decay Factor.";
                    icon = <FaLeaf size={24} className="text-emerald-500" />;
                    color = "emerald";
                } else if (sku === "SAUCE-001") {
                    name = "Viral Hot Sauce";
                    desc = "Trend spike item. Watch for Momentum.";
                    icon = <FaFire size={24} className="text-rose-500" />;
                    color = "rose";
                } else if (sku === "BEAN-001") {
                    name = "Canned Beans";
                    desc = "Stable daily sales item.";
                    icon = <FaBalanceScale size={24} className="text-indigo-500" />;
                    color = "indigo";
                }

                return {
                    skuId: sku,
                    productName: name,
                    description: desc,
                    icon,
                    color,
                    adaptive,
                    baseline
                };
            });

            setComparisons(newComparisons);

        } catch (error) {
            console.error("Failed to fetch calculation data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await fetch("http://localhost:8080/api/v1/inventory/sync-metrics", {
                method: "POST"
            });
            if (res.ok) {
                const updatedCount = await res.json();
                alert(`Successfully synced ${updatedCount} products from your real-time sales history!`);
                await fetchData(); 
            } else {
                alert("Failed to sync. Please ensure backend is running.");
            }
        } catch (error) {
            console.error("Sync error", error);
            alert("Network error while syncing database.");
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fc] p-6 lg:p-10">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <Link href="/admin/products" className="text-sm text-indigo-500 font-medium hover:text-indigo-700 flex items-center gap-1 mb-2 w-fit">
                            <FaArrowLeft size={10} /> Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <FaChartLine className="text-indigo-600" /> Algorithm Evaluation Dashboard
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">
                            Side-by-side comparison of the Adaptive Restocking Algorithm vs. Baseline (Static ROP/EOQ).
                        </p>
                    </div>
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className={`px-6 py-3 rounded-2xl font-bold transition-all duration-300 flex items-center gap-2 shadow-lg ${
                            syncing 
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
                        }`}
                    >
                        <FaBalanceScale className={syncing ? "animate-spin" : ""} />
                        {syncing ? "Syncing Database..." : "Sync Database Metrics"}
                    </button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
                        {[1, 2, 3].map(i => <div key={i} className="h-96 bg-white rounded-[2rem] border border-slate-100 shadow-sm"></div>)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {comparisons.map((item, i) => (
                            <ComparisonCard key={i} data={item} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ComparisonCard({ data }: { data: ProductComparison }) {
    const baselineQty = data.baseline?.orderQuantity || 0;
    const adaptiveQty = data.adaptive?.orderQuantity || 0;

    // Static color classes to ensure Tailwind compiles them correctly
    const colorClasses: Record<string, any> = {
        emerald: {
            bgLight: "bg-emerald-50",
            bgSoftVanish: "bg-emerald-50/50",
            text: "text-emerald-600",
            bgMain: "bg-emerald-500",
            shadow: "shadow-emerald-200"
        },
        rose: {
            bgLight: "bg-rose-50",
            bgSoftVanish: "bg-rose-50/50",
            text: "text-rose-600",
            bgMain: "bg-rose-500",
            shadow: "shadow-rose-200"
        },
        indigo: {
            bgLight: "bg-indigo-50",
            bgSoftVanish: "bg-indigo-50/50",
            text: "text-indigo-600",
            bgMain: "bg-indigo-500",
            shadow: "shadow-indigo-200"
        }
    };

    const styles = colorClasses[data.color] || colorClasses.indigo;

    // Quick math to show difference
    const diff = adaptiveQty - baselineQty;
    const isWastePrevented = diff < 0 && data.skuId === "STRAW-001";
    const isStockoutPrevented = diff > 0 && data.skuId === "SAUCE-001";

    return (
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col relative overflow-hidden">
            {/* Top right decorative circle */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full ${styles.bgSoftVanish} blur-2xl pointer-events-none`}></div>

            <div className="flex items-center gap-4 mb-3">
                <div className={`w-12 h-12 rounded-2xl ${styles.bgLight} flex items-center justify-center ${styles.text}`}>
                    {data.icon}
                </div>
                <div>
                    <h3 className="font-black text-slate-800 text-lg leading-tight">{data.productName}</h3>
                    <p className="text-xs font-bold font-mono text-slate-400 mt-0.5">{data.skuId}</p>
                </div>
            </div>

            <p className="text-sm font-medium text-slate-500 mb-8 border-b border-slate-100 pb-6">
                {data.description}
            </p>

            <div className="grid grid-cols-2 gap-4 flex-1 mb-8">
                {/* Baseline Stat */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Static Baseline</span>
                    <span className="text-3xl font-black text-slate-700">{baselineQty}</span>
                    <span className="text-xs font-bold text-slate-500 mt-1">units</span>
                </div>

                {/* Adaptive Stat */}
                <div className={`${styles.bgMain} rounded-2xl p-4 flex flex-col items-center justify-center text-center text-white shadow-lg ${styles.shadow}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-2">Adaptive Algo</span>
                    <span className="text-3xl font-black">{adaptiveQty}</span>
                    <span className="text-xs font-bold text-white/80 mt-1">units</span>
                </div>
            </div>

            {/* Insight Badge */}
            <div className="mt-auto">
                {isWastePrevented && (
                    <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 border border-emerald-100">
                        <span className="bg-emerald-200/50 p-2 rounded-lg">🛡️</span>
                        Spoilage Prevented! Ordered {Math.abs(diff)} less units than baseline using Decay Factor.
                    </div>
                )}
                {isStockoutPrevented && (
                    <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 border border-rose-100">
                        <span className="bg-rose-200/50 p-2 rounded-lg">🚀</span>
                        Stockout Prevented! Ordered {diff} more units than baseline due to {data.adaptive?.momentum.toFixed(2)}x Momentum.
                    </div>
                )}
                {!isWastePrevented && !isStockoutPrevented && (
                    <div className="bg-slate-50 text-slate-500 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 border border-slate-100">
                        <span className="bg-slate-200/50 p-2 rounded-lg">⚖️</span>
                        Stable scenario. Adaptive ordering roughly matches historical baseline.
                    </div>
                )}
            </div>

            {/* Debug Stats Toggle */}
            <details className="mt-6 group border border-slate-100 rounded-2xl overflow-hidden text-sm cursor-pointer">
                <summary className="p-4 bg-slate-50 font-bold text-slate-600 flex items-center justify-between outline-none">
                    View Internal Metrics
                    <span className="text-[10px] text-indigo-500 font-black">+</span>
                </summary>
                <div className="p-4 bg-white grid grid-cols-2 gap-4 border-t border-slate-100">
                    <div>
                        <span className="block text-[10px] font-black text-slate-400 tracking-widest uppercase">Decay (DF)</span>
                        <span className="font-mono text-slate-800 font-bold">{data.adaptive?.decayFactor.toFixed(3)}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] font-black text-slate-400 tracking-widest uppercase">Momentum (M)</span>
                        <span className="font-mono text-slate-800 font-bold">{data.adaptive?.momentum.toFixed(2)}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] font-black text-slate-400 tracking-widest uppercase">Dynamic Z</span>
                        <span className="font-mono text-slate-800 font-bold">{data.adaptive?.dynamicZ.toFixed(2)}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] font-black text-slate-400 tracking-widest uppercase">Coeff. Variability</span>
                        <span className="font-mono text-slate-800 font-bold">{data.adaptive?.cv.toFixed(2)}</span>
                    </div>
                </div>
            </details>
        </div>
    );
}
