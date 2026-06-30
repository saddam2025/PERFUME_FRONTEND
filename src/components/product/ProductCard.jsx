import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useCart } from "../../context/CartContext";
import { formatPrice } from "../../lib/formatPrice";
import { getTotalStock, getStockForSize } from "../../lib/productHelpers";

export default function ProductCard({ product }) {
  const { t, locale } = useLanguage();
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);

  const name = locale === "ar" ? product.nameAr : product.nameKey;
  const totalStock = getTotalStock(product);
  const isLowStock = totalStock > 0 && totalStock <= 10;
  const onSale = Boolean(product.compareAtPrice);
  const sizeStock = getStockForSize(product, selectedSize);
  const defaultColor = product.colors?.[0];

  const handleAddToCart = () => {
    if (sizeStock <= 0) return;
    addItem(product, selectedSize, defaultColor);
  };

  return (
    <div className="group flex flex-col">
      {/* Image area */}
      <Link to={`/product/${product.id}`} className="relative block aspect-[3/4] w-full overflow-hidden border border-line" style={{ backgroundColor: product.swatch }}>
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

        {isLowStock && (
          <span className="label-tracked absolute bottom-3 start-3 bg-paper/90 px-2 py-1 text-accent-deep">
            {t("product.lowStock")}
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="mt-3.5 flex flex-1 flex-col">
        <Link to={`/product/${product.id}`}>
          <h3 className="text-sm font-medium text-ink hover:text-slate">{name}</h3>
        </Link>

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

        {/* Size selector */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {product.sizes.map((size) => (
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