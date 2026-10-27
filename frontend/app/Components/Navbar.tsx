"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FiArrowUpRight } from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import { IoIosMenu } from "react-icons/io";
import { FaEnvelope, FaMapMarkerAlt, FaPhoneAlt, FaUserCircle } from "react-icons/fa";

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);

  // Desktop Services menu supports BOTH interactions without conflict:
  // - hoverOpen: true while the mouse is over the menu (hover-to-preview)
  // - clickLocked: true after a click  "pins" the menu open even if the mouse leaves,
  //   until it's clicked again, a link is chosen, or the user clicks outside.
  const [hoverOpen, setHoverOpen] = useState(false);
  const [clickLocked, setClickLocked] = useState(false);
  const desktopServiceOpen = hoverOpen || clickLocked;
  const desktopDropdownRef = useRef<HTMLLIElement>(null);

  const scrollYRef = useRef(0);

  // Robust cross-browser scroll lock while the mobile menu is open.
  // Plain `overflow: hidden` on the body does NOT stop background scroll/rubber-banding
  // on iOS Safari  locking with `position: fixed` + restoring scroll position does.
  useEffect(() => {
    if (menuOpen) {
      scrollYRef.current = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollYRef.current);
    }

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Close the desktop dropdown on outside click  only matters once it's click-locked open,
  // since hover already closes itself on mouse-leave.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        desktopDropdownRef.current &&
        !desktopDropdownRef.current.contains(event.target as Node)
      ) {
        setClickLocked(false);
        setHoverOpen(false);
      }
    }
    if (clickLocked) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [clickLocked]);

  // Close everything whenever route changes
  useEffect(() => {
    // This reset intentionally follows navigation so an open mobile/dropdown
    // menu never remains over the newly rendered page.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHoverOpen(false);
    setClickLocked(false);
    setMenuOpen(false);
    setServiceOpen(false);
  }, [pathname]);

  // The protected dashboard handles signed-out visitors by sending them to the
  // user login, keeping account access inside the user panel.
  const profileHref = "/profile";

  const linkClass = (path: string) =>
    `relative px-3 py-2 text-black transition
     after:content-[''] after:absolute after:right-0 after:bottom-0
     after:h-[2px] after:w-0 after:bg-black
     after:transition-all after:duration-300
     hover:after:w-full hover:after:left-0
     ${pathname === path ? "after:w-full after:left-0" : ""}`;

  const isServicesActive =
    pathname.startsWith("/services") || pathname.startsWith("/printing-products");

  const parentLinkClass = (path: string) =>
    `relative px-3 py-2 text-black transition
     after:content-[''] after:absolute after:right-0 after:bottom-0
     after:h-[2px] after:w-0 after:bg-black
     after:transition-all after:duration-300
     hover:after:w-full hover:after:left-0
     ${(path === "/services" ? isServicesActive : pathname.startsWith(path)) ? "after:w-full after:left-0" : ""}`;

  const dropdownLinkClass = (path: string) =>
    pathname === path
      ? "block px-4 py-2"
      : "block px-4 py-2 rounded-lg text-primary-dark/60 transition hover:text-primary-dark/80";

  const servicesLinks = [
    ["Products", "/printing-products"],
    ["Signage", "/services/signage"],
    ["Direct Mailing", "/services/direct-mailing"],
    ["Web Design", "/services/web-design"],
    ["SEO", "/services/seo"],
  ];

  const mobileLinks: [string, string][] = [
    ["HOME", "/"],
    ["ABOUT US", "/about"],
  ];

  function closeDesktopServices() {
    setHoverOpen(false);
    setClickLocked(false);
  }

  return (
    <>
      {/* HEADER */}
      <header className="top-0 z-50 fixed w-full shadow-md bg-white">
        <nav className="flex items-center justify-between max-w-[1880px] section-padding-header md:px-10 px-5">
          {/* LOGO */}
          <Link href="/" aria-label="FBS Prints home" className="shrink-0">
            <Image
              src="/images/brand/fbs-prints-logo.webp"
              alt="FBS Prints logo"
              width={162}
              height={62}
              priority
              style={{ height: "72px", width: "auto" }}
              className="h-[50px] sm:h-[58px] md:h-[72px] w-auto"
            />
          </Link>

          {/* DESKTOP MENU */}
          <ul className="hidden xl:flex items-center gap-1 text-base 2xl:text-xl font-medium whitespace-nowrap">
            <li>
              <Link href="/" className={linkClass("/")}>
                Home
              </Link>
            </li>
            <li>
              <Link href="/about" className={linkClass("/about")}>
                About
              </Link>
            </li>

            {/* SERVICES MEGA MENU  desktop: hover AND click both work */}
            <li
              className="relative"
              ref={desktopDropdownRef}
              onMouseEnter={() => setHoverOpen(true)}
              onMouseLeave={() => setHoverOpen(false)}
            >
              <button
                type="button"
                className={`${parentLinkClass("/services")} flex items-center cursor-pointer gap-1`}
                onClick={() => setClickLocked((prev) => !prev)}
                aria-haspopup="true"
                aria-expanded={desktopServiceOpen}
              >
                Services
                <span
                  className={`inline-block transition-transform duration-200 ${
                    desktopServiceOpen ? "rotate-180" : ""
                  }`}
                >
                  ▾
                </span>
              </button>
              <ul
                className={`absolute top-12 left-0 w-52 bg-white shadow-xl rounded-xl py-3 transition-all duration-300 z-50
                ${
                  desktopServiceOpen
                    ? "opacity-100 visible translate-y-0"
                    : "opacity-0 invisible translate-y-2"
                }`}
              >
                {servicesLinks.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={dropdownLinkClass(href)}
                      onClick={closeDesktopServices}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>

            <li>
              <Link href="/blog" className={parentLinkClass("/blog")}>
                Blog
              </Link>
            </li>

            <li>
              <Link href="/our-work" className={parentLinkClass("/our-work")}>
                Our Work
              </Link>
            </li>
            
            <li>
              <Link href="/contact" className={linkClass("/contact")}>
                Contact Us
              </Link>
            </li>

          </ul>

          {/* DESKTOP RIGHT */}
          <div className="hidden xl:flex items-center gap-3">
            <Image
              src="/images/brand/one-hundred-percent-badge.gif"
              alt="100 percent satisfaction badge"
              width={96}
              height={96}
              unoptimized
              className="w-20 xl:w-24 h-auto"
            />
            <Link
              href={profileHref}
              aria-label="Open user profile and submission history"
              title="Account"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-primary text-primary transition hover:bg-primary hover:text-white"
            >
              <FaUserCircle className="text-xl" />
            </Link>
            <Link
              href="/contact"
              className="flex items-center gap-3 bg-primary px-3 py-2 rounded-full"
            >
              <span className="font-semibold text-white whitespace-nowrap">
                BOOK A SERVICE
              </span>
              <span className="flex items-center justify-center w-10 h-10 bg-primary text-white rounded-full">
                <FiArrowUpRight />
              </span>
            </Link>
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            type="button"
            className={`xl:hidden z-[60] transition-opacity duration-300 p-1
            ${menuOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <IoIosMenu size={32} className="text-black" />
          </button>
        </nav>
      </header>

      {/* MOBILE FULL-SCREEN MENU */}
      <div
        role="dialog"
        aria-modal="true"
        aria-hidden={!menuOpen}
        className={`fixed top-0 left-0 h-dvh w-full max-w-full bg-white z-50
        transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${menuOpen ? "translate-x-0" : "-translate-x-full"}
        xl:hidden flex flex-col overflow-y-auto overscroll-contain
        pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]`}
      >
        {/* TOP BAR */}
        <div className="flex items-center justify-between px-6 sm:px-8 pt-6 sm:pt-8 pb-3 shrink-0">
          <Link href={"/"}>
            <Image
              src="/images/brand/fbs-prints-logo.webp"
              alt="FBS Prints logo"
              width={132}
              height={52}
              className="h-[42px] w-auto"
            />
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/10 active:bg-black/20 transition-colors"
            aria-label="Close menu"
          >
            <IoClose size={22} className="text-black" />
          </button>
        </div>

        {/* NAV LINKS */}
        <nav className="flex-1 px-6 sm:px-8 pt-2 pb-6">
          <ul className="space-y-1">
            {mobileLinks.map(([label, href]) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`block py-2 text-lg sm:text-xl tracking-[0.10em] border-b border-black/[0.06] transition-colors duration-300
                  ${pathname === href ? "text-primary font-semibold" : "text-black"}`}
                >
                  {label}
                </Link>
              </li>
            ))}

            {/* SERVICES ACCORDION  mobile: click only, single toggle */}
            <li>
              <button
                type="button"
                onClick={() => setServiceOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between py-2 text-lg sm:text-xl tracking-[0.10em]
                ${isServicesActive ? "text-primary font-semibold" : "text-black"}`}
                aria-expanded={serviceOpen}
                aria-controls="mobile-services-panel"
              >
                SERVICES
                <span
                  className={`transition-transform duration-200 text-2xl flex items-center justify-center ${
                    serviceOpen ? "rotate-180" : ""
                  }`}
                >
                  ▾
                </span>
              </button>

              <div
                id="mobile-services-panel"
                className={`overflow-hidden border-b border-black/[0.06] transition-all duration-300 ${
                  serviceOpen ? "max-h-72 pb-3" : "max-h-0"
                }`}
              >
                {servicesLinks.map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={`block pl-4 py-2 text-sm sm:text-md uppercase transition-colors
                    ${pathname === href ? "text-primary font-medium" : "text-black hover:text-primary"}`}
                  >
                    - {label}
                  </Link>
                ))}
              </div>
            </li>

            <li>
              <Link
                href="/blog"
                onClick={() => setMenuOpen(false)}
                className={`block py-2 text-lg sm:text-xl tracking-[0.10em] border-b border-black/[0.06] transition-colors duration-300
                ${pathname === "/blog" ? "text-primary font-semibold" : "text-black"}`}
              >
                BLOG
              </Link>
            </li>

            <li>
              <Link
                href="/our-work"
                onClick={() => setMenuOpen(false)}
                className={`block py-2 text-lg sm:text-xl tracking-[0.10em] border-b border-black/[0.06] transition-colors duration-300
                ${pathname === "/our-work" ? "text-primary font-semibold" : "text-black"}`}
              >
                OUR WORK
              </Link>
            </li>

            <li>
              <Link
                href="/contact"
                onClick={() => setMenuOpen(false)}
                className={`block py-2 text-lg sm:text-xl tracking-[0.10em] border-b border-black/[0.06] transition-colors duration-300
                ${pathname === "/contact" ? "text-primary font-semibold" : "text-black"}`}
              >
                CONTACT US
              </Link>
            </li>

            <li>
              <Link
                href={profileHref}
                onClick={() => setMenuOpen(false)}
                aria-label="Open account"
                title="Account"
                className={`flex items-center border-b border-black/[0.06] py-3 text-2xl transition-colors duration-300
                ${pathname.startsWith("/user") ? "text-primary font-semibold" : "text-black"}`}
              >
                <FaUserCircle />
              </Link>
            </li>
          </ul>

          <div className="py-8 sm:py-10 space-y-4">
            <a href="mailto:info@fbsprints.com" className="flex items-center gap-2 min-w-0">
              <span className="shrink-0">
                <FaEnvelope />
              </span>
              <p className="text-black text-sm tracking-wide break-all">
                info@fbsprints.com
              </p>
            </a>
            <a href="tel:+18552221133" className="flex items-center gap-2">
              <span className="shrink-0">
                <FaPhoneAlt />
              </span>
              <p className="text-black text-sm tracking-wide">
                +1-855-222-1133
              </p>
            </a>
            <div className="flex items-center gap-2">
              <span className="shrink-0">
                <FaMapMarkerAlt />
              </span>
              <p className="text-black text-sm tracking-wide">
                Serving Naperville & Schaumburg, IL
              </p>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
