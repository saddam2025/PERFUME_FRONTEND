export const products = [
  {
    id: "p001",
    nameKey: "Oversized Cotton Tee",
    nameAr: "تيشيرت قطن واسع",
    descriptionKey:
      "A roomy, drop-shoulder tee cut from heavyweight 230gsm combed cotton. Garment-washed for a soft, broken-in feel from the first wear.",
    descriptionAr:
      "تيشيرت واسع بقصة الكتف المنسدل، مصنوع من قطن مفرد ثقيل 230 جرام. مغسول مسبقًا لملمس ناعم من أول استخدام.",
    category: "tshirts",
    price: 850,
    compareAtPrice: null,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { id: "stone", swatch: "#C9C2B4", nameEn: "Stone", nameAr: "بيج" },
      { id: "black", swatch: "#1C1C1E", nameEn: "Black", nameAr: "أسود" },
      { id: "ecru", swatch: "#E8E4DC", nameEn: "Ecru", nameAr: "عاجي" },
    ],
    isNew: true,
    stockBySize: { S: 12, M: 18, L: 9, XL: 4 },
    image: null,
    swatch: "#E8E4DC",
  },
  {
    id: "p002",
    nameKey: "Heavyweight Boxy Tee",
    nameAr: "تيشيرت بوكسي ثقيل",
    descriptionKey:
      "A structured, boxy fit with a dropped hem and ribbed crew neck. Built from 280gsm cotton for a tee that holds its shape wear after wear.",
    descriptionAr:
      "قصة بوكسي منظمة بحافة سفلية منخفضة وياقة مضلعة. مصنوع من قطن 280 جرام يحافظ على شكله مع كل استخدام.",
    category: "tshirts",
    price: 920,
    compareAtPrice: 1100,
    sizes: ["S", "M", "L"],
    colors: [
      { id: "black", swatch: "#1C1C1E", nameEn: "Black", nameAr: "أسود" },
      { id: "charcoal", swatch: "#3A3A3D", nameEn: "Charcoal", nameAr: "كحلي رمادي" },
    ],
    isNew: false,
    stockBySize: { S: 2, M: 3, L: 1 },
    image: null,
    swatch: "#1C1C1E",
  },
  {
    id: "p003",
    nameKey: "Ribbed Long Sleeve Tee",
    nameAr: "تيشيرت أكمام طويلة مضلع",
    descriptionKey:
      "Slim, ribbed long sleeve layer in a cotton-elastane blend that moves with you. Designed to sit cleanly under jackets and hoodies.",
    descriptionAr:
      "طبقة أساسية مضلعة بأكمام طويلة من خليط القطن والإيلاستين. مصممة لتبدو نظيفة تحت الجاكيتات والهوديز.",
    category: "tshirts",
    price: 780,
    compareAtPrice: null,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { id: "stone", swatch: "#C9C2B4", nameEn: "Stone", nameAr: "بيج" },
      { id: "black", swatch: "#1C1C1E", nameEn: "Black", nameAr: "أسود" },
    ],
    isNew: false,
    stockBySize: { XS: 14, S: 20, M: 25, L: 15, XL: 10 },
    image: null,
    swatch: "#C9C2B4",
  },
  {
    id: "p004",
    nameKey: "Wool-Blend Bomber Jacket",
    nameAr: "جاكيت بومبر مخلوط بالصوف",
    descriptionKey:
      "A tailored bomber in a wool-nylon blend with a matte finish. Ribbed collar, cuffs, and hem with a clean interior lining for cooler days.",
    descriptionAr:
      "جاكيت بومبر مفصّل من خليط الصوف والنايلون بلمسة مطفية. ياقة وأكمام وحافة مضلعة مع بطانة داخلية أنيقة للأيام الباردة.",
    category: "jackets",
    price: 3450,
    compareAtPrice: null,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { id: "charcoal", swatch: "#2B2B2E", nameEn: "Charcoal", nameAr: "كحلي رمادي" },
      { id: "olive", swatch: "#4A4538", nameEn: "Olive", nameAr: "زيتي" },
    ],
    isNew: true,
    stockBySize: { S: 8, M: 10, L: 6, XL: 3 },
    image: null,
    swatch: "#2B2B2E",
  },
  {
    id: "p005",
    nameKey: "Quilted Field Jacket",
    nameAr: "جاكيت ميداني مبطّن",
    descriptionKey:
      "Channel-quilted field jacket with a water-resistant outer shell and four utility pockets. Cut slightly oversized for easy layering.",
    descriptionAr:
      "جاكيت ميداني مبطّن بقنوات مع طبقة خارجية مقاومة للماء وأربع جيوب عملية. قصة واسعة بعض الشيء لتسهيل التنسيق بطبقات.",
    category: "jackets",
    price: 4100,
    compareAtPrice: 4800,
    sizes: ["M", "L", "XL"],
    colors: [
      { id: "olive", swatch: "#4A4538", nameEn: "Olive", nameAr: "زيتي" },
      { id: "black", swatch: "#1C1C1E", nameEn: "Black", nameAr: "أسود" },
    ],
    isNew: false,
    stockBySize: { M: 2, L: 1, XL: 1 },
    image: null,
    swatch: "#4A4538",
  },
  {
    id: "p006",
    nameKey: "Minimal Trench Coat",
    nameAr: "معطف ترنش بسيط",
    descriptionKey:
      "A clean-lined trench in a stone cotton-blend twill, stripped of excess hardware. Belted waist with a fully lined interior.",
    descriptionAr:
      "معطف ترنش بخطوط نظيفة من قماش قطني مخلوط، بدون إضافات زائدة. حزام عند الخصر وبطانة داخلية كاملة.",
    category: "jackets",
    price: 5200,
    compareAtPrice: null,
    sizes: ["S", "M", "L"],
    colors: [
      { id: "stone", swatch: "#D8D2C4", nameEn: "Stone", nameAr: "بيج" },
      { id: "black", swatch: "#1C1C1E", nameEn: "Black", nameAr: "أسود" },
    ],
    isNew: false,
    stockBySize: { S: 5, M: 6, L: 4 },
    image: null,
    swatch: "#D8D2C4",
  },
  {
    id: "p007",
    nameKey: "Essential Pullover Hoodie",
    nameAr: "هودي أساسي",
    descriptionKey:
      "The everyday hoodie. Mid-weight brushed-back fleece, kangaroo pocket, and a relaxed fit that layers easily under a jacket.",
    descriptionAr:
      "الهودي الأساسي اليومي. فليس متوسط الوزن مفروش من الداخل، جيب أمامي، وقصة مريحة تسهّل التنسيق تحت الجاكيت.",
    category: "hoodies",
    price: 1450,
    compareAtPrice: null,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { id: "charcoal", swatch: "#3A3A3D", nameEn: "Charcoal", nameAr: "كحلي رمادي" },
      { id: "stone", swatch: "#C9C2B4", nameEn: "Stone", nameAr: "بيج" },
      { id: "black", swatch: "#0E0E10", nameEn: "Black", nameAr: "أسود" },
    ],
    isNew: true,
    stockBySize: { S: 20, M: 28, L: 22, XL: 14, XXL: 8 },
    image: null,
    swatch: "#3A3A3D",
  },
  {
    id: "p008",
    nameKey: "Heavyweight Zip Hoodie",
    nameAr: "هودي بسحاب ثقيل",
    descriptionKey:
      "Full-zip hoodie in 420gsm heavyweight fleece with ribbed binding throughout. Built thicker and warmer than a standard hoodie.",
    descriptionAr:
      "هودي بسحاب كامل من فليس ثقيل 420 جرام مع تفاصيل مضلعة. أكثر سمكًا ودفئًا من الهودي العادي.",
    category: "hoodies",
    price: 1680,
    compareAtPrice: 1900,
    sizes: ["M", "L", "XL"],
    colors: [
      { id: "black", swatch: "#0E0E10", nameEn: "Black", nameAr: "أسود" },
    ],
    isNew: false,
    stockBySize: { M: 1, L: 2, XL: 0 },
    image: null,
    swatch: "#0E0E10",
  },
  {
    id: "p009",
    nameKey: "Brushed Fleece Hoodie",
    nameAr: "هودي فليس مفروش",
    descriptionKey:
      "Soft brushed fleece hoodie in a warm stone tone. Dropped shoulder seams and a double-layer hood for extra structure.",
    descriptionAr:
      "هودي من فليس مفروش ناعم بدرجة بيج دافئة. خياطة أكتاف منسدلة وقبعة مزدوجة الطبقات لمزيد من الثبات.",
    category: "hoodies",
    price: 1320,
    compareAtPrice: null,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { id: "sand", swatch: "#B8A88A", nameEn: "Sand", nameAr: "رملي" },
      { id: "black", swatch: "#0E0E10", nameEn: "Black", nameAr: "أسود" },
    ],
    isNew: false,
    stockBySize: { S: 10, M: 16, L: 12, XL: 7 },
    image: null,
    swatch: "#B8A88A",
  },
];

export const categories = ["tshirts", "jackets", "hoodies"];
export const sizesAvailable = ["XS", "S", "M", "L", "XL", "XXL"];

export function getProductById(id) {
  return products.find((p) => p.id === id);
}

export function getStockForSize(product, size) {
  if (!product?.stockBySize) return 0;
  return product.stockBySize[size] ?? 0;
}

export function getTotalStock(product) {
  if (!product?.stockBySize) return 0;
  return Object.values(product.stockBySize).reduce((sum, n) => sum + n, 0);
}
