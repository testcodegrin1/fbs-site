import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import FaqAccordion from "@/app/Components/FaqAccordion";
import {
  absoluteUrl,
  buildBreadcrumbSchema,
  buildFaqSchema,
  siteConfig,
  websiteId,
} from "@/app/lib/seo";

const canonical = absoluteUrl("/faq", siteConfig.url);
const faqTitle = "FAQs About Business Signage & Printing | FBS Signs Illinois";
const faqDescription =
  "Answers to the most common questions about business signage, commercial printing, EDDM direct mail, vehicle wraps, and LED channel letters. FBS Signs serves Illinois and nationwide.";

export const metadata: Metadata = {
  title: faqTitle,
  description: faqDescription,
  alternates: { canonical },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: canonical,
    siteName: siteConfig.name,
    title: faqTitle,
    description:
      "Answers to the most common questions about business signage, commercial printing, EDDM direct mail, vehicle wraps, and LED channel letters.",
    images: [
      {
        url: absoluteUrl(siteConfig.ogImage, siteConfig.url),
        width: 1200,
        height: 630,
        alt: "FBS Signs frequently asked questions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: faqTitle,
    description:
      "Answers to common questions about signage, printing, direct mail, vehicle wraps, and LED channel letters.",
    images: [absoluteUrl(siteConfig.ogImage, siteConfig.url)],
  },
};

const faqs = [
  {
    category: "Business Signage",
    questions: [
      {
        q: "What types of business signs does FBS Signs make?",
        a: "FBS Signs produces a full range of commercial signage including LED channel letters, monument signs, pylon signs, vehicle wraps, full vehicle graphics, window graphics, window lettering, custom neon LED signs, LED light boxes, LED message boards, banner stands, advertising flags, canopy and awning signs, A-frame signicades, custom event tents, trade show displays, and yard signs.",
      },
      {
        q: "What is an LED channel letter sign?",
        a: "LED channel letters are three-dimensional individual letter signs illuminated from within using low-wattage LED lighting. They are the most common exterior sign type for shopping center storefronts because they offer high visibility, energy efficiency, and can be precisely customized to match brand fonts, colors, and illumination style. FBS Signs fabricates both front-lit and halo-lit channel letters.",
      },
      {
        q: "What is the difference between a monument sign and a pylon sign?",
        a: "Monument signs are low-profile ground-level signs built on a solid base that sits close to the ground, typically used for business parks, hotels, and upscale retail. Pylon signs (also called pole signs) are elevated on poles or a single post, designed for roadside visibility from a distance. Pylon signs are common for gas stations, fast food, and strip malls where high visibility from a moving vehicle matters.",
      },
      {
        q: "How long does it take to fabricate and install a business sign?",
        a: "Production time for most commercial signs ranges from 2 to 6 weeks after design approval, depending on sign type, complexity, and permitting requirements. Simple signs like banners or window graphics can be produced in 5 to 10 business days. Large illuminated signs like channel letters or monument signs take 4 to 6 weeks, including permit processing time.",
      },
      {
        q: "Does FBS Signs handle sign permits?",
        a: "Yes. FBS Signs works with local municipal permit requirements as part of the sign design and fabrication process. We incorporate municipal size limits, illumination restrictions, setback requirements, and landlord specifications into the sign design so the final product meets all necessary approval criteria. Permit fees vary by municipality.",
      },
      {
        q: "Can FBS Signs wrap vehicles for business fleets?",
        a: "Yes. We offer full vehicle wraps and partial vehicle graphics for single vehicles and commercial fleets of any size. Vehicle graphics turn company vehicles into mobile advertising assets. We work from your brand files and can design the wrap layout if needed.",
      },
      {
        q: "Does FBS Signs serve businesses outside of Illinois?",
        a: "Yes. While FBS Signs is headquartered in Illinois serving Naperville, Schaumburg, Chicago, and the surrounding metro area, we fabricate and ship signage for clients across the United States. National restaurant chains, hotel brands, and retail franchises are among our nationwide client base.",
      },
      {
        q: "What industries does FBS Signs serve?",
        a: "FBS Signs serves quick-service restaurants, hospitality brands, retail stores, healthcare offices, franchise chains, professional services, and independent businesses. Our client roster includes Buffalo Wild Wings, Dunkin', Subway, Popeyes, Wingstop, Holiday Inn, Motel 6, Cricket Wireless, and Jimmy John's.",
      },
    ],
  },
  {
    category: "Printing Products",
    questions: [
      {
        q: "What printing products does FBS Signs offer?",
        a: "FBS Signs offers a full range of commercial printing including business cards, brochures, flyers, posters, banners, calendars, menus, carbonless forms, door hangers, postcards, canvas prints, and large-format print materials. Pricing depends on product type, quantity, material, finishing, and turnaround.",
      },
      {
        q: "What is large-format printing?",
        a: "Large-format printing refers to print output wider than 24 inches, typically used for banners, trade show displays, retail backdrops, vehicle graphics, and outdoor advertising. FBS Signs produces large-format prints on a variety of substrates including vinyl, fabric, foam board, and corrugated plastic.",
      },
      {
        q: "How do I prepare files for printing?",
        a: "Print files should be submitted in PDF, AI, EPS, or high-resolution JPG or PNG format. Resolution should be at least 300 DPI at final print size for standard print, and 150 DPI for large-format prints over 6 feet. Files should include a bleed area of at least 0.125 inches on all sides. Contact FBS Signs if you need file setup assistance.",
      },
    ],
  },
  {
    category: "Direct Mail (EDDM)",
    questions: [
      {
        q: "What is EDDM direct mail?",
        a: "EDDM stands for Every Door Direct Mail, a USPS program that allows businesses to mail marketing materials to every address on selected mail carrier routes without needing a specific mailing list. Businesses choose routes by zip code and carrier route. It is commonly used by restaurants, retailers, and service businesses to reach a targeted local neighborhood.",
      },
      {
        q: "What are the three direct mail service levels FBS Signs offers?",
        a: "FBS Signs offers three EDDM service tiers. Design and Print covers the campaign design and production of printed materials. Print and Bundling adds USPS-required bundling and packaging to the print service. Full Service is a complete end-to-end campaign including design, print, route selection, bundling, USPS documentation, and mail-ready delivery to the post office.",
      },
      {
        q: "How much does a direct mail campaign cost?",
        a: "EDDM direct mail costs vary based on postcard size, print quantity, and service level. USPS postage for EDDM is currently $0.23 per piece. For a campaign mailing to 5,000 homes, postage alone is approximately $1,150. Design, print, and bundling costs are additional. Contact FBS Signs for a detailed quote based on your target area and quantity.",
      },
    ],
  },
  {
    category: "Service Areas in Illinois",
    questions: [
      {
        q: "Does FBS Signs serve businesses in Chicago?",
        a: "Yes. FBS Signs serves Chicago businesses across the Loop, River North, Lincoln Park, Wicker Park, South Loop, and all Chicago neighborhoods. We produce signage, printing, and direct mail for Chicago-area restaurants, retailers, professional offices, and franchise locations.",
      },
      {
        q: "What signage services are available in Naperville, IL?",
        a: "FBS Signs serves Naperville businesses with commercial signage including LED channel letters, monument signs, vehicle wraps, window graphics, and banner stands. We also provide printing products, EDDM direct mail, web design, and SEO services for Naperville and the Route 59 and 95th Street commercial corridors.",
      },
      {
        q: "Does FBS Signs work in Schaumburg, IL?",
        a: "Yes. FBS Signs serves Schaumburg businesses in the Woodfield area, Golf Road corridor, Higgins Road office district, and throughout the village. Services include storefront signage, large-format printing, direct mail, website design, and local SEO for Schaumburg and nearby Hoffman Estates and Elk Grove.",
      },
      {
        q: "Can FBS Signs serve Aurora, Joliet, Elgin, or Bolingbrook?",
        a: "Yes. FBS Signs serves the greater Chicago metro area including Aurora, Joliet, Elgin, Bolingbrook, Downers Grove, and surrounding communities. Contact us with your location and project details for a quote.",
      },
    ],
  },
  {
    category: "Getting Started",
    questions: [
      {
        q: "How do I get a quote from FBS Signs?",
        a: "Contact FBS Signs by phone at 1-855-222-1133 or submit the contact form at fbssigns.com/contact. Provide your sign type or print type, approximate dimensions or quantity, any existing brand files, and your timeline. We will review your project and provide a custom quote.",
      },
      {
        q: "Does FBS Signs offer web design and SEO alongside signage and printing?",
        a: "Yes. FBS Signs provides responsive business website design and full SEO services including technical SEO, local SEO, content optimization, Google Business Profile management, link building, and monthly reporting. These digital services complement our print and signage work to give clients consistent branding both online and in the physical world.",
      },
    ],
  },
];

const faqItems = faqs.flatMap((cat) =>
  cat.questions.map((item) => ({
    question: item.q,
    answer: item.a,
  })),
);

const faqSchema = buildFaqSchema(`${canonical}#faq`, faqItems);

const breadcrumbSchema = buildBreadcrumbSchema(
  [
    { name: "Home", path: "/" },
    { name: "FAQs", path: "/faq" },
  ],
  canonical,
  siteConfig.url,
);

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${canonical}#webpage`,
  name: "FAQs About Business Signage & Printing",
  description: faqDescription,
  url: canonical,
  inLanguage: "en-US",
  isPartOf: {
    "@id": websiteId(siteConfig.url),
  },
  breadcrumb: {
    "@id": `${canonical}#breadcrumb`,
  },
  mainEntity: {
    "@id": `${canonical}#faq`,
  },
};

