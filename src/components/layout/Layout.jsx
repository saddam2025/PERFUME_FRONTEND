import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, X, LayoutDashboard, BarChart3, Wallet, ShoppingBag, User, Tag, House, Search, Store } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useLanguage } from "../../context/LanguageContext";
import { cn } from "../../lib/cn";
import Navbar from "./Navbar";
import Footer from "./Footer";
import RouteScrollManager from "./RouteScrollManager";
import { getSecondaryLink } from "../../lib/navigation";

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
      ? [{ to: "/admin", label: isRTL ? "لوحة التحكم" : "Dashboard", icon: LayoutDashboard },
        { to: "/admin/promotions", label: isRTL ? "العروض" : "Promotions", icon: Tag },
        { to: "/admin/landing-page", label: isRTL ? "محتوى الصفحة" : "Homepage content", icon: Tag },
        { to: "/admin/analytics", label: isRTL ? "التحليلات" : "Analytics", icon: BarChart3 }]
      : [{ to: "/affiliate/dashboard", label: isRTL ? "لوحة المسوق" : "Affiliate dashboard", icon: Wallet }]),
    { to: "/shop", label: isRTL ? "تسوق" : "Shop", icon: ShoppingBag },
    { to: "/profile", label: isRTL ? "الملف الشخصي" : "Profile", icon: User },
  ];

  return (
    <>
      <button
        type="button"
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] start-5 z-[60] flex h-12 w-12 items-center justify-center rounded-full bg-ink text-paper shadow-lg lg:bottom-5 lg:hidden"
        onClick={() => setMobileOpen((open) => !open)}
        aria-label={mobileOpen ? (isRTL ? "إغلاق القائمة" : "Close dashboard menu") : (isRTL ? "فتح القائمة" : "Open dashboard menu")}
        aria-expanded={mobileOpen}
        aria-controls="dashboard-sidebar"
      >
        {mobileOpen ? <X size={21} /> : <Menu size={21} />}
      </button>
      {mobileOpen && <button className="fixed inset-0 z-20 bg-black/45 lg:hidden" aria-label={isRTL ? "إغلاق القائمة" : "Close menu"} onClick={() => setMobileOpen(false)} />}
      <aside
        id="dashboard-sidebar"
        dir={isRTL ? "rtl" : "ltr"}
        className={cn(
          "fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] top-16 z-30 flex flex-col overflow-y-auto overscroll-contain border-line bg-paper transition-[width,transform] duration-300 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:shrink-0 lg:translate-x-0",
          isRTL ? "right-0 border-l" : "left-0 border-r",
          expanded ? "w-64" : "w-20",
          mobileOpen ? "translate-x-0" : (isRTL ? "translate-x-full" : "-translate-x-full"),
          "lg:translate-x-0 lg:bottom-0 lg:z-50"
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
  useEffect(() => {
    const root = document.querySelector(".site-shell");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!root || reduced.matches) return undefined;
    let frame = 0;
    let pointerX = 50;
    let pointerY = 50;
    let scrollShift = 0;
    const apply = () => {
      frame = 0;
      if (reduced.matches) return;
      root.style.setProperty("--dot-focus-x", `${pointerX}%`);
      root.style.setProperty("--dot-focus-y", `${pointerY}%`);
      root.style.setProperty("--dot-scroll-shift", `${scrollShift}px`);
    };
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(apply); };
    const onPointer = (event) => {
      if (event.pointerType !== "mouse") return;
      pointerX = Math.max(0, Math.min(100, event.clientX / Math.max(window.innerWidth, 1) * 100));
      pointerY = Math.max(0, Math.min(100, event.clientY / Math.max(window.innerHeight, 1) * 100));
      schedule();
    };
    const onScroll = () => { scrollShift = (window.scrollY % 120) / 120 * 1.5; schedule(); };
    const onPointerLeave = () => { pointerX = 50; pointerY = 50; schedule(); };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      root.style.removeProperty("--dot-focus-x");
      root.style.removeProperty("--dot-focus-y");
      root.style.removeProperty("--dot-scroll-shift");
    };
  }, []);
  const hasDashboardSidebar =
    (location.pathname.startsWith("/admin") && (role === "Manager" || role === "Admin")) ||
    (location.pathname.startsWith("/affiliate/dashboard") && role === "Affiliate");

  return (
    <div className="site-shell flex min-h-screen flex-col pb-20 text-ink lg:pb-0">
      <RouteScrollManager />
      <Navbar />
      <main className="flex flex-1">
        {hasDashboardSidebar && <DashboardSidebar role={role} />}
        <div className="min-w-0 flex-1"><Outlet /></div>
      </main>
      <Footer />
      <MobileStoreNav />
    </div>
  );
}

function MobileStoreNav() {
  const { itemCount } = useCart();
  const { t, isRTL } = useLanguage();
  const { role, isAuthenticated, isAuthReady } = useAuth();
  const location = useLocation();
  const dashboard = isAuthReady && isAuthenticated ? getSecondaryLink(role, t) : null;
  const links = [
    { to: "/", label: t("navbar.home"), icon: House },
    { action: true, label: t("navbar.search"), icon: Search },
    { to: "/shop", label: t("navbar.shop"), icon: Store },
    ...(dashboard ? [{ to: dashboard.to, label: dashboard.shortLabel, icon: LayoutDashboard }] : []),
    { pending: !isAuthReady, to: isAuthenticated ? "/profile" : "/login", label: !isAuthReady ? t("navbar.profile") : isAuthenticated ? t("navbar.profile") : t("auth.signInTitle"), icon: User },
    { to: "/cart", label: t("navbar.cart"), icon: ShoppingBag, count: itemCount },
  ];
  return <nav aria-label={isRTL ? "التنقل الرئيسي" : "Main navigation"} className="fixed inset-x-0 bottom-0 z-40 grid border-t border-line bg-paper/95 px-1 pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-2 backdrop-blur lg:hidden" style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}>
    {links.map(({ to, label, icon: Icon, count, action, pending }) => {
      const active = !action && (to === "/" ? location.pathname === "/" : location.pathname === to || (dashboard?.to === to && location.pathname.startsWith(to + "/")));
      const className = "relative flex min-w-0 flex-col items-center justify-center gap-1 py-1 text-[10px] font-medium " + (active ? "text-ink" : "text-slate");
      const content = <><span className="relative"><Icon size={21} strokeWidth={active ? 2 : 1.6}/>{count > 0 && <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-ink px-1 text-center text-[9px] leading-4 text-white">{count}</span>}</span><span className="max-w-full truncate">{label}</span></>;
      if (action) return <button key={label} type="button" aria-label={label} onClick={() => window.dispatchEvent(new Event("deja:mobile-search"))} className={className}>{content}</button>;
      if (pending) return <span key={label} aria-busy="true" className={className}>{content}</span>;
      return <Link key={label} to={to} className={className} aria-current={active ? "page" : undefined}>{content}</Link>;
    })}
  </nav>;
}
