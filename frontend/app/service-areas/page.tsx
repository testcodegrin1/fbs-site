import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import ServiceAreasClient from "./ServiceAreasClient";
import ServiceAreaComparisonTable from "./ServiceAreaComparisonTable";
import FaqAccordion from "@/app/Components/FaqAccordion";
import { serviceAreas } from "@/app/data/service-areas-data";
import { getRequestBaseUrl } from "@/app/lib/request-url";
import { absoluteUrl, siteConfig } from "@/app/lib/seo";


const serviceAreasFaqs = [
  {
    question: "Which Illinois counties and cities does FBS Signs provide physical sign installation in?",
    answer: "We fabricate and install commercial signage, LED channel letters, storefront lightboxes, and architectural monument signs across 25 key Illinois cities spanning DuPage, Cook, Will, Kane, Kendall, Winnebago, and Lake Counties. Our physical installation radius includes Naperville, Schaumburg, Aurora, Joliet, Bolingbrook, Des Plaines, Downers Grove, Rockford, and surrounding municipalities."
  },
  {
    question: "Do I need a municipal sign permit in Illinois, and does FBS Signs handle the permit process?",
    answer: "Yes, virtually all commercial exterior signs, channel letters, monument signs, and illuminated blade signs require zoning approval and electrical permits from your local Illinois municipal building department. FBS Signs conducts on-site surveys, creates scaled architectural elevations, and manages all municipal zoning applications and inspections from start to finish."
  },
  {
    question: "What is the difference between front-lit channel letters and reverse halo-lit channel letters?",
    answer: "Front-lit channel letters feature translucent acrylic faces with internal LEDs that illuminate directly forward, offering maximum daytime and nighttime visibility for busy shopping centers. Reverse halo-lit channel letters have solid aluminum faces with LEDs projecting backward against the building wall, creating an elegant architectural halo glow ideal for corporate headquarters, upscale boutiques, and medical practices."
  },
  {
    question: "How does Every Door Direct Mail (EDDM) work for local Illinois businesses?",
    answer: "USPS Every Door Direct Mail (EDDM) allows businesses to target specific postal carrier routes in selected neighborhoods or zip codes without needing a costly mailing list. FBS Signs designs compliant postcards, handles bulk commercial printing, bundles pieces according to USPS postal specifications, and coordinates delivery directly to local mailboxes."
  },
  {
    question: "What turnaround time should I expect for commercial printing versus custom signage?",
    answer: "Standard commercial printing products (business cards, menus, brochures, and vinyl banners) typically ship or are ready for local pickup within 2 to 4 business days. Custom exterior signs and LED channel letters generally require 2 to 4 weeks depending on city permit approvals, material fabrication, and scheduling site installation."
  },
  {
    question: "Can FBS Signs service clients outside the 25 listed Illinois cities?",
    answer: "Yes. While our physical on-site sign installation teams focus on northeastern Illinois, we provide nationwide shipping for commercial printing products, vinyl banners, trade show displays, and vehicle graphic kits, and deliver digital web design and local SEO services nationwide."
  }
];

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await getRequestBaseUrl();
  const canonical = absoluteUrl("/service-areas", baseUrl);

  return {
    title: "Illinois Service Areas | Custom Signs, Print & Marketing | FBS Signs",
    description:
      "Explore FBS Signs service areas across 25 Illinois cities for custom commercial signage, LED channel letters, printing, direct mail, web design, and local SEO.",
    alternates: {
      canonical,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url: canonical,
      siteName: siteConfig.name,
      title: "Illinois Service Areas | Custom Signs, Print & Marketing | FBS Signs",
      description:
        "Explore FBS Signs service areas across 25 Illinois cities for custom commercial signage, LED channel letters, printing, direct mail, web design, and local SEO.",
      images: [
        {
          url: absoluteUrl(
            "/images/services/signage/signage-service.webp",
            baseUrl,
          ),
          width: 1200,
          height: 630,
          alt: "FBS Signs service areas in Illinois",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Illinois Service Areas | Custom Signs, Print & Marketing | FBS Signs",
      description:
        "Explore FBS Signs service areas across 25 Illinois cities for custom commercial signage, LED channel letters, printing, direct mail, web design, and local SEO.",
      images: [
        absoluteUrl("/images/services/signage/signage-service.webp", baseUrl),
      ],
    },
  };
}

export default async function ServiceAreasListingPage() {
  const baseUrl = await getRequestBaseUrl();
  const canonical = absoluteUrl("/service-areas", baseUrl);

  // Schema Markup
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${canonical}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteUrl("/", baseUrl),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Service Areas",
        item: canonical,
      },
    ],
  };


  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${canonical}#faq`,
    mainEntity: serviceAreasFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const webpageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonical}#webpage`,
    name: "Illinois Service Areas | Custom Signs, Print & Marketing | FBS Signs",
    description:
      "Explore FBS Signs service areas across 25 Illinois cities for custom commercial signage, LED channel letters, printing, direct mail, web design, and local SEO.",
    url: canonical,
    inLanguage: "en-US",
    isPartOf: {
      "@id": `${absoluteUrl("/", baseUrl)}#website`,
    },
    about: {
      "@id": `${absoluteUrl("/", baseUrl)}#organization`,
    },
  };

  return (
    <>
      <Script
        id="service-areas-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="service-areas-webpage-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webpageSchema) }}
      />

      <main className="bg-linear-to-br from-white via-white to-primary-light/20 min-h-screen">
        {/* Hero Section */}
        <section className="bg-linear-to-br from-primary-dark to-primary-dark text-white xl:pt-28 pt-20 pb-20 relative overflow-hidden">
          {/* Visual Accents */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-primary-dark/20 rounded-full blur-3xl" />

          <div className="container relative z-10 text-center max-w-4xl mx-auto px-4">
            <div className="inline-flex items-center gap-3 bg-primary/10 text-primary-light px-5 py-2 rounded-full border border-primary/20 shadow-lg mb-6">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-[13px] font-bold uppercase tracking-widest">
                Our Coverage
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-6">
              Service Areas We Serve <br />
              <span className="bg-linear-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                In Illinois
              </span>
            </h1>
            <p className="text-primary-light/80 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
              FBS Signs provides signage, printing, direct mail, web design, and
              SEO services across northeastern Illinois. Explore our service
              areas below to find local services and solutions tailored to your
              business needs.
            </p>
          </div>
        </section>

        {/* Interactive Cities List */}
        <ServiceAreasClient cities={serviceAreas} />

        {/* Crawlable HTML Directory for Search Engines & Robots */}
        <section className="container py-8 px-4 max-w-6xl mx-auto border-t border-primary-light/40">
          <h2 className="text-xl font-bold text-primary-dark mb-4">
            Browse All Illinois Service Area Locations
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 text-sm">
            {serviceAreas.map((city) => (
              <Link
                key={`static-link-${city.slug}`}
                href={`/service-areas/${city.slug}`}
                className="text-primary-dark/80 hover:text-primary hover:underline transition-colors py-1"
              >
                {city.name}, IL ({city.county})
              </Link>
            ))}
          </div>
        </section>


        {/* Signage & Marketing Solutions Comparison Table */}
        <ServiceAreaComparisonTable />

        {/* Regional FAQ Section for AI Search & AEO */}
        <section className="container py-16 px-4 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-primary font-bold text-xs uppercase tracking-widest block mb-2">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary-dark leading-tight">
              Illinois Signage, Print &amp; Marketing Answers
            </h2>
            <p className="text-primary-dark/70 mt-3 text-base sm:text-lg">
              Direct answers to common questions regarding sign permits, turnaround schedules, direct mail carrier routes, and regional service coverage.
            </p>
          </div>

          <FaqAccordion
            items={serviceAreasFaqs}
            name="service-areas-regional-faq"
          />
        </section>

        {/* Local Commitment Section */}
        <section className="container py-16 px-4">
          <div className="bg-white rounded-3xl p-8 md:p-12 border border-primary-light shadow-xl max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-primary-dark mb-4 leading-tight">
                High-Performance Local Presence
              </h2>
              <div className="w-12 h-1 bg-primary rounded-full mb-6" />
              <p className="text-primary-dark/70 mb-4 leading-relaxed">
                We believe that strong physical branding goes hand-in-hand with
                a robust digital footprint. That&apos;s why we don&apos;t just
                supply businesses with premium banners or illuminated signs; we
                help you optimize your Google Business Profiles, run
                neighborhood direct mail marketing, and build search authority
                in every city you serve.
              </p>
              <p className="text-primary-dark/70 leading-relaxed">
                With a price match guarantee and decades of local experience,
                FBS Signs is the preferred partner for retail, hospitality, and
                home-service brands across the region.
              </p>
            </div>
            <div className="relative h-[250px] md:h-[350px] rounded-2xl overflow-hidden shadow-md">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1525381.1895690327!2d-89.37852601712952!3d41.7482813133887!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x880e2c3cd0f4cbed%3A0xafe0a6ad09561000!2sChicago%20Metropolitan%20Area%2C%20IL%2C%20USA!5e0!3m2!1sen!2sin!4v1689234857284!5m2!1sen!2sin"
                className="w-full h-full border-0"
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="FBS Signs regional map"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container py-12 px-4 mb-12">
          <div className="bg-linear-to-r from-primary to-primary-dark rounded-3xl px-6 py-12 text-white text-center max-w-5xl mx-auto shadow-xl">
            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">
              Operating Outside of These Cities?
            </h2>
            <p className="max-w-2xl mx-auto mt-4 text-base md:text-lg text-primary-light leading-relaxed">
              Although we have dedicated physical service zones, we design
              websites, manage SEO, and ship custom signs and commercial
              printing projects nationwide. Contact us to discuss your goals.
            </p>
            <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-primary font-bold shadow-lg transition-all duration-300 hover:scale-105"
              >
                Get a Free Quote
              </a>
              <a
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-primary text-white px-8 py-4 font-semibold transition-all duration-300 hover:bg-white/10"
              >
                Consult an Expert
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
