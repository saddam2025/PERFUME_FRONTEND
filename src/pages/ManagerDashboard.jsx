// ManagerDashboard.jsx
import { Package, Users, Boxes, Check, X, Pencil, Tag, Plus, Trash2, Lock, ChevronDown, ChevronUp, BarChart3, Save } from "lucide-react";
import { Link } from "react-router-dom";
import React from "react"; 
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { formatPrice } from "../lib/formatPrice";
import { cn } from "../lib/cn";
import api from "../api/axios";
import { CLOTHING_COLORS, getColorKey, normalizeColorOption } from "../constants/clothingColors";
const ROLES = {
  OWNER: "Manager",
  ADMIN: "Admin",
};

const TABS = {
  ORDERS: "orders",
  AFFILIATES: "affiliates",
  USERS: "users",
  AFFILIATE_LEDGER: "affiliate_ledger",
  PRODUCTS: "products",
};

const PERMITTED_TABS = {
  [ROLES.OWNER]: [TABS.ORDERS, TABS.AFFILIATES, TABS.PRODUCTS, TABS.USERS, TABS.AFFILIATE_LEDGER],
  [ROLES.ADMIN]: [TABS.ORDERS, TABS.PRODUCTS],
};

function RestrictedNotice() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center border border-dashed border-line p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-paper-dim">
        <Lock size={18} strokeWidth={1.75} className="text-slate" />
      </div>
      <h3 className="font-display mt-4 text-lg font-bold tracking-tightest">{t("admin.restrictedTitle")}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-slate">{t("admin.restrictedBody")}</p>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-semibold transition-colors whitespace-nowrap",
        active ? "border-ink text-ink" : "border-transparent text-slate hover:text-ink"
      )}
    >
      <Icon size={16} strokeWidth={1.75} />
      {label}
    </button>
  );
}

const ORDER_STATUSES = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];
function OrderStatusBadge({ status, t }) {
  const styles = {
    Pending: "border-slate-light text-slate",
    Shipped: "border-accent-deep text-accent-deep",
    Delivered: "border-ink bg-ink text-paper",
    Cancelled: "border-red-700 text-red-700",
  };
  return (
    <span className={cn("label-tracked inline-flex border px-2 py-1", styles[status] || styles.Pending)}>
      {t(`admin.status${status}`)}
    </span>
  );
}

