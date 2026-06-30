// Pure, shape-agnostic helpers shared by Shop, ProductDetails, and ProductCard.
// These used to live in data/products.js alongside the mock catalog; they're
// kept here now that mock data is gone, since they don't depend on it.

// Tops use letter sizes (existing catalog already spans XS-XXL); pants use
// even numeric waist sizes 32-42. Both scales are flattened into one list so
// the sidebar's size filter can show every size that might appear across
// any product type without needing to know which type it belongs to.
export const sizesAvailable = ["XS", "S", "M", "L", "XL", "XXL", "32", "34", "36", "38", "40", "42"];

// UI category keys (used for translations.categories.* and FilterSidebar)
// mapped to the backend's productType enum values.
export const categories = ["tshirts", "jackets", "hoodies", "pants"];

export const CATEGORY_TO_PRODUCT_TYPE = {
  tshirts: "t-shirt",
  jackets: "jacket",
  hoodies: "hoodie",
  pants: "pants",
};

export const PRODUCT_TYPE_TO_CATEGORY = {
  "t-shirt": "tshirts",
  jacket: "jackets",
  hoodie: "hoodies",
  pants: "pants",
};

// Fixed lookup for the backend's plain color-name strings (e.g. "black",
// "stone") since the live Product model stores colors as bare strings, not
// objects with swatch hex / bilingual labels. Anything not in this table
// falls back to a neutral gray swatch rather than crashing.
const COLOR_LOOKUP = {
  black: { swatch: "#1C1C1E", nameEn: "Black", nameAr: "أسود" },
  white: { swatch: "#F5F5F4", nameEn: "White", nameAr: "أبيض" },
  stone: { swatch: "#C9C2B4", nameEn: "Stone", nameAr: "بيج" },
  ecru: { swatch: "#E8E4DC", nameEn: "Ecru", nameAr: "عاجي" },
  charcoal: { swatch: "#3A3A3D", nameEn: "Charcoal", nameAr: "كحلي رمادي" },
  olive: { swatch: "#4A4538", nameEn: "Olive", nameAr: "زيتي" },
  sand: { swatch: "#B8A88A", nameEn: "Sand", nameAr: "رملي" },
  navy: { swatch: "#1F2937", nameEn: "Navy", nameAr: "كحلي" },
};

const FALLBACK_COLOR = { swatch: "#9CA3AF", nameEn: "Other", nameAr: "أخرى" };

function resolveColor(colorName) {
  const key = String(colorName).trim().toLowerCase();
  const match = COLOR_LOOKUP[key] || FALLBACK_COLOR;
  return { id: key, swatch: match.swatch, nameEn: match.nameEn, nameAr: match.nameAr };
}

// Converts a raw API product (per backend/models/Product.js) into the shape
// ProductCard / ProductDetails / Cart already expect. Keeping this mapping
// in one place means those components never need to know the live API's
// field names changed.
export function mapApiProductToUiProduct(apiProduct) {
  return {
    id: apiProduct._id,
    nameKey: apiProduct.name,
    nameAr: apiProduct.nameAr,
    descriptionKey: apiProduct.description,
    descriptionAr: apiProduct.descriptionAr,
    category: PRODUCT_TYPE_TO_CATEGORY[apiProduct.productType] || apiProduct.productType,
    price: apiProduct.price,
    compareAtPrice: apiProduct.compareAtPrice ?? null,
    sizes: Array.isArray(apiProduct.sizes) ? apiProduct.sizes : [],
    colors: Array.isArray(apiProduct.colors) ? apiProduct.colors.map(resolveColor) : [],
    isNew: Boolean(apiProduct.isLatestArrival),
    stockBySize: apiProduct.stockBySize || {},
    image: apiProduct.productImageUrl || null,
    sizeGuideImageUrl: apiProduct.sizeGuideImageUrl || null,
    swatch: "#E8E4DC",
  };
}

export function getStockForSize(product, size) {
  if (!product?.stockBySize) return 0;
  return product.stockBySize[size] ?? 0;
}

export function getTotalStock(product) {
  if (!product?.stockBySize) return 0;
  return Object.values(product.stockBySize).reduce((sum, n) => sum + n, 0);
}