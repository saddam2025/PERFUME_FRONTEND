// Pure, shape-agnostic helpers shared by Shop, ProductDetails, and ProductCard.
import { getColorKey, normalizeColorOption } from "../constants/clothingColors";
export const sizesAvailable = ["XS", "S", "M", "L", "XL", "XXL", "32", "34", "36", "38", "40", "42"];

export const categories = ["tshirts", "jackets", "hoodies", "sweaters", "pants"];

export const CATEGORY_TO_PRODUCT_TYPE = {
  tshirts: "t-shirt",
  jackets: "jacket",
  hoodies: "hoodie",
  sweaters: "sweater",
  pants: "pants",
};

export const PRODUCT_TYPE_TO_CATEGORY = {
  "t-shirt": "tshirts",
  jacket: "jackets",
  hoodie: "hoodies",
  sweater: "sweaters",
  pants: "pants",
};

export function getPromotionHint(promotion, locale = "en") {
  const tier = (promotion?.tiers || []).slice().sort((a, b) => b.minQty - a.minQty)[0] || {};
  if (promotion?.type === "BUY_X_GET_Y_FREE") return locale === "ar" ? `اشتري ${tier.minQty} واحصل على ${tier.getQty} مجانًا` : `Buy ${tier.minQty} get ${tier.getQty} free`;
  if (promotion?.type === "QUANTITY_PERCENT_DISCOUNT") return locale === "ar" ? `خصم ${tier.percent}% عند شراء ${tier.minQty} فأكثر` : `${tier.percent}% off when you buy ${tier.minQty}+`;
  return locale === "ar" ? `اشترِ ${tier.minQty} بسعر ${tier.fixedPrice}` : `Buy ${tier.minQty} for ${tier.fixedPrice}`;
}

/**
 * Converts a raw API product (per backend/models/Product.js) into the shape
 * ProductCard / ProductDetails / Cart expect.
 *
 * FIXED: this previously read apiProduct.name, apiProduct.description,
 * apiProduct.productType, and apiProduct.productImageUrl — none of which
 * exist on the real schema (nameEn/descEn/category/imageUrls do). Every
 * product image was silently dropping out right here, before any
 * BASE_URL/env-var logic downstream ever got a chance to run.
 */
export function mapApiProductToUiProduct(apiProduct) {
  return {
    id: apiProduct._id,
    nameEn: apiProduct.nameEn,
    nameAr: apiProduct.nameAr,
    nameKey: apiProduct.nameEn, // legacy alias, kept in case other code still reads this
    descriptionEn: apiProduct.descEn,
    descriptionAr: apiProduct.descAr,
    descriptionKey: apiProduct.descEn, // legacy alias
    category: PRODUCT_TYPE_TO_CATEGORY[apiProduct.category] || apiProduct.category,
    price: apiProduct.price,
    compareAtPrice: apiProduct.compareAtPrice ?? null,
    sizes: Array.isArray(apiProduct.sizes) ? apiProduct.sizes : [],
    colors: Array.isArray(apiProduct.colors) ? apiProduct.colors.map(normalizeColorOption) : [],
    isNew: Boolean(apiProduct.isLatestArrival),
    stockBySize: apiProduct.stockBySize || {},
    stockByVariant: apiProduct.stockByVariant || {},
    stock: apiProduct.stock ?? 0,
    // The actual fix: read the real field name, keep it as an array.
    imageUrls: Array.isArray(apiProduct.imageUrls) ? apiProduct.imageUrls : [],
    sizeGuideImageUrl: apiProduct.sizeGuideImageUrl || null,
    promotions: apiProduct.promotions || [],
    hasActivePromotion: Boolean(apiProduct.hasActivePromotion || apiProduct.promotions?.length),
    promotionHint: apiProduct.promotionHint || apiProduct.promotions?.[0]?.hint || null,
  };
}

export function getStockForSize(product, size, color) {
  const colorKey = getColorKey(color);
  if (product?.stockByVariant) {
    const variants = product.stockByVariant instanceof Map ? Object.fromEntries(product.stockByVariant) : product.stockByVariant;
    const entries = Object.entries(variants);
    if (entries.length) {
      return entries.reduce((sum, [key, stock]) => {
        const [variantSize, variantColor] = key.split("::");
        return sum + (variantSize === String(size || "*") && (!colorKey || variantColor === colorKey) ? Number(stock) || 0 : 0);
      }, 0);
    }
  }
  const stockBySize = product?.stockBySize instanceof Map ? Object.fromEntries(product.stockBySize) : product?.stockBySize;
  if (size && stockBySize?.[size] !== undefined) return Number(stockBySize[size]) || 0;
  return Number(product?.stock) || 0;
}

export function getTotalStock(product) {
  if (product?.stockByVariant) {
    const variants = product.stockByVariant instanceof Map ? Object.fromEntries(product.stockByVariant) : product.stockByVariant;
    if (Object.keys(variants).length) return Object.values(variants).reduce((sum, value) => sum + (Number(value) || 0), 0);
  }
  const stockBySize = product?.stockBySize instanceof Map ? Object.fromEntries(product.stockBySize) : product?.stockBySize;
  if (Object.keys(stockBySize || {}).length) return Object.values(stockBySize).reduce((sum, n) => sum + (Number(n) || 0), 0);
  return Number(product?.stock) || 0;
}
