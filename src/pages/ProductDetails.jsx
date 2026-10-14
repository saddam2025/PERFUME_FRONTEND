// ProductDetails.jsx — FIXED
// Fix: Bug 4 — same broken URL construction as ProductCard. When VITE_API_BASE_URL is
//   undefined, `?.replace(...)` returns undefined, and `undefined + "/uploads/..."` yields
//   the string "undefined/uploads/..." (truthy), so no fallback fires.
//   Fix: resolve BASE_URL once with a safe empty-string fallback.
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Check, Minus, Plus, Image as ImageIcon } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useCart } from "../context/CartContext";
import api from "../api/axios";
import { mapApiProductToUiProduct, getStockForVolume, getTotalStock, getPromotionHint } from "../lib/productHelpers";
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

  const [selectedVolumeMl, setSelectedVolumeMl] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

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
          setSelectedVolumeMl(mapped.variants?.find((variant) => variant.stock > 0)?.volumeMl ?? mapped.variants?.[0]?.volumeMl ?? null);
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
  const selectedVariant = product.variants?.find((variant) => Number(variant.volumeMl) === Number(selectedVolumeMl));
  const selectedPrice = Number(selectedVariant?.price ?? product.price);
  const onSale = Number(product.compareAtPrice) > selectedPrice;
  const totalStock = getTotalStock(product);
  const isSoldOut = totalStock <= 0;
  const isLowStockOverall = totalStock > 0 && totalStock <= 10;
  const stockForSelectedVolume = selectedVolumeMl ? getStockForVolume(product, selectedVolumeMl) : 0;
  const detailsList = t("pdp.detailsList") || [];
  const nextPromotionTier = (product.promotions || []).flatMap((promotion) =>
    (promotion.tiers || []).map((tier) => ({ promotion, tier }))
  ).filter(({ tier }) => Number(tier.minQty) > quantity).sort((a, b) => a.tier.minQty - b.tier.minQty)[0];

  // FIX Bug 4: use BASE_URL constant so we never get "undefined/uploads/...".
  const galleryImages = product.imageUrls && product.imageUrls.length > 0
    ? product.imageUrls.map(url => BASE_URL + url)
    : [];

  const handleAddToCart = () => {
    if (!selectedVariant || stockForSelectedVolume <= 0) return;
    addItem(product, selectedVolumeMl, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  const maxQty = stockForSelectedVolume || 99;

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
              <img src={galleryImages[activeImage]} alt={name} data-motion-image className="h-full w-full object-cover" />
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
            {isSoldOut && (
              <span className="label-tracked bg-ink px-2 py-1 text-paper">{t("product.soldOut")}</span>
            )}
          </div>

          <h1 className="font-display mt-3 text-2xl font-extrabold tracking-tightest sm:text-3xl">
            {name}
          </h1>

          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-xl font-semibold text-ink">
              {formatPrice(selectedPrice, locale, t("common.currency"))}
            </span>
            {onSale && (
              <span className="text-sm text-slate-light line-through">
                {formatPrice(product.compareAtPrice, locale, t("common.currency"))}
              </span>
            )}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-slate">{description}</p>

          {product.brand && <p className="mt-3 text-sm font-semibold text-slate">{t("pdp.brand")}: {product.brand}</p>}
          {product.concentration && <p className="mt-2 text-sm text-slate">{t("pdp.concentration")}: {product.concentration}</p>}
          {product.fragranceFamily?.length > 0 && <div className="mt-3"><p className="text-xs font-semibold text-slate">{t("pdp.fragranceFamily")}</p><div className="mt-2 flex flex-wrap gap-2">{product.fragranceFamily.map((family) => <span key={family} className="border border-line px-2 py-1 text-xs">{family}</span>)}</div></div>}
          {Object.values(product.notes || {}).some((list) => list?.length) && <section className="mt-6 border-t border-line pt-5"><h2 className="label-tracked text-ink">{t("pdp.fragrancePyramid")}</h2><div className="mt-3 grid gap-3 sm:grid-cols-3">{[["top", "pdp.topNotes"], ["middle", "pdp.middleNotes"], ["base", "pdp.baseNotes"]].map(([level, label]) => product.notes[level]?.length > 0 && <div key={level}><p className="text-xs font-semibold text-slate">{t(label)}</p><div className="mt-2 flex flex-wrap gap-1.5">{product.notes[level].map((note) => <span key={note} className="border border-line px-2 py-1 text-xs">{note}</span>)}</div></div>)}</div></section>}
          {(product.longevity || product.sillage) && <div className="mt-4 flex flex-wrap gap-6">{[["longevity", product.longevity], ["sillage", product.sillage]].map(([key, value]) => value && <div key={key}><p className="text-xs font-semibold text-slate">{t(`pdp.${key}`)}</p><p className="mt-1 text-sm tracking-widest" aria-label={`${value} ${t("pdp.outOfFive")}`}>{"●".repeat(value)}{"○".repeat(5 - value)}</p></div>)}</div>}

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

          {product.variants?.length > 0 && (
            <div className="mt-7 border-t border-line pt-6">
              <h3 className="label-tracked text-ink">{t("pdp.volume")}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.variants.map((variant) => {
                  const stock = Number(variant.stock) || 0;
                  const disabled = stock <= 0;
                  return (
                    <button
                      key={variant.volumeMl}
                      type="button"
                      data-motion-interactive
                      disabled={disabled}
                      onClick={() => { setSelectedVolumeMl(variant.volumeMl); setQuantity(1); }}
                      aria-pressed={Number(selectedVolumeMl) === Number(variant.volumeMl)}
                      className={cn(
                        "flex h-11 min-w-11 items-center justify-center border px-3 text-sm font-medium transition-colors",
                        disabled
                          ? "cursor-not-allowed border-line text-slate-light line-through"
                          : Number(selectedVolumeMl) === Number(variant.volumeMl)
                          ? "border-ink bg-ink text-paper"
                          : "border-line text-ink hover:border-ink"
                      )}
                    >
                      {variant.volumeMl} ml
                    </button>
                  );
                })}
              </div>

              {selectedVolumeMl && stockForSelectedVolume > 0 && (
                <p
                  className={cn(
                    "mt-2 text-xs font-medium",
                    stockForSelectedVolume <= 3 ? "text-accent-deep" : "text-slate"
                  )}
                >
                  {stockForSelectedVolume <= 5
                    ? t("pdp.onlyXLeft", { count: stockForSelectedVolume })
                    : t("pdp.inStock")}
                </p>
              )}
              {!selectedVolumeMl && isLowStockOverall && (
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
              data-motion-interactive
              onClick={handleAddToCart}
              disabled={isSoldOut || stockForSelectedVolume === 0}
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
                isSoldOut ? t("product.soldOut") : t("product.addToCart")
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

    </div>
  );
}
