// frontend/src/pages/AffiliateDashboard.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Check, TrendingUp, ShoppingBag, Clock, Wallet } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { formatPrice } from "../lib/formatPrice";
import { cn } from "../lib/cn";

function MetricCard({ icon: Icon, label, value }) {
  return (
    <div className="border border-line p-5">
      <div className="flex items-center gap-2 text-slate">
        <Icon size={15} strokeWidth={1.75} />
        <span className="label-tracked">{label}</span>
      </div>
      <p className="font-display mt-3 text-2xl font-extrabold tracking-tightest sm:text-3xl">{value}</p>
    </div>
  );
}

function StatusBadge({ status, t }) {
  const key = (status || "").toLowerCase();
  const styles = {
    pending: "border-slate-light text-slate",
    shipped: "border-accent-deep text-accent-deep",
    delivered: "border-ink text-ink",
  };

  return (
    <span className={cn("label-tracked inline-flex border px-2 py-1", styles[key] || styles.pending)}>
      {t(`order.status.${key}`)}
    </span>
  );
}

function SalesChart({ data, t, locale }) {
  const max = Math.max(1, ...data.map((point) => point.sales));
  const monthFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", { month: "short" });

  return (
    <div className="border border-line p-6">
      <h2 className="label-tracked text-ink">{t("affiliateDashboard.chartTitle")}</h2>
      <div className="mt-6 flex items-end gap-3 sm:gap-4" style={{ height: 180 }}>
        {data.map((point, idx) => {
          const heightPct = Math.max(4, Math.round((point.sales / max) * 100));
          const label = monthFormatter.format(new Date(point.year, point.month - 1, 1));
          return (
            <div key={idx} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <span className="text-[11px] font-semibold text-slate">
                {point.sales > 0 ? formatPrice(point.sales, locale, t("common.currency")) : ""}
              </span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full bg-ink transition-all"
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span className="label-tracked text-slate-light">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AffiliateDashboard() {
  const { t, locale } = useLanguage();
  const { role } = useAuth();
  const [copiedField, setCopiedField] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (role !== "Affiliate") {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .get("/affiliates/dashboard")
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.status === 404 ? "no-profile" : "error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [role]);

  const handleCopy = (value, field) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1800);
  };

  if (role !== "Affiliate") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-extrabold tracking-tightest">
          {t("admin.restrictedTitle")}
        </h1>
        <p className="mt-2 text-sm text-slate">{t("admin.restrictedBody")}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <p className="text-sm text-slate">{t("affiliateDashboard.loading")}</p>
      </div>
    );
  }

  if (error === "no-profile") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-extrabold tracking-tightest">
          {t("affiliateDashboard.noProfileTitle")}
        </h1>
        <p className="mt-2 text-sm text-slate">{t("affiliateDashboard.noProfileBody")}</p>
        <Link
          to="/affiliate/join"
          className="mt-6 inline-block border-b border-ink pb-0.5 text-sm font-semibold text-ink"
        >
          {t("affiliateDashboard.applyNow")}
        </Link>
      </div>
    );
  }

  if (error === "error" || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <p className="text-sm text-slate">{t("affiliateDashboard.errorFetching")}</p>
      </div>
    );
  }

  const referralLink = `${typeof window !== "undefined" ? window.location.origin : ""}/shop?ref=${
    data.profile.code
  }`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="border-b border-line pb-6">
        <p className="label-tracked text-accent-deep">{t("affiliateDashboard.welcomeBack")}</p>
        <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tightest sm:text-4xl">
          {data.profile.code}
        </h1>
      </div>

      {/* Metrics */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={TrendingUp}
          label={t("affiliateDashboard.totalEarnings")}
          value={formatPrice(data.totalSales, locale, t("common.currency"))}
        />
        <MetricCard
          icon={ShoppingBag}
          label={t("affiliateDashboard.totalOrders")}
          value={data.totalOrders}
        />
        <MetricCard
          icon={Clock}
          label={t("affiliateDashboard.pendingPayouts")}
          value={formatPrice(data.pendingEarnings, locale, t("common.currency"))}
        />
        <MetricCard
          icon={Wallet}
          label={t("affiliateDashboard.withdrawableBalance")}
          value={formatPrice(data.withdrawableBalance, locale, t("common.currency"))}
        />
      </div>

      {/* Sales chart */}
      <div className="mt-8">
        <SalesChart data={data.monthlySales} t={t} locale={locale} />
      </div>

      {/* Coupon code card */}
      <div className="mt-8 border border-line p-6">
        <h2 className="label-tracked text-ink">{t("affiliateDashboard.yourCode")}</h2>
        <p className="mt-1.5 text-sm text-slate">{t("affiliateDashboard.shareHint")}</p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center justify-between border border-ink bg-paper-dim px-4 py-3">
            <span className="font-display text-lg font-bold tracking-tightest">
              {data.profile.code}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(data.profile.code, "code")}
              className="flex items-center gap-1.5 text-xs font-semibold text-ink hover:opacity-70"
            >
              {copiedField === "code" ? (
                <>
                  <Check size={14} strokeWidth={2.5} />
                  {t("affiliateDashboard.copied")}
                </>
              ) : (
                <>
                  <Copy size={14} strokeWidth={1.75} />
                  {t("affiliateDashboard.copyCode")}
                </>
              )}
            </button>
          </div>

          <div className="flex flex-1 items-center justify-between border border-line bg-paper px-4 py-3">
            <span className="truncate text-sm text-slate">{referralLink}</span>
            <button
              type="button"
              onClick={() => handleCopy(referralLink, "link")}
              className="ms-3 flex shrink-0 items-center gap-1.5 text-xs font-semibold text-ink hover:opacity-70"
            >
              {copiedField === "link" ? (
                <>
                  <Check size={14} strokeWidth={2.5} />
                  {t("affiliateDashboard.copied")}
                </>
              ) : (
                <>
                  <Copy size={14} strokeWidth={1.75} />
                  {t("affiliateDashboard.copyLink")}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Recent sales table */}
      <div className="mt-8">
        <h2 className="label-tracked text-ink">{t("affiliateDashboard.recentSales")}</h2>

        {data.recentOrders.length === 0 ? (
          <p className="mt-4 text-sm text-slate">{t("affiliateDashboard.noSales")}</p>
        ) : (
          <div className="mt-4 overflow-x-auto border border-line">
            <table className="w-full min-w-[640px] text-start">
              <thead>
                <tr className="border-b border-line bg-paper-dim">
                  <th className="label-tracked px-4 py-3 text-start text-slate">
                    {t("affiliateDashboard.orderId")}
                  </th>
                  <th className="label-tracked px-4 py-3 text-start text-slate">
                    {t("affiliateDashboard.date")}
                  </th>
                  <th className="label-tracked px-4 py-3 text-start text-slate">
                    {t("affiliateDashboard.orderValue")}
                  </th>
                  <th className="label-tracked px-4 py-3 text-start text-slate">
                    {t("affiliateDashboard.commission")}
                  </th>
                  <th className="label-tracked px-4 py-3 text-start text-slate">
                    {t("affiliateDashboard.status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((sale) => (
                  <tr key={sale.orderId} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 text-sm font-medium text-ink">
                      #{String(sale.orderId).slice(-6).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate">
                      {new Date(sale.date).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-ink">
                      {formatPrice(sale.orderValue, locale, t("common.currency"))}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-accent-deep">
                      {formatPrice(sale.commission, locale, t("common.currency"))}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={sale.status} t={t} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}