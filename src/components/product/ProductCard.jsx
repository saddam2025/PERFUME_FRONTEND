// ProductCard.jsx — FIXED
// Fix: Bug 3 — broken image URL when VITE_API_BASE_URL is undefined.
//   `env?.replace(...) + path` evaluates to "undefined/uploads/..." when the env var
//   is not set (optional chaining returns undefined, and undefined + string = "undefined...").
//   The `|| primaryImage` fallback never fires because "undefined/..." is truthy.
//   Fix: resolve BASE_URL once with a safe fallback to empty string.
import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Image as ImageIcon } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useCart } from "../../context/CartContext";
import { formatPrice } from "../../lib/formatPrice";
import { getTotalStock, getStockForSize } from "../../lib/productHelpers";
import { getPromotionHint } from "../../lib/productHelpers";

// FIX Bug 3: compute once, fallback to '' so concatenation never yields "undefined/...".
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace('/api', '');

export default function ProductCard({ product }) {
  const { t, locale } = useLanguage();
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0]);

  const name = locale === "ar" ? (product.nameAr || product.nameKey) : (product.nameEn || product.nameKey);
  const totalStock = getTotalStock(product);
  const isLowStock = totalStock > 0 && totalStock <= 10;
  const onSale = Boolean(product.compareAtPrice);
  const defaultColor = product.colors?.find((color) => getStockForSize(product, selectedSize, color.nameEn) > 0) || product.colors?.[0];
  const sizeStock = selectedSize ? getStockForSize(product, selectedSize, defaultColor?.nameEn) : 0;

  const primaryImage = product.imageUrls?.[0] || null;  
  const handleAddToCart = () => {
    if (sizeStock <= 0 || !selectedSize) return;
    addItem(product, selectedSize, defaultColor);
  };

  return (
    <div className="group flex flex-col">
      <Link to={`/product/${product._id || product.id}`} className="relative block aspect-[3/4] w-full overflow-hidden border border-line bg-paper flex items-center justify-center">
        {primaryImage ? (
          <img
            src={BASE_URL + primaryImage}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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

        {isLowStock && (
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

        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-sm font-semibold text-ink">
            {formatPrice(product.price, locale, t("common.currency"))}
          </span>
          {onSale && (
            <span className="text-xs text-slate-light line-through">
              {formatPrice(product.compareAtPrice, locale, t("common.currency"))}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {product.sizes?.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setSelectedSize(size)}
              className={`flex h-7 min-w-7 items-center justify-center border px-1.5 text-[11px] font-medium transition-colors ${
                selectedSize === size
                  ? "border-ink bg-ink text-paper"
                  : "border-line text-slate hover:border-ink hover:text-ink"
              }`}
              aria-pressed={selectedSize === size}
            >
              {size}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={sizeStock <= 0}
          className="mt-4 mt-auto flex w-full items-center justify-center gap-2 border border-ink bg-ink py-2.5 text-xs font-semibold uppercase tracking-wide text-paper transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:border-line disabled:bg-line disabled:text-slate-light"
        >
          <Plus size={14} strokeWidth={2} />
          {t("product.addToCart")}
        </button>
      </div>
    </div>
  );
}
