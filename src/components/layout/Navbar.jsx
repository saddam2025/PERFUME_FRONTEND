// Navbar.jsx
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { User, LayoutDashboard, ShoppingBag, Menu, X, Globe, LogOut } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/cn";
import logo from "../../assets/logo.png";

function getSecondaryLink(role, t) {
  const normalizedRole = (role || "").toLowerCase();

  if (normalizedRole === "admin" || normalizedRole === "manager") {
    return {
      to: "/admin",
      label: t("navbar.dashboard"),
    };
  }

  if (normalizedRole === "affiliate") {
    return {
      to: "/affiliate/dashboard",
      label: t("navbar.affiliateDashboard"),
    };
  }

  // Guest or Customer — show the affiliate request link
  return {
    to: "/affiliate/join",
    label: t("navbar.affiliateRequest"),
  };
}

function NavLinks({ className, onLinkClick }) {
  const { t } = useLanguage();
  const links = [
    { to: "/shop",        label: t("navbar.shop") },
    { to: "/collections", label: t("navbar.collections") },
    { to: "/about",       label: t("navbar.about") },
    { to: "/contact",     label: t("navbar.contact") },
  ];

  return (
    <nav className={className}>
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          onClick={onLinkClick}
          className={({ isActive }) =>
            cn(
              "label-tracked transition-colors hover:text-ink",
              isActive ? "text-ink" : "text-slate"
            )
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Navbar() {
  const { t, locale, toggleLocale, isRTL } = useLanguage();
  const { itemCount } = useCart();
  const { user, isAuthenticated, logout, role } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoError, setLogoError]   = useState(false);

  const secondaryLink = getSecondaryLink(role, t);

  return (
    <header
      dir={isRTL ? "rtl" : "ltr"}
      className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur-sm"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

        {/* ── Logo ── */}
        <Link to="/" className="flex items-center shrink-0" aria-label="Toronto home">
          {!logoError ? (
            <img
              src={logo}
              alt="Toronto"
              className="h-27 w-auto object-contain"
              onError={() => setLogoError(true)}
              onLoad={(e) => {
                if (e.currentTarget.naturalWidth <= 1) setLogoError(true);
              }}
            />
          ) : (
            <span className="font-display text-xl font-black tracking-tightest">
              TORONTO
            </span>
          )}
        </Link>

        {/* ── Desktop nav ── */}
        <NavLinks className="hidden items-center gap-8 md:flex" />

        {/* ── Right actions ── */}
        <div className="flex items-center gap-2 sm:gap-4">

          {/* 1. Role-based secondary link (desktop) */}
          <Link
            to={secondaryLink.to}
            className="hidden md:flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate hover:text-ink transition-colors border-b border-transparent hover:border-ink py-1"
          >
            <LayoutDashboard size={15} strokeWidth={1.75} />
            <span>{secondaryLink.label}</span>
          </Link>

          {/* 2. Auth links / user info (desktop) */}
          {!isAuthenticated ? (
            <>
              <Link
                to="/login"
                className="hidden md:flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate hover:text-ink transition-colors py-1"
                aria-label="Account"
              >
                <User size={16} strokeWidth={1.75} />
                <span>{t("auth.signInTitle") || "Sign In"}</span>
              </Link>
              <Link
                to="/register"
                className="hidden md:flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate hover:text-ink transition-colors py-1"
              >
                <span>{t("auth.signUpTitle") || "Register"}</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/profile"
                className="hidden md:flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink hover:text-slate transition-colors py-1"
                aria-label="Profile"
              >
                <User size={16} strokeWidth={1.75} />
                <span>{user?.name || user?.firstName || t("navbar.profile")}</span>
              </Link>
              <button
                onClick={logout}
                className="hidden md:flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate hover:text-red-500 transition-colors py-1"
                aria-label="Logout"
              >
                <LogOut size={16} strokeWidth={1.75} />
                <span>{t("auth.logout") || "Logout"}</span>
              </button>
            </>
          )}

          {/* Divider */}
          <span className="hidden md:inline h-4 w-px bg-line" />

          {/* Language toggle */}
          <button
            type="button"
            onClick={toggleLocale}
            className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-ink"
            aria-label="Toggle language"
          >
            <Globe size={14} strokeWidth={1.75} />
            <span>{locale === "en" ? "AR" : "EN"}</span>
          </button>

          {/* Cart */}
          <Link
            to="/cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-paper-dim"
            aria-label="Cart"
          >
            <ShoppingBag size={20} strokeWidth={1.75} />
            {itemCount > 0 && (
              <span
                className={cn(
                  "absolute -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-paper",
                  isRTL ? "-left-1" : "-right-1"
                )}
              >
                {itemCount}
              </span>
            )}
          </Link>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center text-ink md:hidden"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen
              ? <X    size={22} strokeWidth={1.75} />
              : <Menu size={22} strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown ── */}
      {mobileOpen && (
        <div className={cn("border-t border-line bg-paper md:hidden", isRTL ? "text-right" : "text-left")}>
          <NavLinks
            className="flex flex-col gap-5 px-4 pt-6 sm:px-6"
            onLinkClick={() => setMobileOpen(false)}
          />

          <div className="flex flex-col gap-4 border-t border-line mt-5 px-4 py-6 sm:px-6">

            {/* Role-based secondary link (mobile) */}
            <Link
              to={secondaryLink.to}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-wider text-slate hover:text-ink"
            >
              <LayoutDashboard size={18} strokeWidth={1.75} />
              {secondaryLink.label}
            </Link>

            {/* Auth (mobile) */}
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-wider text-slate hover:text-ink"
                >
                  <User size={18} strokeWidth={1.75} />
                  {t("auth.signInTitle") || "Sign In"}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-wider text-slate hover:text-ink"
                >
                  {t("auth.signUpTitle") || "Register"}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-wider text-ink hover:text-slate"
                >
                  <User size={18} strokeWidth={1.75} />
                  {user?.name || user?.firstName || t("navbar.profile")}
                </Link>
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-wider text-slate hover:text-red-500 text-left"
                >
                  <LogOut size={18} strokeWidth={1.75} />
                  {t("auth.logout") || "Logout"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}