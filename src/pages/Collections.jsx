import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

export default function Collections() {
  const { t, locale } = useLanguage();

  // مصفوفة نظيفة متطابقة مع الاستدعاء الثنائي للـ API مستقبلاً
  const localCollections = [
    { id: "summer-2026", name_en: "Summer Drop 2026", name_ar: "مجموعة صيف 2026", desc_en: "Lightweight fabrics tailored for the high heat.", desc_ar: "أقمشة خفيفة الوزن مصممة خصيصاً للمناخ الحار." },
    { id: "core-essentials", name_en: "Core Essentials", name_ar: "الأساسيات اليومية", desc_en: "Timeless silhouettes for everyday utilitarian luxury.", desc_ar: "قصات كلاسيكية تمنحك رفاهية عملية ومستدامة لكل يوم." }
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8" dir={locale === "ar" ? "rtl" : "ltr"}>
      <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-ink mb-2">
        {t("collections.title") || (locale === "ar" ? "المجموعات" : "Collections")}
      </h1>
      <p className="text-xs text-slate mb-8">
        {locale === "ar" ? "تصفح خطوط إنتاجنا الحصرية المصنوعة بعناية." : "Explore our curated lines crafted with architectural discipline."}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {localCollections.map((col) => (
          <div key={col.id} className="border border-line bg-paper p-6 flex flex-col justify-between hover:border-slate transition-colors">
            <div>
              <h3 className="font-display text-lg font-bold text-ink mb-2">
                {locale === "ar" ? col.name_ar : col.name_en}
              </h3>
              <p className="text-xs text-slate leading-relaxed mb-6">
                {locale === "ar" ? col.desc_ar : col.desc_en}
              </p>
            </div>
            
            <Link 
              to={`/shop?collection=${col.id}`} 
              className="text-xs font-bold uppercase tracking-wider text-ink underline hover:opacity-80 transition-opacity self-start"
            >
              {locale === "ar" ? "عرض المجموعة ←" : "View Drop →"}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}