import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import * as LucideIcons from "lucide-react";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Layers,
  Mail,
  Package,
  Sparkles,
  Tag,
} from "lucide-react";
import FaqAccordion from "@/app/Components/FaqAccordion";
import rawData from "../../../data/direct-mailing.json";
import {
  absoluteUrl,
  buildAreaServedSchema,
  buildBreadcrumbSchema,
  buildFaqSchema,
  organizationId,
  siteConfig,
  toAbsoluteImageUrl,
} from "@/app/lib/seo";
import { getRequestBaseUrl } from "@/app/lib/request-url";

/* ---------------------------------------------------------------------- */
/*  Types                                                                  */
/* ---------------------------------------------------------------------- */

interface FormatSpec {
  label: string;
  value: string;
}

interface FormatFaq {
  question: string;
  answer: string;
}

interface MailFormat {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  img: string;
  detailsLabel: string;
  detailsValue: string;
  specs: FormatSpec[];
  bestFor: string[];
  tags: string[];
  paperStock: string[];
  printSides: string;
  finishingOptions: string[];
  mailClass: string[];
  turnaround: string;
  minQuantity: number;
  priceTier: string;
  designServiceAvailable: boolean;
  mailingListServiceAvailable: boolean;
  faqs: FormatFaq[];
  relatedFormats: string[];
}

interface DirectMailData {
  section: {
    eyebrow: string;
    title: string;
    description: string;
    sourceUrl: string;
  };
  formats: MailFormat[];
}

const data = rawData as DirectMailData;

/* ---------------------------------------------------------------------- */
/*  Inline data helpers (no separate lib file)                             */
/* ---------------------------------------------------------------------- */

function getAllFormats(): MailFormat[] {
  return data.formats;
}

function getFormatBySlug(slug: string): MailFormat | undefined {
  return data.formats.find((format) => format.slug === slug);
}

function getRelatedFormats(format: MailFormat): MailFormat[] {
  return getAllFormats().filter((item) => item.slug !== format.slug);
}

/* ---------------------------------------------------------------------- */
/*  Icon resolver                                                          */
/* ---------------------------------------------------------------------- */

function resolveIcon(iconName: string) {
  const IconComponent = (
    LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>
  )[iconName];
  return IconComponent ?? Mail;
}

