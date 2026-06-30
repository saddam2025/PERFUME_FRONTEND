import { Package, Users, Boxes, Check, X, Pencil, Tag, Plus, Trash2, Lock, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import React from "react"; 
import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { formatPrice } from "../lib/formatPrice";
import { cn } from "../lib/cn";
import api from "../api/axios";
import {
  adminOrders as initialOrders,
  adminAffiliateApplications as initialApplications,
  adminProducts as initialProducts,
  adminCollections as initialCollections,
  ORDER_STATUSES,
} from "../data/mockDashboard";

// ---------------------------------------------------------------------------
// ROLE-BASED ACCESS
// ---------------------------------------------------------------------------
// The backend already enforces Manager/Admin/Affiliate/Customer access on
// every request via `protect` + `restrictTo`. The frontend doesn't have a
// real session yet (no JWT decode, no logged-in user object), so `currentRole`
// below is a hardcoded placeholder. Once real auth lands, replace it with the
// decoded role from the logged-in user's JWT — this gating logic
// (PERMITTED_TABS) stays exactly the same, only the source of the role value
// changes.
const ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
};

const TABS = {
  ORDERS: "orders",
  AFFILIATES: "affiliates",
  USERS: "users",
  AFFILIATE_LEDGER: "affiliate_ledger",
  PRODUCTS: "products",
};

// Owner/Manager sees everything. Admin (employee) is explicitly denied
// Affiliate Requests which carries financial/commission configuration that
// only the Owner/Manager should touch.
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

