import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import api from "../../api/axios";

function FilterGroup({ title, children }) {
  return (
    <div className="border-b border-line py-6 first:pt-0">
      <h3 className="label-tracked mb-4 text-ink">{title}</h3>
      {children}
    </div>
  );
}

function toggleValue(searchParams, updateFilter, key, value) {
  const current = (searchParams.get(key) || "").split(",").filter(Boolean);
  updateFilter(key, current.includes(String(value))
    ? current.filter((entry) => entry !== String(value)).join(",")
    : [...current, String(value)].join(","));
}

export default function FilterSidebar({ searchParams, updateFilter, batchUpdateFilters, onClear }) {
  const { t, locale } = useLanguage();
  const [options, setOptions] = useState({ brands: [], fragranceFamily: [], notes: [], volumes: [] });
  const [collections, setCollections] = useState([]);
  const [notesSearch, setNotesSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.get("/products/filters"), api.get("/collections")])
      .then(([filtersResponse, collectionsResponse]) => {
        if (cancelled) return;
        setOptions((current) => ({ ...current, ...filtersResponse.data }));
        setCollections(collectionsResponse.data?.data?.collections || []);
      })
      .catch((error) => console.error("Failed to fetch shop filters", error));
    return () => { cancelled = true; };
  }, []);

  const selected = (key) => (searchParams.get(key) || "").split(",").filter(Boolean);
  const checkboxList = (key, values, labelKey = null) => (
    <div className="flex max-h-52 flex-col gap-3 overflow-y-auto">
      {values.map((value) => (
        <label key={value} className="flex cursor-pointer items-center gap-2.5">
          <input
            data-motion-interactive
            type="checkbox"
            checked={selected(key).includes(String(value))}
            onChange={() => toggleValue(searchParams, updateFilter, key, value)}
            className="h-4 w-4 rounded-none border border-line accent-ink"
          />
          <span className="text-sm text-ink">{labelKey ? t(`${labelKey}.${value}`) : value}</span>
        </label>
      ))}
    </div>
  );

  const visibleNotes = options.notes.filter((note) => note.toLowerCase().includes(notesSearch.trim().toLowerCase()));

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between pb-5">
        <h2 className="label-tracked text-ink">{t("shop.filters")}</h2>
        <button type="button" data-motion-interactive onClick={onClear} className="text-xs font-medium text-slate underline-offset-2 hover:text-ink hover:underline">
          {t("shop.clearAll")}
        </button>
      </div>

      {collections.length > 0 && <FilterGroup title={t("shop.collections")}>
        <select value={searchParams.get("collectionId") || ""} onChange={(event) => updateFilter("collectionId", event.target.value)} className="w-full border border-line bg-paper px-3 py-2 text-sm text-ink">
          <option value="">{t("shop.allCollections")}</option>
          {collections.map((collection) => <option key={collection._id} value={collection._id}>{locale === "ar" ? collection.nameAr : collection.nameEn}</option>)}
        </select>
      </FilterGroup>}

      <FilterGroup title={t("shop.gender")}>{checkboxList("gender", ["men", "women", "unisex"], "shop.genderOptions")}</FilterGroup>
      <FilterGroup title={t("shop.concentration")}>{checkboxList("concentration", ["Parfum", "EDP", "EDT", "EDC", "Oil"])}</FilterGroup>
      <FilterGroup title={t("shop.family")}>{checkboxList("family", options.fragranceFamily)}</FilterGroup>
      <FilterGroup title={t("shop.notes")}>
        <div className="relative mb-3">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate" size={15} />
          <input value={notesSearch} onChange={(event) => setNotesSearch(event.target.value)} placeholder={t("shop.searchNotes")} className="w-full border border-line bg-paper py-2 ps-9 pe-3 text-sm" />
        </div>
        {checkboxList("notes", visibleNotes)}
      </FilterGroup>
      <FilterGroup title={t("shop.volume")}>{checkboxList("volume", options.volumes.map(String))}</FilterGroup>

      <FilterGroup title={t("shop.price")}>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-slate">{t("shop.minPrice")}
            <input type="number" min="0" value={searchParams.get("minPrice") || ""} onChange={(event) => batchUpdateFilters([{ key: "minPrice", value: event.target.value }])} className="mt-1 w-full border border-line bg-paper px-2 py-2 text-sm text-ink" />
          </label>
          <label className="text-xs text-slate">{t("shop.maxPrice")}
            <input type="number" min="0" value={searchParams.get("maxPrice") || ""} onChange={(event) => batchUpdateFilters([{ key: "maxPrice", value: event.target.value }])} className="mt-1 w-full border border-line bg-paper px-2 py-2 text-sm text-ink" />
          </label>
        </div>
      </FilterGroup>

      <FilterGroup title={t("shop.availability")}>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
          <input type="checkbox" checked={searchParams.get("inStock") === "true"} onChange={(event) => updateFilter("inStock", event.target.checked ? "true" : "")} className="h-4 w-4 accent-ink" />
          {t("shop.inStock")}
        </label>
      </FilterGroup>

    </div>
  );
}
