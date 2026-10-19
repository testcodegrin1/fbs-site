"use client";

import { useState } from "react";

const privacySections = [
  {
    title: "Information we collect",
    body: "We may collect the contact details and project information you submit through quote requests, forms, emails, and direct conversations. This can include your name, company, phone number, email address, and project notes.",
  },
  {
    title: "How information is used",
    body: "Submitted information is used to respond to inquiries, prepare quotes, communicate about services, and support active client work. We do not use your details for unrelated purposes.",
  },
  {
    title: "Website usage data",
    body: "Like most business websites, limited usage data such as browser type, visited pages, and approximate device information may be collected to understand site performance and improve the user experience.",
  },
  {
    title: "Sharing and protection",
    body: "We do not sell personal information. Information may be shared only with tools or providers needed to operate the website, communicate with you, or support project delivery. Reasonable steps are taken to protect submitted data.",
  },
  {
    title: "Requests and updates",
    body: "If you need us to update, remove, or stop using your contact details for ongoing communication, contact us and we will handle the request as appropriate for active business or legal needs.",
  },
];

export default function PrivacyPage() {
  const [loaderDone, setLoaderDone] = useState(false);

  return (
    <>
      <main>
        <section className="bg-linear-to-br from-white to-primary-light">
          <div className="container">
            <div className="mx-auto py-16 sm:py-20 lg:py-24">
              <div className="max-w-4xl mx-auto text-center space-y-5">
                <div className="inline-flex items-center gap-3 bg-primary-light text-primary px-5 py-2 rounded-full shadow-lg">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-[13px] font-bold uppercase tracking-widest">
                    Privacy &amp; Data Use
                  </span>
                </div>
                <h1 className="font-semibold text-primary-dark leading-tight tracking-tight text-4xl sm:text-5xl md:text-6xl">
                  Privacy Policy
                </h1>
                <p className="text-primary-dark/70 text-base sm:text-lg max-w-3xl mx-auto">
                  This page explains how FBS Prints handles information
                  submitted through the website, quote requests, and direct
                  communication.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="container section-padding">
          <div className="max-w-5xl mx-auto grid gap-6">
            {privacySections.map((section) => (
              <article
                key={section.title}
                className="rounded-3xl bg-white p-8 shadow-lg border border-primary-light"
              >
                <h2 className="text-2xl md:text-3xl font-bold text-primary">
                  {section.title}
                </h2>
                <p className="mt-4 text-primary-dark/70 leading-relaxed text-base md:text-lg">
                  {section.body}
                </p>
              </article>
            ))}

            <article className="rounded-3xl bg-linear-to-r from-primary to-primary-dark p-8 text-white shadow-lg">
              <h2 className="text-2xl md:text-3xl font-bold">
                Contact regarding privacy questions
              </h2>
              <p className="mt-4 text-primary-light text-base md:text-lg leading-relaxed">
                For privacy or data-use questions, contact FBS Prints at{" "}
                info@fbsprints.com or call +1-855-222-1133.
              </p>
            </article>
          </div>
        </section>
      </main>
    </>
  );
}
