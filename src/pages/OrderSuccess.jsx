import { useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Check, ArrowRight, ArrowLeft, Package } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { formatPrice } from "../lib/formatPrice";

function generateOrderNumber() {
  const random = Math.floor(10000 + Math.random() * 89999);
  return `ORD-${random}`;
}

export default function OrderSuccess() {
  const { t, locale, isRTL } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  // Order total is passed via navigation state from the Cart page at checkout time.
  // If someone lands here directly with no state, we still show a clean confirmation
  // rather than crash — just without a known total.
  const orderTotal = location.state?.total ?? null;
  const orderNumber = useMemo(() => location.state?.orderNumber || generateOrderNumber(), [location.state]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const steps = t("orderSuccess.steps");

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink">
          <Check size={28} strokeWidth={2.5} className="text-paper" />
        </div>

        <p className="label-tracked mt-6 text-accent-deep">{t("orderSuccess.eyebrow")}</p>
        <h1 className="font-display mt-3 text-3xl font-extrabold tracking-tightest sm:text-4xl">
          {t("orderSuccess.title")}
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-slate">{t("orderSuccess.body")}</p>
      </div>

      {/* Order info card */}
      <div className="mt-10 border border-line">
        <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-5 py-5 text-center">
            <p className="label-tracked text-slate">{t("orderSuccess.orderNumber")}</p>
            <p className="mt-2 text-base font-semibold text-ink">{orderNumber}</p>
          </div>
          <div className="px-5 py-5 text-center">
            <p className="label-tracked text-slate">{t("orderSuccess.orderTotal")}</p>
            <p className="mt-2 text-base font-semibold text-ink">
              {orderTotal !== null ? formatPrice(orderTotal, locale, t("common.currency")) : "—"}
            </p>
          </div>
          <div className="px-5 py-5 text-center">
            <p className="label-tracked text-slate">{t("orderSuccess.estimatedDelivery")}</p>
            <p className="mt-2 text-base font-semibold text-ink">
              {t("orderSuccess.estimatedDeliveryValue")}
            </p>
          </div>
        </div>
      </div>

      {location.state?.appliedPromotions?.length > 0 && <section className="mt-5 border border-accent/40 bg-accent/10 p-4"><h2 className="text-sm font-bold text-ink">{locale === "ar" ? "العروض المطبقة" : "Applied offers"}</h2><ul className="mt-2 space-y-2 text-sm">{location.state.appliedPromotions.map((promotion, index) => <li key={`${promotion.promotionId || promotion.name}-${index}`}><span className="font-semibold">{promotion.name}</span> · {promotion.ruleDescription}<span className="ms-2 text-accent-deep">−{formatPrice(promotion.discountAmount || 0, locale, t("common.currency"))}</span>{promotion.freeItems?.length > 0 && <span className="block text-xs text-slate">{locale === "ar" ? "القطع المجانية" : "Free items"}: {promotion.freeItems.map((item) => `${item.quantity}× ${item.name} ${item.size || ""} ${item.color || ""}`).join(" · ")}</span>}</li>)}</ul></section>}

      {/* What happens next */}
      <div className="mt-10">
        <h2 className="label-tracked text-ink">{t("orderSuccess.whatNext")}</h2>
        <ol className="mt-4 flex flex-col gap-4">
          {steps.map((step, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-line text-xs font-semibold text-ink">
                {idx + 1}
              </span>
              <span className="pt-1 text-sm text-slate">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/shop"
          className="flex flex-1 items-center justify-center gap-2 bg-ink py-3.5 text-sm font-semibold uppercase tracking-wide text-paper transition-opacity hover:opacity-85"
        >
          {t("orderSuccess.continueShopping")}
          <ArrowIcon size={15} strokeWidth={2} />
        </Link>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex flex-1 items-center justify-center gap-2 border border-line py-3.5 text-sm font-semibold text-ink transition-colors hover:border-ink"
        >
          <Package size={16} strokeWidth={1.75} />
          {t("orderSuccess.viewOrders")}
        </button>
      </div>
    </div>
  );
}
