import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, TrendingUp, Link2, Banknote, ArrowRight, ArrowLeft } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { cn } from "../lib/cn";

const CODE_REGEX = /^[A-Za-z0-9]{3,20}$/;

function FormField({ label, hint, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate">{label}</label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-slate-light">{hint}</p>}
      {error && <p className="mt-1.5 text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}

export default function AffiliateJoin() {
  const { t, isRTL } = useLanguage();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    proposedCode: "",
    paymentInfo: "",
    audienceLink: "",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!form.fullName.trim()) nextErrors.fullName = t("affiliate.fieldRequired");
    if (!form.email.trim()) nextErrors.email = t("affiliate.fieldRequired");
    if (!form.phone.trim()) nextErrors.phone = t("affiliate.fieldRequired");
    if (!form.paymentInfo.trim()) nextErrors.paymentInfo = t("affiliate.fieldRequired");
    if (!form.proposedCode.trim()) {
      nextErrors.proposedCode = t("affiliate.fieldRequired");
    } else if (!CODE_REGEX.test(form.proposedCode.trim())) {
      nextErrors.proposedCode = t("affiliate.codeInvalid");
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    // The live submission hits POST /affiliate-applications, which the backend
    // validates again server-side (code uniqueness, format) before creating
    // an AffiliateApplication for Manager/Admin review.
    setSubmitted(true);
  };

  const steps = [
    { title: t("affiliate.step1Title"), body: t("affiliate.step1Body"), icon: Link2 },
    { title: t("affiliate.step2Title"), body: t("affiliate.step2Body"), icon: TrendingUp },
    { title: t("affiliate.step3Title"), body: t("affiliate.step3Body"), icon: Banknote },
  ];

  const benefits = t("affiliate.benefits");

  return (
    <div>
      {/* Hero / marketing section */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="label-tracked text-accent-deep">{t("affiliate.eyebrow")}</p>
          <h1 className="font-display mt-4 max-w-2xl text-4xl font-black leading-[0.95] tracking-tightest sm:text-5xl lg:text-6xl">
            {t("affiliate.title")}
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate sm:text-base">
            {t("affiliate.body")}
          </p>
          <a
            href="#apply"
            className="mt-7 inline-flex items-center gap-2 bg-ink px-7 py-3.5 text-sm font-semibold text-paper transition-opacity hover:opacity-85"
          >
            {t("affiliate.joinCta")}
            <ArrowIcon size={16} strokeWidth={2} />
          </a>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <h2 className="label-tracked text-ink">{t("affiliate.howItWorks")}</h2>
        <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="border-t border-line pt-5">
                <div className="flex items-center gap-3">
                  <Icon size={18} strokeWidth={1.75} className="text-accent-deep" />
                  <h3 className="font-display text-lg font-bold tracking-tightest">{step.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate">{step.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Benefits */}
      <section className="border-y border-line bg-paper-dim">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <h2 className="font-display text-2xl font-extrabold tracking-tightest sm:text-3xl">
            {t("affiliate.benefitsTitle")}
          </h2>
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink">
                  <Check size={12} strokeWidth={2.5} className="text-paper" />
                </span>
                <span className="text-sm text-ink">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Application form */}
      <section id="apply" className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20">
        {submitted ? (
          <div className="flex flex-col items-center border border-line p-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink">
              <Check size={24} strokeWidth={2.5} className="text-paper" />
            </div>
            <h2 className="font-display mt-5 text-2xl font-extrabold tracking-tightest">
              {t("affiliate.submitted")}
            </h2>
            <p className="mt-2 max-w-sm text-sm text-slate">{t("affiliate.submittedBody")}</p>
            <Link to="/" className="mt-6 border-b border-ink pb-0.5 text-sm font-semibold text-ink">
              {t("orderSuccess.continueShopping")}
            </Link>
          </div>
        ) : (
          <>
            <h2 className="font-display text-2xl font-extrabold tracking-tightest sm:text-3xl">
              {t("affiliate.formTitle")}
            </h2>
            <p className="mt-2 text-sm text-slate">{t("affiliate.formBody")}</p>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
              <FormField label={t("affiliate.fullName")} error={errors.fullName}>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={handleChange("fullName")}
                  className={cn(
                    "w-full border bg-paper px-3 py-2.5 text-sm text-ink focus:border-ink",
                    errors.fullName ? "border-red-700" : "border-line"
                  )}
                />
              </FormField>

              <FormField label={t("affiliate.email")} error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  className={cn(
                    "w-full border bg-paper px-3 py-2.5 text-sm text-ink focus:border-ink",
                    errors.email ? "border-red-700" : "border-line"
                  )}
                />
              </FormField>

              <FormField label={t("affiliate.phone")} error={errors.phone}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  className={cn(
                    "w-full border bg-paper px-3 py-2.5 text-sm text-ink focus:border-ink",
                    errors.phone ? "border-red-700" : "border-line"
                  )}
                />
              </FormField>

              <FormField
                label={t("affiliate.proposedCode")}
                hint={t("affiliate.proposedCodeHint")}
                error={errors.proposedCode}
              >
                <input
                  type="text"
                  value={form.proposedCode}
                  onChange={handleChange("proposedCode")}
                  placeholder="TORONTO10"
                  className={cn(
                    "w-full border bg-paper px-3 py-2.5 text-sm uppercase text-ink placeholder:normal-case placeholder:text-slate-light focus:border-ink",
                    errors.proposedCode ? "border-red-700" : "border-line"
                  )}
                />
              </FormField>

              <FormField
                label={t("affiliate.paymentInfo")}
                hint={t("affiliate.paymentInfoHint")}
                error={errors.paymentInfo}
              >
                <input
                  type="text"
                  value={form.paymentInfo}
                  onChange={handleChange("paymentInfo")}
                  className={cn(
                    "w-full border bg-paper px-3 py-2.5 text-sm text-ink focus:border-ink",
                    errors.paymentInfo ? "border-red-700" : "border-line"
                  )}
                />
              </FormField>

              <FormField label={t("affiliate.audienceLink")}>
                <input
                  type="text"
                  value={form.audienceLink}
                  onChange={handleChange("audienceLink")}
                  className="w-full border border-line bg-paper px-3 py-2.5 text-sm text-ink focus:border-ink"
                />
              </FormField>

              <button
                type="submit"
                className="mt-2 flex items-center justify-center gap-2 bg-ink py-3.5 text-sm font-semibold uppercase tracking-wide text-paper transition-opacity hover:opacity-85"
              >
                {t("affiliate.submit")}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
