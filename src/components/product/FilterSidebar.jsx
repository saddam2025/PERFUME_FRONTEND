import { useLanguage } from "../../context/LanguageContext";
import { categories, sizesAvailable } from "../../lib/productHelpers";
import { cn } from "../../lib/cn";

const PRICE_RANGES = [
  { id: "all", min: 0, max: Infinity },
  { id: "under1000", min: 0, max: 1000 },
  { id: "1000to2500", min: 1000, max: 2500 },
  { id: "2500to4000", min: 2500, max: 4000 },
  { id: "over4000", min: 4000, max: Infinity },
];

const PRICE_LABELS = {
  en: {
    all: "All prices",
    under1000: "Under 1,000",
    "1000to2500": "1,000 – 2,500",
    "2500to4000": "2,500 – 4,000",
    over4000: "Over 4,000",
  },
  ar: {
    all: "كل الأسعار",
    under1000: "أقل من 1,000",
    "1000to2500": "1,000 – 2,500",
    "2500to4000": "2,500 – 4,000",
    over4000: "أكثر من 4,000",
  },
};

function FilterGroup({ title, children }) {
  return (
    <div className="border-b border-line py-6 first:pt-0">
      <h3 className="label-tracked mb-4 text-ink">{title}</h3>
      {children}
    </div>
  );
}

export default function FilterSidebar({ filters, onChange, onClear }) {
  const { t, locale } = useLanguage();
  const priceLabels = PRICE_LABELS[locale] || PRICE_LABELS.en;

  const toggleCategory = (cat) => {
    const next = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat];
    onChange({ ...filters, categories: next });
  };

  const toggleSize = (size) => {
    const next = filters.sizes.includes(size)
      ? filters.sizes.filter((s) => s !== size)
      : [...filters.sizes, size];
    onChange({ ...filters, sizes: next });
  };

  const setPriceRange = (rangeId) => {
    onChange({ ...filters, priceRange: rangeId });
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between pb-5">
        <h2 className="label-tracked text-ink">{t("shop.filters")}</h2>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-slate underline-offset-2 hover:text-ink hover:underline"
        >
          {t("shop.clearAll")}
        </button>
      </div>

      <FilterGroup title={t("shop.category")}>
        <div className="flex flex-col gap-3">
          {categories.map((cat) => (
            <label key={cat} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.categories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                className="h-4 w-4 rounded-none border border-line text-ink accent-ink"
              />
              <span className="text-sm text-ink">{t(`categories.${cat}`)}</span>
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title={t("shop.size")}>
        <div className="flex flex-wrap gap-2">
          {sizesAvailable.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => toggleSize(size)}
              aria-pressed={filters.sizes.includes(size)}
              className={cn(
                "flex h-8 min-w-8 items-center justify-center border px-2 text-xs font-medium transition-colors",
                filters.sizes.includes(size)
                  ? "border-ink bg-ink text-paper"
                  : "border-line text-slate hover:border-ink hover:text-ink"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title={t("shop.price")}>
        <div className="flex flex-col gap-3">
          {PRICE_RANGES.map((range) => (
            <label key={range.id} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="priceRange"
                checked={filters.priceRange === range.id}
                onChange={() => setPriceRange(range.id)}
                className="h-4 w-4 border border-line text-ink accent-ink"
              />
              <span className="text-sm text-ink">{priceLabels[range.id]}</span>
            </label>
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}

export { PRICE_RANGES };