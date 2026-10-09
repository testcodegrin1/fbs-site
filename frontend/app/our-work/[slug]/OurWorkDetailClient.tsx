"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import portfolioData from "../../data/portfolio-content.json";
import FaqAccordion from "@/app/Components/FaqAccordion";

type FAQ = { q: string; a: string };
type ProcessStep = { step: number; title: string; detail: string };
type Specification = { label: string; value: string };
type Testimonial = {
  quote: string;
  author: string;
  role: string;
  rating: number;
};
type GlossaryTerm = { term: string; definition: string };
type KeyInsight = { insight: string; detail: string };

export interface PortfolioItem {
  id: string;
  slug: string;
  category: string;
  title: string;
  seoTitle?: string;
  coverImage: string;
  images: string[];
  link: string;
  description: string;
  features: string[];
  idealFor: string[];
  material: string | null;
  tags: string[];
  sizeRange: string | null;
  turnaroundDays: string | null;
  warranty: string | null;
  relatedSlugs: string[];
  faqs: FAQ[];
  colorOptions: string | null;
  maintenanceTip: string | null;
  processSteps: ProcessStep[];
  whyChooseUs: string[];
  pricingNote: string;
  cta: string;
  specTable: Specification[];
  testimonials: Testimonial[];
  extendedOverview?: string;
  keyBenefits?: string[];
  certifications?: string[];
  glossaryTerms?: GlossaryTerm[];
  keyInsights?: KeyInsight[];
  alsoKnownAs?: string[];
}

const PORTFOLIO_ITEMS = portfolioData as PortfolioItem[];

