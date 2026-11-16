import type { MetadataRoute } from "next";
import { statSync } from "node:fs";
import path from "node:path";
import { absoluteUrl, publicPagePaths } from "@/app/lib/seo";
import { getServiceLocationPages } from "@/app/lib/service-location-pages";
import { serviceAreas } from "@/app/data/service-areas-data";
import { blogPosts } from "@/app/data/blog";

import printingProducts from "@/app/data/printing-products-detail.json";
import directMailData from "@/app/data/direct-mailing.json";
import seoServices from "@/app/data/seo-services.json";
import webDesignServices from "@/app/data/web-design.json";
import signageProducts from "@/app/data/product-detail.json";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.fbssigns.com";

const defaultLastModified = "2026-05-01";

const corePageLastModified: Partial<Record<string, string>> = {
  "/": "2026-06-04",
  "/about": "2026-05-01",
  "/contact": "2026-05-01",
  "/faq": "2026-06-04",
  "/know-you": "2026-05-01",
  "/privacy": "2026-04-01",
};

function getFileModifiedDate(relativePath: string) {
  try {
    return statSync(path.join(process.cwd(), relativePath)).mtime;
  } catch {
    return new Date(defaultLastModified);
  }
}

function getLatestDate(values: string[], fallback = defaultLastModified) {
  const timestamps = values
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value));

  if (timestamps.length === 0) {
    return new Date(fallback);
  }

  return new Date(Math.max(...timestamps));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const latestBlogDate = getLatestDate(blogPosts.map((post) => post.date), "2026-07-09");
  const latestServiceAreaDate = getLatestDate(serviceAreas.map((city) => city.updatedAt), "2026-07-06");
  const printingProductsDate = getFileModifiedDate("app/data/printing-products-detail.json");
  const directMailDate = getFileModifiedDate("app/data/direct-mailing.json");
  const seoServicesDate = getFileModifiedDate("app/data/seo-services.json");
  const webDesignDate = getFileModifiedDate("app/data/web-design.json");
  const signageProductsDate = getFileModifiedDate("app/data/product-detail.json");

  const corePages: MetadataRoute.Sitemap = publicPagePaths.map((path) => ({
    url: absoluteUrl(path, baseUrl),
    lastModified:
      path === "/blog"
        ? latestBlogDate
        : path === "/services/printing-products"
          ? printingProductsDate
          : path === "/services/direct-mailing"
            ? directMailDate
            : path === "/services/signage"
              ? signageProductsDate
              : path === "/services/web-design"
                ? webDesignDate
                : path === "/services/seo"
                  ? seoServicesDate
                  : new Date(corePageLastModified[path] ?? defaultLastModified),
    changeFrequency: path === "/blog" ? "daily" : "weekly",
    priority: path === "/" ? 1 : path.startsWith("/services/") ? 0.9 : 0.8,
  }));

  const serviceLocationPages: MetadataRoute.Sitemap = getServiceLocationPages().map((page) => ({
    url: absoluteUrl(page.path, baseUrl),
    lastModified: new Date(page.location.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const printingProductPages: MetadataRoute.Sitemap = printingProducts.map((product) => ({
    url: absoluteUrl(`/services/printing-products/${product.slug}`, baseUrl),
    lastModified: printingProductsDate,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const directMailPages: MetadataRoute.Sitemap = directMailData.formats.map((format) => ({
    url: absoluteUrl(`/services/direct-mailing/${format.slug}`, baseUrl),
    lastModified: directMailDate,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const seoDetailPages: MetadataRoute.Sitemap = seoServices.map((service) => ({
    url: absoluteUrl(`/services/seo/${service.slug}`, baseUrl),
    lastModified: seoServicesDate,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const webDesignDetailPages: MetadataRoute.Sitemap = webDesignServices.map((service) => ({
    url: absoluteUrl(`/services/web-design/${service.slug}`, baseUrl),
    lastModified: webDesignDate,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const signageDetailPages: MetadataRoute.Sitemap = signageProducts.map((product) => ({
    url: absoluteUrl(`/services/signage/${product.slug}`, baseUrl),
    lastModified: signageProductsDate,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const blogDetailPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`, baseUrl),
    lastModified: new Date(post.date),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const serviceAreaPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/service-areas", baseUrl),
      lastModified: latestServiceAreaDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...serviceAreas.map((city) => ({
      url: absoluteUrl(`/service-areas/${city.slug}`, baseUrl),
      lastModified: new Date(city.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  return [
    ...corePages,
    ...serviceLocationPages,
    ...printingProductPages,
    ...directMailPages,
    ...seoDetailPages,
    ...webDesignDetailPages,
    ...signageDetailPages,
    ...blogDetailPages,
    ...serviceAreaPages,
  ];
}
