import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { cn } from "../lib/cn";
import api from "../api/axios";

const TRANSLATIONS = {
  en: {
    title: "Analytics Dashboard",
    subtitle: "Sales and profit breakdown across normal and affiliate orders.",
    backToDashboard: "Back to Dashboard",
    fromDate: "From Date",
    toDate: "To Date",
    apply: "Apply",
    affiliateSales: "Affiliate Sales",
    normalSales: "Normal Sales",
    affiliateNetProfit: "Affiliate Net Profit",
    normalNetProfit: "Normal Net Profit",
    combinedNetProfit: "Combined Net Profit",
    orderId: "Order ID",
    date: "Date",
    buyer: "Buyer",
    orderType: "Order Type",
    totalAmount: "Total Amount",
    netProfit: "Net Profit",
    status: "Status",
    affiliate: "Affiliate",
    normal: "Normal",
    loading: "Loading analytics...",
    empty: "No orders found for the selected date range.",
    errorPrefix: "Failed to load analytics:",
    retry: "Retry",
    selectDatesMessage: "Please select both From Date and To Date.",
    restrictedTitle: "Manager Access Only",
    restrictedBody: "You don't have permission to view this page.",
  },
  ar: {
    title: "لوحة التحليلات",
    subtitle: "تفاصيل المبيعات والأرباح للطلبات العادية وطلبات المسوقين.",
    backToDashboard: "العودة للوحة التحكم",
    fromDate: "من تاريخ",
    toDate: "إلى تاريخ",
    apply: "تطبيق",
    affiliateSales: "مبيعات الأفلييت",
    normalSales: "المبيعات العادية",
    affiliateNetProfit: "صافي ربح الأفلييت",
    normalNetProfit: "صافي الربح العادي",
    combinedNetProfit: "صافي الربح الإجمالي",
    orderId: "رقم الطلب",
    date: "التاريخ",
    buyer: "المشتري",
    orderType: "نوع الطلب",
    totalAmount: "الإجمالي",
    netProfit: "صافي الربح",
    status: "الحالة",
    affiliate: "أفلييت",
    normal: "عادي",
    loading: "جاري تحميل التحليلات...",
    empty: "لا توجد طلبات في الفترة المحددة.",
    errorPrefix: "فشل تحميل التحليلات:",
    retry: "إعادة المحاولة",
    selectDatesMessage: "من فضلك اختر تاريخ البداية والنهاية.",
    restrictedTitle: "للمدير فقط",
    restrictedBody: "ليس لديك صلاحية لعرض هذه الصفحة.",
  },
};

const STATUS_STYLES = {
  Pending: "border-slate-light text-slate",
  Shipped: "border-accent-deep text-accent-deep",
  Delivered: "border-ink bg-ink text-paper",
  Cancelled: "border-red-700 text-red-700",
};

const formatCurrency = (value) =>
  (Number(value) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value, locale) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
};

