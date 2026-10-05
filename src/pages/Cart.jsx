// Cart.jsx
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Minus, Plus, X, Tag, ArrowRight, ArrowLeft, ShoppingBag } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../lib/formatPrice";
import { cn } from "../lib/cn";
import { getPromotionHint } from "../lib/productHelpers";

function CartLineItem({ item, showPromotionControls = true }) {
  const { t, locale } = useLanguage();
  const { incrementQty, decrementQty, removeItem, items: cartItems, serverPricing, freeSelectionsByProduct, setFreeSelections } = useCart();
  const { product, size, color, qty } = item;
  const name = locale === "ar" ? product.nameAr : product.nameKey;
  const productId = product._id || product.id;
  const productQuantity = serverPricing?.productTotals?.find((entry) => String(entry.productId) === String(productId))?.quantity
    ?? cartItems.filter((line) => String(line.product._id || line.product.id) === String(productId)).reduce((sum, line) => sum + line.qty, 0);
  const freeCount = getCartFreeCount(product, productQuantity);
  const nextTier = (product.promotions || []).flatMap((promotion) => (promotion.tiers || []).map((tier) => ({ tier, hint: getPromotionHint({ ...promotion, tiers: [tier] }, locale) })))
    .filter(({ tier }) => Number(tier.minQty) > productQuantity).sort((a, b) => a.tier.minQty - b.tier.minQty)[0];
  const selections = freeSelectionsByProduct[productId] || [];
  useEffect(() => {
    if (selections.length > freeCount) setFreeSelections(productId, selections.slice(0, freeCount));
  }, [freeCount, productId, selections, setFreeSelections]);
  const lineTotal = product.price * qty;

  return (
    <div className="flex gap-4 border-b border-line py-5 sm:gap-5">
      <div
        className="h-24 w-20 shrink-0 border border-line sm:h-28 sm:w-24"
        style={{ backgroundColor: color?.swatch || product.swatch }}
      />

      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link to={`/product/${product.id}`} className="text-sm font-medium text-ink hover:text-slate">
              {name}
            </Link>
            <p className="mt-1 text-xs text-slate">
              {t("pdp.size")}: {size}
              {color && <span> · {locale === "ar" ? color.nameAr : color.nameEn}</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={() => removeItem(product.id, size, color?.id)}
            aria-label={t("cart.remove")}
            className="shrink-0 text-slate hover:text-ink"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center border border-line">
            <button
              type="button"
              onClick={() => decrementQty(product.id, size, color?.id)}
              className="flex h-8 w-8 items-center justify-center text-ink hover:bg-paper-dim"
              aria-label="Decrease quantity"
            >
              <Minus size={13} strokeWidth={2} />
            </button>
            <span className="flex h-8 w-8 items-center justify-center text-sm font-semibold">{qty}</span>
            <button
              type="button"
              onClick={() => incrementQty(product.id, size, color?.id)}
              className="flex h-8 w-8 items-center justify-center text-ink hover:bg-paper-dim"
              aria-label="Increase quantity"
            >
              <Plus size={13} strokeWidth={2} />
            </button>
          </div>

          <span className="text-sm font-semibold text-ink">
            {formatPrice(lineTotal, locale, t("common.currency"))}
          </span>
        </div>
        {product.promotions?.length > 0 && (
          <div className="mt-2"><p className="text-xs font-semibold text-accent-deep">{getPromotionHint(product.promotions[0], locale)}</p>{nextTier && <p className="mt-1 text-xs text-slate">{locale === "ar" ? `أضف ${nextTier.tier.minQty - productQuantity} أخرى للوصول إلى ${nextTier.hint}` : `Add ${nextTier.tier.minQty - productQuantity} more to reach ${nextTier.hint}`}</p>}</div>
        )}
        {showPromotionControls && freeCount > 0 && (product.sizes?.length > 0 || product.colors?.length > 0) && (
          <div className="mt-3 border border-accent/40 bg-accent/10 p-3">
            <p className="mb-2 text-xs font-semibold text-ink">
              {locale === "ar" ? `اختر مقاس/لون ${freeCount} قطعة مجانية` : `Choose size/color for ${freeCount} free item(s)`}
            </p>
            <div className="space-y-2">
              {Array.from({ length: freeCount }, (_, index) => {
                const selection = selections[index] || {};
                return (
                  <div key={index} className="flex gap-2">
                    {product.sizes?.length > 0 && <select aria-label={`Free item ${index + 1} size`} value={selection.size || ""} onChange={(event) => { const next = Array.from({ length: freeCount }, (_, i) => selections[i] || { quantity: 1 }); next[index] = { ...next[index], size: event.target.value, quantity: 1 }; setFreeSelections(productId, next); }} className="min-w-0 flex-1 border border-line bg-paper px-2 py-1.5 text-xs"><option value="">{locale === "ar" ? "مقاس القطعة المجانية" : "Free item size"}</option>{product.sizes.map((value) => <option key={value}>{value}</option>)}</select>}
                    {product.colors?.length > 0 && <select aria-label={`Free item ${index + 1} color`} value={selection.color?.id || selection.color || ""} onChange={(event) => { const next = Array.from({ length: freeCount }, (_, i) => selections[i] || { quantity: 1 }); next[index] = { ...next[index], color: event.target.value, quantity: 1 }; setFreeSelections(productId, next); }} className="min-w-0 flex-1 border border-line bg-paper px-2 py-1.5 text-xs"><option value="">{locale === "ar" ? "لون القطعة المجانية" : "Free item color"}</option>{product.colors.map((value) => <option key={value.id} value={value.nameEn}>{locale === "ar" ? value.nameAr : value.nameEn}</option>)}</select>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getCartFreeCount(product, quantity) {
  const candidates = (product.promotions || []).map((promotion) => {
    const tiers = (promotion.tiers || []).slice().sort((a, b) => b.minQty - a.minQty);
    const tier = tiers.find((entry) => entry.minQty <= quantity);
    if (!tier || promotion.type !== "BUY_X_GET_Y_FREE") return { promotion, benefit: 0, free: 0 };
    let remaining = quantity;
    let free = 0;
    while (remaining > 0) {
      const next = tiers.find((entry) => entry.minQty <= remaining);
      if (!next) break;
      const blocks = Math.floor(remaining / next.minQty);
      free += blocks * next.getQty;
      remaining -= blocks * next.minQty;
    }
    return { promotion, benefit: free * product.price, free };
  }).filter((entry) => entry.free > 0);
  const stackable = candidates.filter((entry) => entry.promotion.stackable);
  const best = candidates.filter((entry) => !entry.promotion.stackable).sort((a, b) => b.benefit - a.benefit)[0];
  return [...stackable, ...(best ? [best] : [])].reduce((sum, entry) => sum + entry.free, 0);
}

function OrderSummary() {
  const { t, locale } = useLanguage();
  const {
    subtotal,
    shipping,
    discount,
    total,
    freeShippingThreshold,
    couponInput,
    setCouponInput,
    appliedCoupon,
    couponError,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const remainingForFreeShipping = Math.max(freeShippingThreshold - subtotal, 0);

  const handleCouponSubmit = (e) => {
    e.preventDefault();
    applyCoupon();
  };

  return (
    <div className="border border-line p-5 sm:p-6">
      <h2 className="label-tracked text-ink">{t("cart.orderSummary")}</h2>

      {/* Coupon / Affiliate code */}
      <div className="mt-5 border-b border-line pb-5">
        <label htmlFor="coupon" className="mb-2 block text-xs font-medium text-slate">
          {t("cart.couponLabel")}
        </label>

        {appliedCoupon ? (
          <div className="flex items-center justify-between border border-ink bg-paper-dim px-3 py-2.5">
            <span className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Tag size={14} strokeWidth={2} />
              {appliedCoupon.code}
            </span>
            <button
              type="button"
              onClick={removeCoupon}
              className="text-xs font-medium text-slate underline-offset-2 hover:text-ink hover:underline"
            >
              {t("cart.removeCoupon")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleCouponSubmit} className="flex gap-2">
            <input
              id="coupon"
              type="text"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder={t("cart.couponPlaceholder")}
              className="w-full border border-line bg-paper px-3 py-2.5 text-sm uppercase text-ink placeholder:normal-case placeholder:text-slate-light focus:border-ink"
            />
            <button
              type="submit"
              className="shrink-0 border border-ink bg-ink px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-paper transition-opacity hover:opacity-85"
            >
              {t("cart.apply")}
            </button>
          </form>
        )}

        {couponError === "invalid" && (
          <p className="mt-2 text-xs font-medium text-red-700">{t("cart.couponInvalid")}</p>
        )}
        {couponError === "empty" && (
          <p className="mt-2 text-xs font-medium text-red-700">{t("cart.couponEmpty")}</p>
        )}
        {appliedCoupon && (
          <p className="mt-2 text-xs font-medium text-accent-deep">
            {t("cart.couponApplied", { code: appliedCoupon.code })}
          </p>
        )}
      </div>

      {/* Free shipping progress */}
      <div className="border-b border-line py-5">
        {remainingForFreeShipping > 0 ? (
          <p className="text-xs text-slate">
            {t("cart.freeShippingProgress", {
              amount: formatPrice(remainingForFreeShipping, locale, t("common.currency")),
            })}
          </p>
        ) : (
          <p className="text-xs font-medium text-accent-deep">{t("cart.freeShippingUnlocked")}</p>
        )}
        <div className="mt-2 h-1 w-full bg-paper-dim">
          <div
            className="h-1 bg-accent transition-all"
            style={{ width: `${Math.min((subtotal / freeShippingThreshold) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Totals */}
      <div className="flex flex-col gap-3 py-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate">{t("cart.subtotal")}</span>
          <span className="font-medium text-ink">{formatPrice(subtotal, locale, t("common.currency"))}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate">{t("cart.shipping")}</span>
          <span className="font-medium text-ink">
            {shipping === 0 ? t("cart.free") : formatPrice(shipping, locale, t("common.currency"))}
          </span>
        </div>
        {discount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate">{t("cart.discount")}</span>
            <span className="font-medium text-accent-deep">
              −{formatPrice(discount, locale, t("common.currency"))}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-line pt-5">
        <span className="text-sm font-semibold text-ink">{t("cart.grandTotal")}</span>
        <span className="text-lg font-bold text-ink">{formatPrice(total, locale, t("common.currency"))}</span>
      </div>
    </div>
  );
}

export default function Cart() {
  const { t, isRTL, locale } = useLanguage();
  const { items, itemCount, serverPricing, pricingError } = useCart();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-line">
          <ShoppingBag size={26} strokeWidth={1.5} className="text-slate" />
        </div>
        <h1 className="font-display mt-6 text-2xl font-extrabold tracking-tightest">
          {t("cart.empty")}
        </h1>
        <p className="mt-2 text-sm text-slate">{t("cart.emptyBody")}</p>
        <Link
          to="/shop"
          className="mt-6 flex items-center gap-2 bg-ink px-6 py-3 text-sm font-semibold text-paper transition-opacity hover:opacity-85"
        >
          {t("cart.continueShopping")}
          <ArrowIcon size={15} strokeWidth={2} />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="border-b border-line pb-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tightest sm:text-4xl">
          {t("cart.title")}
        </h1>
        <p className="mt-1 text-sm text-slate">{t("cart.itemsInCart", { count: itemCount })}</p>
      </div>

      <div className="mt-8 flex flex-col gap-10 lg:flex-row lg:gap-10">
        {/* Items */}
        <div className="flex-1">
          <div className="flex flex-col">
            {items.map((item, idx) => (
              <CartLineItem key={idx} item={item} showPromotionControls={items.findIndex((candidate) => String(candidate.product._id || candidate.product.id) === String(item.product._id || item.product.id)) === idx} />
            ))}
          </div>
          {pricingError && <p className="mt-4 border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{pricingError}</p>}
          {(serverPricing?.appliedPromotions || []).map((promotion) => <p key={`${promotion.promotionId}-${promotion.productId}`} className="mt-3 text-sm font-medium text-accent-deep">{promotion.name}: {promotion.ruleDescription} · {formatPrice(promotion.discountAmount, locale, t("common.currency"))}</p>)}
        </div>

        {/* Summary */}
        <div className="w-full shrink-0 lg:w-80">
          <div className="lg:sticky lg:top-24">
            <OrderSummary />
            <Link
              to="/checkout"
              className="mt-4 flex w-full items-center justify-center gap-2 bg-ink py-3.5 text-sm font-semibold uppercase tracking-wide text-paper transition-opacity hover:opacity-85"
            >
              {t("cart.checkout")}
              <ArrowIcon size={15} strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
