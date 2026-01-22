"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FaShoppingBasket, FaCheckCircle, FaExclamationTriangle, FaSync } from "react-icons/fa";
import { useCart } from "@/components/context/CartContext";

type ApiProduct = {
  id: number;
  name: string;
  price: number;
  category?: string;
  description?: string;
  images?: string[];
  image?: string;
  stockQuantity?: number;
  specs?: Record<string, string>;
};

const base = process.env.NEXT_PUBLIC_API ?? "http://localhost:8080";
const currency = (n: number) => `RM${Number(n || 0).toFixed(2)}`;

// Normalize any backend shape into what the UI expects
const normalizeProduct = (p: any): ApiProduct => ({
  id: Number(p?.id ?? p?.productId),
  name: p?.name ?? "",
  price: Number(p?.price ?? 0), // BigDecimal-safe
  category: p?.category ?? p?.categoryName ?? undefined,
  description: p?.description ?? "",
  images: Array.isArray(p?.images) ? p.images : undefined,
  image: p?.image ?? p?.imageUrl ?? p?.image_url ?? undefined,
  stockQuantity: Number(p?.stockQuantity ?? p?.stock_quantity ?? 0),
  specs: p?.specs ?? undefined,
});

export default function ProductDetailPage() {
  const params = useParams();
  const productId = Number(params?.id);
  const { addToCart } = useCart();

  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [related, setRelated] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState<string | null>(null);
  const [tab, setTab] = useState<"desc" | "specs">("desc");
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [stockLoading, setStockLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Function to fetch real-time stock quantity
  const fetchStockQuantity = async (id: number) => {
    try {
      setStockLoading(true);
      const res = await fetch(`${base}/api/products/${id}`, { 
        cache: "no-store",
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!res.ok) return;
      const raw = await res.json();
      const normalized = normalizeProduct(raw);
      setCurrentStock(normalized.stockQuantity ?? 0);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch stock quantity:', error);
    } finally {
      setStockLoading(false);
    }
  };

  // Real-time stock polling effect
  useEffect(() => {
    if (!productId || !Number.isFinite(productId)) return;

    // Initial stock fetch
    fetchStockQuantity(productId);

    // Set up polling every 10 seconds
    const interval = setInterval(() => {
      fetchStockQuantity(productId);
    }, 10000);

    return () => clearInterval(interval);
  }, [productId]);

  useEffect(() => {
    let ignore = false;

    const fetchById = async (id: number) => {
      const res = await fetch(`${base}/api/products/${id}`, { cache: "no-store" });
      if (!res.ok) return { ok: false as const };
      const raw = await res.json();
      return { ok: true as const, product: normalizeProduct(raw) };
    };

    const fetchAll = async () => {
      const res = await fetch(`${base}/api/products`, { cache: "no-store" });
      if (!res.ok) return [];
      const arr = await res.json();
      return Array.isArray(arr) ? arr.map(normalizeProduct) : [];
    };

    const run = async () => {
      try {
        setLoading(true);
        setErr("");

        // Try direct GET /products/{id}
        let loaded: ApiProduct | null = null;
        const byId = await fetchById(productId);
        if (byId.ok) loaded = byId.product;

        // Fallback: GET /products then find
        if (!loaded) {
          const arr = await fetchAll();
          loaded = arr.find((x) => x.id === productId) ?? null;
        }

        if (!loaded) throw new Error("Product not found");
        if (ignore) return;

        setProduct(loaded);
        setCurrentStock(loaded.stockQuantity ?? 0);
        const firstImg =
          (loaded.images && loaded.images[0]) || loaded.image || "/placeholder.png";
        setActiveImg(firstImg);

        // Related by category (backend supports ?category= & ?limit=)
        if (loaded.category) {
          const relRes = await fetch(
            `${base}/api/products?category=${encodeURIComponent(
              loaded.category
            )}&limit=8`,
            { cache: "no-store" }
          );
          const listRaw = relRes.ok ? await relRes.json() : [];
          const list: ApiProduct[] = Array.isArray(listRaw)
            ? listRaw.map(normalizeProduct)
            : [];
          setRelated(list.filter((x) => x.id !== loaded!.id).slice(0, 4));
        } else {
          setRelated([]);
        }
      } catch (e: any) {
        if (!ignore) setErr(e?.message || "Failed to load product");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    if (!Number.isFinite(productId)) {
      setErr("Invalid product ID");
      setLoading(false);
      return;
    }
    run();
    return () => {
      ignore = true;
    };
  }, [productId]);

  const images = useMemo(() => {
    if (!product) return ["/placeholder.png"];
    if (product.images?.length) return product.images;
    if (product.image) return [product.image];
    return ["/placeholder.png"];
  }, [product]);

  const inStock = currentStock > 0;
  const stockDisplay = currentStock > 0 ? currentStock : (product?.stockQuantity ?? 0);

  const handleAdd = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: images[0] || "/placeholder.png",
    }, qty);
  };

  if (loading) {
    return (
      <main className="bg-white min-h-screen py-10 px-4">
        <div className="max-w-5xl mx-auto animate-pulse">
          <div className="h-4 w-40 bg-gray-200 rounded mb-6" />
          <div className="grid md:grid-cols-2 gap-8">
            <div className="h-80 bg-gray-200 rounded" />
            <div>
              <div className="h-8 w-3/4 bg-gray-200 rounded mb-4" />
              <div className="h-6 w-40 bg-gray-200 rounded mb-6" />
              <div className="h-10 w-48 bg-gray-200 rounded mb-6" />
              <div className="h-32 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (err || !product) {
    return (
      <main className="bg-white min-h-screen py-10 px-4">
        <div className="max-w-xl mx-auto text-center">
          <FaExclamationTriangle className="text-red-500 mx-auto mb-4" size={36} />
          <h1 className="text-2xl font-bold mb-2 text-gray-800">Product Not Available</h1>
          <p className="text-gray-600 mb-6">{err || "We couldn’t find this product."}</p>
          <Link href="/products" className="text-green-700 hover:underline">
            Back to Products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-white min-h-screen py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <Link href="/products" className="text-green-700 hover:underline mb-6 inline-block">
          &larr; Back to Products
        </Link>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Gallery */}
          <div>
            <div className="bg-gray-50 rounded-lg border p-4 flex items-center justify-center">
              <img
                src={activeImg || images[0]}
                alt={product.name}
                className="max-h-96 object-contain"
              />
            </div>
            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(src)}
                    className={`border rounded p-1 h-20 flex items-center justify-center ${
                      activeImg === src ? "border-green-600" : "border-gray-200"
                    }`}
                  >
                    <img
                      src={src}
                      alt={`${product.name} ${i + 1}`}
                      className="max-h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{product.name}</h1>
            <div className="mt-2 text-sm text-gray-500">{product.category || "General"}</div>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-3xl font-extrabold text-green-700">
                {currency(product.price)}
              </span>
              {inStock ? (
                <span className="inline-flex items-center gap-1 text-green-700">
                  <FaCheckCircle /> In stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-red-600">
                  <FaExclamationTriangle /> Out of stock
                </span>
              )}
            </div>

            {/* Real-time Stock Quantity Display */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Stock Quantity:</span>
                  {stockLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-500">Updating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${
                        currentStock > 10 ? 'text-green-600' : 
                        currentStock > 5 ? 'text-yellow-600' : 
                        currentStock > 0 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {stockDisplay}
                      </span>
                      <span className="text-xs text-gray-500">units available</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-400">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </div>
                  <button
                    onClick={() => fetchStockQuantity(productId)}
                    disabled={stockLoading}
                    className="p-1 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                    title="Refresh stock quantity"
                  >
                    <FaSync className={`text-xs text-gray-500 ${stockLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
              
              {/* Stock Level Indicator */}
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentStock > 10 ? 'bg-green-500' : 
                      currentStock > 5 ? 'bg-yellow-500' : 
                      currentStock > 0 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ 
                      width: `${Math.min(100, (stockDisplay / Math.max(stockDisplay, 20)) * 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            </div>

            {/* Low Stock Warning */}
            {currentStock > 0 && currentStock <= 5 && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <FaExclamationTriangle className="text-orange-600" />
                  <span className="text-sm text-orange-800 font-medium">
                    Low Stock Alert: Only {currentStock} {currentStock === 1 ? 'item' : 'items'} remaining!
                  </span>
                </div>
                <p className="text-xs text-orange-700 mt-1">
                  Order now to secure your items before they run out.
                </p>
              </div>
            )}

            {/* Qty + Add */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center border rounded-lg overflow-hidden">
                <button
                  className="px-3 py-2 hover:bg-gray-50"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={currentStock || product.stockQuantity || 1}
                  value={qty}
                  onChange={(e) => {
                    const newQty = Math.max(1, Number(e.target.value) || 1);
                    const maxQty = currentStock || product.stockQuantity || 1;
                    setQty(Math.min(newQty, maxQty));
                  }}
                  className="w-14 text-center outline-none py-2"
                />
                <button
                  className="px-3 py-2 hover:bg-gray-50"
                  onClick={() =>
                    setQty((q) => Math.min(q + 1, currentStock || (product.stockQuantity ?? q + 1)))
                  }
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAdd}
                disabled={!inStock}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <FaShoppingBasket size={18} /> Add to Cart
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-8">
              <div className="flex gap-4 border-b">
                <button
                  className={`pb-2 font-semibold ${
                    tab === "desc"
                      ? "text-green-700 border-b-2 border-green-700"
                      : "text-gray-600"
                  }`}
                  onClick={() => setTab("desc")}
                >
                  Description
                </button>
                <button
                  className={`pb-2 font-semibold ${
                    tab === "specs"
                      ? "text-green-700 border-b-2 border-green-700"
                      : "text-gray-600"
                  }`}
                  onClick={() => setTab("specs")}
                >
                  Specs
                </button>
              </div>

              {tab === "desc" ? (
                <div className="pt-4 text-gray-700 whitespace-pre-line">
                  {product.description || "Fresh, high-quality groceries delivered to your door."}
                </div>
              ) : (
                <div className="pt-4">
                  {product.specs && Object.keys(product.specs).length ? (
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                      {Object.entries(product.specs).map(([k, v]) => (
                        <div key={k} className="flex">
                          <dt className="w-40 text-gray-500">{k}</dt>
                          <dd className="font-medium text-gray-800">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <div className="text-gray-600">No additional specifications.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-bold text-gray-900 mb-4">You may also like</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
              {related.map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="group border rounded-lg p-4 hover:shadow transition bg-white"
                >
                  <div className="h-36 flex items-center justify-center mb-3">
                    <img
                      src={(p.images && p.images[0]) || p.image || "/placeholder.png"}
                      alt={p.name}
                      className="max-h-full object-contain group-hover:scale-105 transition"
                    />
                  </div>
                  <div className="font-medium text-gray-800 line-clamp-2">{p.name}</div>
                  <div className="text-green-700 font-bold mt-1">{currency(p.price)}</div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
