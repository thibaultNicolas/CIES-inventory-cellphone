"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Smartphone,
  Package,
  Banknote,
  ArrowRight,
  Sparkles,
  Target,
  ShoppingBag,
  Star,
  MapPin,
  Check,
  Phone,
  Mail,
  Lock,
  Zap,
  Gauge,
  CircleDollarSign,
  ChevronDown,
  Facebook,
  Instagram,
  Menu,
  X,
} from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import type { BrandForHome } from "@/lib/brands";

gsap.registerPlugin(ScrollTrigger);

// Intersection Observer hook for scroll-triggered fade-in (opacity + translateY)
function useFadeInSection(opts?: { rootMargin?: string; threshold?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      {
        rootMargin: opts?.rootMargin ?? "0px 0px -60px 0px",
        threshold: opts?.threshold ?? 0.1,
      },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [opts?.rootMargin, opts?.threshold]);
  return [ref, visible] as const;
}

const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/place/Achetetoncell/@46.8121712,-71.2993801,17z/data=!3m1!4b1!4m6!3m5!1s0x4cb8976a59d4f2bf:0xebde10f37156b907!8m2!3d46.8121712!4d-71.2993801!16s%2Fg%2F11w_wc38jx?entry=ttu";

type HomeContentProps = {
  brands?: BrandForHome[];
};

