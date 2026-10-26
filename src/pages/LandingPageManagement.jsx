import { useEffect, useState } from "react";
import { ImagePlus, Pencil, Trash2, Save, X } from "lucide-react";
import api from "../api/axios";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

const blankSlide = { titleEn: "", titleAr: "", descriptionEn: "", descriptionAr: "", ctaEn: "", ctaAr: "", destination: "/shop", order: 0, isActive: true };
const blankType = { key: "", nameEn: "", nameAr: "", order: 0, isActive: true };

export default function LandingPageManagement() {
  const { locale } = useLanguage();
  const { role } = useAuth();
  const ar = locale === "ar";
  const text = (en, arabic) => ar ? arabic : en;
  const [data, setData] = useState({ heroSlides: [], fragranceTypes: [] });
  const [kind, setKind] = useState("slide");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankSlide);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const load = async () => { const { data: result } = await api.get("/homepage-content/manage"); setData(result); };
  useEffect(() => { api.get("/homepage-content/manage").then(({ data: result }) => setData(result)).catch(() => setError(locale === "ar" ? "تعذر تحميل محتوى الصفحة." : "Could not load homepage content.")); }, [locale]);
  const start = (section, item = null) => {
    setKind(section);
    setFormOpen(true);
    setEditing(item?._id || null);
    setForm(item ? { ...item } : section === "slide" ? { ...blankSlide } : { ...blankType, order: data.fragranceTypes.length });
    setImage(null);
    setPreview(item?.imageUrl ? (api.defaults.baseURL || "").replace(/\/api\/?$/, "") + item.imageUrl : "");
    setError("");
  };
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true); setError("");
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, String(value ?? "")));
    if (image) body.append("image", image);
    const collection = kind === "slide" ? "slides" : "types";
    try {
      if (editing) await api.put("/homepage-content/" + collection + "/" + editing, body);
      else await api.post("/homepage-content/" + collection, body);
      await load(); setEditing(null); setFormOpen(false); setImage(null); setPreview("");
    } catch (requestError) { setError(requestError.response?.data?.message || text("Could not save changes.", "تعذر حفظ التغييرات.")); }
    finally { setSaving(false); }
  };
  const remove = async (section, item) => {
    if (!item._id || !window.confirm(text("Delete this item?", "هل تريد حذف هذا العنصر؟"))) return;
    try { await api.delete("/homepage-content/" + (section === "slide" ? "slides" : "types") + "/" + item._id); await load(); }
    catch (requestError) { setError(requestError.response?.data?.message || text("Could not delete item.", "تعذر حذف العنصر.")); }
  };
  const fields = kind === "slide"
    ? [["titleEn", text("Title (English)", "العنوان بالإنجليزية")], ["titleAr", text("Title (Arabic)", "العنوان بالعربية")], ["descriptionEn", text("Description (English)", "الوصف بالإنجليزية")], ["descriptionAr", text("Description (Arabic)", "الوصف بالعربية")], ["ctaEn", text("Button (English)", "الزر بالإنجليزية")], ["ctaAr", text("Button (Arabic)", "الزر بالعربية")], ["destination", text("Internal destination", "الرابط الداخلي")]]
    : [["key", text("Catalog family key", "رمز العائلة في المنتجات")], ["nameEn", text("Name (English)", "الاسم بالإنجليزية")], ["nameAr", text("Name (Arabic)", "الاسم بالعربية")]];
  const list = kind === "slide" ? data.heroSlides : data.fragranceTypes;
  const imageUrl = (url) => (api.defaults.baseURL || "").replace(/\/api\/?$/, "") + (url || "");
  if (role !== "Manager" && role !== "Admin") return <div className="mx-auto max-w-3xl px-4 py-20 text-center">{text("You do not have permission to manage homepage content.", "ليست لديك صلاحية إدارة محتوى الصفحة الرئيسية.")}</div>;
  return <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
    <header className="mb-6 border-b border-line pb-5"><h1 className="font-display text-2xl font-bold">{text("Homepage content", "محتوى الصفحة الرئيسية")}</h1><p className="mt-2 text-sm text-slate">{text("Manage hero campaigns and fragrance-type cards.", "إدارة صور الواجهة وبطاقات أنواع العطور.")}</p></header>
    <div className="mb-5 flex gap-2 border-b border-line">{[["slide", text("Hero slides", "شرائح الواجهة")], ["type", text("Perfume types", "أنواع العطور")]].map(([id, label]) => <button key={id} onClick={() => { setKind(id); setEditing(null); setFormOpen(false); setForm(id === "slide" ? blankSlide : blankType); }} className={"border-b-2 px-3 py-3 text-sm font-semibold " + (kind === id ? "border-ink text-ink" : "border-transparent text-slate")}>{label}</button>)}</div>
    {error && <p role="alert" className="mb-4 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {formOpen ? <form onSubmit={submit} className="mb-7 grid gap-3 border border-line bg-white p-4 sm:grid-cols-2">
      <h2 className="text-base font-semibold sm:col-span-2">{editing ? text("Edit", "تعديل") : text("Add", "إضافة")} {kind === "slide" ? text("hero slide", "شريحة واجهة") : text("perfume type", "نوع عطر")}</h2>
      {fields.map(([key, label]) => <label key={key} className="text-xs font-semibold text-slate">{label}<input required={key !== "destination" && !["descriptionEn","descriptionAr","ctaEn","ctaAr"].includes(key)} dir={key.endsWith("Ar") ? "rtl" : undefined} value={form[key] || ""} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 w-full border border-line bg-paper px-3 py-2 text-sm text-ink" /></label>)}
      <label className="text-xs font-semibold text-slate">{text("Display order", "ترتيب العرض")}<input type="number" value={form.order ?? 0} onChange={(event) => setForm({ ...form, order: Number(event.target.value) })} className="mt-1 w-full border border-line bg-paper px-3 py-2 text-sm text-ink" /></label>
      <label className="flex items-center gap-2 self-end py-2 text-sm"><input type="checkbox" checked={form.isActive !== false} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />{text("Published", "منشور")}</label>
      <label className="flex min-w-0 flex-wrap cursor-pointer items-center gap-2 border border-dashed border-line p-3 text-sm break-words sm:col-span-2"><ImagePlus size={18}/>{text("Choose image (JPEG, PNG, WebP, AVIF)", "اختر صورة (JPEG أو PNG أو WebP أو AVIF)")}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => { const file = event.target.files?.[0]; setImage(file || null); setPreview(file ? URL.createObjectURL(file) : preview); }} className="sr-only" />{preview && <img src={preview} alt="" className="ms-auto h-16 w-24 max-w-full bg-paper-dim object-contain" />}</label>
      <div className="flex gap-2 sm:col-span-2"><button disabled={saving} className="inline-flex items-center gap-2 bg-ink px-4 py-2.5 text-sm font-semibold text-white"><Save size={15}/>{saving ? text("Saving…","جارٍ الحفظ…") : text("Save","حفظ")}</button><button type="button" onClick={() => { setEditing(null); setFormOpen(false); setForm(kind === "slide" ? blankSlide : blankType); }} className="inline-flex items-center gap-2 border border-line px-4 py-2.5 text-sm"><X size={15}/>{text("Cancel","إلغاء")}</button></div>
    </form> : <button onClick={() => { setForm(kind === "slide" ? { ...blankSlide, order: list.length } : { ...blankType, order: list.length }); setEditing(""); setFormOpen(true); setPreview(""); }} className="mb-5 bg-ink px-4 py-2.5 text-sm font-semibold text-white">{text("Add item", "إضافة عنصر")}</button>}
    <div className="grid gap-3 sm:grid-cols-2">{list.map((item) => <article key={item._id || item.key} className="flex min-w-0 gap-3 border border-line bg-white p-3">
      {item.imageUrl ? <img src={imageUrl(item.imageUrl)} alt="" className="h-20 w-24 shrink-0 bg-paper-dim object-contain" /> : <div className="h-20 w-24 shrink-0 bg-paper-dim" />}
      <div className="min-w-0 flex-1"><p className="truncate font-semibold">{kind === "slide" ? (ar ? item.titleAr || item.titleEn : item.titleEn || item.titleAr) : (ar ? item.nameAr || item.nameEn : item.nameEn || item.nameAr)}</p><p className="mt-1 break-all text-xs text-slate">{kind === "slide" ? item.destination : item.key} · {item.isActive ? text("Published","منشور") : text("Hidden","مخفي")}</p><div className="mt-2 flex gap-2"><button onClick={() => start(kind, item)} className="border border-line p-2" aria-label={text("Edit","تعديل")}><Pencil size={14}/></button>{item._id && <button onClick={() => remove(kind,item)} className="border border-line p-2 text-red-700" aria-label={text("Delete","حذف")}><Trash2 size={14}/></button>}</div></div>
    </article>)}</div>
  </div>;
}