export default function FaqPage() {
  return (
    <>
      <Script id="faq-schema" type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </Script>
      <Script id="faq-breadcrumb-schema" type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </Script>
      <Script id="faq-webpage-schema" type="application/ld+json">
        {JSON.stringify(webPageSchema)}
      </Script>

      <main className="container section-padding">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-3 bg-primary-light text-primary px-5 py-2 rounded-full shadow mb-6">
            <span className="w-2 h-2 bg-primary rounded-full" />
            <span className="text-[11px] font-bold uppercase tracking-widest">
              Common Questions
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-primary-dark leading-tight">
            FAQs  Business Signage,{" "}
            <span className="text-primary">Printing &amp; More</span>
          </h1>
          <p className="mt-4 text-primary-dark/70 text-lg">
            Answers about our services, sign types, direct mail, and locations
            across Illinois. Can&apos;t find what you need?{" "}
            <Link href="/contact" className="text-primary underline">
              Contact us directly.
            </Link>
          </p>
        </div>

        {/* FAQ categories */}
        <div className="max-w-4xl mx-auto space-y-16">
          {faqs.map((cat) => (
            <div key={cat.category}>
              <h2 className="text-2xl font-bold text-primary mb-6 pb-2 border-b border-primary-light">
                {cat.category}
              </h2>
              <FaqAccordion
                items={cat.questions.map((item) => ({
                  question: item.q,
                  answer: item.a,
                }))}
                name={`faq-${cat.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-20">
          <p className="text-primary-dark/70 mb-4 text-lg">
            Ready to get started or need a custom quote?
          </p>
          <Link href="/contact">
            <button className="inline-flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-full font-semibold shadow-lg transition-all duration-300 hover:bg-primary-dark">
              Contact FBS Signs
              <span>→</span>
            </button>
          </Link>
        </div>
      </main>
    </>
  );
}
