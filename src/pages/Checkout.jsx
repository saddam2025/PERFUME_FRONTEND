import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Truck } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { cn } from "../lib/cn";
import { useCart } from "../context/CartContext";

export default function Checkout() {
  const { t, locale } = useLanguage();
  const navigate = useNavigate();
  
  const { 
    items, 
    subtotal, 
    shipping, 
    discount, 
    total, 
    appliedCoupon, 
    clearCart 
  } = useCart();

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [formData, setFormData] = useState({ name: "", address: "", phone: "" });

  useEffect(() => {
    if (items.length === 0) {
      navigate("/cart");
    }
  }, [items, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const orderData = {
      items,
      subtotal,
      shippingCost: shipping,
      discount,
      finalTotal: total,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      shippingDetails: formData,
      paymentMethod
    };

    console.log("Order is ready for Backend:", orderData);
    clearCart();
    navigate("/order-success", { state: { total, paymentMethod } });
  };

  if (items.length === 0) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8" dir={locale === "ar" ? "rtl" : "ltr"}>
      <h1 className="font-display text-2xl font-bold uppercase text-ink mb-8">
        {locale === "ar" ? "إتمام الشراء" : "Checkout"}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Shipping Form & Payment Selection */}
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
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          {/* Payment Selection */}
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

          <button type="submit" className="w-full bg-ink text-paper py-3 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity mt-6">
            {locale === "ar" ? "تأكيد الطلب" : "Place Order"}
          </button>
        </form>

        {/* Order Summary Right Panel */}
        <div className="border border-line p-6 h-fit bg-paper sticky top-24">
          <h3 className="text-sm font-bold uppercase tracking-wider text-ink mb-4">
            {locale === "ar" ? "ملخص الطلب" : "Order Summary"}
          </h3>
          <div className="space-y-3 text-sm text-slate">
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