import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import logo from "../../assets/logo.png";

export default function Footer() {
  const { t, locale } = useLanguage();
  const isArabic = locale === "ar";
  const shopLinks = [
    { label: t("footer.tshirts"), to: "/shop?gender=men" },
    { label: t("footer.jackets"), to: "/shop?gender=women" },
    { label: t("footer.hoodies"), to: "/shop?gender=unisex" },
    { label: t("footer.sweaters"), to: "/shop?family=woody" },
    { label: t("footer.pants"), to: "/shop?family=floral" },
  ];
  const helpLinks = [
    { label: t("footer.shippingPolicy"), to: "/shipping-policy" },
    { label: t("footer.returnPolicy"), to: "/return-policy" },
  ];
  const whatsapp = t("footer.whatsapp1") || "+20 106 036 9537";
  const inlineList = "flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate";
  const linkStyle = "whitespace-nowrap transition-colors hover:text-ink";

  return (
    <footer className="border-t border-line bg-paper text-ink" dir={isArabic ? "rtl" : "ltr"}>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <img src={logo} alt="DEJA FRAGRANCES" className="h-7 w-auto max-w-24 shrink-0 object-contain" />
          <span className="max-w-40 text-[11px] text-slate">{t("footer.tagline")}</span>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <h2 className="shrink-0 text-[11px] font-bold">{t("footer.shopHeading")}</h2>
          <nav aria-label={t("footer.shopHeading")} className={inlineList}>
            {shopLinks.map((link) => <Link key={link.to} to={link.to} className={linkStyle}>{link.label}</Link>)}
          </nav>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <h2 className="shrink-0 text-[11px] font-bold">{t("footer.helpHeading")}</h2>
          <nav aria-label={t("footer.helpHeading")} className={inlineList}>
            {helpLinks.map((link) => <Link key={link.to} to={link.to} className={linkStyle}>{link.label}</Link>)}
          </nav>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate">
          <span className="font-semibold text-ink">{t("footer.contactHeading")}</span>
          <a href="https://wa.me/201060369537" target="_blank" rel="noopener noreferrer" dir="ltr" className={linkStyle}>{whatsapp}</a>
        </div>

        <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-line pt-2 text-[10px] text-slate">
          <span>{t("footer.designedBy")}</span>
          <span>{t("footer.startProject")} <a href="https://wa.me/201060369537" target="_blank" rel="noopener noreferrer" dir="ltr" className="font-semibold text-ink underline underline-offset-2">+201060369537</a></span>
          <span className="inline-flex items-center gap-1">© {new Date().getFullYear()} <img src={logo} alt="" className="h-3 w-auto max-w-10 object-contain" /> {t("footer.rights")}</span>
        </div>
      </div>
    </footer>
  );
}
