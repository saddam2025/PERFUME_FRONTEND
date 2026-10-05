// UserProfile.jsx
import { useState, useEffect } from "react";
import { Package, AlertCircle, Loader2, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import api from "../api/axios";
import { cn } from "../lib/cn";
import { formatPrice } from "../lib/formatPrice";

export default function UserProfile() {
  const { user } = useAuth();
  const { t, locale, isRTL } = useLanguage();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        // api interceptor automatically adds the JWT token from localStorage
        const response = await api.get("/orders/my-orders");
        if (isMounted) {
          setOrders(response.data?.orders || []);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
            t("userProfile.errorFetching") ||
            "Failed to load orders. Please try again later."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, [t]);

  const getStatusBadge = (status) => {
    const normalizedStatus = status?.toLowerCase() || "pending";

    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
      shipped: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
      delivered: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    };

    const currentStyle = styles[normalizedStatus] || "bg-slate-100 text-slate-800 border-slate-200";

    return (
      <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize", currentStyle)}>
        {t(`order.status.${normalizedStatus}`) || status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(dateString));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Profile Header */}
      <div className="mb-10 flex flex-col items-center gap-4 border-b border-line pb-10 sm:flex-row sm:items-start sm:gap-6">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-paper-dim border border-line text-ink">
          <User size={40} strokeWidth={1.5} />
        </div>
        <div className="text-center sm:text-start">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {user?.name || user?.firstName || t("userProfile.defaultName") || "Customer"}
          </h1>
          <p className="mt-1 text-sm text-slate">
            {user?.email}
          </p>
        </div>
      </div>

      {/* Orders Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-ink">
            {t("userProfile.myOrders") || "Order History"}
          </h2>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-paper-dim">
            <Loader2 className="animate-spin text-ink" size={32} />
            <p className="text-sm font-medium text-slate">
              {t("userProfile.loadingOrders") || "Loading your orders..."}
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="flex rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-400">
            <AlertCircle className={cn("mt-0.5 shrink-0", isRTL ? "ml-3" : "mr-3")} size={20} />
            <div className="text-sm font-medium">{error}</div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && orders.length === 0 && (
          <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-line bg-paper-dim text-center px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-paper text-slate">
              <Package size={32} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-ink">
                {t("userProfile.noOrders") || "No orders yet"}
              </h3>
              <p className="mt-1 max-w-sm text-sm text-slate">
                {t("userProfile.noOrdersDesc") || "When you place an order, it will show up here."}
              </p>
            </div>
          </div>
        )}

        {/* Orders Table */}
        {!loading && !error && orders.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-line bg-paper shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-sm">
                <thead className="bg-paper-dim border-b border-line text-xs uppercase tracking-wider text-slate">
                  <tr>
                    <th scope="col" className="whitespace-nowrap px-6 py-4 text-start font-semibold">
                      {t("order.id") || "Order ID"}
                    </th>
                    <th scope="col" className="whitespace-nowrap px-6 py-4 text-start font-semibold">
                      {t("order.date") || "Date"}
                    </th>
                    <th scope="col" className="whitespace-nowrap px-6 py-4 text-start font-semibold">
                      {t("order.total") || "Total"}
                    </th>
                    <th scope="col" className="whitespace-nowrap px-6 py-4 text-start font-semibold">
                      {t("order.statusTitle") || "Status"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line bg-paper">
                  {orders.map((order) => (
                    <tr
                      key={order._id || order.id}
                      className="transition-colors hover:bg-paper-dim/50"
                    >
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-ink">
                        #{String(order._id || order.id).slice(-6).toUpperCase()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate">
                        {formatDate(order.createdAt || order.date)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-semibold text-ink">
                        {formatPrice(order.totalOrderPrice ?? order.total, locale, t("common.currency"))}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}