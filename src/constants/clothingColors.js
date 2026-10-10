export const CLOTHING_COLORS = [
  { nameEn: "Black", nameAr: "أسود", hex: "#1C1C1E" },
  { nameEn: "White", nameAr: "أبيض", hex: "#F5F5F4" },
  { nameEn: "Off White", nameAr: "أوف وايت", hex: "#F4F1EA" },
  { nameEn: "Cream", nameAr: "كريمي", hex: "#F2E8D5" },
  { nameEn: "Ivory", nameAr: "عاجي", hex: "#FFFFF0" },
  { nameEn: "Beige", nameAr: "بيج", hex: "#D8C3A5" },
  { nameEn: "Sand", nameAr: "رملي", hex: "#C2A878" },
  { nameEn: "Stone", nameAr: "حجري", hex: "#A9A397" },
  { nameEn: "Taupe", nameAr: "رمادي بني", hex: "#8B8178" },
  { nameEn: "Light Grey", nameAr: "رمادي فاتح", hex: "#D1D5DB", aliases: ["light gray"] },
  { nameEn: "Grey", nameAr: "رمادي", hex: "#808080", aliases: ["gray"] },
  { nameEn: "Charcoal", nameAr: "فحمي", hex: "#3A3A3D" },
  { nameEn: "Navy", nameAr: "كحلي", hex: "#1F2937" },
  { nameEn: "Blue", nameAr: "أزرق", hex: "#2563EB" },
  { nameEn: "Light Blue", nameAr: "أزرق فاتح", hex: "#93C5FD" },
  { nameEn: "Sky Blue", nameAr: "سماوي", hex: "#38BDF8" },
  { nameEn: "Royal Blue", nameAr: "أزرق ملكي", hex: "#4169E1" },
  { nameEn: "Cobalt", nameAr: "كوبالت", hex: "#0047AB" },
  { nameEn: "Teal", nameAr: "أزرق مخضر", hex: "#0F766E" },
  { nameEn: "Turquoise", nameAr: "فيروزي", hex: "#40E0D0" },
  { nameEn: "Mint", nameAr: "نعناعي", hex: "#A7F3D0" },
  { nameEn: "Sage", nameAr: "أخضر مريمي", hex: "#9CAF88" },
  { nameEn: "Green", nameAr: "أخضر", hex: "#16A34A" },
  { nameEn: "Dark Green", nameAr: "أخضر داكن", hex: "#14532D" },
  { nameEn: "Olive", nameAr: "زيتي", hex: "#6B6B35" },
  { nameEn: "Khaki", nameAr: "كاكي", hex: "#BDB76B" },
  { nameEn: "Yellow", nameAr: "أصفر", hex: "#EAB308" },
  { nameEn: "Mustard", nameAr: "خردلي", hex: "#C49A24" },
  { nameEn: "Orange", nameAr: "برتقالي", hex: "#EA580C" },
  { nameEn: "Rust", nameAr: "صدئي", hex: "#B7410E" },
  { nameEn: "Red", nameAr: "أحمر", hex: "#DC2626" },
  { nameEn: "Burgundy", nameAr: "نبيتي", hex: "#7F1D1D" },
  { nameEn: "Maroon", nameAr: "عنابي", hex: "#800000" },
  { nameEn: "Pink", nameAr: "وردي", hex: "#EC4899" },
  { nameEn: "Light Pink", nameAr: "وردي فاتح", hex: "#FBCFE8" },
  { nameEn: "Hot Pink", nameAr: "فوشيا", hex: "#FF69B4" },
  { nameEn: "Coral", nameAr: "مرجاني", hex: "#FF7F50" },
  { nameEn: "Salmon", nameAr: "سلموني", hex: "#FA8072" },
  { nameEn: "Purple", nameAr: "بنفسجي", hex: "#7C3AED" },
  { nameEn: "Lavender", nameAr: "لافندر", hex: "#C4B5FD" },
  { nameEn: "Lilac", nameAr: "ليلكي", hex: "#C8A2C8" },
  { nameEn: "Violet", nameAr: "أرجواني", hex: "#8B5CF6" },
  { nameEn: "Gold", nameAr: "ذهبي", hex: "#D4AF37" },
  { nameEn: "Silver", nameAr: "فضي", hex: "#C0C0C0" },
  { nameEn: "Denim", nameAr: "دينيم", hex: "#3B5B92" },
  { nameEn: "Camel", nameAr: "جملي", hex: "#C19A6B" },
  { nameEn: "Tan", nameAr: "أسمر فاتح", hex: "#D2B48C" },
  { nameEn: "Brown", nameAr: "بني", hex: "#6B4A34" },
  { nameEn: "Chocolate", nameAr: "بني شوكولاتة", hex: "#4E2E1E" },
  { nameEn: "Ecru", nameAr: "إكرو", hex: "#E8E4DC" },
];

const normalizeName = (value) => String(value || "").trim().toLocaleLowerCase();

export function getColorKey(color) {
  if (typeof color === "string") return normalizeName(color);
  return normalizeName(color?.nameEn || color?.name || color?.nameAr);
}

export function normalizeColorOption(color) {
  const isObject = color && typeof color === "object";
  const rawName = isObject ? (color.nameEn || color.name || color.nameAr || "") : color;
  const searchName = normalizeName(rawName);
  const match = CLOTHING_COLORS.find((option) =>
    [option.nameEn, option.nameAr, ...(option.aliases || [])].some((name) => normalizeName(name) === searchName)
  );

  if (isObject && color.hex) {
    const nameEn = color.nameEn || color.name || match?.nameEn || String(rawName);
    const nameAr = color.nameAr || match?.nameAr || nameEn;
    return { id: normalizeName(nameEn), nameEn, nameAr, swatch: color.hex, hex: color.hex };
  }

  if (match) return { id: normalizeName(match.nameEn), nameEn: match.nameEn, nameAr: match.nameAr, swatch: match.hex, hex: match.hex };
  const label = String(rawName || "").trim();
  return { id: normalizeName(label), nameEn: label, nameAr: label, swatch: "#9CA3AF", hex: "#9CA3AF" };
}
