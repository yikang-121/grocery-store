"use client";
import React from "react";
import { FaStar, FaGift, FaShoppingBag, FaHistory } from "react-icons/fa";

// Mock points data
const pointsData = {
  balance: 120,
  history: [
    {
      id: 1,
      date: "2024-01-20",
      description: "Purchase at VGrocery",
      points: 15,
      type: "earned",
    },
    {
      id: 2,
      date: "2024-01-15",
      description: "Welcome Bonus",
      points: 100,
      type: "earned",
    },
    {
      id: 3,
      date: "2024-01-10",
      description: "Redeem Discount",
      points: -50,
      type: "spent",
    },
  ],
};

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
  return (
    <main className="bg-white min-h-screen py-10 px-2">
      <div className="max-w-3xl mx-auto">
        {/* Points Balance */}
        <div className="bg-green-50 rounded-lg shadow p-6 mb-8 text-center">
          <FaStar size={48} className="text-green-600 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-green-700 mb-2">My Extra Points</h1>
          <div className="text-4xl font-bold text-green-800">{pointsData.balance}</div>
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

        {/* Points History */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FaHistory size={20} className="text-green-600" />
            <h2 className="text-xl font-bold text-green-700">Points History</h2>
          </div>
          <div className="bg-gray-50 rounded-lg shadow divide-y">
            {pointsData.history.map((transaction) => (
              <div key={transaction.id} className="p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium">{transaction.description}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(transaction.date).toLocaleDateString()}
                  </div>
                </div>
                <div
                  className={`font-bold ${
                    transaction.type === "earned"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {transaction.type === "earned" ? "+" : "-"}
                  {transaction.points}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
} 