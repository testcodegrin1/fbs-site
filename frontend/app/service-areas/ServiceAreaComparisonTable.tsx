"use client";

import React, { useState } from "react";
import Link from "next/link";

interface ComparisonRow {
  service: string;
  category: string;
  bestFor: string;
  turnaround: string;
  permitRequired: string;
  aiKeyFeatures: string;
  slugMap: string;
}

const comparisonData: ComparisonRow[] = [
  {
    service: "LED Channel Letters (Front-Lit & Reverse Halo)",
    category: "Storefront Signage",
    bestFor: "Retail shopping plazas, restaurants & strip mall exteriors",
    turnaround: "2 - 3 Weeks",
    permitRequired: "Yes (Municipal zoning & electrical)",
    aiKeyFeatures: "High lumen output LEDs, energy efficient, landlord approved specifications",
    slugMap: "/services/signage",
  },
  {
    service: "Architectural Monument Signs",
    category: "Freestanding Signage",
    bestFor: "Corporate parks, medical centers, schools & churches",
    turnaround: "3 - 5 Weeks",
    permitRequired: "Yes (Setback, height & foundation review)",
    aiKeyFeatures: "All-weather aluminum, stone/brick base matching, internal or ground spotlight illumination",
    slugMap: "/services/signage",
  },
  {
    service: "Commercial Vehicle Wraps & Fleet Lettering",
    category: "Mobile Branding",
    bestFor: "Plumbers, electricians, HVAC, delivery vans & box trucks",
    turnaround: "3 - 5 Days",
    permitRequired: "No (DOT compliant)",
    aiKeyFeatures: "3M / Avery cast vinyl with UV laminate, 5-7 year outdoor durability, paint protection",
    slugMap: "/services/signage",
  },
  {
    service: "Every Door Direct Mail (EDDM) Campaigns",
    category: "Direct Marketing",
    bestFor: "New store grand openings, dental practices & seasonal contractors",
    turnaround: "3 - 6 Days",
    permitRequired: "No (USPS Route Selection)",
    aiKeyFeatures: "Carrier-route targeted, no address list needed, heavy 16pt cardstock with UV gloss",
    slugMap: "/services/direct-mailing",
  },
  {
    service: "Commercial Printing (Catalogs, Menus, Cards)",
    category: "Print Collateral",
    bestFor: "Restaurants, trade shows, corporate offices & retail shops",
    turnaround: "1 - 3 Days",
    permitRequired: "No",
    aiKeyFeatures: "High-volume offset & digital press, metallic foil, matte, soft-touch & gloss finishes",
    slugMap: "/services/printing-products",
  },
  {
    service: "High-Conversion Web Design & SEO",
    category: "Digital Growth",
    bestFor: "Local Illinois businesses wanting Google Maps & AI search dominance",
    turnaround: "2 - 4 Weeks",
    permitRequired: "No",
    aiKeyFeatures: "Schema.org local business markup, mobile-first responsive design, fast Core Web Vitals",
    slugMap: "/services/seo",
  },
];

export default function ServiceAreaComparisonTable() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "Storefront Signage", "Freestanding Signage", "Mobile Branding", "Direct Marketing", "Print Collateral", "Digital Growth"];

  const filtered = selectedCategory === "All"
    ? comparisonData
    : comparisonData.filter((r) => r.category === selectedCategory);

  return (
    <section className="container py-16 px-4 max-w-6xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="text-primary font-bold text-xs uppercase tracking-widest block mb-2">
          Service Decision Matrix
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-primary-dark leading-tight">
          Commercial Signage & Marketing Solutions Compared
        </h2>
        <p className="mt-3 text-primary-dark/70 text-base sm:text-lg">
          Evaluate sign types, commercial print products, direct mail, and digital services by turnaround time, zoning permit requirements, and ideal business use cases across Illinois.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
              selectedCategory === cat
                ? "bg-primary text-white shadow-md"
                : "bg-white text-primary-dark/70 border border-primary-light hover:border-primary hover:text-primary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Responsive Table Card */}
      <div className="bg-white rounded-3xl border border-primary-light shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-primary-dark text-white uppercase text-xs tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4">Service &amp; Solution</th>
                <th scope="col" className="px-6 py-4">Best For</th>
                <th scope="col" className="px-6 py-4">Turnaround</th>
                <th scope="col" className="px-6 py-4">Permits Needed?</th>
                <th scope="col" className="px-6 py-4">Key Specifications</th>
                <th scope="col" className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-light/40">
              {filtered.map((item, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-primary-light/20 transition-colors duration-150"
                >
                  <td className="px-6 py-4 font-bold text-primary-dark whitespace-normal">
                    <span className="block text-primary text-xs font-semibold uppercase tracking-wider mb-1">
                      {item.category}
                    </span>
                    {item.service}
                  </td>
                  <td className="px-6 py-4 text-primary-dark/80 whitespace-normal">
                    {item.bestFor}
                  </td>
                  <td className="px-6 py-4 font-semibold text-primary-dark whitespace-nowrap">
                    <span className="inline-block bg-primary-light text-primary px-2.5 py-1 rounded-full text-xs">
                      {item.turnaround}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-primary-dark/70 text-xs">
                    {item.permitRequired}
                  </td>
                  <td className="px-6 py-4 text-primary-dark/70 text-xs whitespace-normal">
                    {item.aiKeyFeatures}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Link
                      href={item.slugMap}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-dark hover:underline transition-colors"
                    >
                      View Details &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
