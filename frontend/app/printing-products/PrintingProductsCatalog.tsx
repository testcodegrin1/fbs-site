"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buildApiUrl, getApiBaseUrl } from "@/app/lib/client/api-url";

type PrintingProduct = {
  id: number;
  name: string;
  description: string | null;
  widthPx: number;
  heightPx: number;
  orientation: string;
  images: { id: number; imageUrl: string }[];
};

function ProductCard({ product }: { product: PrintingProduct }) {
  const [failed, setFailed] = useState(false);
  const image = product.images[0];
  const imageUrl = image?.imageUrl
    ? /^https?:\/\//i.test(image.imageUrl)
      ? image.imageUrl
      : `${getApiBaseUrl()}/${image.imageUrl.replace(/^\/+/, "")}`
    : "";

  return (
    <Link
      href={`/printing-products/${product.id}`}
      aria-label={`View ${product.name} details`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex aspect-[4/3] items-center justify-center bg-slate-50 p-5">
        {imageUrl && !failed ? (
          // Admin-uploaded images can be served from the configured backend host.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={product.name} loading="lazy" className="h-full w-full object-contain" onError={() => setFailed(true)} />
        ) : <span className="text-sm text-slate-500">Preview not available</span>}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <h2 className="text-2xl font-semibold text-primary-dark transition group-hover:text-primary">{product.name}</h2>
        <p className="whitespace-pre-wrap break-words text-primary-dark/70">{product.description || "Contact our team for details about this printing product."}</p>
        <div className="mt-auto flex flex-wrap gap-2 pt-3 text-sm text-slate-600">
          {product.widthPx > 0 && product.heightPx > 0 && <span className="rounded-full bg-slate-100 px-3 py-1">{product.widthPx} × {product.heightPx} px</span>}
          {product.orientation && <span className="rounded-full bg-slate-100 px-3 py-1 capitalize">{product.orientation}</span>}
        </div>
        <span className="mt-2 font-semibold text-primary">Open product →</span>
      </div>
    </Link>
  );
}

export default function PrintingProductsCatalog() {
  const [products, setProducts] = useState<PrintingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(buildApiUrl("/api/printing-products"), { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Unable to load printing products. Please try again.");
        const data = await response.json();
        if (!Array.isArray(data.products)) throw new Error("Unable to load printing products. Please try again.");
        if (!controller.signal.aborted) setProducts(data.products);
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Unable to load printing products.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);

  const visibleProducts = products.filter(product => `${product.name} ${product.description || ""}`.toLowerCase().includes(search.trim().toLowerCase()));

  return <main className="mt-24 min-h-[65vh] xl:mt-20">
    <section className="bg-linear-to-br from-white to-primary-light py-12 md:py-16">
      <div className="container mx-auto px-5">
        <p className="mb-5 text-primary-dark/70"><Link href="/" className="text-primary hover:underline">Home</Link> / Printing Products</p>
        <h1 className="text-4xl font-bold text-primary-dark md:text-5xl">Printing Products</h1>
        <p className="mt-4 max-w-2xl text-lg text-primary-dark/70">Explore our latest printing products and available designs.</p>
      </div>
    </section>
    <section className="container mx-auto px-5 py-12" aria-label="Available printing products">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-primary-dark/70" aria-live="polite">{loading ? "Loading products…" : !error ? `${visibleProducts.length} product${visibleProducts.length === 1 ? "" : "s"} available` : ""}</p>
        <input type="search" aria-label="Search printing products" placeholder="Search printing products…" value={search} onChange={event => setSearch(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:max-w-sm" />
      </div>
      {loading ? <div role="status" className="py-16 text-center text-slate-500">Loading printing products…</div> : error ? <div role="alert" className="rounded-xl bg-red-50 p-6 text-red-800"><p>{error}</p><button type="button" onClick={() => setAttempt(value => value + 1)} className="mt-3 font-semibold underline">Try again</button></div> : visibleProducts.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{visibleProducts.map(product => <ProductCard key={product.id} product={product} />)}</div> : <div className="rounded-xl bg-slate-50 px-6 py-16 text-center text-slate-600">{search.trim() ? "No products match your search." : "New printing products are coming soon. Please check back shortly."}</div>}
    </section>
  </main>;
}
