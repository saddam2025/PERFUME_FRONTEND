// FilterSidebar.jsx — FIXED
// Fix: Bug 2 — setPriceRange now uses batchUpdateFilters (new prop from Shop.jsx) so
//   minPrice and maxPrice are written in a single setSearchParams call. The old code
//   built nextParams correctly but never called setSearchParams with it; instead it
//   called updateFilter twice, and the second call read stale searchParams so minPrice
//   was silently dropped every time a price range was selected.
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { categories, sizesAvailable } from "../../lib/productHelpers";
import api from "../../api/axios";
import { cn } from "../../lib/cn";

const PRICE_RANGES = [
  { id: "all", min: "", max: "" },
  { id: "under1000", min: "", max: "1000" },
  { id: "1000to2500", min: "1000", max: "2500" },
  { id: "2500to4000", min: "2500", max: "4000" },
  { id: "over4000", min: "4000", max: "" },
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

export default function FilterSidebar({ searchParams, updateFilter, batchUpdateFilters, onClear }) {
  const { t, locale } = useLanguage();
  const priceLabels = PRICE_LABELS[locale] || PRICE_LABELS.en;

  const [collections, setCollections] = useState([]);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  const currentCategoryStr = searchParams.get("category") || "";
  const currentCategories = currentCategoryStr ? currentCategoryStr.split(",") : [];

  const currentMinPrice = searchParams.get("minPrice") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";
  const currentCollection = searchParams.get("collectionId") || "";

  useEffect(() => {
    async function fetchCollections() {
      try {
        const { data } = await api.get("/collections");
        setCollections(data?.data?.collections || []);
      } catch (error) {
        console.error("Failed to fetch collections", error);
      }
    }
    fetchCollections();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilter("search", searchInput);
  };

  const toggleCategory = (cat) => {
    let next;
    if (currentCategories.includes(cat)) {
      next = currentCategories.filter((c) => c !== cat);
    } else {
      next = [...currentCategories, cat];
    }
    updateFilter("category", next.join(","));
  };

  // FIX Bug 2: use batchUpdateFilters to set minPrice and maxPrice atomically in one
  // setSearchParams call. The previous implementation called updateFilter("minPrice")
  // then updateFilter("maxPrice") separately — each read from the same stale searchParams
  // snapshot, so the second call wiped out the change made by the first.
  const setPriceRange = (min, max) => {
    batchUpdateFilters([
      { key: "minPrice", value: min },
      { key: "maxPrice", value: max },
    ]);
  };

  const getCurrentPriceRangeId = () => {
    const match = PRICE_RANGES.find(
      (r) => r.min === currentMinPrice && r.max === currentMaxPrice
    );
    return match ? match.id : null;
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between pb-5">
        <h2 className="label-tracked text-ink">{t("shop.filters")}</h2>
        <button
          type="button"
          onClick={() => {
            setSearchInput("");
            onClear();
          }}
          className="text-xs font-medium text-slate underline-offset-2 hover:text-ink hover:underline"
        >
          {t("shop.clearAll")}
        </button>
      </div>

      <FilterGroup title={t("shop.search") || "Search"}>
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <input
            type="text"
            placeholder={t("shop.searchPlaceholder") || "Search products..."}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full border border-line bg-paper pl-10 pr-4 py-2 text-sm text-ink focus:border-ink"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" size={16} />
        </form>
      </FilterGroup>

      {collections.length > 0 && (
        <FilterGroup title={t("shop.collections") || "Collections"}>
          <select
            value={currentCollection}
            onChange={(e) => updateFilter("collectionId", e.target.value)}
            className="w-full border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink"
          >
            <option value="">{t("shop.allCollections") || "All Collections"}</option>
            {collections.map((c) => (
              <option key={c._id} value={c._id}>
                {locale === "ar" ? c.nameAr : c.nameEn}
              </option>
            ))}
          </select>
        </FilterGroup>
      )}

      <FilterGroup title={t("shop.category")}>
        <div className="flex flex-col gap-3">
          {categories.map((cat) => (
            <label key={cat} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={currentCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                className="h-4 w-4 rounded-none border border-line text-ink accent-ink"
              />
              <span className="text-sm text-ink">{t(`categories.${cat}`)}</span>
            </label>
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
                checked={getCurrentPriceRangeId() === range.id}
                onChange={() => setPriceRange(range.min, range.max)}
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