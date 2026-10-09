"use client";

import Image from "next/image";
import { useEffect } from "react";
import "aos/dist/aos.css";
import Link from "next/link";
import {
  Search,
  Target,
  LineChart,
  ShieldCheck,
} from "lucide-react";

import seoServices from "../../data/seo-services.json";
import FaqAccordion from "@/app/Components/FaqAccordion";

const seoProcess = [
  {
    step: "Audit",
    description:
      "We start with a full technical and on-page audit to see exactly where your site stands today and what's holding your rankings back.",
  },
  {
    step: "Keyword Research",
    description:
      "We identify the real, high-intent search terms your customers are typing into Google, so effort goes toward searches that actually convert.",
  },
  {
    step: "On-Page & Technical Fixes",
    description:
      "Titles, meta descriptions, site speed, and structure are cleaned up to build a solid ranking foundation before anything else scales.",
  },
  {
    step: "Content & Authority Building",
    description:
      "Ongoing content, citations, and backlinks are built to strengthen your site's relevance and trust in Google's eyes.",
  },
  {
    step: "Track & Report",
    description:
      "You get clear monthly reports on rankings, traffic, and what's working, so progress is always visible, never just promised.",
  },
];

const seoBenefits = [
  {
    icon: Search,
    title: "Found by the right people",
    description:
      "Show up exactly when nearby customers are searching for what you offer, not just casually browsing.",
  },
  {
    icon: Target,
    title: "High-intent traffic",
    description:
      "We target keywords people use when they're ready to buy or book, not just generic terms with no commercial value.",
  },
  {
    icon: LineChart,
    title: "Compounding results",
    description:
      "Unlike paid ads, SEO keeps bringing in traffic long after the work is done, building value month over month.",
  },
  {
    icon: ShieldCheck,
    title: "Long-term credibility",
    description:
      "A well-optimized site builds trust signals with both Google and real visitors, strengthening your brand over time.",
  },
];

const seoStats = [
  { value: "90%", label: "of online journeys start with a search engine" },
  { value: "3-4", label: "months to first noticeable ranking movement" },
  { value: "12+", label: "months of compounding organic growth on average" },
  { value: "100%", label: "transparent monthly reporting, no black box" },
];

const seoFaqs = [
  {
    q: "How long does SEO take to show results?",
    a: "Most businesses start seeing noticeable movement in rankings within 3-4 months, with stronger, more stable results building over 6-12 months. SEO is a compounding investment rather than an instant switch.",
  },
  {
    q: "Do you guarantee a #1 ranking on Google?",
    a: "No one can honestly guarantee a specific ranking spot, since Google's algorithm changes constantly and factors in hundreds of signals. What we do guarantee is a clear, measurable process and honest monthly reporting so you always know exactly what's being done and why.",
  },
  {
    q: "Is local SEO different from regular SEO?",
    a: 'Yes. Local SEO focuses on things like your Google Business Profile, local citations, and location-based keywords so you show up in the map pack and "near me" searches, while broader SEO targets a wider, non-location-specific audience.',
  },
  {
    q: "Do I need a brand-new website for SEO to work?",
    a: "Not necessarily. Most existing sites can be optimized as-is. A slow, outdated, or poorly structured site may need some technical fixes first, but a full rebuild is rarely required just to start seeing SEO gains.",
  },
  {
    q: "What's actually included in the monthly report?",
    a: "You'll see keyword ranking movement, organic traffic trends, and a plain-language summary of the work completed that month, so progress is always visible and tied back to real numbers, not vague promises.",
  },
  {
    q: "Will SEO still work if my competitors are already doing it?",
    a: "Yes. SEO isn't winner-take-all. We focus on the specific keywords, content gaps, and technical issues your competitors are missing, so there's almost always room to win rankings even in a crowded market.",
  },
];

