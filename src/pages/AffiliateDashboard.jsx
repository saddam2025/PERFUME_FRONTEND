import { useState } from "react";
import { Copy, Check, TrendingUp, ShoppingBag, Clock } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { formatPrice } from "../lib/formatPrice";
import { cn } from "../lib/cn";
import { affiliateProfile, affiliateSales } from "../data/mockDashboard";

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
  const styles = {
    paid: "border-ink text-ink",
    processing: "border-accent-deep text-accent-deep",
    pending: "border-slate-light text-slate",
  };
  const labels = {
    paid: t("affiliateDashboard.statusPaid"),
    processing: t("affiliateDashboard.statusProcessing"),
    pending: t("affiliateDashboard.statusPending"),
  };

  return (
    <span className={cn("label-tracked inline-flex border px-2 py-1", styles[status])}>
      {labels[status]}
    </span>
  );
}

export default function AffiliateDashboard() {
  const { t, locale } = useLanguage();
  const [copiedField, setCopiedField] = useState(null);

  const referralLink = `https://toronto.shop/shop?ref=${affiliateProfile.code}`;

  const handleCopy = (value, field) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1800);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="border-b border-line pb-6">
        <p className="label-tracked text-accent-deep">{t("affiliateDashboard.welcomeBack")}</p>
        <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tightest sm:text-4xl">
          {affiliateProfile.name}
        </h1>
      </div>

      {/* Metrics */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          icon={TrendingUp}
          label={t("affiliateDashboard.totalEarnings")}
          value={formatPrice(affiliateProfile.totalEarnings, locale, t("common.currency"))}
        />
        <MetricCard
          icon={ShoppingBag}
          label={t("affiliateDashboard.totalOrders")}
          value={affiliateProfile.totalOrders}
        />
        <MetricCard
          icon={Clock}
          label={t("affiliateDashboard.pendingPayouts")}
          value={formatPrice(affiliateProfile.pendingPayouts, locale, t("common.currency"))}
        />
      </div>

      {/* Coupon code card */}
      <div className="mt-8 border border-line p-6">
        <h2 className="label-tracked text-ink">{t("affiliateDashboard.yourCode")}</h2>
        <p className="mt-1.5 text-sm text-slate">{t("affiliateDashboard.shareHint")}</p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center justify-between border border-ink bg-paper-dim px-4 py-3">
            <span className="font-display text-lg font-bold tracking-tightest">
              {affiliateProfile.code}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(affiliateProfile.code, "code")}
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

        {affiliateSales.length === 0 ? (
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
                {affiliateSales.map((sale) => (
                  <tr key={sale.orderId} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 text-sm font-medium text-ink">{sale.orderId}</td>
                    <td className="px-4 py-3 text-sm text-slate">{sale.date}</td>
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
