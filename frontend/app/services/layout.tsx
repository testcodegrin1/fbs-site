import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { getRequestBaseUrl } from "@/app/lib/request-url";
import { absoluteUrl, siteConfig } from "@/app/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await getRequestBaseUrl();
  const canonical = absoluteUrl("/services", baseUrl);

  return {
    title: "Commercial Signage, Printing, Direct Mail & Digital Services | FBS Signs",
    description:
      "Explore FBS Signs full suite of business services: custom illuminated signs, LED channel letters, architectural monuments, commercial printing, EDDM direct mail, web design, and local SEO in Illinois.",
    keywords: [
      "commercial signage",
      "custom business signs",
      "LED channel letters",
      "monument signs",
      "commercial printing",
      "direct mail marketing",
      "EDDM postcard printing",
      "local SEO services",
      "business website design",
      ...siteConfig.defaultKeywords,
    ],
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url: canonical,
      siteName: siteConfig.name,
      title: "Commercial Signage, Printing, Direct Mail & Digital Services | FBS Signs",
      description:
        "Custom signs, commercial printing, EDDM direct mail, web design and local SEO services built to grow Illinois businesses.",
      images: [
        {
          url: absoluteUrl(
            "/images/services/signage/signage-service.webp",
            baseUrl,
          ),
          width: 1200,
          height: 630,
          alt: "FBS Signs business services overview",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Commercial Signage, Printing, Direct Mail & Digital Services | FBS Signs",
      description:
        "Custom signs, commercial printing, EDDM direct mail, web design and local SEO services built to grow Illinois businesses.",
      images: [
        absoluteUrl("/images/services/signage/signage-service.webp", baseUrl),
      ],
    },
  };
}

export default async function ServicesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const baseUrl = await getRequestBaseUrl();
  const canonical = absoluteUrl("/services", baseUrl);

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
        name: "Services",
        item: canonical,
      },
    ],
  };

  const servicesPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonical}#webpage`,
    name: "Commercial Signage, Printing, Direct Mail & Digital Services | FBS Signs",
    description:
      "Explore FBS Signs full suite of business services: custom illuminated signs, LED channel letters, architectural monuments, commercial printing, EDDM direct mail, web design, and local SEO in Illinois.",
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
        id="services-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="services-page-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesPageSchema) }}
      />
      {children}
    </>
  );
}
