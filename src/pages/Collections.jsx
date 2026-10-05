// Checkout.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Truck, Loader2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/cn";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../lib/formatPrice";
import api from "../api/axios";

export default function Checkout() {
  const { t, locale } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const {
    items,
    subtotal,
    shipping,
    discount,
    total,
    appliedCoupon,
    clearCart,
  } = useCart();

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [formData, setFormData] = useState({ name: "", address: "", phone: "", city: "" });
  const [affiliateCode, setAffiliateCode] = useState(appliedCoupon?.code || "");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (items.length === 0) {
      navigate("/cart");
    }
  }, [items, navigate]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitError(null);
    setSubmitting(true);

    try {
      const payload = {
        items: items.map((item) => ({
          productId: item.product.id || item.product._id,
          quantity: item.qty,
        })),
        affiliateCode: affiliateCode.trim() || undefined,
      };

      const { data } = await api.post("/orders", payload);
      const order = data.order;

      clearCart();
      navigate("/order-success", {
        state: {
          total: order.totalOrderPrice,
          paymentMethod,
          orderNumber: `ORD-${String(order._id).slice(-6).toUpperCase()}`,
        },
      });
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || t("checkout.orderError")
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8" dir={locale === "ar" ? "rtl" : "ltr"}>
      <h1 className="font-display text-2xl font-bold uppercase text-ink mb-8">
        {t("checkout.title")}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Shipping Form & Payment Selection */}
        <form onSubmit={handleSubmit} className="space-y-4 border border-line p-6 bg-paper-dim">
          <h3 className="text-sm font-bold uppercase tracking-wider text-ink mb-3">
            {t("checkout.shippingDetails")}
          </h3>

          <div>
            <label className="block text-xs uppercase font-semibold text-slate mb-1">
              {t("checkout.fullName")}
            </label>
            <input
              type="text"
              className="w-full border border-line bg-paper px-3 py-2 text-sm focus:border-ink outline-none"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs uppercase font-semibold text-slate mb-1">
              {t("checkout.city")}
            </label>
            <input
              type="text"
              className="w-full border border-line bg-paper px-3 py-2 text-sm focus:border-ink outline-none"
              required
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs uppercase font-semibold text-slate mb-1">
              {t("checkout.address")}
            </label>
            <input
              type="text"
              className="w-full border border-line bg-paper px-3 py-2 text-sm focus:border-ink outline-none"
              required
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs uppercase font-semibold text-slate mb-1">
              {t("checkout.phone")}
            </label>
            <input
              type="tel"
              className="w-full border border-line bg-paper px-3 py-2 text-sm focus:border-ink outline-none"
              required
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          {/* Affiliate Code */}
          <div>
            <label className="block text-xs uppercase font-semibold text-slate mb-1">
              {t("checkout.affiliateCode")}
            </label>
            <input
              type="text"
              placeholder={t("checkout.affiliateCodePlaceholder")}
              className="w-full border border-line bg-paper px-3 py-2 text-sm uppercase focus:border-ink outline-none"
              value={affiliateCode}
              onChange={(e) => setAffiliateCode(e.target.value)}
            />
          </div>

          {/* Payment Selection */}
          <div className="mt-8 pt-4 border-t border-line">
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink mb-3">
              {t("checkout.paymentMethod")}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

              <button
                type="button"
                onClick={() => setPaymentMethod("cod")}
                className={cn(
                  "flex items-center justify-between border p-4 text-start transition-colors bg-paper",
                  paymentMethod === "cod" ? "border-ink bg-paper-dim" : "border-line hover:border-slate"
                )}
              >
                <div className="flex items-center gap-3">
                  <Truck size={18} className="text-ink" />
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {t("checkout.codTitle")}
                    </p>
                    <p className="text-xs text-slate mt-0.5">
                      {t("checkout.codDesc")}
                    </p>
                  </div>
                </div>
                <div className={cn("h-3 w-3 rounded-full border-2 shrink-0", paymentMethod === "cod" ? "border-ink bg-ink" : "border-slate")} />
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={cn(
                  "flex items-center justify-between border p-4 text-start transition-colors bg-paper",
                  paymentMethod === "card" ? "border-ink bg-paper-dim" : "border-line hover:border-slate"
                )}
              >
                <div className="flex items-center gap-3">
                  <CreditCard size={18} className="text-ink" />
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {t("checkout.cardTitle")}
                    </p>
                    <p className="text-xs text-slate mt-0.5">
                      {t("checkout.cardDesc")}
                    </p>
                  </div>
                </div>
                <div className={cn("h-3 w-3 rounded-full border-2 shrink-0", paymentMethod === "card" ? "border-ink bg-ink" : "border-slate")} />
              </button>

            </div>
          </div>

          {submitError && (
            <div className="border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 bg-ink text-paper py-3 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity mt-6 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? t("checkout.placingOrder") : t("cart.placeOrder")}
          </button>
        </form>

        {/* Order Summary Right Panel */}
        <div className="border border-line p-6 h-fit bg-paper sticky top-24">
          <h3 className="text-sm font-bold uppercase tracking-wider text-ink mb-4">
            {t("cart.orderSummary")}
          </h3>
          <div className="space-y-3 text-sm text-slate">
            <div className="flex justify-between">
              <span>{t("cart.subtotal")}</span>
              <span className="font-semibold text-ink">{formatPrice(subtotal, locale, t("common.currency"))}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>{t("cart.discount")}</span>
                <span>- {formatPrice(discount, locale, t("common.currency"))}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>{t("cart.shipping")}</span>
              <span className="font-semibold text-ink">
                {shipping === 0 ? t("cart.free") : formatPrice(shipping, locale, t("common.currency"))}
              </span>
            </div>

            {shipping > 0 && (
              <p className="text-[11px] text-amber-600 bg-amber-50 p-1.5 text-center font-medium mt-3 border border-amber-200">
                {t("cart.freeShippingProgress", { amount: formatPrice(6000 - subtotal, locale, t("common.currency")) })}
              </p>
            )}

            <hr className="border-line my-4" />
            <div className="flex justify-between text-base text-ink font-bold">
              <span>{t("cart.grandTotal")}</span>
              <span>{formatPrice(total, locale, t("common.currency"))}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}