"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Printer, Signpost, Mail, Globe, Search, CheckCircle2 } from "lucide-react";
import "aos/dist/aos.css";

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
                <h1
                  className="font-semibold text-primary-dark leading-tight tracking-tight
                  text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
                >
                  Our <span className="text-primary">Services</span>
                </h1>

                <p className="text-primary-dark/70 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  From premium commercial printing and custom business signage to direct mail
                  campaigns, website design, and search engine optimization - FBS Signs provides all
                  the tools your business needs to stand out and scale.
                </p>
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
                        alt="FBS Printing Services"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  <div className="col-span-1 space-y-4 sm:space-y-6 sm:mt-40">
                    <div className="rounded-2xl aspect-square overflow-hidden relative float-2">
                      <Image
                        src="/images/home/home2.webp"
                        alt="FBS Signage Solutions"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  <div className="col-span-1 space-y-6 sm:mt-16">
                    <div className="rounded-2xl aspect-square overflow-hidden relative float-1">
                      <Image
                        src="/images/home/home3.jpg"
                        alt="FBS Marketing Services"
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
        <div className="text-center mb-12" data-aos="fade-up">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-dark mb-4">
            Comprehensive <span className="text-primary">Branding &amp; Marketing</span> Solutions
          </h2>
          <p className="text-primary-dark/70 text-base md:text-lg max-w-3xl mx-auto">
            Select a service category below to explore custom solutions tailored specifically to
            your business goals and industry needs.
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

      {/* CTA Section */}
      <section className="container section-padding pt-0">
        <div className="bg-linear-to-r from-primary-dark to-primary rounded-3xl p-8 sm:p-12 text-white text-center shadow-xl">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Ready to Take Your Business to the Next Level?
          </h2>
          <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto mb-8">
            Contact our team of signage, printing, and digital marketing experts today for a free custom quote and consultation.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-3 bg-white text-primary hover:bg-primary-light px-8 py-4 rounded-full font-extrabold text-base shadow-lg transition-transform hover:scale-105"
          >
            Get a Free Quote
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
