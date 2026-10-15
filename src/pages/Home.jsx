import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Users } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import api from "../api/axios";
import { mapApiProductToUiProduct } from "../lib/productHelpers";
import ProductCard from "../components/product/ProductCard";
import logo from "../assets/logo.png";

const SPLASH_MIN_MS = 3000;
const SPLASH_MAX_MS = 3500;

export default function Home() {
  const { t, isRTL } = useLanguage();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
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
        const results = products.slice(0, 4).map(mapApiProductToUiProduct);
        const arrivals = products.filter((product) => product.isLatestArrival).slice(0, 4).map(mapApiProductToUiProduct);
        if (!cancelled) {
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

  return (
    <>
      {splashVisible && <div className={`site-splash${splashLeaving ? " is-leaving" : ""}`} onTransitionEnd={finishSplash} aria-hidden="true">
        <div className="site-splash-content">
          <img src={logo} alt="" className="site-splash-logo" />
          <span className="site-splash-loader" />
        </div>
      </div>}
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line" data-motion-hero>
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8 lg:pb-28 lg:pt-24">
          <p className="label-tracked text-accent-deep" data-motion-reveal data-motion-stagger-index="0">{t("hero.eyebrow")}</p>

          <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-8" data-motion-reveal data-motion-kind="logo" data-motion-stagger-index="1">
            <h1 className="m-0"><img src={logo} alt="DEJA FRAGRANCES" className="h-14 w-auto max-w-48 object-contain sm:h-16" /></h1>
            <Link to="/affiliate/join" data-motion-interactive className="inline-flex min-h-11 items-center justify-center gap-2 border border-line px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink">
              <Users size={16} strokeWidth={1.75} />
              {t("hero.affiliateCta")}
            </Link>
          </div>

          <div className="mt-6 max-w-xl border-t border-line pt-6 sm:mt-8" data-motion-reveal data-motion-stagger-index="2">
            <p className="text-lg font-medium text-ink sm:text-xl">{t("hero.subtitle")}</p>
            <p className="mt-3 text-sm leading-relaxed text-slate sm:text-base">{t("hero.body")}</p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4 sm:mt-10" data-motion-reveal data-motion-stagger-index="3">
            <Link
              to="/shop"
              data-motion-interactive
              className="flex items-center gap-2 bg-ink px-7 py-3.5 text-sm font-semibold text-paper transition-opacity hover:opacity-85"
            >
              {t("hero.cta")}
              <ArrowIcon size={16} strokeWidth={2} />
            </Link>
            <Link
              to="/shop"
              data-motion-interactive
              className="border-b border-ink pb-0.5 text-sm font-semibold text-ink transition-opacity hover:opacity-70"
            >
              {t("hero.secondaryCta")}
            </Link>
          </div>
        </div>

        {/* Decorative fragrance palette */}
        <div className="grid grid-cols-3 h-20 sm:h-28">
          <div style={{ backgroundColor: "#E8E4DC" }} />
          <div style={{ backgroundColor: "#2B2B2E" }} />
          <div style={{ backgroundColor: "#B8A88A" }} />
        </div>
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

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-extrabold tracking-tightest">{t("home.shopByFamily")}</h2>
        <div className="mt-5 flex flex-wrap gap-3">{[["woody", "home.woody"], ["floral", "home.floral"], ["oriental", "home.oriental"], ["fresh", "home.fresh"], ["citrus", "home.citrus"], ["gourmand", "home.gourmand"], ["musky", "home.musky"], ["aromatic", "home.aromatic"]].map(([family, label]) => <Link key={family} to={`/shop?family=${family}`} data-motion-interactive className="border border-line px-5 py-3 text-sm font-semibold hover:border-ink">{t(label)}</Link>)}</div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex items-end justify-between border-b border-line pb-6"><h2 className="font-display text-3xl font-extrabold tracking-tightest">{t("home.newArrivals")}</h2><Link to="/shop?sort=newest" className="text-sm font-semibold">{t("featured.viewAll")}</Link></div>
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:gap-x-8" data-motion-stagger>{newArrivals.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>
    </>
  );
}
