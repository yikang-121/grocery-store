"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  FaUpload, FaCalculator, FaEye, FaDownload,
  FaInfoCircle, FaCheckCircle, FaExclamationTriangle,
  FaArrowLeft, FaFileAlt, FaCloudUploadAlt, FaSlidersH,
} from "react-icons/fa";
import { API_BASE } from '@/utils/apiBase';

/* ---------- Types ---------- */
type CsvRow = {
  product_name: string;
  supplier_price: number;
  quantity: number;
  expiry_date: string;
  category?: string;
  supplier_name?: string;
  batch_number?: string;
  sku?: string;
};
type PreviewRow = CsvRow & {
  selling_price: number;
  margin_pct: number;
  total_value: number;
};
type UploadSummary = {
  totalRows: number;
  created: number;
  updated: number;
  restocked: number;
  errors: string[];
};

/* ---------- Helpers ---------- */
const templateHeaders = [
  "sku","name","category","cost_price","price","stock_quantity","image_url","original_price","product_url"
];
const buildTemplateCsv = () => {
  const rows = [
    templateHeaders.join(","),
    "APPLE001,Apple,Fruits,2.50,3.20,100,https://example.com/apple.jpg,3.50,https://example.com/apple",
    "BANANA001,Banana,Fruits,1.80,2.30,150,https://example.com/banana.jpg,2.50,https://example.com/banana",
    "SPINACH001,Organic Spinach,Vegetables,3.20,4.10,50,https://example.com/spinach.jpg,4.50,https://example.com/spinach",
  ].join("\n");
  return URL.createObjectURL(new Blob([rows], { type: "text/csv" }));
};
const safeNum = (v: any, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

/** Pricing for PREVIEW only (backend will use profitMargin only) */
function computeSellingPrice(
  cost: number, marginPct: number, lossPct: number, addOnCents: number, roundTo: number,
  strategy: "AUTO" | "MARGIN_ONLY"
) {
  if (strategy === "MARGIN_ONLY") return +(cost * (1 + marginPct / 100)).toFixed(2);
  const base = cost * (1 + marginPct / 100 + lossPct / 100) + addOnCents / 100;
  const rounded = roundTo > 0 ? Math.ceil(base / roundTo) * roundTo : base;
  return +rounded.toFixed(2);
}

/** Simple CSV parser that handles quoted values */
function parseCsvLine(line: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/** tolerant CSV parser */
function parseCsv(text: string): CsvRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length);

  if (!lines.length) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.replace(/"/g, '').trim().toLowerCase());
  const idx = (name: string) => headers.indexOf(name);
  const has = (name: string) => idx(name) !== -1;

  const out: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const raw = parseCsvLine(lines[i]).map(v => v.replace(/"/g, '').trim());
    if (!raw.length) continue;

    // Product name fallback: name → product_name → sku
    const product_name =
      (has("name") ? raw[idx("name")] : "") ||
      (has("product_name") ? raw[idx("product_name")] : "") ||
      (has("sku") ? raw[idx("sku")] : "") ||
      "";

    const sku = has("sku") ? raw[idx("sku")] || "" : undefined;

    // Accept either supplier_price or cost_price
    const supplier_price = has("supplier_price")
      ? safeNum(raw[idx("supplier_price")])
      : has("cost_price")
      ? safeNum(raw[idx("cost_price")])
      : 0;

    // Accept either quantity or stock_quantity
    const quantity = has("quantity")
      ? safeNum(raw[idx("quantity")])
      : has("stock_quantity")
      ? safeNum(raw[idx("stock_quantity")])
      : 0;

    const expiry_date = has("expiry_date") ? raw[idx("expiry_date")] || "" : "";
    const category = has("category") ? raw[idx("category")] || "" : "";
    const supplier_name = has("supplier_name") ? raw[idx("supplier_name")] || "" : "";
    const batch_number = has("batch_number") ? raw[idx("batch_number")] || "" : "";

    // If no product name and no sku → skip row
    if (!product_name && !sku) continue;

    out.push({
      product_name,
      supplier_price,
      quantity,
      expiry_date,
      category,
      supplier_name,
      batch_number,
      sku,
    });
  }
  return out;
}


/* ---------- Page ---------- */
export default function RestockPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  // pricing controls for PREVIEW
  const [profitMargin, setProfitMargin] = useState<number>(25);
  const [strategy, setStrategy] = useState<"AUTO" | "MARGIN_ONLY">("AUTO");
  const [lossAllowancePct, setLossAllowancePct] = useState<number>(3);
  const [addOnCents, setAddOnCents] = useState<number>(9);
  const [roundUpTo, setRoundUpTo] = useState<number>(0.05);

  const [templateUrl, setTemplateUrl] = useState<string>("");

  useEffect(() => {
    const url = buildTemplateCsv();
    setTemplateUrl(url);
    
    // Cleanup function to revoke the blob URL when component unmounts
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  const validateCsv = (f: File | null) => !!f && (f.type === "text/csv" || f.name.toLowerCase().endsWith(".csv"));

  const handleFiles = (files: FileList | null) => {
    setErr(""); setMessage(""); setShowPreview(false); setPreview([]);
    const selected = files?.[0] || null;
    if (!selected) { setFile(null); return; }
    if (!validateCsv(selected)) {
      setFile(null);
      setErr("Please upload a .csv file.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setFile(selected);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
    if (fileRef.current) fileRef.current.value = "";
  };

  const clearFile = () => {
    setFile(null);
    setShowPreview(false);
    setPreview([]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const doPreview = async () => {
    if (!file) return setMessage("Please select a file first.");
    try {
      setLoading(true);
      const csvText = await file.text();
      console.log("CSV Content:", csvText);
      
      const rows = parseCsv(csvText);
      console.log("Parsed rows:", rows);
      
      if (rows.length === 0) {
        setErr("No valid products found in CSV. Please check the format and ensure the file has data rows.");
        return;
      }
      
      const computed: PreviewRow[] = rows.map(r => {
        const selling_price = computeSellingPrice(
          r.supplier_price, profitMargin, lossAllowancePct, addOnCents, roundUpTo, strategy
        );
        return {
          ...r,
          selling_price,
          margin_pct: r.supplier_price > 0 ? ((selling_price - r.supplier_price) / r.supplier_price) * 100 : 0,
          total_value: selling_price * r.quantity,
        };
      });
      
      console.log("Computed preview:", computed);
      
      setPreview(computed);
      setShowPreview(true);
      setMessage(`Processed ${computed.length} products successfully.`);
    } catch (error) {
      console.error("Preview error:", error);
      setErr("Error processing CSV file. Please check the format.");
    } finally {
      setLoading(false);
    }
  };

  const onUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setMessage("");
    if (!file) return setMessage("Please select a file to upload.");

    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("file", file);                       // MUST be "file"
      fd.append("profitMargin", String(profitMargin)); // backend expects profitMargin (%)

      const res = await fetch(`${API_BASE}/api/admin/restock/bulk-upload`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status}): ${await res.text()}`);

      const summary: UploadSummary = await res.json();
      setMessage(
        `Upload complete. Rows ${summary.totalRows}. Created ${summary.created}, Updated ${summary.updated}, Restocked ${summary.restocked}.`
      );
      if (summary.errors?.length) {
        setErr(summary.errors.slice(0, 3).join(" | ") + (summary.errors.length > 3 ? " …" : ""));
      }
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: any) {
      setErr(e.message || "Error uploading file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Link href="/admin" className="text-sm text-gray-500 hover:text-green-600 flex items-center gap-1 mb-3">
            <FaArrowLeft size={10} /> Back to Admin
          </Link>
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg shadow-blue-200">
              <FaCloudUploadAlt size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-gray-900">Bulk Restock</h1>
              <p className="text-gray-500 mt-0.5">Upload CSV files to restock inventory in bulk</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Upload Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Upload Area */}
          <div className="p-6">
            <form onSubmit={onUpload}>
              <input ref={fileRef} type="file" accept=".csv" onChange={onFileChange} className="hidden" />
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? "border-blue-500 bg-blue-50 scale-[1.01]"
                    : file
                    ? "border-green-400 bg-green-50/50"
                    : "border-gray-200 hover:border-blue-400 hover:bg-gray-50"
                }`}
              >
                {file ? (
                  <>
                    <div className="bg-green-100 p-3 rounded-xl">
                      <FaFileAlt size={24} className="text-green-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); clearFile(); }}
                      className="text-xs text-red-500 hover:text-red-700 font-medium mt-1 hover:underline"
                    >
                      Remove file
                    </button>
                  </>
                ) : (
                  <>
                    <div className={`p-4 rounded-2xl ${isDragging ? "bg-blue-100" : "bg-gray-100"}`}>
                      <FaCloudUploadAlt size={32} className={isDragging ? "text-blue-500" : "text-gray-400"} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-400 mt-1">CSV files only</p>
                    </div>
                  </>
                )}
              </div>

              {/* CSV Format Hint + Template */}
              <div className="mt-4 bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                <FaInfoCircle className="text-gray-400 mt-0.5 flex-shrink-0" size={14} />
                <div className="text-xs text-gray-600 flex-1">
                  <strong className="text-gray-700">Expected CSV columns:</strong>{" "}
                  <code className="bg-white px-1.5 py-0.5 rounded text-[11px] border border-gray-200">
                    sku, name, category, cost_price, price, stock_quantity, image_url, original_price, product_url
                  </code>
                </div>
                {templateUrl && (
                  <a href={templateUrl} download="inventory_template.csv"
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
                    <FaDownload size={10} /> Template
                  </a>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-5">
                <button type="button" onClick={doPreview} disabled={!file || loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
                  <FaEye size={14} /> Preview
                </button>
                <button type="submit" disabled={!file || loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-200">
                  <FaUpload size={14} /> {loading ? "Uploading..." : "Upload & Restock"}
                </button>

                {/* Pricing Settings Toggle */}
                <button type="button" onClick={() => setShowPricing(!showPricing)}
                  className={`ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    showPricing
                      ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>
                  <FaSlidersH size={12} /> Pricing
                </button>
              </div>
            </form>

            {/* Messages */}
            {(message || err) && (
              <div className="mt-4 space-y-2">
                {message && (
                  <div className="p-3.5 text-sm bg-green-50 text-green-800 rounded-xl border border-green-200 flex items-center gap-2">
                    <FaCheckCircle className="flex-shrink-0" /> {message}
                  </div>
                )}
                {err && (
                  <div className="p-3.5 text-sm bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-2">
                    <FaExclamationTriangle className="flex-shrink-0" /> {err}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Collapsible Pricing Controls */}
          {showPricing && (
            <div className="border-t border-gray-100 bg-gray-50/50 p-6">
              <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <FaSlidersH size={12} className="text-indigo-500" /> Pricing Configuration
              </h3>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Profit Margin (%)</label>
                  <input
                    type="number" min={0} max={100} value={profitMargin}
                    onChange={(e) => setProfitMargin(+e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Used by backend to compute selling price if missing</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Preview Strategy</label>
                  <div className="flex gap-4 mt-1">
                    <label className="text-sm flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="strategy" value="AUTO"
                        checked={strategy === "AUTO"} onChange={() => setStrategy("AUTO")}
                        className="accent-blue-500" />
                      <span className="text-gray-700">AUTO</span>
                    </label>
                    <label className="text-sm flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="strategy" value="MARGIN_ONLY"
                        checked={strategy === "MARGIN_ONLY"} onChange={() => setStrategy("MARGIN_ONLY")}
                        className="accent-blue-500" />
                      <span className="text-gray-700">Margin-only</span>
                    </label>
                  </div>
                </div>
              </div>

              {strategy === "AUTO" && (
                <div className="mt-4 grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Loss Allowance (%)</label>
                    <input type="number" min={0} step={0.5} value={lossAllowancePct}
                      onChange={(e) => setLossAllowancePct(+e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Add-on (cents)</label>
                    <input type="number" min={0} step={1} value={addOnCents}
                      onChange={(e) => setAddOnCents(+e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Round up to (RM)</label>
                    <input type="number" min={0.01} step={0.01} value={roundUpTo}
                      onChange={(e) => setRoundUpTo(+e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white" />
                  </div>
                </div>
              )}

              <div className="mt-3 text-[11px] text-gray-400 flex items-start gap-2">
                <FaInfoCircle className="mt-0.5 flex-shrink-0" />
                <span>AUTO formula: <code className="bg-white px-1 py-0.5 rounded border border-gray-200">(cost × (1 + margin% + loss%)) + addOn</code>, then round up.</span>
              </div>
            </div>
          )}
        </div>

        {/* Preview Table */}
        {showPreview && preview.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-blue-100 p-2 rounded-xl">
                  <FaCalculator size={16} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Price Calculation Preview</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{preview.length} products parsed from CSV</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-wide">Total Items</div>
                  <div className="text-2xl font-black text-blue-700 mt-1">
                    {preview.reduce((s, r) => s + r.quantity, 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
                  <div className="text-xs font-bold text-green-600 uppercase tracking-wide">Total Value</div>
                  <div className="text-2xl font-black text-green-700 mt-1">
                    RM {preview.reduce((s, r) => s + r.total_value, 0).toFixed(2)}
                  </div>
                </div>
                <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl">
                  <div className="text-xs font-bold text-purple-600 uppercase tracking-wide">Target Margin</div>
                  <div className="text-2xl font-black text-purple-700 mt-1">{profitMargin}%</div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Cost</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Sell Price</th>
                    <th className="px-6 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">Margin</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {preview.map((r, i) => (
                    <tr key={`${r.product_name}-${i}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900">{r.product_name}</td>
                      <td className="px-6 py-3 text-gray-600">RM {r.supplier_price.toFixed(2)}</td>
                      <td className="px-6 py-3 text-green-600 font-semibold">RM {r.selling_price.toFixed(2)}</td>
                      <td className="px-6 py-3 text-center">{r.quantity}</td>
                      <td className="px-6 py-3 text-right font-bold text-gray-900">RM {r.total_value.toFixed(2)}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          r.margin_pct >= 20 ? "bg-green-100 text-green-700" : r.margin_pct >= 10 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                        }`}>
                          {r.margin_pct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-500 text-xs">{r.category || "—"}</td>
                      <td className="px-6 py-3 text-gray-500 text-xs">{r.expiry_date || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
