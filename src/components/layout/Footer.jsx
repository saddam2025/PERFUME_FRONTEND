import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  // تعريف اللينكات هنا أضمن بمليون مرة عشان لو ملف الـ JSON باظ، اللينكات متختفيش
  const shopLinks = [
    { label: t("footer.tshirts") || "T-Shirts / تيشرتات", to: "/shop?type=t-shirt" },
    { label: t("footer.jackets") || "Jackets / جواكت", to: "/shop?type=jacket" },
    { label: t("footer.hoodies") || "Hoodies / هوديز", to: "/shop?type=hoodie" },
    { label: t("footer.pants") || "Pants / بناطيل", to: "/shop?type=pants" },
  ];

  const helpLinks = [
    { label: t("footer.shippingPolicy") || "Shipping Policy / سياسة الشحن", to: "/shipping-policy" },
    { label: t("footer.returnPolicy") || "Return Policy / سياسة الاستبدال والاسترجاع", to: "/return-policy" },
  ];

  const whatsappLinks = [
    {
      label: t("footer.whatsapp1") || "+20 106 036 9537",
      href: "https://wa.me/201060369537",
    },
    {
      label: t("footer.whatsapp2") || "+20 104 420 1267",
      href: "https://wa.me/201044201267",
    },
  ];

  return (
    <footer className="border-t border-line bg-paper text-right" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5 text-left md:text-right">
          
          {/* عمود اللوجو والتاغ لاين */}
          <div className="col-span-2 md:order-last">
            <span className="font-display text-lg font-black tracking-tightest">TORONTO</span>
            <p className="mt-3 max-w-xs text-sm text-slate">{t("footer.tagline")}</p>
          </div>

          {/* عمود تواصل معنا واتساب */}
          <div>
            <h3 className="label-tracked mb-4 text-ink font-bold">{t("footer.contactHeading") || "تواصل معنا"}</h3>
            <ul className="flex flex-col gap-3">
              {whatsappLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-slate transition-colors hover:text-ink"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 shrink-0 fill-current"
                      aria-hidden="true"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      <path d="M12.004 2c-5.514 0-9.997 4.483-9.997 9.997 0 1.762.462 3.488 1.34 5.006L2 22l5.13-1.345a9.95 9.95 0 0 0 4.872 1.27h.004c5.514 0 9.996-4.483 9.996-9.998 0-2.67-1.04-5.182-2.93-7.071A9.937 9.937 0 0 0 12.004 2zm0 18.166h-.003a8.17 8.17 0 0 1-4.166-1.14l-.299-.177-3.044.798.812-2.969-.195-.305a8.166 8.166 0 0 1-1.255-4.376c0-4.515 3.674-8.188 8.193-8.188 2.188 0 4.244.852 5.79 2.399a8.135 8.135 0 0 1 2.399 5.792c0 4.515-3.674 8.166-8.232 8.166z" />
                    </svg>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* عمود روابط المساعدة والسياسات */}
          <div>
            <h3 className="label-tracked mb-4 text-ink font-bold">{t("footer.helpHeading") || "الدعم والسياسات"}</h3>
            <ul className="flex flex-col gap-3">
              {helpLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-slate transition-colors hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* عمود الأقسام والمنتجات */}
          <div>
            <h3 className="label-tracked mb-4 text-ink font-bold">{t("footer.shopHeading") || "المتجر"}</h3>
            <ul className="flex flex-col gap-3">
              {shopLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-slate transition-colors hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* النيوزليتر */}
        <div className="mt-12 border-t border-line pt-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="label-tracked text-ink font-bold">{t("footer.newsletterHeading")}</h3>
              <p className="mt-1 text-sm text-slate">{t("footer.newsletterBody")}</p>
            </div>
            <form className="flex w-full max-w-sm gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                required
                placeholder={t("footer.emailPlaceholder")}
                className="w-full rounded-none border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-slate-light focus:border-ink"
              />
              <button
                type="submit"
                className="shrink-0 bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-opacity hover:opacity-85"
              >
                {t("footer.subscribe")}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-xs text-slate-light sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Toronto. {t("footer.rights")}</span>
        </div>
      </div>
    </footer>
  );
}