import Image from "next/image";
import Link from "next/link";
import React from "react";
import {
  Play,
  Printer,
  PenLine,
  Clock,
  Headphones,
  Smile,
  Copy,
  Award,
} from "lucide-react";

/**
 * FBS Signs - Home Hero Section
 * Brand colors pulled from the logo:
 *   cyan/blue  #16A8E2
 *   magenta    #E91580
 *   yellow     #F6C915
 *   navy text  #14142B
 *   bg blush   #FDEFF3
 *
 * Required image assets (place in /public/images/home/):
 *   Home-1-v2.png -> notebook + business cards + brochure cutout
 *   Home-port.png -> succulent planter cutout
 *
 * Fully responsive: stacks to a single column on mobile/tablet, scales
 * type and imagery down through the breakpoints, and keeps the carousel
 * controls + feature strip usable on small screens.
 */

const stats = [
  { icon: Smile, value: "500+", label: "Happy Clients", color: "#E91580" },
  { icon: Copy, value: "10K+", label: "Projects Done", color: "#16A8E2" },
  { icon: Award, value: "5+", label: "Years Experience", color: "#F6A315" },
];

const features = [
  {
    icon: Printer,
    color: "#E91580",
    title: "High Quality Printing",
    desc: "We use the latest technology to deliver top-notch prints.",
  },
  {
    icon: PenLine,
    color: "#16A8E2",
    title: "Creative Design",
    desc: "Eye-catching designs that communicate your brand.",
  },
  {
    icon: Clock,
    color: "#F6A315",
    title: "On-Time Delivery",
    desc: "We value your time and ensure fast delivery.",
  },
  {
    icon: Headphones,
    color: "#22A85B",
    title: "Dedicated Support",
    desc: "Our team is always here to help you.",
  },
];

