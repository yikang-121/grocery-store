"use client";
import React, { useState } from "react";
import {
    CardElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { FaLock } from "react-icons/fa";

interface StripePaymentFormProps {
    amount: number;
    onSuccess: (paymentIntentId: string) => void;
    onError: (error: string) => void;
}

export default function StripePaymentForm({ amount, onSuccess, onError }: StripePaymentFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) return;

        setLoading(true);

        try {
            // 1. Create PaymentIntent on the backend
            const res = await fetch("http://localhost:8080/api/payments/create-payment-intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount, currency: "myr" }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);
            const { clientSecret } = data;

            // 2. Confirm payment with Stripe
            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement)!,
                },
            });

            if (result.error) {
                onError(result.error.message || "Payment failed");
            } else {
                if (result.paymentIntent.status === "succeeded") {
                    onSuccess(result.paymentIntent.id);
                }
            }
        } catch (err: any) {
            onError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaLock className="text-green-600" size={16} />
                Secure Card Payment
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="p-4 bg-white border border-gray-300 rounded-lg shadow-sm">
                    <CardElement
                        options={{
                            style: {
                                base: {
                                    fontSize: "16px",
                                    color: "#424770",
                                    "::placeholder": { color: "#aab7c4" },
                                },
                                invalid: { color: "#9e2146" },
                            },
                        }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={!stripe || loading}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:bg-gray-400 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                    {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                        `Pay RM ${amount.toFixed(2)} Now`
                    )}
                </button>

                <p className="text-center text-xs text-gray-500">
                    Powered by <strong>Stripe</strong>. Your data is encrypted and never stored on our servers.
                </p>
            </form>
        </div>
    );
}
