import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, X, LayoutDashboard, BarChart3, Wallet, ShoppingBag, User, Tag } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { cn } from "../../lib/cn";
import Navbar from "./Navbar";
import Footer from "./Footer";
import RouteScrollManager from "./RouteScrollManager";

function DashboardSidebar({ role }) {
  const location = useLocation();
  const { locale } = useLanguage();
  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isRTL = locale === "ar";

  useEffect(() => setMobileOpen(false), [location.pathname]);
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const links = [
    ...(role === "Manager" || role === "Admin"
      ? [{ to: "/admin", label: isRTL ? "لوحة الإدارة" : "Dashboard", icon: LayoutDashboard },
        { to: "/admin/promotions", label: isRTL ? "العروض" : "Promotions", icon: Tag },
        { to: "/admin/analytics", label: isRTL ? "التحليلات" : "Analytics", icon: BarChart3 }]
      : [{ to: "/affiliate/dashboard", label: isRTL ? "لوحة المسوق" : "Affiliate dashboard", icon: Wallet }]),
    { to: "/shop", label: isRTL ? "تسوق" : "Shop", icon: ShoppingBag },
    { to: "/profile", label: isRTL ? "الملف الشخصي" : "Profile", icon: User },
  ];

  return (
    <>
      <button
        type="button"
        className="fixed bottom-5 start-5 z-[60] flex h-12 w-12 items-center justify-center rounded-full bg-ink text-paper shadow-lg lg:hidden"
        onClick={() => setMobileOpen((open) => !open)}
        aria-label={mobileOpen ? (isRTL ? "إغلاق القائمة" : "Close dashboard menu") : (isRTL ? "فتح القائمة" : "Open dashboard menu")}
        aria-expanded={mobileOpen}
        aria-controls="dashboard-sidebar"
      >
        {mobileOpen ? <X size={21} /> : <Menu size={21} />}
      </button>
      {mobileOpen && <button className="fixed inset-0 z-40 bg-black/45 lg:hidden" aria-label={isRTL ? "إغلاق القائمة" : "Close menu"} onClick={() => setMobileOpen(false)} />}
      <aside
        id="dashboard-sidebar"
        dir={isRTL ? "rtl" : "ltr"}
        className={cn(
          "fixed bottom-0 top-16 z-50 flex flex-col overflow-y-auto overscroll-contain border-line bg-paper transition-[width,transform] duration-300 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:shrink-0 lg:translate-x-0",
          isRTL ? "right-0 border-l" : "left-0 border-r",
          expanded ? "w-64" : "w-20",
          mobileOpen ? "translate-x-0" : (isRTL ? "translate-x-full" : "-translate-x-full"),
          "lg:translate-x-0"
        )}
      >
        <button type="button" className="hidden h-14 items-center gap-3 px-6 text-start text-slate hover:text-ink lg:flex" onClick={() => setExpanded((open) => !open)} aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"} aria-expanded={expanded}>
          {expanded ? <X size={18} /> : <Menu size={18} />}{expanded && <span className="text-xs font-semibold uppercase tracking-wider">{isRTL ? "القائمة" : "Menu"}</span>}
        </button>
        <nav className="flex flex-col gap-1 p-3 pt-5 lg:pt-2">
          {links.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} title={!expanded ? label : undefined} onClick={() => setMobileOpen(false)} className={cn("flex min-h-11 items-center gap-3 px-3 text-sm font-medium transition-colors hover:bg-paper-dim", location.pathname === to ? "bg-paper-dim text-ink" : "text-slate", !expanded && "lg:justify-center lg:px-0")}>
              <Icon size={18} />{(expanded || mobileOpen) && <span>{label}</span>}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default function Layout() {
  const { role } = useAuth();
  const location = useLocation();
  const hasDashboardSidebar =
    (location.pathname.startsWith("/admin") && (role === "Manager" || role === "Admin")) ||
    (location.pathname.startsWith("/affiliate/dashboard") && role === "Affiliate");

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <RouteScrollManager />
      <Navbar />
      <main className="flex flex-1">
        {hasDashboardSidebar && <DashboardSidebar role={role} />}
        <div className="min-w-0 flex-1"><Outlet /></div>
      </main>
      <Footer />
    </div>
  );
}
