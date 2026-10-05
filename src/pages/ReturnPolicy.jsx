import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function ReturnPolicy() {
  const { locale } = useLanguage();
  const isAr = locale === "ar";

  const paragraphs = isAr ? [
    "متاح الاستبدال أو الاسترجاع في حالة القطعة غير مناسبة للعميل (مقاس أو خامة غير مناسبة - القطعة عكس المتوقع)، خلال 7 أيام من تاريخ استلام الأوردر بشرط تكون القطعة سليمة وفي حالتها الأصلية. (يتحمل العميل مصاريف شحن التسليم و الاستبدال/الاسترجاع).",
    "ملحوظة مهمة: نظرًا لاختلاف طبيعة الأجسام من شخص لآخر، قد لا يكون المقاس المختار مناسب بشكل تام، وهو أمر وارد وطبيعي لا يُعتبر خطأ من أي طرف. لذلك، نحن نوفر إمكانية الاستبدال أو الاسترجاع لضمان أفضل تجربة.",
    "في حالة وجود عيب تصنيع أو إرسال منتج خاطئ (لا يتحمل العميل مصاريف شحن التسليم والاستبدال/الاسترجاع). (ننصح بمراجعة القطعة جيداً عند الاستلام).",
    "في حالة الاسترجاع: يتم رد المبلغ المستحق (بعد مراجعة الأوردر للتأكد من سلامته) من خلال المحافظ الإلكترونية أو الحساب البنكي خلال 5 أيام عمل من تاريخ استلام الأوردر من العميل."
  ] : [
    "Exchanges or returns are available if the item is not suitable (unfitting size, fabric preference, or if it differs from expectations) within 7 days from the delivery date, provided the item is undamaged and in its original condition. (The customer bears the shipping fees for delivery and exchange/return).",
    "Important Note: Due to variations in body shapes, the chosen size may not fit perfectly. This is perfectly normal and is not considered an error by either party. Thus, we gladly provide flexible exchange and return options to ensure your absolute satisfaction.",
    "In the event of a manufacturing defect or an incorrect item being sent, the customer will not bear any shipping or exchange/return fees. (We highly recommend inspecting the items carefully upon receipt).",
    "In case of a refund: The due amount will be refunded (after inspecting the returned items to ensure safety and condition) via electronic wallets or bank transfer within 5 business days from the date we receive the package back."
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
        {isAr ? "سياسة الاستبدال والاسترجاع" : "Return & Exchange Policy"}
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