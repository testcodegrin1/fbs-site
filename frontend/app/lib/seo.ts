import type { Metadata } from "next";

export type PublicPagePath =
  | "/"
  | "/about"
  | "/blog"
  | "/contact"
  | "/faq"
  | "/know-you"
  | "/privacy"
  | "/our-work"
  | "/services/printing-products"
  | "/services/direct-mailing"
  | "/services/signage"
  | "/services/web-design"
  | "/services/seo";

type BreadcrumbItem = {
  name: string;
  path: string;
};

type PageSeoConfig = {
  title: string;
  description: string;
  keywords: string[];
  image: string;
  schemaType: string;
  breadcrumbs: BreadcrumbItem[];
  serviceType?: string;
};

export const siteConfig = {
  name: "FBS Signs",
  alternateName: "FBS Prints",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.fbssigns.com",
  defaultTitle: "FBS Signs",
  defaultDescription:
    "FBS Signs provides custom signage, printing products, direct mailing, web design, and SEO services for businesses that want to grow with bold branding and dependable execution.",
  defaultKeywords: [
    "FBS Signs",
    "FBS Prints",
    "signage services",
    "printing services",
    "direct mailing",
    "web design",
    "SEO services",
    "Illinois signage company",
  ],
  ogImage: "/images/home/printing-branding-hero.webp",
  logo: "/images/brand/fbs-prints-logo.webp",
  locale: "en_US",
  phone: "+1-855-222-1133",
  email: "info@fbsprints.com",
  priceRange: "$$",
  address: {
    locality: "Naperville",
    region: "IL",
    country: "US",
  },
  geo: {
    latitude: 41.7508,
    longitude: -88.1535,
  },
  openingHours: {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "09:00",
    closes: "18:00",
  },
  serviceAreas: [
    { city: "Naperville", stateCode: "IL" },
    { city: "Schaumburg", stateCode: "IL" },
    { city: "Aurora", stateCode: "IL" },
    { city: "Des Plaines", stateCode: "IL" },
    { city: "Hoffman Estates", stateCode: "IL" },
    { city: "Bolingbrook", stateCode: "IL" },
    { city: "Joliet", stateCode: "IL" },
    { city: "Crest Hill", stateCode: "IL" },
    { city: "Chicago", stateCode: "IL" },
    { city: "Romeoville", stateCode: "IL" },
    { city: "Westmont", stateCode: "IL" },
    { city: "Downers Grove", stateCode: "IL" },
    { city: "Lisle", stateCode: "IL" },
    { city: "Lombard", stateCode: "IL" },
    { city: "Plainfield", stateCode: "IL" },
    { city: "Oswego", stateCode: "IL" },
    { city: "Montgomery", stateCode: "IL" },
    { city: "Rockford", stateCode: "IL" },
    { city: "Belvidere", stateCode: "IL" },
    { city: "Gurnee", stateCode: "IL" },
    { city: "Waukegan", stateCode: "IL" },
    { city: "Chicago Heights", stateCode: "IL" },
    { city: "West Chicago", stateCode: "IL" },
    { city: "North Aurora", stateCode: "IL" },
    { city: "Elmhurst", stateCode: "IL" },
  ],
  // Add only verified profile URLs here. Placeholder root domains hurt entity resolution.
  sameAs: [
    "https://www.instagram.com/fbssigns",
    "https://www.facebook.com/fbssignsandprints/",
  ] as string[],
} as const;

export const supportedHosts = [
  "www.fbsprints.com",
  "fbsprints.com",
  "www.fbssigns.com",
  "fbssigns.com",
] as const;

