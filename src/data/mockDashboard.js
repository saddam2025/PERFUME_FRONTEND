// Mock data standing in for what will eventually come from the live
// /affiliate/dashboard and /admin/* backend endpoints.

export const affiliateProfile = {
  name: "Sara Mostafa",
  code: "SARA10",
  totalEarnings: 4280,
  totalOrders: 23,
  pendingPayouts: 860,
  commissionRate: 10,
};

export const affiliateSales = [
  { orderId: "ORD-10482", date: "2026-06-18", orderValue: 1850, commission: 185, status: "paid" },
  { orderId: "ORD-10465", date: "2026-06-14", orderValue: 920, commission: 92, status: "paid" },
  { orderId: "ORD-10439", date: "2026-06-09", orderValue: 3450, commission: 345, status: "processing" },
  { orderId: "ORD-10401", date: "2026-06-02", orderValue: 1320, commission: 132, status: "pending" },
  { orderId: "ORD-10388", date: "2026-05-27", orderValue: 780, commission: 78, status: "paid" },
  { orderId: "ORD-10350", date: "2026-05-19", orderValue: 4100, commission: 410, status: "paid" },
];

export const adminOrders = [
  {
    orderId: "ORD-10501",
    customer: "Mona Tarek",
    date: "2026-06-21",
    items: 3,
    total: 2960,
    status: "pending",
  },
  {
    orderId: "ORD-10497",
    customer: "Youssef Adel",
    date: "2026-06-21",
    items: 1,
    total: 1450,
    status: "pending",
  },
  {
    orderId: "ORD-10491",
    customer: "Laila Hassan",
    date: "2026-06-20",
    items: 2,
    total: 3450,
    status: "shipped",
  },
  {
    orderId: "ORD-10488",
    customer: "Omar Khaled",
    date: "2026-06-19",
    items: 4,
    total: 5200,
    status: "shipped",
  },
  {
    orderId: "ORD-10470",
    customer: "Nour Ibrahim",
    date: "2026-06-16",
    items: 2,
    total: 1680,
    status: "delivered",
  },
  {
    orderId: "ORD-10455",
    customer: "Karim Said",
    date: "2026-06-12",
    items: 1,
    total: 920,
    status: "cancelled",
  },
];

export const adminAffiliateApplications = [
  {
    id: "app-201",
    name: "Hana Fathy",
    email: "hana.fathy@example.com",
    proposedCode: "HANA15",
    appliedOn: "2026-06-20",
    audience: "instagram.com/hana.fathy · 42K followers",
  },
  {
    id: "app-198",
    name: "Tariq Mansour",
    email: "tariq.m@example.com",
    proposedCode: "TARIQFIT",
    appliedOn: "2026-06-18",
    audience: "tiktok.com/@tariqfit · 88K followers",
  },
  {
    id: "app-195",
    name: "Dina Aboulnaga",
    email: "dina.a@example.com",
    proposedCode: "DINASTYLE",
    appliedOn: "2026-06-15",
    audience: "dinaaboulnaga.com",
  },
];

export const ORDER_STATUSES = ["pending", "shipped", "delivered", "cancelled"];

// ---------------------------------------------------------------------------
// البيانات الناقصة اللي ضفتها عشان تحل مشكلة الشاشة البيضاء (الـ Imports)
// ---------------------------------------------------------------------------
export const adminProducts = [
  { id: "p1", name: "Premium Cotton T-Shirt", category: "tshirts", price: 450, stock: 25 },
  { id: "p2", name: "Oversized Winter Jacket", category: "jackets", price: 1850, stock: 10 },
  { id: "p3", name: "Classic Streetwear Hoodie", category: "hoodies", price: 850, stock: 15 },
];

export const adminCollections = [
  { id: "c1", name: "Summer Collection 2026", pieceCount: 12 },
  { id: "c2", name: "Essentials Core", pieceCount: 6 },
];