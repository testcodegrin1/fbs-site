"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Printer, Signpost, Mail, Globe, Search, CheckCircle2 } from "lucide-react";
import "aos/dist/aos.css";
import ServiceAreaComparisonTable from "@/app/service-areas/ServiceAreaComparisonTable";
import FaqAccordion from "@/app/Components/FaqAccordion";

const servicesList = [
  {
    id: "printing-products",
    title: "Printing Products",
    description:
      "High-quality business cards, brochures, flyers, banners, carryout menus, and custom apparel prints designed to elevate your brand.",
    image: "/images/home/home1.jpg",
    href: "/services/printing-products",
    icon: Printer,
    highlights: ["Business Cards & Brochures", "Banners & Flags", "Custom T-Shirts"],
  },
  {
    id: "signage",
    title: "Business Signage",
    description:
      "Eye-catching storefront signs, channel letters, illuminated interior signs, wayfinding, and custom window & wall graphics.",
    image: "/images/home/home2.webp",
    href: "/services/signage",
    icon: Signpost,
    highlights: ["Storefront & Channel Letters", "Illuminated Interior Signs", "Window & Wall Graphics"],
  },
  {
    id: "direct-mailing",
    title: "Direct Mailing",
    description:
      "Targeted direct mail campaigns, Every Door Direct Mail (EDDM), postcards, and custom mailers to reach prospective customers directly.",
    image: "/images/home/home3.jpg",
    href: "/services/direct-mailing",
    icon: Mail,
    highlights: ["Targeted Mailing Lists", "EDDM Postcard Campaigns", "High-Response Mailers"],
  },
  {
    id: "web-design",
    title: "Website Design",
    description:
      "Custom responsive websites optimized for high conversion rates, modern aesthetics, fast load speeds, and mobile compatibility.",
    image: "/images/home/home5.jpg",
    href: "/services/web-design",
    icon: Globe,
    highlights: ["Custom Responsive Layouts", "E-Commerce & Portfolios", "Fast Performance & UX"],
  },
  {
    id: "seo",
    title: "SEO Services",
    description:
      "Data-driven local SEO, keyword optimization, Google Business Profile enhancement, and content strategy to dominate search results.",
    image: "/images/services/seo/seo-service-card.webp",
    href: "/services/seo",
    icon: Search,
    highlights: ["Local Search Optimization", "On-Page & Technical SEO", "Google Profile Management"],
  },
];

const mainServiceFaqs = [
  {
    question: "What custom signage options are most effective for retail storefronts?",
    answer: "Front-lit LED channel letters, reverse halo-lit channel letters, and illuminated storefront lightboxes are the most effective signs for attracting drive-by and foot traffic. We build signs compliant with municipal building codes, shopping center lease agreements, and local zoning standards across Illinois."
  },
  {
    question: "How does FBS Signs manage municipal sign permits and zoning compliance?",
    answer: "We offer end-to-end sign permit coordination across all Illinois cities we serve. Our team performs initial site surveys, produces scaled architectural drawings and electrical schematics, and manages applications directly with municipal building and zoning departments."
  },
  {
    question: "Can I coordinate commercial printing with Every Door Direct Mail (EDDM)?",
    answer: "Yes. FBS Signs provides full turnkey direct mail solutions. We design oversized EDDM-compliant postcards, print them on heavy 16pt cardstock with UV gloss or matte finish, bundle them to USPS specifications, and coordinate delivery directly to designated carrier routes in your target neighborhoods."
  },
  {
    question: "How do custom vehicle wraps compare to traditional advertising?",
    answer: "Commercial vehicle wraps generate an estimated 30,000 to 70,000 visual impressions every day per vehicle. They provide one of the lowest cost-per-thousand-impressions (CPM) of any outdoor advertising medium and protect vehicle factory paint with durable 3M or Avery cast vinyl."
  },
  {
    question: "How does local SEO help Illinois businesses get found on Google AI Overviews & Maps?",
    answer: "Our local SEO strategy combines Google Business Profile optimization, localized landing pages, structured schema markup (LocalBusiness, Service, and FAQPage), citations, and high-intent keyword targeting to ensure your business is recommended in Google Map Packs and AI-synthesized search results."
  },
  {
    question: "What is your typical turnaround time across different services?",
    answer: "Commercial printing products (business cards, flyers, carryout menus, and vinyl banners) typically take 1 to 4 business days. Vehicle wraps require 3 to 5 days. Custom architectural signs and LED channel letters generally take 2 to 4 weeks depending on city permit approvals and custom fabrication."
  }
];

