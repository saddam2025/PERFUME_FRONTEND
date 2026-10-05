import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const CartContext = createContext(null);

const SHIPPING_FLAT_RATE = 100;
const FREE_SHIPPING_THRESHOLD = 6000;

function lineKey(productId, size, colorId) {
  return `${productId}__${size}__${colorId || "default"}`;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [serverPricing, setServerPricing] = useState(null);
  const [pricingError, setPricingError] = useState("");
  const [freeSelectionsByProduct, setFreeSelectionsByProduct] = useState({});

  const addItem = (product, size, color, qty = 1) => {
    setItems((prev) => {
      // 1. استخراج الـ ID الصحيح سواء كان جاي من الداتابيز أو داتا وهمية
      const pId = product._id || product.id;
      const cId = color?._id || color?.id;

      const key = lineKey(pId, size, cId);
      
      const existingIndex = prev.findIndex(
        (item) => lineKey(item.product._id || item.product.id, item.size, item.color?._id || item.color?.id) === key
      );
      
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = { ...next[existingIndex], qty: next[existingIndex].qty + qty };
        return next;
      }
      
      // 2. ضفنا productId و _id صريحين في جذر الأوبجكت عشان الـ Checkout يلقطهم بدون أي مجهود
      return [...prev, { productId: pId, _id: pId, product, size, color, qty }];
    });
  };

  const removeItem = (productId, size, colorId) => {
    setItems((prev) =>
      prev.filter((item) => lineKey(item.product._id || item.product.id, item.size, item.color?._id || item.color?.id) !== lineKey(productId, size, colorId))
    );
  };

  const updateQty = (productId, size, colorId, qty) => {
    if (qty <= 0) {
      removeItem(productId, size, colorId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        lineKey(item.product._id || item.product.id, item.size, item.color?._id || item.color?.id) === lineKey(productId, size, colorId)
          ? { ...item, qty }
          : item
      )
    );
  };

  const incrementQty = (productId, size, colorId) => {
    setItems((prev) =>
      prev.map((item) =>
        lineKey(item.product._id || item.product.id, item.size, item.color?._id || item.color?.id) === lineKey(productId, size, colorId)
          ? { ...item, qty: item.qty + 1 }
          : item
      )
    );
  };

  const decrementQty = (productId, size, colorId) => {
    setItems((prev) => {
      const key = lineKey(productId, size, colorId);
      const target = prev.find((item) => lineKey(item.product._id || item.product.id, item.size, item.color?._id || item.color?.id) === key);
      if (target && target.qty <= 1) {
        return prev.filter((item) => lineKey(item.product._id || item.product.id, item.size, item.color?._id || item.color?.id) !== key);
      }
      return prev.map((item) =>
        lineKey(item.product._id || item.product.id, item.size, item.color?._id || item.color?.id) === key ? { ...item, qty: item.qty - 1 } : item
      );
    });
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
    setFreeSelectionsByProduct({});
    setServerPricing(null);
  };

  const setFreeSelections = (productId, selections) => {
    setFreeSelectionsByProduct((previous) => ({ ...previous, [productId]: selections }));
  };

  useEffect(() => {
    if (!items.length) {
      setServerPricing(null);
      setPricingError("");
      return undefined;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const seenProducts = new Set();
        const pricingItems = items.map((item) => {
          const productId = item.product._id || item.product.id;
          const firstForProduct = !seenProducts.has(String(productId));
          seenProducts.add(String(productId));
          return {
            productId,
            quantity: item.qty,
            size: item.size || null,
            color: item.color?.nameEn || item.color?.id || null,
            ...(firstForProduct && freeSelectionsByProduct[productId]?.length
              ? { freeSelections: freeSelectionsByProduct[productId].map((selection) => ({ ...selection, color: selection.color?.nameEn || selection.color?.id || selection.color || null })) }
              : {}),
          };
        });
        const { data } = await api.post("/orders/preview", { items: pricingItems, affiliateCode: appliedCoupon?.code });
        if (!cancelled) {
          setServerPricing(data.pricing);
          setPricingError("");
          setCouponError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setServerPricing(null);
          setPricingError(error.response?.data?.message || "");
          if (appliedCoupon) setCouponError("invalid");
        }
      }
    }, 180);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [items, appliedCoupon, freeSelectionsByProduct]);

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items]);
  
  const localSubtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.qty, 0),
    [items]
  );
  const subtotal = serverPricing?.subtotal ?? localSubtotal;
  
  const shipping = useMemo(() => {
    if (items.length === 0) return 0;
    if (serverPricing) return serverPricing.shippingCost || 0;
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
  }, [subtotal, items.length, serverPricing]);

  const discount = useMemo(() => {
    if (serverPricing) return serverPricing.totalDiscount || 0;
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === "percent") {
      return Math.round((subtotal * appliedCoupon.value) / 100);
    }
    return Number.isFinite(appliedCoupon.value) ? Math.min(appliedCoupon.value, subtotal) : 0;
  }, [appliedCoupon, subtotal, serverPricing]);

  const total = useMemo(
    () => Math.max(serverPricing?.totalOrderPrice ?? (subtotal - discount + shipping), 0),
    [subtotal, discount, shipping, serverPricing]
  );

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError("empty");
      return;
    }
    setAppliedCoupon({ code });
    setCouponError(null);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  };

  const value = {
    items,
    serverPricing,
    pricingError,
    freeSelectionsByProduct,
    setFreeSelections,
    addItem,
    removeItem,
    updateQty,
    incrementQty,
    decrementQty,
    clearCart,
    itemCount,
    subtotal,
    shipping,
    discount,
    total,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    couponInput,
    setCouponInput,
    appliedCoupon,
    couponError,
    applyCoupon,
    removeCoupon,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
