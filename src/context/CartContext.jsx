import { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

const SHIPPING_FLAT_RATE = 100;
const FREE_SHIPPING_THRESHOLD = 6000;

// Mock coupon table — in production this validates against the backend
// (AffiliateApplication / discount rules), not a hardcoded client list.
const MOCK_COUPONS = {
  WELCOME10: { type: "percent", value: 10 },
  TORONTO50: { type: "flat", value: 50 },
};

function lineKey(productId, size, colorId) {
  return `${productId}__${size}__${colorId || "default"}`;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState(null);

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
  };

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items]);
  
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.qty, 0),
    [items]
  );
  
  const shipping = useMemo(() => {
    if (items.length === 0) return 0;
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
  }, [subtotal, items.length]);

  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === "percent") {
      return Math.round((subtotal * appliedCoupon.value) / 100);
    }
    return Math.min(appliedCoupon.value, subtotal);
  }, [appliedCoupon, subtotal]);

  const total = useMemo(
    () => Math.max(subtotal - discount + shipping, 0),
    [subtotal, discount, shipping]
  );

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError("empty");
      return;
    }
    const match = MOCK_COUPONS[code];
    if (!match) {
      setAppliedCoupon(null);
      setCouponError("invalid");
      return;
    }
    setAppliedCoupon({ code, ...match });
    setCouponError(null);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  };

  const value = {
    items,
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