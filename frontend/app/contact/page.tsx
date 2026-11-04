"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import "aos/dist/aos.css";
import Slider from "../Components/Slider";
import Link from "next/link";
import ContactFormSubmit, {
  type SubmissionState,
} from "../Components/ContactFormSubmit";
import FloatingToast from "../Components/FloatingToast";

import {
  FaTwitter,
  FaLinkedin,
  FaInstagram,
  FaFacebookF,
  FaDribbble,
  FaBehance,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
} from "react-icons/fa";

export default function Page() {
  const [loaderDone, setLoaderDone] = useState(false);
  const [toastState, setToastState] = useState<SubmissionState>({
    type: "idle",
    message: "",
  });
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef<number | null>(null);

  const socialIcons = [
    { name: "Twitter", Icon: FaTwitter, url: "https://twitter.com" },
    { name: "LinkedIn", Icon: FaLinkedin, url: "https://linkedin.com" },
    { name: "Instagram", Icon: FaInstagram, url: "https://instagram.com" },
    { name: "Facebook", Icon: FaFacebookF, url: "https://facebook.com" },
    { name: "Dribbble", Icon: FaDribbble, url: "https://dribbble.com" },
    { name: "Behance", Icon: FaBehance, url: "https://behance.net" },
  ];

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

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  function handleSubmissionStateChange(state: SubmissionState) {
    setToastState(state);

    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }

    if (state.type === "idle") {
      setShowToast(false);
      return;
    }

    setShowToast(true);
    toastTimerRef.current = window.setTimeout(() => {
      setShowToast(false);
    }, 3500);
  }

  return (
    <>
      <FloatingToast submissionState={toastState} visible={showToast} />
      <main className="overflow-x-hidden">
        {/* Section - 1 */}
        <section className="bg-linear-to-br mt-20 sm:mt-24 xl:mt-20 from-white to-primary-light">
          <div className="container px-4 sm:px-6">
            <div className="mx-auto">
              <p className="text-primary-dark/70 mb-4 lg:mb-0">
                <Link href="/" className="text-base sm:text-lg text-primary">
                  Home
                </Link>
                <span className="mx-2 text-base sm:text-lg">&gt;</span>
                <Link
                  href="/contact"
                  className="text-base sm:text-lg text-primary-dark"
                >
                  Contact US
                </Link>
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-20 items-center">
                {/* LEFT CONTENT - FIXED */}
                <div
                  data-aos="fade-right"
                  className="flex flex-col justify-center text-center lg:text-left space-y-4 sm:space-y-5"
                >
                  {/* Heading */}
                  <h1
                    className="font-semibold text-primary-dark leading-tight tracking-tight
    text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
                  >
                    Contact
                    <span className="text-primary"> US</span>
                  </h1>

                  {/* Description */}
                  <p className="text-primary-dark/70 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto lg:mx-0">
                    Feel free to get in touch with us using the contact form
                    provided below. We will reply to your inquiry as quickly as
                    possible.
                  </p>
                </div>

                {/* Right Content - Image Grid */}
                <div className="relative mt-4 lg:mt-0">
                  {/* Decorative circles */}
                  <div className="absolute -top-10 -right-10 w-24 h-24 sm:w-40 sm:h-40 bg-primary-light rounded-full opacity-50 blur-2xl"></div>
                  <div className="absolute bottom-20 -left-10 w-32 h-32 sm:w-60 sm:h-60 bg-primary-light rounded-full opacity-50 blur-3xl"></div>
                  <div className="absolute top-32 right-10 w-20 h-20 sm:w-32 sm:h-32 bg-primary-light rounded-full opacity-50 blur-2xl"></div>

                  {/* Image grid */}
                  <div className="relative grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                    {/* Column 1 */}
                    <div className="col-span-1 space-y-3 sm:space-y-4 md:space-y-6 mt-8 sm:mt-16">
                      <div className="rounded-xl sm:rounded-2xl aspect-square overflow-hidden relative float-1">
                        <Image
                          src="/images/contact/business-communication-office.webp"
                          alt="Business communication workspace"
                          fill
                          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 200px"
                          className="object-cover"
                        />
                      </div>
                    </div>

                    {/* Column 2 (Center) */}
                    <div className="col-span-1 space-y-3 sm:space-y-4 md:space-y-6 mt-16 sm:mt-28 md:mt-40">
                      <div className="rounded-xl sm:rounded-2xl aspect-square overflow-hidden relative float-2">
                        <Image
                          src="/images/contact/contact-support-hero.webp"
                          alt="FBS Prints customer support representative"
                          fill
                          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 200px"
                          className="object-cover"
                        />
                      </div>
                    </div>

                    {/* Column 3 */}
                    <div className="col-span-1 space-y-3 sm:space-y-4 md:space-y-6 mt-8 sm:mt-16">
                      <div className="rounded-xl sm:rounded-2xl aspect-square overflow-hidden relative float-1">
                        <Image
                          src="/images/contact/customer-support-team.webp"
                          alt="Customer support team"
                          fill
                          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 200px"
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
        <section
          data-aos="fade-up"
          className="container px-4 sm:px-6 section-padding"
        >
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-0">
            {/* LEFT - Contact Info */}
            <div
              data-aos="fade-right"
              className="p-5 sm:p-6 md:p-10 bg-primary-light rounded-2xl shadow-lg flex flex-col gap-4 sm:gap-5"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-primary text-center lg:text-start">
                Contact Us
              </h2>
              <p className="text-primary-dark/70 text-sm sm:text-base leading-relaxed text-center lg:text-start">
                Reach out for inquiries, quotes, or just to say hello! We reply
                as fast as possible.
              </p>

              <div className="space-y-5 sm:space-y-10 w-fit mx-auto lg:mx-0">
                <div className="flex items-center gap-3 sm:gap-4 justify-start text-left">
                  <FaMapMarkerAlt className="text-primary text-xl sm:text-2xl lg:text-3xl shrink-0" />
                  <p className="text-sm sm:text-base md:text-lg font-medium text-primary-dark">
                    Naperville & Schaumburg, IL
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 justify-start text-left">
                  <FaPhoneAlt className="text-primary text-xl sm:text-2xl lg:text-3xl shrink-0" />
                  <p className="text-sm sm:text-base md:text-lg font-medium text-primary-dark">
                    +1-855-222-1133
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 justify-start text-left">
                  <FaEnvelope className="text-primary text-xl sm:text-2xl lg:text-3xl shrink-0" />
                  <p className="text-sm sm:text-base md:text-lg font-medium text-primary-dark break-all">
                    info@fbsprints.com
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3 mt-6 sm:mt-8 justify-center lg:justify-start">
                {socialIcons.map(({ Icon, url, name }, i) => (
                  <Link
                    key={i}
                    href={url}
                    target="_blank"
                    aria-label={name}
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white shadow text-primary hover:bg-primary hover:text-white transition"
                  >
                    <Icon className="text-lg sm:text-2xl" />
                  </Link>
                ))}
              </div>

              <div data-aos="fade-up" className="pt-6 sm:pt-8 md:pt-10">
                <div className="rounded-xl overflow-hidden shadow-lg">
                  <iframe
                    src="https://www.google.com/maps?q=Illinois,USA&output=embed"
                    className="w-full h-[220px] sm:h-[260px] md:h-[300px]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
              </div>
            </div>

            {/* RIGHT - Form */}
            <div
              data-aos="fade-left"
              className="p-5 sm:p-6 md:p-10 bg-white rounded-2xl shadow-lg"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-primary-dark mb-4 sm:mb-6 text-center lg:text-start">
                Contact Us If You Need A <br className="hidden sm:block" />
                Custom Design Without Delay!
              </h2>

              <p className="mb-4 sm:mb-5 text-sm sm:text-base text-primary text-center lg:text-start">
                To Make An Appointment, Please Call Us. We Would Love To Pamper
                You!
              </p>

              <ContactFormSubmit
                variant="contact"
                onSubmissionStateChange={handleSubmissionStateChange}
              />
            </div>
          </div>
        </section>

        {/* Section - 3 */}
        <section className="section-padding px-4 sm:px-6 mx-auto">
          <Image
            src="/images/contact/global-business-illustration.webp"
            alt="Global business illustration"
            width={1500}
            height={500}
            sizes="100vw"
            className="w-full h-auto"
          />
        </section>

        <Slider />
      </main>
    </>
  );
}