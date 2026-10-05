// frontend/src/pages/AffiliateJoin.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, TrendingUp, Link2, Banknote, ArrowRight, ArrowLeft } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { cn } from "../lib/cn";

const CODE_REGEX = /^[A-Za-z0-9]{3,20}$/;

const PAYMENT_METHODS = [
  {
    value: "Vodafone Cash",
    labelKey: "affiliate.paymentMethodVodafone",
    accountHintKey: "affiliate.paymentAccountHintVodafone",
    accountLabelKey: "affiliate.paymentAccountNumberPhone",
  },
  {
    value: "InstaPay",
    labelKey: "affiliate.paymentMethodInstapay",
    accountHintKey: "affiliate.paymentAccountHintInstapay",
    accountLabelKey: "affiliate.paymentAccountNumberInstapay",
  },
  {
    value: "Bank Transfer",
    labelKey: "affiliate.paymentMethodBank",
    accountHintKey: "affiliate.paymentAccountHintBank",
    accountLabelKey: "affiliate.paymentAccountNumberBank",
  },
];

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
  const { isAuthenticated, role } = useAuth();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    proposedCode: "",
    paymentInfo: "",
    paymentAccountNumber: "",
    audienceLink: "",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const selectedMethod = PAYMENT_METHODS.find((m) => m.value === form.paymentInfo) || null;

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handlePaymentMethodChange = (e) => {
    setForm((prev) => ({ ...prev, paymentInfo: e.target.value, paymentAccountNumber: "" }));
    setErrors((prev) => ({ ...prev, paymentInfo: undefined, paymentAccountNumber: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!form.fullName.trim()) nextErrors.fullName = t("affiliate.fieldRequired");
    if (!form.email.trim()) nextErrors.email = t("affiliate.fieldRequired");
    if (!form.phone.trim()) nextErrors.phone = t("affiliate.fieldRequired");
    if (!form.paymentInfo.trim()) nextErrors.paymentInfo = t("affiliate.fieldRequired");
    if (!form.paymentAccountNumber.trim()) nextErrors.paymentAccountNumber = t("affiliate.fieldRequired");
    if (!form.audienceLink.trim()) nextErrors.audienceLink = t("affiliate.fieldRequired");
    if (!form.proposedCode.trim()) {
      nextErrors.proposedCode = t("affiliate.fieldRequired");
    } else if (!CODE_REGEX.test(form.proposedCode.trim())) {
      nextErrors.proposedCode = t("affiliate.codeInvalid");
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitError("");
    setSubmitting(true);

    try {
      await api.post("/affiliates/apply", {
        customCodeRequested: form.proposedCode.trim().toUpperCase(),
        phoneNumber: form.phone.trim(),
        socialMediaLinks: [form.audienceLink.trim()],
        preferredPaymentMethod: form.paymentInfo,
        paymentAccountNumber: form.paymentAccountNumber.trim(),
      });
      setSubmitted(true);
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message || "";

      if (status === 409) {
        setSubmitError(t("affiliate.alreadyPendingBody"));
      } else if (status === 400 && message.toLowerCase().includes("code")) {
        setErrors((prev) => ({ ...prev, proposedCode: message }));
      } else {
        setSubmitError(message || t("affiliate.submitError"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { title: t("affiliate.step1Title"), body: t("affiliate.step1Body"), icon: Link2 },
    { title: t("affiliate.step2Title"), body: t("affiliate.step2Body"), icon: TrendingUp },
    { title: t("affiliate.step3Title"), body: t("affiliate.step3Body"), icon: Banknote },
  ];

  const benefits = t("affiliate.benefits");

  const renderApplySection = () => {
    if (submitted) {
      return (
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
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="flex flex-col items-center border border-line p-10 text-center">
          <h2 className="font-display text-2xl font-extrabold tracking-tightest">
            {t("affiliate.loginRequiredTitle")}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-slate">{t("affiliate.loginRequiredBody")}</p>
          <Link to="/login" className="mt-6 border-b border-ink pb-0.5 text-sm font-semibold text-ink">
            {t("auth.signInButton")}
          </Link>
        </div>
      );
    }

    if (role === "Affiliate") {
      return (
        <div className="flex flex-col items-center border border-line p-10 text-center">
          <h2 className="font-display text-2xl font-extrabold tracking-tightest">
            {t("affiliate.alreadyAffiliateTitle")}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-slate">{t("affiliate.alreadyAffiliateBody")}</p>
          <Link
            to="/affiliate/dashboard"
            className="mt-6 border-b border-ink pb-0.5 text-sm font-semibold text-ink"
          >
            {t("affiliate.goToDashboard")}
          </Link>
        </div>
      );
    }

    if (role !== "Customer") {
      return (
        <div className="flex flex-col items-center border border-line p-10 text-center">
          <h2 className="font-display text-2xl font-extrabold tracking-tightest">
            {t("admin.restrictedTitle")}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-slate">{t("admin.restrictedBody")}</p>
        </div>
      );
    }

    return (
      <>
        <h2 className="font-display text-2xl font-extrabold tracking-tightest sm:text-3xl">
          {t("affiliate.formTitle")}
        </h2>
        <p className="mt-2 text-sm text-slate">{t("affiliate.formBody")}</p>

        {submitError && (
          <div className="mt-5 border border-red-700 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {submitError}
          </div>
        )}

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
            <select
              value={form.paymentInfo}
              onChange={handlePaymentMethodChange}
              className={cn(
                "w-full border bg-paper px-3 py-2.5 text-sm text-ink focus:border-ink",
                errors.paymentInfo ? "border-red-700" : "border-line"
              )}
            >
              <option value="">{t("affiliate.selectPaymentMethod")}</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {t(method.labelKey)}
                </option>
              ))}
            </select>
          </FormField>

          {selectedMethod && (
            <FormField
              label={t(selectedMethod.accountLabelKey)}
              hint={t(selectedMethod.accountHintKey)}
              error={errors.paymentAccountNumber}
            >
              <input
                type="text"
                value={form.paymentAccountNumber}
                onChange={handleChange("paymentAccountNumber")}
                placeholder={t(selectedMethod.accountLabelKey)}
                className={cn(
                  "w-full border bg-paper px-3 py-2.5 text-sm text-ink focus:border-ink",
                  errors.paymentAccountNumber ? "border-red-700" : "border-line"
                )}
              />
            </FormField>
          )}

          <FormField label={t("affiliate.audienceLink")} error={errors.audienceLink}>
            <input
              type="text"
              value={form.audienceLink}
              onChange={handleChange("audienceLink")}
              className={cn(
                "w-full border bg-paper px-3 py-2.5 text-sm text-ink focus:border-ink",
                errors.audienceLink ? "border-red-700" : "border-line"
              )}
            />
          </FormField>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 flex items-center justify-center gap-2 bg-ink py-3.5 text-sm font-semibold uppercase tracking-wide text-paper transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("affiliate.submit")}
          </button>
        </form>
      </>
    );
  };

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

          {/* Fixed Link Section */}
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
        {renderApplySection()}
      </section>
    </div>
  );
}