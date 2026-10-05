// ProductDetails.jsx — FIXED
// Fix: Bug 4 — same broken URL construction as ProductCard. When VITE_API_BASE_URL is
//   undefined, `?.replace(...)` returns undefined, and `undefined + "/uploads/..."` yields
//   the string "undefined/uploads/..." (truthy), so no fallback fires.
//   Fix: resolve BASE_URL once with a safe empty-string fallback.
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Check, Minus, Plus, Ruler, X, Image as ImageIcon } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useCart } from "../context/CartContext";
import api from "../api/axios";
import { mapApiProductToUiProduct, getStockForSize, getTotalStock, getPromotionHint } from "../lib/productHelpers";
import { formatPrice } from "../lib/formatPrice";
import { cn } from "../lib/cn";

// FIX Bug 4: safe BASE_URL — never yields "undefined/...".
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace('/api', '');

function SizeGuideModal({ imageUrl, onClose, title, noImageLabel, closeLabel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto bg-paper p-5 sm:p-6">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <h2 className="font-display text-lg font-bold tracking-tightest">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="flex h-8 w-8 items-center justify-center text-slate hover:text-ink"
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        <div className="mt-5">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="w-full border border-line" />
          ) : (
            <p className="py-10 text-center text-sm text-slate">{noImageLabel}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, locale, isRTL } = useLanguage();
  const { addItem } = useCart();
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [sizeError, setSizeError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchProduct() {
      setLoading(true);
      setNotFound(false);
      try {
        const { data } = await api.get(`/products/${id}`);
        const rawMatch = data?.data?.product;

        if (!rawMatch) {
          if (!cancelled) setNotFound(true);
          return;
        }

        const mapped = mapApiProductToUiProduct(rawMatch);
        if (!cancelled) {
          setProduct(mapped);
          setSelectedColor(mapped.colors?.[0] ?? null);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProduct();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <p className="text-sm text-slate">{t("shop.loading")}</p>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <p className="text-sm text-slate">
          {locale === "ar" ? "هذا المنتج غير موجود." : "This product could not be found."}
        </p>
        <Link to="/shop" className="mt-4 inline-block border-b border-ink pb-0.5 text-sm font-semibold text-ink">
          {t("pdp.backToShop")}
        </Link>
      </div>
    );
  }

  const name = locale === "ar" ? (product.nameAr || product.nameKey) : (product.nameEn || product.nameKey);
  const description = locale === "ar" ? (product.descriptionAr || product.descriptionKey) : (product.descriptionEn || product.descriptionKey);
  const onSale = Boolean(product.compareAtPrice);
  const totalStock = getTotalStock(product);
  const isLowStockOverall = totalStock > 0 && totalStock <= 10;
  const stockForSelectedSize = selectedSize ? getStockForSize(product, selectedSize, selectedColor?.nameEn) : null;
  const detailsList = t("pdp.detailsList") || [];
  const nextPromotionTier = (product.promotions || []).flatMap((promotion) =>
    (promotion.tiers || []).map((tier) => ({ promotion, tier }))
  ).filter(({ tier }) => Number(tier.minQty) > quantity).sort((a, b) => a.tier.minQty - b.tier.minQty)[0];

  // Maps a free-text color name (as typed in the Manager Dashboard's
// comma-separated colors field) to an actual swatch color. Falls back to
// a neutral mid-gray for any name not in this list, rather than silently
// rendering nothing or crashing.
const COLOR_SWATCH_MAP = {
  black: "#111111",
  white: "#ffffff",
  stone: "#a8a29e",
  beige: "#e8dcc8",
  navy: "#1f2a44",
  blue: "#2563eb",
  grey: "#9ca3af",
  gray: "#9ca3af",
  olive: "#6b7a3a",
  green: "#16a34a",
  brown: "#6b4a34",
  tan: "#d2b48c",
  red: "#dc2626",
  burgundy: "#7f1d1d",
  charcoal: "#36454f",
  cream: "#f5f0e6",
  khaki: "#bdb76b",
  pink: "#ec4899",
  yellow: "#eab308",
  orange: "#ea580c",
  purple: "#7c3aed",
};

function getSwatchColor(colorName) {
  return COLOR_SWATCH_MAP[colorName] || "#9ca3af";
}
  // FIX Bug 4: use BASE_URL constant so we never get "undefined/uploads/...".
  const galleryImages = product.imageUrls && product.imageUrls.length > 0
    ? product.imageUrls.map(url => BASE_URL + url)
    : [];

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    addItem(product, selectedSize, selectedColor, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    setSizeError(false);
    setQuantity(1);
  };

  const maxQty = stockForSelectedSize ?? 99;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-1.5 text-sm font-medium text-slate hover:text-ink"
      >
        <BackIcon size={15} strokeWidth={2} />
        {t("pdp.backToShop")}
      </button>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col gap-3">
          <div className="aspect-[3/4] w-full border border-line bg-paper flex items-center justify-center overflow-hidden">
            {galleryImages.length > 0 ? (
              <img src={galleryImages[activeImage]} alt={name} className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="text-line w-20 h-20" />
            )}
          </div>
          {galleryImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  className={cn(
                    "relative aspect-square w-24 shrink-0 overflow-hidden border transition-colors",
                    activeImage === idx ? "border-ink" : "border-transparent hover:border-slate"
                  )}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img src={img} alt={`${name} thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            {product.isNew && (
              <span className="label-tracked bg-ink px-2 py-1 text-paper">{t("product.new")}</span>
            )}
            {onSale && (
              <span className="label-tracked bg-accent px-2 py-1 text-ink">{t("product.sale")}</span>
            )}
          </div>

          <h1 className="font-display mt-3 text-2xl font-extrabold tracking-tightest sm:text-3xl">
            {name}
          </h1>

          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-xl font-semibold text-ink">
              {formatPrice(product.price, locale, t("common.currency"))}
            </span>
            {onSale && (
              <span className="text-sm text-slate-light line-through">
                {formatPrice(product.compareAtPrice, locale, t("common.currency"))}
              </span>
            )}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-slate">{description}</p>

          {product.promotions?.length > 0 && (
            <div className="mt-6 border border-accent/40 bg-accent/10 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-ink">
                {locale === "ar" ? "العروض المتاحة" : "Available offers"}
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-ink">
                {product.promotions.map((promotion) => <li key={promotion._id}>• {getPromotionHint(promotion, locale)}</li>)}
              </ul>
              {nextPromotionTier && (
                <p className="mt-2 text-xs font-medium text-accent-deep">
                  {locale === "ar"
                    ? `أضف ${nextPromotionTier.tier.minQty - quantity} للوصول للعرض التالي`
                    : `Add ${nextPromotionTier.tier.minQty - quantity} more to reach the next offer`}
                </p>
              )}
            </div>
          )}

          {product.colors?.length > 0 && (
  <div className="mt-7 border-t border-line pt-6">
    <div className="flex items-center justify-between">
      <h3 className="label-tracked text-ink">{t("pdp.color")}</h3>
      <span className="text-xs text-slate">
        {locale === "ar" ? selectedColor?.nameAr : selectedColor?.nameEn}
      </span>
    </div>
    <div className="mt-3 flex flex-wrap gap-2.5">
      {product.colors.map((color) => (
        <button
          key={color.id}
          type="button"
          onClick={() => setSelectedColor(color)}
          aria-pressed={selectedColor?.id === color.id}
          aria-label={locale === "ar" ? color.nameAr : color.nameEn}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors",
            selectedColor?.id === color.id ? "border-ink" : "border-transparent hover:border-line"
          )}
        >
          <span
            className="h-7 w-7 rounded-full border border-line/60"
            style={{ backgroundColor: color.swatch }}
          />
        </button>
      ))}
    </div>
  </div>
)}
          {product.sizes?.length > 0 && (
            <div className="mt-7 border-t border-line pt-6">
              <div className="flex items-center justify-between">
                <h3 className="label-tracked text-ink">{t("pdp.size")}</h3>
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-ink underline-offset-2 hover:underline"
                >
                  <Ruler size={14} strokeWidth={1.75} />
                  {t("pdp.sizeGuide")} 📏
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {product.sizes.map((size) => {
                  const stock = getStockForSize(product, size, selectedColor?.nameEn);
                  const disabled = stock <= 0;
                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleSizeSelect(size)}
                      aria-pressed={selectedSize === size}
                      className={cn(
                        "flex h-11 min-w-11 items-center justify-center border px-3 text-sm font-medium transition-colors",
                        disabled
                          ? "cursor-not-allowed border-line text-slate-light line-through"
                          : selectedSize === size
                          ? "border-ink bg-ink text-paper"
                          : "border-line text-ink hover:border-ink"
                      )}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>

              {sizeError && (
                <p className="mt-2 text-xs font-medium text-red-700">{t("pdp.selectSize")}</p>
              )}

              {selectedSize && stockForSelectedSize > 0 && (
                <p
                  className={cn(
                    "mt-2 text-xs font-medium",
                    stockForSelectedSize <= 3 ? "text-accent-deep" : "text-slate"
                  )}
                >
                  {stockForSelectedSize <= 5
                    ? t("pdp.onlyXLeft", { count: stockForSelectedSize })
                    : t("pdp.inStock")}
                </p>
              )}
              {!selectedSize && isLowStockOverall && (
                <p className="mt-2 text-xs font-medium text-accent-deep">{t("product.lowStock")}</p>
              )}
            </div>
          )}

          <div className="mt-7 flex items-stretch gap-3">
            <div className="flex items-center border border-line">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-12 w-11 items-center justify-center text-ink hover:bg-paper-dim"
                aria-label="Decrease quantity"
              >
                <Minus size={15} strokeWidth={2} />
              </button>
              <span className="flex h-12 w-10 items-center justify-center text-sm font-semibold">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                disabled={quantity >= maxQty}
                className="flex h-12 w-11 items-center justify-center text-ink hover:bg-paper-dim disabled:cursor-not-allowed disabled:text-slate-light disabled:hover:bg-transparent"
                aria-label="Increase quantity"
              >
                <Plus size={15} strokeWidth={2} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={stockForSelectedSize === 0 && selectedSize !== null}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wide transition-colors",
                justAdded
                  ? "bg-accent-deep text-paper"
                  : "bg-ink text-paper hover:bg-ink/85",
                "disabled:cursor-not-allowed disabled:bg-line disabled:text-slate-light"
              )}
            >
              {justAdded ? (
                <>
                  <Check size={16} strokeWidth={2.5} />
                  {t("product.addedToCart")}
                </>
              ) : (
                t("product.addToCart")
              )}
            </button>
          </div>

          <p className="mt-4 text-xs text-slate">
            {t("pdp.shipping", { amount: formatPrice(3000, locale, t("common.currency")) })}
          </p>

          <div className="mt-8 border-t border-line pt-6">
            <h3 className="label-tracked text-ink">{t("pdp.details")}</h3>
            <ul className="mt-3 flex flex-col gap-2">
              {Array.isArray(detailsList) && detailsList.map((line, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-light" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {sizeGuideOpen && (
        <SizeGuideModal
          imageUrl={product.sizeGuideImageUrl}
          onClose={() => setSizeGuideOpen(false)}
          title={t("pdp.sizeGuideModalTitle")}
          noImageLabel={t("pdp.noSizeGuide")}
          closeLabel={t("common.close")}
        />
      )}
    </div>
  );
}
