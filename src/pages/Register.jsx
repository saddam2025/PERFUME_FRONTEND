import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { cn } from "../lib/cn";

export default function Register() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const requestedReturnTo = location.state?.returnTo || location.state?.from?.pathname || location.state?.from;
  const returnTo = typeof requestedReturnTo === "string" && requestedReturnTo.startsWith("/") && !requestedReturnTo.startsWith("//")
    ? requestedReturnTo
    : null;
  const { login } = useAuth();

  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!form.fullName.trim()) nextErrors.fullName = t("auth.fieldRequired");
    if (!form.email.trim()) nextErrors.email = t("auth.fieldRequired");
    if (!form.password.trim()) nextErrors.password = t("auth.fieldRequired");
    if (!form.confirmPassword.trim()) {
      nextErrors.confirmPassword = t("auth.fieldRequired");
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = t("auth.passwordMismatch");
    }
    if (!agreed) nextErrors.agreed = t("auth.fieldRequired");

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post("/auth/register", {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      login(data.token, data.user);

      if (returnTo) {
        navigate(returnTo, { replace: true });
      } else if (data.user?.role === "Manager" || data.user?.role === "Admin") {
        navigate("/admin");
      } else {
        navigate("/shop");
      }
    } catch (err) {
      const message = err.response?.data?.message;
      setErrors({ form: message || t("auth.fieldRequired") });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <div className="text-center">
        <span className="font-display text-2xl font-black tracking-tightest">TORONTO</span>
        <h1 className="font-display mt-5 text-2xl font-extrabold tracking-tightest">
          {t("auth.signUpTitle")}
        </h1>
        <p className="mt-2 text-sm text-slate">{t("auth.signUpBody")}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-9 flex flex-col gap-5">
        {errors.form && (
          <p className="border border-red-700 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">
            {errors.form}
          </p>
        )}

        <div>
          <label htmlFor="fullName" className="mb-1.5 block text-xs font-medium text-slate">
            {t("auth.fullName")}
          </label>
          <input
            id="fullName"
            type="text"
            value={form.fullName}
            onChange={handleChange("fullName")}
            className={cn(
              "w-full border bg-paper px-3 py-2.5 text-sm text-ink focus:border-ink",
              errors.fullName ? "border-red-700" : "border-line"
            )}
          />
          {errors.fullName && <p className="mt-1.5 text-xs font-medium text-red-700">{errors.fullName}</p>}
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate">
            {t("auth.email")}
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            className={cn(
              "w-full border bg-paper px-3 py-2.5 text-sm text-ink focus:border-ink",
              errors.email ? "border-red-700" : "border-line"
            )}
          />
          {errors.email && <p className="mt-1.5 text-xs font-medium text-red-700">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-slate">
            {t("auth.password")}
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange("password")}
              className={cn(
                "w-full border bg-paper px-3 py-2.5 text-sm text-ink focus:border-ink",
                errors.password ? "border-red-700" : "border-line"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-slate hover:text-ink"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs font-medium text-red-700">{errors.password}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-medium text-slate">
            {t("auth.confirmPassword")}
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={form.confirmPassword}
            onChange={handleChange("confirmPassword")}
            className={cn(
              "w-full border bg-paper px-3 py-2.5 text-sm text-ink focus:border-ink",
              errors.confirmPassword ? "border-red-700" : "border-line"
            )}
          />
          {errors.confirmPassword && (
            <p className="mt-1.5 text-xs font-medium text-red-700">{errors.confirmPassword}</p>
          )}
        </div>

        <div>
          <label className="flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked);
                setErrors((prev) => ({ ...prev, agreed: undefined }));
              }}
              className="mt-0.5 h-4 w-4 shrink-0 rounded-none border border-line text-ink accent-ink"
            />
            <span className="text-sm text-ink">{t("auth.agreeToTerms")}</span>
          </label>
          {errors.agreed && <p className="mt-1.5 text-xs font-medium text-red-700">{errors.agreed}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 flex items-center justify-center bg-ink py-3 text-sm font-semibold uppercase tracking-wide text-paper transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("auth.signUpButton")}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-slate">
        {t("auth.haveAccount")}{" "}
        <Link to="/login" state={returnTo ? { returnTo } : undefined} className="font-semibold text-ink underline-offset-2 hover:underline">
          {t("auth.signInLink")}
        </Link>
      </p>
    </div>
  );
}
