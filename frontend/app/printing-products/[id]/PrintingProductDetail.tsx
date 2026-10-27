"use client";
/* eslint-disable @next/next/no-img-element -- images are uploaded at runtime and served by the configured API host */

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { buildApiUrl, getApiBaseUrl } from "@/app/lib/client/api-url";
import { getStoredToken } from "@/app/lib/auth/token";
import { productTemplateApi } from "@/app/lib/client/product-template-api";

type ProductField = {
  id: number;
  label: string;
  fieldType: string;
  placeholder: string | null;
  options: string[] | null;
  isRequired: boolean;
  isEditable: boolean;
};

type PrintingProduct = {
  id: number;
  name: string;
  slug?: string;
  description: string | null;
  widthPx: number;
  heightPx: number;
  orientation: string;
  images: { id: number; imageUrl: string }[];
  fields: ProductField[];
};

function slugify(text: string): string {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function imageUrl(path: string) {
  return /^https?:\/\//i.test(path)
    ? path
    : `${getApiBaseUrl()}/${path.replace(/^\/+/, "")}`;
}

function isPhoneField(field: ProductField): boolean {
  const type = (field.fieldType || "").toLowerCase().trim();
  if (type === "phone" || type === "tel") return true;
  const label = (field.label || "").toLowerCase();
  return (
    label.includes("phone") ||
    label.includes("mobile") ||
    label.includes("whatsapp") ||
    label.includes("contact")
  );
}

function isEmailField(field: ProductField): boolean {
  const type = (field.fieldType || "").toLowerCase().trim();
  if (type === "email" || type === "mail") return true;
  const label = (field.label || "").toLowerCase();
  return (
    label.includes("email") ||
    label.includes("e-mail") ||
    /\bmail\b/i.test(label)
  );
}

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-primary-dark placeholder:text-slate-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-slate-100";

const labelClass = "block text-xs font-semibold text-primary-dark";

function LoadingSkeleton() {
  return (
    <main className="mt-24 min-h-[65vh] bg-slate-50 xl:mt-20" aria-busy="true">
      <div className="container mx-auto px-5 py-8 md:py-12">
        <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="space-y-5">
            <div className="h-[360px] w-full animate-pulse rounded-2xl bg-slate-200 sm:h-[420px] md:h-[480px]" />
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="aspect-square animate-pulse rounded-xl bg-slate-200" />
              ))}
            </div>
            <div className="h-44 animate-pulse rounded-2xl bg-slate-200" />
          </div>
          <div className="h-[480px] animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    </main>
  );
}