export function HomeContent({ brands = [] }: HomeContentProps) {
  const { t, locale } = useI18n();
  const heroRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const heroDescRef = useRef<HTMLParagraphElement>(null);
  const heroCtaRef = useRef<HTMLAnchorElement>(null);
  const heroBadgesRef = useRef<HTMLDivElement>(null);
  const heroImageRef = useRef<HTMLDivElement>(null);
  const processSectionRef = useRef<HTMLElement>(null);
  const processCardsRef = useRef<HTMLDivElement[]>([]);
  const brandsSectionRef = useRef<HTMLDivElement>(null);
  const missionRef = useRef<HTMLElement>(null);
  const missionContentRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLElement>(null);
  const reviewCardsRef = useRef<HTMLDivElement[]>([]);
  const ctaRef = useRef<HTMLElement>(null);
  const ctaContentRef = useRef<HTMLDivElement>(null);
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reviewCountDisplay, setReviewCountDisplay] = useState(0);
  const reviewCountAnimatedRef = useRef(false);
  const [processFadeRef, processFadeIn] = useFadeInSection();
  const [missionFadeRef, missionFadeIn] = useFadeInSection();
  const [reviewsFadeRef, reviewsFadeIn] = useFadeInSection();

  const getLocalizedPath = (path: string) => {
    if (locale === "fr") return path === "/" ? "/" : path;
    return path === "/" ? `/en` : `/${locale}${path}`;
  };

  useEffect(() => {
    const onScroll = () =>
      setNavScrolled(typeof window !== "undefined" && window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      setReviewCountDisplay(0);
      reviewCountAnimatedRef.current = false;

      const lines = headlineRef.current?.querySelectorAll(".hero-line") ?? [];
      gsap.set(lines, { opacity: 0, y: 20 });
      gsap.set(heroDescRef.current, { opacity: 0, y: 20 });
      gsap.set(heroCtaRef.current, { opacity: 0, y: 20 });
      gsap.set(heroBadgesRef.current, { opacity: 0, y: 20 });
      gsap.set(heroImageRef.current, { opacity: 0, scale: 0.96 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to(lines, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 })
        .to(heroDescRef.current, { opacity: 1, y: 0, duration: 0.5 }, "-=0.25")
        .to(heroCtaRef.current, { opacity: 1, y: 0, duration: 0.5 }, "-=0.2")
        .to(heroBadgesRef.current, { opacity: 1, y: 0, duration: 0.5 }, "-=0.2")
        .to(
          heroImageRef.current,
          { opacity: 1, scale: 1, duration: 0.9 },
          "-=0.8",
        );

      // Process cards: scroll-triggered entrance (Intersection Observer–style via ScrollTrigger)
      processCardsRef.current.forEach((el, i) => {
        if (!el) return;
        gsap.fromTo(
          el,
          { opacity: 0, y: 36 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: i * 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: processSectionRef.current,
              start: "top 72%",
              toggleActions: "play none none none",
            },
          },
        );
      });

      // Mission: scroll reveal
      gsap.fromTo(
        missionContentRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: missionRef.current,
            start: "top 78%",
            toggleActions: "play none none none",
          },
        },
      );

      // Review cards: stagger
      reviewCardsRef.current.forEach((el, i) => {
        if (!el) return;
        gsap.fromTo(
          el,
          { opacity: 0, y: 36 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            delay: i * 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: reviewsRef.current,
              start: "top 78%",
              toggleActions: "play none none none",
            },
          },
        );
      });

      // CTA: scroll reveal
      gsap.fromTo(
        ctaContentRef.current,
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        },
      );

      // Reviews counter: count up when section in view (once)
      const reviewCountTarget =
        Number(t.home.reviews.googleReviewsCount) || 250;
      ScrollTrigger.create({
        trigger: reviewsRef.current,
        start: "top 80%",
        once: true,
        onEnter: () => {
          if (reviewCountAnimatedRef.current) return;
          reviewCountAnimatedRef.current = true;
          const obj = { value: 0 };
          gsap.to(obj, {
            value: reviewCountTarget,
            duration: 2,
            ease: "power2.out",
            onUpdate: () => {
              setReviewCountDisplay(Math.round(obj.value));
            },
          });
        },
      });
    }, heroRef);
    return () => ctx.revert();
  }, [locale, brands.length]);

  const reviews = t.home.reviews.reviews;
  const rachatPath = locale === "fr" ? "/" : "/en";
  const setProcessCardRef = (el: HTMLDivElement | null, i: number) => {
    processCardsRef.current[i] = el!;
  };
  const setReviewCardRef = (el: HTMLDivElement | null, i: number) => {
    reviewCardsRef.current[i] = el!;
  };

  return (
    <>
      <nav
        className={`fixed left-0 right-0 top-0 z-50 transition-[background-color,box-shadow] duration-300 ease-out ${
          navScrolled ? "bg-white shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link
            href={getLocalizedPath("/")}
            className="shrink-0 font-(family-name:--font-playfair) text-xl font-semibold tracking-tight text-brand-dark transition-colors hover:text-brand-primary sm:text-2xl"
          >
            AcheteTonCell
          </Link>
          {/* Desktop: links + CTA + language */}
          <div className="hidden flex-wrap items-center justify-end gap-3 md:flex md:gap-6">
            <Link
              href={`${getLocalizedPath("/")}#processus`}
              className={`relative text-sm font-medium tracking-wide text-foreground after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-current after:transition-[width] after:duration-200 after:content-[''] hover:after:w-full ${
                navScrolled
                  ? "text-foreground"
                  : "text-foreground/90 hover:text-brand-primary"
              }`}
            >
              {t.nav.processus}
            </Link>
            <Link
              href={`${getLocalizedPath("/")}#faq`}
              className={`relative text-sm font-medium tracking-wide text-foreground after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-current after:transition-[width] after:duration-200 after:content-[''] hover:after:w-full ${
                navScrolled
                  ? "text-foreground"
                  : "text-foreground/90 hover:text-brand-primary"
              }`}
            >
              {t.nav.faq}
            </Link>
            <a
              href="https://achetetoncell.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={`relative text-sm font-medium tracking-wide text-foreground after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-current after:transition-[width] after:duration-200 after:content-[''] hover:after:w-full ${
                navScrolled
                  ? "text-foreground"
                  : "text-foreground/90 hover:text-brand-primary"
              }`}
            >
              {t.nav.shop}
            </a>
            <Link
              href={locale === "fr" ? "/" : `/${locale}`}
              className="rounded-full bg-brand-dark px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90 sm:px-5 sm:py-2.5 sm:text-sm sm:font-medium"
            >
              {t.nav.getPrice}
            </Link>
            <LanguageSwitcher />
          </div>
          {/* Mobile: CTA + language + hamburger */}
          <div className="flex flex-wrap items-center justify-end gap-3 md:hidden">
            <Link
              href={locale === "fr" ? "/" : `/${locale}`}
              className="rounded-full bg-brand-dark px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
            >
              {t.nav.getPrice}
            </Link>
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-black/5"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-menu"
              aria-label={mobileMenuOpen ? t.nav.closeMenu : t.nav.openMenu}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden />
              ) : (
                <Menu className="h-6 w-6" aria-hidden />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        <div
          id="mobile-nav-menu"
          className={`fixed inset-0 top-[3.5rem] z-40 md:hidden ${
            mobileMenuOpen ? "visible opacity-100" : "invisible opacity-0"
          } transition-[visibility,opacity] duration-200`}
          aria-hidden={!mobileMenuOpen}
        >
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-label={t.nav.closeMenu}
          />
          <div
            className={`absolute right-0 top-0 flex h-full w-full max-w-sm flex-col gap-1 border-l border-black/10 bg-white p-4 shadow-xl transition-transform duration-300 ease-out ${
              mobileMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <Link
              href={`${getLocalizedPath("/")}#processus`}
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-black/5 hover:text-brand-primary"
            >
              {t.nav.processus}
            </Link>
            <Link
              href={`${getLocalizedPath("/")}#faq`}
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-black/5 hover:text-brand-primary"
            >
              {t.nav.faq}
            </Link>
            <a
              href="https://achetetoncell.com/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-black/5 hover:text-brand-primary"
            >
              {t.nav.shop}
            </a>
            <div className="mt-4 border-t border-black/10 pt-4">
              <Link
                href={locale === "fr" ? "/" : `/${locale}`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center rounded-full bg-brand-dark px-4 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
              >
                {t.nav.getPrice}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section
        ref={heroRef}
        className="relative min-h-screen overflow-hidden pt-20 pb-12 sm:pt-28 sm:pb-20"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 sm:gap-16 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:py-24">
          <div className="flex min-w-0 flex-col justify-center">
            <span className="mb-4 block text-xs font-semibold uppercase tracking-[0.2em] text-foreground/50 sm:mb-6">
              {t.home.tagline}
            </span>
            <h1
              ref={headlineRef}
              className="mb-6 font-(family-name:--font-playfair) font-light leading-tight text-brand-dark sm:mb-8"
              style={{ fontSize: "clamp(2.2rem, 4vw, 3.2rem)" }}
            >
              <span className="hero-line block">{t.home.title}</span>
              <span className="hero-line block">{t.home.titleLine2}</span>
            </h1>
            <p
              ref={heroDescRef}
              className="mb-8 max-w-md text-base leading-relaxed text-foreground/75 sm:mb-10 sm:text-lg"
            >
              {t.home.description}
            </p>
            <Link
              ref={heroCtaRef}
              href={locale === "fr" ? "/" : "/en"}
              className="inline-flex w-fit items-center justify-center rounded-full bg-brand-dark px-9 py-[18px] text-base font-bold uppercase tracking-[0.12em] text-white shadow-[0_4px_24px_-4px_rgba(0,0,114,0.4)] transition-all duration-300 hover:bg-brand-primary hover:shadow-[0_8px_32px_-4px_rgba(0,38,255,0.35)] hover:scale-[1.02]"
            >
              {t.home.cta}
            </Link>
            <div
              ref={heroBadgesRef}
              className="mt-6 flex flex-wrap items-center justify-start gap-4 text-sm text-foreground/60"
            >
              <span className="inline-flex items-center gap-2">
                <Lock
                  className="h-4 w-4 shrink-0 text-foreground/50"
                  aria-hidden
                />
                {t.home.trustBadges.secure}
              </span>
              <span className="inline-flex items-center gap-2">
                <Zap
                  className="h-4 w-4 shrink-0 text-foreground/50"
                  aria-hidden
                />
                {t.home.trustBadges.fast}
              </span>
              <span className="inline-flex items-center gap-2">
                <Package
                  className="h-4 w-4 shrink-0 text-foreground/50"
                  aria-hidden
                />
                {t.home.trustBadges.shipping}
              </span>
            </div>
          </div>
          <div
            ref={heroImageRef}
            className="relative flex justify-center lg:justify-end"
          >
            <div className="relative overflow-hidden rounded-2xl shadow-[0_24px_64px_-12px_rgba(0,0,0,0.12)] sm:rounded-[32px]">
              <div
                className="relative"
                style={{
                  maskImage:
                    "radial-gradient(ellipse 80% 100% at center, black 55%, transparent 100%)",
                  WebkitMaskImage:
                    "radial-gradient(ellipse 80% 100% at center, black 55%, transparent 100%)",
                }}
              >
                <Image
                  src="/hero.png"
                  alt="iPhone"
                  width={560}
                  height={560}
                  className="rounded-2xl object-cover sm:rounded-[32px]"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        {brands.length > 0 && (
          <div ref={brandsSectionRef} className="pt-12 pb-12 sm:pt-16 sm:pb-16">
            <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-4 sm:gap-5 sm:px-6 md:flex-row md:items-center md:gap-14">
              <div className="min-w-0 shrink-0">
                <h2 className="font-(family-name:--font-playfair) text-2xl font-light text-brand-dark sm:text-3xl md:text-4xl">
                  {t.home.brands.title}
                </h2>
                <p className="mt-2 text-sm text-foreground/60 sm:text-base">
                  {t.home.brands.subtitle}
                </p>
              </div>
              <div className="w-full min-w-0 overflow-hidden md:flex-1">
                <div
                  className="flex w-max gap-14 py-2"
                  style={{ animation: "brand-scroll 50s linear infinite" }}
                >
                  {[...brands, ...brands].map((brand, i) => (
                    <Link
                      key={`${brand.id}-${i}`}
                      href={rachatPath}
                      className="flex shrink-0 items-center justify-center transition-transform duration-300 hover:scale-110 md:opacity-80 md:hover:opacity-100"
                      aria-label={brand.name}
                    >
                      {brand.logo_url ? (
                        <Image
                          src={brand.logo_url}
                          alt=""
                          width={104}
                          height={130}
                          className="h-13 w-auto max-w-[130px] object-contain object-center grayscale md:h-16"
                        />
                      ) : (
                        <Smartphone
                          className="h-13 w-13 shrink-0 text-foreground/50 md:h-16 md:w-16"
                          strokeWidth={1.2}
                        />
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section
        ref={processSectionRef}
        id="processus"
        className="scroll-mt-24 rounded-t-[32px] bg-[#3453fe] pt-12 pb-20 sm:rounded-t-[40px] sm:pt-20 sm:pb-24 md:pt-20 md:pb-32"
      >
        <div
          ref={processFadeRef}
          className="mx-auto max-w-7xl px-4 transition-[opacity,transform] duration-700 ease-out sm:px-6"
          style={{
            opacity: processFadeIn ? 1 : 0,
            transform: processFadeIn ? "translateY(0)" : "translateY(24px)",
          }}
        >
          <div className="mb-12 max-w-2xl mx-auto text-center sm:mb-16">
            <h2 className="mb-4 font-(family-name:--font-playfair) text-3xl font-light text-white sm:mb-6 sm:text-4xl md:text-5xl">
              {t.home.howItWorksSubtitle}
            </h2>
            <p className="text-sm leading-relaxed text-white/90 sm:text-base">
              {t.home.howItWorksIntro}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
            {[
              {
                icon: Gauge,
                number: t.home.step1.number,
                title: t.home.step1.title,
                desc: t.home.step1.description,
              },
              {
                icon: Package,
                number: t.home.step2.number,
                title: t.home.step2.title,
                desc: t.home.step2.description,
              },
              {
                icon: CircleDollarSign,
                number: t.home.step3.number,
                title: t.home.step3.title,
                desc: t.home.step3.description,
              },
            ].map((step, i) => (
              <div
                key={i}
                ref={(el) => setProcessCardRef(el, i)}
                className="flex flex-col rounded-2xl border-0 bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] sm:p-8"
              >
                <div className="mb-6 flex justify-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#3453fe] text-white">
                    <step.icon className="h-10 w-10" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="relative mb-4 text-center">
                  <span
                    className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-(family-name:--font-playfair) text-7xl font-extralight leading-none text-foreground/6 sm:text-8xl"
                    aria-hidden
                  >
                    {step.number}
                  </span>
                  <h3 className="relative text-lg font-bold text-foreground">
                    {step.title}
                  </h3>
                </div>
                <p className="text-center text-sm leading-relaxed text-foreground/75">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        ref={missionRef}
        className="relative pt-12 pb-20 sm:pt-20 sm:pb-24 md:pb-32"
      >
        <div
          ref={missionFadeRef}
          className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 transition-[opacity,transform] duration-700 ease-out sm:gap-12 sm:px-6 lg:grid-cols-2 lg:gap-16"
          style={{
            opacity: missionFadeIn ? 1 : 0,
            transform: missionFadeIn ? "translateY(0)" : "translateY(24px)",
          }}
        >
          <div className="relative min-w-0 overflow-hidden rounded-2xl shadow-[0_24px_64px_-12px_rgba(0,0,0,0.12)] sm:rounded-[32px]">
            <Image
              src="/mrcellphone.jpg"
              alt=""
              width={640}
              height={480}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          <div ref={missionContentRef} className="min-w-0 lg:pl-4">
            <h2 className="mb-3 font-(family-name:--font-playfair) text-3xl font-light leading-tight text-brand-dark sm:mb-4 sm:text-4xl md:text-5xl">
              {t.home.mission.title}
            </h2>
            <p className="mb-6 text-base leading-relaxed text-foreground/80 sm:mb-8 sm:text-lg">
              {t.home.mission.intro}
            </p>
            <ul className="space-y-4 sm:space-y-5">
              {t.home.mission.points.map(
                (point: { title: string; description: string }, i: number) => (
                  <li key={i} className="flex gap-3">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary"
                      aria-hidden
                    />
                    <div>
                      <span className="font-semibold text-foreground">
                        {point.title}
                      </span>
                      <span className="text-foreground/80">
                        {" : "}
                        {point.description}
                      </span>
                    </div>
                  </li>
                ),
              )}
            </ul>
            <a
              href={`tel:${t.home.mission.phone.replace(/\s/g, "")}`}
              className="mt-6 inline-flex items-center gap-2 text-base font-semibold text-brand-primary transition-colors hover:text-brand-dark sm:mt-8"
            >
              <Phone className="h-5 w-5 shrink-0" aria-hidden />
              {t.home.mission.phone}
            </a>
          </div>
        </div>
      </section>

      <section
        ref={reviewsRef}
        className="rounded-t-[32px] border-t border-black/5 bg-[#F4F1EA] py-12 sm:rounded-t-[40px] sm:py-20"
      >
        <div
          ref={reviewsFadeRef}
          className="mx-auto max-w-7xl px-4 transition-[opacity,transform] duration-700 ease-out sm:px-6"
          style={{
            opacity: reviewsFadeIn ? 1 : 0,
            transform: reviewsFadeIn ? "translateY(0)" : "translateY(24px)",
          }}
        >
          <div className="mb-10 text-center sm:mb-12">
            <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.2em] text-foreground/50 sm:mb-4">
              {t.home.reviews.title}
            </span>
            <h2 className="mb-3 font-(family-name:--font-playfair) text-2xl font-light text-brand-dark sm:mb-4 sm:text-3xl md:text-4xl">
              {t.home.reviews.subtitle}
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <p className="flex items-center gap-2 text-3xl font-bold tabular-nums text-brand-dark sm:text-4xl">
                <span aria-live="polite">{reviewCountDisplay}</span>
                <span className="text-lg font-medium text-foreground/70 sm:text-xl">
                  {t.home.reviews.reviewCountLabel}
                </span>
              </p>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 sm:px-4 sm:py-2 sm:text-sm">
                <Star className="h-5 w-5 fill-brand-gold text-brand-gold" />
                <span>5.0</span>
                <span className="text-foreground/60">
                  — {t.home.reviews.ratingLabel}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
            {reviews.map((review, i) => (
              <div
                key={i}
                ref={(el) => setReviewCardRef(el, i)}
                className="rounded-2xl border border-black/6 border-l-[3px] border-l-brand-primary bg-white p-5 shadow-[var(--shadow-soft)] transition-colors duration-300 hover:border-brand-primary sm:rounded-[24px] sm:p-6"
              >
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: review.stars }).map((_, j) => (
                    <Star
                      key={j}
                      className="h-5 w-5 fill-brand-gold text-brand-gold"
                    />
                  ))}
                </div>
                <p className="mb-4 text-foreground/90">
                  &ldquo;{review.text}&rdquo;
                </p>
                <p className="text-sm font-medium text-foreground/80">
                  — {review.name}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border-2 border-foreground/20 bg-white px-6 py-3 text-sm font-semibold text-foreground transition-all hover:border-brand-primary hover:text-brand-primary"
            >
              {t.home.reviews.viewOnGoogle}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

export function StoreSection() {
  const { t } = useI18n();
  const storeRef = useRef<HTMLElement>(null);
  const storeCardRef = useRef<HTMLDivElement>(null);
  const [fadeRef, fadeIn] = useFadeInSection();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        storeCardRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: storeRef.current,
            start: "top 78%",
            toggleActions: "play none none none",
          },
        },
      );
    }, storeRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={storeRef} className="bg-[#F4F1EA] py-12 sm:py-20">
      <div
        ref={fadeRef}
        className="mx-auto max-w-4xl px-4 transition-[opacity,transform] duration-700 ease-out sm:px-6"
        style={{
          opacity: fadeIn ? 1 : 0,
          transform: fadeIn ? "translateY(0)" : "translateY(24px)",
        }}
      >
        <div
          ref={storeCardRef}
          className="flex min-w-0 flex-col items-center rounded-2xl border border-black/6 bg-gradient-to-br from-[#F8F7FC] to-[#F4F1EA] p-6 text-center shadow-[var(--shadow-card)] sm:rounded-[32px] sm:p-10 md:p-16"
        >
          <div className="mb-6 inline-flex rounded-2xl bg-white p-4 shadow-[var(--shadow-soft)]">
            <ShoppingBag
              className="h-8 w-8 text-brand-primary"
              strokeWidth={1.2}
            />
          </div>
          <h2 className="mb-3 font-(family-name:--font-playfair) text-2xl font-light text-brand-dark sm:mb-3 sm:text-3xl md:text-4xl">
            {t.home.store.title}
          </h2>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-foreground/60 sm:text-sm">
            {t.home.store.subtitle}
          </p>
          <p className="mb-8 max-w-xl text-sm text-foreground/80 sm:mb-10 sm:text-base">
            {t.home.store.description}
          </p>
          <a
            href="https://achetetoncell.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-brand-dark px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-[0_4px_24px_-4px_rgba(0,0,114,0.35)] transition-all duration-300 hover:bg-brand-primary hover:scale-[1.02] sm:px-10 sm:py-4"
          >
            {t.home.store.cta}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

export function CtaSection() {
  const { t, locale } = useI18n();
  const ctaRef = useRef<HTMLElement>(null);
  const ctaContentRef = useRef<HTMLDivElement>(null);
  const [fadeRef, fadeIn] = useFadeInSection();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ctaContentRef.current,
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 82%",
            toggleActions: "play none none none",
          },
        },
      );
    }, ctaRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={ctaRef}
      className="relative overflow-hidden bg-brand-dark py-12 text-white sm:py-20"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-transparent" />
      <div
        ref={fadeRef}
        className="relative mx-auto max-w-7xl px-4 transition-[opacity,transform] duration-700 ease-out sm:px-6"
        style={{
          opacity: fadeIn ? 1 : 0,
          transform: fadeIn ? "translateY(0)" : "translateY(24px)",
        }}
      >
        <div
          ref={ctaContentRef}
          className="flex flex-col items-center text-center"
        >
          <span className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 sm:mb-4">
            {t.home.ctaSection.ready}
          </span>
          <h2 className="mb-6 font-(family-name:--font-playfair) text-3xl font-light text-white sm:mb-8 sm:text-4xl md:text-5xl">
            {t.home.ctaSection.yourDevice}
            <br />
            <span className="italic">{t.home.ctaSection.discover}</span>
          </h2>
          <Link
            href={locale === "fr" ? "/" : "/en"}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-brand-primary px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl sm:px-10 sm:py-4"
          >
            {t.home.ctaSection.getPrice}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function VolumeSection() {
  const { t, locale } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const introRef = useRef<HTMLParagraphElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const bulletsRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const bulletRefs = useRef<(HTMLElement | null)[]>([]);
  const [fadeRef, fadeIn] = useFadeInSection();

  useEffect(() => {
    const ctx = gsap.context(() => {
      const trigger = sectionRef.current;
      if (!trigger) return;
      const badge = badgeRef.current;
      const title = titleRef.current;
      const intro = introRef.current;
      const desc = descRef.current;
      const bullets = bulletsRef.current;
      const contact = contactRef.current;
      const bulletEls = bulletRefs.current.filter(Boolean);

      gsap.set([badge, title, intro, desc, bullets, contact], {
        opacity: 0,
        y: 24,
      });
      gsap.set(bulletEls, { opacity: 0, x: -12 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger,
          start: "top 78%",
          toggleActions: "play none none none",
        },
        defaults: { ease: "power3.out" },
      });
      tl.to([badge, title, intro, desc], {
        opacity: 1,
        y: 0,
        duration: 0.55,
        stagger: 0.08,
      })
        .to(bullets, { opacity: 1, y: 0, duration: 0.5 }, "-=0.2")
        .to(
          bulletEls,
          { opacity: 1, x: 0, duration: 0.45, stagger: 0.06 },
          "-=0.35",
        )
        .to(contact, { opacity: 1, y: 0, duration: 0.5 }, "-=0.2");
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-12 sm:py-20"
      style={{
        backgroundColor: "#F4F1EA",
        backgroundImage: `repeating-linear-gradient(
          45deg,
          transparent,
          transparent 12px,
          rgba(0,38,255,0.04) 12px,
          rgba(0,38,255,0.04) 13px
        )`,
      }}
    >
      <div
        ref={fadeRef}
        className="relative mx-auto max-w-5xl px-4 transition-[opacity,transform] duration-700 ease-out sm:px-6"
        style={{
          opacity: fadeIn ? 1 : 0,
          transform: fadeIn ? "translateY(0)" : "translateY(24px)",
        }}
      >
        <div className="text-center">
          <span
            ref={badgeRef}
            className="mb-4 inline-block rounded-full border border-brand-dark/20 bg-white/80 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-dark/80 sm:mb-5 sm:text-xs"
          >
            {t.home.volume.badge}
          </span>
          <h2
            ref={titleRef}
            className="mb-3 font-(family-name:--font-playfair) text-2xl font-light text-brand-dark sm:mb-4 sm:text-3xl md:text-4xl"
          >
            {t.home.volume.title}
          </h2>
          <p
            ref={introRef}
            className="mb-2 text-base font-medium text-foreground sm:text-lg"
          >
            {t.home.volume.intro}
          </p>
          <p
            ref={descRef}
            className="mx-auto max-w-xl text-sm leading-relaxed text-foreground/80 sm:text-base"
          >
            {t.home.volume.description}
          </p>
        </div>

        <div
          ref={bulletsRef}
          className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-3 sm:mt-12 sm:gap-4"
        >
          {t.home.volume.bullets.map((label: string, i: number) => (
            <span
              key={i}
              ref={(el) => {
                bulletRefs.current[i] = el;
              }}
              className="inline-flex rounded-full bg-brand-primary/10 px-4 py-2 text-sm font-medium text-brand-primary sm:px-5 sm:py-2.5 sm:text-base"
            >
              {label}
            </span>
          ))}
        </div>

        <div
          ref={contactRef}
          className="mt-10 flex flex-col items-center gap-6 sm:mt-12"
        >
          <Link
            href={locale === "fr" ? "/contact" : "/en/contact"}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-primary px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:opacity-95 hover:shadow-xl sm:px-10 sm:py-4 sm:text-lg"
          >
            {t.home.volume.ctaButton}
            <ArrowRight className="h-5 w-5" />
          </Link>

          <div className="w-full border-t border-black/10 pt-8 sm:pt-10">
            <p className="text-center text-sm font-medium text-foreground/70 sm:text-base">
              {t.home.volume.statLine}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-foreground/50">
              {t.home.volume.contactLabel}
            </span>
            <a
              href={`tel:${t.home.volume.phone.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-2 text-base font-medium text-foreground transition-colors hover:text-brand-primary sm:text-lg"
            >
              <Phone className="h-5 w-5 shrink-0" />
              {t.home.volume.phone}
            </a>
            <a
              href={`mailto:${t.home.volume.email}`}
              className="inline-flex items-center gap-2 text-base font-medium text-foreground transition-colors hover:text-brand-primary sm:text-lg"
            >
              <Mail className="h-5 w-5 shrink-0" />
              {t.home.volume.email}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FaqRapideSection() {
  const { t } = useI18n();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [fadeRef, fadeIn] = useFadeInSection();
  const items = t.home.faqRapide.items;

  return (
    <section
      id="faq"
      className="scroll-mt-24 border-t border-black/8 bg-white py-12 sm:py-20"
    >
      <div
        ref={fadeRef}
        className="mx-auto max-w-2xl px-4 transition-[opacity,transform] duration-700 ease-out sm:px-6"
        style={{
          opacity: fadeIn ? 1 : 0,
          transform: fadeIn ? "translateY(0)" : "translateY(24px)",
        }}
      >
        <h2 className="mb-10 font-(family-name:--font-playfair) text-2xl font-light text-brand-dark sm:mb-12 sm:text-3xl">
          {t.home.faqRapide.title}
        </h2>
        <ul className="flex flex-col gap-0">
          {items.map(
            (item: { question: string; answer: string }, i: number) => {
              const isOpen = openIndex === i;
              const isLast = i === items.length - 1;
              return (
                <li
                  key={i}
                  className={`rounded-xl border border-black/10 transition-all duration-200 sm:rounded-2xl ${
                    isLast ? "border-b-0" : "border-b border-black/15"
                  } ${isOpen ? "border-brand-primary/40 bg-brand-primary/5 shadow-[0_4px_20px_-4px_rgba(0,38,255,0.12)]" : "bg-white hover:border-black/15 hover:bg-black/[0.02]"} ${!isLast ? "mb-3 sm:mb-4" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 rounded-xl px-4 py-5 text-left transition-colors hover:bg-transparent sm:rounded-2xl sm:px-5 sm:py-6"
                    aria-expanded={isOpen}
                    aria-controls={`faq-rapide-answer-${i}`}
                    id={`faq-rapide-question-${i}`}
                  >
                    <span
                      className={`pr-4 text-base font-semibold transition-colors sm:text-lg ${
                        isOpen ? "text-brand-primary" : "text-foreground"
                      }`}
                    >
                      {item.question}
                    </span>
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                        isOpen
                          ? "bg-brand-primary text-white"
                          : "bg-black/5 text-foreground/60"
                      }`}
                    >
                      <ChevronDown
                        className={`h-5 w-5 transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        aria-hidden
                      />
                    </span>
                  </button>
                  <div
                    id={`faq-rapide-answer-${i}`}
                    role="region"
                    aria-labelledby={`faq-rapide-question-${i}`}
                    className="grid transition-[grid-template-rows] duration-300 ease-out"
                    style={{
                      gridTemplateRows: isOpen ? "1fr" : "0fr",
                    }}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-black/8 px-4 pb-5 pt-1 sm:px-5 sm:pb-6 sm:pt-2">
                        <p
                          className={`text-sm leading-relaxed text-foreground/85 transition-opacity duration-200 sm:text-base ${
                            isOpen ? "opacity-100" : "opacity-0"
                          }`}
                        >
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            },
          )}
        </ul>
      </div>
    </section>
  );
}

export function MobileStickyCta() {
  const { t, locale } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const rachatPath = locale === "fr" ? "/" : `/${locale}`;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div
        className="translate-y-full bg-white px-4 pb-4 pt-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-transform duration-500 ease-out"
        style={{
          transform: visible ? "translateY(0)" : "translateY(100%)",
        }}
      >
        <Link
          href={rachatPath}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-primary py-4 text-base font-semibold text-white shadow-lg transition-opacity hover:opacity-95"
        >
          {t.home.mobileCta}
          <ArrowRight className="h-5 w-5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

export function Footer() {
  const { t, locale } = useI18n();

  const getLocalizedPath = (path: string) => {
    if (locale === "fr") return path;
    return `/${locale}${path}`;
  };

  const rachatPath = locale === "fr" ? "/" : `/${locale}`;
  const contactPath = locale === "fr" ? "/contact" : `/${locale}/contact`;
  const aProposPath = locale === "fr" ? "/a-propos" : `/${locale}/a-propos`;
  const businessServicePath = getLocalizedPath("/service-aux-entreprises");
  const processusPath = `${getLocalizedPath("/")}#processus`;
  const faqPath = `${getLocalizedPath("/")}#faq`;

  return (
    <footer className="border-t-[3px] border-brand-primary bg-[#F2F2F2]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {/* Column 1: Nom + tagline + social */}
          <div className="flex flex-col gap-4">
            <Link
              href={getLocalizedPath("/")}
              className="w-fit shrink-0 font-(family-name:--font-playfair) text-2xl font-semibold tracking-tight text-brand-dark"
            >
              AcheteTonCell
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-black/80">
              {t.footer.tagline}
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/achetetoncell"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/10 text-black transition-colors hover:bg-black/20"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/achetetoncell"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/10 text-black transition-colors hover:bg-black/20"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Column 2: Links */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-black/60">
              {t.footer.usefulLinks}
            </span>
            <nav className="flex flex-col gap-2" aria-label="Footer navigation">
              <Link
                href={rachatPath}
                className="w-fit text-sm font-medium text-black transition-colors hover:text-black/70"
              >
                {t.footer.links.rachat}
              </Link>
              <Link
                href={processusPath}
                className="w-fit text-sm font-medium text-black transition-colors hover:text-black/70"
              >
                {t.footer.links.processus}
              </Link>
              <Link
                href={faqPath}
                className="w-fit text-sm font-medium text-black transition-colors hover:text-black/70"
              >
                {t.footer.links.faq}
              </Link>
              <Link
                href={aProposPath}
                className="w-fit text-sm font-medium text-black transition-colors hover:text-black/70"
              >
                {t.footer.links.aPropos}
              </Link>
              <Link
                href={contactPath}
                className="w-fit text-sm font-medium text-black transition-colors hover:text-black/70"
              >
                {t.footer.links.contact}
              </Link>
            </nav>
          </div>

          {/* Column 3: Phone + Email + CTA */}
          <div className="flex flex-col gap-4">
            <a
              href={`tel:${t.footer.phone.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-black transition-colors hover:text-black/70"
            >
              <Phone className="h-4 w-4 shrink-0" aria-hidden />
              {t.footer.phone}
            </a>
            <Link
              href={rachatPath}
              className="mt-2 inline-flex w-fit items-center justify-center gap-2 rounded-full bg-brand-dark px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t.footer.ctaButton}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href={businessServicePath}
              className="inline-flex items-center gap-2 text-sm font-medium text-black transition-colors hover:text-black/70"
            >
              <Mail className="h-4 w-4 shrink-0" aria-hidden />
              {t.footer.businessService}
            </Link>
            <a
              href={`mailto:${t.footer.email}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-black transition-colors hover:text-black/70"
            >
              <Mail className="h-4 w-4 shrink-0" aria-hidden />
              {t.footer.email}
            </a>
          </div>
        </div>

        {/* Legal row */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-black/10 pt-6 text-[11px] text-black/60 sm:mt-12 sm:gap-x-4">
          <span>{t.footer.copyright}</span>
          <span aria-hidden>·</span>
          <Link href={rachatPath} className="hover:text-black/80">
            {t.footer.tradeInRequest}
          </Link>
        </div>
      </div>
    </footer>
  );
}