const pageSeo: Record<PublicPagePath, PageSeoConfig> = {
  "/": {
    title: "FBS Prints | Printing, Signage, Web Design & SEO Services",
    description:
      "Explore FBS Prints for printing products, signage, direct mailing, web design, and SEO services built to help brands stand out and grow online.",
    keywords: [
      "printing products",
      "business signage",
      "direct mailing services",
      "web design company",
      "SEO agency",
      "branding services",
    ],
    image: "/images/home/printing-branding-hero.webp",
    schemaType: "WebPage",
    breadcrumbs: [{ name: "Home", path: "/" }],
  },
  "/about": {
    title: "About FBS Prints | Printing & Branding Experts",
    description:
      "Learn more about FBS Prints, our customer-first approach, and the printing, signage, and branding services we provide for businesses across industries.",
    keywords: [
      "about FBS Prints",
      "printing company Illinois",
      "branding experts",
      "signage company",
      "custom printing services",
    ],
    image: "/images/about/about-fbs-prints-team.webp",
    schemaType: "AboutPage",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "About Us", path: "/about" },
    ],
  },
  "/blog": {
    title: "Blog | FBS Prints",
    description:
      "Read FBS Prints insights on signage, printing, direct mail, web design, SEO, and practical growth ideas for local businesses.",
    keywords: [
      "FBS Prints blog",
      "signage articles",
      "printing tips",
      "direct mail guides",
      "web design insights",
      "SEO advice",
    ],
    image: "/images/home/printing-branding-hero.webp",
    schemaType: "CollectionPage",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
    ],
  },
  "/contact": {
    title: "Contact FBS Prints | Request Printing, Signage & Marketing Services",
    description:
      "Contact FBS Prints for printing, signage, direct mailing, web design, and SEO support. Reach our team for quotes, questions, and project consultations.",
    keywords: [
      "contact FBS Prints",
      "printing quote",
      "signage consultation",
      "marketing services contact",
      "Illinois print shop contact",
    ],
    image: "/images/contact/contact-support-hero.webp",
    schemaType: "ContactPage",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Contact Us", path: "/contact" },
    ],
  },
  "/faq": {
    title: "FAQs About Business Signage & Printing | FBS Signs Illinois",
    description:
      "Answers to the most common questions about business signage, LED channel letters, vehicle wraps, EDDM direct mail, and printing services. FBS Signs serves Illinois and nationwide.",
    keywords: [
      "business signage FAQ",
      "LED channel letter signs",
      "vehicle wrap cost",
      "EDDM direct mail",
      "printing FAQ Illinois",
      "signage company Chicago",
    ],
    image: "/images/home/printing-branding-hero.webp",
    schemaType: "WebPage",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "FAQs", path: "/faq" },
    ],
  },
  "/know-you": {
    title: "Know Your Signs | FBS Prints Signage Gallery",
    description:
      "Browse the FBS Prints signage gallery to explore business signs, awnings, vehicle wraps, illuminated letters, and more visual branding examples.",
    keywords: [
      "sign gallery",
      "business signage gallery",
      "vehicle wraps",
      "awning signs",
      "channel letters",
      "sign design inspiration",
    ],
    image: "/images/know-your-signs/know-your-signs-hero.webp",
    schemaType: "CollectionPage",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Know Your Signs", path: "/know-you" },
    ],
  },
  "/privacy": {
    title: "Privacy Policy | FBS Prints",
    description:
      "Read the FBS Prints privacy policy to understand how we handle quote requests, contact details, website usage data, and communication related to your projects.",
    keywords: [
      "privacy policy",
      "FBS Prints privacy",
      "quote request privacy",
      "website privacy policy",
      "data handling policy",
    ],
    image: "/images/brand/fbs-prints-logo.webp",
    schemaType: "WebPage",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Privacy Policy", path: "/privacy" },
    ],
  },
  "/services/printing-products": {
    title: "Commercial Printing Services Illinois | Custom Business Printing | FBS Signs",
    description:
      "Full-service commercial printing in Illinois: business cards, brochures, booklets, vinyl banners, restaurant menus, and large-format printing for Naperville, Chicago, and statewide businesses.",
    keywords: [
      "commercial printing services illinois",
      "custom printing naperville il",
      "large-format printing chicago",
      "business card printing",
      "custom brochure printing",
      "vinyl banner printing",
      "restaurant menu printing",
      "trade show display printing",
      "bulk printing cost illinois",
    ],
    image: "/images/services/printing/hotel-menu-printing.webp",
    schemaType: "WebPage",
    serviceType: "Printing Products",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Printing Product", path: "/services/printing-products" },
    ],
  },
  "/services/direct-mailing": {
    title: "Direct Mail Marketing & EDDM Services Illinois | FBS Signs",
    description:
      "Targeted direct mail campaigns and Every Door Direct Mail (EDDM) services across Chicago, Naperville, and Illinois: route targeting, postcard printing, USPS bundling, and distribution.",
    keywords: [
      "EDDM printing services illinois",
      "direct mail marketing chicago",
      "every door direct mail naperville",
      "postcard printing and mailing",
      "bulk postcard mailing",
      "targeted direct mail campaigns",
      "direct mail company illinois",
    ],
    image: "/images/services/direct-mail/direct-mail-marketing.webp",
    schemaType: "WebPage",
    serviceType: "Direct Mailing",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Direct Mailing", path: "/services/direct-mailing" },
    ],
  },
  "/services/signage": {
    title: "Custom Business Signs & Storefront Signage Illinois | FBS Signs",
    description:
      "Architectural business signs, illuminated LED channel letters, monument signs, pylon signs, vehicle wraps, and window graphics across Chicago, Naperville, Schaumburg, and 25 Illinois cities.",
    keywords: [
      "custom business signs illinois",
      "sign company naperville il",
      "custom storefront signs chicago",
      "LED channel letter signs",
      "illuminated business signs",
      "monument signs illinois",
      "pylon signs",
      "commercial vehicle wraps",
      "window lettering",
    ],
    image: "/images/services/signage/signage-services-hero.webp",
    schemaType: "WebPage",
    serviceType: "Signage",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Signage", path: "/services/signage" },
    ],
  },
  "/services/web-design": {
    title: "Website Design & Development Services Illinois | FBS Signs",
    description:
      "Custom responsive website design, eCommerce stores, and local service business websites engineered for speed, mobile conversion, and lead generation in Naperville, Schaumburg, and Illinois.",
    keywords: [
      "website design naperville il",
      "web design company schaumburg",
      "small business website design illinois",
      "responsive website design",
      "ecommerce website development",
      "conversion focused websites",
    ],
    image: "/images/services/web-design/business-website-design.webp",
    schemaType: "WebPage",
    serviceType: "Web Design",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Web Design", path: "/services/web-design" },
    ],
  },
  "/services/seo": {
    title: "Local SEO & Search Engine Optimization Illinois | FBS Signs",
    description:
      "Local SEO services for Illinois businesses: Google Business Profile optimization, local map pack rankings, technical SEO audits, and structured data in Naperville, Schaumburg, and Chicagoland.",
    keywords: [
      "local seo services illinois",
      "seo agency naperville il",
      "seo services schaumburg",
      "technical seo services",
      "google business profile optimization",
      "local search optimization",
      "chicagoland seo services",
    ],
    image: "/images/services/seo/seo-services-hero.webp",
    schemaType: "WebPage",
    serviceType: "SEO",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "SEO", path: "/services/seo" },
    ],
  },
  "/our-work": {
    title: "Our Work | FBS Signs Portfolio",
    description: "Explore the FBS Signs portfolio of custom signs, printing, and branding solutions.",
    keywords: [
      "portfolio",
      "our work",
      "custom signs portfolio",
      "printing projects",
    ],
    image: "/images/home/printing-branding-hero.webp",
    schemaType: "CollectionPage",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Our Work", path: "/our-work" },
    ],
  },
};

