"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import "aos/dist/aos.css";

// Lucide Icons
import {
  Mail,
  Phone,
  Clock,
  Check,
  ShieldCheck,
  Truck,
  ArrowRight,
  Users,
  Target,
  TrendingUp,
  FileText,
  MapPin,
  Sparkles,
  Database,
  MailOpen,
  Calendar,
  Layers,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
} from "lucide-react";

// Shared format data (same JSON used by app/services/direct-mailing/[slug]/page.tsx)
import rawData from "../../data/direct-mailing.json";
import FaqAccordion from "@/app/Components/FaqAccordion";

interface MailFormat {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  img: string;
  detailsLabel: string;
  detailsValue: string;
}

const directMailFormats = (rawData as { formats: MailFormat[] }).formats;

export default function DirectMailingPage() {
  const [loaderDone, setLoaderDone] = useState(false);

  // Carousel Images
  const carouselImages = [
    {
      src: "/images/services/direct-mail/direct-mail-marketing.webp",
      alt: "Direct Mail Marketing Materials Showcase",
    },
    {
      src: "/images/services/direct-mail/mailing-documentation.webp",
      alt: "Mailing Documentation and Sorting Preparation",
    },
    {
      src: "/images/services/direct-mail/print-design-example.webp",
      alt: "Printed Direct Mail Design and Catalogs Showcase",
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [carouselImages.length]);

  // Estimator States
  const [selectedMailer, setSelectedMailer] = useState("postcard");
  const [selectedService, setSelectedService] = useState("eddm");
  const [selectedQuantity, setSelectedQuantity] = useState("2500");

  useEffect(() => {
    const initAOS = async () => {
      const AOS = (await import("aos")).default;
      AOS.init({
        duration: 1000,
        once: true,
        easing: "ease-in-out",
        offset: 80,
      });
    };
    initAOS();
  }, []);

  // Estimator Pricing Logic
  const mailerRates: Record<string, number> = {
    postcard: 0.32,
    letter: 0.45,
    catalog: 1.15,
    "self-mailer": 0.52,
  };

  const serviceRates: Record<string, number> = {
    eddm: 0.19, // Postage rate per piece for EDDM
    targeted: 0.28, // Regular marketing postage
    "full-service": 0.35, // Premium sorting & addressing list service
  };

  const qty = parseInt(selectedQuantity) || 1000;
  const unitCost = mailerRates[selectedMailer] + serviceRates[selectedService];
  const totalCost = unitCost * qty;

  // FAQ Data
  const faqs = [
    {
      q: "What is Every Door Direct Mail (EDDM)?",
      a: "EDDM is a USPS service that lets you target specific carrier routes in neighborhoods without having to buy mailing lists or address each piece. It's the most cost-effective way to send postcards to local residents.",
    },
    {
      q: "Do I need to purchase a list of addresses?",
      a: "Not necessarily. If you use EDDM, no list is needed. For targeted demographic mailings, we can help you purchase or rent a high-quality list tailored to parameters like age, income, and homeownership.",
    },
    {
      q: "What is the typical turnaround time for mailings?",
      a: "Once your print design files are finalized and approved, printing and postage bundling preparation usually takes 3 to 5 business days. Postal delivery times depend on the postage level selected (First Class vs. Standard).",
    },
    {
      q: "Can I personalize individual mail pieces?",
      a: "Yes! Using Variable Data Printing (VDP), we can print unique recipient names, localized offers, customized coupon codes, and personalized QR codes on each mailer to increase engagement.",
    },
    {
      q: "What is NCOA processing?",
      a: "National Change of Address (NCOA) matches list names and addresses against USPS database changes to update moved addresses, reducing returned mail and saving you budget.",
    },
    {
      q: "How is postage handled?",
      a: "Postage is processed directly through our commercial mailing permit to unlock bulk automation discounts. We calculate and pre-bundle postage fees as part of your custom campaign quote.",
    },
  ];

  return (
    <>
      <main>
        {/* Section 1: Hero Section */}
        <section className="bg-linear-to-br mt-24 xl:mt-20 from-rose-50 via-white to-primary-light">
          <div className="container py-10 sm:py-16 md:py-20 lg:py-24">
            <p className="text-sm text-primary-dark/70 sm:text-lg">
              <Link href="/" className="text-primary">
                Home
              </Link>
              <span className="mx-2">&gt;</span>
              <span className="font-semibold text-primary-dark">Direct Mailing</span>
            </p>
            <div className="grid items-center gap-10 sm:gap-12 lg:grid-cols-2 lg:gap-20 mt-10 lg:mt-0">
              {/* Left Content */}
              <div
                data-aos="fade-right"
                className="flex flex-col justify-center space-y-5 sm:space-y-6 text-center lg:text-left"
              >
                <div className="flex justify-center lg:justify-start">
                  <div className="inline-flex items-center gap-2 sm:gap-3 rounded-full border border-primary-light bg-white px-4 py-1.5 sm:px-5 sm:py-2 shadow-sm">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-primary">
                      Print & Post Solutions
                    </span>
                  </div>
                </div>

                <h1 className="text-3xl font-semibold leading-tight tracking-tight text-primary-dark sm:text-5xl md:text-6xl lg:text-7xl">
                  Direct Mail
                  <span className="text-primary"> Marketing</span>
                </h1>

                <p className="mx-auto max-w-2xl text-sm text-primary-dark/70 sm:text-lg lg:mx-0">
               FBS Prints provides direct mailing services that help businesses reach targeted customers through professionally printed and mailed materials. From direct mail design and printing to addressing, mailing lists, postage, and delivery preparation, we manage the mailing process from start to finish. Our direct mailing solutions can be tailored to different campaigns, audiences, and business requirements.
                </p>

                <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 sm:gap-4">
                  <a
                    href="#estimator"
                    className="w-full sm:w-auto text-center rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold px-6 py-3.5 sm:px-8 sm:py-4 transition shadow-lg text-sm"
                  >
                    Estimate Campaign Cost
                  </a>
                  <a
                    href="tel:+18552221133"
                    className="w-full sm:w-auto rounded-2xl border border-primary-light bg-white hover:bg-primary-light/40 text-primary font-bold px-6 py-3.5 sm:px-8 sm:py-4 transition shadow-sm text-sm flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Call to Discuss
                  </a>
                </div>
              </div>

              {/* Right Content - Image Grid */}
              <div className="relative hidden md:block">
                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-light rounded-full hidden md:block opacity-50 blur-2xl"></div>
                <div className="absolute bottom-20 -left-10 w-60 h-60 bg-primary-light rounded-full hidden md:block opacity-50 blur-3xl"></div>
                <div className="absolute top-32 right-10 w-32 h-32 bg-primary-light rounded-full hidden md:block opacity-50 blur-2xl"></div>

                {/* Image grid */}
                <div className="relative grid grid-cols-3 sm:grid-cols-3 gap-3 sm:gap-4">
                  {/* Column 1 */}
                  <div className="col-span-1 space-y-4 sm:space-y-6 sm:mt-16">
                    <div className="rounded-2xl aspect-square overflow-hidden relative float-1">
                      <Image
                        src="/images/services/direct-mail/direct-mail-marketing.webp"
                        alt="Direct Mail Marketing Materials Showcase"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Column 2 (Center) */}
                  <div className="col-span-1 space-y-4 sm:space-y-6 sm:mt-40">
                    <div className="rounded-2xl aspect-square overflow-hidden relative float-2">
                      <Image
                        src="/images/services/direct-mail/mailing-documentation.webp"
                        alt="Mailing Documentation and Sorting Preparation"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Column 3 - hidden on mobile */}
                  <div className="col-span-1 space-y-6 sm:mt-16 ">
                    <div className="rounded-2xl aspect-square overflow-hidden relative float-1">
                      <Image
                        src="/images/services/direct-mail/print-design-example.webp"
                        alt="Printed Direct Mail Design and Catalogs Showcase"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Core Strategy Cards (Why Direct Mail Works) */}
        <section className="container py-10 sm:py-14 md:py-20 bg-white">
          <div className="mx-auto mb-10 sm:mb-16 max-w-3xl text-center" data-aos="fade-up">
            <span className="mb-2 block text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">
              Marketing Intelligence
            </span>
            <h2 className="text-2xl font-bold sm:text-3xl md:text-5xl text-primary-dark">
              Why Direct Mail Delivers Results
            </h2>
            <p className="mt-3 text-sm sm:text-base text-primary-dark/70">
              In a highly saturated digital ecosystem, physical mail stands out, legitimizes brands,
              and achieves incredible response rates when backed by targeted data.
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div
              className="rounded-3xl border border-primary-light bg-primary-light/40/50 p-6 sm:p-8 shadow-sm hover:shadow-md transition duration-300"
              data-aos="fade-up"
              data-aos-delay="0"
            >
              <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-primary-dark mb-3">Hyper-Targeted Data</h3>
              <p className="text-sm leading-relaxed text-primary-dark/70">
                Maximize conversion rates by targeting recipients based on exact demographic criteria
                such as household income, age, marital status, and homeownership. Alternatively, Every Door
                Direct Mail (EDDM) lets you target specific neighborhood carrier routes to achieve 100%
                geographic saturation. Precision targeting guarantees your mail reaches high-intent local audiences.
              </p>
            </div>

            <div
              className="rounded-3xl border border-primary-light bg-primary-light/40/50 p-6 sm:p-8 shadow-sm hover:shadow-md transition duration-300"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-primary-dark mb-3">Tactile & Tangible Impact</h3>
              <p className="text-sm leading-relaxed text-primary-dark/70">
                In a saturated digital environment, physical mail stands out in a crowded mailbox. The
                tactile sensation of handling a premium paper stock creates a psychological connection
                and trust that digital screens cannot match. Enhancing your pieces with custom coatings,
                die-cut shapes, or soft-touch laminates ensures your brand leaves a lasting, positive impression.
              </p>
            </div>

            <div
              className="rounded-3xl border border-primary-light bg-primary-light/40/50 p-6 sm:p-8 shadow-sm hover:shadow-md transition duration-300 sm:col-span-2 lg:col-span-1"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-primary-dark mb-3">Omnichannel ROI Boost</h3>
              <p className="text-sm leading-relaxed text-primary-dark/70">
                Direct mail campaigns achieve maximum ROI when integrated into an omnichannel marketing
                strategy. By incorporating custom landing page URLs, unique QR codes, and coordinated digital
                re-targeting ads, you can increase response rates by over 28%. Combining physical print and
                digital touchpoints creates a seamless path to buy.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2.5: Direct Mail Performance Statistics & Industry Data */}
        <section className="px-4 sm:px-6 my-8 sm:my-12" data-aos="fade-up">
          <div className="mx-auto max-w-7xl rounded-[24px] sm:rounded-[32px] bg-linear-to-br from-primary-dark via-primary-dark to-primary-dark text-white p-6 sm:p-10 md:p-16 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative z-10 grid gap-8 sm:gap-12 lg:grid-cols-[1fr_2fr] items-center">
              {/* Header info */}
              <div>
                <span className="inline-block rounded-full bg-primary/20 border border-primary/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                  Market Research Data
                </span>
                <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                  Direct Mail Performance Metrics
                </h2>
                <p className="mt-4 text-sm text-primary-light/80 leading-relaxed">
                  Official industry data shows that print marketing delivers a tactile reliability
                  and conversion power that digital channels struggle to replicate.
                </p>
                <div className="mt-6 border-t border-primary-light/20 pt-4">
                  <span className="block text-[11px] font-semibold uppercase tracking-widest text-primary">
                    Sources & Attribution
                  </span>
                  <span className="mt-1 block text-xs text-primary-light/80 leading-relaxed">
                    USPS Delivers, Association of National Advertisers (ANA), and Lob State of Direct Mail Reports.
                  </span>
                </div>
              </div>

              {/* Grid of stats */}
              <div className="grid gap-4 sm:gap-6 grid-cols-2">
                <div className="rounded-2xl border border-primary-light/20 bg-primary-dark/40 p-4 sm:p-6 backdrop-blur-sm">
                  <div className="text-2xl sm:text-4xl font-extrabold text-primary md:text-5xl">90%</div>
                  <h4 className="mt-2 text-xs sm:text-sm font-bold text-white">Household Open Rate</h4>
                  <p className="mt-2 hidden sm:block text-xs leading-relaxed text-primary-light/70">
                    Over 90% of direct mail is opened and reviewed by recipients, compared to average email open rates of just 20%.
                  </p>
                </div>

                <div className="rounded-2xl border border-primary-light/20 bg-primary-dark/40 p-4 sm:p-6 backdrop-blur-sm">
                  <div className="text-2xl sm:text-4xl font-extrabold text-primary md:text-5xl">17 Days</div>
                  <h4 className="mt-2 text-xs sm:text-sm font-bold text-white">Average Household Lifespan</h4>
                  <p className="mt-2 hidden sm:block text-xs leading-relaxed text-primary-light/70">
                    Physical mailers are kept in households for an average of 17 days, offering continuous brand impressions.
                  </p>
                </div>

                <div className="rounded-2xl border border-primary-light/20 bg-primary-dark/40 p-4 sm:p-6 backdrop-blur-sm">
                  <div className="text-2xl sm:text-4xl font-extrabold text-primary md:text-5xl">9.0%</div>
                  <h4 className="mt-2 text-xs sm:text-sm font-bold text-white">Warm List Response Rate</h4>
                  <p className="mt-2 hidden sm:block text-xs leading-relaxed text-primary-light/70">
                    Warm house lists yield response rates up to 9% (and acquisition campaigns average 5%), beating email by 10x.
                  </p>
                </div>

                <div className="rounded-2xl border border-primary-light/20 bg-primary-dark/40 p-4 sm:p-6 backdrop-blur-sm">
                  <div className="text-2xl sm:text-4xl font-extrabold text-primary md:text-5xl">112%</div>
                  <h4 className="mt-2 text-xs sm:text-sm font-bold text-white">Median Campaign ROI</h4>
                  <p className="mt-2 hidden sm:block text-xs leading-relaxed text-primary-light/70">
                    Direct mail offers a median return on investment of 112% when combined with digital retargeting tactics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Direct Mail Format Examples  now sourced from JSON + linked to /[slug] */}
        <section className="bg-primary-light/40 py-10 sm:py-16 md:py-24">
          <div className="container">
            <div className="mx-auto mb-10 sm:mb-16 max-w-3xl text-center" data-aos="fade-up">
              <span className="mb-2 block text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">
                Production Formats
              </span>
              <h2 className="text-2xl font-bold sm:text-3xl md:text-5xl text-primary-dark">
                Popular Direct Mail Formats
              </h2>
              <p className="mt-3 text-sm sm:text-base text-primary-dark/70">
                We custom print and process several major mail styles. Tailor dimensions,
                paper weights, and folding specifications for your unique branding goals.
              </p>
            </div>

            <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {directMailFormats.map((format, idx) => (
                <Link
                  key={format.slug}
                  href={`/services/direct-mailing/${format.slug}`}
                  className="group flex flex-col rounded-3xl bg-white p-6 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition duration-300"
                  data-aos="fade-up"
                  data-aos-delay={idx * 100}
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-primary-dark">{format.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-primary-dark/70 flex-grow">
                    {format.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-primary-light pt-3">
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-primary-dark/45">
                      {format.detailsLabel}: {format.detailsValue}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-primary opacity-0 -translate-x-1 transition duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: Mailing Lists & Guidelines */}
        <section className="container py-10 sm:py-16 md:py-24">
          <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="relative" data-aos="fade-right">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[20px] sm:rounded-[28px] border border-primary-light bg-white shadow-lg">
                <Image
                  src="/images/services/direct-mail/mailing-documentation.webp"
                  alt="Mailing documentation processing"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div className="space-y-5 sm:space-y-6" data-aos="fade-left">
              <span className="block text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">
                Data & Postal Processing
              </span>
              <h2 className="text-2xl font-bold text-primary-dark sm:text-3xl md:text-4xl">
                Post-Office Ready Logistics
              </h2>
              <p className="text-sm sm:text-base text-primary-dark/70 leading-relaxed">
                Avoid logistics stress. We coordinate with the postal authorities, process lists,
                and optimize bundle configurations to qualify your campaign for the lowest possible automation postage rates.
              </p>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-primary-dark">List Cleansing & NCOA</h4>
                    <p className="text-sm text-primary-dark/70">
                      We process lists against the National Change of Address database (NCOA) to prevent delivery failures.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-primary-dark">Mailing Permit & Sorting</h4>
                    <p className="text-sm text-primary-dark/70">
                      Utilize our permit or inject your custom permit indicators to enjoy bulk commercial rate discounts.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-primary-dark">EDDM Setup (Every Door Direct Mail)</h4>
                    <p className="text-sm text-primary-dark/70">
                      Target local zip code maps route-by-route. The USPS delivers a mail piece to every address on the chosen path.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Why Choose FBS Prints */}
        <section className="container py-10 sm:py-14 md:py-20">
          <div
            className="relative overflow-hidden rounded-[28px] bg-primary-dark px-6 py-12 text-white shadow-xl sm:px-10 sm:py-16 lg:px-16"
            data-aos="fade-up"
          >
            <Image
              src="/images/services/direct-mail/full-service-direct-mail.webp"
              alt="Direct mail being delivered to customer mailboxes"
              fill
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover object-center"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-linear-to-r from-primary-dark/55 via-primary-dark/20 to-transparent"
            />
            <div
              aria-hidden="true"
              className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-primary-light/20 blur-2xl"
            />

            <div className="relative z-10 grid max-w-5xl items-center gap-8 rounded-3xl border border-white/15 bg-primary-dark/85 p-6 shadow-2xl backdrop-blur-sm sm:p-8 lg:grid-cols-[auto_1fr] lg:gap-10">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/25 ring-1 ring-white/20 sm:h-20 sm:w-20">
                <ShieldCheck className="h-8 w-8 sm:h-10 sm:w-10" aria-hidden="true" />
              </div>

              <div>
                <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.2em] text-primary sm:text-sm">
                  Print-to-Delivery Support
                </span>
                <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl">
                  Why Choose <span className="text-primary">FBS Prints</span>
                </h2>
                <p className="mt-5 max-w-5xl text-base leading-relaxed text-white/80 sm:text-lg">
                  FBS Prints handles the key stages of direct mailing in one
                  place, from preparing printed materials and addressing mail
                  pieces to organizing mailing lists and postage requirements.
                  Our team works with businesses to coordinate each campaign
                  according to its audience, materials, and mailing
                  requirements, helping simplify the process from print to
                  delivery.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Industries we serve */}
        <section className="bg-linear-to-br from-primary-light via-white to-primary-light py-10 sm:py-16 md:py-24">
          <div className="container">
            <div className="mx-auto mb-10 sm:mb-16 max-w-3xl text-center" data-aos="fade-up">
              <span className="mb-2 block text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">
                Target Industries
              </span>
              <h2 className="text-2xl font-bold sm:text-3xl md:text-5xl text-primary-dark">
                Who Benefits From Direct Mail?
              </h2>
              <p className="mt-3 text-sm sm:text-base text-primary-dark/70">
                Across dozens of business sectors, print marketing represents a primary acquisition channel with excellent ROI.
              </p>
            </div>

            <div className="grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Retail & E-commerce",
                  desc: "Announce seasonal sales, distribute catalogs, and send catalog vouchers to win back inactive web shoppers.",
                },
                {
                  title: "Non-profit Organizations",
                  desc: "Conduct annual fundraisers and donation campaigns using reply cards and return envelopes to raise money.",
                },
                {
                  title: "Real Estate Agencies",
                  desc: "Promote new listings, local houses sold, open house events, and establish regional expertise in key neighborhoods.",
                },
                {
                  title: "Healthcare Providers",
                  desc: "Dentists, family clinics, and local hospitals use direct mail for scheduling appointment reminders and health tips.",
                },
                {
                  title: "Home Service Companies",
                  desc: "HVAC repairs, cleaning companies, roofers, and landscapers drop EDDM flyers in local target neighborhoods.",
                },
                {
                  title: "Local Shops & Restaurants",
                  desc: "Bring people in with grand opening notifications, food menu brochures, and neighborhood dining coupon codes.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="rounded-3xl border border-white/60 bg-white/70 p-6 backdrop-blur-sm shadow-sm hover:shadow-md hover:bg-white transition duration-300"
                  data-aos="fade-up"
                  data-aos-delay={i * 100}
                >
                  <h3 className="text-base sm:text-lg font-bold text-primary-dark flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary shrink-0" />
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-primary-dark/70">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 7: Interactive Cost Estimator & Contact */}
        <section id="estimator" className="container py-10 sm:py-14 md:py-20">
          <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Left Column: Information Card */}
            <div data-aos="fade-right" className="space-y-5 sm:space-y-6">
              <span className="inline-flex rounded-full bg-primary-light px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                Campaign Calculator
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-primary">
                Direct Mail Budget Estimator
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-primary-dark/75">
                Select your mailing format, list logistics, and quantity targets to get an instant
                project projection. We help you fine-tune these dimensions to match your postage discount goals.
              </p>

              <div className="rounded-2xl border border-primary-light bg-primary-light/40/50 p-5 sm:p-6 space-y-4">
                <div className="flex gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-primary-dark/80">
                    <strong>Lowest Postage Rates:</strong> We execute full postal presorts, automation grouping, and tray packaging.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Truck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-primary-dark/80">
                    <strong>Full Mail Drop:</strong> Ship direct to regional hubs or drop off at local post offices to match target drop dates.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-primary-dark/80">
                    <strong>Fast Processing:</strong> Typically printed, sorted, and delivered to post office hubs in 3-5 business days.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Calculator Widget */}
            <div data-aos="fade-left">
              <div className="rounded-[20px] sm:rounded-[28px] border border-primary-light bg-white p-5 shadow-xl shadow-primary-light sm:p-8">
                <div className="mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-primary-dark">
                    Build Your Campaign Specs
                  </h3>
                  <p className="mt-2 text-sm text-primary-dark/70">
                    Adjust fields below to update direct mail pricing estimation.
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Mailer Selector */}
                  <div className="rounded-2xl border border-primary-light bg-primary-light/40/80 p-4">
                    <label className="mb-3 block text-sm font-semibold text-primary-dark">
                      Mailer Format
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      {[
                        { val: "postcard", label: "Postcards" },
                        { val: "letter", label: "Letters" },
                        { val: "catalog", label: "Catalogs" },
                        { val: "self-mailer", label: "Self-Mailers" },
                      ].map((m) => (
                        <button
                          key={m.val}
                          type="button"
                          onClick={() => setSelectedMailer(m.val)}
                          className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${selectedMailer === m.val
                            ? "border-primary bg-primary-light text-primary"
                            : "border-primary-light bg-white text-primary-dark/80 hover:border-primary"
                            }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Service Level */}
                  <div className="rounded-2xl border border-primary-light bg-primary-light/40/80 p-4">
                    <label className="mb-3 block text-sm font-semibold text-primary-dark">
                      Mailing List Service Type
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { val: "eddm", label: "EDDM (Target Entire Postal Routes)" },
                        { val: "targeted", label: "Targeted Demographics List" },
                        { val: "full-service", label: "Premium Cleansed List Drop" },
                      ].map((s) => (
                        <button
                          key={s.val}
                          type="button"
                          onClick={() => setSelectedService(s.val)}
                          className={`rounded-xl border px-4 py-2.5 text-xs font-semibold text-left transition ${selectedService === s.val
                            ? "border-primary bg-primary-light text-primary"
                            : "border-primary-light bg-white text-primary-dark/80 hover:border-primary"
                            }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="rounded-2xl border border-primary-light bg-primary-light/40/80 p-4">
                    <label className="mb-3 block text-sm font-semibold text-primary-dark">
                      Mailing Volume
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {["1000", "2500", "5000", "10000"].map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setSelectedQuantity(q)}
                          className={`rounded-xl border py-2 text-xs font-semibold transition ${selectedQuantity === q
                            ? "border-primary bg-primary-light text-primary"
                            : "border-primary-light bg-white text-primary-dark/80 hover:border-primary"
                            }`}
                        >
                          {parseInt(q).toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Projection Output */}
                  <div className="rounded-2xl border border-primary-light bg-linear-to-br from-white to-primary-light/40 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-medium text-primary-dark/70">
                        Est. Unit Cost (Print + Mail)
                      </span>
                      <span className="text-base font-bold text-primary-dark">
                        ${unitCost.toFixed(2)} / ea
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-4 border-t border-primary-light pt-3">
                      <span className="text-sm font-medium text-primary-dark/70">
                        Estimated Total Budget
                      </span>
                      <span className="text-lg sm:text-xl font-bold text-primary">
                        ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Direct Contact Actions (No submission form) */}
                  <div className="pt-2 grid gap-3 sm:grid-cols-2">
                    <a
                      href="tel:+18552221133"
                      className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-primary px-4 sm:px-6 text-center text-xs sm:text-sm font-bold text-white shadow-lg transition duration-300 hover:scale-[1.01] hover:bg-primary-dark"
                    >
                      <Phone className="h-4 w-4 shrink-0" />
                      Call to Order: +1-855-222-1133
                    </a>

                    <a
                      href={`mailto:info@fbsprints.com?subject=${encodeURIComponent(
                        `Direct Mail Campaign Request`
                      )}&body=${encodeURIComponent(
                        `I would like to inquire about a direct mail campaign with the following configurations:\n\n` +
                        `- Mailer Format: ${selectedMailer}\n` +
                        `- Mailing Service: ${selectedService}\n` +
                        `- Target Quantity: ${qty}\n` +
                        `- Estimated Pricing: $${totalCost.toFixed(2)}\n\n` +
                        `Please contact me to discuss finalizing the list processing and file requirements.`
                      )}`}
                      className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl border border-primary-light bg-primary-light/40 px-4 sm:px-6 text-center text-xs sm:text-sm font-bold text-primary transition duration-300 hover:scale-[1.01] hover:bg-primary-light"
                    >
                      <Mail className="h-4 w-4 shrink-0" />
                      Email Specifications Directly
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 8: FAQs (Accordion Style) */}
        <section className="container py-14 md:py-20 border-t border-primary-light">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <span className="mb-2 block text-sm font-semibold uppercase tracking-widest text-primary">
              FAQ Support
            </span>
            <h2 className="text-3xl font-extrabold leading-tight text-primary-dark sm:text-4xl md:text-5xl">
              Direct Mail FAQ
            </h2>
            <p className="mt-4 text-base font-medium text-primary-dark/70 sm:text-lg">
              Answers to common questions about direct mail printing, postage rates, and delivery logistics.
            </p>
          </div>

          <FaqAccordion
            items={faqs.map((faq) => ({
              question: faq.q,
              answer: faq.a,
            }))}
            name="direct-mailing-faq"
          />
        </section>
      </main>
    </>
  );
}
