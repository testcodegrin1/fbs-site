"use client";

import { useEffect, useState, useRef, useId } from "react";
import { useParams } from "next/navigation";
import {
  ChevronDown,
  Flag,
  MoveVertical,
  CircleDot,
  Layers,
  FileImage,
  Home,
  Droplet,
  Wrench,
  Briefcase,
  Zap,
  Palette,
  Check,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import productDetailData from "../../../data/product-detail.json";
import { getProductFaqs, ProductFaqItem } from "../../../data/Product-faqs-data";
import Link from "next/link";
import FaqAccordion from "@/app/Components/FaqAccordion";

type PackageId = string;
type TabId = "description" | "spec" | "file-setup";

interface OptionItem {
  value: string;
  label: string;
}

interface OptionGroup {
  key: string; // raw JSON key, e.g. "graphic", "carryBag", "vehicleType"
  label: string; // human label, e.g. "Graphic", "Carry Bag", "Vehicle Type"
  options: OptionItem[];
}

interface GalleryItem {
  id: string;
  label: string;
  url?: string;
}

interface ProductData {
  slug: string;
  name: string;
  shortDescription: string;
  gallery: GalleryItem[];
  bullets: string[];
  packages: { id: PackageId; label: string }[];
  optionGroupsByPackage: Record<string, OptionGroup[]>;
  description: {
    paragraphs: string[];
    applications?: { title: string; content: string };
    extraNotes?: string[]; // e.g. Advertising Flags' Description.graphics
  };
  rawSpec: Record<string, any>;
  baseHardwareSpecifications?: any[];
  fileSetup: {
    requirements: string[];
    tips: string[];
  };
  faqs: ProductFaqItem[];
}

/* -------------------------------------------------------------- */
/*  Helpers: turn a raw JSON key into a human label                */
/* -------------------------------------------------------------- */

function labelizeKey(key: string): string {
  if (key.includes(" ")) {
    // Already spaced (e.g. "LED Light")  just make sure each word starts
    // with a capital, without touching existing acronyms like "LED".
    return key.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function pickGroupIcon(key: string) {
  const k = key.toLowerCase();
  if (k === "size") return MoveVertical;
  if (
    k.includes("graphic") ||
    k.includes("finish") ||
    k.includes("lamin") ||
    k.includes("panel")
  )
    return FileImage;
  if (k.includes("base") || k.includes("stake") || k.includes("mount"))
    return CircleDot;
  if (k.includes("bag") || k.includes("case")) return Briefcase;
  if (
    k.includes("led") ||
    k.includes("light") ||
    k.includes("illumin") ||
    k.includes("power") ||
    k.includes("display")
  )
    return Zap;
  if (k.includes("color") || k.includes("backing")) return Palette;
  if (k.includes("side")) return Layers;
  return Check;
}

/* -------------------------------------------------------------- */
/*  Map one raw product object (any of the 17 categories) into the  */
/*  generic ProductData shape                                       */
/* -------------------------------------------------------------- */

function mapRawToProductData(raw: any): ProductData {
  const variants: any[] = Array.isArray(raw.variants) ? raw.variants : [];

  const packages = variants.map((v, idx) => ({
    id: String(v?.productType?.id ?? idx),
    label: v?.productType?.name ?? `Option ${idx + 1}`,
  }));

  const optionGroupsByPackage: Record<string, OptionGroup[]> = {};
  variants.forEach((v, idx) => {
    const packageId = String(v?.productType?.id ?? idx);
    const groups: OptionGroup[] = [];
    Object.keys(v || {}).forEach((key) => {
      if (key === "productType") return;
      const arr = v[key];
      if (!Array.isArray(arr)) return;
      groups.push({
        key,
        label: labelizeKey(key),
        options: arr.map((item: any) => ({
          value: String(item?.id ?? item?.name ?? ""),
          label: item?.name ?? String(item?.id ?? ""),
        })),
      });
    });
    optionGroupsByPackage[packageId] = groups;
  });

  const descContent: string[] = Array.isArray(raw?.Description?.content)
    ? raw.Description.content
    : [];

  return {
    slug: raw?.slug ?? "",
    name: raw?.name ?? "Product",
    shortDescription: descContent[0] ?? "",
    gallery: [
      ...(raw?.images?.mainImage
        ? [
          {
            id: "main",
            label: "Main Image",
            url: raw.images.mainImage.startsWith("/")
              ? raw.images.mainImage
              : `/${raw.images.mainImage}`,
          },
        ]
        : []),
      ...(Array.isArray(raw?.images?.subImages)
        ? raw.images.subImages.map((img: string, i: number) => ({
          id: `sub-${i}`,
          label: `Image ${i + 1}`,
          url: img.startsWith("/") ? img : `/${img}`,
        }))
        : []),
    ],
    bullets: Array.isArray(raw?.features) ? raw.features : [],
    packages,
    optionGroupsByPackage,
    description: {
      paragraphs: descContent,
      applications: raw?.Description?.applications,
      extraNotes: Array.isArray(raw?.Description?.graphics)
        ? raw.Description.graphics
        : undefined,
    },
    rawSpec: raw?.spec ?? {},
    baseHardwareSpecifications: Array.isArray(raw?.baseHardwareSpecifications)
      ? raw.baseHardwareSpecifications
      : undefined,
    fileSetup: {
      requirements: Array.isArray(raw?.fileSetup?.requirements)
        ? raw.fileSetup.requirements
        : [],
      tips: Array.isArray(raw?.fileSetup?.additionalTips)
        ? raw.fileSetup.additionalTips
        : [],
    },
    faqs: getProductFaqs(raw?.slug ?? "")?.faqs ?? [],
  };
}

/* ================================================================== */
/*  Breadcrumbs                                                          */
/* ================================================================== */

function Breadcrumbs({ productName }: { productName: string }) {
  return (
    <>
      <p className="flex flex-wrap items-center justify-center gap-x-1 text-sm text-primary-dark/70 sm:text-base lg:justify-start lg:text-lg">
        <Link href="/" className="text-primary">
          Home
        </Link>
        <span className="mx-1">&gt;</span>
        <Link
          href="/services/signage"
          className="text-primary hover:underline"
        >
          Signage Services
        </Link>
        <span className="mx-1">&gt;</span>
        <span className="font-semibold text-primary-dark">{productName}</span>
      </p>
    </>
  );
}

/* ================================================================== */
/*  Component                                                            */
/* ================================================================== */

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [packageId, setPackageId] = useState<PackageId | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<TabId>("description");
  const [loaderDone, setLoaderDone] = useState(false);

  // making the product appear "mid-page" instead of starting fresh.
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // window.scrollTo call.
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0 });

      // @ts-expect-error - Lenis instance, if SmoothScroll attaches one
      const lenis = window.lenis;
      if (lenis?.scrollTo) {
        lenis.scrollTo(0, { immediate: true });
      }

      // @ts-expect-error - Locomotive Scroll instance, if used instead
      const locomotive = window.locomotiveScroll;
      if (locomotive?.scrollTo) {
        locomotive.scrollTo(0, { duration: 0, disableLerp: true });
      }
    };

    scrollToTop();
    const raf = requestAnimationFrame(scrollToTop);
    const timeout = setTimeout(scrollToTop, 100);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [params?.slug]);

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      setLoading(true);
      setError(null);
      try {
        const rawArray = Array.isArray(productDetailData)
          ? productDetailData
          : [productDetailData];
        const decodedSlug = decodeURIComponent(params?.slug || "");

        const raw =
          rawArray.find((item: any) => item.slug === decodedSlug) ||
          rawArray.find(
            (item: any) =>
              item.slug?.toLowerCase() === decodedSlug.toLowerCase(),
          ) ||
          rawArray[0];

        const data = mapRawToProductData(raw);
        if (cancelled) return;

        setProduct(data);
        setActiveImageId(data.gallery[0]?.id ?? null);

        const initialPackageId = data.packages[0]?.id ?? null;
        setPackageId(initialPackageId);

        const initialGroups = initialPackageId
          ? (data.optionGroupsByPackage[initialPackageId] ?? [])
          : [];
        const initialSelections: Record<string, string> = {};
        initialGroups.forEach((g) => {
          if (g.options[0]) initialSelections[g.key] = g.options[0].value;
        });
        setSelections(initialSelections);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load product data",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProduct();
    return () => {
      cancelled = true;
    };
  }, [params?.slug]);

  // Whenever the active package changes, re-seed `selections` so every
  // group key matches what THIS package actually offers  any leftover
  // key/value from a previous package that no longer applies is dropped,
  // and any option value that no longer exists in the new package's list
  // is reset to that group's first option.
  useEffect(() => {
    if (!product || !packageId) return;
    const groups = product.optionGroupsByPackage[packageId] ?? [];

    setSelections((prev) => {
      const next: Record<string, string> = {};
      groups.forEach((g) => {
        const stillValid = g.options.some((o) => o.value === prev[g.key]);
        next[g.key] = stillValid ? prev[g.key] : (g.options[0]?.value ?? "");
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageId, product]);

  if (loading) return <StateScreen kind="loading" />;
  if (error || !product)
    return <StateScreen kind="error" message={error ?? "Product not found"} />;

  const currentGroups: OptionGroup[] =
    (packageId && product.optionGroupsByPackage[packageId]) || [];

  const sizeGroup = currentGroups.find((g) => g.key.toLowerCase() === "size");
  const otherGroups = currentGroups.filter(
    (g) => g.key.toLowerCase() !== "size",
  );

  const activeImage =
    product.gallery.find((g) => g.id === activeImageId) ?? product.gallery[0];

  const tabs: { id: TabId; label: string }[] = [
    { id: "description", label: "Description" },
    { id: "spec", label: "Spec" },
    { id: "file-setup", label: "File Setup" },
  ];


  return (
    <>
      <div className="min-h-screen bg-white text-primary-dark">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 mt-24">
          <Breadcrumbs productName={product.name} />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mt-5">
            {/* -------------------------------------------------- */}
            {/* LEFT  Gallery                                       */}
            {/* -------------------------------------------------- */}
            <div className="lg:col-span-7">
              <div className="relative aspect-[4/5] sm:aspect-[16/11] lg:aspect-[16/12] w-full bg-primary-light/40 border border-primary-light rounded-sm flex items-center justify-center overflow-hidden">
                {activeImage?.url ? (
                  <img
                    src={activeImage.url}
                    alt={activeImage.label}
                    className="object-contain w-full h-full"
                  />
                ) : (
                  <Flag
                    className="h-16 w-16 sm:h-24 sm:w-24 text-primary"
                    strokeWidth={1.5}
                  />
                )}
              </div>

              {product.gallery.length > 1 && (
                <div className="mt-3 grid grid-cols-5 sm:grid-cols-9 gap-2">
                  {product.gallery.map((item) => {
                    const active = item.id === activeImageId;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveImageId(item.id)}
                        aria-label={item.label}
                        aria-pressed={active}
                        className={`aspect-square rounded-sm border bg-primary-light/40 flex items-center justify-center overflow-hidden transition-colors ${active
                          ? "border-primary ring-1 ring-primary"
                          : "border-primary-light hover:border-primary"
                          }`}
                      >
                        {item.url ? (
                          <img
                            src={item.url}
                            alt={item.label}
                            className="object-contain w-full h-full"
                          />
                        ) : (
                          <Flag
                            className="h-5 w-5 text-primary"
                            strokeWidth={1.5}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <FeatureGrid bullets={product.bullets} />
            </div>

            {/* -------------------------------------------------- */}
            {/* RIGHT  Buy box                                      */}
            {/* -------------------------------------------------- */}
            <div className="lg:col-span-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Product Details
              </p>
              <h1 className="mt-1.5 text-2xl sm:text-[28px] font-bold text-primary-dark">
                {product.name}
              </h1>
              <p className="mt-3 text-sm sm:text-[14px] leading-relaxed text-primary-dark/70">
                {product.shortDescription}
              </p>

              <div className="mt-6 border-2 rounded-2xl p-3 shadow-xl border-primary-light pt-6 space-y-6">
                {/* What's included  only shown if there's more than one package */}
                {product.packages.length > 1 && (
                  <div>
                    <p className="text-sm font-semibold text-primary-dark mb-2.5">
                      What&apos;s included
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {product.packages.map((p) => {
                        const active = p.id === packageId;
                        return (
                          <button
                            key={p.id}
                            onClick={() => setPackageId(p.id)}
                            aria-pressed={active}
                            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${active
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-primary-light text-primary-dark/80 hover:border-primary"
                              }`}
                          >
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Size  rendered as a prominent button grid if this
                  package defines a "size" group; otherwise skipped
                  entirely (e.g. Vehicle Wraps uses "vehicleType" instead,
                  which just shows up below as a normal dropdown) */}
                {sizeGroup && (
                  <div>
                    <p className="text-sm font-semibold text-primary-dark mb-2.5">
                      {sizeGroup.label}
                    </p>
                    <div
                      className={`grid gap-2.5 ${sizeGroup.options.length > 3
                        ? "grid-cols-4"
                        : "grid-cols-2"
                        }`}
                    >
                      {sizeGroup.options.map((opt) => {
                        const active =
                          selections[sizeGroup.key] === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() =>
                              setSelections((prev) => ({
                                ...prev,
                                [sizeGroup.key]: opt.value,
                              }))
                            }
                            aria-pressed={active}
                            className={`rounded-lg border px-2 py-2.5 text-center transition-colors ${active
                              ? "border-primary bg-primary/5"
                              : "border-primary-light hover:border-primary"
                              }`}
                          >
                            <span
                              className={`block text-sm font-semibold ${active ? "text-primary" : "text-primary-dark"}`}
                            >
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Every other option group this package defines, each as
                  its own dropdown  Graphic, Base, Carry Bag, Finish,
                  Coverage, LED Light, Illumination, whatever applies */}
                {otherGroups.map((group) => {
                  const Icon = pickGroupIcon(group.key);
                  return (
                    <FieldSelect
                      key={group.key}
                      icon={<Icon className="h-3.5 w-3.5" />}
                      label={group.label}
                      value={selections[group.key] ?? ""}
                      onChange={(value) =>
                        setSelections((prev) => ({ ...prev, [group.key]: value }))
                      }
                      options={group.options}
                    />
                  );
                })}

                {/* ── Quote Request Form ── */}
                <SignageQuoteForm
                  productName={product.name}
                  selections={selections}
                  currentGroups={currentGroups}
                  activePackageLabel={
                    product.packages.find((p) => p.id === packageId)?.label
                  }
                />
              </div>
            </div>
          </div>

          {/* -------------------------------------------------- */}
          {/* Tabs                                                 */}
          {/* -------------------------------------------------- */}
          <div className="mt-10 sm:mt-12">
            <div className="border-b border-primary-light">
              <nav
                className="flex gap-6 sm:gap-8 min-w-max px-0.5"
                aria-label="Product information tabs"
              >
                {tabs.map((tab) => {
                  const active = tab.id === activeTab;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      aria-selected={active}
                      className={`relative py-3 text-sm sm:text-[15px] font-medium whitespace-nowrap transition-colors ${active
                        ? "text-primary"
                        : "text-primary-dark/60 hover:text-primary-dark"
                        }`}
                    >
                      {tab.label}
                      {active && (
                        <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-primary" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="py-6 sm:py-8">
              {activeTab === "description" && (
                <DescriptionTab data={product.description} />
              )}
              {activeTab === "spec" && (
                <SpecTab
                  spec={product.rawSpec}
                  baseHardware={product.baseHardwareSpecifications}
                />
              )}
              {activeTab === "file-setup" && (
                <FileSetupTab data={product.fileSetup} />
              )}
            </div>
          </div>
        </main>

        {/* -------------------------------------------------- */}
        {/* FAQs  its own full-width section, visually separated   */}
        {/* from the tabs above via background + spacing            */}
        {/* -------------------------------------------------- */}
        <section className="border-t border-primary-light bg-primary-light/60 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FaqsTab faqs={product.faqs} productName={product.name} />
          </div>
        </section>
      </div>
    </>
  );
}

/* ================================================================== */
/*  Loading / error state screen                                        */
/* ================================================================== */

function StateScreen({
  kind,
  message,
}: {
  kind: "loading" | "error";
  message?: string;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-6">
      {kind === "loading" ? (
        <>
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
          <p className="text-sm text-primary-dark/60">Loading product details…</p>
        </>
      ) : (
        <>
          <AlertTriangle className="h-6 w-6 text-primary" />
          <p className="text-sm font-medium text-primary-dark">
            Couldn&apos;t load product details
          </p>
          <p className="text-sm text-primary-dark/60">{message}</p>
        </>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Buy box helpers                                                      */
/* ================================================================== */

function FieldSelect({
  icon,
  label,
  value,
  onChange,
  options,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: OptionItem[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (options.length === 0) return null;

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary-dark">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </span>
        {label}
      </label>

      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full flex items-center justify-between
            rounded-lg border bg-white px-4 py-3
            text-sm font-medium text-primary-dark transition-colors
            focus:outline-none
            ${isOpen ? "border-primary" : "border-primary-light hover:border-primary"}
          `}
        >
          <span>{selectedOption?.label}</span>
          <ChevronDown
            className={`h-5 w-5 text-primary-dark/45 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 z-10 mt-1 overflow-hidden rounded-lg border border-primary-light bg-white shadow-xl">
            <ul className="max-h-60 overflow-auto p-1.5 text-sm text-primary-dark flex flex-col gap-0.5">
              {options.map((option) => (
                <li
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`
                    cursor-pointer rounded-md px-3 py-2 transition-colors text-left
                    ${option.value === value ? "bg-primary/10 text-primary font-semibold" : "text-primary-dark hover:bg-primary-light/70"}
                  `}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function pickFeatureIcon(text: string) {
  const t = text.toLowerCase();
  if (t.includes("indoor") || t.includes("outdoor")) return Home;
  if (t.includes("sided")) return Layers;
  if (
    t.includes("polyester") ||
    t.includes("mesh") ||
    t.includes("sublimat") ||
    t.includes("fabric")
  )
    return Droplet;
  if (t.includes("pole") || t.includes("frame") || t.includes("aluminum"))
    return Wrench;
  if (t.includes("base") || t.includes("stake")) return CircleDot;
  if (t.includes("carry") || t.includes("bag") || t.includes("case"))
    return Briefcase;
  if (t.includes("led") || t.includes("light") || t.includes("illumin"))
    return Zap;
  return Check;
}

function FeatureGrid({ bullets }: { bullets: string[] }) {
  if (bullets.length === 0) return null;
  return (
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {bullets.map((b) => {
        const Icon = pickFeatureIcon(b);
        return (
          <div
            key={b}
            className="flex items-start gap-3 rounded-lg border border-primary-light bg-primary-light/40 p-3"
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </span>
            <span className="pt-1 text-sm leading-snug text-primary-dark/80">{b}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ================================================================== */
/*  Description tab  generic: paragraphs + optional applications +     */
/*  optional extra notes (e.g. Advertising Flags' per-graphic details)  */
/* ================================================================== */

function DescriptionTab({
  data,
}: {
  data: {
    paragraphs: string[];
    applications?: { title: string; content: string };
    extraNotes?: string[];
  };
}) {
  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold text-primary-dark">Description</h2>

      {data.paragraphs.map((p, i) => (
        <p
          key={i}
          className="mt-3 text-sm sm:text-[15px] leading-relaxed text-primary-dark/80"
        >
          {p}
        </p>
      ))}

      {data.extraNotes && data.extraNotes.length > 0 && (
        <ul className="mt-4 space-y-2.5">
          {data.extraNotes.map((note, i) => (
            <li
              key={i}
              className="text-sm sm:text-[14px] leading-relaxed text-primary-dark/80 flex items-start gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"></span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      )}

      {data.applications && (
        <>
          <h3 className="mt-6 text-sm font-semibold text-primary-dark">
            {data.applications.title}
          </h3>
          <p className="mt-1.5 text-sm sm:text-[15px] leading-relaxed text-primary-dark/80">
            {data.applications.content}
          </p>
        </>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Spec tab  fully generic renderer over whatever raw.spec contains   */
/* ================================================================== */

function isPlainObject(v: any) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/* ---------------------------------------------------------------- */
/*  Special-case renderer for spec.sizeSpecification                  */
/*  (used by Advertising Flags  a curved flag-height diagram + a      */
/*  proper comparison table, instead of the generic card grid every   */
/*  other spec section gets)                                          */
/* ---------------------------------------------------------------- */

function abbreviateSizeLabel(label: string): string {
  const known: Record<string, string> = {
    "X-Large": "XL",
    Large: "L",
    Medium: "M",
    Small: "S",
  };
  return known[label] ?? label.charAt(0).toUpperCase();
}

function SizeSpecificationBlock({
  table,
  image,
}: {
  table: any[];
  image?: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const columns = Object.keys(table[0]).filter((k) => k !== "size");
  const rows = table.map((row) => ({
    ...row,
    _abbrev: abbreviateSizeLabel(row.size),
    _heightFt: parseFloat(String(row.assembledHeight)) || 0,
  }));
  const ascendingRows = [...rows].sort((a, b) => a._heightFt - b._heightFt);

  const showRealImage = !!image && !imgFailed;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
      <div className="lg:col-span-5">
        {showRealImage ? (
          <img
            src={image}
            alt="Size Specification Diagram"
            onError={() => setImgFailed(true)}
            className="w-full max-h-[260px] h-auto rounded-sm border border-primary-light bg-primary-light/40 object-contain p-2"
          />
        ) : (
          <div className="w-full h-auto min-h-[300px] bg-primary-light/40 flex items-center justify-center text-sm text-primary-dark/45 border border-primary-light rounded-2xl">
            No diagram available
          </div>
        )}
      </div>

      <div className="lg:col-span-7 overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[560px] border border-primary-light">
          <thead>
            <tr className="bg-primary-light/40 border-b border-primary-light">
              <th className="text-center font-semibold text-primary-dark py-2.5 px-3 border-r border-primary-light">
                Size
              </th>
              {columns.map((col) => (
                <th
                  key={col}
                  className="text-center font-semibold text-primary-dark py-2.5 px-3 border-r border-primary-light last:border-r-0 whitespace-nowrap"
                >
                  {labelizeKey(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ascendingRows.map((row) => (
              <tr
                key={row.size}
                className="border-b border-primary-light last:border-b-0"
              >
                <td className="py-3 px-3 text-center font-semibold text-primary-dark border-r border-primary-light whitespace-nowrap">
                  {row._abbrev}
                </td>
                {columns.map((col) => (
                  <td
                    key={col}
                    className={`py-3 px-3 text-center border-r border-primary-light last:border-r-0 whitespace-nowrap ${col === "assembledHeight"
                      ? "text-primary font-medium"
                      : "text-primary-dark/80"
                      }`}
                  >
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Renders any value found inside raw.spec: strings, arrays of strings,
// arrays of objects (rendered as small cards), or nested objects
// (rendered as a labeled sub-block, recursively).
function SpecValue({ nodeKey, value }: { nodeKey: string; value: any }) {
  if (value == null || value === "") return null;

  // A string whose key mentions "image" is rendered as an image instead
  // of raw text (e.g. spec.sizeSpecification.image).
  if (typeof value === "string") {
    if (nodeKey.toLowerCase().includes("image")) {
      return (
        <img
          src={value}
          alt={labelizeKey(nodeKey)}
          className="w-full max-w-md h-auto rounded-lg border border-primary-light bg-primary-light/40"
        />
      );
    }
    return <p className="text-sm text-primary-dark/80">{value}</p>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return null;

    // Array of plain strings -> bullet list
    if (value.every((v) => typeof v === "string")) {
      return (
        <ul className="space-y-1.5">
          {value.map((v, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-primary-dark/80"
            >
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
              {v}
            </li>
          ))}
        </ul>
      );
    }

    // Array of objects -> card grid (covers size tables, weight lists,
    // baseHardwareSpecifications entries, etc. uniformly)
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {value.map((item, i) => (
          <div
            key={i}
            className="border border-primary-light rounded-lg p-3 bg-white"
          >
            {Object.entries(item).map(([k, v]) => (
              <SpecEntry
                key={k}
                label={labelizeKey(k)}
                nodeKey={k}
                value={v}
                compact
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (isPlainObject(value)) {
    return (
      <div className="space-y-2 border border-primary-light rounded-lg p-3 bg-white">
        {Object.entries(value).map(([k, v]) => (
          <SpecEntry key={k} label={labelizeKey(k)} nodeKey={k} value={v} />
        ))}
      </div>
    );
  }

  return <p className="text-sm text-primary-dark/80">{String(value)}</p>;
}

function SpecEntry({
  label,
  nodeKey,
  value,
  compact = false,
}: {
  label: string;
  nodeKey: string;
  value: any;
  compact?: boolean;
}) {
  if (value == null || value === "") return null;

  if (typeof value === "string" && !nodeKey.toLowerCase().includes("image")) {
    return (
      <p
        className={compact ? "text-xs text-primary-dark/80" : "text-sm text-primary-dark/80"}
      >
        <span className="font-medium text-primary-dark">{label}:</span> {value}
      </p>
    );
  }

  return (
    <div className={compact ? "mt-1" : "mt-1.5"}>
      <p
        className={`font-medium text-primary-dark ${compact ? "text-xs" : "text-sm"}`}
      >
        {label}
      </p>
      <div className="mt-1">
        <SpecValue nodeKey={nodeKey} value={value} />
      </div>
    </div>
  );
}

function SpecTab({
  spec,
  baseHardware,
}: {
  spec: Record<string, any>;
  baseHardware?: any[];
}) {
  const entries = Object.entries(spec || {}).filter(([k]) => k !== "title");

  return (
    <div>
      <h2 className="text-lg font-semibold text-primary-dark">Spec</h2>

      {entries.length === 0 && (
        <p className="mt-3 text-sm text-primary-dark/60">
          No specifications available for this product yet.
        </p>
      )}

      <div className="mt-5 space-y-8">
        {entries.map(([key, value]) => {
          const isSizeSpec =
            key === "sizeSpecification" &&
            isPlainObject(value) &&
            Array.isArray(value.table) &&
            value.table.length > 0 &&
            value.table[0]?.size &&
            value.table[0]?.assembledHeight;

          return (
            <div key={key}>
              {!isSizeSpec && (
                <h3 className="text-sm font-semibold text-primary-dark">
                  {labelizeKey(key)}
                </h3>
              )}
              {isSizeSpec ? (
                <>
                  <p className="text-sm text-primary-dark/60 -mt-1 mb-2.5">
                    Size &amp; Specifications
                  </p>
                  <SizeSpecificationBlock
                    table={value.table}
                    image={value.image}
                  />
                </>
              ) : (
                <div className="mt-2.5">
                  <SpecValue nodeKey={key} value={value} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {baseHardware && baseHardware.length > 0 && (
        <div className="mt-10">
          <h3 className="text-sm font-semibold text-primary-dark">
            Base Hardware Specifications
          </h3>
          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {baseHardware.map((b) => (
              <div
                key={b.id}
                className="border border-primary-light rounded-sm overflow-hidden"
              >
                <div className="aspect-square bg-primary-light/40 flex items-center justify-center">
                  {b.image ? (
                    <img
                      src={b.image.startsWith("/") ? b.image : `/${b.image}`}
                      alt={b.name}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <BaseIcon id={b.id} />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-primary-dark">
                    {b.name}
                  </p>
                  <div className="mt-1.5 space-y-1 text-xs text-primary-dark/70">
                    {b.specifications &&
                      Object.entries(b.specifications).map(([k, v]) => (
                        <p key={k}>
                          {labelizeKey(k)}: {String(v)}
                        </p>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BaseIcon({ id }: { id: string }) {
  const iconProps = { className: "h-8 w-8 text-primary-dark/45" };
  switch (id) {
    case "ground_stake":
      return <MoveVertical {...iconProps} />;
    case "cross_base":
      return <Layers {...iconProps} />;
    case "water_bag":
      return <CircleDot {...iconProps} />;
    case "square_base":
      return <div className="h-8 w-8 rounded-sm bg-primary-light" />;
    default:
      return <CircleDot {...iconProps} />;
  }
}

/* ================================================================== */
/*  File Setup tab                                                       */
/* ================================================================== */

function FileSetupTab({
  data,
}: {
  data: { requirements: string[]; tips: string[] };
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-primary-dark">File Setup</h2>

      {data.requirements.length > 0 && (
        <ul className="mt-4 space-y-2 max-w-3xl">
          {data.requirements.map((r) => (
            <li
              key={r}
              className="flex items-start gap-2 text-sm text-primary-dark/80"
            >
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
              {r}
            </li>
          ))}
        </ul>
      )}

      {data.tips.length > 0 && (
        <>
          <h3 className="mt-6 text-sm font-semibold text-primary-dark">
            Additional Tips
          </h3>
          <ul className="mt-2 space-y-2 max-w-3xl">
            {data.tips.map((t) => (
              <li
                key={t}
                className="flex items-start gap-2 text-sm text-primary-dark/80"
              >
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/* ================================================================== */
/*  FAQs Tab  accordion for product-specific FAQs                      */
/* ================================================================== */

function FaqsTab({
  faqs,
  productName,
}: {
  faqs: ProductFaqItem[];
  productName: string;
}) {
  if (!faqs || faqs.length === 0) return null;

  return (
    <div>
      <h2 className="text-2xl font-extrabold text-primary-dark sm:text-3xl md:text-4xl mb-3">
        FAQs for {productName}
      </h2>
      <p className="text-sm text-primary-dark/70 sm:text-base mb-8">
        Clear answers for common questions about our {productName.toLowerCase()}.
      </p>

      <FaqAccordion
        items={faqs}
        name={`signage-detail-faq-${productName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
      />
    </div>
  );
}

/* ==================================================================
/*  Signage Quote Form (Web3Forms)                                      */
/* ================================================================== */

const W3F_API_DOMAIN = ["api", "web3forms", "com"].join(".");
const W3F_SUBMIT_PATH = "/submit";
const W3F_ENDPOINT = `https://${W3F_API_DOMAIN}${W3F_SUBMIT_PATH}`;
const W3F_ACCESS_KEY =
  process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY ?? "YOUR_WEB3FORMS_ACCESS_KEY";

type QuoteState =
  | { type: "idle" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

function SignageQuoteForm({
  productName,
  selections,
  currentGroups,
  activePackageLabel,
}: {
  productName: string;
  selections: Record<string, string>;
  currentGroups: OptionGroup[];
  activePackageLabel?: string;
}) {
  const formId = useId();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [state, setState] = useState<QuoteState>({ type: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;

    // Honeypot
    const bot = form.elements.namedItem("botcheck") as HTMLInputElement | null;
    if (bot?.checked) return;

    if (W3F_ACCESS_KEY === "YOUR_WEB3FORMS_ACCESS_KEY") {
      setState({ type: "error", message: "Web3Forms access key is not configured." });
      return;
    }

    const fd = new FormData(form);

    // Normalise phone
    const rawPhone = (fd.get("phone") as string)?.trim() ?? "";
    if (rawPhone) {
      fd.set("phone", rawPhone.startsWith("+1") ? rawPhone : `+1 ${rawPhone}`);
    }

    fd.append("access_key", W3F_ACCESS_KEY);
    fd.append("subject", `Signage Quote: ${productName}`);
    fd.append("from_name", "FBS Prints \u2014 Signage Quote");
    fd.append("replyto", (fd.get("email") as string)?.trim() ?? "");

    // Inject product + all selected options
    fd.append("Product", productName);
    if (activePackageLabel) fd.append("Package", activePackageLabel);
    currentGroups.forEach((g) => {
      const selectedValue = selections[g.key];
      const selectedLabel =
        g.options.find((o) => o.value === selectedValue)?.label ?? selectedValue;
      fd.append(g.label, selectedLabel ?? "");
    });

    setIsSubmitting(true);
    setState({ type: "idle" });

    try {
      const res = await fetch(W3F_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: fd,
      });
      const json = (await res.json()) as {
        success?: boolean;
        message?: string;
        body?: { message?: string };
      };
      const msg = json.body?.message ?? json.message ?? "Something went wrong.";

      if (res.ok && json.success) {
        form.reset();
        setState({ type: "success", message: msg });
      } else {
        setState({ type: "error", message: msg });
      }
    } catch {
      setState({ type: "error", message: "Unable to send. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="border-t border-primary-light pt-6">
      <p className="text-sm font-semibold text-primary-dark mb-3">
        Request a Quote
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Honeypot */}
        <input
          type="checkbox"
          name="botcheck"
          className="hidden"
          style={{ display: "none" }}
          tabIndex={-1}
          autoComplete="off"
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor={`${formId}-name`}
              className="mb-1 block text-xs font-medium text-primary-dark/60"
            >
              Full Name *
            </label>
            <input
              id={`${formId}-name`}
              name="name"
              type="text"
              required
              placeholder="John Doe"
              autoComplete="name"
              className="w-full rounded-xl border border-primary-light bg-white px-4 py-3 text-sm text-primary-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div>
            <label
              htmlFor={`${formId}-phone`}
              className="mb-1 block text-xs font-medium text-primary-dark/60"
            >
              Phone *
            </label>
            <div className="flex items-center rounded-xl border border-primary-light bg-white transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
              <span className="pl-4 text-sm text-primary-dark/45 font-medium select-none pr-1.5">+1</span>
              <input
                id={`${formId}-phone`}
                name="phone"
                type="tel"
                required
                placeholder="(555) 123-4567"
                autoComplete="tel"
                className="w-full bg-transparent pl-1.5 pr-4 py-3 text-sm text-primary-dark outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor={`${formId}-email`}
            className="mb-1 block text-xs font-medium text-primary-dark/60"
          >
            Email *
          </label>
          <input
            id={`${formId}-email`}
            name="email"
            type="email"
            required
            placeholder="you@company.com"
            autoComplete="email"
            className="w-full rounded-xl border border-primary-light bg-white px-4 py-3 text-sm text-primary-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>

        <div>
          <label
            htmlFor={`${formId}-message`}
            className="mb-1 block text-xs font-medium text-primary-dark/60"
          >
            Additional Notes
          </label>
          <textarea
            id={`${formId}-message`}
            name="message"
            rows={3}
            placeholder="Quantity, dimensions, design details…"
            className="w-full rounded-xl border border-primary-light bg-white px-4 py-3 text-sm text-primary-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none"
          />
        </div>

        {/* Status */}
        {state.type !== "idle" && (
          <p
            aria-live="polite"
            className={`text-sm font-medium ${state.type === "success" ? "text-green-600" : "text-red-600"
              }`}
          >
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Sending…
            </>
          ) : (
            <>Request a Quote</>
          )}
        </button>

        <p className="text-center text-[11px] text-primary-dark/45">
          Or call us at{" "}
          <a href="tel:+18552221133" className="font-semibold text-primary hover:underline">
            +1-855-222-1133
          </a>
        </p>
      </form>
    </div>
  );
}