export const publicPagePaths = Object.keys(pageSeo) as PublicPagePath[];

export function resolveBaseUrl(host: string | null | undefined, protocol?: string | null) {
  const normalizedHost = host?.split(",")[0]?.trim().toLowerCase();

  if (!normalizedHost) {
    return siteConfig.url;
  }

  const isLocalHost =
    normalizedHost.startsWith("localhost:") ||
    normalizedHost.startsWith("127.0.0.1:");

  if (!isLocalHost) {
    return siteConfig.url;
  }

  const normalizedProtocol = protocol === "http" || protocol === "https" ? protocol : "http";

  return `${normalizedProtocol}://${normalizedHost}`;
}

export function absoluteUrl(path = "", baseUrl = siteConfig.url) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, baseUrl).toString();
}

export function organizationId(baseUrl = siteConfig.url) {
  return `${absoluteUrl("/", baseUrl)}#organization`;
}

export function websiteId(baseUrl = siteConfig.url) {
  return `${absoluteUrl("/", baseUrl)}#website`;
}

export function toAbsoluteImageUrl(imagePath: string | undefined, baseUrl = siteConfig.url) {
  if (!imagePath) {
    return absoluteUrl(siteConfig.logo, baseUrl);
  }

  return imagePath.startsWith("http")
    ? imagePath
    : absoluteUrl(imagePath.startsWith("/") ? imagePath : `/${imagePath}`, baseUrl);
}

export function buildAreaServedSchema() {
  return [
    ...siteConfig.serviceAreas.map((area) => ({
      "@type": "City",
      name: `${area.city}, ${area.stateCode}`,
    })),
    { "@type": "State", name: "Illinois" },
    { "@type": "Country", name: "United States" },
  ];
}

