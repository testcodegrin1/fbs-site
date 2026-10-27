"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buildApiUrl, getApiBaseUrl } from "@/app/lib/client/api-url";
import { resolveImageUrl } from "@/app/lib/client/product-template-api";
import { ArrowRight, FileImage, Search } from "lucide-react";

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
  const image = product.images?.[0];
  const rawUrl = image?.imageUrl || "";
  const imageUrl = rawUrl ? resolveImageUrl(rawUrl) : "";

  return (
    <Link
      href={`/printing-products/${product.id}`}
      aria-label={`View ${product.name} details`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {/* Product Image Thumbnail */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-50 border-b border-slate-100 flex items-center justify-center p-2.5">
        {imageUrl && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-300 gap-1.5 p-3 text-center">
            <FileImage size={24} className="text-slate-300" />
            <span className="text-[11px] font-medium text-slate-400">
              Preview not available
            </span>
          </div>
        )}
      </div>

      {/* Product Content */}
      <div className="flex flex-1 flex-col p-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 transition group-hover:text-primary line-clamp-1 tracking-tight">
          {product.name}
        </h2>

        <p className="mt-1 text-xs text-slate-500 line-clamp-2 min-h-[32px]">
          {product.description || "Contact our team for details about this printing product."}
        </p>

        {/* Dimension & Orientation Badges */}
        <div className="mt-auto flex flex-wrap gap-1.5 pt-3 text-[11px] text-slate-600 font-medium">
          {product.widthPx > 0 && product.heightPx > 0 && (
            <span className="rounded-md bg-slate-100/80 px-2 py-0.5 border border-slate-200/60 font-mono text-[10.5px]">
              {product.widthPx} × {product.heightPx} px
            </span>
          )}
          {product.orientation && (
            <span className="rounded-md bg-slate-100/80 px-2 py-0.5 border border-slate-200/60 capitalize text-[10.5px]">
              {product.orientation}
            </span>
          )}
        </div>

        {/* Action Link */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-primary">
          <span>Open product</span>
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
        </div>
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
        const response = await fetch(buildApiUrl("/api/printing-products"), {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error("Unable to load printing products. Please try again.");
        const data = await response.json();
        if (!Array.isArray(data.products))
          throw new Error("Unable to load printing products. Please try again.");
        if (!controller.signal.aborted) setProducts(data.products);
      } catch (err) {
        if (!controller.signal.aborted)
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load printing products.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);

  const visibleProducts = products.filter((product) =>
    `${product.name} ${product.description || ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  return (
    <main className="mt-24 min-h-[65vh] xl:mt-20">
      {/* Banner / Header */}
      <section className="bg-linear-to-br from-white to-primary-light py-10 md:py-14 border-b border-slate-100">
        <div className="container mx-auto px-5">
          <p className="mb-3 text-xs sm:text-sm text-primary-dark/70">
            <Link href="/" className="text-primary hover:underline">
              Home
            </Link>{" "}
            / Printing Products
          </p>
          <h1 className="text-3xl font-black text-primary-dark md:text-4xl">
            Printing Products
          </h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-primary-dark/70">
            Explore our latest printing products, templates, and customizable designs.
          </p>
        </div>
      </section>

      {/* Catalog Grid Section */}
      <section
        className="container mx-auto px-5 py-8 md:py-10"
        aria-label="Available printing products"
      >
        {/* Search & Count Bar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold text-slate-600">
              {loading
                ? "Loading products…"
                : !error
                  ? `${visibleProducts.length} product${
                      visibleProducts.length === 1 ? "" : "s"
                    } available`
                  : ""}
            </span>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="search"
              aria-label="Search printing products"
              placeholder="Search products…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs sm:text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-2xs"
            />
          </div>
        </div>

        {/* Main Grid View */}
        {loading ? (
          <div role="status" className="py-20 text-center text-xs font-semibold text-slate-500">
            Loading printing products…
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-xl bg-red-50 p-6 text-red-800 text-xs sm:text-sm"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              className="mt-3 font-semibold underline"
            >
              Try again
            </button>
          </div>
        ) : visibleProducts.length ? (
          /* 4 columns on lg screens: grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 */
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 px-6 py-16 text-center text-xs sm:text-sm text-slate-600">
            {search.trim()
              ? "No products match your search."
              : "New printing products are coming soon. Please check back shortly."}
          </div>
        )}
      </section>
    </main>
  );
}

