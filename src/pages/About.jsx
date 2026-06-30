import { useLanguage } from "../context/LanguageContext";

export default function About() {
  const { t, locale } = useLanguage();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8" dir={locale === "ar" ? "rtl" : "ltr"}>
      <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-ink mb-6">
        {locale === "ar" ? "قصتنا" : "Our Story"}
      </h1>
      
      <div className="space-y-6 text-sm leading-relaxed text-slate">
        <p className="text-base text-ink font-medium">
          {t("about.body") || (locale === "ar" 
            ? "تورونتو هي علامة تجارية تقدم قطعًا مميزة تجمع بين البساطة المطلقة والخامات الراقية." 
            : "Toronto is a minimalist brand dedicated to crafting timeless essentials with high-end fabrics.")}
        </p>
        
        <div className="border-s-2 border-line ps-6 py-2 italic bg-paper-dim">
          {locale === "ar"
            ? "نحن نؤمن أن الأناقة الحقيقية تكمن في التفاصيل الدقيقة وحذف ما لا لزوم له."
            : "We believe true sophistication lies in stripping away the unnecessary and mastering the details."}
        </div>

        <p>
          {locale === "ar"
            ? "كل قطعة ننتجها تمر بمراحل صارمة من اختيار الأقمشة وحتى الخياطة النهائية لتناسب الهوية العصرية والعملية الشغوفة بالتميز النظيف."
            : "Every garment we produce goes through a strict editing process—from fabric selection to final stitching—to accommodate a modern, fluid lifestyle that appreciates clean aesthetics."}
        </p>
      </div>
    </div>
  );
}