export default function NewHeroSection() {
  return (
    <section className="w-full bg-white mt-16 md:mt-20">
      {/* ---------------- Hero ---------------- */}
      <div
        className="relative pt-12 lg:min-h-[690px] lg:pt-3 xl:min-h-[705px]"
        style={{ backgroundColor: "#FDEEF4" }}
      >
        {/* Background decors, clipped so they never bleed above this section */}
        <div className="pointer-events-none absolute inset-0 ">
          <Image
            src="/images/home/Pink_hero_bg.png"
            alt="Abstract pink background pattern framing the FBS Signs hero section"
            width={1448}
            height={1086}
            className="absolute right-0 top-0 hidden h-full w-[56%] 
            object-cover object-left md:block xl:w-[54%]"
          />

          {/* Dot pattern, upper-left */}
          <div
            className="absolute left-[39%] top-6 hidden h-56 w-72 opacity-45 lg:block"
            style={{
              backgroundImage:
                "radial-gradient(#EE9BC0 1.6px, transparent 1.6px)",
              backgroundSize: "16px 16px",
            }}
          />
        </div>

        <div className="relative grid w-full grid-cols-1 gap-8 px-4 pb-8 sm:px-10 md:px-14 lg:grid-cols-[40%_60%] lg:gap-0 lg:px-[7.15vw] lg:pb-[72px] lg:pt-[62px] xl:pt-[72px]">
          {/* ---- Left: copy ---- */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center lg:min-h-[492px] lg:items-start lg:text-left xl:min-h-[508px]">
            <span
              className="mb-4 text-xs font-bold tracking-normal sm:text-sm lg:text-[18px]"
              style={{ color: "#E91580" }}
            >
              PRINT. PROMOTE. GROW.
            </span>

            <p
              className="text-[42px] font-bold leading-[1.1] sm:text-5xl md:text-6xl lg:text-[58px] xl:text-[64px]"
              style={{ color: "#161629" }}
            >
              Powerful Prints.
              <br />
              Smart Marketing.
              <br />
              <span style={{ color: "#E91580" }}>Real Results.</span>
            </p>

            <p className="mt-5 max-w-[520px] pb-7 text-base leading-[1.75] text-slate-700 sm:text-lg lg:text-[20px]">
              High-quality printing solutions and creative marketing that help
              your business stand out and grow.
            </p>

            <div className="flex w-full flex-wrap items-center justify-center gap-4 sm:w-auto lg:justify-start">
              <Link
                href="/services"
                className="flex h-[58px] items-center gap-3 rounded-md px-6 text-sm font-semibold text-white shadow-md transition hover:brightness-110 sm:px-7 sm:text-base"
                style={{ backgroundColor: "#E91580" }}
              >
                <Printer size={18} />
                Explore Services
              </Link>
              <Link
                href="/our-work"
                className="flex h-[58px] items-center gap-3 rounded-md border border-slate-500/70 bg-white/70 px-6 text-sm font-semibold text-slate-800 transition hover:bg-white sm:px-7 sm:text-base"
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ backgroundColor: "#161629" }}
                >
                  <Play size={11} fill="white" color="white" />
                </span>
                View Our Work
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-2 sm:gap-6 xl:gap-8 overflow-visible">
              {stats.map(({ icon: Icon, value, label, color }, idx) => (
                <React.Fragment key={label}>
                  <div className="flex md:flex-row flex-col items-center gap-3">
                    <Icon
                      className="items-center"
                      size={34}
                      strokeWidth={1.5}
                      style={{ color }}
                    />
                    <div className=" leading-tight">
                      <p
                        className="text-base font-extrabold sm:text-xl"
                        style={{ color: "#161629" }}
                      >
                        {value}
                      </p>
                      <p className="text-xs text-slate-500 items-center">
                        {label}
                      </p>
                    </div>
                  </div>
                  {idx !== stats.length - 1 && (
                    <div className=" h-10 w-[1px] bg-slate-300" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* ---- Right: Hero Images ---- */}
          <div className="relative z-10 flex w-full items-center justify-center lg:justify-start">
            <div className="hidden md:block relative h-[330px] w-full max-w-[420px] sm:h-[430px] sm:max-w-[540px] md:h-[520px] md:max-w-[660px] lg:h-[565px] lg:max-w-[800px] xl:h-[590px] xl:max-w-[860px]">
              {/* Main mockup - notebook, business cards, brochure (kept in front) */}
              <Image
                src="/images/home/Home-1-v2.png"
                alt="FBS Signs branded notebook, business cards, and brochure mockup"
                width={1024}
                height={1024}
                priority
                className="hidden md:block absolute left-1/2 top-[54%] z-20 h-[120%] w-[120%] max-w-none 
                -translate-x-1/2 xl:-translate-x-1/3 -translate-y-1/2 object-contain drop-shadow-2xl sm:h-[122%] 
                sm:w-[122%] lg:left-[47%] lg:top-[33%] xl:top-[53%] lg:h-[100%] lg:w-[100%] xl:h-[116%] xl:w-[116%]"
              />

              {/* Plant - small accent tucked behind the mockup, upper-right */}
              <Image
                src="/images/home/Home-port.png"
                alt="Decorative plant beside FBS Signs branded print materials"
                width={1024}
                height={1024}
                className="hidden md:block absolute right-[-4%] top-[22%] z-10 h-[62%] w-[48%] 
                object-contain drop-shadow-xl sm:top-[21%] md:h-[64%] md:right-[-18%] md:top-[3%]
                lg:right-[-10%] lg:top-[13%] lg:h-[68%] lg:w-[46%] xl:right-[-35%] xl:top-[-20%] blur-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- Feature strip (floating card) ---------------- */}
      <div className="relative z-40 w-full px-6 pb-12 pt-8 sm:px-10 md:px-14 lg:-mt-12 lg:px-[5vw] lg:pb-14 lg:pt-0">
        <div className="grid grid-cols-1 gap-8 rounded-2xl bg-white px-6 py-8 shadow-[0_18px_45px_rgb(15,23,42,0.08)] sm:grid-cols-2 sm:gap-x-6 sm:gap-y-8 lg:flex lg:flex-row lg:gap-0 lg:px-9 lg:py-7 xl:px-10">
          {features.map(({ icon: Icon, color, title, desc }, index) => (
            <React.Fragment key={title}>
              <div className="flex w-full items-center gap-5 lg:w-auto lg:flex-1 lg:justify-center xl:gap-6">
                <span
                  className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-full border-[1.5px] sm:h-[64px] sm:w-[64px]"
                  style={{ borderColor: color, color }}
                >
                  <Icon size={27} strokeWidth={2} />
                </span>
                <div className="flex max-w-[225px] flex-col justify-center">
                  <h3
                    className="text-[15px] font-bold tracking-tight sm:text-[18px]"
                    style={{ color: "#14142B" }}
                  >
                    {title}
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-600 sm:text-[15px]">
                    {desc}
                  </p>
                </div>
              </div>
              {index !== features.length - 1 && (
                <div className="hidden h-12 w-[1px] flex-none bg-slate-200 lg:block lg:mx-4 xl:mx-8" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
