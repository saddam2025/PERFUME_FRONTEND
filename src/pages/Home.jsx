import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import api from "../api/axios";
import { mapApiProductToUiProduct, categories, CATEGORY_TO_PRODUCT_TYPE } from "../lib/productHelpers";
import ProductCard from "../components/product/ProductCard";

export default function Home() {
  const { t, isRTL } = useLanguage();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const [featured, setFeatured] = useState([]);

  // One representative product per category (t-shirt / jacket / hoodie),
  // fetched live instead of read from the old mock catalog.
  useEffect(() => {
    let cancelled = false;

    async function fetchFeatured() {
      try {
        const results = await Promise.all(
          categories.map(async (cat) => {
            const productType = CATEGORY_TO_PRODUCT_TYPE[cat];
            const { data } = await api.get("/products", { params: { category: productType, limit: 1 } });
            const first = data?.data?.products?.[0];
            return first ? mapApiProductToUiProduct(first) : null;
          })
        );
        if (!cancelled) {
          setFeatured(results.filter(Boolean));
        }
      } catch {
        if (!cancelled) setFeatured([]);
      }
    }

    fetchFeatured();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8 lg:pb-28 lg:pt-24">
          <p className="label-tracked text-accent-deep">{t("hero.eyebrow")}</p>

          <h1 className="font-display mt-4 text-[3.4rem] font-black leading-[0.92] tracking-tightest text-ink sm:text-[5.5rem] lg:text-[8rem]">
            {t("hero.title")}
          </h1>

          <div className="mt-6 max-w-xl border-t border-line pt-6 sm:mt-8">
            <p className="text-lg font-medium text-ink sm:text-xl">{t("hero.subtitle")}</p>
            <p className="mt-3 text-sm leading-relaxed text-slate sm:text-base">{t("hero.body")}</p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4 sm:mt-10">
            <Link
              to="/shop"
              className="flex items-center gap-2 bg-ink px-7 py-3.5 text-sm font-semibold text-paper transition-opacity hover:opacity-85"
            >
              {t("hero.cta")}
              <ArrowIcon size={16} strokeWidth={2} />
            </Link>
            <Link
              to="/shop"
              className="border-b border-ink pb-0.5 text-sm font-semibold text-ink transition-opacity hover:opacity-70"
            >
              {t("hero.secondaryCta")}
            </Link>
          </div>
        </div>

        {/* Decorative swatch strip - stands in for hero imagery, ties to fabric/material identity */}
        <div className="grid grid-cols-3 h-20 sm:h-28">
          <div style={{ backgroundColor: "#E8E4DC" }} />
          <div style={{ backgroundColor: "#2B2B2E" }} />
          <div style={{ backgroundColor: "#B8A88A" }} />
        </div>
      </section>

      {/* Featured Collections */}
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

        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:gap-x-8">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </>
  );
}