export default function PrintingProductDetail({ productId }: { productId: string }) {
  const [product, setProduct] = useState<PrintingProduct | null>(null);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const signedIn = Boolean(getStoredToken("user"));
  const productSlug = product?.slug || (product ? slugify(product.name) : productId);
  const returnTo = `/printing-products/${productSlug}`;

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(
          buildApiUrl(`/api/printing-products/${encodeURIComponent(productId)}`),
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Unable to load this printing product.");
        }
        if (!controller.signal.aborted) {
          setProduct(data.product);
          // If URL was accessed with numeric ID or unformatted slug, update browser URL to the title slug
          const targetSlug = data.product?.slug || (data.product?.name ? slugify(data.product.name) : "");
          if (targetSlug && typeof window !== "undefined") {
            const currentPath = window.location.pathname;
            if (currentPath.endsWith(`/${productId}`) && productId !== targetSlug) {
              window.history.replaceState(null, "", `/printing-products/${targetSlug}`);
            }
          }
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load this printing product."
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [productId]);

  function setValue(fieldId: number, value: string | boolean) {
    setValues((current) => ({ ...current, [String(fieldId)]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product || !signedIn || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await productTemplateApi.submitProductCustomization({
        templateId: product.id,
        quantity,
        values,
        files,
      });
      setSubmissionId(result.submissionId || result.submission?.id || null);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit your request."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function renderField(field: ProductField) {
    const key = String(field.id);
    const type = field.fieldType.toLowerCase();
    const id = `product-field-${field.id}`;
    const requiredMark = field.isRequired && (
      <span className="text-red-600" aria-hidden="true">
        {" "}*
      </span>
    );

    if (type === "checkbox") {
      return (
        <label
          key={field.id}
          htmlFor={id}
          className="col-span-1 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-primary/40 sm:col-span-2"
        >
          <input
            id={id}
            type="checkbox"
            required={field.isRequired}
            disabled={submitting}
            className="mt-0.5 h-5 w-5 shrink-0 accent-primary"
            checked={values[key] === true}
            onChange={(event) => setValue(field.id, event.target.checked)}
          />
          <span className="text-sm font-medium text-primary-dark">
            {field.label}
            {requiredMark}
          </span>
        </label>
      );
    }

    if (type === "radio") {
      return (
        <fieldset key={field.id} disabled={submitting} className="col-span-1 sm:col-span-2">
          <legend className={labelClass}>
            {field.label}
            {requiredMark}
          </legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {(field.options || []).map((option) => {
              const selected = values[key] === option;
              return (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                    selected
                      ? "border-primary bg-primary/5 font-semibold text-primary"
                      : "border-slate-300 bg-white text-primary-dark hover:border-primary/40"
                  }`}
                >
                  <input
                    type="radio"
                    name={id}
                    value={option}
                    required={field.isRequired}
                    checked={selected}
                    onChange={() => setValue(field.id, option)}
                    className="h-4 w-4 accent-primary"
                  />
                  {option}
                </label>
              );
            })}
          </div>
        </fieldset>
      );
    }

    const isPhone = isPhoneField(field);
    const isEmail = isEmailField(field);
    const isFullWidth = type === "textarea";

    return (
      <div key={field.id} className={isFullWidth ? "col-span-1 sm:col-span-2" : "col-span-1"}>
        <label htmlFor={id} className={labelClass}>
          {field.label}
          {requiredMark}
        </label>
        {type === "textarea" ? (
          <textarea
            id={id}
            required={field.isRequired}
            disabled={submitting}
            rows={4}
            placeholder={field.placeholder || ""}
            className={`${inputClass} resize-y`}
            value={String(values[key] || "")}
            onChange={(event) => setValue(field.id, event.target.value)}
          />
        ) : type === "dropdown" || type === "select" ? (
          <select
            id={id}
            required={field.isRequired}
            disabled={submitting}
            className={inputClass}
            value={String(values[key] || "")}
            onChange={(event) => setValue(field.id, event.target.value)}
          >
            <option value="">Select an option</option>
            {(field.options || []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : type === "file" ? (
          <>
            <input
              id={id}
              type="file"
              required={field.isRequired}
              disabled={submitting}
              className={`${inputClass} cursor-pointer p-2 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20`}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setFiles((current) => ({ ...current, [key]: file }));
              }}
            />
            {files[key] && (
              <p className="mt-1.5 truncate text-xs text-slate-500">
                Selected: {files[key].name}
              </p>
            )}
          </>
        ) : (
          <input
            id={id}
            type={
              isPhone
                ? "tel"
                : isEmail
                ? "email"
                : ["number", "date"].includes(type)
                ? type
                : "text"
            }
            inputMode={isPhone ? "numeric" : isEmail ? "email" : undefined}
            pattern={isPhone ? "[0-9]*" : undefined}
            maxLength={isPhone ? 12 : undefined}
            autoComplete={isEmail ? "email" : isPhone ? "tel" : undefined}
            required={field.isRequired}
            disabled={submitting}
            placeholder={field.placeholder || ""}
            className={inputClass}
            value={String(values[key] || "")}
            onKeyDown={
              isPhone
                ? (event) => {
                    if (
                      [
                        "Backspace",
                        "Delete",
                        "Tab",
                        "Escape",
                        "Enter",
                        "ArrowLeft",
                        "ArrowRight",
                        "ArrowUp",
                        "ArrowDown",
                        "Home",
                        "End",
                      ].includes(event.key) ||
                      ((event.ctrlKey || event.metaKey) &&
                        ["a", "c", "v", "x", "z"].includes(event.key.toLowerCase()))
                    ) {
                      return;
                    }
                    if (!/^[0-9]$/.test(event.key)) {
                      event.preventDefault();
                    }
                  }
                : undefined
            }
            onChange={(event) => {
              let val = event.target.value;
              if (isPhone) {
                val = val.replace(/\D/g, "").slice(0, 12);
              }
              setValue(field.id, val);
            }}
          />
        )}
      </div>
    );
  }

  if (loading) return <LoadingSkeleton />;

  const editableFields = product?.fields.filter((field) => field.isEditable) ?? [];

  return (
    <main className="mt-24 min-h-[65vh] bg-slate-50 xl:mt-20">
      <div className="container mx-auto px-5 py-8 md:py-12">
        <Link
          href="/printing-products"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5l-5 5 5 5" />
          </svg>
          Back to Printing Products
        </Link>

        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 7.5a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {!product && !error && (
          <div className="mt-10 rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-semibold text-primary-dark">Product not found</p>
            <p className="mt-2 text-slate-500">This product may have been removed.</p>
          </div>
        )}

        {product && (
          <div className="mt-6 space-y-6">
            {/* Product Title above both columns */}
            <div>
              <h1 className="text-2xl font-bold leading-tight text-primary-dark sm:text-3xl md:text-4xl">
                {product.name}
              </h1>
            </div>

            <div className="grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
              {/* Left: gallery + info */}
              <section className="space-y-5">
                {/* Product Image Container with increased size and broken image fallback */}
                <div className="relative flex h-[360px] sm:h-[420px] md:h-[480px] w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 sm:p-4 shadow-sm">
                {product.images[activeImage] && !imageError ? (
                  <img
                    src={imageUrl(product.images[activeImage].imageUrl)}
                    alt={product.name}
                    className="h-full w-full object-contain"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                    <svg
                      className="h-12 w-12 text-slate-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                      />
                    </svg>
                    <span className="text-sm font-medium">Preview not available</span>
                  </div>
                )}
              </div>

              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                  {product.images.map((image, index) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => {
                        setActiveImage(index);
                        setImageError(false);
                      }}
                      aria-label={`View image ${index + 1}`}
                      aria-pressed={activeImage === index}
                      className={`aspect-square overflow-hidden rounded-xl border bg-white p-2 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 ${
                        activeImage === index
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-slate-200 opacity-80 hover:border-primary/40 hover:opacity-100"
                      }`}
                    >
                      <img src={imageUrl(image.imageUrl)} alt="" className="h-full w-full object-contain" />
                    </button>
                  ))}
                </div>
              )}

              {/* Product Description & Specifications below Image */}
              <div className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
                <p className="whitespace-pre-wrap leading-relaxed text-slate-600 sm:text-base">
                  {product.description || "Contact our team for details about this printing product."}
                </p>
                <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 text-sm">
                  {product.widthPx > 0 && product.heightPx > 0 && (
                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                      <dt className="text-slate-500">Size</dt>
                      <dd className="mt-0.5 font-semibold text-primary-dark">
                        {product.widthPx} × {product.heightPx} px
                      </dd>
                    </div>
                  )}
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <dt className="text-slate-500">Orientation</dt>
                    <dd className="mt-0.5 font-semibold capitalize text-primary-dark">
                      {product.orientation}
                    </dd>
                  </div>
                </dl>
              </div>
            </section>

            {/* Right: request form (sticky on desktop) */}
            <section className="rounded-2xl bg-white p-6 shadow-sm md:p-8 lg:sticky lg:top-28">
              <h2 className="text-2xl font-semibold text-primary-dark">Add your details</h2>
              <p className="mt-2 text-sm text-primary-dark/65">
                Fill in the details below to request this product.
              </p>

              {submissionId ? (
                <div
                  role="status"
                  className="mt-6 rounded-xl border border-green-200 bg-green-50 p-6 text-center text-green-900"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 10.5l3.5 3.5L15 7" />
                    </svg>
                  </div>
                  <p className="mt-4 font-semibold">Request #{submissionId} submitted</p>
                  <p className="mt-1 text-sm text-green-800/80">We&apos;ll review it and get back to you.</p>
                  <Link
                    href="/order-history"
                    className="mt-5 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    View order history
                  </Link>
                </div>
              ) : !signedIn ? (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-primary-dark">
                    Sign in to submit request
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Please sign in or create an account to customize and submit your request for this product.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href={`/profile/sign-in?returnTo=${encodeURIComponent(returnTo)}`}
                      className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-primary/90"
                    >
                      Sign in
                    </Link>
                    <Link
                      href={`/profile/register?returnTo=${encodeURIComponent(returnTo)}`}
                      className="rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-primary-dark transition hover:border-slate-400 hover:bg-slate-50"
                    >
                      Create account
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={submit} className="mt-4 space-y-3.5">
                  {editableFields.length > 0 ? (
                    <div className="grid grid-cols-1 gap-x-3 gap-y-2.5 sm:grid-cols-2">
                      {editableFields.map(renderField)}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                      No additional details needed for this product. Choose a quantity and submit.
                    </p>
                  )}

                  <div>
                    <label htmlFor="product-quantity" className={labelClass}>
                      Quantity<span className="text-red-600" aria-hidden="true"> *</span>
                    </label>
                    <div className="mt-1 inline-flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        disabled={submitting || quantity <= 1}
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="h-10 w-10 text-lg text-primary-dark transition hover:bg-slate-100 disabled:opacity-40"
                      >
                        −
                      </button>
                      <input
                        id="product-quantity"
                        type="number"
                        min={1}
                        step={1}
                        required
                        disabled={submitting}
                        className="h-10 w-16 border-x border-slate-200 text-center text-sm font-semibold text-primary-dark outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        value={quantity}
                        onChange={(event) =>
                          setQuantity(Math.max(1, Number(event.target.value) || 1))
                        }
                      />
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        disabled={submitting}
                        onClick={() => setQuantity((q) => q + 1)}
                        className="h-10 w-10 text-lg text-primary-dark transition hover:bg-slate-100 disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting && (
                      <span
                        aria-hidden="true"
                        className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                      />
                    )}
                    {submitting ? "Submitting..." : "Submit request"}
                  </button>
                </form>
              )}
            </section>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
