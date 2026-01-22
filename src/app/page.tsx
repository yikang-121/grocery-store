// src/app/page.tsx

"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FaLeaf, FaEgg, FaCarrot, FaAppleAlt, FaFish, FaCheese, FaShoppingBasket, FaArrowRight, FaTruck, FaClock, FaStar, FaMapMarkerAlt } from "react-icons/fa";
import { useCart } from "@/components/context/CartContext";
import { Product } from "@/types";

const categories = [
  { name: "Fresh Produce", icon: <FaCarrot size={32} className="text-green-600" />, count: "200+ items" },
  { name: "Dairy & Eggs", icon: <FaEgg size={32} className="text-green-600" />, count: "150+ items" },
  { name: "Meat & Seafood", icon: <FaFish size={32} className="text-green-600" />, count: "100+ items" },
  { name: "Bakery", icon: <FaCheese size={32} className="text-green-600" />, count: "80+ items" },
  { name: "Organic", icon: <FaLeaf size={32} className="text-green-600" />, count: "120+ items" },
  { name: "Pantry", icon: <FaAppleAlt size={32} className="text-green-600" />, count: "300+ items" },
];

const benefits = [
  { icon: <FaTruck size={24} className="text-green-600" />, title: "Free Delivery", description: "On orders above RM50" },
  { icon: <FaClock size={24} className="text-green-600" />, title: "Same Day Delivery", description: "Order by 2PM, delivered today" },
  { icon: <FaStar size={24} className="text-green-600" />, title: "Fresh Guarantee", description: "100% fresh or money back" },
  { icon: <FaMapMarkerAlt size={24} className="text-green-600" />, title: "Local Sourcing", description: "Supporting local farmers" },
];


export default function HomePage() {
  const { addToCart } = useCart();
  const [topRated, setTopRated] = useState<Product[]>([]);

  useEffect(() => {
    fetch("http://localhost:8080/api/products/top-rated?limit=4")
      .then((res) => res.json())
      .then((data) => {
        // Ensure data is an array before setting it
        if (Array.isArray(data)) {
          setTopRated(data);
        } else {
          console.warn("API returned non-array data:", data);
          setTopRated([]);
        }
      })
      .catch((err) => {
        console.error("Failed to load top rated products", err);
        setTopRated([]);
      });
  }, []);

  return (
    <div className="bg-white text-black">
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-green-50 via-white to-green-50 py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-6">
            <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide">
              Fresh from Farm to Table
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
            FRESH GROCERIES
            <br />
            <span className="text-green-600">DELIVERED TODAY</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Premium quality groceries sourced directly from local farms and trusted suppliers. 
            Fresh, organic, and delivered to your doorstep within hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link 
              href="/products" 
              className="bg-green-600 text-white px-8 py-4 font-bold text-lg uppercase tracking-wider hover:bg-green-700 transition-all duration-300 flex items-center gap-3 group"
            >
              Shop Fresh Now
              <FaArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link 
              href="/points" 
              className="border-2 border-green-600 text-green-600 px-8 py-4 font-bold text-lg uppercase tracking-wider hover:bg-green-600 hover:text-white transition-all duration-300"
            >
              Earn Rewards
            </Link>
          </div>
          
          {/* Benefits */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="mb-3">{benefit.icon}</div>
                <h3 className="font-bold text-lg mb-1">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="bg-gray-100 py-1">
        <div className="max-w-6xl mx-auto px-6">
          <div className="border-t border-gray-200"></div>
        </div>
      </div>

      {/* Popular Categories */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
              SHOP BY CATEGORY
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore our wide range of fresh groceries organized by category
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((cat) => (
              <div key={cat.name} className="group cursor-pointer">
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:border-green-500 transition-all duration-300 hover:transform hover:scale-105 shadow-sm hover:shadow-lg">
                  <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
                    {cat.icon}
                  </div>
                  <span className="font-semibold text-black text-sm uppercase tracking-wide block mb-2">
                    {cat.name}
                  </span>
                  <span className="text-green-600 text-xs font-medium">
                    {cat.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="bg-gray-50 py-1">
        <div className="max-w-6xl mx-auto px-6">
          <div className="border-t border-gray-200"></div>
        </div>
      </div>

      {/* Top Rated Products */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
              CUSTOMERS' FAVORITES
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Most loved products by our customers this week
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.isArray(topRated) && topRated.map((prod) => (
              <div key={prod.id} className="group">
                <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-green-500 transition-all duration-300 hover:transform hover:scale-105 shadow-sm hover:shadow-lg h-full flex flex-col">
                  <Link href={`/products/${prod.id}`} className="block flex-1">
                    <div className="relative">
                      <div className="bg-gray-50 rounded-lg p-4 mb-4 flex items-center justify-center h-32">
                        <img 
                          src={prod.imageUrl || "/placeholder.png"} 
                          alt={prod.name} 
                          className="w-full h-full object-contain max-w-20 max-h-20" 
                        />
                      </div>
                      <div className="flex items-center gap-1 mb-3">
                        <FaStar size={14} className="text-yellow-400" />
                        <span className="text-sm font-semibold">{prod.rating?.toFixed(1) || '0.0'}</span>
                        <span className="text-gray-500 text-sm">({prod.ratingCount || 0})</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-black text-base mb-3 leading-tight line-clamp-3 min-h-[3.5rem]">
                      {prod.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="text-xl font-black text-green-600">
                        RM{prod.price.toFixed(2)}
                      </div>
                      {prod.originalPrice && prod.originalPrice > prod.price && (
                        <div className="text-gray-400 line-through text-sm">
                          RM{prod.originalPrice.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </Link>
                  <button
                    className="w-full bg-green-600 text-white py-3 font-bold text-sm uppercase tracking-wider hover:bg-green-700 transition-all duration-300 flex items-center justify-center gap-2 group mt-auto"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addToCart({
                        id: prod.id,
                        name: prod.name,
                        price: prod.price,
                        image: prod.imageUrl || "/placeholder.png",
                      });
                    }}
                  >
                    <FaShoppingBasket size={14} />
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="bg-white py-1">
        <div className="max-w-6xl mx-auto px-6">
          <div className="border-t border-gray-200"></div>
        </div>
      </div>

      {/* Why Choose Us */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
              WHY CHOOSE VGROCERY?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're committed to bringing you the freshest, highest quality groceries
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FaLeaf size={24} className="text-green-600" />
              </div>
              <h3 className="font-bold text-xl mb-2">100% Fresh</h3>
              <p className="text-gray-600">All products are sourced fresh daily from local farms and trusted suppliers</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FaTruck size={24} className="text-green-600" />
              </div>
              <h3 className="font-bold text-xl mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Same-day delivery available. Order by 2PM, delivered today</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FaStar size={24} className="text-green-600" />
              </div>
              <h3 className="font-bold text-xl mb-2">Quality Guarantee</h3>
              <p className="text-gray-600">Not satisfied? We'll replace or refund any product, no questions asked</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="bg-green-600 py-1">
        <div className="max-w-6xl mx-auto px-6">
          <div className="border-t border-green-500"></div>
        </div>
      </div>

      {/* Call to Action */}
      <section className="bg-green-600 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-white">
            READY TO SHOP FRESH?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Join thousands of customers who trust VGrocery for their daily fresh groceries
          </p>
          <Link 
            href="/products" 
            className="bg-white text-green-600 px-10 py-4 font-bold text-lg uppercase tracking-wider hover:bg-gray-100 transition-all duration-300 inline-flex items-center gap-3 group"
          >
            Start Shopping Fresh
            <FaArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
      </section>
    </div>
  );
}