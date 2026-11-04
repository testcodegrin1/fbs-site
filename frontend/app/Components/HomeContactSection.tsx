"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from "react-icons/fa";
import ContactFormSubmit, { type SubmissionState } from "./ContactFormSubmit";
import FloatingToast from "./FloatingToast";

export default function HomeContactSection() {
  const [toastState, setToastState] = useState<SubmissionState>({
    type: "idle",
    message: "",
  });
  const [showToast, setShowToast] = useState(false);
  const timerRef = useRef<number | null>(null);

  function handleSubmission(state: SubmissionState) {
    setToastState(state);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    if (state.type === "idle") {
      setShowToast(false);
      return;
    }
    setShowToast(true);
    timerRef.current = window.setTimeout(() => setShowToast(false), 1500);
  }

  return (
    <>
      <FloatingToast submissionState={toastState} visible={showToast} />
      <section className="container py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Left: Form (2 cols) - own card, rounded-2xl */}
          <div className="lg:col-span-2 flex flex-col justify-center rounded-2xl bg-white shadow-xl p-4 sm:p-6">
            <div className="text-center lg:text-left mb-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-primary leading-tight">
                Contact Us If You Need A Custom
                <span className="block text-primary">
                  Design Without Delay!
                </span>
              </h2>
              <p className="mt-2 text-sm text-primary-dark/70">
                To make an appointment, please call us. We&apos;d love to pamper
                you!
              </p>
            </div>
            <ContactFormSubmit
              variant="home"
              onSubmissionStateChange={handleSubmission}
            />
          </div>

          {/* Right: Image with overlaid glass contact cards - own card, rounded-2xl */}
          <div className="relative min-h-[340px] lg:min-h-0 rounded-2xl overflow-hidden shadow-xl">
            {/* Background image */}
            <Image
              src="/images/home/contact-section-background.webp"
              alt="Contact FBS Prints"
              fill
              className="object-cover blur-xs"
            />

            {/* Dark gradient overlay for legibility */}
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/25 to-black/10 z-0" />

            {/* Overlaid content */}
            <div className="relative z-10 flex flex-col justify-center h-full p-4 sm:p-6 gap-2.5">
              <span className="inline-flex items-center w-fit px-3.5 py-1 rounded-full bg-white text-primary text-xs font-bold uppercase tracking-wider shadow-sm mb-0.5">
                GET IN TOUCH
              </span>

              {/* Location */}
              <div className="flex items-center gap-3 rounded-xl bg-white border border-white/20 p-3">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <FaMapMarkerAlt className="text-white text-sm" />
                </div>
                <div>
                  <p className="text-[12px] uppercase font-bold tracking-wide text-primary-dark/70 mb-0.5">
                    Location
                  </p>
                  <p className="text-sm font-semibold text-gray-500">
                    Illinois, USA
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-3 rounded-xl bg-white border border-white/20 p-3">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <FaPhoneAlt className="text-white text-xs" />
                </div>
                <div>
                  <p className="text-[12px] uppercase font-bold tracking-wide text-primary-dark/70 mb-0.5">
                    Phone
                  </p>
                  <a
                    href="tel:+18552221133"
                    className="text-sm font-semibold text-gray-500 hover:text-primary transition-colors"
                  >
                    +1-855-222-1133
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-3 rounded-xl bg-white border border-white/20 p-3">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <FaEnvelope className="text-white text-xs" />
                </div>
                <div>
                  <p className="text-[12px] uppercase font-bold tracking-wide text-primary-dark/70 mb-0.5">
                    Email
                  </p>
                  <a
                    href="mailto:info@fbsprints.com"
                    className="text-sm font-semibold text-gray-500 hover:text-primary transition-colors break-all"
                  >
                    info@fbsprints.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
