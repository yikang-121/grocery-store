"use client";

import React, { useEffect, useState } from "react";
import { FaArrowLeft, FaBalanceScale, FaChartLine, FaLeaf, FaFire, FaBoxes, FaArrowUp, FaArrowDown } from "react-icons/fa";
import Link from "next/link";

interface RestockCalculationResponse {
    skuId: string;
    productName: string;
    category: string;
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
    seasonalityFactor: number;
    maxSellableQty?: number;
    safeTargetStock?: number;
    incomingStock?: number;
    caseSize?: number;
}

interface ProductComparison {
    skuId: string;
    productName: string;
    category: string;
    adaptive: RestockCalculationResponse | null;
    baseline: RestockCalculationResponse | null;
}

// Determine color theme based on category
function getCategoryStyle(category: string | null) {
    const cat = (category || "").toLowerCase();
    if (cat.includes("produce") || cat.includes("fresh") || cat.includes("vegetable") || cat.includes("fruit")) {
        return { color: "emerald", icon: <FaLeaf size={24} className="text-emerald-500" /> };
    }
    if (cat.includes("condiment") || cat.includes("sauce") || cat.includes("spice")) {
        return { color: "rose", icon: <FaFire size={24} className="text-rose-500" /> };
    }
    if (cat.includes("canned") || cat.includes("dry") || cat.includes("grain")) {
        return { color: "indigo", icon: <FaBalanceScale size={24} className="text-indigo-500" /> };
    }
    if (cat.includes("dairy") || cat.includes("bakery") || cat.includes("bread")) {
        return { color: "amber", icon: <FaBoxes size={24} className="text-amber-500" /> };
    }
    if (cat.includes("beverage") || cat.includes("drink")) {
        return { color: "sky", icon: <FaBoxes size={24} className="text-sky-500" /> };
    }
    if (cat.includes("snack")) {
        return { color: "violet", icon: <FaBoxes size={24} className="text-violet-500" /> };
    }
    return { color: "slate", icon: <FaBoxes size={24} className="text-slate-500" /> };
}

