"use client";
import React from "react";
import { FaShoppingCart, FaTrash } from "react-icons/fa";
import { useCart } from "@/components/context/CartContext";

// Mock wishlist data
const wishlistItems = [
  {
    id: 1,
    name: "Organic Avocado",
    price: 5.99,
    image: "/vercel.svg",
    description: "Fresh organic avocados, perfect for your healthy lifestyle",
  },
  {
    id: 2,
    name: "Fresh Milk 1L",
    price: 3.99,
    image: "/globe.svg",
    description: "Farm-fresh milk, rich in calcium and vitamins",
  },
];

export default function WishlistPage() {
  const { addToCart } = useCart();

  return (
    <main className="bg-white min-h-screen py-10 px-2">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 text-green-700">My Wishlist</h1>

        {wishlistItems.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            Your wishlist is empty.
          </div>
        ) : (
          <div className="grid gap-6">
            {wishlistItems.map((item) => (
              <div
                key={item.id}
                className="bg-gray-50 rounded-lg shadow p-4 flex items-center gap-4"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-24 h-24 object-contain rounded border"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                  <div className="font-bold text-green-700">${item.price.toFixed(2)}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() =>
                      addToCart({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        image: item.image,
                      })
                    }
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                  >
                    <FaShoppingCart size={16} />
                    <span>Add to Cart</span>
                  </button>
                  <button className="flex items-center gap-2 text-red-600 px-4 py-2 rounded hover:bg-red-50 transition">
                    <FaTrash size={16} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
} 