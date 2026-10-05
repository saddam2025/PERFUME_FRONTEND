import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { formatPrice } from "../lib/formatPrice";
import api from "../api/axios";

const EMPTY_FORM = { product: "", name: "", description: "", type: "BUY_X_GET_Y_FREE", tiers: [{ minQty: 3, getQty: 1, percent: 10, fixedPrice: 0 }], startsAt: new Date().toISOString().slice(0, 16), endsAt: "", isActive: true, stackable: false, priority: 0 };

export default function Promotions() {
  const { role } = useAuth();
  const { locale } = useLanguage();
  const ar = locale === "ar";
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const text = (en, arabic) => ar ? arabic : en;

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [promotionResponse, productResponse] = await Promise.all([
        api.get("/promotions/manage", { params: { locale, status: filter === "all" ? undefined : filter } }),
        api.get("/products", { params: { limit: 500 } }),
      ]);
      setPromotions(promotionResponse.data.promotions || []);
      setProducts(productResponse.data?.data?.products || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || text("Could not load promotions.", "تعذر تحميل العروض."));
    } finally { setLoading(false); }
  };

  useEffect(() => { if (role === "Manager" || role === "Admin") load(); }, [role, filter]);

  const filteredProducts = useMemo(() => products.filter((product) => `${product.nameEn} ${product.nameAr}`.toLowerCase().includes(search.toLowerCase())), [products, search]);
  const selectedProduct = products.find((product) => String(product._id) === String(form.product));
  const ruleHint = form.tiers.map((tier) => form.type === "BUY_X_GET_Y_FREE"
    ? `${text("Buy", "اشتري")} ${tier.minQty || "X"} ${text("get", "واحصل على")} ${tier.getQty || "Y"} ${text("free", "مجانًا")}`
    : form.type === "QUANTITY_PERCENT_DISCOUNT"
      ? `${tier.percent || "N"}% ${text("off at", "خصم عند شراء")} ${tier.minQty || "X"}+`
      : `${text("Buy", "اشترِ")} ${tier.minQty || "X"} ${text("for", "بسعر")} ${tier.fixedPrice || 0}`).join(" · ");

  if (role !== "Manager" && role !== "Admin") return <div className="mx-auto max-w-3xl px-4 py-20 text-center">{text("You do not have permission to manage promotions.", "ليست لديك صلاحية إدارة العروض.")}</div>;

  const updateTier = (index, key, value) => setForm((current) => ({ ...current, tiers: current.tiers.map((tier, tierIndex) => tierIndex === index ? { ...tier, [key]: value } : tier) }));
  const editPromotion = (promotion) => {
    setEditingId(promotion._id);
    setForm({ ...EMPTY_FORM, ...promotion, product: promotion.product?._id || promotion.product, startsAt: new Date(promotion.startsAt).toISOString().slice(0, 16), endsAt: promotion.endsAt ? new Date(promotion.endsAt).toISOString().slice(0, 16) : "", tiers: promotion.tiers.map((tier) => ({ ...tier })) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const payload = { ...form, startsAt: new Date(form.startsAt).toISOString(), endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null, tiers: form.tiers.map((tier) => Object.fromEntries(Object.entries(tier).filter(([, value]) => value !== ""))) };
      if (editingId) await api.put(`/promotions/${editingId}`, payload); else await api.post("/promotions", payload);
      setForm(EMPTY_FORM); setEditingId(null); setNotice(text("Promotion saved.", "تم حفظ العرض.")); await load();
    } catch (requestError) { setError(requestError.response?.data?.message || text("Could not save promotion.", "تعذر حفظ العرض.")); }
    finally { setSaving(false); }
  };
  const toggle = async (promotion) => { try { await api.patch(`/promotions/${promotion._id}/status`, { isActive: !promotion.isActive }); await load(); } catch (requestError) { setError(requestError.response?.data?.message || text("Could not update status.", "تعذر تحديث الحالة.")); } };
  const remove = async (promotion) => { if (!window.confirm(text("Delete this promotion? Past orders will keep their saved offer details.", "هل تريد حذف هذا العرض؟ ستظل تفاصيله محفوظة في الطلبات السابقة."))) return; try { await api.delete(`/promotions/${promotion._id}`); await load(); } catch (requestError) { setError(requestError.response?.data?.message || text("Could not delete promotion.", "تعذر حذف العرض.")); } };
  const statusOf = (promotion) => !promotion.isActive ? text("Disabled", "موقوف") : new Date(promotion.startsAt) > new Date() ? text("Scheduled", "مجدول") : promotion.endsAt && new Date(promotion.endsAt) <= new Date() ? text("Expired", "منتهي") : text("Active", "نشط");

  return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" dir={ar ? "rtl" : "ltr"}>
    <header className="mb-8 border-b border-line pb-5"><div className="flex items-center gap-3"><Tag size={21}/><h1 className="font-display text-3xl font-bold">{text("Promotions", "العروض")}</h1></div><p className="mt-2 text-sm text-slate">{text("Create offers for products and manage their schedule.", "أنشئ عروضًا للمنتجات وتحكم في مواعيدها.")}</p></header>
    {error && <p role="alert" className="mb-5 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}{notice && <p className="mb-5 border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
    <form onSubmit={save} className="mb-10 grid gap-4 border border-line bg-paper-dim p-5 md:grid-cols-2">
      <h2 className="md:col-span-2 text-lg font-semibold">{editingId ? text("Edit promotion", "تعديل العرض") : text("Create promotion", "إنشاء عرض")}</h2>
      <div><label className="mb-1 block text-xs font-semibold">{text("Search products", "ابحث عن منتج")}</label><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={text("Type a product name", "اكتب اسم المنتج")} className="mb-2 w-full border border-line bg-paper px-3 py-2 text-sm"/><select required value={form.product} onChange={(event) => setForm({ ...form, product: event.target.value })} className="w-full border border-line bg-paper px-3 py-2 text-sm"><option value="">{text("Choose product", "اختر المنتج")}</option>{filteredProducts.map((product) => <option key={product._id} value={product._id}>{ar ? product.nameAr : product.nameEn}</option>)}</select></div>
      <label className="text-xs font-semibold">{text("Offer name", "اسم العرض")}<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full border border-line bg-paper px-3 py-2 text-sm"/></label>
      <label className="text-xs font-semibold">{text("Description", "الوصف")}<input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 w-full border border-line bg-paper px-3 py-2 text-sm"/></label>
      <label className="text-xs font-semibold">{text("Offer type", "نوع العرض")}<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="mt-1 w-full border border-line bg-paper px-3 py-2 text-sm"><option value="BUY_X_GET_Y_FREE">{text("Buy X get Y free", "اشتري X واحصل على Y مجانًا")}</option><option value="QUANTITY_PERCENT_DISCOUNT">{text("Quantity percent discount", "خصم نسبة على الكمية")}</option><option value="QUANTITY_FIXED_DISCOUNT">{text("Quantity fixed/bundle price", "سعر ثابت للمجموعة")}</option></select></label>
      <div className="space-y-2 md:col-span-2"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold">{text("Tiers", "شرائح العرض")}</h3><button type="button" onClick={() => setForm({ ...form, tiers: [...form.tiers, { minQty: 3, getQty: 1, percent: 10, fixedPrice: 0 }] })} className="inline-flex items-center gap-1 text-xs font-semibold"><Plus size={14}/>{text("Add tier", "إضافة شريحة")}</button></div>{form.tiers.map((tier, index) => <div key={index} className="grid grid-cols-2 gap-2 border border-line bg-paper p-3 sm:grid-cols-4"><label className="text-[11px]">{text("Minimum quantity", "الحد الأدنى للكمية")}<input required type="number" min="1" step="1" value={tier.minQty} onChange={(event) => updateTier(index, "minQty", Number(event.target.value))} className="mt-1 w-full border border-line px-2 py-1.5 text-sm"/></label>{form.type === "BUY_X_GET_Y_FREE" && <label className="text-[11px]">{text("Free quantity", "الكمية المجانية")}<input required type="number" min="1" step="1" value={tier.getQty} onChange={(event) => updateTier(index, "getQty", Number(event.target.value))} className="mt-1 w-full border border-line px-2 py-1.5 text-sm"/></label>}{form.type === "QUANTITY_PERCENT_DISCOUNT" && <label className="text-[11px]">{text("Percent", "نسبة الخصم")}<input required type="number" min="1" max="100" value={tier.percent} onChange={(event) => updateTier(index, "percent", Number(event.target.value))} className="mt-1 w-full border border-line px-2 py-1.5 text-sm"/></label>}{form.type === "QUANTITY_FIXED_DISCOUNT" && <label className="text-[11px]">{text("Bundle price", "سعر المجموعة")}<input required type="number" min="0" step="0.01" value={tier.fixedPrice} onChange={(event) => updateTier(index, "fixedPrice", Number(event.target.value))} className="mt-1 w-full border border-line px-2 py-1.5 text-sm"/></label>}{form.tiers.length > 1 && <button type="button" onClick={() => setForm({ ...form, tiers: form.tiers.filter((_, tierIndex) => tierIndex !== index) })} className="self-end text-xs text-red-700">{text("Remove", "حذف")}</button>}</div>)}</div>
      <label className="text-xs font-semibold">{text("Starts", "يبدأ")}<input type="datetime-local" required value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} className="mt-1 w-full border border-line bg-paper px-3 py-2 text-sm"/></label><label className="text-xs font-semibold">{text("Ends (optional)", "ينتهي (اختياري)")}<input type="datetime-local" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} className="mt-1 w-full border border-line bg-paper px-3 py-2 text-sm"/></label>
      <label className="text-xs font-semibold">{text("Priority", "الأولوية")}<input type="number" value={form.priority} onChange={(event) => setForm({ ...form, priority: Number(event.target.value) })} className="mt-1 w-full border border-line bg-paper px-3 py-2 text-sm"/></label>
      <div className="flex flex-wrap items-center gap-5 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })}/>{text("Enabled", "مفعّل")}</label><label className="flex items-center gap-2"><input type="checkbox" checked={form.stackable} onChange={(event) => setForm({ ...form, stackable: event.target.checked })}/>{text("Stackable", "قابل للتجميع")}</label></div>
      <div className="border border-accent/40 bg-accent/10 p-3 text-sm md:col-span-2"><span className="font-semibold">{text("Buyer preview", "معاينة العميل")}: </span>{ruleHint}</div>
      {selectedProduct && <p className="text-xs text-slate md:col-span-2">{text("Product", "المنتج")}: {ar ? selectedProduct.nameAr : selectedProduct.nameEn}</p>}
      <div className="flex gap-2 md:col-span-2"><button disabled={saving} className="bg-ink px-5 py-2.5 text-sm font-semibold text-paper disabled:opacity-50">{saving ? text("Saving…", "جارٍ الحفظ…") : editingId ? text("Save changes", "حفظ التعديلات") : text("Create offer", "إنشاء العرض")}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }} className="border border-line px-4 py-2.5 text-sm">{text("Cancel", "إلغاء")}</button>}</div>
    </form>
    <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">{text("All offers", "كل العروض")}</h2><select value={filter} onChange={(event) => setFilter(event.target.value)} className="border border-line bg-paper px-3 py-2 text-sm"><option value="all">{text("All", "الكل")}</option><option value="active">{text("Active", "نشط")}</option><option value="scheduled">{text("Scheduled", "مجدول")}</option><option value="expired">{text("Expired", "منتهي")}</option><option value="disabled">{text("Disabled", "موقوف")}</option></select></div>
    {loading ? <p className="py-12 text-center text-sm text-slate">{text("Loading offers…", "جارٍ تحميل العروض…")}</p> : promotions.length === 0 ? <p className="border border-dashed border-line py-12 text-center text-sm text-slate">{text("No promotions yet.", "لا توجد عروض حتى الآن.")}</p> : <div className="overflow-x-auto border border-line"><table className="w-full min-w-[900px] text-sm"><thead className="bg-paper-dim text-start"><tr>{[text("Product", "المنتج"), text("Rule", "العرض"), text("Status", "الحالة"), text("Dates", "المدة"), text("Orders", "الطلبات"), text("Actions", "الإجراءات")].map((heading) => <th key={heading} className="px-4 py-3 text-start text-xs font-semibold">{heading}</th>)}</tr></thead><tbody>{promotions.map((promotion) => <tr key={promotion._id} className="border-t border-line"><td className="px-4 py-3">{promotion.product?.imageUrls?.[0] && <img src={`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace("/api", "")}${promotion.product.imageUrls[0]}`} className="me-3 inline-block h-10 w-8 object-cover" alt=""/>}{ar ? promotion.product?.nameAr : promotion.product?.nameEn}</td><td className="px-4 py-3">{promotion.name}<p className="text-xs text-slate">{promotion.hint}</p></td><td className="px-4 py-3">{statusOf(promotion)}</td><td className="px-4 py-3 text-xs">{new Date(promotion.startsAt).toLocaleDateString()} – {promotion.endsAt ? new Date(promotion.endsAt).toLocaleDateString() : "∞"}</td><td className="px-4 py-3">{promotion.orderCount || 0}</td><td className="px-4 py-3"><div className="flex gap-2"><button aria-label={text("Edit", "تعديل")} onClick={() => editPromotion(promotion)} className="border border-line p-2"><Pencil size={15}/></button><button onClick={() => toggle(promotion)} className="border border-line px-2 text-xs">{promotion.isActive ? text("Disable", "إيقاف") : text("Enable", "تفعيل")}</button><button aria-label={text("Delete", "حذف")} onClick={() => remove(promotion)} className="border border-line p-2 text-red-700"><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div>}
    {selectedProduct && <span className="sr-only">{formatPrice(selectedProduct.price, locale, "EGP")}</span>}
  </div>;
}