export default function RestockSuggestionsPage() {
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [comparisons, setComparisons] = useState<ProductComparison[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [adaptiveRes, baselineRes] = await Promise.all([
                fetch("http://localhost:8080/api/v1/inventory/calculate-restock-all"),
                fetch("http://localhost:8080/api/v1/inventory/calculate-baseline-all")
            ]);

            const adaptiveData: RestockCalculationResponse[] = await adaptiveRes.json();
            const baselineData: RestockCalculationResponse[] = await baselineRes.json();

            // Collect all unique SKU IDs from both results
            const allSkus = new Set<string>();
            adaptiveData.forEach(d => allSkus.add(d.skuId));
            baselineData.forEach(d => allSkus.add(d.skuId));

            const newComparisons: ProductComparison[] = Array.from(allSkus).map(sku => {
                const adaptive = adaptiveData.find(d => d.skuId === sku) || null;
                const baseline = baselineData.find(d => d.skuId === sku) || null;

                const productName = adaptive?.productName || baseline?.productName || sku;
                const category = adaptive?.category || baseline?.category || "";

                return {
                    skuId: sku,
                    productName,
                    category,
                    adaptive,
                    baseline
                };
            });

            // Sort: products with higher adaptive order qty first
            newComparisons.sort((a, b) => (b.adaptive?.orderQuantity || 0) - (a.adaptive?.orderQuantity || 0));

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
                            {comparisons.length > 0 && (
                                <span className="ml-2 text-indigo-600 font-bold">{comparisons.length} products</span>
                            )}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
                        {[1, 2, 3].map(i => <div key={i} className="h-96 bg-white rounded-[2rem] border border-slate-100 shadow-sm"></div>)}
                    </div>
                ) : comparisons.length === 0 ? (
                    <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 shadow-sm">
                        <FaBoxes size={48} className="text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-700 mb-2">No Products Found</h3>
                        <p className="text-slate-500">
                            Click <strong>&quot;Sync Database Metrics&quot;</strong> to import your products, or make sure you have run the seed SQL scripts first.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {comparisons.map((item, i) => (
                            <ComparisonCard key={item.skuId} data={item} />
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

    const { color, icon } = getCategoryStyle(data.category);

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
        },
        amber: {
            bgLight: "bg-amber-50",
            bgSoftVanish: "bg-amber-50/50",
            text: "text-amber-600",
            bgMain: "bg-amber-500",
            shadow: "shadow-amber-200"
        },
        sky: {
            bgLight: "bg-sky-50",
            bgSoftVanish: "bg-sky-50/50",
            text: "text-sky-600",
            bgMain: "bg-sky-500",
            shadow: "shadow-sky-200"
        },
        violet: {
            bgLight: "bg-violet-50",
            bgSoftVanish: "bg-violet-50/50",
            text: "text-violet-600",
            bgMain: "bg-violet-500",
            shadow: "shadow-violet-200"
        },
        slate: {
            bgLight: "bg-slate-50",
            bgSoftVanish: "bg-slate-50/50",
            text: "text-slate-600",
            bgMain: "bg-slate-500",
            shadow: "shadow-slate-200"
        }
    };

    const styles = colorClasses[color] || colorClasses.slate;

    const diff = adaptiveQty - baselineQty;
    const momentum = data.adaptive?.momentum || 0;
    const decayFactor = data.adaptive?.decayFactor || 1;

    // Determine insight badge
    let insightType: "waste-prevented" | "stockout-prevented" | "stable" = "stable";
    if (data.adaptive?.safeTargetStock && data.adaptive.targetStock > data.adaptive.safeTargetStock) {
        insightType = "waste-prevented";
    } else if (diff > 0 && momentum > 0.3) {
        insightType = "stockout-prevented";
    }

    return (
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col relative overflow-hidden">
            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full ${styles.bgSoftVanish} blur-2xl pointer-events-none`}></div>

            <div className="flex items-center gap-4 mb-3">
                <div className={`w-12 h-12 rounded-2xl ${styles.bgLight} flex items-center justify-center ${styles.text}`}>
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="font-black text-slate-800 text-lg leading-tight truncate">{data.productName}</h3>
                    <p className="text-xs font-bold font-mono text-slate-400 mt-0.5">{data.skuId}</p>
                </div>
            </div>

            <p className="text-sm font-medium text-slate-500 mb-8 border-b border-slate-100 pb-6">
                {data.category || "Uncategorized"}
            </p>

            <div className="grid grid-cols-2 gap-4 flex-1 mb-6">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Static Baseline</span>
                    <span className="text-3xl font-black text-slate-700">{baselineQty}</span>
                    <span className="text-xs font-bold text-slate-500 mt-1">units</span>
                </div>

                <div className={`${styles.bgMain} rounded-2xl p-4 flex flex-col items-center justify-center text-center text-white shadow-lg ${styles.shadow} relative overflow-hidden`}>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-2">Adaptive Algo</span>
                    <span className="text-3xl font-black">{adaptiveQty}</span>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs font-bold text-white/80">units</span>
                        {diff !== 0 && (
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded bg-white/20 flex items-center gap-0.5`}>
                                {diff > 0 ? <FaArrowUp size={8} /> : <FaArrowDown size={8} />}
                                {Math.abs(Math.round((diff / (baselineQty || 1)) * 100))}%
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Visual Comparison Bar */}
            <div className="mb-8 space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                    <span>Rel. Scale</span>
                    <span className={styles.text}>{diff > 0 ? "Increased Ordering" : diff < 0 ? "Ordering Efficiency" : "Parity"}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex relative">
                    {/* Baseline segment (always represented as a grey background fill if we want to show relative) */}
                    {/* But more intuitive: Two bars starting from left */}
                    <div 
                        className="h-full bg-slate-300 rounded-full absolute top-0 left-0 transition-all duration-700 opacity-40" 
                        style={{ width: `${Math.min(100, (baselineQty / (Math.max(baselineQty, adaptiveQty) || 1)) * 100)}%` }}
                    ></div>
                    <div 
                        className={`h-full ${styles.bgMain} rounded-full absolute top-0 left-0 transition-all duration-1000`} 
                        style={{ width: `${Math.min(100, (adaptiveQty / (Math.max(baselineQty, adaptiveQty) || 1)) * 100)}%` }}
                    ></div>
                </div>
            </div>

            {/* Insight Badge */}
            <div className="mt-auto">
                {insightType === "waste-prevented" && (
                    <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 border border-emerald-100">
                        <span className="bg-emerald-200/50 p-2 rounded-lg">🛡️</span>
                        Spoilage Prevented! Target stock was capped at {data.adaptive?.maxSellableQty?.toFixed(1)} units to avoid expiration.
                    </div>
                )}
                {insightType === "stockout-prevented" && (
                    <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 border border-rose-100">
                        <span className="bg-rose-200/50 p-2 rounded-lg">🚀</span>
                        Stockout Prevented! Ordered {diff} more units due to {momentum.toFixed(2)}x Momentum.
                    </div>
                )}
                {insightType === "stable" && (
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
                        <span className="block text-[10px] font-black text-slate-400 tracking-widest uppercase">Spoilage Cap</span>
                        <span className="font-mono text-slate-800 font-bold">{data.adaptive?.maxSellableQty?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] font-black text-slate-400 tracking-widest uppercase">Momentum (M)</span>
                        <span className="font-mono text-slate-800 font-bold">{data.adaptive?.momentum.toFixed(2)}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] font-black text-slate-400 tracking-widest uppercase">Safety Stock</span>
                        <span className="font-mono text-slate-800 font-bold">{data.adaptive?.safetyStock.toFixed(1)}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] font-black text-slate-400 tracking-widest uppercase">Target Stock</span>
                        <span className="font-mono text-slate-800 font-bold">{data.adaptive?.targetStock.toFixed(1)}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] font-black text-slate-400 tracking-widest uppercase">Decay Factor</span>
                        <span className="font-mono text-slate-800 font-bold">{data.adaptive?.decayFactor.toFixed(3)}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] font-black text-slate-400 tracking-widest uppercase">Net Requirement</span>
                        <span className="font-mono text-slate-800 font-bold">{data.adaptive?.netRequirement.toFixed(1)}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] font-black text-slate-400 tracking-widest uppercase">Dynamic Z</span>
                        <span className="font-mono text-slate-800 font-bold">{data.adaptive?.dynamicZ.toFixed(2)}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] font-black text-slate-400 tracking-widest uppercase">Seasonality</span>
                        <span className="font-mono text-slate-800 font-bold">{data.adaptive?.seasonalityFactor.toFixed(2)}x</span>
                    </div>
                    <div>
                        <span className="block text-[10px] font-black text-slate-400 tracking-widest uppercase">Pipeline Stock</span>
                        <span className="font-mono text-slate-800 font-bold">{data.adaptive?.incomingStock || 0}</span>
                    </div>
                    <div className="col-span-2 border-t border-slate-50 pt-2 grid grid-cols-2">
                        <div>
                            <span className="block text-[10px] font-black text-slate-400 tracking-widest uppercase">Coeff. Variability</span>
                            <span className="font-mono text-slate-800 font-bold">{data.adaptive?.cv.toFixed(2)}</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-black text-slate-400 tracking-widest uppercase">Case Size</span>
                            <span className="font-mono text-slate-800 font-bold">{data.adaptive?.caseSize || 1}</span>
                        </div>
                    </div>
                </div>
            </details>
        </div>
    );
}
