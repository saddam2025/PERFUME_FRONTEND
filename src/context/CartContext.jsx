import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const CartContext = createContext(null);

const SHIPPING_FLAT_RATE = 100;
const FREE_SHIPPING_THRESHOLD = 6000;
const CART_STORAGE_KEY = "toronto_cart";

function lineKey(productId, volumeMl) {
  return `${productId}__${Number(volumeMl)}`;
}

function loadCart() {
  if (typeof window === "undefined") return [];
  try {
    const saved = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    return saved.filter((item) => item?.product && Number.isFinite(Number(item.volumeMl)) && Number(item.volumeMl) > 0)
      .map((item) => ({ ...item, volumeMl: Number(item.volumeMl), qty: Math.max(1, Number(item.qty) || 1) }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [serverPricing, setServerPricing] = useState(null);
  const [pricingError, setPricingError] = useState("");
  const addItem = (product, volumeMl, qty = 1) => {
    setItems((prev) => {
      const pId = product._id || product.id;
      const variant = product.variants?.find((entry) => Number(entry.volumeMl) === Number(volumeMl));
      if (!pId || !variant) return prev;
      const key = lineKey(pId, volumeMl);
      const existingIndex = prev.findIndex((item) => lineKey(item.product._id || item.product.id, item.volumeMl) === key);

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = { ...next[existingIndex], qty: next[existingIndex].qty + qty };
        return next;
      }

      return [...prev, { productId: pId, _id: pId, product, volumeMl: Number(volumeMl), price: Number(variant.price), qty }];
    });
  };

  const removeItem = (productId, volumeMl) => {
    setItems((prev) => prev.filter((item) => lineKey(item.product._id || item.product.id, item.volumeMl) !== lineKey(productId, volumeMl)));
  };

  const updateQty = (productId, volumeMl, qty) => {
    if (qty <= 0) {
      removeItem(productId, volumeMl);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        lineKey(item.product._id || item.product.id, item.volumeMl) === lineKey(productId, volumeMl)
          ? { ...item, qty }
          : item
      )
    );
  };

  const incrementQty = (productId, volumeMl) => {
    setItems((prev) =>
      prev.map((item) =>
        lineKey(item.product._id || item.product.id, item.volumeMl) === lineKey(productId, volumeMl)
          ? { ...item, qty: item.qty + 1 }
          : item
      )
    );
  };

  const decrementQty = (productId, volumeMl) => {
    setItems((prev) => {
      const key = lineKey(productId, volumeMl);
      const target = prev.find((item) => lineKey(item.product._id || item.product.id, item.volumeMl) === key);
      if (target && target.qty <= 1) {
        return prev.filter((item) => lineKey(item.product._id || item.product.id, item.volumeMl) !== key);
      }
      return prev.map((item) =>
        lineKey(item.product._id || item.product.id, item.volumeMl) === key ? { ...item, qty: item.qty - 1 } : item
      );
    });
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Could not save cart", error);
    }
  }, [items]);

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
    setServerPricing(null);
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
        const pricingItems = items.map((item) => {
          const productId = item.product._id || item.product.id;
          return {
            productId,
            quantity: item.qty,
            volumeMl: item.volumeMl,
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
  }, [items, appliedCoupon]);

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items]);
  
  const localSubtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price || item.product.price) * item.qty, 0),
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
