"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import "aos/dist/aos.css";
import Link from "next/link";

export default function Page() {
  const [loaderDone, setLoaderDone] = useState(false);

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

  const steps = [
    {
      id: 1,
      text: "Advertising Flags",
      image: "/icons/advertising-flags.png",
      slug: "advertising-flags",
    },
    {
      id: 2,
      text: "Banner Stands",
      image: "/icons/banner-stands.png",
      slug: "banner-stands",
    },
    {
      id: 3,
      text: "Banner",
      image: "/icons/banner.png",
      slug: "banner",
    },
    {
      id: 4,
      text: "Custom Neon LED",
      image: "/icons/custom-neon-led.png",
      slug: "custom-neon-led",
    },
    {
      id: 5,
      text: "Custom Event Tents",
      image: "/icons/custom-event-tents.png",
      slug: "custom-event-tents",
    },
    {
      id: 6,
      text: "Canopy/Awning",
      image: "/icons/canopy-awning.png",
      slug: "canopy-awning",
    },
    {
      id: 7,
      text: "LED Light Box",
      image: "/icons/led-light-box.png",
      slug: "led-light-box",
    },
    {
      id: 8,
      text: "LED Message Board",
      image: "/icons/led-message-board.png",
      slug: "led-message-board",
    },
    {
      id: 9,
      text: "LED Channel Letters",
      image: "/icons/led-channel-letters.png",
      slug: "led-channel-letters",
    },
    {
      id: 10,
      text: "Monument Signs",
      image: "/icons/monument-signs.png",
      slug: "monument-signs",
    },
    {
      id: 11,
      text: "Pylon Signs",
      image: "/icons/pylon-signs.png",
      slug: "pylon-signs",
    },
    {
      id: 12,
      text: "Signicade A Frame",
      image: "/icons/signicade-a-frame.png",
      slug: "signicade-a-frame",
    },
    {
      id: 13,
      text: "Trade Show Products",
      image: "/icons/trade-show-products.png",
      slug: "trade-show-products",
    },
    {
      id: 14,
      text: "Vehicle Graphics",
      image: "/icons/vehicle-graphics.png",
      slug: "vehicle-graphics",
    },
    {
      id: 15,
      text: "Vehicle Wraps",
      image: "/icons/vehicle-wraps.png",
      slug: "vehicle-wraps",
    },
    {
      id: 16,
      text: "Window Lettering",
      image: "/icons/window-lettering.png",
      slug: "window-lettering",
    },
    {
      id: 17,
      text: "Yard Signs",
      image: "/icons/yard-signs.png",
      slug: "yard-signs",
    },
  ];

  const services = [
    {
      title: "Awning & Canopy",
      img: "/images/services/signage/awning-canopy-signage.webp",
    },
    {
      title: "Car Wrap",
      img: "/images/services/signage/car-wrap-signage.webp",
    },
    {
      title: "Exterior Monuments",
      img: "/images/services/signage/exterior-monument-signage.webp",
    },
    {
      title: "Wall Sign",
      img: "/images/services/signage/wall-signage-example.webp",
    },
    {
      title: "Street Sign",
      img: "/images/services/signage/street-signage-example.webp",
    },
    {
      title: "Window Graphics",
      img: "/images/services/signage/window-graphics-example.webp",
    },
  ];

  return (
    <>
      <main>
        {/* Section - 1 */}
        <section className="bg-linear-to-br xl:mt-20 mt-20 from-white to-primary-light">
          <div className="container">
            <div className="mx-auto">
              <p className="text-primary-dark/70 text-lg">
                <Link href="/" className="text-primary">
                  Home
                </Link>
                <span className="mx-2">&gt;</span>
                <span className="text-primary-dark font-semibold">Signage</span>
              </p>
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 mt-10 lg:mt-0 items-center">
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
                    Sign
                    <span className="text-primary">age</span>
                  </h1>

                  {/* Description */}
                  <p className="text-primary-dark/70 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0">
                    Any business needs signage services since they are so
                    significant for bringing in consumers, enhancing brand
                    recognition, and conveying important messages.
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
                          src="/images/services/signage/yard-sign-marketing.webp"
                          alt="Yard sign marketing"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>

                    {/* Column 2 (Center) */}
                    <div className="col-span-1 space-y-4 sm:space-y-6 sm:mt-40">
                      <div className="rounded-2xl aspect-square overflow-hidden relative float-2">
                        <Image
                          src="/images/services/signage/custom-neon-signage.webp"
                          alt="Custom neon signage"
                          fill
                          className="object-fix"
                        />
                      </div>
                    </div>

                    {/* Column 3 - hidden on mobile */}
                    <div className="col-span-1 space-y-6 sm:mt-16 ">
                      <div className="rounded-2xl aspect-square overflow-hidden relative float-1">
                        <Image
                          src="/images/services/signage/led-signage.webp"
                          alt="LED signage example"
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
                  Get your
                  <br />
                  <span className="text-black hover:text-primary-light">
                    Business Signage
                  </span>
                  <br />
                  in Best Price.
                </h2>
              </div>

              {/* Right Content */}
              <div data-aos="fade-left">
                <p className="text-base md:text-lg text-primary-light leading-relaxed text-center lg:text-start">
                  Businesses may stand out from the competition and leave a
                  positive impression on potential clients by using effective
                  signage. Our signage services are intended to assist
                  businesses in producing eye-catching, effective signage that
                  draws customers and raises brand awareness. A variety of sign
                  products, such as banners, decals, car wraps, and more, are
                  available from us. We will collaborate with you to design
                  signage that satisfies your unique requirements and advances
                  your commercial objectives.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section - 3 */}
        <section data-aos="zoom-in" className="container section-padding">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {steps.map((item) => {
              return (
                <Link
                  key={item.id}
                  href={`/services/signage/${item.slug}`}
                  className=" group flex h-[220px] bg-primary-light rounded-2xl items-center justify-center overflow-hidden cursor-pointer border-4 border-transparent hover:border-primary transition-all duration-300"
                >
                  <div className="flex flex-col items-center justify-center gap-4">
                    {/* PNG IMAGE ICON */}
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.text}
                        width={80}
                        height={60}
                        className=" transition-transform duration-300
              group-hover:-rotate-12"
                      />
                    )}

                    <h3 className="text-xl text-black font-semibold text-center">
                      {item.text}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Section - 4 */}
        <section data-aos="fade-up" className="container section-padding">
          <div className="max-w-6xl mx-auto">
            {/* Heading */}
            <div className="text-center mb-10">
              <h2 className="text-5xl font-bold text-primary">
                What{" "}
                <span className="bg-linear-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                  {" "}
                  We
                </span>{" "}
                Print
              </h2>
              <p className="text-primary-dark/60 mt-3 text-xl">
                Every project is different, and we at our organization work
                closely with our clients to make sure we match their particular
                demands and specifications. Graphic design, big format printing,
                car wraps, and other services are among the many printing and
                signage solutions we provide. We have the knowledge and
                experience to complete any task, whether it’s a straightforward
                banner or a complicated advertising campaign.
              </p>
            </div>

            {/* Services */}
            <div className="grid md:grid-cols-2 gap-x-14 gap-y-6">
              {steps.map((item, i) => (
                <Link
                  key={i}
                  href={`/services/signage/${item.slug}`}
                  className="flex items-center gap-4 border-b pb-4 group hover:translate-x-2 transition-all duration-300"
                >
                  <div className="w-11 h-11 rounded-full bg-primary-light text-primary flex items-center justify-center">
                    <Image
                      src={item.image}
                      alt={item.text}
                      width={20}
                      height={20}
                      className="object-contain"
                    />{" "}
                  </div>

                  <h4 className="text-lg font-semibold text-primary-dark group-hover:text-primary">
                    {item.text}
                  </h4>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="container section-padding">
          <div data-aos="fade-up" className="pt-5">
            <p className="text-center text-xl font-semibold">
              Allow Us to make your imagination com true! FBS SIGNS is a
              well-respected sign fabricator nationwide. We know how to take our
              clients’ input and make it come alive. Our illuminated signs are
              with the brightest leds and highest quality which will draw
              customers into your business. Most popular signage are channel
              letters, which are illuminated signs. They are beneficial for
              companies located in shopping centers because we can install
              low-wattage LED lights. We can design your channel letters based
              on your design ideas and landlord specifications, and municipal
              regulations. Most importantly, we understand the importance of
              professionalism and hard work. You can trust us to get the job
              done front start to finish.
            </p>
          </div>

          <div className="pt-15">
            <div className="px-4">
              <div
                data-aos="fade-up"
                data-aos-duration="1500"
                data-aos-delay="100"
                className="max-w-7xl mx-auto grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
              >
                {services.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-4 text-center shadow-lg hover:-translate-y-2 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="relative w-full h-[250px] rounded-xl overflow-hidden">
                      <Image
                        src={item.img}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <h3 className="mt-4 text-lg font-semibold text-primary-dark/80">
                      {item.title}
                    </h3>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