const featuredCities = [
  { name: "Naperville", slug: "naperville", county: "DuPage / Will" },
  { name: "Schaumburg", slug: "schaumburg", county: "Cook County" },
  { name: "Aurora", slug: "aurora", county: "Kane / DuPage" },
  { name: "Des Plaines", slug: "des-plaines", county: "Cook County" },
  { name: "Hoffman Estates", slug: "hoffman-estates", county: "Cook County" },
  { name: "Bolingbrook", slug: "bolingbrook", county: "Will / DuPage" },
  { name: "Joliet", slug: "joliet", county: "Will County" },
  { name: "Crest Hill", slug: "crest-hill", county: "Will County" },
  { name: "Chicago", slug: "chicago", county: "Cook County" },
  { name: "Romeoville", slug: "romeoville", county: "Will County" },
  { name: "Downers Grove", slug: "downers-grove", county: "DuPage County" },
  { name: "Rockford", slug: "rockford", county: "Winnebago County" },
];

export default function ServicesPage() {
  useEffect(() => {
    const initAOS = async () => {
      const AOS = (await import("aos")).default;
      AOS.init({
        duration: 1200,
        once: true,
        easing: "ease-in-out",
        offset: 100,
      });
    };

    initAOS();
  }, []);

  return (
    <main>
      {/* Hero Section */}
      <section className="bg-linear-to-br mt-24 xl:mt-20 from-white to-primary-light">
        <div className="container">
          <div className="mx-auto">
            <p className="text-primary-dark/70">
              <Link href="/" className="text-primary text-lg">
                Home
              </Link>
              <span className="mx-2 text-lg">&gt;</span>
              <span className="text-primary-dark text-lg font-semibold">Services</span>
            </p>

            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 mt-10 lg:mt-0 items-center">
              {/* LEFT CONTENT */}
              <div
                data-aos="fade-right"
                className="flex flex-col justify-center text-center lg:text-left space-y-5"
              >
                <div className="inline-flex items-center gap-2 bg-primary-light/60 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider w-fit mx-auto lg:mx-0">
                  <span>★</span> Complete Physical &amp; Digital Solutions
                </div>
                <h1
                  className="font-semibold text-primary-dark leading-tight tracking-tight
                  text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
                >
                  Our <span className="text-primary">Services</span>
                </h1>

                <p className="text-primary-dark/70 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  From custom illuminated channel letters, monument signs, and commercial vehicle wraps to high-volume printing, targeted EDDM direct mail, and data-driven local SEO - FBS Signs provides end-to-end solutions that help businesses dominate their local markets.
                </p>

                <div className="pt-2 flex flex-wrap gap-4 justify-center lg:justify-start">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 bg-primary text-white hover:bg-primary-dark px-7 py-3.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    <span>Get a Free Project Quote</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/service-areas"
                    className="inline-flex items-center gap-2 bg-white text-primary-dark border border-primary-light hover:border-primary px-7 py-3.5 rounded-full font-semibold transition-all"
                  >
                    <span>View Service Areas (25 Cities)</span>
                  </Link>
                </div>
              </div>

              {/* RIGHT - Hero Image Grid */}
              <div className="relative">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-light rounded-full opacity-50 blur-2xl"></div>
                <div className="absolute bottom-20 -left-10 w-60 h-60 bg-primary-light rounded-full opacity-50 blur-3xl"></div>
                <div className="absolute top-32 right-10 w-32 h-32 bg-primary-light rounded-full opacity-50 blur-2xl"></div>

                <div className="relative grid grid-cols-3 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="col-span-1 space-y-4 sm:space-y-6 sm:mt-16">
                    <div className="rounded-2xl aspect-square overflow-hidden relative float-1">
                      <Image
                        src="/images/home/home1.jpg"
                        alt="FBS Commercial Printing Products"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  <div className="col-span-1 space-y-4 sm:space-y-6 sm:mt-40">
                    <div className="rounded-2xl aspect-square overflow-hidden relative float-2">
                      <Image
                        src="/images/home/home2.webp"
                        alt="FBS Custom Storefront Signage"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  <div className="col-span-1 space-y-6 sm:mt-16">
                    <div className="rounded-2xl aspect-square overflow-hidden relative float-3">
                      <Image
                        src="/images/home/home3.jpg"
                        alt="FBS Targeted Direct Mail EDDM"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="container section-padding">
        <div className="text-center max-w-3xl mx-auto mb-16" data-aos="fade-up">
          <span className="text-primary font-bold text-xs uppercase tracking-widest block mb-2">
            What We Do
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary-dark leading-tight">
            Comprehensive Branding &amp; Marketing Solutions
          </h2>
          <p className="mt-4 text-base sm:text-lg text-primary-dark/70">
            Select a specialized service category below to view product options, material specifications, and design possibilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {servicesList.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                data-aos="fade-up"
                data-aos-delay={(index % 3) * 100}
                className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col border border-primary-light/50"
              >
                <div className="relative h-60 overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                      FBS Service
                    </span>
                  </div>
                </div>

                <div className="p-6 grow flex flex-col">
                  <h3 className="text-2xl font-bold text-primary-dark group-hover:text-primary transition-colors duration-300 mb-3">
                    {service.title}
                  </h3>
                  <p className="text-primary-dark/70 text-sm leading-relaxed mb-6 grow">
                    {service.description}
                  </p>

                  <div className="space-y-2 mb-6 pt-2 border-t border-primary-light">
                    {service.highlights.map((highlight, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-primary-dark/80">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href={service.href}
                    className="inline-flex items-center justify-between w-full bg-primary-light/60 hover:bg-primary text-primary hover:text-white px-5 py-3 rounded-full font-bold text-sm transition-all duration-300 mt-auto"
                  >
                    <span>Explore {service.title}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Comparison Matrix Section */}
      <ServiceAreaComparisonTable />

      {/* City-Based Service Coverage Matrix */}
      <section className="container py-12 px-4 max-w-6xl mx-auto">
        <div className="bg-linear-to-br from-white to-primary-light/40 rounded-3xl p-8 sm:p-12 border border-primary-light shadow-lg">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-primary font-bold text-xs uppercase tracking-widest block mb-2">
              City-Based Service Coverage
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary-dark leading-tight">
              Looking for Services in Your Specific City?
            </h2>
            <p className="mt-3 text-primary-dark/70 text-base sm:text-lg">
              We provide localized commercial signage, permit processing, commercial printing, and direct mail distribution across 25 Illinois cities.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {featuredCities.map((city) => (
              <Link
                key={city.slug}
                href={`/service-areas/${city.slug}`}
                className="group bg-white p-4 rounded-xl border border-primary-light hover:border-primary hover:shadow-md transition-all text-center flex flex-col justify-center"
              >
                <span className="font-bold text-primary-dark group-hover:text-primary transition-colors text-sm">
                  {city.name}, IL
                </span>
                <span className="text-[11px] text-primary-dark/50 mt-1">
                  {city.county}
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/service-areas"
              className="inline-flex items-center gap-2 text-primary font-bold hover:text-primary-dark hover:underline transition-colors text-sm sm:text-base"
            >
              <span>Explore all 25 Illinois Service Area Locations</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Services FAQ Section for AI Search Optimization */}
      <section className="container py-16 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-primary font-bold text-xs uppercase tracking-widest block mb-2">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary-dark leading-tight">
            Commercial Services FAQ
          </h2>
          <p className="text-primary-dark/70 mt-3 text-base sm:text-lg">
            Answers regarding signage specifications, permit approvals, EDDM direct mailing, and turnaround times.
          </p>
        </div>

        <FaqAccordion items={mainServiceFaqs} name="main-services-faq" />
      </section>

      {/* CTA Section */}
      <section className="container section-padding pt-0">
        <div className="bg-linear-to-r from-primary-dark to-primary rounded-3xl p-8 sm:p-12 text-white text-center shadow-xl">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Ready to Take Your Business to the Next Level?
          </h2>
          <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto mb-8">
            Contact our team of signage fabricators, commercial printers, and digital marketing experts today for a free custom quote and site survey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 bg-white text-primary hover:bg-primary-light px-8 py-4 rounded-full font-extrabold text-base shadow-lg transition-transform hover:scale-105"
            >
              Get a Free Quote
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="tel:+18552221133"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 text-white px-8 py-4 font-semibold transition-all hover:bg-white/10"
            >
              Call (855) 222-1133
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
