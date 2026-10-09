"use client";
import Image from "next/image";
import { useEffect } from "react";
import "aos/dist/aos.css";
import Link from "next/link";
import webDesignFaqs from "@/app/data/web-design-faq.json";
import FaqAccordion from "@/app/Components/FaqAccordion";

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

  const services = [
    {
      slug: "email-marketing",
      title: "Email Marketing",
      image: "/icons/email-marketing.png",
      description:
        "Email marketing is a digital marketing strategy that involves sending emails to a group of recipients with the goal of promoting services, building relationships with customers.",
    },
    {
      slug: "search-engine-optimization",
      title: "Search Engine Optimization",
      image: "/icons/search-engine-optimization.png",
      description:
        "Search Engine Optimization (SEO) is a digital marketing strategy and practice aimed at improving a website’s visibility in (SERPs) for specific keywords or phrases.",
    },
    {
      slug: "content-writing",
      title: "Content Writing",
      image: "/icons/content-writing.png",
      description:
        "Content writing is the practice of creating written material with the purpose of conveying information, engaging readers, and achieving specific communication goals.",
    },
    {
      slug: "digital-marketing-strategy",
      title: "Digital Marketing Strategy",
      image: "/icons/digital-marketing-strategy.png",
      description:
        "A digital marketing strategy is a comprehensive plan that outlines how a business will use digital channels and platforms to achieve its marketing and business objectives. It can help businesses reach their target effectively.",
    },
    {
      slug: "web-development",
      title: "Web Development",
      image: "/icons/web-development.png",
      description:
        "Web design and web development are two distinct but closely related disciplines that work together to create functional and visually appealing websites. Both works together to make final look.",
    },
    {
      slug: "social-media-management",
      title: "Social Media Management",
      image: "/icons/social-media-management.png",
      description:
        "Social media management refers to the process of creating, scheduling, analyzing, and engaging with content posted on social media platforms for businesses, organizations or individuals.",
    },
  ];

  const Digitalexp = [
    {
      slug: "portfolio-website",
      title: "Portfolio Website",
      img: "/images/services/web-design/portfolio-website-example.webp",
    },
    {
      slug: "ecommerce-website",
      title: "E-Commerce Website",
      img: "/images/services/web-design/ecommerce-website-example.webp",
    },
    {
      slug: "shopify-stores",
      title: "Shopify Stores",
      img: "/images/services/web-design/shopify-website-example.webp",
    },
  ];

  const clientsuccess = [
    {
      title: "FBS created and executed an effective Google advertising plan.",
      description:
        "I recently completely redesigned my website with FBS and was blown away by the results. The designers and programmers on their team were very capable, accommodating, and easy to deal with.",
      name: "John",
      role: "Business Owner",
    },
    {
      title: "Thanks to FBS we are right where we wanted to be.",
      description:
        "It was a true delight to work with FBS. Their staff produced exactly what we needed and was incredibly competent and communicative. Our hazy concepts were transformed into a stunning and useful website by them. Our website design has drawn numerous praises, and we are delighted with the outcome.",
      name: "Sarah",
      role: "Marketing Director",
    },
    {
      title:
        "We doubled our leads & sales within 6 months! We highly recommend them.",
      description:
        "Working with the FBS team has been an incredible investment of our time and money. We doubled our leads and sales within six months! We highly recommend them.",
      name: "Juan Nelson",
    },
  ];

  return (
    <>
      <main>
        {/* Section - 1 */}
        <section className="bg-linear-to-br mt-24 xl:mt-20 from-white to-primary-light">
          <div className="container">
            <div className="mx-auto">
              <p className="text-primary-dark/70 text-lg">
                <Link href="/" className="text-primary hover:underline">
                  Home
                </Link>
                {/* <span className="mx-2">&gt;</span> */}
                {/* <Link href="/services" className="text-primary">
                        Services
                      </Link> */}
                <span className="mx-2">&gt;</span>
                <span className="text-primary-dark font-semibold">
                  Web Designing
                </span>
              </p>
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mt-10 lg:mt-0">
                {/* LEFT CONTENT - FIXED */}
                <div
                  data-aos="fade-right"
                  className="flex flex-col justify-center text-center lg:text-left space-y-5"
                >
                  {/* Heading */}
                  <h1
                    className="font-semibold text-primary-dark leading-tight tracking-tight
    text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
                  >
                    Web
                    <span className="text-primary"> Designing</span>
                  </h1>
                  {/* Description */}
                  <p className="text-primary-dark/70 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0">
                    FBS Prints provides professional web design services focused
                    on creating responsive, user-friendly websites for
                    businesses. We combine modern design, clear navigation,
                    mobile responsiveness, and functionality to create websites
                    that represent your brand and provide a smooth experience
                    for visitors. Each website is designed around the
                    business&apos;s
                    goals, content, and user requirements.
                  </p>
                </div>

                {/* Right Content - Image Grid */}
                <div className="relative">
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
                          src="/images/services/web-design/business-growth-illustration.webp"
                          alt="Business growth illustration"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>

                    {/* Column 2 (Center) */}
                    <div className="col-span-1 space-y-4 sm:space-y-6 sm:mt-40">
                      <div className="rounded-2xl aspect-square overflow-hidden relative float-2">
                        <Image
                          src="/images/services/web-design/business-website-design.webp"
                          alt="Business website design"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>

                    {/* Column 3 - hidden on mobile */}
                    <div className="col-span-1 space-y-6 sm:mt-16 ">
                      <div className="rounded-2xl aspect-square overflow-hidden relative float-1">
                        <Image
                          src="/images/services/web-design/creative-web-design.webp"
                          alt="Creative web design showcase"
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
              {/* Left Content */}
              <div data-aos="fade-right">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-center lg:text-start">
                  Our Web Design
                  <br />
                  <span className="text-black hover:text-primary-light">
                    Is More Than Just An
                  </span>
                  <br />
                  Online Brochure
                </h2>
              </div>

              {/* Right Content */}
              <div data-aos="fade-left">
                <p className="text-base md:text-lg text-primary-light leading-relaxed text-center lg:text-start">
                  FBS Prints creates responsive, visually engaging websites
                  tailored to each business and its audience. From page
                  structure and navigation to visual design and user experience,
                  we focus on creating websites that are easy to use, consistent
                  with the brand, and designed to support business goals.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section - 3 */}
        <section className="container relative bg-white py-10 overflow-hidden">
          {/* Single deliberate accent glow instead of two competing blobs */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-light rounded-full blur-3xl opacity-30"></div>

          <div className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-20">
              <div
                data-aos="fade-right"
                className="relative flex justify-center"
              >
                {/* Floating card */}
                <div className="relative">
                  {/* shadow glow */}
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-3xl"></div>

                  <Image
                    src="/images/services/web-design/Web-1.jpg"
                    alt="Responsive web design and digital solutions showcase"
                    width={600}
                    height={600}
                    priority
                    className="relative rounded-3xl shadow-2xl border border-primary-light h-auto w-full max-w-full"
                  />

                  {/* Floating stats  real numbers instead of repeated labels */}
                  <div
                    data-aos="fade-up"
                    className="absolute -bottom-10 -left-6 bg-white rounded-2xl shadow-xl px-6 py-4"
                  >
                    <p className="text-2xl font-extrabold text-primary-dark leading-none">
                      40%
                    </p>
                    <p className="mt-1 text-xs font-medium text-primary-dark/60">
                      More Leads Generated
                    </p>
                  </div>

                  <div
                    data-aos="fade-down"
                    className="absolute -top-4 -right-6 bg-white rounded-2xl shadow-xl px-6 py-4"
                  >
                    <p className="text-2xl font-extrabold text-primary-dark leading-none">
                      2.4s
                    </p>
                    <p className="mt-1 text-xs font-medium text-primary-dark/60">
                      Average Load Time
                    </p>
                  </div>
                </div>
              </div>

              {/* right CONTENT */}
              <div
                data-aos="fade-left"
                className="space-y-8 text-center lg:text-left"
              >
                <h2 className="text-4xl lg:text-6xl font-extrabold leading-tight text-primary-dark">
                  We Help{" "}
                  <span className="bg-linear-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                    Businesses Build
                  </span>{" "}
                  Better Websites
                </h2>

                <p className="text-xl text-primary-dark/70 max-w-3xl mx-auto lg:mx-0">
                  We go beyond visual design to create websites with responsive
                  layouts, clear navigation, practical functionality, and a
                  consistent brand experience. FBS Prints works with businesses
                  to understand their content, audience, and requirements,
                  creating professional, user-friendly websites that support
                  their goals.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section - 4 */}
        <section className="container section-padding relative bg-white overflow-hidden">
          <div className=" mx-auto">
            {/* HEADING */}
            <div className="max-w-4xl mx-auto text-center mb-10">
              <h2 className="text-4xl md:text-5xl font-extrabold text-primary leading-tight">
                Unique{" "}
                <span className="bg-linear-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                  Bespoke Digital{" "}
                </span>
                Solutions
              </h2>

              <p className="mt-6 text-primary-dark/70 text-lg leading-relaxed">
                We craft responsive, SEO-optimized, and scalable digital
                experiences. Our services combine design, development, and
                marketing to build a strong online presence.
              </p>
            </div>

            {/* SERVICES GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((item) => (
                <Link
                  key={item.slug}
                  href={`/services/web-design/${item.slug}`}
                  className="group relative rounded-2xl bg-white border border-primary-light p-8
          shadow-sm hover:shadow-xl hover:shadow-primary-light hover:-translate-y-1
          transition-all duration-300"
                >
                  {/* TOP ACCENT */}
                  <span
                    className="absolute top-0 left-0 h-1 w-0 bg-linear-to-br from-primary to-primary
            group-hover:w-full transition-all duration-300 rounded-t-2xl"
                  />

                  {/* ICON */}
                  <div
                    className="mb-6 w-20 h-20 p-3 rounded-xl bg-white shadow-lg shadow-primary-light
            flex items-center justify-center"
                  >
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={50}
                      height={26}
                    />
                  </div>

                  {/* TITLE */}
                  <h3 className="text-xl font-semibold text-primary-dark mb-3">
                    {item.title}
                  </h3>

                  {/* DESCRIPTION */}
                  <p className="text-primary-dark/70 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Section - 5 */}
        <section
          data-aos="fade-up"
          className="container section-padding bg-white"
        >
          <div className="pt-5 space-y-6 mb-12 max-w-7xl mx-auto">
            <p className="text-center text-3xl lg:text-4xl xl:text-5xl font-bold mx-auto text-primary">
              &quot;Designing{" "}
              <span className="bg-linear-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                Digital Experiences That Captivate, Inspire, And Leave a Lasting
              </span>{" "}
              Impression.&quot;
            </p>
            <p className="text-xl text-center font-semibold">
              Our commitment is to deliver web design solutions that not only
              meet but exceed our clients expectations, helping them achieve
              their online goals and stand out in the digital landscape.
            </p>
          </div>

          <div className="pt-7">
            <div className="px-4">
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {Digitalexp.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/services/web-design/${item.slug}`}
                    className="block bg-white rounded-2xl p-4 text-center shadow-lg hover:-translate-y-2 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="relative w-full h-[250px] rounded-xl overflow-hidden">
                      <Image
                        src={item.img}
                        alt={item.title}
                        fill
                        className="object-cover h-full w-full"
                      />
                    </div>

                    <h3 className="mt-4 text-lg font-semibold text-primary-dark/80">
                      {item.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section - 6 */}
        <section className="container section-padding relative bg-white">
          <div className="mx-auto">
            {/* HEADING */}
            <div className="max-w-5xl mx-auto text-center mb-10">
              <h2 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight">
                Our Clients&apos;{" "}
                <span className="bg-linear-to-r from-primary to-primary-dark bg-clip-text text-transparent relative">
                  Success
                  <span className="absolute -bottom-2 left-0 w-full h-1 bg-primary-light rounded-full"></span>
                </span>{" "}
                Is Our Success
              </h2>

              <p className="mt-6 text-primary-dark/70 text-lg md:text-xl leading-relaxed">
                We build intuitive, high-performing digital experiences for
                businesses of all sizes. From strategy and design to development
                and optimization, everything we do is focused on real growth and
                measurable results.
              </p>
            </div>

            {/* TESTIMONIAL GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 pt-5">
              {clientsuccess.map((item, index) => (
                <div
                  key={index}
                  className="group relative bg-white rounded-3xl p-10
      border border-primary-light shadow-sm
      hover:-translate-y-2 hover:shadow-2xl
      transition-all duration-300"
                >
                  {/* SUCCESS ICON IMAGE (instead of quote) */}
                  <div
                    className="absolute -top-10 left-8 w-18 h-18 rounded-full
        bg-white shadow-lg flex items-center justify-center"
                  >
                    <Image
                      src="/icons/success.png"
                      alt="Client success"
                      width={35}
                      height={35}
                      className="h-15 w-15"
                    />
                  </div>

                  {/* TITLE */}
                  <p className="mt-6 text-lg font-semibold text-primary-dark mb-4 leading-snug">
                    {item.title}
                  </p>

                  {/* DESCRIPTION */}
                  <p className="text-primary-dark/70 leading-relaxed mb-8">
                    {item.description}
                  </p>

                  {/* AUTHOR */}
                  <div className="pt-6 border-t border-primary-light">
                    <p className="text-primary font-semibold text-xl">
                      {item.name}
                    </p>
                    <p className="text-lg text-primary-dark/60">{item.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section - 7: Frequently Asked Questions */}
        <section
          id="faqs"
          className="scroll-mt-24 bg-linear-to-b from-white to-primary-light/40"
        >
          <div className="container section-padding">
            <div className="mx-auto max-w-4xl">
              <div className="mb-10 text-center" data-aos="fade-up">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  Common Questions
                </p>
                <h2 className="text-4xl font-extrabold tracking-tight text-primary-dark md:text-5xl">
                  Web Design FAQs
                </h2>
                <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-primary-dark/70">
                  Answers to common questions about our website design process,
                  timelines, features, and ongoing support.
                </p>
              </div>

              <div data-aos="fade-up">
                <FaqAccordion items={webDesignFaqs} name="web-design-faq" />
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