export function buildBreadcrumbSchema(
  items: BreadcrumbItem[],
  pageUrl: string,
  baseUrl = siteConfig.url,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path, baseUrl),
    })),
  };
}

export function buildFaqSchema(
  id: string,
  faqs: { question: string; answer: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": id,
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function buildPageMetadata(path: PublicPagePath, baseUrl = siteConfig.url): Metadata {
  const page = pageSeo[path];
  const canonical = absoluteUrl(path, baseUrl);
  const image = absoluteUrl(page.image, baseUrl);

  return {
    title: page.title,
    description: page.description,
    keywords: [...siteConfig.defaultKeywords, ...page.keywords],
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
      title: page.title,
      description: page.description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: page.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [image],
    },
  };
}

export function getGlobalSchemas(baseUrl = siteConfig.url) {
  const orgId = organizationId(baseUrl);
  const siteId = websiteId(baseUrl);

  return [
    {
      "@context": "https://schema.org",
      "@type": ["LocalBusiness", "PrintShop"],
      "@id": orgId,
      name: siteConfig.name,
      alternateName: siteConfig.alternateName,
      url: absoluteUrl("/", baseUrl),
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(siteConfig.logo, baseUrl),
      },
      image: absoluteUrl(siteConfig.ogImage, baseUrl),
      description: siteConfig.defaultDescription,
      email: siteConfig.email,
      telephone: siteConfig.phone,
      priceRange: siteConfig.priceRange,
      address: {
        "@type": "PostalAddress",
        addressLocality: siteConfig.address.locality,
        addressRegion: siteConfig.address.region,
        addressCountry: siteConfig.address.country,
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: siteConfig.geo.latitude,
        longitude: siteConfig.geo.longitude,
      },
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: siteConfig.openingHours.days,
          opens: siteConfig.openingHours.opens,
          closes: siteConfig.openingHours.closes,
        },
      ],
      areaServed: buildAreaServedSchema(),
      knowsAbout: [
        "Business Signage",
        "LED Channel Letters",
        "Monument Signs",
        "Vehicle Wraps",
        "Window Graphics",
        "Commercial Printing",
        "Every Door Direct Mail",
        "Large Format Printing",
        "Web Design",
        "Search Engine Optimization",
      ],
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer service",
          telephone: siteConfig.phone,
          email: siteConfig.email,
          areaServed: "US",
          availableLanguage: "en",
        },
      ],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Signage and Printing Services",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Business Signage",
              description:
                "Custom business signs including LED channel letters, monument signs, pylon signs, vehicle wraps, window graphics, and banner stands.",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Printing Products",
              description:
                "Business cards, brochures, flyers, banners, menus, and large-format printing.",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Direct Mailing",
              description:
                "End-to-end EDDM direct mail campaigns including design, print, bundling, and delivery.",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Web Design",
              description:
                "Responsive business websites for stronger online visibility and lead conversion.",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "SEO Services",
              description:
                "Technical SEO, local SEO, on-page optimization, and monthly reporting.",
            },
          },
        ],
      },
      ...(siteConfig.sameAs.length > 0 && { sameAs: siteConfig.sameAs }),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": siteId,
      name: siteConfig.name,
      alternateName: siteConfig.alternateName,
      url: absoluteUrl("/", baseUrl),
      description: siteConfig.defaultDescription,
      publisher: { "@id": orgId },
      inLanguage: "en-US",
    },
  ];
}

