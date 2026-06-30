import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const SHIPPING_POLICY_PARAGRAPHS = [
  "يرجى التأكد من نظام الشحن مناسب ليك قبل شحن الأوردر",
  "مدة التوصيل (تسليم - استبدال/استرجاع): من 2 : 4 ايام عمل (الجمعة اجازة)",
  "مندوب الشحن بيتواصل مع العميل يوم التوصيل من 10:00 ص حتى 5:00 م (ميعاد الاستلام علي حسب خط السير في خلال فترة التوصيل وليس حسب وقت محدد. بمعني انة يحتمل ان يكون عنوانك في بداية خط السير او نهايتة)",
  "رجاء التأكد من ان التليفون متاح، وبيتم المتابعة مع العميل من خلالنا ومن خلال شركة الشحن علي الواتس اب (ضروري وجود اتصال دائم)",
  "متاح فتح الشحنة لمراجعة وتأكيد المحتوي المطلوب",
  "في حالة الغاء الاوردر بعد تسليمة لشركة الشحن (يتحمل العميل مصاريف الشحن)",
  "لضمان افضل تجربة، لا يوجد تجزأة لمحتوي الاوردر! (اذا كان الاوردر اكثر من قطعة، غير متاح استلام قطعة ورفض استلام الاخري)",
  "متاح تأجيل استلام الاوردر مرة واحدة (بحد اقص 5 ايام)، غير ذلك بيتم الغاء الاوردر بشكل تلقائي ويتحمل العميل مصاريف الشحن",
  "غير متاح تعديل العنوان في حالة ان الاوردر خرج للتوصيل، وفي حالة تعديل العنوان من طرف العميل عند الاستلام وحدث اي مشكلة في التوصيل.. يتحمل العميل مصاريف شحن الاوردر",
  "نود التوضيح أن رسوم الشحن تُحسب مقابل خدمة توصيل المنتج للعميل وبالتالي، تُعد تكلفة الشحن مستحقة سواء قرر العميل الاحتفاظ بالمنتج أو استبداله/استرجاعه، حيث أنها تُغطي الخدمة المقدمة وليس نتيجة التجربة",
];

export default function ShippingPolicy() {
  const { t } = useLanguage();

  return (
    <div dir="rtl" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <Link to="/shop" className="flex items-center gap-1.5 text-sm font-medium text-slate hover:text-ink">
        <ArrowRight size={15} strokeWidth={2} />
        {t("policies.backToShop")}
      </Link>

      <h1 className="font-display mt-6 text-3xl font-extrabold tracking-tightest sm:text-4xl">
        {t("policies.shippingTitle")}
      </h1>

      <div className="mt-8 flex flex-col gap-5 border-t border-line pt-8">
        {SHIPPING_POLICY_PARAGRAPHS.map((paragraph, idx) => (
          <p key={idx} className="text-sm leading-relaxed text-slate">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}