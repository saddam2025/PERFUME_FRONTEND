import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import api from "../api/axios";
import { mapApiProductToUiProduct } from "../lib/productHelpers";
import ProductCard from "../components/product/ProductCard";
import logo from "../assets/logo.png";

const SPLASH_MIN_MS = 3000;
const SPLASH_MAX_MS = 3500;
const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

export default function Home() {
  const { t, isRTL, locale } = useLanguage();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [slides, setSlides] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [splashVisible, setSplashVisible] = useState(() => document.documentElement.classList.contains("splash-active"));
  const [splashLeaving, setSplashLeaving] = useState(false);
  const splashStartedAtRef = useRef(null);

  useEffect(() => {
    if (!splashVisible) return undefined;
    const html = document.documentElement;
    if (splashStartedAtRef.current === null) splashStartedAtRef.current = performance.now();
    const startedAt = splashStartedAtRef.current;
    const fade = parseFloat(getComputedStyle(html).getPropertyValue("--motion-splash-fade")) || 280;
    const latestHideAt = startedAt + Math.max(SPLASH_MIN_MS, SPLASH_MAX_MS - fade);
    let hideTimer;
    let leaving = false;

    const dismiss = () => {
      if (leaving) return;
      leaving = true;
      setSplashLeaving(true);
    };
    let pageReadyAt = document.readyState === "complete" ? startedAt : null;
    const scheduleHide = () => {
      const elapsed = performance.now() - startedAt;
      const targetElapsed = pageReadyAt === null
        ? latestHideAt - startedAt
        : Math.min(Math.max(SPLASH_MIN_MS, pageReadyAt - startedAt), latestHideAt - startedAt);
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(dismiss, Math.max(0, targetElapsed - elapsed));
    };
    const onReady = () => {
      pageReadyAt = performance.now();
      scheduleHide();
    };

    scheduleHide();
    if (pageReadyAt === null) window.addEventListener("load", onReady, { once: true });

    return () => {
      window.clearTimeout(hideTimer);
      window.removeEventListener("load", onReady);
    };
  }, [splashVisible]);

  const finishSplash = (event) => {
    if (event.target !== event.currentTarget || event.propertyName !== "opacity") return;
    setSplashVisible(false);
    document.documentElement.classList.remove("splash-active");
    try {
      sessionStorage.setItem("deja-splash-seen", "true");
    } catch {
      // Storage can be unavailable; keep the splash behavior graceful.
    }
    document.dispatchEvent(new Event("deja:splash-ended"));
  };

  // One unique representative product per category, fetched live.
  useEffect(() => {
    let cancelled = false;

    async function fetchFeatured() {
      try {
        const { data } = await api.get("/products", { params: { limit: 500 } });
        const products = data?.data?.products || [];
        const mapped = products.map(mapApiProductToUiProduct).filter(Boolean);
        const results = mapped.slice(0, 4);
        const arrivals = products.filter((product) => product.isLatestArrival).slice(0, 4).map(mapApiProductToUiProduct);
        if (!cancelled) {
          setCatalogProducts(mapped);
          setSlides(mapped.filter((p) => p.imageUrls?.[0]).slice(0, 5));
          setFeatured(results.filter(Boolean));
          setNewArrivals(arrivals.filter(Boolean));
        }
      } catch {
        if (!cancelled) {
          setFeatured([]);
          setNewArrivals([]);
        }
      }
    }

    fetchFeatured();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const timer = window.setInterval(() => setActiveSlide((i) => (i + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => { if (activeSlide >= slides.length) setActiveSlide(0); }, [activeSlide, slides.length]);

  return (
    <>
      {splashVisible && <div className={`site-splash${splashLeaving ? " is-leaving" : ""}`} onTransitionEnd={finishSplash} aria-hidden="true">
        <div className="site-splash-content">
          <img src={logo} alt="" className="site-splash-logo" />
          <span className="site-splash-loader" />
        </div>
      </div>}
      <section className="relative isolate min-h-[460px] overflow-hidden bg-[#171615] text-white sm:min-h-[540px]" data-motion-hero aria-roledescription="carousel" aria-label={locale === "ar" ? "عطور مميزة" : "Featured fragrances"}>
        {slides.length ? slides.map((product, index) => <div key={product.id} className={"absolute inset-0 transition-opacity duration-700 " + (index === activeSlide ? "opacity-100" : "pointer-events-none opacity-0")} aria-hidden={index !== activeSlide}>
          <img className="absolute inset-0 h-full w-full object-cover object-center opacity-75" src={API_ORIGIN + product.imageUrls[0]} alt={index === activeSlide ? (locale === "ar" ? product.nameAr || product.nameEn : product.nameEn) : ""} fetchPriority={index === 0 ? "high" : "auto"} />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/5" />
          <div className="relative mx-auto flex min-h-[460px] max-w-7xl flex-col justify-center px-6 pb-20 pt-14 sm:min-h-[540px] sm:px-10 lg:px-14" dir={isRTL ? "rtl" : "ltr"}>
            <p className="label-tracked text-[#d2bd98]">{t("hero.eyebrow")}</p><h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight sm:text-6xl">{locale === "ar" ? product.nameAr || product.nameEn : product.nameEn}</h1>
            <p className="mt-4 max-w-lg line-clamp-3 text-sm leading-7 text-white/75 sm:text-base">{locale === "ar" ? product.descriptionAr || product.descriptionEn : product.descriptionEn}</p>
            <div className="mt-7 flex flex-wrap items-center gap-5"><Link to={"/product/" + product.id} className="inline-flex min-h-12 items-center gap-3 bg-white px-6 text-sm font-semibold text-ink">{t("hero.cta")} <ArrowIcon size={16} /></Link><Link to="/shop" className="text-sm font-semibold text-white underline underline-offset-4">{t("hero.secondaryCta")}</Link></div>
          </div>
        </div>) : <div className="mx-auto flex min-h-[460px] max-w-7xl flex-col justify-center px-6 sm:min-h-[540px]" dir={isRTL ? "rtl" : "ltr"}><p className="label-tracked text-[#d2bd98]">{t("hero.eyebrow")}</p><h1 className="mt-4 max-w-xl text-4xl font-semibold sm:text-6xl">{t("hero.subtitle")}</h1><p className="mt-4 max-w-lg text-sm leading-7 text-white/70">{t("hero.body")}</p><Link to="/shop" className="mt-7 inline-flex min-h-12 w-fit items-center gap-3 bg-white px-6 text-sm font-semibold text-ink">{t("hero.cta")} <ArrowIcon size={16} /></Link></div>}
        {slides.length > 1 && <div className="absolute inset-x-0 bottom-5 z-10 flex items-center justify-center gap-4" dir="ltr"><button type="button" onClick={() => setActiveSlide((activeSlide - 1 + slides.length) % slides.length)} aria-label="Previous slide"><ChevronLeft size={20} /></button><div className="flex gap-2">{slides.map((slide, index) => <button key={slide.id} type="button" onClick={() => setActiveSlide(index)} aria-label={"Slide " + (index + 1)} aria-current={index === activeSlide ? "true" : undefined} className={"h-1 w-8 " + (index === activeSlide ? "bg-white" : "bg-white/40")} />)}</div><button type="button" onClick={() => setActiveSlide((activeSlide + 1) % slides.length)} aria-label="Next slide"><ChevronRight size={20} /></button></div>}
        <Link to="/affiliate/join" className="absolute bottom-5 end-5 z-10 hidden items-center gap-2 text-xs font-medium text-white/80 hover:text-white sm:flex"><Users size={15} />{t("hero.affiliateCta")}</Link>
      </section>

      {/* Best Sellers */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex flex-col gap-2 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="label-tracked text-accent-deep">{t("featured.eyebrow")}</p>
            <h2 className="font-display mt-2 text-3xl font-extrabold tracking-tightest sm:text-4xl">
              {t("featured.title")}
            </h2>
            <p className="mt-2 max-w-md text-sm text-slate">{t("featured.body")}</p>
          </div>
          <Link
            to="/shop"
            className="flex shrink-0 items-center gap-1.5 self-start text-sm font-semibold text-ink hover:opacity-70 sm:self-end"
          >
            {t("featured.viewAll")}
            <ArrowIcon size={15} strokeWidth={2} />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:gap-x-8" data-motion-stagger>
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-extrabold tracking-tightest">{t("home.shopByGender")}</h2>
        <div className="mt-5 flex flex-wrap gap-3">{[["men", "footer.tshirts"], ["women", "footer.jackets"], ["unisex", "footer.hoodies"]].map(([gender, label]) => <Link key={gender} to={`/shop?gender=${gender}`} data-motion-interactive className="border border-line px-5 py-3 text-sm font-semibold hover:border-ink">{t(label)}</Link>)}</div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"><h2 className="font-display text-2xl font-extrabold tracking-tightest">{t("home.shopByFamily")}</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">{["woody","oriental","floral","fresh","citrus","gourmand","musky","aromatic"].map((family) => { const product = catalogProducts.find((p) => p.fragranceFamily?.some((f) => f.toLowerCase() === family) && p.imageUrls?.[0]); return <Link key={family} to={"/shop?family=" + family} className="group relative flex aspect-[4/5] items-end overflow-hidden bg-paper-dim">{product && <img src={API_ORIGIN + product.imageUrls[0]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}<span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" /><span className="relative z-10 flex w-full items-center justify-between p-3 text-sm font-semibold text-white">{t("home." + family)} <ArrowIcon size={15} /></span></Link>; })}</div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex items-end justify-between border-b border-line pb-6"><h2 className="font-display text-3xl font-extrabold tracking-tightest">{t("home.newArrivals")}</h2><Link to="/shop?sort=newest" className="text-sm font-semibold">{t("featured.viewAll")}</Link></div>
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:gap-x-8" data-motion-stagger>{newArrivals.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>
    </>
  );
}
