"use client";
import React from "react";
import { FaStar, FaGift, FaShoppingBag, FaHistory } from "react-icons/fa";
import { API_BASE } from '@/utils/apiBase';

const earnPoints = [
  {
    icon: <FaShoppingBag size={24} className="text-green-600" />,
    title: "Shop & Earn",
    description: "Earn 1 point for every $1 spent",
  },
  {
    icon: <FaGift size={24} className="text-green-600" />,
    title: "Special Promotions",
    description: "Earn bonus points during special events",
  },
];

export default function PointsPage() {
  const [balance, setBalance] = React.useState(0);
  const [history, setHistory] = React.useState<any[]>([]);
  const [vouchers, setVouchers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [redeeming, setRedeeming] = React.useState(false);
  const [userId, setUserId] = React.useState<number | null>(null);

  React.useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      setLoading(false);
      return;
    }
    const user = JSON.parse(userData);
    setUserId(user.id);

    // Fetch balance
    fetch(`${API_BASE}/api/points/balance/${user.id}`)
      .then(res => res.json())
      .then(data => setBalance(data.balance || 0))
      .catch(err => console.error("Error fetching points:", err));

    // Fetch active vouchers
    fetch(`${API_BASE}/api/vouchers/my-vouchers?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setVouchers(data);
      })
      .catch(err => console.error("Error fetching vouchers:", err));

    // Fetch history
    fetch(`${API_BASE}/api/points/history/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setHistory(data);
        } else {
          console.warn("Points history fetch returned non-array:", data);
          setHistory([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching history:", err);
        setLoading(false);
      });
  }, []);

  const handleRedeem = async (tier: string, points: number) => {
    if (balance < points) {
      alert("Insufficient points balance!");
      return;
    }
    if (!userId) return;

    setRedeeming(true);
    try {
      const res = await fetch(`${API_BASE}/api/vouchers/redeem?userId=${userId}&tier=${tier}`, {
        method: "POST"
      });
      if (res.ok) {
        const newVoucher = await res.json();
        alert(`Success! You got a ${tier} voucher: ${newVoucher.code}`);
        // Refresh data
        window.location.reload();
      } else {
        alert("Redemption failed. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("Error during redemption.");
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <main className="bg-white min-h-screen py-10 px-2">
      <div className="max-w-3xl mx-auto">
        {/* Points Balance */}
        <div className="bg-green-50 rounded-lg shadow p-6 mb-8 text-center">
          <FaStar size={48} className="text-green-600 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-green-700 mb-2">My Extra Points</h1>
          <div className="text-4xl font-bold text-green-800">{balance}</div>
          <div className="text-gray-600 mt-1">Available Points</div>
        </div>

        {/* How to Earn Points */}
        <h2 className="text-xl font-bold mb-4 text-green-700">How to Earn Points</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {earnPoints.map((item, index) => (
            <div key={index} className="bg-gray-50 rounded-lg shadow p-4 flex gap-4">
              {item.icon}
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Redeem for Vouchers */}
        <h2 className="text-xl font-bold mb-4 text-green-700">Redeem for Vouchers</h2>
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            { tier: "RM5", points: 500, label: "RM 5.00" },
            { tier: "RM10", points: 1000, label: "RM 10.00" },
            { tier: "RM25", points: 2000, label: "RM 25.00" },
          ].map((v) => (
            <div key={v.tier} className="bg-white border-2 border-green-200 rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="text-2xl font-black text-green-600 mb-1">{v.label}</div>
              <div className="text-xs text-gray-500 mb-3">{v.points} Points</div>
              <button
                onClick={() => handleRedeem(v.tier, v.points)}
                disabled={balance < v.points || redeeming}
                className={`w-full py-2 rounded-lg text-sm font-bold transition-colors ${
                  balance >= v.points 
                    ? "bg-green-600 text-white hover:bg-green-700" 
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {redeeming ? "..." : "Redeem"}
              </button>
            </div>
          ))}
        </div>

        {/* My Vouchers */}
        {vouchers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-green-700 flex items-center gap-2">
              <FaGift className="text-orange-500" />
              My Available Vouchers
            </h2>
            <div className="space-y-3">
              {vouchers.map((v) => (
                <div key={v.id} className="bg-gradient-to-r from-orange-50 to-white border-l-4 border-orange-400 p-4 rounded-r-lg shadow-sm flex justify-between items-center">
                  <div>
                    <div className="font-bold text-gray-800">RM {v.discountAmount.toFixed(2)} Voucher</div>
                    <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mt-1">Code: {v.code}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400 uppercase font-bold">Expires</div>
                    <div className="text-xs text-orange-600 font-medium">{new Date(v.expiryAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Points History */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FaHistory size={20} className="text-green-600" />
            <h2 className="text-xl font-bold text-green-700">Points History</h2>
          </div>
          <div className="bg-gray-50 rounded-lg shadow divide-y">
            {loading ? (
              <div className="p-10 text-center text-gray-500">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="p-10 text-center text-gray-500">No points history yet.</div>
            ) : history.map((transaction) => (
              <div key={transaction.id} className="p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-800">{transaction.description}</div>
                  <div className="text-sm text-gray-500">
                    {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : ""}
                  </div>
                </div>
                <div
                  className={`font-bold ${
                    transaction.type === "EARNED"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {transaction.type === "EARNED" ? "+" : "-"}
                  {transaction.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
} 