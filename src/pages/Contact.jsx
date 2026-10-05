import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function Contact() {
  const { t, locale } = useLanguage();
  const [formData, setFormData] = useState({ fullName: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Contact sent:", formData);
    setSubmitted(true);
    setFormData({ fullName: "", email: "", message: "" });
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="border border-line bg-paper p-6 sm:p-8">
        <h1 className="font-display text-xl font-bold uppercase tracking-wider text-ink mb-2">
          {t("contact.title")}
        </h1>
        <p className="text-xs text-slate mb-6">
          {t("contact.body")}
        </p>

        {submitted && (
          <div className="mb-4 border border-green-200 bg-green-50 p-3 text-xs text-green-700 font-medium text-center">
            {t("contact.successMessage")}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-semibold text-slate mb-1">
              {t("contact.fullName")}
            </label>
            <input
              type="text"
              className="w-full border border-line bg-paper px-3 py-2 text-sm focus:border-ink outline-none"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-semibold text-slate mb-1">
              {t("contact.email")}
            </label>
            <input
              type="email"
              className="w-full border border-line bg-paper px-3 py-2 text-sm focus:border-ink outline-none"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-semibold text-slate mb-1">
              {t("contact.message")}
            </label>
            <textarea
              rows="4"
              className="w-full border border-line bg-paper px-3 py-2 text-sm focus:border-ink outline-none resize-none"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              required
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full bg-ink text-paper py-2.5 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            {t("contact.send")}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-line text-xs text-slate space-y-1">
          <p><strong>{t("contact.emailInfoLabel")}</strong> support@toronto.com</p>
          <p><strong>{t("contact.hqInfoLabel")}</strong> {t("contact.hqValue")}</p>
        </div>
      </div>
    </div>
  );
}