function SectionTitle({
  first,
  highlight,
  small = false,
}: {
  first: string;
  highlight?: string;
  small?: boolean;
}) {
  return (
    <h2
      className={`mb-8 break-words text-center font-bold leading-tight text-primary sm:mb-10 md:mb-12 ${
        small
          ? "text-2xl sm:text-3xl md:text-4xl"
          : "text-3xl sm:text-4xl md:text-5xl"
      }`}
    >
      {first}
      {highlight && (
        <>
          {" "}
          <span className="bg-linear-to-r from-primary to-primary-dark bg-clip-text text-transparent">
            {highlight}
          </span>
        </>
      )}
    </h2>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 text-primary"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function FeaturesPanel({ features }: { features: string[] }) {
  if (!features.length) {
    return null;
  }

  return (
    <section className="mt-2 rounded-xl border border-primary-light/50 bg-white p-4 text-left shadow-sm sm:rounded-2xl sm:p-5 lg:p-6">
      <h2 className="mb-4 text-lg font-bold text-primary-dark">Features</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {features.map((feature) => (
          <li key={feature} className="flex min-w-0 items-start gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span className="break-words text-sm leading-relaxed text-primary-dark/80">
              {feature}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function getQuickAnswer(item: PortfolioItem) {
  const details = [
    item.material && `built using ${item.material.toLowerCase()}`,
    item.sizeRange && `available in sizes from ${item.sizeRange}`,
    item.turnaroundDays
      ? `with a typical turnaround of ${item.turnaroundDays} business days`
      : "with a project-dependent turnaround",
    item.warranty && `backed by a ${item.warranty.toLowerCase()} warranty`,
  ].filter(Boolean);

  const audience = item.idealFor.length
    ? item.idealFor.join(", ").toLowerCase()
    : "commercial applications";

  return `${item.title} is ${item.category.toLowerCase()} ${details.join(", ")}. It is best suited for ${audience}.`;
}

export default function OurWorkDetailClient({ item }: { item: PortfolioItem }) {
  const [activeImage, setActiveImage] = useState(0);
  const relatedItems = PORTFOLIO_ITEMS.filter((portfolioItem) =>
    item.relatedSlugs.includes(portfolioItem.slug)
  );
  const currentImage = item.images[activeImage] || item.images[0];

  return (
    <main className="overflow-x-hidden">
      <section className="mt-20 bg-linear-to-br from-white to-primary-light sm:mt-24 xl:mt-20">
        <div className="container py-6 sm:py-8 md:py-10">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 break-words text-xs text-primary-dark/70 sm:text-sm md:text-base"
          >
            <Link href="/" className="text-primary">
              Home
            </Link>
            <span aria-hidden="true">&gt;</span>
            <Link href="/our-work" className="text-primary">
              Our Work
            </Link>
            <span aria-hidden="true">&gt;</span>
            <span aria-current="page" className="text-primary-dark">
              {item.title}
            </span>
          </nav>

          <div className="grid min-w-0 items-start gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-20">
            <div className="flex min-w-0 flex-col gap-4">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl shadow-xl sm:aspect-video sm:rounded-2xl lg:aspect-[4/3] xl:aspect-video">
                <Image
                  key={activeImage}
                  src={currentImage}
                  alt={`${item.title} example ${activeImage + 1}`}
                  fill
                  priority
                  sizes="(max-width: 1023px) 100vw, 50vw"
                  className="object-cover transition-opacity duration-500"
                />
              </div>

              {item.images.length > 1 && (
                <div className="scrollbar-hide flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-2 sm:gap-3">
                  {item.images.map((image, index) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      aria-label={`View ${item.title} image ${index + 1}`}
                      aria-pressed={activeImage === index}
                      className={`relative h-16 w-16 shrink-0 snap-start overflow-hidden rounded-lg border-2 transition-all sm:h-20 sm:w-20 sm:rounded-xl ${
                        activeImage === index
                          ? "scale-105 border-primary shadow-md"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${item.title} thumbnail ${index + 1}`}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {!!item.idealFor.length && (
                <div className="mt-4 flex flex-col items-start gap-3 rounded-xl bg-white p-4 shadow-sm sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6 sm:rounded-2xl sm:p-5">
                  <span className="shrink-0 text-[11px] font-bold uppercase tracking-widest text-primary-dark">
                    Ideal For
                  </span>
                  <div className="flex min-w-0 flex-wrap gap-2 sm:gap-3">
                    {item.idealFor.map((audience) => (
                      <span
                        key={audience}
                        className="max-w-full break-words rounded-full bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary sm:px-4 sm:text-sm"
                      >
                        {audience}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!!item.tags.length && (
                <div className="mt-2 flex min-w-0 flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="max-w-full break-all rounded-md bg-primary-dark/5 px-3 py-1 text-xs font-medium text-primary-dark/70"
                    >
                      #{tag.replace(/\s+/g, "-")}
                    </span>
                  ))}
                </div>
              )}

              {!!item.certifications?.length && (
                <div className="mt-1 flex min-w-0 flex-wrap gap-2">
                  {item.certifications.map((certification) => (
                    <span
                      key={certification}
                      className="inline-flex max-w-full items-center gap-1.5 break-words rounded-full border border-primary-light/60 bg-white px-3 py-1.5 text-xs font-semibold text-primary-dark/80"
                    >
                      <CheckIcon />
                      {certification}
                    </span>
                  ))}
                </div>
              )}

              <FeaturesPanel features={item.features} />
            </div>

            <div className="flex min-w-0 flex-col justify-center space-y-4 text-center sm:space-y-5 lg:text-left xl:sticky xl:top-28">
              <p className="break-words text-xs font-semibold uppercase tracking-wide text-primary sm:text-sm">
                {item.category}
              </p>
              <h1 className="break-words text-3xl font-semibold leading-tight tracking-tight text-primary-dark sm:text-4xl md:text-5xl lg:text-4xl xl:text-5xl 2xl:text-6xl">
                {item.title}
              </h1>
              <p className="mx-auto max-w-2xl break-words text-sm leading-relaxed text-primary-dark/70 sm:text-base md:text-lg lg:mx-0">
                {item.description}
              </p>

              {!!item.alsoKnownAs?.length && (
                <p className="mx-auto max-w-2xl break-words text-xs leading-relaxed text-primary-dark/50 lg:mx-0">
                  Also known as: {item.alsoKnownAs.join(", ")}
                </p>
              )}

              <div className="mx-auto w-full max-w-2xl rounded-r-xl border-l-4 border-primary bg-primary/5 p-4 text-left sm:p-5 lg:mx-0">
                <p className="text-sm leading-relaxed text-primary-dark/90">
                  {getQuickAnswer(item)}
                </p>
              </div>

              <nav
                aria-label="On this page"
                className="scrollbar-hide flex max-w-full gap-4 overflow-x-auto whitespace-nowrap pb-2 pt-1 text-xs text-primary-dark/50 sm:flex-wrap sm:overflow-visible sm:whitespace-normal"
              >
                {!!item.keyBenefits?.length && <a href="#benefits">Benefits</a>}
                {!!item.specTable.length && <a href="#specifications">Specifications</a>}
                {!!item.processSteps.length && <a href="#process">Our Process</a>}
                {!!item.glossaryTerms?.length && <a href="#glossary">Glossary</a>}
                {!!item.testimonials.length && <a href="#reviews">Reviews</a>}
                {!!item.faqs.length && <a href="#faqs">FAQs</a>}
              </nav>

              <div className="flex w-full justify-center pt-2 lg:justify-start">
                <Link
                  href="/contact"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform duration-300 hover:scale-[1.02] sm:w-auto sm:px-8 sm:text-base sm:hover:scale-105"
                >
                  Get a Free Quote →
                </Link>
              </div>

              {item.maintenanceTip && (
                <div className="mt-4 rounded-xl border border-black bg-primary/5 p-4 text-left sm:mt-8 sm:p-6">
                  <p className="mb-1 text-sm font-bold uppercase tracking-wider text-primary">
                    Maintenance Tip
                  </p>
                  <p className="text-sm leading-relaxed text-primary-dark/80">
                    {item.maintenanceTip}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {item.extendedOverview && (
        <section className="container pt-4 sm:pt-6 md:pt-8">
          <div className="mx-auto max-w-4xl rounded-xl border border-primary-light/40 bg-white p-4 sm:rounded-2xl sm:p-6 md:p-8">
            <h2 className="mb-3 text-lg font-bold text-primary-dark">
              About {item.title}
            </h2>
            <p className="text-sm leading-relaxed text-primary-dark/70 md:text-base">
              {item.extendedOverview}
            </p>
          </div>
        </section>
      )}

      {!!item.keyBenefits?.length && (
        <section id="benefits" className="container scroll-mt-24 pt-10 sm:pt-12 md:pt-16">
          <SectionTitle first="Key" highlight="Benefits" />
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
            {item.keyBenefits.map((benefit, index) => (
              <div
                key={benefit}
                className="rounded-xl border border-primary-light/50 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:rounded-2xl sm:p-6"
              >
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {index + 1}
                </div>
                <p className="text-sm leading-relaxed text-primary-dark/80">{benefit}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {!!item.specTable.length && (
        <section id="specifications" className="container scroll-mt-24 pt-10 sm:pt-12 md:pt-16">
          <SectionTitle first="Technical" highlight="Specifications" />
          <dl className="grid w-full gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 xl:gap-6">
            {item.specTable.map((specification) => (
              <div
                key={specification.label}
                className="flex h-full min-w-0 flex-col justify-center rounded-xl border border-primary-light/50 bg-white p-4 text-center shadow-sm transition-shadow hover:shadow-md sm:rounded-2xl sm:p-5"
              >
                <dt className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">
                  {specification.label}
                </dt>
                <dd className="text-sm font-semibold leading-snug text-primary-dark">
                  {specification.value}
                </dd>
              </div>
            ))}
          </dl>
          {item.pricingNote && (
            <p className="mx-auto mt-10 max-w-3xl text-center text-sm text-primary-dark/70">
              {item.pricingNote}
            </p>
          )}
        </section>
      )}

      {!!item.whyChooseUs.length && (
        <section className="container pt-10 sm:pt-12 md:pt-16">
          <div className="mx-auto max-w-5xl rounded-xl border border-black bg-white p-5 sm:rounded-2xl sm:p-8 md:p-12">
            <h2 className="mb-8 text-center text-2xl font-bold text-primary-dark md:text-3xl">
              Why Choose Us
            </h2>
            <div className="grid gap-6 text-center md:grid-cols-3 md:gap-8">
              {item.whyChooseUs.map((point) => (
                <div key={point} className="flex flex-col items-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/5">
                    <CheckIcon />
                  </div>
                  <p className="mx-auto max-w-[250px] text-[13px] font-medium leading-relaxed text-primary-dark md:text-sm">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {(item.material || item.colorOptions) && (
        <section className="container pt-10 sm:pt-12 md:pt-16">
          <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2 md:gap-6">
            {item.material && (
              <div className="rounded-xl border border-primary-light/50 bg-(--color-primary-light) p-5 sm:rounded-2xl sm:p-6">
                <h2 className="mb-2 text-lg font-bold text-primary-dark">Materials Used</h2>
                <p className="text-sm leading-relaxed text-primary-dark/70">
                  {item.material}
                </p>
              </div>
            )}
            {item.colorOptions && (
              <div className="rounded-xl border border-primary-light/50 bg-(--color-primary-light) p-5 sm:rounded-2xl sm:p-6">
                <h2 className="mb-2 text-lg font-bold text-primary-dark">
                  Color & Finish Options
                </h2>
                <p className="text-sm leading-relaxed text-primary-dark/70">
                  {item.colorOptions}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {!!item.keyInsights?.length && (
        <section className="container pt-10 sm:pt-12 md:pt-16">
          <SectionTitle first="What to Know Before You Buy" small />
          <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3 md:gap-6">
            {item.keyInsights.map((insight) => (
              <div
                key={insight.insight}
                className="rounded-xl border-l-4 border-primary bg-white p-5 shadow-sm sm:rounded-2xl sm:p-6"
              >
                <h3 className="mb-2 text-sm font-bold text-primary-dark md:text-base">
                  {insight.insight}
                </h3>
                <p className="text-sm leading-relaxed text-primary-dark/70">
                  {insight.detail}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {!!item.processSteps.length && (
        <section id="process" className="container scroll-mt-24 py-12 sm:py-16 md:py-20 lg:py-24">
          <SectionTitle first="How" highlight="It Works" />
          <ol className="grid gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 xl:gap-8">
            {item.processSteps.map((step) => (
              <li
                key={step.step}
                className="group list-none rounded-xl bg-white p-5 text-center shadow-lg transition-shadow hover:shadow-2xl sm:rounded-2xl sm:p-6 lg:p-8"
              >
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-white transition-transform group-hover:scale-110">
                  {step.step}
                </div>
                <h3 className="mb-4 text-xl font-semibold text-primary-dark">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-primary-dark/70">
                  {step.detail}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {!!item.glossaryTerms?.length && (
        <section id="glossary" className="container scroll-mt-24 py-12 sm:py-16 md:py-20 lg:py-24">
          <SectionTitle first="Terms Worth Knowing" small />
          <div className="mx-auto max-w-3xl space-y-4">
            {item.glossaryTerms.map((term) => (
              <div key={term.term} className="rounded-xl bg-white p-5 shadow-sm sm:rounded-2xl sm:p-6">
                <h3 className="mb-1 font-bold text-primary-dark">{term.term}</h3>
                <p className="text-sm leading-relaxed text-primary-dark/70">
                  {term.definition}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {!!item.testimonials.length && (
        <section id="reviews" className="container scroll-mt-24 py-12 sm:py-16 md:py-20 lg:py-24">
          <SectionTitle first="What Clients" highlight="Say" />
          <div className="grid gap-5 md:grid-cols-2 md:gap-6 xl:grid-cols-3 xl:gap-8">
            {item.testimonials.map((testimonial) => (
              <article
                key={`${testimonial.author}-${testimonial.quote}`}
                className="flex min-w-0 flex-col justify-between rounded-xl bg-white p-5 shadow-lg sm:rounded-2xl sm:p-6 lg:p-8"
              >
                <div>
                  <div
                    className="mb-4 flex gap-1 text-primary"
                    aria-label={`${testimonial.rating} out of 5 stars`}
                  >
                    {"★".repeat(testimonial.rating)}
                  </div>
                  <p className="italic leading-relaxed text-primary-dark/80">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                </div>
                <footer className="mt-6 border-t border-primary-dark/10 pt-4">
                  <p className="font-semibold text-primary-dark">{testimonial.author}</p>
                  <p className="text-sm text-primary-dark/60">{testimonial.role}</p>
                </footer>
              </article>
            ))}
          </div>
        </section>
      )}

      {!!item.faqs.length && (
        <section id="faqs" className="container scroll-mt-24 py-12 sm:py-16 md:py-20 lg:py-24">
          <SectionTitle first="Frequently Asked" highlight="Questions" />
          <FaqAccordion
            items={item.faqs.map((faq) => ({
              question: faq.q,
              answer: faq.a,
            }))}
            name={`portfolio-faq-${item.slug}`}
          />
        </section>
      )}

      {!!relatedItems.length && (
        <section className="container py-12 sm:py-16 md:py-20 lg:py-24">
          <div className="mb-8 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-2xl font-bold text-primary-dark sm:text-3xl">Related Work</h2>
            <Link
              href="/our-work"
              className="text-sm font-semibold text-primary hover:underline"
            >
              View All Work →
            </Link>
          </div>

          <div className="grid gap-5 md:gap-6 xl:grid-cols-2 xl:gap-8">
            {relatedItems.map((related) => (
              <Link
                key={related.id}
                href={related.link}
                className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-black bg-white transition-shadow hover:shadow-lg sm:rounded-2xl md:flex-row"
              >
                <div className="relative aspect-[4/3] w-full md:aspect-auto md:min-h-56 md:w-2/5">
                  <Image
                    src={related.coverImage}
                    alt={related.title}
                    fill
                    sizes="(max-width: 767px) 100vw, (max-width: 1279px) 40vw, 20vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex min-w-0 w-full flex-col justify-center p-5 sm:p-6 md:w-3/5 md:p-8">
                  <h3 className="mb-3 text-xl font-bold text-primary">{related.title}</h3>
                  <p className="mb-4 line-clamp-3 text-[15px] leading-relaxed text-primary-dark/80">
                    {related.description}
                  </p>
                  {related.turnaroundDays && (
                    <p className="text-xs font-bold text-primary-dark">
                      {related.turnaroundDays} day turnaround
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="container py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="mx-auto max-w-4xl rounded-xl bg-primary px-4 py-8 text-center text-white sm:rounded-2xl sm:px-6 sm:py-10 md:px-10 md:py-12">
          <h2 className="mb-4 break-words text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">
            {item.cta}
          </h2>
          <Link
            href="/contact"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary shadow-lg transition-transform duration-300 hover:scale-[1.02] sm:w-auto sm:px-8 sm:text-base sm:hover:scale-105"
          >
            Get a Free Quote →
          </Link>
        </div>
      </section>
    </main>
  );
}