export default function Page() {
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
    <>
      <main>
        {/* Section - 1 */}
        <section className="bg-linear-to-br mt-24 xl:mt-20 from-white to-primary-light">
          <div className="container">
            <div className="mx-auto">
              <p className="text-primary-dark/70 text-lg">
                <Link href="/" className="text-primary">
                  Home
                </Link>
                <span className="mx-2">&gt;</span>
                <span className="text-primary-dark font-semibold">SEO</span>
              </p>
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mt-10 lg:mt-0">
                {/* LEFT CONTENT - FIXED */}
                <div
                  data-aos="fade-right"
                  className="flex flex-col justify-center text-center lg:text-left space-y-5"
                >
                  <h1
                    className="font-semibold text-primary-dark leading-tight tracking-tight
    text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
                  >
                    SEO
                  </h1>

                  <p className="text-primary-dark/70 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0">
                    At FBS, we are not just another SEO agency, we are your
                    dedicated partner in achieving online success.
                  </p>
                </div>

                {/* Right Content - Image Grid */}
                <div className="relative">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-light rounded-full hidden md:block opacity-50 blur-2xl"></div>
                  <div className="absolute bottom-20 -left-10 w-60 h-60 bg-primary-light rounded-full hidden md:block opacity-50 blur-3xl"></div>
                  <div className="absolute top-32 right-10 w-32 h-32 bg-primary-light rounded-full opacity-50 hidden md:block blur-2xl"></div>

                  <div className="relative grid grid-cols-3 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="col-span-1 space-y-4 sm:space-y-6 sm:mt-16">
                      <div className="rounded-2xl aspect-square overflow-hidden relative float-1">
                        <Image
                          src="/images/SEO/seo-3.jpg"
                          alt="Local marketing campaign planning materials"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>

                    <div className="col-span-1 space-y-4 sm:space-y-6 sm:mt-40">
                      <div className="rounded-2xl aspect-square overflow-hidden relative float-2">
                        <Image
                          src="/images/SEO/seo-2.jpg"
                          alt="Digital marketing and SEO support materials"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>

                    <div className="col-span-1 space-y-6 sm:mt-16 ">
                      <div className="rounded-2xl aspect-square overflow-hidden relative float-1">
                        <Image
                          src="/images/SEO/seo-1.jpg"
                          alt="Branded print assets supporting local campaigns"
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

        {/* Section - 2 */}
        <section className="container section-padding">
          <div className="bg-primary rounded-2xl px-6 py-12 text-white">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-7xl mx-auto">
              <div data-aos="fade-right">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-center lg:text-start">
                  Your Partner in
                  <br />
                  <span className="text-black hover:text-primary-light">SEO</span>
                  <br />
                  Excellence
                </h2>
              </div>

              <div data-aos="fade-left">
                <p className="text-base md:text-lg text-primary-light leading-relaxed text-center lg:text-start">
                  Having a beautiful website isn't enough if no one can find it.
                  That's where our Search Engine Optimization (SEO) services
                  come in. At FBS Prints, we help your business climb the search
                  rankings, attract the right audience, and turn clicks into
                  customers. Whether you're a small local business or a growing
                  brand, our SEO strategies are tailored to put you ahead of the
                  competition.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section - 3 */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary-dark leading-tight">
              Our <span className="text-primary">SEO Services</span>
            </h2>

            <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-primary-dark/70 font-medium">
              Don't be afraid to give up the good to go for the great
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {seoServices.map((item) => (
              <Link
                key={item.slug}
                href={`/services/seo/${item.slug}`}
                className="group rounded-2xl p-6 bg-white hover:shadow-xl transition duration-300 flex flex-col h-full cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-5">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-linear-to-br from-primary to-primary flex items-center justify-center text-white shadow-md transition-transform duration-300 group-hover:scale-110">
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={32}
                      height={32}
                      className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                    />
                  </div>

                  <h3 className="text-xl sm:text-2xl font-semibold text-primary-dark group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                </div>

                <div className="w-10 h-[3px] bg-primary mb-4 transition-all duration-300 group-hover:w-16"></div>

                <p className="text-primary-dark/70 text-base sm:text-lg leading-relaxed mt-auto">
                  {item.shortDesc}
                </p>

                <span className="mt-4 text-sm font-semibold text-primary inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Learn more <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Section - 4 */}
        <section className="relative mx-auto">
          <div className="container section-padding mx-auto max-w-6xl relative">
            <div className="relative w-full h-[420px] md:h-[520px] rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/images/services/seo/seo2.jpg"
                alt="Search engine optimization strategy and reporting visual"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/60"></div>
              <div className="absolute inset-0 flex items-center justify-center px-6 md:px-12">
                <div className="max-w-4xl text-white">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4 leading-tight">
                    Why SEO Matters for Your Business
                  </h2>

                  <p className="text-base md:text-2xl leading-relaxed text-center text-white/100">
                    90% of online experiences start with a search engine. If
                    you&apos;re not on the first page of Google, you&apos;re
                    losing business. SEO builds trust, visibility, and long-term
                    growth.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section - 5  STATS BAND */}
        <section className="container section-padding">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto">
            {seoStats.map((stat, i) => (
              <div
                key={i}
                data-aos="fade-up"
                data-aos-delay={i * 100}
                className="text-center rounded-2xl border border-primary-light bg-primary-light/40 px-4 py-8"
              >
                <p className="text-3xl sm:text-4xl font-extrabold text-primary">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm sm:text-base text-primary-dark/70 leading-snug">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section - 6  OUR PROCESS */}
        <section className="container section-padding">
          <div className="text-center mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary-dark">
              Our <span className="text-primary">SEO Process</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-primary-dark/70">
              A clear, step-by-step path from first audit to lasting rankings.
            </p>
          </div>

          <div className="sm:container grid gap-6 sm:grid-cols-1 md:grid-cols-2 space-y-3 lg:grid-cols-5 mx-auto">
            {seoProcess.map((step, i) => (
              <div
                key={i}
                data-aos="fade-up"
                data-aos-delay={i * 100}
                className="relative flex flex-col rounded-2xl border border-primary-light bg-white pt-9 pb-6 px-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary-light"
              >
                <div className="absolute -top-5 left-5 flex w-10 h-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-md">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mb-2 text-sm sm:text-base font-bold text-primary-dark">
                  {step.step}
                </h3>
                <p className="text-sm leading-relaxed text-primary-dark/70">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section - 7  BENEFITS */}
        <section className="bg-primary-light/40 py-16 sm:py-20">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary-dark">
                Why Businesses Choose{" "}
                <span className="text-primary">Our SEO</span>
              </h2>
              <p className="mt-4 text-base sm:text-lg text-primary-dark/70">
                Real, lasting benefits, not just a ranking checklist.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
              {seoBenefits.map((benefit, i) => {
                const BenefitIcon = benefit.icon;
                return (
                  <div
                    key={i}
                    data-aos="fade-up"
                    data-aos-delay={i * 100}
                    className="rounded-2xl bg-white border border-primary-light p-6 shadow-sm transition hover:shadow-md hover:border-primary-light"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center mb-4">
                      <BenefitIcon
                        className="w-6 h-6 text-primary"
                        strokeWidth={2}
                      />
                    </div>
                    <h3 className="text-base font-bold text-primary-dark mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-primary-dark/70 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section - 8  FAQ */}
        <section className="container section-padding">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary-dark">
                Frequently Asked{" "}
                <span className="text-primary">Questions</span>
              </h2>
              <p className="mt-4 text-base sm:text-lg text-primary-dark/70">
                Answers to the questions we hear most about SEO.
              </p>
            </div>

            <FaqAccordion
              items={seoFaqs.map((faq) => ({
                question: faq.q,
                answer: faq.a,
              }))}
              name="seo-landing-faq"
            />
          </div>
        </section>

        {/* Section - 9 */}
        <section className="container section-padding">
          <div>
            <h2 className="text-center text-3xl sm:text-4xl md:text-5xl font-bold text-primary">
              Ready to grow? Start your SEO journey with FBS Signs today.
            </h2>
          </div>
          <div className="max-w-4xl mx-auto px-4">
            <p className="text-center text-base md:text-2xl font-medium text-primary-dark/80 leading-relaxed pt-8">
              Whether you are starting from scratch or looking to outrank
              established competitors,{" "}
              <span className="font-semibold text-primary-dark">FBS Signs</span>{" "}
              builds an SEO strategy around your business goals  not a generic
              template. Contact us for a free audit and let us show you exactly
              where you stand.
            </p>
            <div className="flex justify-center mt-8">
              <Link
                href="/contact"
                className="inline-block rounded-full bg-primary px-8 py-3 text-sm sm:text-base font-semibold text-white transition hover:bg-primary"
              >
                Get Your Free SEO Audit
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