export function getRouteSchemas(path: PublicPagePath, baseUrl = siteConfig.url) {
  const page = pageSeo[path];
  const url = absoluteUrl(path, baseUrl);
  const pageId = `${url}#webpage`;
  const breadcrumbId = `${url}#breadcrumb`;
  const orgId = organizationId(baseUrl);
  const siteId = websiteId(baseUrl);

  const faqSchemas: Partial<Record<PublicPagePath, object>> = {
    "/": {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${absoluteUrl("/", baseUrl)}#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "What services does FBS Signs offer?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "FBS Signs offers custom business signage, commercial printing products, direct mailing campaigns, web design, and SEO services. We serve businesses in Illinois and nationwide with full-service branding and marketing solutions.",
          },
        },
        {
          "@type": "Question",
          name: "What types of business signs does FBS Signs make?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "FBS Signs produces LED channel letters, monument signs, pylon signs, vehicle wraps, window graphics, custom neon LED signs, banner stands, advertising flags, canopy and awning signs, LED light boxes, trade show displays, yard signs, and A-frame signicades.",
          },
        },
        {
          "@type": "Question",
          name: "Does FBS Signs serve clients outside of Illinois?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. While FBS Signs is headquartered in Illinois serving Naperville and Schaumburg, we serve clients nationwide. Our printing, signage fabrication, and digital services can be delivered to businesses across the United States.",
          },
        },
        {
          "@type": "Question",
          name: "How do I get a quote for signage or printing?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Contact FBS Signs by phone at 1-855-222-1133 or by submitting the contact form on our website. Share your project type, dimensions, quantity, and timeline and we will provide a custom quote.",
          },
        },
        {
          "@type": "Question",
          name: "Does FBS Signs handle both design and fabrication for signs?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. FBS Signs handles the full signage workflow including design, fabrication, and installation guidance. We work with client brand specifications and local municipal regulations to produce signs that meet your exact requirements.",
          },
        },
        {
          "@type": "Question",
          name: "Can FBS Signs handle direct mail campaigns end to end?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Our direct mailing service covers design, print production, route targeting, bundling, and mail-ready preparation. Businesses can manage the full campaign through a single vendor.",
          },
        },
      ],
    },
    "/services/signage": {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${absoluteUrl("/services/signage", baseUrl)}#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "What types of signage does FBS Signs provide?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "FBS Signs provides LED channel letters, monument signs, pylon signs, vehicle wraps, window graphics, window lettering, custom neon LED signs, LED light boxes, LED message boards, banner stands, advertising flags, canopy and awning signs, trade show display products, A-frame signicades, and yard signs.",
          },
        },
        {
          "@type": "Question",
          name: "What is an LED channel letter sign?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "LED channel letters are three-dimensional individual letter signs illuminated from within using low-wattage LED lighting. They are the most common exterior sign type for businesses in shopping centers because they offer high visibility, energy efficiency, and can be customized to match brand colors and fonts.",
          },
        },
        {
          "@type": "Question",
          name: "Does FBS Signs fabricate illuminated signs like channel letters?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Illuminated channel letters are among our most popular sign types. We fabricate LED channel letters for shopping center storefronts and commercial buildings using low-wattage LED lights and working within landlord specifications and municipal regulations.",
          },
        },
        {
          "@type": "Question",
          name: "Can FBS Signs wrap vehicles for business fleets?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. We offer full vehicle wraps and partial vehicle graphics for single vehicles and commercial fleets. Vehicle graphics turn company vehicles into mobile advertising and brand visibility assets.",
          },
        },
        {
          "@type": "Question",
          name: "Does FBS Signs make tradeshow signs and printed awnings?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. We produce tradeshow display signage for Chicago-area events, along with printed awnings and canopy signage for storefronts. We also design and install billboards, including projects for businesses in Elgin and the wider Chicagoland market.",
          },
        },
        {
          "@type": "Question",
          name: "What areas does FBS Signs serve for commercial signage?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "FBS Signs is based in Illinois and primarily serves Naperville, Schaumburg, and the greater Chicagoland area. We are also a nationwide signage fabricator and serve commercial clients across the United States.",
          },
        },
        {
          "@type": "Question",
          name: "How do I request a signage quote from FBS Signs?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Contact FBS Signs at 1-855-222-1133 with your sign type, intended location, approximate dimensions, and timeline. We will review your requirements and provide a custom quote.",
          },
        },
      ],
    },
  };

  const breadcrumbSchema = buildBreadcrumbSchema(page.breadcrumbs, url, baseUrl);

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": page.schemaType,
    "@id": pageId,
    name: page.title,
    description: page.description,
    url,
    inLanguage: "en-US",
    isPartOf: { "@id": siteId },
    about: { "@id": orgId },
    breadcrumb: { "@id": breadcrumbId },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: absoluteUrl(page.image, baseUrl),
      caption: page.title,
    },
  };

  const faqSchema = faqSchemas[path];

  if (!page.serviceType) {
    return faqSchema
      ? [breadcrumbSchema, pageSchema, faqSchema]
      : [breadcrumbSchema, pageSchema];
  }

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: page.serviceType,
    serviceType: page.serviceType,
    description: page.description,
    url,
    image: absoluteUrl(page.image, baseUrl),
    provider: { "@id": orgId },
    areaServed: buildAreaServedSchema(),
  };

  return faqSchema
    ? [breadcrumbSchema, pageSchema, serviceSchema, faqSchema]
    : [breadcrumbSchema, pageSchema, serviceSchema];
}
