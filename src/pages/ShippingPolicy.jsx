import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function ShippingPolicy() {
  const { locale } = useLanguage();
  const isAr = locale === "ar";

  const paragraphs = isAr ? [
    "يرجى التأكد من نظام الشحن مناسب ليك قبل شحن الأوردر.",
    "مدة التوصيل (تسليم - استبدال/استرجاع): من 2 : 4 أيام عمل (الجمعة إجازة).",
    "مندوب الشحن بيتواصل مع العميل يوم التوصيل من 10:00 ص حتى 5:00 م (ميعاد الاستلام علي حسب خط السير في خلال فترة التوصيل وليس حسب وقت محدد. بمعني انة يحتمل ان يكون عنوانك في بداية خط السير او نهايتة).",
    "رجاء التأكد من ان التليفون متاح، وبيتم المتابعة مع العميل من خلالنا ومن خلال شركة الشحن علي الواتس اب (ضروري وجود اتصال دائم).",
    "متاح فتح الشحنة لمراجعة وتأكيد المحتوي المطلوب.",
    "في حالة إلغاء الأوردر بعد تسليمه لشركة الشحن (يتحمل العميل مصاريف الشحن).",
    "لضمان أفضل تجربة، لا يوجد تجزأة لمحتوي الأوردر! (اذا كان الأوردر اكثر من قطعة، غير متاح استلام قطعة ورفض استلام الاخرى).",
    "متاح تأجيل استلام الأوردر مرة واحدة (بحد اقصى 5 أيام)، غير ذلك بيتم إلغاء الأوردر بشكل تلقائي ويتحمل العميل مصاريف الشحن.",
    "غير متاح تعديل العنوان في حالة ان الأوردر خرج للتوصيل، وفي حالة تعديل العنوان من طرف العميل عند الاستلام وحدث اي مشكلة في التوصيل.. يتحمل العميل مصاريف شحن الأوردر.",
    "نود التوضيح أن رسوم الشحن تُحسب مقابل خدمة توصيل المنتج للعميل وبالتالي، تُعد تكلفة الشحن مستحقة سواء قرر العميل الاحتفاظ بالمنتج أو استبداله/استرجاعه، حيث أنها تُغطي الخدمة المقدمة وليس نتيجة التجربة."
  ] : [
    "Please review and ensure our shipping policy suits you before checking out.",
    "Delivery timeline (Delivery / Exchange / Return): 2 to 4 business days (Friday is off).",
    "The courier will contact you on the delivery day between 10:00 AM and 5:00 PM. Delivery time depends on the courier's route, meaning your address could be at the beginning or the end of the route, so specific hours cannot be promised.",
    "Please ensure your phone is reachable. We and the shipping company will follow up with you via WhatsApp, so constant communication is necessary.",
    "You are allowed to open the package to verify and check its contents upon delivery.",
    "If the order is cancelled after being handed over to the shipping company, the customer will bear the full shipping fees.",
    "To ensure the best experience, partial order acceptance is not allowed. If the order contains multiple items, you cannot accept some and reject others.",
    "Postponing delivery is allowed only once (for a maximum of 5 days). Otherwise, the order will be cancelled automatically, and the customer will bear the shipping fees.",
    "Changing the address is not possible once the order is out for delivery. If the address is modified with the courier and a delivery failure occurs, the customer bears the shipping fees.",
    "Please note that shipping fees are calculated against the delivery service itself. Therefore, shipping costs are due whether you decide to keep, exchange, or return the product, as it covers the service provided, not the trial outcome."
  ];

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 text-center">
      <div className="flex justify-center">
        <Link to="/shop" className="flex items-center gap-1.5 text-sm font-medium text-slate hover:text-ink">
          {!isAr && <ArrowLeft size={15} strokeWidth={2} />}
          {isAr ? "العودة للمتجر" : "Back to Shop"}
          {isAr && <ArrowRight size={15} strokeWidth={2} />}
        </Link>
      </div>

      <h1 className="font-display mt-6 text-3xl font-extrabold tracking-tightest sm:text-4xl text-center text-ink">
        {isAr ? "سياسة الشحن والتوصيل" : "Shipping Policy"}
      </h1>

      <div className="mt-8 flex flex-col gap-5 border-t border-line pt-8 max-w-2xl mx-auto text-center">
        {paragraphs.map((paragraph, idx) => (
          <p key={idx} className="text-sm leading-relaxed text-slate text-center">
            {paragraph}
          </p>
        ))}
      </div>
      </div>
  );
}