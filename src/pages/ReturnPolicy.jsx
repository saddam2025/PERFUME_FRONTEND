import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const RETURN_POLICY_PARAGRAPHS = [
  "متاح الاستبدال او الاسترجاع في حالة القطعة غير مناسبة للعميل (مقاس او خامة غير مناسبة - القطعة عكس المتوقع)، خلال 7 أيام من تاريخ استلام الاوردر بشرط تكون القطعة سليمة وفي حالتها الأصلية. (يتحمل العميل مصاريف شحن التسليم و الاستبدال/الاسترجاع)",
  "ملحوظة مهمة: نظرًا لاختلاف طبيعة الأجسام من شخص لآخر، قد لا يكون المقاس المختار مناسب بشكل تام، وهو أمر وارد وطبيعي لا يُعتبر خطأ من أي طرف. لذلك، نحن نوفر إمكانية الاستبدال او الاسترجاع لضمان افضل تجربة.",
  "في حالة وجود عيب تصنيع او ارسال منتج خاطئ (لا يتحمل العميل مصاريف شحن التسليم والاستبدال/الاسترجاع). (ننصح بمراجعة القطعة جيداً عند الاستلام)",
  "في حالة الاسترجاع: يتم رد المبلغ المستحق (بعد مراجعة الاوردر للتأكد من سلامتة) من خلال المحافظ الإلكترونية أو الحساب البنكي خلال 5 أيام عمل من تاريخ استلام الاوردر من العميل.",
];

export default function ReturnPolicy() {
  const { t } = useLanguage();

  return (
    <div dir="rtl" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <Link to="/shop" className="flex items-center gap-1.5 text-sm font-medium text-slate hover:text-ink">
        <ArrowRight size={15} strokeWidth={2} />
        {t("policies.backToShop")}
      </Link>

      <h1 className="font-display mt-6 text-3xl font-extrabold tracking-tightest sm:text-4xl">
        {t("policies.returnTitle")}
      </h1>

      <div className="mt-8 flex flex-col gap-5 border-t border-line pt-8">
        {RETURN_POLICY_PARAGRAPHS.map((paragraph, idx) => (
          <p key={idx} className="text-sm leading-relaxed text-slate">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}