// Pure, shape-agnostic helpers shared by Shop, ProductDetails, and ProductCard.

export function getPromotionHint(promotion, locale = "en") {
  const tier = (promotion?.tiers || []).slice().sort((a, b) => b.minQty - a.minQty)[0] || {};
  if (promotion?.type === "BUY_X_GET_Y_FREE") return locale === "ar" ? `اشتري ${tier.minQty} واحصل على ${tier.getQty} مجانًا` : `Buy ${tier.minQty} get ${tier.getQty} free`;
  if (promotion?.type === "QUANTITY_PERCENT_DISCOUNT") return locale === "ar" ? `خصم ${tier.percent}% عند شراء ${tier.minQty} فأكثر` : `${tier.percent}% off when you buy ${tier.minQty}+`;
  return locale === "ar" ? `اشترِ ${tier.minQty} بسعر ${tier.fixedPrice}` : `Buy ${tier.minQty} for ${tier.fixedPrice}`;
}

/**
 * Converts a raw API perfume into the shared UI product shape.
 */
export function mapApiProductToUiProduct(apiProduct) {
  const variants = Array.isArray(apiProduct.variants) ? apiProduct.variants.map((variant) => ({
    ...variant,
    volumeMl: Number(variant.volumeMl),
    price: Number(variant.price),
    stock: Number(variant.stock) || 0,
  })) : [];
  const minPrice = variants.length ? Math.min(...variants.map((variant) => variant.price)) : Number(apiProduct.price) || 0;
  return {
    id: apiProduct._id,
    brand: apiProduct.brand,
    nameEn: apiProduct.name || apiProduct.nameEn,
    nameAr: apiProduct.nameAr,
    nameKey: apiProduct.name || apiProduct.nameEn,
    descriptionEn: apiProduct.description || apiProduct.descEn,
    descriptionAr: apiProduct.descAr,
    descriptionKey: apiProduct.description || apiProduct.descEn, // legacy alias
    gender: apiProduct.gender,
    concentration: apiProduct.concentration,
    fragranceFamily: Array.isArray(apiProduct.fragranceFamily) ? apiProduct.fragranceFamily : [],
    notes: apiProduct.notes || { top: [], middle: [], base: [] },
    season: Array.isArray(apiProduct.season) ? apiProduct.season : [],
    occasion: Array.isArray(apiProduct.occasion) ? apiProduct.occasion : [],
    longevity: apiProduct.longevity,
    sillage: apiProduct.sillage,
    variants,
    minPrice,
    price: minPrice,
    compareAtPrice: apiProduct.compareAtPrice ?? null,
    isNew: Boolean(apiProduct.isLatestArrival),
    stock: apiProduct.stock ?? variants.reduce((sum, variant) => sum + variant.stock, 0),
    imageUrls: Array.isArray(apiProduct.imageUrls) ? apiProduct.imageUrls : [],
    promotions: apiProduct.promotions || [],
    hasActivePromotion: Boolean(apiProduct.hasActivePromotion || apiProduct.promotions?.length),
    promotionHint: apiProduct.promotionHint || apiProduct.promotions?.[0]?.hint || null,
  };
}

export function getStockForVolume(product, volumeMl) {
  return Number(product?.variants?.find((variant) => Number(variant.volumeMl) === Number(volumeMl))?.stock) || 0;
}

export function getTotalStock(product) {
  if (product?.variants?.length) return product.variants.reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0);
  return Number(product?.stock) || 0;
}
