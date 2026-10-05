// Shop.jsx — only the imports and the fetchProducts params section change
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import api from "../api/axios";
import { mapApiProductToUiProduct, CATEGORY_TO_PRODUCT_TYPE } from "../lib/productHelpers";
import ProductCard from "../components/product/ProductCard";
import FilterSidebar from "../components/product/FilterSidebar";

export default function Shop() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const page = Number(searchParams.get("page")) || 1;
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const currentSearch = searchParams.get("search") || "";
  const currentCategory = searchParams.get("category") || "";
  const currentMinPrice = searchParams.get("minPrice") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";
  const currentCollection = searchParams.get("collectionId") || "";
  const currentSort = searchParams.get("sort") || "newest";

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        // FIX: currentCategory holds UI keys (tshirts, jackets, hoodies, pants)
        // set by FilterSidebar/Footer — the backend's Product.category enum
        // uses different values (t-shirt, jacket, hoodie, pants). Translate
        // each comma-joined token before sending, or every category except
        // "pants" (which happens to match by coincidence) silently returns
        // zero results.
        const translatedCategory = currentCategory
          ? currentCategory
              .split(",")
              .map((key) => CATEGORY_TO_PRODUCT_TYPE[key] || key)
              .join(",")
          : "";

        const params = {
          page,
          limit: 12,
          category: translatedCategory,
          search: currentSearch,
          minPrice: currentMinPrice,
          maxPrice: currentMaxPrice,
          collectionId: currentCollection,
          sort: currentSort,
        };

        Object.keys(params).forEach(key => !params[key] && delete params[key]);

        const { data } = await api.get("/products", { params });
        if (!cancelled) {
          const mapped = (data?.data?.products || []).map(mapApiProductToUiProduct);
          setProducts(mapped);
          setTotalPages(data.totalPages || 1);
          setTotalResults(data.total || 0);
        }
      } catch (err) {
        if (!cancelled) {
          if (err.response?.status === 404) {
            setProducts([]);
            setTotalResults(0);
            setTotalPages(1);
          } else {
            setError(err.response?.data?.message || err.message);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProducts();
    return () => { cancelled = true; };
  }, [page, currentCategory, currentSearch, currentMinPrice, currentMaxPrice, currentCollection, currentSort]);

  const updateFilter = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    if (key !== "page") {
      nextParams.set("page", "1");
    }
    setSearchParams(nextParams);
  };

  const batchUpdateFilters = (updates) => {
    const nextParams = new URLSearchParams(searchParams);
    updates.forEach(({ key, value }) => {
      if (value) {
        nextParams.set(key, value);
      } else {
        nextParams.delete(key);
      }
    });
    nextParams.set("page", "1");
    setSearchParams(nextParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="flex flex-col gap-1 border-b border-line pb-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tightest sm:text-4xl">
          {t("shop.title")}
        </h1>
        <p className="text-sm text-slate">
          {t("shop.resultsCount", { count: totalResults })}
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-10 lg:flex-row lg:gap-10">
        <aside className="hidden w-64 shrink-0 lg:block">
          <FilterSidebar
            searchParams={searchParams}
            updateFilter={updateFilter}
            batchUpdateFilters={batchUpdateFilters}
            onClear={clearFilters}
          />
        </aside>

        <div className="flex-1">
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
                value={currentSort}
                onChange={(e) => updateFilter("sort", e.target.value)}
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
          ) : products.length === 0 ? (
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
            <>
              <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id || product._id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-4">
                  <button
                    onClick={() => updateFilter("page", String(page - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 border border-line px-4 py-2 text-sm disabled:opacity-50"
                  >
                    <ChevronLeft size={16} /> {t("common.prev")}
                  </button>
                  <span className="text-sm text-slate">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => updateFilter("page", String(page + 1))}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 border border-line px-4 py-2 text-sm disabled:opacity-50"
                  >
                    {t("common.next")} <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

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
                className="flex h-8 w-8 items-center justify-center"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>
            <FilterSidebar
              searchParams={searchParams}
              updateFilter={updateFilter}
              batchUpdateFilters={batchUpdateFilters}
              onClear={clearFilters}
            />
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