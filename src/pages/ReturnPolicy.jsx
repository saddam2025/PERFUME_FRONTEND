import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function ReturnPolicy() {
  const { locale } = useLanguage();
  const isAr = locale === "ar";

  const paragraphs = isAr ? [
    "يمكن طلب الاستبدال أو الاسترجاع إذا لم يكن العطر مناسبًا أو اختلف عن المتوقع، خلال 7 أيام من الاستلام، بشرط بقاء المنتج سليمًا وفي حالته الأصلية. ويتحمل العميل مصاريف الشحن.",
    "تختلف تفضيلات الروائح من شخص لآخر؛ لذلك قد لا تناسبك الرائحة كما توقعت. نوفر خيارات الاستبدال أو الاسترجاع وفق الشروط الموضحة لضمان تجربة أفضل.",
    "في حالة وجود عيب أو استلام منتج خاطئ، لا يتحمل العميل مصاريف شحن الاستبدال أو الاسترجاع. يُرجى مراجعة الطلب عند الاستلام.",
    "في حالة الاسترجاع: يتم رد المبلغ المستحق (بعد مراجعة الأوردر للتأكد من سلامته) من خلال المحافظ الإلكترونية أو الحساب البنكي خلال 5 أيام عمل من تاريخ استلام الأوردر من العميل."
  ] : [
    "You may request an exchange or return if a fragrance is unsuitable or differs from expectations within 7 days of delivery, provided the product is undamaged and in its original condition. The customer bears the shipping fees.",
    "Fragrance preferences vary from person to person, so a scent may not suit you as expected. Exchange and return options are available under the terms listed here to support a better experience.",
    "If a product is defective or the wrong item was sent, the customer will not bear exchange or return shipping fees. Please check your order upon receipt.",
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