function SummaryCard({ label, value, accentClass }) {
  return (
    <div className="flex flex-col gap-1 border border-line bg-paper p-4 sm:p-5">
      <span className="label-tracked text-xs text-slate">{label}</span>
      <span className={cn("text-xl sm:text-2xl font-bold", accentClass)}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function RestrictedNotice({ t }) {
  return (
    <div className="flex flex-col items-center border border-dashed border-line p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-paper-dim">
        <Lock size={18} strokeWidth={1.75} className="text-slate" />
      </div>
      <h3 className="font-display mt-4 text-lg font-bold tracking-tightest text-ink">
        {t.restrictedTitle}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-slate">{t.restrictedBody}</p>
    </div>
  );
}

export default function ManagerAnalytics() {
  const { role } = useAuth();
  const { locale } = useLanguage();
  const isRTL = locale === "ar";
  const dir = isRTL ? "rtl" : "ltr";
  const t = TRANSLATIONS[locale] || TRANSLATIONS.en;
  const BackArrowIcon = isRTL ? ArrowRight : ArrowLeft;

  // NOTE: ManagerDashboard.jsx currently hardcodes `currentRole = ROLES.OWNER`
  // as a placeholder until real auth/role decoding lands. This guard mirrors
  // that same "owner/manager only" intent using useAuth()'s role so the page
  // self-protects once real roles are wired through AuthContext.
  const isManager = !role || role === "owner" || role === "manager" || role === "Manager";

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const monthAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }, []);

  const [fromDate, setFromDate] = useState(monthAgoStr);
  const [toDate, setToDate] = useState(todayStr);
  const [appliedRange, setAppliedRange] = useState({
    startDate: monthAgoStr,
    endDate: todayStr,
  });

  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async ({ startDate, endDate }) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/admin/analytics", {
        params: { startDate, endDate },
      });
      setAnalytics(data.analytics || null);
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Unknown error"
      );
      setAnalytics(null);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isManager) return;
    fetchAnalytics(appliedRange);
  }, [appliedRange, fetchAnalytics, isManager]);

  const handleApply = (e) => {
    e.preventDefault();
    if (!fromDate || !toDate) return;
    setAppliedRange({ startDate: fromDate, endDate: toDate });
  };

  const handleRetry = () => {
    fetchAnalytics(appliedRange);
  };

  const summaryCards = [
    {
      label: t.affiliateSales,
      value: analytics?.totalAffiliateSales,
      accentClass: "text-ink",
    },
    {
      label: t.normalSales,
      value: analytics?.totalNormalSales,
      accentClass: "text-ink",
    },
    {
      label: t.affiliateNetProfit,
      value: analytics?.affiliateNetProfit,
      accentClass: "text-accent-deep",
    },
    {
      label: t.normalNetProfit,
      value: analytics?.normalNetProfit,
      accentClass: "text-accent-deep",
    },
    {
      label: t.combinedNetProfit,
      value: analytics?.combinedNetProfit,
      accentClass: "text-ink font-extrabold",
    },
  ];

  const getOrderType = (order) => (order.affiliateId ? t.affiliate : t.normal);

  const getOrderNetProfit = (order) => {
    // Per-order net profit isn't returned directly by the API, so we
    // recompute it consistently with the backend's formula using the
    // populated product fields on each item.
    const isAffiliate = !!order.affiliateId;
    return (order.items || []).reduce((sum, item) => {
      const product = item.productId;
      if (!product || typeof product !== "object") return sum;
      const base = product.baseProfitPerPiece || 0;
      const commission = product.affiliateCommission || 0;
      const discount = product.productDiscount || 0;
      const perPiece = isAffiliate ? base - commission - discount : base;
      return sum + perPiece * (item.quantity || 0);
    }, 0);
  };

  const getBuyerName = (order) =>
    order.customerId?.name || order.customerId?.email || "—";

  if (!isManager) {
    return (
      <div dir={dir} className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <RestrictedNotice t={t} />
      </div>
    );
  }

  return (
    <div dir={dir} className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate hover:text-ink"
          >
            <BackArrowIcon size={14} strokeWidth={1.75} />
            {t.backToDashboard}
          </Link>
          <h1 className="font-display mt-3 text-2xl font-bold tracking-tightest text-ink sm:text-3xl">
            {t.title}
          </h1>
          <p className="mt-2 text-sm text-slate">{t.subtitle}</p>
        </div>

        <form
          onSubmit={handleApply}
          className="flex flex-col gap-4 border border-line bg-paper p-4 sm:flex-row sm:items-end sm:p-5"
        >
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-sm font-medium text-slate">
              {t.fromDate}
            </label>
            <input
              type="date"
              value={fromDate}
              max={toDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-sm font-medium text-slate">
              {t.toDate}
            </label>
            <input
              type="date"
              value={toDate}
              min={fromDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink"
            />
          </div>
          <button
            type="submit"
            disabled={!fromDate || !toDate}
            className="inline-flex items-center justify-center bg-ink px-5 py-2 text-sm font-semibold text-paper transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t.apply}
          </button>
        </form>

        {(!fromDate || !toDate) && (
          <p className="text-sm text-accent-deep">{t.selectDatesMessage}</p>
        )}

        {error && (
          <div className="flex flex-col gap-3 border border-red-700 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <p className="text-sm font-medium text-red-700">
              {t.errorPrefix} {error}
            </p>
            <button
              onClick={handleRetry}
              className="self-start bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85 sm:self-auto"
            >
              {t.retry}
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center border border-line bg-paper-dim py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-ink" />
              <p className="text-sm text-slate">{t.loading}</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {summaryCards.map((card) => (
                <SummaryCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  accentClass={card.accentClass}
                />
              ))}
            </div>

            <div className="overflow-x-auto border border-line">
              {orders.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate">
                  {t.empty}
                </div>
              ) : (
                <table className="w-full min-w-[880px] text-start">
                  <thead>
                    <tr className="border-b border-line bg-paper-dim">
                      <th className="label-tracked px-4 py-3 text-start text-slate">
                        {t.orderId}
                      </th>
                      <th className="label-tracked px-4 py-3 text-start text-slate">
                        {t.date}
                      </th>
                      <th className="label-tracked px-4 py-3 text-start text-slate">
                        {t.buyer}
                      </th>
                      <th className="label-tracked px-4 py-3 text-start text-slate">
                        {t.orderType}
                      </th>
                      <th className="label-tracked px-4 py-3 text-end text-slate">
                        {t.totalAmount}
                      </th>
                      <th className="label-tracked px-4 py-3 text-end text-slate">
                        {t.netProfit}
                      </th>
                      <th className="label-tracked px-4 py-3 text-start text-slate">
                        {t.status}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const isAffiliate = !!order.affiliateId;
                      const netProfit = getOrderNetProfit(order);
                      return (
                        <tr
                          key={order._id}
                          className="border-b border-line last:border-0 transition-colors hover:bg-paper-dim/50"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-ink">
                            #{String(order._id).slice(-8)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-slate">
                            {formatDate(order.createdAt, locale)}
                          </td>
                          <td className="px-4 py-3 text-sm text-ink">
                            {getBuyerName(order)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span
                              className={cn(
                                "label-tracked inline-flex border px-2 py-1",
                                isAffiliate
                                  ? "border-accent-deep text-accent-deep"
                                  : "border-slate-light text-slate"
                              )}
                            >
                              {getOrderType(order)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-end text-sm font-semibold text-ink">
                            {formatCurrency(order.totalOrderPrice)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-end text-sm font-semibold text-accent-deep">
                            {formatCurrency(netProfit)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span
                              className={cn(
                                "label-tracked inline-flex border px-2 py-1",
                                STATUS_STYLES[order.status] ||
                                  "border-slate-light text-slate"
                              )}
                            >
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
