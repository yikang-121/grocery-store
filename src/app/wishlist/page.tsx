"use client";
import React from "react";
import { FaShoppingCart, FaTrash } from "react-icons/fa";
import { useCart } from "@/components/context/CartContext";

export default function WishlistPage() {
  const { addToCart } = useCart();
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      setLoading(false);
      return;
    }
    const user = JSON.parse(userData);

    fetch(`http://localhost:8080/api/wishlist/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setItems(data);
        } else {
          console.warn("Wishlist fetch returned non-array:", data);
          setItems([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching wishlist:", err);
        setLoading(false);
      });
  }, []);

  const handleRemove = async (productId: number) => {
    const userData = localStorage.getItem("user");
    if (!userData) return;
    const user = JSON.parse(userData);

    try {
      const res = await fetch(`http://localhost:8080/api/wishlist/${user.id}/${productId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setItems(items.filter(it => it.id !== productId));
      }
    } catch (err) {
      console.error("Error removing item:", err);
    }
  };

  return (
    <main className="bg-white min-h-screen py-10 px-2">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 text-green-700">My Wishlist</h1>

         {loading ? (
          <div className="text-center py-10">Loading your wishlist...</div>
        ) : items.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            Your wishlist is empty.
          </div>
        ) : (
          <div className="grid gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-gray-50 rounded-lg shadow p-4 flex items-center gap-4"
              >
                <img
                  src={item.imageUrl || "/placeholder.png"}
                  alt={item.name}
                  className="w-24 h-24 object-contain rounded border"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-gray-600 text-sm mb-2 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                  <div className="font-bold text-green-700">RM{item.price.toFixed(2)}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() =>
                      addToCart({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        image: item.imageUrl || "/placeholder.png",
                      })
                    }
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                  >
                    <FaShoppingCart size={16} />
                    <span>Add to Cart</span>
                  </button>
                  <button 
                    onClick={() => handleRemove(item.id)}
                    className="flex items-center gap-2 text-red-600 px-4 py-2 rounded hover:bg-red-50 transition"
                  >
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