/* ---------------------------------------------------------------------- */
/*  Static params + metadata                                               */
/* ---------------------------------------------------------------------- */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllFormats().map((format) => ({ slug: format.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const format = getFormatBySlug(slug);
  if (!format) {
    return {
      title: "Direct Mail Format | FBS Prints",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const baseUrl = await getRequestBaseUrl();
  const canonical = absoluteUrl(`/services/direct-mailing/${format.slug}`, baseUrl);
  const image = toAbsoluteImageUrl(format.img, baseUrl);

  return {
    title: `${format.title} | Direct Mail Formats | FBS Signs`,
    description: format.description,
    alternates: {
      canonical,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url: canonical,
      siteName: siteConfig.name,
      title: format.title,
      description: format.description,
      images: [{ url: image, width: 1200, height: 630, alt: format.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: format.title,
      description: format.description,
      images: [image],
    },
  };
}

/* ---------------------------------------------------------------------- */
/*  Copy helpers                                                           */
/* ---------------------------------------------------------------------- */

function buildHeroCaption(format: MailFormat): string {
  return format.bestFor[0] ?? `Built for ${format.title.toLowerCase()}`;
}

function buildWhyItMattersCopy(format: MailFormat): string {
  const stock = format.paperStock[0]?.toLowerCase() ?? "premium stock";
  const mailClass = format.mailClass[0];
  return `${format.title} built on ${stock} hold up in the mailbox and in the hand, which matters more than most people expect  a flimsy piece reads as a flimsy brand. We produce every run on ${mailClass} timelines your campaign can actually plan around, with a ${format.turnaround.toLowerCase()} turnaround so a seasonal push doesn't stall in production. Because everything is printed and finished in-house, changes to quantity, stock, or finishing don't mean starting the quote over.`;
}

// Short, single-line "What's included" statements.
function buildIncludedItems(format: MailFormat): string[] {
  const items: string[] = [];

  format.bestFor.forEach((item) => {
    items.push(`Purpose-built for ${item.toLowerCase()}`);
  });

  items.push(
    `${format.printSides} on ${format.paperStock[0]?.toLowerCase() ?? "premium stock"}`,
  );

  format.finishingOptions.forEach((option) => {
    items.push(`${option} finishing available`);
  });

  if (format.designServiceAvailable) {
    items.push("In-house design service, start to finish");
  }
  if (format.mailingListServiceAvailable) {
    items.push("Mailing list sourcing and targeting included");
  }

  return items.slice(0, 6);
}

/* ---------------------------------------------------------------------- */
/*  Page                                                                    */
/* ---------------------------------------------------------------------- */

export default async function DirectMailFormatPage({ params }: PageProps) {
  const { slug } = await params;
  const format = getFormatBySlug(slug);
  if (!format) notFound();

  const baseUrl = await getRequestBaseUrl();
  const canonical = absoluteUrl(`/services/direct-mailing/${format.slug}`, baseUrl);
  const image = toAbsoluteImageUrl(format.img, baseUrl);

  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: "Home", path: "/" },
      { name: "Direct Mailing", path: "/services/direct-mailing" },
      { name: format.title, path: `/services/direct-mailing/${format.slug}` },
    ],
    canonical,
    baseUrl,
  );

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${canonical}#service`,
    name: format.title,
    serviceType: "Direct Mail Format",
    description: format.description,
    url: canonical,
    image,
    provider: {
      "@id": organizationId(baseUrl),
    },
    areaServed: buildAreaServedSchema(),
  };

  const faqSchema = format.faqs.length > 0
    ? buildFaqSchema(`${canonical}#faq`, format.faqs)
    : null;

  const related = getRelatedFormats(format);
  const includedItems = buildIncludedItems(format);
  const badge = format.tags[0]
    ? format.tags[0].toUpperCase()
    : "PRODUCTION FORMAT";

  return (
    <main className="bg-white mt-16">
      <Script
        id={`direct-mail-breadcrumb-${format.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id={`direct-mail-service-${format.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      {faqSchema ? (
        <Script
          id={`direct-mail-faq-${format.slug}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      ) : null}
      {/* ============================================================ */}
      {/* SECTION 1  HERO                                              */}
      {/* ============================================================ */}
      <section className="mt-24 xl:mt-20">
        <div className="container">
          {/* Breadcrumb */}
          <p className="text-primary-dark/70 text-base sm:text-lg mb-8">
            <Link href="/" className="text-primary font-medium">
              Home
            </Link>
            <span className="mx-2">&gt;</span>
            <Link
              href="/services/direct-mailing"
              className="text-primary font-medium"
            >
              Direct Mailing
            </Link>
            <span className="mx-2">&gt;</span>
            <span className="text-primary-dark font-semibold">{format.title}</span>
          </p>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            {/* LEFT: image with floating caption + tags */}
            <div>
              <div className="relative w-full aspect-[4/3.2] rounded-3xl overflow-hidden shadow-xl">
                <Image
                  src={format.img}
                  alt={`${format.title} visual`}
                  fill
                  sizes="(min-width: 1024px) 45vw, 90vw"
                  className="object-cover"
                  priority
                />

                {/* Floating caption card, positioned over the image */}
                <div className="absolute bottom-5 left-5 right-5 sm:right-auto sm:max-w-md bg-white rounded-2xl shadow-lg px-5 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-primary-dark font-semibold text-sm sm:text-base leading-snug">
                    {buildHeroCaption(format)}
                  </p>
                </div>
              </div>

              {/* Tag pills */}
              <div className="flex flex-wrap gap-2 mt-5">
                {format.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-4 py-1.5 rounded-full bg-primary-light text-primary text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* RIGHT: content */}
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary-light text-primary text-xs sm:text-sm font-bold tracking-wide mb-5">
                {badge}
              </span>

              <h1 className="font-extrabold leading-tight tracking-tight text-4xl sm:text-5xl md:text-6xl mb-6">
                <span className="bg-linear-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                  {format.title}
                </span>
              </h1>

              <p className="text-primary-dark/70 text-base sm:text-lg leading-relaxed mb-8">
                {format.description}
              </p>

              {/* What's included */}
              {includedItems.length > 0 && (
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-primary-dark mb-4">
                    What&apos;s included
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {includedItems.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 bg-primary-light/50 rounded-xl p-4"
                      >
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-primary mt-0.5" />
                        <p className="text-primary-dark/80 text-sm sm:text-base leading-snug">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 2  Quick facts strip                                 */}
      {/* ============================================================ */}
      <section className="container pb-16 pt-16">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-primary-light bg-primary-light sm:grid-cols-4">
          {[
            { icon: Clock, label: "Turnaround", value: format.turnaround },
            {
              icon: Package,
              label: "Min. Quantity",
              value: format.minQuantity.toLocaleString(),
            },
            {
              icon: Mail,
              label: format.detailsLabel,
              value: format.detailsValue,
            },
            { icon: Tag, label: "Price Tier", value: format.priceTier },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col gap-2 bg-white p-5">
              <Icon className="h-4 w-4 text-primary" />
              <dt className="text-xs font-semibold uppercase tracking-wide text-primary-dark/45">
                {label}
              </dt>
              <dd className="text-md font-semibold text-primary-dark">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ============================================================ */}
      {/* SECTION 3  Why This Format Matters                           */}
      {/* ============================================================ */}
      <section className="container pb-16">
        <div className="relative rounded-3xl border border-primary-light bg-linear-to-br from-primary-light via-white to-primary-light px-6 py-10 sm:px-10 sm:py-12 overflow-hidden shadow-sm">
          <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-primary-light rounded-full blur-3xl opacity-40 z-0" />
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary-light rounded-full blur-3xl opacity-40 z-0" />

          <div className="relative z-10 max-w-6xl mx-auto">
            {/* Heading */}
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="inline-block px-4 py-1.5 rounded-full bg-white text-primary text-[11px] font-extrabold uppercase tracking-[0.15em] shadow-sm mb-4">
                Why It Works
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-dark mb-5">
                Why {format.title} Matter for Your Business
              </h2>
              <p className="text-base sm:text-lg leading-relaxed text-primary-dark/70">
                {buildWhyItMattersCopy(format)}
              </p>
            </div>

            {/* Features Grid: Paper Stock, Mail Class, Sizes */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Card 1: Paper Stock */}
              <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-white shadow-xl shadow-primary-light p-6 sm:p-8 hover:-translate-y-1 transition-transform duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary-light to-primary-light flex items-center justify-center shadow-sm">
                    <Layers className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-primary-dark">
                    Paper Stock
                  </h3>
                </div>
                <div className="flex flex-col gap-3">
                  {format.paperStock.map((stock) => (
                    <div
                      key={stock}
                      className="flex items-center justify-between rounded-xl bg-primary-light/60 border border-primary-light px-4 py-3 text-[15px] font-semibold text-primary-dark/80"
                    >
                      {stock}
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: Mail Class */}
              <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-white shadow-xl shadow-primary-light p-6 sm:p-8 hover:-translate-y-1 transition-transform duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary-light to-primary-light flex items-center justify-center shadow-sm">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-primary-dark">
                    Mail Class
                  </h3>
                </div>
                <div className="flex flex-col gap-3">
                  {format.mailClass.map((mc) => (
                    <div
                      key={mc}
                      className="flex items-center justify-between rounded-xl bg-primary-light/60 border border-primary-light px-4 py-3 text-[15px] font-semibold text-primary-dark/80"
                    >
                      {mc}
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: Available Sizes */}
              {format.specs.length > 0 && (
                <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-white shadow-xl shadow-primary-light p-6 sm:p-8 sm:col-span-2 lg:col-span-1 hover:-translate-y-1 transition-transform duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary-light to-primary-light flex items-center justify-center shadow-sm">
                      <Tag className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-primary-dark">
                      Available Sizes
                    </h3>
                  </div>
                  <div className="flex flex-wrap lg:flex-col gap-3">
                    {format.specs.map((spec, i) => (
                      <div
                        key={`${spec.label}-${i}`}
                        className="flex-1 min-w-[120px] lg:w-full flex items-center justify-center lg:justify-start rounded-xl bg-primary-light/50 px-4 py-3 text-[15px] font-bold text-primary-dark/70 border border-primary-light transition-colors hover:border-primary hover:bg-primary-light"
                      >
                        {spec.label.toLowerCase() !== "size" && (
                          <span className="text-[11px] uppercase tracking-wider text-primary-dark/70 mr-2">
                            {spec.label}
                          </span>
                        )}
                        {spec.value}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 4  FAQ + CTA banner                                  */}
      {/* ============================================================ */}
      {format.faqs?.length > 0 && (
        <section className="container pb-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-primary-dark">
              Frequently Asked <span className="text-primary">Questions</span>
            </h2>
            <p className="text-primary-dark/60 text-center mt-2 mb-8 text-sm sm:text-base">
              Answers to common questions about {format.title.toLowerCase()}.
            </p>

            <FaqAccordion
              items={format.faqs}
              name={`direct-mailing-detail-faq-${format.slug}`}
            />
          </div>
        </section>
      )}

      <section className="container pb-16">
        <div className="rounded-3xl bg-primary-dark px-8 py-12 text-center text-white sm:px-12 sm:py-14">
          <div className="mx-auto max-w-2xl">
            <h3 className="text-2xl font-bold">
              Ready to get started with {format.title}?
            </h3>
            <p className="mt-2 text-sm text-primary-light/80">
              Let&apos;s talk about what this looks like for your business.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-block rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              Get a Quote
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 5  Explore More Formats                              */}
      {/* ============================================================ */}
      {related.length > 0 && (
        <section className="container py-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-primary-dark mb-10">
            Explore More Formats
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => {
              const ItemIcon = resolveIcon(item.icon);
              return (
                <Link
                  key={item.slug}
                  href={`/services/direct-mailing/${item.slug}`}
                  className="group rounded-2xl border border-primary-light bg-white p-6 transition hover:border-primary-light hover:shadow-md"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                      <ItemIcon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-base font-bold text-primary-dark">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-sm text-primary-dark/70 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Learn more
                    <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
