// frontend/src/pages/Checkout.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Truck, Check } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { cn } from "../lib/cn";
import { formatPrice } from "../lib/formatPrice";
import api from "../api/axios";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

function resolveProductId(item) {
  return (
    item.productId ||
    item._id ||
    item.id ||
    item.product?._id ||
    item.product?.id ||
    null
  );
}

function resolveQuantity(item) {
  const raw = item.qty ?? item.quantity ?? 1;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

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
    freeSelectionsByProduct,
    serverPricing,
    clearCart,
  } = useCart();
  const [formData, setFormData] = useState({ name: "", address: "", phone: "", city: "" });
  const shippingFormTouched = useRef(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let cancelled = false;
    api.get("/auth/me").then(({ data }) => {
      const saved = data?.user?.shippingInfo;
      if (cancelled || !saved || shippingFormTouched.current) return;
      setFormData({
        name: saved.name || "",
        address: saved.address || "",
        phone: saved.phone || "",
        city: saved.city || "",
      });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  useEffect(() => {
    if (items.length === 0 && !isSubmitting && !orderPlaced) {
      navigate("/cart");
    }
  }, [items, navigate, isSubmitting, orderPlaced]);
// frontend/src/pages/Checkout.jsx — only handleSubmit's payload-building changed
  const buildOrderItems = () => {
    const seenProducts = new Set();
    return items.map((item) => {
      const productId = resolveProductId(item);
      const firstForProduct = !seenProducts.has(String(productId));
      seenProducts.add(String(productId));
      return ({
      productId,
      quantity: resolveQuantity(item),
      // FIX: size/color were being silently dropped — the cart line has
      // them (item.size is a string, item.color is the color object from
      // productHelpers with { nameEn, nameAr, id }), they just never made
      // it into the request payload.
      size: item.size || null,
      color: item.color?.nameEn || item.color?.id || item.color || null,
      ...(firstForProduct && freeSelectionsByProduct[productId]?.length ? { freeSelections: freeSelectionsByProduct[productId].map((selection) => ({ ...selection, color: selection.color?.nameEn || selection.color?.id || selection.color || null })) } : {}),
    });
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const orderItems = buildOrderItems();
    const invalidItem = orderItems.find((item) => !item.productId || item.quantity < 1);
    if (invalidItem) {
      setErrorMessage(
        locale === "ar"
          ? "أحد المنتجات في سلتك غير صالح. برجاء إزالته وإضافته مرة أخرى."
          : "One of the items in your cart is invalid. Please remove and re-add it."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (paymentMethod === "card") {
        // Step 3 of the Paymob flow: hand off to the backend, which runs
        // Auth Token -> Register Order -> Payment Key and returns an
        // iframe URL we redirect the customer into.
        const response = await api.post("/orders/pay/paymob", {
          items: orderItems,
          affiliateCode: appliedCoupon ? appliedCoupon.code : undefined,
          shippingDetails: formData,
        });

        const iframeUrl = response.data.iframeUrl;
        if (!iframeUrl) {
          throw new Error(
            locale === "ar" ? "فشل إنشاء رابط الدفع الإلكتروني" : "Failed to generate payment URL."
          );
        }

        if (Math.abs(Number(response.data.totalOrderPrice) - total) > 0.01) {
          window.alert(locale === "ar" ? `تم تحديث إجمالي الطلب إلى ${response.data.totalOrderPrice} ج.م قبل الدفع.` : `The order total changed to EGP ${response.data.totalOrderPrice} before payment.`);
        }

        // Cart is cleared once the customer reaches Paymob — the order
        // already exists server-side (Pending/Pending) and the webhook
        // will mark it Paid on success.
        clearCart();
        window.location.href = iframeUrl;
        return;
      }
      // Cash On Delivery
      const response = await api.post("/orders", {
        items: orderItems,
        affiliateCode: appliedCoupon ? appliedCoupon.code : undefined,
        // FIX: previously only sent to the Paymob endpoint, never to COD.
        shippingDetails: formData,
      });

      clearCart();
      setOrderResult(response.data.order);
      setOrderPlaced(true);

      setTimeout(() => {
        navigate("/order-success", {
          state: { total: response.data.order?.totalOrderPrice ?? total, totalChanged: Math.abs((response.data.order?.totalOrderPrice ?? total) - (serverPricing?.totalOrderPrice ?? total)) > 0.01, appliedPromotions: response.data.order?.appliedPromotions || [], paymentMethod, orderId: response.data.order?._id },
        });
      }, 1200);
    } catch (err) {
      console.error("Order Submission Error:", err);
      setErrorMessage(
        err.response?.data?.message ||
          err.message ||
          (locale === "ar"
            ? "حدث خطأ أثناء تنفيذ الطلب. يرجى المحاولة مرة أخرى."
            : "Error placing order. Please try again.")
      );
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && !orderPlaced) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8" dir={locale === "ar" ? "rtl" : "ltr"}>
      {orderPlaced && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 px-4">
          <div className="flex flex-col items-center gap-3 bg-paper px-8 py-10 text-center shadow-xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink">
              <Check size={28} strokeWidth={2.5} className="text-paper" />
            </div>
            <p className="font-display text-lg font-bold text-ink">
              {locale === "ar" ? "تم تقديم طلبك بنجاح!" : "Your order has been placed successfully!"}
            </p>
            <p className="text-xs text-slate">
              {locale === "ar" ? "جاري تحويلك..." : "Redirecting you now..."}
            </p>
            {orderResult?.appliedPromotions?.length > 0 && <p className="mt-2 max-w-sm text-xs text-slate">{locale === "ar" ? "العروض المطبقة" : "Applied offers"}: {orderResult.appliedPromotions.map((promotion) => promotion.name).join(" · ")} · {locale === "ar" ? "إجمالي الخصم" : "Total savings"}: EGP {orderResult.totalDiscount?.toFixed(2)}</p>}
          </div>
        </div>
      )}

      <h1 className="font-display text-2xl font-bold uppercase text-ink mb-8">
        {locale === "ar" ? "إتمام الشراء" : "Checkout"}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        <form onSubmit={handleSubmit} className="space-y-4 border border-line p-6 bg-paper-dim">
          <h3 className="text-sm font-bold uppercase tracking-wider text-ink mb-3">
            {locale === "ar" ? "تفاصيل الشحن" : "Shipping Details"}
          </h3>

          <div>
            <label className="block text-xs uppercase font-semibold text-slate mb-1">
              {locale === "ar" ? "الاسم بالكامل" : "Full Name"}
            </label>
            <input
              type="text"
              className="w-full border border-line bg-paper px-3 py-2 text-sm focus:border-ink outline-none"
              required
              value={formData.name}
              onChange={(e) => { shippingFormTouched.current = true; setFormData((prev) => ({ ...prev, name: e.target.value })); }}
            />
          </div>
          <div>
            <label className="block text-xs uppercase font-semibold text-slate mb-1">
              {locale === "ar" ? "العنوان بالتفصيل" : "Address"}
            </label>
            <input
              type="text"
              className="w-full border border-line bg-paper px-3 py-2 text-sm focus:border-ink outline-none"
              required
              value={formData.address}
              onChange={(e) => { shippingFormTouched.current = true; setFormData((prev) => ({ ...prev, address: e.target.value })); }}
            />
          </div>
          <div>
            <label className="block text-xs uppercase font-semibold text-slate mb-1">
              {locale === "ar" ? "رقم الهاتف" : "Phone Number"}
            </label>
            <input
              type="tel"
              className="w-full border border-line bg-paper px-3 py-2 text-sm focus:border-ink outline-none"
              required
              value={formData.phone}
              onChange={(e) => { shippingFormTouched.current = true; setFormData((prev) => ({ ...prev, phone: e.target.value })); }}
            />
          </div>
          <div>
            <label className="block text-xs uppercase font-semibold text-slate mb-1">{t("cart.city")}</label>
            <input
              type="text"
              className="w-full border border-line bg-paper px-3 py-2 text-sm focus:border-ink outline-none"
              required
              placeholder={t("cart.cityPlaceholder")}
              value={formData.city}
              onChange={(e) => { shippingFormTouched.current = true; setFormData((prev) => ({ ...prev, city: e.target.value })); }}
            />
          </div>

          <div className="mt-8 pt-4 border-t border-line">
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink mb-3">
              {locale === "ar" ? "طريقة الدفع" : "Payment Method"}
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
                      {locale === "ar" ? "الدفع عند الاستلام (COD)" : "Cash On Delivery (COD)"}
                    </p>
                    <p className="text-xs text-slate mt-0.5">
                      {locale === "ar" ? "الدفع نقداً عند استلام الشحنة." : "Pay in cash upon doorstep receipt."}
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
                      {locale === "ar" ? "بطاقة ائتمان / ميزة" : "Online Credit / Debit Card"}
                    </p>
                    <p className="text-xs text-slate mt-0.5">
                      {locale === "ar" ? "دفع آمن عبر فيزا أو ماستركارد." : "Secure payment via Visa or Mastercard."}
                    </p>
                  </div>
                </div>
                <div className={cn("h-3 w-3 rounded-full border-2 shrink-0", paymentMethod === "card" ? "border-ink bg-ink" : "border-slate")} />
              </button>

            </div>
          </div>

          {errorMessage && (
            <p className="text-sm font-medium text-red-700 bg-red-50 border border-red-200 p-3 mt-4 text-center">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-ink text-paper py-4 text-sm font-bold uppercase tracking-widest hover:opacity-90 transition-opacity mt-6 disabled:opacity-50"
          >
            {isSubmitting
              ? (locale === "ar" ? "جاري معالجة طلبك..." : "Processing...")
              : (paymentMethod === "card"
                  ? (locale === "ar" ? "الانتقال للدفع الإلكتروني" : "Proceed to Payment")
                  : (locale === "ar" ? "تأكيد الطلب الآن" : "Place Order Now"))}
          </button>
        </form>

        <div className="border border-line p-6 h-fit bg-paper sticky top-24">
          <h3 className="text-sm font-bold uppercase tracking-wider text-ink mb-4">
            {locale === "ar" ? "ملخص الطلب" : "Order Summary"}
          </h3>

          <div className="divide-y divide-line max-h-60 overflow-y-auto mb-4 pr-1 space-y-3">
            {items.map((item, index) => (
              <div
                key={`${item._id || item.productId || index}-${index}`}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-14 w-11 object-cover bg-paper-dim border border-line"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-ink truncate">{item.name}</h4>
                  <p className="text-[11px] text-slate mt-0.5">
                    {item.size && `${locale === "ar" ? "المقاس" : "Size"}: ${item.size}`}
                    {item.color && ` | ${locale === "ar" ? "اللون" : "Color"}: ${item.color}`}
                  </p>
                  <p className="text-xs text-ink font-medium mt-1">
                    {item.qty} × EGP {item.price?.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {(serverPricing?.appliedPromotions || []).map((promotion, index) => <div key={`${promotion.promotionId}-${index}`} className="mb-3 border border-accent/40 bg-accent/10 p-3 text-xs"><p className="font-semibold text-ink">{promotion.name} · {promotion.ruleDescription}</p><p className="mt-1 text-accent-deep">{locale === "ar" ? "وفرت" : "You save"} {formatPrice(promotion.discountAmount || 0, locale, t("common.currency"))}</p>{promotion.freeItems?.length > 0 && <p className="mt-1 text-slate">{locale === "ar" ? "القطع المجانية" : "Free items"}: {promotion.freeItems.map((freeItem) => `${freeItem.quantity}× ${freeItem.name} ${freeItem.size || ""} ${freeItem.color || ""}`).join(" · ")}</p>}</div>)}

          <div className="space-y-3 text-sm text-slate border-t border-line pt-4">
            <div className="flex justify-between">
              <span>{locale === "ar" ? "المجموع الفرعي" : "Subtotal"}</span>
              <span className="font-semibold text-ink">EGP {subtotal.toFixed(2)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>{locale === "ar" ? "الخصم" : "Discount"}</span>
                <span>- EGP {discount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>{locale === "ar" ? "الشحن" : "Shipping"}</span>
              <span className="font-semibold text-ink">
                {shipping === 0 ? (locale === "ar" ? "مجاني" : "Free") : `EGP ${shipping.toFixed(2)}`}
              </span>
            </div>

            {shipping > 0 && (
              <p className="text-[11px] text-amber-600 bg-amber-50 p-1.5 text-center font-medium mt-3 border border-amber-200">
                {locale === "ar"
                  ? `أضف بـ EGP ${(6000 - subtotal).toFixed(2)} أخرى للحصول على شحن مجاني!`
                  : `Add EGP ${(6000 - subtotal).toFixed(2)} more for FREE shipping!`}
              </p>
            )}

            <hr className="border-line my-4" />
            <div className="flex justify-between text-base text-ink font-bold">
              <span>{locale === "ar" ? "الإجمالي النهائي" : "Total"}</span>
              <span>EGP {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