function OrdersTab() {
  const { t, locale } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [withPromotions, setWithPromotions] = useState(false);

  const fetchOrders = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/orders", { params: withPromotions ? { withPromotions: true } : {} });
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(locale === "ar" ? "فشل تحميل الطلبات" : "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [locale, withPromotions]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (orderId, status) => {
    try {
      setUpdatingId(orderId);
      // Assumed path based on the existing comment in orderRoutes.js
      // ("PUT /api/admin/orders/:id/status intentionally lives in
      // adminRoutes.js") — confirm this matches your actual adminRoutes.js.
      await api.put(`/admin/orders/${orderId}/status`, { status });
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status } : o)));
    } catch (err) {
      console.error("Error updating order status:", err);
      alert(locale === "ar" ? "فشل تحديث حالة الطلب" : "Failed to update order status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleExpand = (orderId) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-slate animate-pulse">
        {locale === "ar" ? "جاري تحميل الطلبات..." : "Loading orders..."}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-sm font-medium text-red-700 bg-red-50 border border-red-200 p-4">
        {error}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div>
      <label className="mb-4 flex items-center gap-2 text-sm text-slate">
        <input type="checkbox" checked={withPromotions} onChange={(event) => setWithPromotions(event.target.checked)} />
        {locale === "ar" ? "الطلبات التي تحتوي على عروض فقط" : "Orders with promotions"}
      </label>
      <p className="border border-dashed border-line p-8 text-center text-sm text-slate">
        {locale === "ar" ? "لا توجد طلبات مطابقة." : "No matching orders."}
      </p>
      </div>
    );
  }

  return (
    <>
    <label className="mb-4 flex items-center gap-2 text-sm text-slate">
      <input type="checkbox" checked={withPromotions} onChange={(event) => setWithPromotions(event.target.checked)} />
      {locale === "ar" ? "الطلبات التي تحتوي على عروض فقط" : "Orders with promotions"}
    </label>
    <div className="overflow-x-auto border border-line">
      <table className="w-full min-w-[880px] text-start">
        <thead>
          <tr className="border-b border-line bg-paper-dim">
            <th className="w-10 px-4 py-3"></th>
            <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.orderId")}</th>
            <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.customer")}</th>
            <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.date")}</th>
            <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.items")}</th>
            <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.total")}</th>
            <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.status")}</th>
            <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.updateStatus")}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order._id;
            const itemCount = (order.items || []).reduce((sum, i) => sum + i.quantity, 0);

            return (
              <React.Fragment key={order._id}>
                <tr className="border-b border-line last:border-0 hover:bg-paper-dim/50 transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => toggleExpand(order._id)} className="text-slate hover:text-ink">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-ink">
                    #{String(order._id).slice(-8)}
                    {order.appliedPromotions?.length > 0 && <span className="ms-2 bg-accent px-1.5 py-0.5 text-[10px] font-bold text-ink">{locale === "ar" ? "عرض" : "OFFER"}</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink">
                    {order.customerId?.name || order.customerId?.email || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate">{itemCount}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-ink">
                    {formatPrice(order.totalOrderPrice, locale, t("common.currency"))}
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} t={t} />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      disabled={updatingId === order._id}
                      onChange={(e) => updateStatus(order._id, e.target.value)}
                      className="border border-line bg-paper px-2.5 py-1.5 text-xs text-ink focus:border-ink disabled:opacity-50"
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {t(`admin.status${status}`)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>

                {isExpanded && (
                  <tr className="bg-paper-dim/30 border-b border-line">
                    <td colSpan="8" className="px-14 py-4">
                      <div className="flex flex-col gap-4 text-sm">
                        <div className="flex flex-wrap gap-8">
                          <div>
                            <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-1">
                              {locale === "ar" ? "مصدر الأوردر" : "Order Source"}
                            </span>
                            <span className="font-medium text-ink">
                              {order.affiliateId
                                ? locale === "ar"
                                  ? `أفلييت: ${order.affiliateId.name || order.affiliateId.email}`
                                  : `Affiliate: ${order.affiliateId.name || order.affiliateId.email}`
                                : locale === "ar"
                                ? "عميل مباشر"
                                : "Customer Direct"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-1">
                              {locale === "ar" ? "خصم العميل" : "Customer Discount"}
                            </span>
                            <span className="font-medium text-ink">
                              {formatPrice(order.totalDiscount || 0, locale, t("common.currency"))}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-1">
                              {locale === "ar" ? "عمولة المسوق" : "Affiliate Commission"}
                            </span>
                            <span className="font-medium text-ink">
                              {formatPrice(order.totalAffiliateCommission || 0, locale, t("common.currency"))}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-8">
                        <div>
                          <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-1">
                            {locale === "ar" ? "طريقة الدفع" : "Payment Method"}
                          </span>
                          <span className="font-medium text-ink">{order.paymentMethod} · {order.paymentStatus}</span>
                        </div>
                        <div>
                          <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-1">
                            {locale === "ar" ? "بيانات الشحن" : "Shipping Info"}
                          </span>
                          <span className="font-medium text-ink">
                            {order.shippingDetails?.name || "—"} · {order.shippingDetails?.phone || "—"}
                          </span>
                          <div className="text-xs text-slate mt-0.5">
                            {order.shippingDetails?.address || ""} {order.shippingDetails?.city ? `, ${order.shippingDetails.city}` : ""}
                          </div>
                        </div>
                      </div>

                        <div>
                          <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-2">
                            {locale === "ar" ? "تفاصيل المنتجات" : "Line Items"}
                          </span>
                          <ul className="grid gap-2">
                            {(order.items || []).map((item, idx) => (
                              <li key={idx} className="flex items-center gap-4 border border-line bg-paper px-3 py-2">
                          <span className="font-semibold text-ink min-w-[30px]">{item.quantity}x</span>
                          <span className="text-ink flex-1">
                            {item.name}
                            {(item.size || item.color) && (
                              <span className="text-xs text-slate ms-2">
                                {item.size ? `Size: ${item.size}` : ""}{item.size && item.color ? " · " : ""}{item.color ? `Color: ${item.color}` : ""}
                              </span>
                            )}
                          </span>
                          <span className="text-slate text-xs">{formatPrice(item.price, locale, t("common.currency"))}</span>
                        </li>
                            ))}
                          </ul>
                        </div>
                        {order.appliedPromotions?.length > 0 && <div className="border border-accent/40 bg-accent/10 p-3"><p className="mb-2 text-xs font-bold uppercase tracking-wider">{locale === "ar" ? "العروض المطبقة" : "Applied promotions"}</p><ul className="space-y-2">{order.appliedPromotions.map((promotion, promotionIndex) => <li key={`${promotion.promotionId || promotion.name}-${promotionIndex}`} className="text-sm"><span className="font-semibold">{promotion.name}</span> · {promotion.ruleDescription}<span className="ms-2 text-accent-deep">−{formatPrice(promotion.discountAmount || 0, locale, t("common.currency"))}</span>{promotion.freeItems?.length > 0 && <p className="mt-1 text-xs text-slate">{locale === "ar" ? "قطع مجانية" : "Free items"}: {promotion.freeItems.map((entry) => `${entry.quantity}× ${entry.name} ${entry.size || ""} ${entry.color || ""}`).join(" · ")}</p>}</li>)}</ul></div>}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
    </>
  );
}
function AffiliateRequestsTab() {
  const { t, locale } = useLanguage();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [decisions, setDecisions] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError("");
      // status=Pending is the fix: without it, the backend returns every
      // application ever submitted (Approved + Rejected included), which
      // is why decided applications kept reappearing after a refresh —
      // they were never actually gone, just filtered out of local state
      // until the next fetch pulled them back in.
      const response = await api.get("/admin/applications", { params: { status: "Pending" } });
      setApplications(response.data.applications || response.data || []);
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError(locale === "ar" ? "فشل في تحميل طلبات الأفيليت" : "Failed to load affiliate applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleDecision = async (id, decision) => {
  try {
    setDecisions((prev) => ({ ...prev, [id]: decision }));
    await api.put(`/admin/applications/${id}/${decision === "approved" ? "approve" : "reject"}`);
    setTimeout(() => {
      setApplications((prev) => prev.filter((app) => app._id !== id && app.id !== id));
      setExpandedId((prev) => (prev === id ? null : prev));
    }, 900);
  } catch (err) {
    console.error("Error saving decision:", err);
    // FIX: surface the real backend message instead of a generic alert —
    // this is the only way to actually diagnose why approve is failing.
    const realMessage = err.response?.data?.message || err.message || "Unknown error";
    alert(locale === "ar" ? `فشل حفظ القرار: ${realMessage}` : `Error saving decision: ${realMessage}`);
    setDecisions((prev) => ({ ...prev, [id]: null }));
  }
};

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-slate animate-pulse">
        {locale === "ar" ? "جاري تحميل الطلبات..." : "Loading applications..."}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-sm font-medium text-red-700 bg-red-50 border border-red-200 p-4">
        {error}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <p className="border border-dashed border-line p-8 text-center text-sm text-slate">
        {t("admin.noApplicants")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {applications.map((app) => {
        const appId = app._id || app.id;
        const decision = decisions[appId];
        const isExpanded = expandedId === appId;

        // userId comes back populated from the backend as an object
        // ({ name, email, role }), not flat fields on the application
        // itself — this is what was making the name/email show blank.
        const applicantName = app.userId?.name || app.name || (locale === "ar" ? "بدون اسم" : "No name on file");
        const applicantEmail = app.userId?.email || app.email || "-";

        return (
          <div
            key={appId}
            className={cn(
              "border border-line transition-opacity",
              decision && "opacity-50"
            )}
          >
            <div
              role="button"
              tabIndex={0}
              onClick={() => toggleExpand(appId)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") toggleExpand(appId);
              }}
              className="flex w-full cursor-pointer flex-col gap-4 p-5 text-start sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-ink">{applicantName}</h3>
                  <span className="label-tracked border border-line px-2 py-0.5 text-slate">
                    {app.customCodeRequested || app.proposedCode}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate">{applicantEmail}</p>
                <p className="mt-1 text-xs text-slate-light">
                  {t("admin.appliedOn")}: {new Date(app.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {decision ? (
                  <span
                    className={cn(
                      "label-tracked flex items-center gap-1.5 px-2 py-1",
                      decision === "approved" ? "text-ink" : "text-red-700"
                    )}
                  >
                    {decision === "approved" ? (
                      <>
                        <Check size={13} strokeWidth={2.5} /> {t("admin.approved")}
                      </>
                    ) : (
                      <>
                        <X size={13} strokeWidth={2.5} /> {t("admin.rejected")}
                      </>
                    )}
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDecision(appId, "rejected")}
                      className="flex items-center gap-1.5 border border-line px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:border-red-700 hover:text-red-700"
                    >
                      <X size={14} strokeWidth={2} /> {t("admin.reject")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision(appId, "approved")}
                      className="flex items-center gap-1.5 bg-ink px-3.5 py-2 text-xs font-semibold text-paper transition-opacity hover:opacity-85"
                    >
                      <Check size={14} strokeWidth={2} /> {t("admin.approve")}
                    </button>
                  </>
                )}
                {isExpanded ? (
                  <ChevronUp size={18} className="text-slate" />
                ) : (
                  <ChevronDown size={18} className="text-slate" />
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-line bg-paper-dim/40 px-5 py-4">
                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-1">
                      {locale === "ar" ? "الاسم الكامل" : "Full Name"}
                    </span>
                    <span className="font-medium text-ink">{applicantName}</span>
                  </div>
                  <div>
                    <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-1">
                      {locale === "ar" ? "البريد الإلكتروني" : "Email"}
                    </span>
                    <span className="font-medium text-ink">{applicantEmail}</span>
                  </div>
                  <div>
                    <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-1">
                      {t("affiliate.phone")}
                    </span>
                    <span className="font-medium text-ink">{app.phoneNumber || "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-1">
                      {t("affiliate.proposedCode")}
                    </span>
                    <span className="font-medium text-ink">{app.customCodeRequested || "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-1">
                      {t("affiliate.paymentInfo")}
                    </span>
                    <span className="font-medium text-ink">{app.preferredPaymentMethod || "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-1">
                      {locale === "ar" ? "رقم الحساب / المحفظة" : "Payment Account Number"}
                    </span>
                    <span className="font-medium text-ink">{app.paymentAccountNumber || "-"}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-1">
                      {locale === "ar" ? "روابط التواصل الاجتماعي" : "Social / Audience Links"}
                    </span>
                    {Array.isArray(app.socialMediaLinks) && app.socialMediaLinks.length > 0 ? (
                      <ul className="mt-1 flex flex-col gap-1">
                        {app.socialMediaLinks.map((link, idx) => (
                          <li key={idx} className="font-medium text-ink break-all">
                            {link}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="font-medium text-ink">-</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-1">
                      {locale === "ar" ? "حالة الطلب" : "Status"}
                    </span>
                    <span className="font-medium text-ink">{app.status || "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-1">
                      {t("admin.appliedOn")}
                    </span>
                    <span className="font-medium text-ink">
                      {new Date(app.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function UserDetailModal({ userId, onClose }) {
  const { t, locale } = useLanguage();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await api.get(`/admin/users/${userId}`);
        if (!cancelled) setDetail(data);
      } catch (err) {
        console.error("Error fetching user detail:", err);
        if (!cancelled) setError(locale === "ar" ? "فشل تحميل بيانات المستخدم" : "Failed to load user details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [userId, locale]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto border border-line bg-paper p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="font-display text-lg font-bold tracking-tightest text-ink">
            {locale === "ar" ? "بيانات المستخدم" : "User Details"}
          </h3>
          <button onClick={onClose} className="text-slate hover:text-ink">
            <X size={20} />
          </button>
        </div>

        {loading && (
          <div className="py-10 text-center text-sm text-slate animate-pulse">
            {locale === "ar" ? "جاري التحميل..." : "Loading..."}
          </div>
        )}

        {error && (
          <div className="mt-4 border border-red-700 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && detail && (
          <div className="mt-4 flex flex-col gap-4 text-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-1">
                  {t("managerDashboard.fullName")}
                </span>
                <span className="font-medium text-ink">{detail.user.name}</span>
              </div>
              <div>
                <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-1">
                  {t("managerDashboard.email")}
                </span>
                <span className="font-medium text-ink">{detail.user.email}</span>
              </div>
              <div>
                <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-1">
                  {t("managerDashboard.role")}
                </span>
                <span className="font-medium text-ink">{detail.user.role}</span>
              </div>
              <div>
                <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-1">
                  {t("managerDashboard.status")}
                </span>
                <span className="font-medium text-ink">{detail.user.status}</span>
              </div>
              <div>
                <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-1">
                  {locale === "ar" ? "تاريخ الانضمام" : "Joined"}
                </span>
                <span className="font-medium text-ink">
                  {new Date(detail.user.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-1">
                  {locale === "ar" ? "عدد الطلبات" : "Order Count"}
                </span>
                <span className="font-medium text-ink">{detail.orderCount}</span>
              </div>
            </div>

            {detail.affiliateProfile && (
              <div className="border-t border-line pt-4">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-accent-deep">
                  {locale === "ar" ? "بيانات المسوق" : "Affiliate Details"}
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-1">
                      {t("affiliate.proposedCode")}
                    </span>
                    <span className="font-medium text-ink">{detail.affiliateProfile.customCode}</span>
                  </div>
                  <div>
                    <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-1">
                      {t("affiliate.phone")}
                    </span>
                    <span className="font-medium text-ink">{detail.affiliateProfile.phoneNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-1">
                      {t("affiliate.paymentInfo")}
                    </span>
                    <span className="font-medium text-ink">{detail.affiliateProfile.preferredPaymentMethod}</span>
                  </div>
                  <div>
                    <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-1">
                      {locale === "ar" ? "رقم الحساب / المحفظة" : "Payment Account Number"}
                    </span>
                    <span className="font-medium text-ink">{detail.affiliateProfile.paymentAccountNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-1">
                      {locale === "ar" ? "الرصيد قيد الانتظار" : "Pending Balance"}
                    </span>
                    <span className="font-medium text-ink">
                      {formatPrice(detail.affiliateProfile.pendingBalance, locale, t("common.currency"))}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-1">
                      {t("affiliateDashboard.withdrawableBalance")}
                    </span>
                    <span className="font-medium text-ink">
                      {formatPrice(detail.affiliateProfile.withdrawableBalance, locale, t("common.currency"))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {detail.orders && detail.orders.length > 0 && (
              <div className="border-t border-line pt-4">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate">
                  {locale === "ar" ? "آخر الطلبات" : "Recent Orders"}
                </h4>
                <ul className="flex flex-col gap-2">
                  {detail.orders.slice(0, 5).map((order) => (
                    <li
                      key={order._id}
                      className="flex items-center justify-between border border-line px-3 py-2"
                    >
                      <span className="text-xs text-slate">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-xs font-semibold text-ink">
                        {formatPrice(order.totalOrderPrice, locale, t("common.currency"))}
                      </span>
                      <span className="text-xs text-slate">{order.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function UsersManagementTab() {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/admin/users");
      if (response.data && response.data.users) {
        setUsers(response.data.users);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(t("managerDashboard.errorUsers"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === "suspended" ? "active" : "suspended";
    try {
      setActionLoading(userId);
      await api.put(`/admin/users/${userId}/status`, { status: nextStatus });
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user._id === userId ? { ...user, status: nextStatus } : user))
      );
    } catch (err) {
      console.error("Error updating user status:", err);
      alert(t("managerDashboard.statusError"));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-slate animate-pulse">
        {t("managerDashboard.loadingUsers")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-sm font-medium text-red-700 bg-red-50 border border-red-200 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto border border-line bg-paper">
        <table className="w-full text-start text-sm">
          <thead>
            <tr className="border-b border-line bg-paper-dim text-xs font-semibold uppercase tracking-wider text-slate">
              <th className="px-4 py-3 text-start">{t("managerDashboard.fullName")}</th>
              <th className="px-4 py-3 text-start">{t("managerDashboard.email")}</th>
              <th className="px-4 py-3 text-start">{t("managerDashboard.role")}</th>
              <th className="px-4 py-3 text-start">{t("managerDashboard.affiliateCode")}</th>
              <th className="px-4 py-3 text-start">{t("managerDashboard.totalSales")}</th>
              <th className="px-4 py-3 text-start">{t("managerDashboard.status")}</th>
              <th className="px-4 py-3 text-center">{t("managerDashboard.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-paper-dim/40 transition-colors">
                <td className="whitespace-nowrap px-4 py-3.5 font-medium text-ink">
                  <button
                    type="button"
                    onClick={() => setSelectedUserId(user._id)}
                    className="underline decoration-dotted underline-offset-2 hover:text-accent-deep"
                  >
                    {user.name}
                  </button>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-slate">{user.email}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-xs">
                  <span className="inline-flex rounded-full bg-slate/10 px-2.5 py-0.5 font-semibold text-slate">
                    {user.role}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm font-mono text-ink">
                  {user.code || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-slate">
                  {user.role === "Affiliate" ? `${user.totalSales || 0} EGP` : "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-xs">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 font-semibold ${
                      user.status === "suspended" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                    }`}
                  >
                    {user.status === "suspended" ? t("managerDashboard.suspended") : t("managerDashboard.active")}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-center text-xs">
                  {user.role === "Manager" ? (
                    <span className="text-slate-light italic">🔒 {t("managerDashboard.active")}</span>
                  ) : (
                    <button
                      onClick={() => handleToggleStatus(user._id, user.status)}
                      disabled={actionLoading === user._id}
                      className={`min-w-[90px] border px-2.5 py-1 font-semibold transition-colors disabled:opacity-50 ${
                        user.status === "suspended"
                          ? "border-green-700 bg-paper text-green-700 hover:bg-green-50"
                          : "border-red-700 bg-paper text-red-700 hover:bg-red-50"
                      }`}
                    >
                      {actionLoading === user._id
                        ? "..."
                        : user.status === "suspended"
                        ? t("managerDashboard.activate")
                        : t("managerDashboard.suspend")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUserId && (
        <UserDetailModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </div>
  );
}
const TOPS_SIZE_GUIDE_URL = "/The-Upper-Body.jpg";
const PANTS_SIZE_GUIDE_URL = "/The-Lower-Body.jpg";

const PRODUCT_TYPE_OPTIONS = [
  { value: "t-shirt", labelEn: "T-Shirt", labelAr: "تيشيرت" },
  { value: "jacket", labelEn: "Jacket", labelAr: "جاكيت" },
  { value: "hoodie", labelEn: "Hoodie", labelAr: "هودي" },
  { value: "pants", labelEn: "Pants", labelAr: "بنطلون" },
];

const TOPS_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const PANTS_SIZES = ["32", "34", "36", "38", "40", "42"];

function getSizeScaleForType(productType) {
  return productType === "pants" ? PANTS_SIZES : TOPS_SIZES;
}

function getSizeGuideUrlForType(productType) {
  return productType === "pants" ? PANTS_SIZE_GUIDE_URL : TOPS_SIZE_GUIDE_URL;
}

function buildEmptyStockState(sizeScale) {
  return sizeScale.reduce((acc, size) => {
    acc[size] = "";
    return acc;
  }, {});
}

function ProductForm({ initialData = null, onSave, onCancel }) {
  const { locale, t } = useLanguage();
  const [allCollections, setAllCollections] = useState([]);

  useEffect(() => {
    async function fetchCollections() {
      try {
        const { data } = await api.get("/collections");
        setAllCollections(data?.data?.collections || []);
      } catch (e) {
        console.error("Failed to fetch collections", e);
      }
    }
    fetchCollections();
  }, []);

  const [form, setForm] = useState({
    nameEn: initialData?.nameEn || "",
    nameAr: initialData?.nameAr || "",
    descriptionEn: initialData?.descEn || "",
    descriptionAr: initialData?.descAr || "",
    productType: initialData?.category || "t-shirt",
    price: initialData?.price || "",
    compareAtPrice: initialData?.compareAtPrice || "",
    baseProfitPerPiece: initialData?.baseProfitPerPiece || "",
    affiliateCommission: initialData?.affiliateCommission || "",
    productDiscount: initialData?.productDiscount || "",
    collections: initialData?.collections || [],
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [sizeScale, setSizeScale] = useState(getSizeScaleForType(form.productType));
  const [bulkMode, setBulkMode] = useState(true);
  const [bulkQuantity, setBulkQuantity] = useState("");
  const [stockBySize, setStockBySize] = useState(() => {
    if (initialData?.stockBySize) {
      return { ...buildEmptyStockState(getSizeScaleForType(initialData.category || "t-shirt")), ...initialData.stockBySize };
    }
    return buildEmptyStockState(getSizeScaleForType("t-shirt"));
  });
  const [trackStockByColor, setTrackStockByColor] = useState(Boolean(initialData?.stockByVariant && Object.keys(initialData.stockByVariant).length));
  const [stockByVariant, setStockByVariant] = useState(() => ({ ...(initialData?.stockByVariant || {}) }));
  const [selectedColors, setSelectedColors] = useState(() => (initialData?.colors || []).map(normalizeColorOption));
  const [colorSearch, setColorSearch] = useState("");
  const [customColorName, setCustomColorName] = useState("");
  const [customColorHex, setCustomColorHex] = useState("#9CA3AF");
  const colorOptions = selectedColors.map(getColorKey);
  const filteredColors = CLOTHING_COLORS.filter((color) =>
    `${color.nameEn} ${color.nameAr} ${(color.aliases || []).join(" ")}`.toLocaleLowerCase().includes(colorSearch.trim().toLocaleLowerCase())
  );

  const [submitting, setSubmitting] = useState(false);
  const submitInFlight = useRef(false);
  const [submitError, setSubmitError] = useState(null);

  const handleProductTypeChange = (nextType) => {
    const nextScale = getSizeScaleForType(nextType);
    setSizeScale(nextScale);
    setStockBySize(buildEmptyStockState(nextScale));
    setStockByVariant({});
    setBulkQuantity("");
    setForm((prev) => ({ ...prev, productType: nextType }));
  };

  const handleFieldChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const toggleColor = (color) => {
    const normalized = normalizeColorOption(color);
    setSelectedColors((previous) => previous.some((selected) => getColorKey(selected) === getColorKey(normalized))
      ? previous.filter((selected) => getColorKey(selected) !== getColorKey(normalized))
      : [...previous, normalized]);
  };

  const addCustomColor = () => {
    const name = customColorName.trim() || colorSearch.trim();
    if (!name) return;
    const customColor = normalizeColorOption({ name, hex: customColorHex });
    setSelectedColors((previous) => previous.some((selected) => getColorKey(selected) === getColorKey(customColor))
      ? previous
      : [...previous, customColor]);
    setCustomColorName("");
    setColorSearch("");
  };

  const toggleCollection = (collectionId) => {
    setForm((prev) => {
      const nextCollections = prev.collections.includes(collectionId)
        ? prev.collections.filter(id => id !== collectionId)
        : [...prev.collections, collectionId];
      return { ...prev, collections: nextCollections };
    });
  };

  const handleBulkQuantityChange = (e) => {
    const value = e.target.value;
    setBulkQuantity(value);
    setStockBySize((prev) => {
      const next = { ...prev };
      sizeScale.forEach((size) => {
        next[size] = value;
      });
      return next;
    });
  };

  const handlePerSizeChange = (size) => (e) => {
    setStockBySize((prev) => ({ ...prev, [size]: e.target.value }));
  };

  const handleVariantStockChange = (size, color) => (event) => {
    setStockByVariant((previous) => ({ ...previous, [`${size}::${color}`]: event.target.value }));
  };

  const handleBulkModeToggle = (isBulk) => {
    setBulkMode(isBulk);
    if (isBulk) {
      setStockBySize((prev) => {
        const next = { ...prev };
        sizeScale.forEach((size) => {
          next[size] = bulkQuantity;
        });
        return next;
      });
    }
  };

  const resetForm = () => {
    const nextScale = getSizeScaleForType("t-shirt");
    setForm({
      nameEn: "", nameAr: "", descriptionEn: "", descriptionAr: "",
      productType: "t-shirt", price: "", compareAtPrice: "",
      baseProfitPerPiece: "", affiliateCommission: "", productDiscount: "", collections: []
    });
    setSelectedColors([]);
    setColorSearch("");
    setImageFiles([]);
    setSizeScale(nextScale);
    setStockBySize(buildEmptyStockState(nextScale));
    setStockByVariant({});
    setTrackStockByColor(false);
    setBulkMode(true);
    setBulkQuantity("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitInFlight.current) return;
    setSubmitError(null);

    if (!form.nameEn.trim() || !form.nameAr.trim() || !form.price) {
      setSubmitError(locale === "ar" ? "الاسم بالإنجليزية والعربية والسعر حقول مطلوبة." : "English name, Arabic name, and price are required.");
      return;
    }

    if (!initialData && imageFiles.length === 0) {
      setSubmitError(locale === "ar" ? "يرجى اختيار صورة واحدة على الأقل للمنتج." : "Please choose at least one product image.");
      return;
    }

    if (form.compareAtPrice && Number(form.compareAtPrice) <= Number(form.price)) {
      setSubmitError(t("admin.originalPriceMustExceed"));
      return;
    }

    const colorsPayload = selectedColors.map((color) => ({ name: color.nameEn, nameEn: color.nameEn, nameAr: color.nameAr, hex: color.hex || color.swatch }));
    if (trackStockByColor && (!colorsPayload.length || !sizeScale.length)) {
      setSubmitError(locale === "ar" ? "أضف مقاسًا ولونًا لتحديد مخزون كل تركيبة." : "Add sizes and colors to track variant stock.");
      return;
    }
    const stockByVariantPayload = trackStockByColor ? Object.fromEntries(sizeScale.flatMap((size) => colorOptions.map((color) => [`${size}::${color}`, Number(stockByVariant[`${size}::${color}`]) || 0])).filter(([, quantity]) => quantity > 0)) : {};
    const stockBySizePayload = trackStockByColor
      ? sizeScale.reduce((acc, size) => { const sum = colorOptions.reduce((value, color) => value + (Number(stockByVariant[`${size}::${color}`]) || 0), 0); if (sum > 0) acc[size] = sum; return acc; }, {})
      : sizeScale.filter((size) => Number(stockBySize[size]) > 0).reduce((acc, size) => { acc[size] = Number(stockBySize[size]) || 0; return acc; }, {});
    const totalStock = Object.values(trackStockByColor ? stockByVariantPayload : stockBySizePayload).reduce((sum, quantity) => sum + quantity, 0);
    const activeSizes = sizeScale.filter((size) => Number(stockBySizePayload[size]) > 0);

    const formData = new FormData();
    formData.append("nameEn", form.nameEn.trim());
    formData.append("nameAr", form.nameAr.trim());
    formData.append("descEn", form.descriptionEn.trim() || form.nameEn.trim());
    formData.append("descAr", form.descriptionAr.trim() || form.nameAr.trim());
    formData.append("price", String(Number(form.price) || 0));
    formData.append("compareAtPrice", form.compareAtPrice ? String(Number(form.compareAtPrice)) : "");
    formData.append("category", form.productType);
    formData.append("colors", JSON.stringify(colorsPayload));
    formData.append("sizes", JSON.stringify(activeSizes));
    formData.append("stockBySize", JSON.stringify(stockBySizePayload));
    formData.append("stockByVariant", JSON.stringify(stockByVariantPayload));
    formData.append("stock", String(totalStock));
    formData.append("sizeGuideImageUrl", getSizeGuideUrlForType(form.productType));
    formData.append("isLatestArrival", "true");
    formData.append("baseProfitPerPiece", String(Number(form.baseProfitPerPiece) || 0));
    formData.append("affiliateCommission", String(Number(form.affiliateCommission) || 0));
    formData.append("productDiscount", String(Number(form.productDiscount) || 0));
    formData.append("collections", JSON.stringify(form.collections));

    imageFiles.forEach(file => {
      formData.append("images", file);
    });

    submitInFlight.current = true;
    setSubmitting(true);
    try {
      if (initialData) {
        const { data } = await api.put(`/products/${initialData._id}`, formData, { headers: { "Content-Type": "multipart/form-data" }});
        onSave(data?.data?.product || data?.product);
      } else {
        const { data } = await api.post("/products", formData, { headers: { "Content-Type": "multipart/form-data" }});
        onSave(data?.data?.product || data?.product);
        resetForm();
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || (locale === "ar" ? "حدث خطأ أثناء الحفظ." : "Something went wrong saving."));
    } finally {
      submitInFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 border border-line bg-paper p-4 sm:p-5 relative">
      {initialData && (
        <button type="button" onClick={onCancel} className="absolute top-4 right-4 text-slate hover:text-ink">
          <X size={20} />
        </button>
      )}
      <h3 className="font-semibold text-lg">{initialData ? (locale === 'ar' ? 'تعديل منتج' : 'Edit Product') : (locale === 'ar' ? 'إضافة منتج' : 'Add Product')}</h3>
      {submitError && (
        <p className="border border-red-700 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">
          {submitError}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input type="text" placeholder={locale === "ar" ? "اسم المنتج (إنجليزي)" : "Product Name (English)"} value={form.nameEn} onChange={handleFieldChange("nameEn")} className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink" />
        <input type="text" placeholder={locale === "ar" ? "اسم المنتج (عربي)" : "Product Name (Arabic)"} value={form.nameAr} onChange={handleFieldChange("nameAr")} dir="rtl" className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <textarea rows={2} placeholder={locale === "ar" ? "الوصف (إنجليزي)" : "Description (English)"} value={form.descriptionEn} onChange={handleFieldChange("descriptionEn")} className="resize-none border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink" />
        <textarea rows={2} placeholder={locale === "ar" ? "الوصف (عربي)" : "Description (Arabic)"} value={form.descriptionAr} onChange={handleFieldChange("descriptionAr")} dir="rtl" className="resize-none border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select value={form.productType} onChange={(e) => handleProductTypeChange(e.target.value)} className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink">
          {PRODUCT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{locale === "ar" ? opt.labelAr : opt.labelEn}</option>
          ))}
        </select>
        <input type="number" min={0} placeholder={locale === "ar" ? "السعر" : "Price"} value={form.price} onChange={handleFieldChange("price")} className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink" />
        <input type="number" min={0} placeholder={locale === "ar" ? "السعر قبل الخصم (اختياري)" : "Compare-at Price (optional)"} value={form.compareAtPrice} onChange={handleFieldChange("compareAtPrice")} className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input type="number" min={0} placeholder={locale === "ar" ? "الربح الأساسي للقطعة (مبلغ ثابت)" : "Base Profit per piece (Fixed Amount)"} value={form.baseProfitPerPiece} onChange={handleFieldChange("baseProfitPerPiece")} className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink" />
        <input type="number" min={0} placeholder={locale === "ar" ? "عمولة المسوق (مبلغ ثابت)" : "Affiliate Commission (Fixed Amount)"} value={form.affiliateCommission} onChange={handleFieldChange("affiliateCommission")} className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink" />
        <input type="number" min={0} placeholder={locale === "ar" ? "خصم العميل (مبلغ ثابت)" : "Customer Discount (Fixed Amount)"} value={form.productDiscount} onChange={handleFieldChange("productDiscount")} className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-3 border border-line bg-paper p-3">
          <label className="block text-xs font-semibold text-slate">{t("admin.colorSearchTitle")}
            <input type="search" value={colorSearch} onChange={(event) => setColorSearch(event.target.value)} placeholder={t("admin.colorSearchPlaceholder")} className="mt-1 w-full border border-line bg-paper px-3 py-2 text-sm text-ink" />
          </label>
          <div className="max-h-44 overflow-y-auto border border-line">
            {filteredColors.map((color) => {
              const selected = selectedColors.some((item) => getColorKey(item) === getColorKey(color));
              return <button key={color.nameEn} type="button" onClick={() => toggleColor(color)} aria-pressed={selected} className="flex w-full items-center gap-2 px-3 py-2 text-start text-sm hover:bg-paper-dim">
                <span className="h-5 w-5 shrink-0 rounded-full border border-line" style={{ backgroundColor: color.hex }} />
                <span>{locale === "ar" ? color.nameAr : color.nameEn}</span>{selected && <Check size={14} className="ms-auto" />}
              </button>;
            })}
            {colorSearch.trim() && filteredColors.length === 0 && <button type="button" onClick={() => setCustomColorName(colorSearch.trim())} className="w-full px-3 py-2 text-start text-sm font-semibold text-accent-deep">{t("admin.addCustomColor")}: {colorSearch.trim()}</button>}
          </div>
          {colorSearch.trim() && filteredColors.length === 0 && <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-36 flex-1 text-xs text-slate">{t("admin.customColorName")}<input value={customColorName} onChange={(event) => setCustomColorName(event.target.value)} className="mt-1 w-full border border-line px-2 py-1.5 text-sm text-ink" /></label>
            <label className="text-xs text-slate">{t("admin.customColorHex")}<input type="color" value={customColorHex} onChange={(event) => setCustomColorHex(event.target.value)} className="mt-1 block h-9 w-12 border border-line bg-paper p-1" /></label>
            <button type="button" onClick={addCustomColor} className="bg-ink px-3 py-2 text-xs font-semibold text-paper">{t("admin.addColor")}</button>
          </div>}
          {selectedColors.length > 0 && <div className="flex flex-wrap gap-2">{selectedColors.map((color) => <span key={getColorKey(color)} className="inline-flex items-center gap-2 border border-line px-2 py-1 text-xs">
            <span className="h-4 w-4 rounded-full border border-line" style={{ backgroundColor: color.swatch }} />{locale === "ar" ? color.nameAr : color.nameEn}
            <button type="button" onClick={() => setSelectedColors((previous) => previous.filter((item) => getColorKey(item) !== getColorKey(color)))} aria-label={t("admin.removeColor", { color: locale === "ar" ? color.nameAr : color.nameEn })} className="font-bold">×</button>
          </span>)}</div>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate">
            {locale === "ar" ? "صور المنتج (من الجهاز)" : "Product Images (from device)"}
            {initialData && (locale === "ar" ? " - اترك فارغاً للإبقاء على القديمة" : " - Leave empty to keep existing")}
          </label>
          <input type="file" accept="image/*" multiple onChange={(e) => setImageFiles(Array.from(e.target.files || []))} className="border border-line bg-paper px-3 py-1.5 text-sm text-ink focus:border-ink" />
        </div>
      </div>

      {allCollections.length > 0 && (
        <div className="border-t border-line pt-4">
          <label className="text-xs font-medium text-slate mb-2 block">
            {locale === "ar" ? "المجموعات" : "Collections"}
          </label>
          <div className="flex flex-wrap gap-2">
            {allCollections.map(c => (
              <label key={c._id} className="flex items-center gap-2 cursor-pointer bg-paper-dim px-2 py-1 text-sm border border-line">
                <input type="checkbox" checked={form.collections.includes(c._id)} onChange={() => toggleCollection(c._id)} className="accent-ink" />
                {locale === "ar" ? c.nameAr : c.nameEn}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-line pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate">
          {locale === "ar" ? "طريقة تحديد المخزون" : "Stock Entry Method"}
        </p>

        <label className="mb-4 flex items-center gap-2 text-sm font-medium text-ink"><input type="checkbox" checked={trackStockByColor} onChange={(event) => setTrackStockByColor(event.target.checked)} />{locale === "ar" ? "تحديد مخزون منفصل لكل مقاس ولون" : "Track stock separately for each size and color"}</label>
        {trackStockByColor ? <div className="overflow-x-auto"><table className="min-w-full border border-line text-sm"><thead className="bg-paper-dim"><tr><th className="p-2 text-start">{locale === "ar" ? "المقاس" : "Size"}</th>{selectedColors.map((color, index) => <th key={colorOptions[index]} className="p-2 text-start">{locale === "ar" ? color.nameAr : color.nameEn}</th>)}</tr></thead><tbody>{sizeScale.map((size) => <tr key={size} className="border-t border-line"><th className="p-2 text-start">{size}</th>{colorOptions.map((color) => <td key={color} className="p-2"><input aria-label={`${size} ${color} stock`} type="number" min={0} value={stockByVariant[`${size}::${color}`] || ""} onChange={handleVariantStockChange(size, color)} className="w-20 border border-line bg-paper px-2 py-1.5" /></td>)}</tr>)}</tbody></table></div> : <>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="radio" name="bulkMode" checked={bulkMode} onChange={() => handleBulkModeToggle(true)} className="h-4 w-4 border border-line text-ink accent-ink" />
            {locale === "ar" ? "كمية واحدة لكل المقاسات" : "Apply same quantity to all sizes"}
          </label>

          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="radio" name="bulkMode" checked={!bulkMode} onChange={() => handleBulkModeToggle(false)} className="h-4 w-4 border border-line text-ink accent-ink" />
            {locale === "ar" ? "تحديد الكمية لكل مقاس يدويًا" : "Set per size manually"}
          </label>
        </div>

        {bulkMode ? (
          <div className="mt-4 max-w-xs">
            <label className="mb-1.5 block text-xs font-medium text-slate">
              {locale === "ar" ? "الكمية لكل المقاسات" : "Quantity for all sizes"}
            </label>
            <input type="number" min={0} value={bulkQuantity} onChange={handleBulkQuantityChange} placeholder="0" className="w-full border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink" />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {sizeScale.map((size) => (
              <div key={size}>
                <label className="mb-1 block text-center text-xs font-semibold text-slate">{size}</label>
                <input type="number" min={0} value={stockBySize[size]} onChange={handlePerSizeChange(size)} placeholder="0" className="w-full border border-line bg-paper px-2 py-2 text-center text-sm text-ink focus:border-ink" />
              </div>
            ))}
          </div>
        )}
        </>}
      </div>

      <div className="flex justify-end border-t border-line pt-4 gap-2">
        {initialData && (
          <button type="button" onClick={onCancel} disabled={submitting} className="flex items-center gap-1.5 border border-line px-6 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink transition-opacity hover:bg-paper-dim">
            {locale === "ar" ? "إلغاء" : "Cancel"}
          </button>
        )}
        <button type="submit" disabled={submitting} className="flex items-center gap-1.5 bg-ink px-6 py-2.5 text-xs font-semibold uppercase tracking-wide text-paper transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60">
          {initialData ? <Save size={14} strokeWidth={2} /> : <Plus size={14} strokeWidth={2} />}
          {submitting
            ? (locale === "ar" ? "جارٍ الحفظ..." : "Saving...")
            : initialData ? (locale === "ar" ? "حفظ التعديلات" : "Save Changes") : (locale === "ar" ? "إضافة المنتج" : "Add Product")}
        </button>
      </div>
    </form>
  );
}

function AddCollectionForm({ onAdd }) {
  const { t, locale } = useLanguage();
  const [form, setForm] = useState({ nameEn: "", nameAr: "", descriptionEn: "", descriptionAr: "" });
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [activeCategory, setActiveCategory] = useState(PRODUCT_TYPE_OPTIONS[0].value);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState({});

  useEffect(() => {
    let cancelled = false;
    async function fetchCategoryProducts() {
      setLoadingProducts(true);
      setProductsError(null);
      try {
        const { data } = await api.get("/products", { params: { category: activeCategory } });
        if (!cancelled) setCategoryProducts(data?.data?.products || []);
      } catch (err) {
        if (!cancelled) setProductsError(err.response?.data?.message || err.message || (locale === "ar" ? "تعذر تحميل المنتجات." : "Could not load products."));
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    }
    fetchCategoryProducts();
    return () => { cancelled = true; };
  }, [activeCategory, locale]);

  const toggleProductSelection = (product) => {
    const productId = product._id || product.id;
    setSelectedProducts((prev) => {
      const next = { ...prev };
      if (next[productId]) delete next[productId];
      else next[productId] = product;
      return next;
    });
  };

  const removeSelectedProduct = (productId) => {
    setSelectedProducts((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const selectedList = Object.values(selectedProducts);

  const resetForm = () => {
    setForm({ nameEn: "", nameAr: "", descriptionEn: "", descriptionAr: "" });
    setImageFile(null);
    setSelectedProducts({});
    setActiveCategory(PRODUCT_TYPE_OPTIONS[0].value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!form.nameEn.trim() || !form.nameAr.trim()) {
      setSubmitError(locale === "ar" ? "الاسم بالإنجليزية والعربية مطلوب." : "English and Arabic names are required.");
      return;
    }

    if (!imageFile) {
      setSubmitError(locale === "ar" ? "يرجى اختيار صورة للمجموعة." : "Please choose a collection image.");
      return;
    }

    const productIds = Object.keys(selectedProducts);

    const formData = new FormData();
    formData.append("nameEn", form.nameEn.trim());
    formData.append("nameAr", form.nameAr.trim());
    formData.append("descriptionEn", form.descriptionEn.trim());
    formData.append("descriptionAr", form.descriptionAr.trim());
    formData.append("productIds", JSON.stringify(productIds));
    formData.append("image", imageFile);

    setSubmitting(true);
    try {
      const { data } = await api.post("/collections", formData, { headers: { "Content-Type": "multipart/form-data" } });
      if (typeof onAdd === "function") onAdd(data?.data?.collection || data?.collection);
      resetForm();
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || (locale === "ar" ? "حدث خطأ أثناء إضافة المجموعة." : "Something went wrong."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 border border-line p-4">
      {submitError && <p className="border border-red-700 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">{submitError}</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input type="text" placeholder={`${t("admin.collectionName")} (EN)`} value={form.nameEn} onChange={(e) => setForm(prev => ({ ...prev, nameEn: e.target.value }))} className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink" />
        <input type="text" placeholder={`${t("admin.collectionName")} (AR)`} value={form.nameAr} onChange={(e) => setForm(prev => ({ ...prev, nameAr: e.target.value }))} dir="rtl" className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input type="text" placeholder={`${t("admin.collectionDesc")} (EN)`} value={form.descriptionEn} onChange={(e) => setForm(prev => ({ ...prev, descriptionEn: e.target.value }))} className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink" />
        <input type="text" placeholder={`${t("admin.collectionDesc")} (AR)`} value={form.descriptionAr} onChange={(e) => setForm(prev => ({ ...prev, descriptionAr: e.target.value }))} dir="rtl" className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate">{locale === "ar" ? "صورة المجموعة (من الجهاز)" : "Collection Image (from device)"}</label>
        <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full border border-line bg-paper px-3 py-1.5 text-sm text-ink focus:border-ink" />
      </div>
      <div className="border-t border-line pt-4">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate">{locale === "ar" ? "فلتر الفئة" : "Category Filter"}</label>
        <select value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)} className="w-full border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink sm:w-64">
          {PRODUCT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{locale === "ar" ? opt.labelAr : opt.labelEn}</option>
          ))}
        </select>
        <div className="mt-3 max-h-72 overflow-y-auto border border-line">
          {loadingProducts ? (
            <p className="p-4 text-center text-sm text-slate">{locale === "ar" ? "جارٍ تحميل المنتجات..." : "Loading products..."}</p>
          ) : productsError ? (
            <p className="p-4 text-center text-sm text-red-700">{productsError}</p>
          ) : categoryProducts.length === 0 ? (
            <p className="p-4 text-center text-sm text-slate">{locale === "ar" ? "لا توجد منتجات في هذه الفئة." : "No products in this category."}</p>
          ) : (
            <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
              {categoryProducts.map((product) => {
                const productId = product._id || product.id;
                const isChecked = Boolean(selectedProducts[productId]);
                const displayName = (locale === "ar" ? (product.nameAr || product.nameKey) : (product.nameEn || product.nameKey)) || product.name;
                return (
                  <label key={productId} className={cn("flex cursor-pointer items-center gap-2.5 bg-paper px-3 py-2.5 text-sm transition-colors", isChecked && "bg-paper-dim")}>
                    <input type="checkbox" checked={isChecked} onChange={() => toggleProductSelection(product)} className="h-4 w-4 shrink-0 border border-line text-ink accent-ink" />
                    <span className="flex-1 truncate text-ink">{displayName}</span>
                    <span className="shrink-0 text-xs text-slate">{formatPrice(product.price, locale, t("common.currency"))}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-line pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate">
          {locale === "ar" ? `المنتجات المختارة (${selectedList.length})` : `Selected Products (${selectedList.length})`}
        </p>
        {selectedList.length === 0 ? (
          <p className="text-sm text-slate-light">{locale === "ar" ? "لم تختر أي منتجات بعد." : "No products selected yet."}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedList.map((product) => {
              const productId = product._id || product.id;
              const displayName = (locale === "ar" ? (product.nameAr || product.nameKey) : (product.nameEn || product.nameKey)) || product.name;
              return (
                <span key={productId} className="flex items-center gap-1.5 border border-ink bg-paper-dim px-2.5 py-1 text-xs text-ink">
                  {displayName}
                  <button type="button" onClick={() => removeSelectedProduct(productId)} aria-label={locale === "ar" ? "إزالة" : "Remove"} className="text-slate hover:text-ink"><X size={12} strokeWidth={2} /></button>
                </span>
              );
            })}
          </div>
        )}
      </div>
      <div className="flex justify-end border-t border-line pt-4">
        <button type="submit" disabled={submitting} className="flex shrink-0 items-center gap-1.5 bg-ink px-6 py-2 text-xs font-semibold text-paper transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60">
          <Plus size={14} strokeWidth={2} />
          {submitting ? (locale === "ar" ? "جارٍ الإضافة..." : "Adding...") : t("admin.addCollection")}
        </button>
      </div>
    </form>
  );
}

function ProductsAndCollectionsTab() {
  const { t, locale } = useLanguage();
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, colRes] = await Promise.all([
          api.get("/products", {
          params: { limit: 200 },
}),
          api.get("/collections")
        ]);
        setProducts(prodRes.data?.data?.products || []);
        setCollections(colRes.data?.data?.collections || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveProduct = (product) => {
    if (editingProduct) {
      const savedId = String(product?._id || product?.id || editingProduct._id || editingProduct.id);
      setProducts((previous) => previous.map((item) =>
        String(item._id || item.id) === savedId ? product : item
      ));
      setEditingProduct(null);
    } else {
      const savedId = String(product?._id || product?.id || "");
      if (!savedId) return;
      setProducts((previous) => previous.some((item) => String(item._id || item.id) === savedId)
        ? previous
        : [product, ...previous]);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if(!window.confirm(locale === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete this?')) return;
    try {
      await api.delete(`/products/${productId}`);
      setProducts((prev) => prev.filter((p) => (p._id || p.id) !== productId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCollection = (collection) => {
    setCollections((prev) => [collection, ...prev]);
  };

  const handleDeleteCollection = async (collectionId) => {
    if(!window.confirm(locale === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete this?')) return;
    try {
      await api.delete(`/collections/${collectionId}`);
      setCollections((prev) => prev.filter((c) => (c._id || c.id) !== collectionId));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <p className="py-10 text-center text-slate">Loading...</p>;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h2 className="label-tracked text-ink">{t("admin.productsTitle")}</h2>
        <div className="mt-4">
          {editingProduct ? (
            <ProductForm key={`edit-${editingProduct._id || editingProduct.id}`} initialData={editingProduct} onSave={handleSaveProduct} onCancel={() => setEditingProduct(null)} />
          ) : (
            <ProductForm key="create-product" onSave={handleSaveProduct} />
          )}
        </div>

        {products.length === 0 ? (
          <p className="mt-4 text-sm text-slate">{t("admin.noProducts")}</p>
        ) : (
          <div className="mt-4 overflow-x-auto border border-line">
            <table className="w-full min-w-[600px] text-start">
              <thead>
                <tr className="border-b border-line bg-paper-dim">
                  <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.productName")}</th>
                  <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.productCategory")}</th>
                  <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.productPrice")}</th>
                  <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.productStock")}</th>
                  <th className="label-tracked px-4 py-3 text-start text-slate" />
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const productId = product._id || product.id;
                  const displayName = (locale === "ar" ? (product.nameAr || product.nameKey) : (product.nameEn || product.nameKey)) || product.name;
                  const displayCategory = product.category
                    ? t(`categories.${product.category}`)
                    : "-";
                  return (
                    <tr key={productId} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 text-sm font-medium text-ink">{displayName}</td>
                      <td className="px-4 py-3 text-sm text-slate">{displayCategory}</td>
                      <td className="px-4 py-3 text-sm text-ink">
                        {formatPrice(product.price, locale, t("common.currency"))}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate">{product.stock}</td>
                      <td className="px-4 py-3 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(product);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="flex items-center gap-1 text-xs font-medium text-ink hover:opacity-70"
                        >
                          <Pencil size={13} strokeWidth={1.75} />
                          {locale === 'ar' ? 'تعديل' : 'Edit'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(productId)}
                          className="flex items-center gap-1 text-xs font-medium text-red-700 hover:opacity-70"
                        >
                          <Trash2 size={13} strokeWidth={1.75} />
                          {t("admin.deleteProduct")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="label-tracked text-ink">{t("admin.collectionsTitle")}</h2>
        <div className="mt-4">
          <AddCollectionForm onAdd={handleAddCollection} />
        </div>

        {collections.length === 0 ? (
          <p className="mt-4 text-sm text-slate">{t("admin.noCollections")}</p>
        ) : (
          <div className="mt-4 overflow-x-auto border border-line">
            <table className="w-full min-w-[480px] text-start">
              <thead>
                <tr className="border-b border-line bg-paper-dim">
                  <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.collectionName")}</th>
                  <th className="label-tracked px-4 py-3 text-start text-slate">
                    {locale === "ar" ? "الوصف" : "Description"}
                  </th>
                  <th className="label-tracked px-4 py-3 text-start text-slate" />
                </tr>
              </thead>
              <tbody>
                {collections.map((collection) => {
                  const collectionId = collection._id || collection.id;
                  const displayName = (locale === "ar" ? collection.nameAr : collection.nameEn) || collection.name;
                  const displayDescription =
                    (locale === "ar" ? collection.descriptionAr : collection.descriptionEn) || "";
                  return (
                    <tr key={collectionId} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 text-sm font-medium text-ink">{displayName}</td>
                      <td className="px-4 py-3 text-sm text-slate">{displayDescription}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleDeleteCollection(collectionId)}
                          className="flex items-center gap-1 text-xs font-medium text-red-700 hover:opacity-70"
                        >
                          <Trash2 size={13} strokeWidth={1.75} />
                          {t("admin.deleteCollection")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function AffiliateLedgerTab() {
  const { t, locale } = useLanguage();
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState(null);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/affiliates/ledger");
      setLedgers(data.ledger || []);
    } catch (err) {
      console.error("Error fetching affiliate ledger:", err);
      setError(locale === "ar" ? "فشل تحميل بيانات المسوقين" : "Failed to load affiliate ledger.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const handleConfirmPayout = async (profileId) => {
    try {
      setPayingId(profileId);
      await api.put(`/affiliates/${profileId}/confirm-payout`);
      setLedgers((prev) =>
        prev.map((ledger) =>
          ledger.id === profileId ? { ...ledger, status: "paid", pendingCommission: 0 } : ledger
        )
      );
    } catch (err) {
      console.error("Error confirming payout:", err);
      alert(locale === "ar" ? "فشل تأكيد الدفع" : "Failed to confirm payout.");
    } finally {
      setPayingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-slate animate-pulse">
        {locale === "ar" ? "جاري تحميل بيانات المسوقين..." : "Loading affiliate ledger..."}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-sm font-medium text-red-700 bg-red-50 border border-red-200 p-4">
        {error}
      </div>
    );
  }

  if (ledgers.length === 0) {
    return (
      <p className="border border-dashed border-line p-8 text-center text-sm text-slate">
        {locale === "ar" ? "لا يوجد مسوقين بعد." : "No affiliates yet."}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border border-line">
      <table className="w-full min-w-[880px] text-start">
        <thead>
          <tr className="border-b border-line bg-paper-dim">
            <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.affiliateName")}</th>
            <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.promoCode")}</th>
            <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.totalOrders")}</th>
            <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.topProduct")}</th>
            <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.pendingCommission")}</th>
            <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.payoutStatus")}</th>
          </tr>
        </thead>
        <tbody>
          {ledgers.map((ledger) => (
            <tr key={ledger.id} className="border-b border-line last:border-0">
              <td className="px-4 py-3 text-sm font-medium text-ink">{ledger.name}</td>
              <td className="px-4 py-3 text-sm text-slate">
                <span className="border border-line px-2 py-0.5">{ledger.code}</span>
              </td>
              <td className="px-4 py-3 text-sm text-ink">{ledger.totalOrders}</td>
              <td className="px-4 py-3 text-sm text-slate">
                {ledger.topProduct || (locale === "ar" ? "لا يوجد" : "None yet")}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-ink">
                {formatPrice(ledger.pendingCommission, locale, t("common.currency"))}
              </td>
              <td className="px-4 py-3">
                {ledger.status === "pending" ? (
                  <div className="flex items-center gap-2">
                    <span className="label-tracked inline-flex border border-accent-deep text-accent-deep px-2 py-1">
                      {t("admin.statusPending")}
                    </span>
                    <button
                      onClick={() => handleConfirmPayout(ledger.id)}
                      disabled={payingId === ledger.id}
                      className="flex items-center gap-1 bg-ink text-paper px-2 py-1 text-xs hover:opacity-85 disabled:opacity-50"
                    >
                      <Check size={14} strokeWidth={2} />{" "}
                      {payingId === ledger.id ? "..." : t("admin.confirmPayout")}
                    </button>
                  </div>
                ) : (
                  <span className="label-tracked inline-flex border border-ink bg-ink text-paper px-2 py-1">
                    {t("admin.statusPaid")}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ManagerDashboard() {
  const { t, locale } = useLanguage();
  const { role } = useAuth();
  const currentRole = role;

  const [activeTab, setActiveTab] = useState(TABS.ORDERS);
  const permittedTabs = PERMITTED_TABS[currentRole] || [];

  useEffect(() => {
    if (!permittedTabs.includes(activeTab)) {
      setActiveTab(TABS.ORDERS);
    }
  }, [currentRole, permittedTabs, activeTab]);

  return (
    currentRole !== ROLES.OWNER && currentRole !== ROLES.ADMIN ? (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-extrabold tracking-tightest">{t("admin.restrictedTitle")}</h1>
        <p className="mt-2 text-sm text-slate">{t("admin.restrictedBody")}</p>
      </div>
    ) :
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tightest text-ink sm:text-3xl">
            {t("admin.dashboardTitle")}
          </h1>
          <p className="mt-2 text-sm text-slate">{t("admin.dashboardSubtitle")}</p>
        </div>

        {currentRole === ROLES.OWNER && (
          <Link
            to="/admin/analytics"
            className="inline-flex items-center gap-2 self-start bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition-opacity hover:opacity-85"
          >
            <BarChart3 size={16} strokeWidth={1.75} />
            {t("admin.tabAnalytics") || (locale === "ar" ? "التحليلات" : "Analytics")}
          </Link>
        )}
      </div>

      <div className="mt-6 flex gap-6 overflow-x-auto border-b border-line">
        <TabButton
          active={activeTab === TABS.ORDERS}
          onClick={() => setActiveTab(TABS.ORDERS)}
          icon={Package}
          label={t("admin.tabOrders")}
        />
        
        {permittedTabs.includes(TABS.AFFILIATES) && (
          <TabButton
            active={activeTab === TABS.AFFILIATES}
            onClick={() => setActiveTab(TABS.AFFILIATES)}
            icon={Users}
            label={t("admin.tabAffiliates")}
          />
        )}
        {permittedTabs.includes(TABS.AFFILIATE_LEDGER) && (
          <TabButton 
            active={activeTab === TABS.AFFILIATE_LEDGER} 
            onClick={() => setActiveTab(TABS.AFFILIATE_LEDGER)} 
            icon={Tag} 
            label={t("admin.tabAffiliateLedger")} 
          />
        )}
        <TabButton
          active={activeTab === TABS.PRODUCTS}
          onClick={() => setActiveTab(TABS.PRODUCTS)}
          icon={Boxes}
          label={t("admin.tabProducts")}
        />
        {permittedTabs.includes(TABS.USERS) && (
          <TabButton 
            active={activeTab === TABS.USERS} 
            onClick={() => setActiveTab(TABS.USERS)} 
            icon={Users} 
            label={t("admin.tabUsers")} 
          />
        )}
      </div>

      <div className="mt-8">
        {activeTab === TABS.ORDERS && <OrdersTab />}
        {activeTab === TABS.AFFILIATES &&
          (permittedTabs.includes(TABS.AFFILIATES) ? <AffiliateRequestsTab /> : <RestrictedNotice />)}
        {activeTab === TABS.USERS && <UsersManagementTab />}
        {activeTab === TABS.AFFILIATE_LEDGER && <AffiliateLedgerTab />}
        {activeTab === TABS.PRODUCTS && <ProductsAndCollectionsTab />}
      </div>
    </div>
  );
}
