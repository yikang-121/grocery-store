'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FaShoppingBasket, FaEgg, FaCarrot, FaAppleAlt,
  FaFish, FaCheese, FaLeaf, FaSearch, FaFilter
} from "react-icons/fa";
import { useCart } from "@/components/context/CartContext";

const categories = [
  { name: "All", icon: null },
  { name: "Dairy & Eggs", icon: <FaEgg size={18} className="text-black" /> },
  { name: "Vegetables", icon: <FaCarrot size={18} className="text-black" /> },
  { name: "Fruits", icon: <FaAppleAlt size={18} className="text-black" /> },
  { name: "Seafood", icon: <FaFish size={18} className="text-black" /> },
  { name: "Bakery", icon: <FaCheese size={18} className="text-black" /> },
  { name: "Organics", icon: <FaLeaf size={18} className="text-black" /> },
];

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
  originalPrice?: number;
  stockQuantity?: number;
  rating?: number;
  ratingCount?: number;
  productUrl?: string;
  img: string; // for internal use (display fallback)
};

export default function ProductsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(12);
  const { addToCart } = useCart();

  useEffect(() => {
    fetch("http://localhost:8080/api/products")
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((p: Product) => ({
          ...p,
          img: p.imageUrl || "/default-image.png", // fallback image for UI
        }));
        setAllProducts(mapped);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
      });
  }, []);

  // Filter and sort logic
  let filteredProducts = allProducts;
  if (selectedCategory !== "All") {
    filteredProducts = filteredProducts.filter((p) => p.category === selectedCategory);
  }
  if (search.trim()) {
    filteredProducts = filteredProducts.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  }
  if (minPrice) {
    filteredProducts = filteredProducts.filter((p) => p.price >= parseFloat(minPrice));
  }
  if (maxPrice) {
    filteredProducts = filteredProducts.filter((p) => p.price <= parseFloat(maxPrice));
  }
  if (sort === "price-asc") {
    filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  } else if (sort === "price-desc") {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
  }

  // Pagination logic
  const totalProducts = filteredProducts.length;
  const totalPages = Math.ceil(totalProducts / productsPerPage);
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const products = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, search, minPrice, maxPrice, sort]);

  return (
    <div className="bg-white text-black min-h-screen">
      <div className="max-w-6xl mx-auto py-12 px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            OUR PRODUCTS
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover our premium selection of fresh groceries
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          {categories.map((cat) => (
            <button
              key={cat.name}
              className={`flex items-center gap-2 px-6 py-3 rounded-full border transition-all duration-300 font-medium text-sm uppercase tracking-wide
                ${selectedCategory === cat.name
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-700 border-gray-300 hover:border-black hover:text-black"}`}
              onClick={() => setSelectedCategory(cat.name)}
            >
              {cat.icon}
              {cat.name}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Search */}
            <div className="flex items-center bg-white border border-gray-300 rounded-full px-4 py-3 flex-1 max-w-md">
              <FaSearch size={16} className="text-gray-500 mr-3" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none text-black placeholder-gray-500 flex-1"
              />
            </div>

            {/* Price Range */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <FaFilter size={14} className="text-gray-500" />
                <span className="text-gray-600 text-sm uppercase tracking-wide">Price:</span>
              </div>
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="bg-white border border-gray-300 rounded px-3 py-2 text-black w-20 text-center"
                min={0}
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="bg-white border border-gray-300 rounded px-3 py-2 text-black w-20 text-center"
                min={0}
              />
            </div>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-white border border-gray-300 rounded px-4 py-2 text-black cursor-pointer"
            >
              <option value="">Sort by</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-8">
          <p className="text-gray-600">
            Showing {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, totalProducts)} of {totalProducts} products
            {totalProducts !== allProducts.length && ` (filtered from ${allProducts.length} total)`}
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((prod) => (
            <div key={prod.id} className="group">
              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-black transition-all duration-300 hover:transform hover:scale-105 shadow-sm hover:shadow-lg h-[400px] flex flex-col">
                <Link href={`/products/${prod.id}`} className="flex flex-col flex-1">
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 flex items-center justify-center h-[120px]">
                    <img
                      src={prod.img}
                      alt={prod.name}
                      className="w-20 h-20 object-contain group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-bold text-black text-lg mb-2 leading-tight flex-1 line-clamp-3">
                    {prod.name}
                  </h3>
                  <div className="text-2xl font-black text-black mb-4">
                    RM{prod.price.toFixed(2)}
                  </div>
                </Link>
                <button
                  className="w-12 h-12 bg-black text-white hover:bg-gray-800 transition-all duration-300 flex items-center justify-center rounded-full group mt-auto mx-auto"
                  onClick={() => {
                    addToCart({
                      id: prod.id,
                      name: prod.name,
                      price: prod.price,
                      image: prod.img,
                    });
                  }}
                  title="Add to Cart"
                >
                  <FaShoppingBasket size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Previous/Next Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-black hover:text-black'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-black hover:text-black'
                }`}
              >
                Next
              </button>
            </div>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                // Show first page, last page, current page, and pages around current
                const showPage = 
                  pageNum === 1 || 
                  pageNum === totalPages || 
                  Math.abs(pageNum - currentPage) <= 1;
                
                // Show ellipsis
                const showEllipsis = 
                  (pageNum === 2 && currentPage > 4) ||
                  (pageNum === totalPages - 1 && currentPage < totalPages - 3);

                if (!showPage && !showEllipsis) return null;

                if (showEllipsis) {
                  return (
                    <span key={pageNum} className="px-2 text-gray-400">
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[40px] h-[40px] rounded-lg font-medium transition-all duration-300 ${
                      currentPage === pageNum
                        ? 'bg-black text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-black hover:text-black'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Page Info */}
            <div className="text-gray-600 text-sm">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )}

        {/* No Results */}
        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              No products found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
