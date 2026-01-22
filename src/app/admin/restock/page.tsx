"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  FaUpload, FaExclamationCircle, FaCalculator, FaEye, FaDownload,
  FaInfoCircle, FaCheckCircle, FaExclamationTriangle,
} from "react-icons/fa";

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

/* ---------- Mock Low Stock ---------- */
const lowStockItems = [
  { id: 1, name: "Apple", stock: 20, minStock: 50 },
  { id: 2, name: "Banana", stock: 15, minStock: 30 },
  { id: 3, name: "Organic Spinach", stock: 5, minStock: 20 },
];

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
      console.log("CSV Content:", csvText); // Debug log
      
      const rows = parseCsv(csvText);
      console.log("Parsed rows:", rows); // Debug log
      
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
      
      console.log("Computed preview:", computed); // Debug log
      
      setPreview(computed);
      setShowPreview(true);
      setMessage(`Processed ${computed.length} products successfully.`);
    } catch (error) {
      console.error("Preview error:", error); // Debug log
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

      const res = await fetch("http://localhost:8080/api/admin/restock/bulk-upload", {
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
    <main className="bg-white min-h-screen py-10 px-2">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 text-green-700">Inventory Management & Bulk Upload</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Low Stock */}
          <div className="bg-gray-50 rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <FaExclamationCircle size={20} className="text-orange-600" />
              <h2 className="text-xl font-bold text-green-700">Low Stock Alert</h2>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="text-left bg-gray-100"><th className="p-2">Product</th><th className="p-2">Current</th><th className="p-2">Min</th></tr></thead>
              <tbody>
                {lowStockItems.map(i => (
                  <tr key={i.id} className="border-b border-gray-100">
                    <td className="p-2 font-medium">{i.name}</td>
                    <td className="p-2 text-red-600 font-semibold">{i.stock}</td>
                    <td className="p-2 text-gray-600">{i.minStock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Upload + pricing controls */}
          <div className="lg:col-span-2 bg-gray-50 rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <FaUpload size={20} className="text-green-600" />
              <h2 className="text-xl font-bold text-green-700">Bulk Inventory Upload</h2>
            </div>

            <div className="mb-4 p-4 bg-white rounded border">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profit Margin (%)</label>
                  <input
                    type="number" min={0} max={100} value={profitMargin}
                    onChange={(e) => setProfitMargin(+e.target.value)}
                    className="w-32 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-600 mt-1">Used by backend to compute selling price if missing.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preview Strategy</label>
                  <div className="flex gap-4">
                    <label className="text-sm flex items-center gap-2">
                      <input type="radio" name="strategy" value="AUTO"
                        checked={strategy === "AUTO"} onChange={() => setStrategy("AUTO")} />
                      AUTO (margin + loss + add‑on + rounding)
                    </label>
                    <label className="text-sm flex items-center gap-2">
                      <input type="radio" name="strategy" value="MARGIN_ONLY"
                        checked={strategy === "MARGIN_ONLY"} onChange={() => setStrategy("MARGIN_ONLY")} />
                      Margin‑only
                    </label>
                  </div>
                </div>
              </div>

              {strategy === "AUTO" && (
                <div className="mt-4 grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loss Allowance (%)</label>
                    <input type="number" min={0} step={0.5} value={lossAllowancePct}
                      onChange={(e) => setLossAllowancePct(+e.target.value)}
                      className="w-full px-3 py-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Add‑on (cents)</label>
                    <input type="number" min={0} step={1} value={addOnCents}
                      onChange={(e) => setAddOnCents(+e.target.value)}
                      className="w-full px-3 py-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Round up to (RM)</label>
                    <input type="number" min={0.01} step={0.01} value={roundUpTo}
                      onChange={(e) => setRoundUpTo(+e.target.value)}
                      className="w-full px-3 py-2 border rounded" />
                  </div>
                </div>
              )}

              <div className="mt-3 text-xs text-gray-600 flex items-start gap-2">
                <FaInfoCircle className="mt-0.5" />
                <span>Preview AUTO example: <code>(cost × (1 + margin% + loss%)) + addOn</code>, then round up.</span>
              </div>
            </div>

            <form onSubmit={onUpload}>
              <div className="mb-4">
                <input ref={fileRef} type="file" accept=".csv" onChange={onFileChange} className="hidden" />
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded cursor-pointer transition ${
                    isDragging ? "border-green-600 bg-green-50" : "border-gray-300 hover:border-green-500"
                  }`}
                >
                  <FaUpload className={isDragging ? "text-green-600" : "text-gray-500"} />
                  <div className="text-sm text-gray-700">
                    <span className="font-semibold text-green-700">Click to upload</span> or drag and drop CSV
                  </div>
                  <div className="text-xs text-gray-500">Only .csv files are supported</div>
                  {file && (
                    <div className="mt-2 inline-flex items-center gap-2 text-xs bg-white border rounded px-2 py-1">
                      <span className="text-gray-700">{file.name}</span>
                      <button type="button" onClick={clearFile} className="text-red-600 hover:underline">Remove</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-100 rounded p-3 mb-4 text-xs text-gray-700">
                <strong>CSV Format:</strong> sku,name,category,cost_price,price,stock_quantity,image_url,original_price,product_url
                {templateUrl && (
                  <a href={templateUrl} download="inventory_template.csv"
                     className="ml-2 inline-flex items-center gap-1 text-green-600 hover:text-green-800">
                    <FaDownload size={12} /> Download Example
                  </a>
                )}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={doPreview} disabled={!file || loading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed">
                  <FaEye size={16} /> Preview
                </button>
                <button type="submit" disabled={!file || loading}
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed">
                  <FaUpload size={16} /> {loading ? "Uploading..." : "Upload & Restock"}
                </button>
              </div>
            </form>

            {(message || err) && (
              <div className="mt-4">
                {message && (
                  <div className="p-3 text-center text-sm bg-green-100 text-green-800 rounded flex items-center justify-center gap-2">
                    <FaCheckCircle /> {message}
                  </div>
                )}
                {err && (
                  <div className="mt-2 p-3 text-center text-sm bg-red-100 text-red-700 rounded flex items-center justify-center gap-2">
                    <FaExclamationTriangle /> {err}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Preview table */}
        {showPreview && preview.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex items-center gap-2 mb-4">
                <FaCalculator size={20} className="text-blue-600" />
                <h3 className="text-lg font-bold text-gray-800">Price Calculation Preview</h3>
                <span className="text-sm text-gray-600">({preview.length} products)</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="font-semibold text-blue-800">Total Items</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {preview.reduce((s, r) => s + r.quantity, 0)}
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="font-semibold text-green-800">Total Value</div>
                  <div className="text-2xl font-bold text-green-600">
                    RM {preview.reduce((s, r) => s + r.total_value, 0).toFixed(2)}
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <div className="font-semibold text-purple-800">Profit Margin (target)</div>
                  <div className="text-2xl font-bold text-purple-600">{profitMargin}%</div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left">Product</th>
                    <th className="p-3 text-left">Supplier Price</th>
                    <th className="p-3 text-left">Selling Price</th>
                    <th className="p-3 text-left">Qty</th>
                    <th className="p-3 text-left">Total Value</th>
                    <th className="p-3 text-left">Margin %</th>
                    <th className="p-3 text-left">Category</th>
                    <th className="p-3 text-left">Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r, i) => (
                    <tr key={`${r.product_name}-${i}`} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 font-medium">{r.product_name}</td>
                      <td className="p-3 text-gray-600">RM {r.supplier_price.toFixed(2)}</td>
                      <td className="p-3 text-green-600 font-semibold">RM {r.selling_price.toFixed(2)}</td>
                      <td className="p-3">{r.quantity}</td>
                      <td className="p-3 text-green-700 font-bold">RM {r.total_value.toFixed(2)}</td>
                      <td className="p-3">{r.margin_pct.toFixed(1)}%</td>
                      <td className="p-3 text-gray-600">{r.category || "-"}</td>
                      <td className="p-3 text-gray-600">{r.expiry_date}</td>
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