function OrderStatusBadge({ status, t }) {
  const styles = {
    pending: "border-slate-light text-slate",
    shipped: "border-accent-deep text-accent-deep",
    delivered: "border-ink bg-ink text-paper",
    cancelled: "border-red-700 text-red-700",
  };
  const labels = {
    pending: t("admin.statusPending"),
    shipped: t("admin.statusShipped"),
    delivered: t("admin.statusDelivered"),
    cancelled: t("admin.statusCancelled"),
  };
  return (
    <span className={cn("label-tracked inline-flex border px-2 py-1", styles[status])}>
      {labels[status]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// ORDERS TAB — available to both Owner/Manager and Admin
// ---------------------------------------------------------------------------
function OrdersTab() {
  const { t, locale } = useLanguage();
  const [orders, setOrders] = useState(initialOrders);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editPriceValue, setEditPriceValue] = useState("");
  const [discountingOrderId, setDiscountingOrderId] = useState(null);
  const [discountValue, setDiscountValue] = useState("");
  const [savedFlash, setSavedFlash] = useState(null);
  
  // 1. State جديدة لتتبع الأوردر المفتوح
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const updateStatus = (orderId, status) => {
    setOrders((prev) => prev.map((order) => (order.orderId === orderId ? { ...order, status } : order)));
  };

  const flashSaved = (orderId) => {
    setSavedFlash(orderId);
    setTimeout(() => setSavedFlash(null), 1500);
  };

  const startEditPrice = (order) => {
    setEditingOrderId(order.orderId);
    setEditPriceValue(String(order.total));
    setDiscountingOrderId(null);
  };

  const savePrice = (orderId) => {
    const nextTotal = Number(editPriceValue);
    if (!Number.isFinite(nextTotal) || nextTotal < 0) return;
    setOrders((prev) => prev.map((order) => (order.orderId === orderId ? { ...order, total: nextTotal } : order)));
    setEditingOrderId(null);
    flashSaved(orderId);
  };

  const startDiscount = (order) => {
    setDiscountingOrderId(order.orderId);
    setDiscountValue("");
    setEditingOrderId(null);
  };

  const applyDiscount = (order) => {
    const pct = Number(discountValue);
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) return;
    const nextTotal = Math.round(order.total * (1 - pct / 100));
    setOrders((prev) => prev.map((o) => (o.orderId === order.orderId ? { ...o, total: nextTotal } : o)));
    setDiscountingOrderId(null);
    flashSaved(order.orderId);
  };

  // 2. دالة لفتح وقفل تفاصيل الأوردر
  const toggleExpand = (orderId) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  return (
    <div className="overflow-x-auto border border-line">
      <table className="w-full min-w-[880px] text-start">
        <thead>
          <tr className="border-b border-line bg-paper-dim">
            <th className="w-10 px-4 py-3"></th> {/* عمود فاضي لزرار التوسيع */}
            <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.orderId")}</th>
            <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.customer")}</th>
            <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.date")}</th>
            <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.items")}</th>
            <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.total")}</th>
            <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.status")}</th>
            <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.updateStatus")}</th>
            <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.editPrice")}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const isEditingPrice = editingOrderId === order.orderId;
            const isDiscounting = discountingOrderId === order.orderId;
            const isExpanded = expandedOrderId === order.orderId;

            return (
              <React.Fragment key={order.orderId}>
                <tr className="border-b border-line last:border-0 hover:bg-paper-dim/50 transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => toggleExpand(order.orderId)} className="text-slate hover:text-ink">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-ink">{order.orderId}</td>
                  <td className="px-4 py-3 text-sm text-ink">{order.customer}</td>
                  <td className="px-4 py-3 text-sm text-slate">{order.date}</td>
                  <td className="px-4 py-3 text-sm text-slate">{order.items}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-ink">
                    {/* ... (نفس كود تعديل السعر والخصم اللي كان موجود عندك بدون تغيير) ... */}
                    {isEditingPrice ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number" min={0} value={editPriceValue}
                          onChange={(e) => setEditPriceValue(e.target.value)}
                          className="w-20 border border-ink bg-paper px-2 py-1 text-sm text-ink" autoFocus
                        />
                        <button type="button" onClick={() => savePrice(order.orderId)} className="text-ink hover:opacity-70"><Check size={15} strokeWidth={2.5} /></button>
                        <button type="button" onClick={() => setEditingOrderId(null)} className="text-slate hover:text-ink"><X size={15} strokeWidth={2} /></button>
                      </div>
                    ) : isDiscounting ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number" min={0} max={100} placeholder="%" value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                          className="w-16 border border-ink bg-paper px-2 py-1 text-sm text-ink" autoFocus
                        />
                        <button type="button" onClick={() => applyDiscount(order)} className="text-ink hover:opacity-70"><Check size={15} strokeWidth={2.5} /></button>
                        <button type="button" onClick={() => setDiscountingOrderId(null)} className="text-slate hover:text-ink"><X size={15} strokeWidth={2} /></button>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        {formatPrice(order.total, locale, t("common.currency"))}
                        {savedFlash === order.orderId && <Check size={13} strokeWidth={2.5} className="text-accent-deep" />}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} t={t} />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.orderId, e.target.value)}
                      className="border border-line bg-paper px-2.5 py-1.5 text-xs text-ink focus:border-ink"
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {t(`admin.status${status.charAt(0).toUpperCase()}${status.slice(1)}`)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {!isEditingPrice && !isDiscounting && (
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => startEditPrice(order)} className="flex items-center gap-1 text-xs font-medium text-ink hover:opacity-70">
                          <Pencil size={12} strokeWidth={2} /> {t("admin.editPrice")}
                        </button>
                        <button type="button" onClick={() => startDiscount(order)} className="flex items-center gap-1 text-xs font-medium text-accent-deep hover:opacity-70">
                          <Tag size={12} strokeWidth={2} /> {t("admin.applyDiscount")}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>

                {/* 3. الجزء الخاص بعرض التفاصيل لما نضغط على التوسيع */}
                {isExpanded && (
                  <tr className="bg-paper-dim/30 border-b border-line">
                    <td colSpan="9" className="px-14 py-4">
                      <div className="flex flex-col gap-4 text-sm">
                        <div className="flex gap-8">
                          <div>
                            <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-1">مصدر الأوردر</span>
                            <span className="font-medium text-ink">
                              {order.source || "Customer Direct"} 
                              {order.affiliateCode ? ` (كود: ${order.affiliateCode})` : ""}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-1">بواسطة</span>
                            <span className="font-medium text-ink">{order.createdBy || "Customer"}</span>
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-slate text-xs font-bold uppercase tracking-wider block mb-2">تفاصيل المنتجات</span>
                          <ul className="grid gap-2">
                            {order.lineItems && order.lineItems.length > 0 ? (
                              order.lineItems.map((item, idx) => (
                                <li key={idx} className="flex items-center gap-4 border border-line bg-paper px-3 py-2">
                                  <span className="font-semibold text-ink min-w-[30px]">{item.qty}x</span>
                                  <span className="text-ink flex-1">{item.name}</span>
                                  <span className="text-slate text-xs">{item.size || "Default Size"}</span>
                                </li>
                              ))
                            ) : (
                              <li className="text-slate italic text-xs">لا توجد تفاصيل متاحة لهذا الطلب (تحتاج لإضافتها في الـ mock data).</li>
                            )}
                          </ul>
                        </div>
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
  );
}

// ---------------------------------------------------------------------------
// AFFILIATE REQUESTS TAB — Owner/Manager only
// ---------------------------------------------------------------------------
function AffiliateRequestsTab() {
  const { t } = useLanguage();
  const [applications, setApplications] = useState(initialApplications);
  const [decisions, setDecisions] = useState({});

  const handleDecision = (id, decision) => {
    // Hits POST /admin/affiliate-applications/:id/approve|reject, which is
    // what actually provisions the AffiliateProfile on approval.
    setDecisions((prev) => ({ ...prev, [id]: decision }));
    setTimeout(() => {
      setApplications((prev) => prev.filter((app) => app.id !== id));
    }, 900);
  };

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
        const decision = decisions[app.id];
        return (
          <div
            key={app.id}
            className={cn(
              "flex flex-col gap-4 border border-line p-5 transition-opacity sm:flex-row sm:items-center sm:justify-between",
              decision && "opacity-50"
            )}
          >
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-ink">{app.name}</h3>
                <span className="label-tracked border border-line px-2 py-0.5 text-slate">
                  {app.proposedCode}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate">{app.email}</p>
              <p className="mt-1 text-xs text-slate-light">{app.audience}</p>
              <p className="mt-1 text-xs text-slate-light">
                {t("admin.appliedOn")}: {app.appliedOn}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
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
                    onClick={() => handleDecision(app.id, "rejected")}
                    className="flex items-center gap-1.5 border border-line px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:border-red-700 hover:text-red-700"
                  >
                    <X size={14} strokeWidth={2} />
                    {t("admin.reject")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision(app.id, "approved")}
                    className="flex items-center gap-1.5 bg-ink px-3.5 py-2 text-xs font-semibold text-paper transition-opacity hover:opacity-85"
                  >
                    <Check size={14} strokeWidth={2} />
                    {t("admin.approve")}
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ADMINS & AFFILIATES MANAGEMENT TAB — Owner/Manager only
// ---------------------------------------------------------------------------
function UsersManagementTab() {
  const { t } = useLanguage();
  const [subTab, setSubTab] = useState("affiliates"); // 'affiliates' أو 'admins'

  // بيانات وهمية للمسوقين المعتمدين شغالين عندك بالفعل
  const [affiliates, setAffiliates] = useState([
    { id: "aff_1", name: "Kareem Soliman", email: "kareem@example.com", code: "KAREEM10", totalSales: 45, status: "active" },
    { id: "aff_2", name: "Nouran Aly", email: "nouran@example.com", code: "NOUR5", totalSales: 12, status: "suspended" }
  ]);

  // بيانات طاقم الإدارة والأدمنز
  const [admins, setAdmins] = useState([
    { id: "adm_1", name: "Mostafa Admin", email: "mostafa@toronto.com", role: "admin", status: "active" },
    { id: "adm_2", name: "Omar Owner", email: "omar@toronto.com", role: "owner", status: "active" }
  ]);

  const toggleUserStatus = (id, type) => {
    if (type === "affiliate") {
      setAffiliates(prev => prev.map(u => u.id === id ? { ...u, status: u.status === "active" ? "suspended" : "active" } : u));
    } else {
      setAdmins(prev => prev.map(u => u.id === id ? { ...u, status: u.status === "active" ? "suspended" : "active" } : u));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* سويتش داخلي بين المسوقين والأدمنز */}
      <div className="flex gap-6 border-b border-line">
        <button
          type="button"
          onClick={() => setSubTab("affiliates")}
          className={cn("pb-2 text-sm font-semibold border-b-2 transition-colors", subTab === "affiliates" ? "border-ink text-ink" : "border-transparent text-slate hover:text-ink")}
        >
          {t("admin.subTabActiveAffiliates")}
        </button>
        <button
          type="button"
          onClick={() => setSubTab("admins")}
          className={cn("pb-2 text-sm font-semibold border-b-2 transition-colors", subTab === "admins" ? "border-ink text-ink" : "border-transparent text-slate hover:text-ink")}
        >
          {t("admin.subTabAdminStaff")}
        </button>
      </div>

      {subTab === "affiliates" ? (
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[700px] text-start">
            <thead>
              <tr className="border-b border-line bg-paper-dim">
                <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.userName")}</th>
                <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.userEmail")}</th>
                <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.promoCode")}</th>
                <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.totalSales")}</th>
                <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.userStatus")}</th>
                <th className="label-tracked px-4 py-3 text-start text-slate" />
              </tr>
            </thead>
            <tbody>
              {affiliates.map(aff => (
                <tr key={aff.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 text-sm font-medium text-ink">{aff.name}</td>
                  <td className="px-4 py-3 text-sm text-slate">{aff.email}</td>
                  <td className="px-4 py-3 text-sm text-ink"><span className="border border-line px-2 py-0.5">{aff.code}</span></td>
                  <td className="px-4 py-3 text-sm text-ink">{aff.totalSales}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={cn("label-tracked inline-flex border px-2 py-0.5", aff.status === "active" ? "border-ink bg-ink text-paper" : "border-red-700 text-red-700")}>
                      {aff.status === "active" ? t("admin.statusActive") : t("admin.statusSuspended")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <button
                      type="button"
                      onClick={() => toggleUserStatus(aff.id, "affiliate")}
                      className={cn("text-xs font-semibold underline px-4", aff.status === "active" ? "text-red-700" : "text-ink")}
                    >
                      {aff.status === "active" ? t("admin.actionSuspend") : t("admin.actionActivate")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[600px] text-start">
            <thead>
              <tr className="border-b border-line bg-paper-dim">
                <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.userName")}</th>
                <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.userEmail")}</th>
                <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.userRole")}</th>
                <th className="label-tracked px-4 py-3 text-start text-slate">{t("admin.userStatus")}</th>
                <th className="label-tracked px-4 py-3 text-start text-slate" />
              </tr>
            </thead>
            <tbody>
              {admins.map(adm => (
                <tr key={adm.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 text-sm font-medium text-ink">{adm.name}</td>
                  <td className="px-4 py-3 text-sm text-slate">{adm.email}</td>
                  <td className="px-4 py-3 text-sm text-ink font-semibold">{adm.role.toUpperCase()}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={cn("label-tracked inline-flex border px-2 py-0.5", adm.status === "active" ? "border-ink bg-ink text-paper" : "border-red-700 text-red-700")}>
                      {adm.status === "active" ? t("admin.statusActive") : t("admin.statusSuspended")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    {adm.role !== "owner" && (
                      <button
                        type="button"
                        onClick={() => toggleUserStatus(adm.id, "admin")}
                        className={cn("text-xs font-semibold underline px-4", adm.status === "active" ? "text-red-700" : "text-ink")}
                      >
                        {adm.status === "active" ? t("admin.actionSuspend") : t("admin.actionActivate")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PRODUCTS & COLLECTIONS TAB — available to both Owner/Manager and Admin
// ---------------------------------------------------------------------------

// Hardcoded size guide charts — no longer editable from the dashboard UI.
// Swap these two URLs once real chart images are hosted.
const TOPS_SIZE_GUIDE_URL = "https://toronto.shop/assets/size-guides/tops.jpg";
const PANTS_SIZE_GUIDE_URL = "https://toronto.shop/assets/size-guides/pants.jpg";

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

function AddProductForm({ onAdd }) {
  const { locale } = useLanguage();

  const [form, setForm] = useState({
    nameEn: "",
    nameAr: "",
    descriptionEn: "",
    descriptionAr: "",
    productType: "t-shirt",
    price: "",
    compareAtPrice: "",
    colors: "",
    baseProfitPerPiece: "",
    affiliateCommission: "",
    productDiscount: "",
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [sizeScale, setSizeScale] = useState(getSizeScaleForType("t-shirt"));
  const [bulkMode, setBulkMode] = useState(true);
  const [bulkQuantity, setBulkQuantity] = useState("");
  const [stockBySize, setStockBySize] = useState(buildEmptyStockState(getSizeScaleForType("t-shirt")));

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Switching productType immediately swaps the size scale and resets every
  // size's stock back to empty. The size guide URL is no longer a visible
  // field — it's derived from productType automatically at submit time.
  const handleProductTypeChange = (nextType) => {
    const nextScale = getSizeScaleForType(nextType);
    setSizeScale(nextScale);
    setStockBySize(buildEmptyStockState(nextScale));
    setBulkQuantity("");
    setForm((prev) => ({ ...prev, productType: nextType }));
  };

  const handleFieldChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
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
      nameEn: "",
      nameAr: "",
      descriptionEn: "",
      descriptionAr: "",
      productType: "t-shirt",
      price: "",
      compareAtPrice: "",
      colors: "",
      baseProfitPerPiece: "",
      affiliateCommission: "",
      productDiscount: "",
    });
    setImageFiles([]);
    setSizeScale(nextScale);
    setStockBySize(buildEmptyStockState(nextScale));
    setBulkMode(true);
    setBulkQuantity("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!form.nameEn.trim() || !form.nameAr.trim() || !form.price) {
      setSubmitError(
        locale === "ar"
          ? "الاسم بالإنجليزية والعربية والسعر حقول مطلوبة."
          : "English name, Arabic name, and price are required."
      );
      return;
    }

    if (imageFiles.length === 0) {
      setSubmitError(locale === "ar" ? "يرجى اختيار صورة واحدة على الأقل للمنتج." : "Please choose at least one product image.");
      return;
    }

    const activeSizes = sizeScale.filter((size) => Number(stockBySize[size]) > 0);

    if (activeSizes.length === 0) {
      setSubmitError(
        locale === "ar"
          ? "أدخل كمية مخزون أكبر من صفر لمقاس واحد على الأقل."
          : "Enter a stock quantity greater than zero for at least one size."
      );
      return;
    }

    const stockBySizePayload = activeSizes.reduce((acc, size) => {
      acc[size] = Number(stockBySize[size]) || 0;
      return acc;
    }, {});

    const totalStock = activeSizes.reduce((sum, size) => sum + (Number(stockBySize[size]) || 0), 0);

    const colorsPayload = form.colors
      .split(",")
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);

    // multipart/form-data: the images ride alongside the JSON-ish fields in
    // one request. Arrays/objects are JSON.stringify'd into individual text
    // fields since FormData can't carry nested structures directly.
    const formData = new FormData();
    formData.append("name", form.nameEn.trim());
    formData.append("nameAr", form.nameAr.trim());
    formData.append("description", form.descriptionEn.trim() || form.nameEn.trim());
    formData.append("descriptionAr", form.descriptionAr.trim() || form.nameAr.trim());
    formData.append("price", String(Number(form.price) || 0));
    formData.append("compareAtPrice", form.compareAtPrice ? String(Number(form.compareAtPrice)) : "");
    formData.append("productType", form.productType);
    formData.append("colors", JSON.stringify(colorsPayload));
    formData.append("sizes", JSON.stringify(activeSizes));
    formData.append("stockBySize", JSON.stringify(stockBySizePayload));
    formData.append("stock", String(totalStock));
    formData.append("sizeGuideImageUrl", getSizeGuideUrlForType(form.productType));
    formData.append("isLatestArrival", "true");
    
    // New fixed value fields
    formData.append("baseProfitPerPiece", String(Number(form.baseProfitPerPiece) || 0));
    formData.append("affiliateCommission", String(Number(form.affiliateCommission) || 0));
    formData.append("productDiscount", String(Number(form.productDiscount) || 0));

    // Append multiple images
    imageFiles.forEach(file => {
      formData.append("images", file);
    });

    setSubmitting(true);
    try {
      const { data } = await api.post("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const createdProduct = data?.data?.product || data?.product;

      if (typeof onAdd === "function" && createdProduct) {
        onAdd(createdProduct);
      }

      resetForm();
    } catch (err) {
      setSubmitError(
        err.response?.data?.message ||
          err.message ||
          (locale === "ar" ? "حدث خطأ أثناء إضافة المنتج." : "Something went wrong while adding the product.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 border border-line bg-paper p-4 sm:p-5">
      {submitError && (
        <p className="border border-red-700 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">
          {submitError}
        </p>
      )}

      {/* Names */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          type="text"
          placeholder={locale === "ar" ? "اسم المنتج (إنجليزي)" : "Product Name (English)"}
          value={form.nameEn}
          onChange={handleFieldChange("nameEn")}
          className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink"
        />
        <input
          type="text"
          placeholder={locale === "ar" ? "اسم المنتج (عربي)" : "Product Name (Arabic)"}
          value={form.nameAr}
          onChange={handleFieldChange("nameAr")}
          dir="rtl"
          className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink"
        />
      </div>

      {/* Descriptions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <textarea
          rows={2}
          placeholder={locale === "ar" ? "الوصف (إنجليزي)" : "Description (English)"}
          value={form.descriptionEn}
          onChange={handleFieldChange("descriptionEn")}
          className="resize-none border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink"
        />
        <textarea
          rows={2}
          placeholder={locale === "ar" ? "الوصف (عربي)" : "Description (Arabic)"}
          value={form.descriptionAr}
          onChange={handleFieldChange("descriptionAr")}
          dir="rtl"
          className="resize-none border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink"
        />
      </div>

      {/* Type, price, compareAtPrice */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select
          value={form.productType}
          onChange={(e) => handleProductTypeChange(e.target.value)}
          className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink"
        >
          {PRODUCT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {locale === "ar" ? opt.labelAr : opt.labelEn}
            </option>
          ))}
        </select>

        <input
          type="number"
          min={0}
          placeholder={locale === "ar" ? "السعر" : "Price"}
          value={form.price}
          onChange={handleFieldChange("price")}
          className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink"
        />

        <input
          type="number"
          min={0}
          placeholder={locale === "ar" ? "السعر قبل الخصم (اختياري)" : "Compare-at Price (optional)"}
          value={form.compareAtPrice}
          onChange={handleFieldChange("compareAtPrice")}
          className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink"
        />
      </div>

      {/* Base Profit, Affiliate Commission & Product Discount */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input
          type="number"
          min={0}
          placeholder={locale === "ar" ? "الربح الأساسي للقطعة (مبلغ ثابت)" : "Base Profit per piece (Fixed Amount)"}
          value={form.baseProfitPerPiece}
          onChange={handleFieldChange("baseProfitPerPiece")}
          className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink"
        />
        <input
          type="number"
          min={0}
          placeholder={locale === "ar" ? "عمولة المسوق (مبلغ ثابت)" : "Affiliate Commission (Fixed Amount)"}
          value={form.affiliateCommission}
          onChange={handleFieldChange("affiliateCommission")}
          className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink"
        />
        <input
          type="number"
          min={0}
          placeholder={locale === "ar" ? "خصم العميل (مبلغ ثابت)" : "Customer Discount (Fixed Amount)"}
          value={form.productDiscount}
          onChange={handleFieldChange("productDiscount")}
          className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink"
        />
      </div>

      {/* Colors + device image upload */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          type="text"
          placeholder={
            locale === "ar" ? "الألوان (مفصولة بفاصلة) مثال: black, stone" : "Colors (comma-separated) e.g. black, stone"
          }
          value={form.colors}
          onChange={handleFieldChange("colors")}
          className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate">
            {locale === "ar" ? "صور المنتج (من الجهاز)" : "Product Images (from device)"}
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
            className="border border-line bg-paper px-3 py-1.5 text-sm text-ink focus:border-ink"
          />
          {imageFiles.length > 0 && (
            <span className="text-xs text-slate mt-1">
              {locale === "ar" ? `تم اختيار ${imageFiles.length} صور` : `${imageFiles.length} images selected`}
            </span>
          )}
        </div>
      </div>

      {/* Bulk vs per-size stock method */}
      <div className="border-t border-line pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate">
          {locale === "ar" ? "طريقة تحديد المخزون" : "Stock Entry Method"}
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="radio"
              name="bulkMode"
              checked={bulkMode}
              onChange={() => handleBulkModeToggle(true)}
              className="h-4 w-4 border border-line text-ink accent-ink"
            />
            {locale === "ar" ? "كمية واحدة لكل المقاسات" : "Apply same quantity to all sizes"}
          </label>

          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="radio"
              name="bulkMode"
              checked={!bulkMode}
              onChange={() => handleBulkModeToggle(false)}
              className="h-4 w-4 border border-line text-ink accent-ink"
            />
            {locale === "ar" ? "تحديد الكمية لكل مقاس يدويًا" : "Set per size manually"}
          </label>
        </div>

        {bulkMode ? (
          <div className="mt-4 max-w-xs">
            <label className="mb-1.5 block text-xs font-medium text-slate">
              {locale === "ar" ? "الكمية لكل المقاسات" : "Quantity for all sizes"}
            </label>
            <input
              type="number"
              min={0}
              value={bulkQuantity}
              onChange={handleBulkQuantityChange}
              placeholder="0"
              className="w-full border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink"
            />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {sizeScale.map((size) => (
              <div key={size}>
                <label className="mb-1 block text-center text-xs font-semibold text-slate">{size}</label>
                <input
                  type="number"
                  min={0}
                  value={stockBySize[size]}
                  onChange={handlePerSizeChange(size)}
                  placeholder="0"
                  className="w-full border border-line bg-paper px-2 py-2 text-center text-sm text-ink focus:border-ink"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end border-t border-line pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-1.5 bg-ink px-6 py-2.5 text-xs font-semibold uppercase tracking-wide text-paper transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus size={14} strokeWidth={2} />
          {submitting
            ? locale === "ar"
              ? "جارٍ الإضافة..."
              : "Adding..."
            : locale === "ar"
            ? "إضافة المنتج"
            : "Add Product"}
        </button>
      </div>
    </form>
  );
}

function AddCollectionForm({ onAdd }) {
  const { t, locale } = useLanguage();
  const [form, setForm] = useState({
    nameEn: "",
    nameAr: "",
    descriptionEn: "",
    descriptionAr: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Category filter for the product picker below. Changing this only
  // changes which products are *shown* — it never touches selectedProducts.
  const [activeCategory, setActiveCategory] = useState(PRODUCT_TYPE_OPTIONS[0].value);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState(null);

  // Accumulates across every category the admin has browsed, keyed by
  // product _id so toggling a checkbox is an O(1) lookup. This object is
  // never reset when activeCategory changes — only individual checkbox
  // toggles add or remove an entry — so T-shirts picked earlier survive
  // switching to Pants and back.
  const [selectedProducts, setSelectedProducts] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function fetchCategoryProducts() {
      setLoadingProducts(true);
      setProductsError(null);
      try {
        const { data } = await api.get("/products", { params: { type: activeCategory } });
        const products = data?.data?.products || [];
        if (!cancelled) {
          setCategoryProducts(products);
        }
      } catch (err) {
        if (!cancelled) {
          setProductsError(
            err.response?.data?.message ||
              err.message ||
              (locale === "ar" ? "تعذر تحميل المنتجات." : "Could not load products.")
          );
        }
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    }

    fetchCategoryProducts();
    return () => {
      cancelled = true;
    };
  }, [activeCategory, locale]);

  const toggleProductSelection = (product) => {
    const productId = product._id || product.id;
    setSelectedProducts((prev) => {
      const next = { ...prev };
      if (next[productId]) {
        delete next[productId];
      } else {
        next[productId] = product;
      }
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
      setSubmitError(
        locale === "ar" ? "الاسم بالإنجليزية والعربية مطلوب." : "English and Arabic names are required."
      );
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
      const { data } = await api.post("/collections", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const createdCollection = data?.data?.collection || data?.collection;

      if (typeof onAdd === "function" && createdCollection) {
        onAdd(createdCollection);
      }

      resetForm();
    } catch (err) {
      setSubmitError(
        err.response?.data?.message ||
          err.message ||
          (locale === "ar" ? "حدث خطأ أثناء إضافة المجموعة." : "Something went wrong while adding the collection.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 border border-line p-4">
      {submitError && (
        <p className="border border-red-700 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">
          {submitError}
        </p>
      )}

      {/* صف الأسماء المترجمة */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          type="text"
          placeholder={`${t("admin.collectionName")} (EN)`}
          value={form.nameEn}
          onChange={(e) => setForm((prev) => ({ ...prev, nameEn: e.target.value }))}
          className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink"
        />
        <input
          type="text"
          placeholder={`${t("admin.collectionName")} (AR)`}
          value={form.nameAr}
          onChange={(e) => setForm((prev) => ({ ...prev, nameAr: e.target.value }))}
          dir="rtl"
          className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink"
        />
      </div>

      {/* صف الأوصاف المترجمة */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          type="text"
          placeholder={`${t("admin.collectionDesc")} (EN)`}
          value={form.descriptionEn}
          onChange={(e) => setForm((prev) => ({ ...prev, descriptionEn: e.target.value }))}
          className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink"
        />
        <input
          type="text"
          placeholder={`${t("admin.collectionDesc")} (AR)`}
          value={form.descriptionAr}
          onChange={(e) => setForm((prev) => ({ ...prev, descriptionAr: e.target.value }))}
          dir="rtl"
          className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate">
          {locale === "ar" ? "صورة المجموعة (من الجهاز)" : "Collection Image (from device)"}
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          className="w-full border border-line bg-paper px-3 py-1.5 text-sm text-ink focus:border-ink"
        />
      </div>

      {/* Category filter + product picker */}
      <div className="border-t border-line pt-4">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate">
          {locale === "ar" ? "فلتر الفئة" : "Category Filter"}
        </label>
        <select
          value={activeCategory}
          onChange={(e) => setActiveCategory(e.target.value)}
          className="w-full border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink sm:w-64"
        >
          {PRODUCT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {locale === "ar" ? opt.labelAr : opt.labelEn}
            </option>
          ))}
        </select>

        <div className="mt-3 max-h-72 overflow-y-auto border border-line">
          {loadingProducts ? (
            <p className="p-4 text-center text-sm text-slate">
              {locale === "ar" ? "جارٍ تحميل المنتجات..." : "Loading products..."}
            </p>
          ) : productsError ? (
            <p className="p-4 text-center text-sm text-red-700">{productsError}</p>
          ) : categoryProducts.length === 0 ? (
            <p className="p-4 text-center text-sm text-slate">
              {locale === "ar" ? "لا توجد منتجات في هذه الفئة." : "No products in this category."}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
              {categoryProducts.map((product) => {
                const productId = product._id || product.id;
                const isChecked = Boolean(selectedProducts[productId]);
                const displayName = (locale === "ar" ? product.nameAr : product.name) || product.name;
                return (
                  <label
                    key={productId}
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5 bg-paper px-3 py-2.5 text-sm transition-colors",
                      isChecked && "bg-paper-dim"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleProductSelection(product)}
                      className="h-4 w-4 shrink-0 border border-line text-ink accent-ink"
                    />
                    <span className="flex-1 truncate text-ink">{displayName}</span>
                    <span className="shrink-0 text-xs text-slate">
                      {formatPrice(product.price, locale, t("common.currency"))}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Preview of everything selected so far, across all categories */}
      <div className="border-t border-line pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate">
          {locale === "ar"
            ? `المنتجات المختارة (${selectedList.length})`
            : `Selected Products (${selectedList.length})`}
        </p>

        {selectedList.length === 0 ? (
          <p className="text-sm text-slate-light">
            {locale === "ar" ? "لم تختر أي منتجات بعد." : "No products selected yet."}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedList.map((product) => {
              const productId = product._id || product.id;
              const displayName = (locale === "ar" ? product.nameAr : product.name) || product.name;
              return (
                <span
                  key={productId}
                  className="flex items-center gap-1.5 border border-ink bg-paper-dim px-2.5 py-1 text-xs text-ink"
                >
                  {displayName}
                  <button
                    type="button"
                    onClick={() => removeSelectedProduct(productId)}
                    aria-label={locale === "ar" ? "إزالة" : "Remove"}
                    className="text-slate hover:text-ink"
                  >
                    <X size={12} strokeWidth={2} />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end border-t border-line pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="flex shrink-0 items-center gap-1.5 bg-ink px-6 py-2 text-xs font-semibold text-paper transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus size={14} strokeWidth={2} />
          {submitting ? (locale === "ar" ? "جارٍ الإضافة..." : "Adding...") : t("admin.addCollection")}
        </button>
      </div>
    </form>
  );
}

function ProductsAndCollectionsTab() {
  const { t, locale } = useLanguage();
  const [products, setProducts] = useState(initialProducts);
  const [collections, setCollections] = useState(initialCollections);

  const handleAddProduct = (product) => {
    setProducts((prev) => [product, ...prev]);
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await api.delete(`/products/${productId}`);
      setProducts((prev) => prev.filter((p) => (p._id || p.id) !== productId));
    } catch {
      // Leave the row in place if the delete failed server-side rather than
      // optimistically removing a product that's still in the database.
    }
  };

  const handleAddCollection = (collection) => {
    setCollections((prev) => [collection, ...prev]);
  };

  const handleDeleteCollection = async (collectionId) => {
    try {
      await api.delete(`/collections/${collectionId}`);
      setCollections((prev) => prev.filter((c) => (c._id || c.id) !== collectionId));
    } catch {
      // Same as above — keep the row if the server-side delete failed.
    }
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Products */}
      <div>
        <h2 className="label-tracked text-ink">{t("admin.productsTitle")}</h2>
        <div className="mt-4">
          <AddProductForm onAdd={handleAddProduct} />
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
                  const displayName = (locale === "ar" ? product.nameAr : product.name) || product.name;
                  const displayCategory = product.productType
                    ? t(`categories.${{ "t-shirt": "tshirts", jacket: "jackets", hoodie: "hoodies", pants: "pants" }[product.productType] || product.productType}`)
                    : t(`categories.${product.category}`);
                  return (
                    <tr key={productId} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 text-sm font-medium text-ink">{displayName}</td>
                      <td className="px-4 py-3 text-sm text-slate">{displayCategory}</td>
                      <td className="px-4 py-3 text-sm text-ink">
                        {formatPrice(product.price, locale, t("common.currency"))}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate">{product.stock}</td>
                      <td className="px-4 py-3">
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

      {/* Collections */}
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

// ---------------------------------------------------------------------------
// AFFILIATE LEDGER TAB — Owner/Manager only (جرد العمولات والأرباح)
// ---------------------------------------------------------------------------
function AffiliateLedgerTab() {
  const { t, locale } = useLanguage();
  
  // Mock Data (تقدر تنقلها لملف mockDashboard لاحقاً)
  const [ledgers, setLedgers] = useState([
    { id: "af1", name: "Ahmed Karim", code: "AHMED10", totalOrders: 24, topProduct: "Toronto Black Hoodie", pendingCommission: 1200, status: "pending" },
    { id: "af2", name: "Sara Ali", code: "SARA20", totalOrders: 5, topProduct: "Minimalist Tee", pendingCommission: 350, status: "paid" },
  ]);

  const handleConfirmPayout = (id) => {
    // هنا بيضرب الـ API عشان يأكد إن العمولة اتدفعت للمسوق
    setLedgers((prev) =>
      prev.map((ledger) => (ledger.id === id ? { ...ledger, status: "paid", pendingCommission: 0 } : ledger))
    );
  };

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
              <td className="px-4 py-3 text-sm text-slate">{ledger.topProduct}</td>
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
                      className="flex items-center gap-1 bg-ink text-paper px-2 py-1 text-xs hover:opacity-85"
                    >
                      <Check size={14} strokeWidth={2} /> {t("admin.confirmPayout")}
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

// ---------------------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// MAIN EXPORT COMPONENT
// ---------------------------------------------------------------------------
export default function ManagerDashboard() {
  const { t, locale } = useLanguage();
  // لو عايزه أونر اكتب: ROLES.OWNER
  // لو عايزه أدمن اكتب: ROLES.ADMIN
  const currentRole = ROLES.OWNER;

  const [activeTab, setActiveTab] = useState(TABS.ORDERS);
  const permittedTabs = PERMITTED_TABS[currentRole] || [];

  // كود أمان: لو الـ activeTab الحالية مش مسموحة للـ Admin يرجعه لتاب الطلبات
  useEffect(() => {
    if (!permittedTabs.includes(activeTab)) {
      setActiveTab(TABS.ORDERS);
    }
  }, [currentRole, permittedTabs, activeTab]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tightest text-ink sm:text-3xl">
            {t("admin.dashboardTitle")}
          </h1>
          <p className="mt-2 text-sm text-slate">{t("admin.dashboardSubtitle")}</p>
        </div>

        {/* Analytics — Owner/Manager only */}
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
        {/* تاب الطلبات - مسموح للكل */}
        <TabButton
          active={activeTab === TABS.ORDERS}
          onClick={() => setActiveTab(TABS.ORDERS)}
          icon={Package}
          label={t("admin.tabOrders")}
        />
        
        {/* تابة المسوقين - بتظهر للأونر بس */}
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
        {/* تابة المنتجات - مسموح للكل */}
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