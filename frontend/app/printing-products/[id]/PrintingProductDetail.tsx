"use client";
/* eslint-disable @next/next/no-img-element -- images are uploaded at runtime and served by the configured API host */

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { buildApiUrl, getApiBaseUrl } from "@/app/lib/client/api-url";
import { getStoredToken } from "@/app/lib/auth/token";
import { bannerTemplateApi } from "@/app/lib/client/banner-template-api";

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
  description: string | null;
  widthPx: number;
  heightPx: number;
  orientation: string;
  images: { id: number; imageUrl: string }[];
  fields: ProductField[];
};

function imageUrl(path: string) {
  return /^https?:\/\//i.test(path)
    ? path
    : `${getApiBaseUrl()}/${path.replace(/^\/+/, "")}`;
}

export default function PrintingProductDetail({ productId }: { productId: string }) {
  const [product, setProduct] = useState<PrintingProduct | null>(null);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const signedIn = Boolean(getStoredToken("user"));
  const returnTo = `/printing-products/${productId}`;

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(buildApiUrl(`/api/printing-products/${encodeURIComponent(productId)}`), {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load this printing product.");
        if (!controller.signal.aborted) setProduct(data.product);
      } catch (loadError) {
        if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : "Unable to load this printing product.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [productId]);

  function setValue(fieldId: number, value: string | boolean) {
    setValues(current => ({ ...current, [String(fieldId)]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product || !signedIn || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await bannerTemplateApi.submitBannerCustomization({
        templateId: product.id,
        quantity,
        values,
        files,
      });
      setSubmissionId(result.submissionId || result.submission?.id || null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit your request.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-slate-100";

  if (loading) return <main className="mt-24 min-h-[65vh] px-5 py-20 text-center text-slate-500 xl:mt-20">Loading product details...</main>;

  return <main className="mt-24 min-h-[65vh] bg-slate-50 xl:mt-20">
    <div className="container mx-auto px-5 py-10">
      <Link href="/printing-products" className="font-medium text-primary hover:underline">← Back to Printing Products</Link>
      {error && <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>}
      {product && <div className="mt-7 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-5">
          <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {product.images[activeImage] ? <img src={imageUrl(product.images[activeImage].imageUrl)} alt={product.name} className="h-full w-full object-contain" /> : <span className="text-slate-500">Preview not available</span>}
          </div>
          {product.images.length > 1 && <div className="grid grid-cols-4 gap-3">{product.images.map((image, index) => <button key={image.id} type="button" onClick={() => setActiveImage(index)} aria-label={`View image ${index + 1}`} aria-pressed={activeImage === index} className={`aspect-square overflow-hidden rounded-xl border bg-white p-2 ${activeImage === index ? "border-primary ring-2 ring-primary/20" : "border-slate-200"}`}><img src={imageUrl(image.imageUrl)} alt="" className="h-full w-full object-contain" /></button>)}</div>}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h1 className="text-3xl font-bold text-primary-dark md:text-4xl">{product.name}</h1>
            <p className="mt-4 whitespace-pre-wrap text-lg leading-8 text-primary-dark/70">{product.description || "Contact our team for details about this printing product."}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-sm text-slate-600">
              {product.widthPx > 0 && product.heightPx > 0 && <span className="rounded-full bg-slate-100 px-3 py-1">{product.widthPx} × {product.heightPx} px</span>}
              <span className="rounded-full bg-slate-100 px-3 py-1 capitalize">{product.orientation}</span>
            </div>
          </div>
        </section>

        <section className="h-fit rounded-2xl bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-2xl font-semibold text-primary-dark">Add your details</h2>
          <p className="mt-2 text-primary-dark/65">Complete the fields configured by the admin to request this product.</p>
          {submissionId ? <div role="status" className="mt-6 rounded-xl bg-green-50 p-5 text-green-800"><p>Your request{submissionId ? ` #${submissionId}` : ""} was submitted successfully.</p><Link href="/order-history" className="mt-3 inline-block font-semibold underline">Open order history</Link></div> : !signedIn ? <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900"><p>Please sign in before submitting product details.</p><div className="mt-4 flex flex-wrap gap-3"><Link href={`/profile/sign-in?returnTo=${encodeURIComponent(returnTo)}`} className="rounded-full bg-primary px-5 py-2.5 font-semibold text-white">Sign in</Link><Link href={`/profile/register?returnTo=${encodeURIComponent(returnTo)}`} className="rounded-full border border-primary px-5 py-2.5 font-semibold text-primary">Create account</Link></div></div> : <form onSubmit={submit} className="mt-6 space-y-5">
            {product.fields.filter(field => field.isEditable).map(field => {
              const key = String(field.id);
              const type = field.fieldType.toLowerCase();
              return <div key={field.id}>
                <label htmlFor={`product-field-${field.id}`} className="font-medium text-primary-dark">{field.label}{field.isRequired && <span className="text-red-600"> *</span>}</label>
                {type === "textarea" ? <textarea id={`product-field-${field.id}`} required={field.isRequired} disabled={submitting} rows={4} placeholder={field.placeholder || ""} className={inputClass} value={String(values[key] || "")} onChange={event => setValue(field.id, event.target.value)} />
                : type === "dropdown" || type === "select" || type === "radio" ? <select id={`product-field-${field.id}`} required={field.isRequired} disabled={submitting} className={inputClass} value={String(values[key] || "")} onChange={event => setValue(field.id, event.target.value)}><option value="">Select an option</option>{(field.options || []).map(option => <option key={option} value={option}>{option}</option>)}</select>
                : type === "checkbox" ? <input id={`product-field-${field.id}`} type="checkbox" required={field.isRequired} disabled={submitting} className="ml-3 h-5 w-5 align-middle accent-primary" checked={values[key] === true} onChange={event => setValue(field.id, event.target.checked)} />
                : type === "file" ? <input id={`product-field-${field.id}`} type="file" required={field.isRequired} disabled={submitting} className={inputClass} onChange={event => { const file = event.target.files?.[0]; if (file) setFiles(current => ({ ...current, [key]: file })); }} />
                : <input id={`product-field-${field.id}`} type={["email", "number", "date"].includes(type) ? type : type === "phone" ? "tel" : "text"} required={field.isRequired} disabled={submitting} placeholder={field.placeholder || ""} className={inputClass} value={String(values[key] || "")} onChange={event => setValue(field.id, event.target.value)} />}
              </div>;
            })}
            {!product.fields.some(field => field.isEditable) && <p className="rounded-xl bg-slate-50 p-4 text-slate-600">No additional fields are required for this product.</p>}
            <div><label htmlFor="product-quantity" className="font-medium text-primary-dark">Quantity *</label><input id="product-quantity" type="number" min={1} step={1} required disabled={submitting} className={inputClass} value={quantity} onChange={event => setQuantity(Math.max(1, Number(event.target.value) || 1))} /></div>
            <button type="submit" disabled={submitting} className="w-full rounded-full bg-primary px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "Submitting..." : "Submit product request"}</button>
          </form>}
        </section>
      </div>}
    </div>
  </main>;
}
