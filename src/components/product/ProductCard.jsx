// ProductCard.jsx — FIXED
// Fix: Bug 3 — broken image URL when VITE_API_BASE_URL is undefined.
//   `env?.replace(...) + path` evaluates to "undefined/uploads/..." when the env var
//   is not set (optional chaining returns undefined, and undefined + string = "undefined...").
//   The `|| primaryImage` fallback never fires because "undefined/..." is truthy.
//   Fix: resolve BASE_URL once with a safe fallback to empty string.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Image as ImageIcon } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useCart } from "../../context/CartContext";
import { formatPrice } from "../../lib/formatPrice";
import { getTotalStock, getStockForVolume } from "../../lib/productHelpers";
import { getPromotionHint } from "../../lib/productHelpers";

// FIX Bug 3: compute once, fallback to '' so concatenation never yields "undefined/...".
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace('/api', '');

export default function ProductCard({ product }) {
  const { t, locale } = useLanguage();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [selectedVolumeMl, setSelectedVolumeMl] = useState(product.variants?.find((variant) => variant.stock > 0)?.volumeMl ?? product.variants?.[0]?.volumeMl);
  const [justAdded, setJustAdded] = useState(false);

  const name = locale === "ar" ? (product.nameAr || product.nameKey) : (product.nameEn || product.nameKey);
  const totalStock = getTotalStock(product);
  const isSoldOut = totalStock <= 0;
  const isLowStock = totalStock > 0 && totalStock <= 10;
  const selectedVariant = product.variants?.find((variant) => Number(variant.volumeMl) === Number(selectedVolumeMl));
  const selectedPrice = Number(selectedVariant?.price ?? product.price);
  const onSale = Number(product.compareAtPrice) > selectedPrice;
  const variantStock = getStockForVolume(product, selectedVolumeMl);

  const primaryImage = product.imageUrls?.[0] || null;  
  const handleAddToCart = () => {
    if (!selectedVariant) {
      navigate(`/product/${product._id || product.id}`);
      return;
    }
    if (variantStock <= 0) return;
    addItem(product, selectedVolumeMl);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1800);
  };

  return (
    <div className="group flex flex-col bg-paper" data-motion-card>
      <Link to={`/product/${product._id || product.id}`} className="relative block aspect-[4/5] w-full overflow-hidden border border-line bg-paper-dim flex items-center justify-center">
        {primaryImage ? (
          <img
            src={BASE_URL + primaryImage}
            alt={name}
            data-motion-image
            className="h-full w-full object-contain p-3"
          />
        ) : (
          <ImageIcon className="text-line w-12 h-12" />
        )}
        {(product.isNew || onSale) && (
          <div className="absolute top-3 start-3 flex flex-col gap-1.5">
            {product.isNew && (
              <span className="label-tracked bg-paper px-2 py-1 text-ink">
                {t("product.new")}
              </span>
            )}
            {onSale && (
              <span className="label-tracked bg-ink px-2 py-1 text-paper">
                {t("product.sale")}
              </span>
            )}
          </div>
        )}
        {product.hasActivePromotion && (
          <span className="label-tracked absolute top-3 end-3 bg-accent px-2 py-1 text-ink">
            {locale === "ar" ? "عرض خاص" : "Special offer"}
          </span>
        )}

        {isSoldOut && (
          <span className="label-tracked absolute bottom-3 start-3 bg-ink px-2 py-1 text-paper">
            {t("product.soldOut")}
          </span>
        )}

        {!isSoldOut && isLowStock && (
          <span className="label-tracked absolute bottom-3 start-3 bg-paper/90 px-2 py-1 text-accent-deep">
            {t("product.lowStock")}
          </span>
        )}
      </Link>

      <div className="mt-3.5 flex flex-1 flex-col">
        <Link to={`/product/${product._id || product.id}`}>
          <h3 className="text-sm font-medium text-ink hover:text-slate">{name}</h3>
        </Link>
        {product.promotions?.[0] && <p className="mt-1 text-xs font-semibold text-accent-deep">{getPromotionHint(product.promotions[0], locale)}</p>}
        {(locale === "ar" ? product.descriptionAr : product.descriptionEn) && <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate">{locale === "ar" ? product.descriptionAr : product.descriptionEn}</p>}

        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-ink">
            {formatPrice(selectedPrice, locale, t("common.currency"))}
          </span>
          {onSale && (
            <span className="text-xs text-slate-light line-through">
              {formatPrice(product.compareAtPrice, locale, t("common.currency"))}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {product.variants?.map((variant) => (
            <button
              key={variant.volumeMl}
              type="button"
              data-motion-interactive
              disabled={Number(variant.stock) <= 0}
              onClick={() => setSelectedVolumeMl(variant.volumeMl)}
              className={`flex h-7 items-center justify-center border px-2 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:line-through disabled:text-slate-light ${
                Number(selectedVolumeMl) === Number(variant.volumeMl)
                  ? "border-ink bg-ink text-paper"
                  : "border-line text-slate hover:border-ink hover:text-ink"
              }`}
              aria-pressed={Number(selectedVolumeMl) === Number(variant.volumeMl)}
            >
              {variant.volumeMl} ml
            </button>
          ))}
        </div>

        <button
          type="button"
          data-motion-interactive
          data-added={justAdded ? "true" : "false"}
          onClick={handleAddToCart}
          disabled={isSoldOut || variantStock <= 0}
          className="mt-4 mt-auto flex w-full items-center justify-center gap-2 border border-ink bg-ink py-2.5 text-xs font-semibold uppercase tracking-wide text-paper transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:border-line disabled:bg-line disabled:text-slate-light"
        >
          <Plus size={14} strokeWidth={2} />
          {justAdded ? t("product.addedToCart") : isSoldOut ? t("product.soldOut") : variantStock <= 0 ? t("product.outOfStock") : t("product.addToCart")}
        </button>
      </div>
    </div>
  );
}
