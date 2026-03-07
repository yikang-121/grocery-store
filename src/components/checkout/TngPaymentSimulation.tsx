"use client";
import React, { useState, useEffect } from "react";
import { FaQrcode, FaCheckCircle, FaMobileAlt } from "react-icons/fa";

interface TngPaymentSimulationProps {
    amount: number;
    onSuccess: (paymentInfo: string) => void;
}

export default function TngPaymentSimulation({ amount, onSuccess }: TngPaymentSimulationProps) {
    const [step, setStep] = useState<"generate" | "scan" | "processing">("generate");

    const handleGenerate = () => setStep("scan");

    useEffect(() => {
        if (step === "scan") {
            const timer = setTimeout(() => setStep("processing"), 5000); // Simulate user scanning
            return () => clearTimeout(timer);
        }
        if (step === "processing") {
            const timer = setTimeout(() => {
                onSuccess(JSON.stringify({ tngRef: "TNG-" + Math.random().toString(36).substr(2, 9).toUpperCase() }));
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [step, onSuccess]);

    return (
        <div className="bg-blue-50 p-8 rounded-2xl border-2 border-blue-200 text-center">
            {step === "generate" && (
                <div className="space-y-6">
                    <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                        <FaMobileAlt className="text-white" size={40} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-blue-900 mb-2">Touch 'n Go eWallet</h3>
                        <p className="text-blue-700 font-medium">Pay securely using your TNG eWallet app</p>
                    </div>
                    <button
                        onClick={handleGenerate}
                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-md"
                    >
                        Generate QR Code - RM {amount.toFixed(2)}
                    </button>
                </div>
            )}

            {step === "scan" && (
                <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                    <h3 className="text-xl font-bold text-blue-900">Scan to Pay</h3>
                    <div className="bg-white p-4 rounded-2xl shadow-inner inline-block relative border-4 border-blue-600">
                        {/* Simple SVG QR Placeholder */}
                        <svg width="200" height="200" viewBox="0 0 100 100" className="mx-auto">
                            <rect width="100" height="100" fill="white" />
                            <path d="M10,10 h30 v30 h-30 z M60,10 h30 v30 h-30 z M10,60 h30 v30 h-30 z M45,45 h10 v10 h-10 z" fill="#1d4ed8" />
                            <path d="M15,15 h20 v20 h-20 z M65,15 h20 v20 h-20 z M15,65 h20 v20 h-20 z" fill="white" />
                            <path d="M40,10 h10 v5 h5 v5 h-15 z M10,40 h10 v10 h-10 z M60,40 h10 v10 h-10 z M90,40 v10 h-10 v-10 z" fill="#1d4ed8" />
                            <rect x="45" y="10" width="5" height="5" fill="#1d4ed8" />
                            <rect x="55" y="60" width="10" height="10" fill="#1d4ed8" />
                            <rect x="70" y="70" width="20" height="20" fill="#1d4ed8" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[1px]">
                            <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded">VGrocery</div>
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-blue-700 font-bold animate-pulse">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        Waiting for scan...
                    </div>
                    <p className="text-sm text-blue-600/80">Open your TNG app and scan the code above</p>
                </div>
            )}

            {step === "processing" && (
                <div className="space-y-6 py-8">
                    <div className="relative mx-auto w-24 h-24">
                        <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <FaCheckCircle className="text-blue-100" size={40} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-blue-900">Verifying Payment...</h3>
                        <p className="text-blue-600">Please do not close this window</p>
                    </div>
                </div>
            )}
        </div>
    );
}
