import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import api from "../api/axios";
import { mapApiProductToUiProduct, CATEGORY_TO_PRODUCT_TYPE, PRODUCT_TYPE_TO_CATEGORY } from "../lib/productHelpers";
import ProductCard from "../components/product/ProductCard";
import FilterSidebar, { PRICE_RANGES } from "../components/product/FilterSidebar";

const DEFAULT_FILTERS = { categories: [], sizes: [], priceRange: "all" };

export default function Shop() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const typeParam = searchParams.get("type");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState("newest");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // The `type` query param (e.g. ?type=jacket) drives the actual API request —
  // filtering happens server-side via Product.find({ productType }). Sidebar
  // category checkboxes stay client-side on top of whatever the server already
  // returned, since multi-category selection isn't a single `type` param.
  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        const params = typeParam ? { type: typeParam } : {};
        const { data } = await api.get("/products", { params });
        if (!cancelled) {
          const mapped = (data?.data?.products || []).map(mapApiProductToUiProduct);
          setProducts(mapped);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [typeParam]);

  // Keep the sidebar's category checkboxes in sync with the URL's ?type=
  // param, so landing on /shop?type=jacket shows "Jackets" pre-checked.
  useEffect(() => {
    if (typeParam && PRODUCT_TYPE_TO_CATEGORY[typeParam]) {
      setFilters((prev) => ({ ...prev, categories: [PRODUCT_TYPE_TO_CATEGORY[typeParam]] }));
    }
  }, [typeParam]);

  const filteredProducts = useMemo(() => {
    const activeRange = PRICE_RANGES.find((r) => r.id === filters.priceRange) || PRICE_RANGES[0];

    let result = products.filter((product) => {
      const matchesCategory =
        filters.categories.length === 0 || filters.categories.includes(product.category);
      const matchesSize =
        filters.sizes.length === 0 || product.sizes.some((s) => filters.sizes.includes(s));
      const matchesPrice = product.price >= activeRange.min && product.price <= activeRange.max;
      return matchesCategory && matchesSize && matchesPrice;
    });

    if (sortBy === "priceLow") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === "priceHigh") {
      result = [...result].sort((a, b) => b.price - a.price);
    } else {
      result = [...result].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }

    return result;
  }, [products, filters, sortBy]);

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchParams({});
  };

  // When the sidebar's category checkboxes change to a single category,
  // reflect it in the URL so the server-side filter and the UI stay in sync
  // (and so the filtered view is shareable/bookmarkable).
  const handleFiltersChange = (nextFilters) => {
    setFilters(nextFilters);
    if (nextFilters.categories.length === 1) {
      const nextType = CATEGORY_TO_PRODUCT_TYPE[nextFilters.categories[0]];
      setSearchParams(nextType ? { type: nextType } : {});
    } else if (nextFilters.categories.length === 0 && typeParam) {
      setSearchParams({});
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="flex flex-col gap-1 border-b border-line pb-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tightest sm:text-4xl">
          {t("shop.title")}
        </h1>
        <p className="text-sm text-slate">
          {t("shop.resultsCount", { count: filteredProducts.length })}
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-10 lg:flex-row lg:gap-10">
        {/* Desktop sidebar */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <FilterSidebar filters={filters} onChange={handleFiltersChange} onClear={clearFilters} />
        </aside>

        {/* Main content */}
        <div className="flex-1">
          {/* Toolbar: mobile filter trigger + sort */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="flex items-center gap-2 border border-line px-4 py-2.5 text-sm font-medium text-ink lg:hidden"
            >
              <SlidersHorizontal size={16} strokeWidth={1.75} />
              {t("shop.filters")}
            </button>

            <div className="ms-auto flex items-center gap-2">
              <label htmlFor="sort" className="hidden text-xs text-slate sm:inline">
                {t("shop.sortBy")}
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-line bg-paper px-3 py-2.5 text-sm text-ink focus:border-ink"
              >
                <option value="newest">{t("shop.sortNewest")}</option>
                <option value="priceLow">{t("shop.sortPriceLow")}</option>
                <option value="priceHigh">{t("shop.sortPriceHigh")}</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-line py-20 text-center">
              <p className="text-sm text-slate">{t("shop.loading")}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-line py-20 text-center">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-line py-20 text-center">
              <p className="text-sm text-slate">{t("shop.noResults")}</p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 border-b border-ink pb-0.5 text-sm font-semibold text-ink"
              >
                {t("shop.clearAll")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 start-0 flex w-full max-w-xs flex-col overflow-y-auto bg-paper p-5 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-base font-bold">{t("shop.filters")}</span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="flex h-8 w-8 items-center justify-center"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>
            <FilterSidebar filters={filters} onChange={handleFiltersChange} onClear={clearFilters} />
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-6 w-full bg-ink py-3 text-sm font-semibold text-paper"
            >
              {t("shop.applyFilters")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}