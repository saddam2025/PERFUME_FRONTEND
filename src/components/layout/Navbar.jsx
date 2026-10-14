// Navbar.jsx
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { User, LayoutDashboard, ShoppingBag, Menu, X, Globe, LogOut, Search } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/cn";
import logo from "../../assets/logo.png";
import api from "../../api/axios";

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
  return null;
}

function NavLinks({ className, onLinkClick, compact = false }) {
  const { t } = useLanguage();
  const links = [
    { to: "/shop",        label: t("navbar.shop") },
    { to: "/shop?family=woody", label: t("navbar.collections") },
    { to: "/about",       label: t("navbar.about") },
    { to: "/contact",     label: t("navbar.contact") },
  ];
  return (
    <nav className={className} data-motion-nav>
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          onClick={onLinkClick}
          className={({ isActive }) =>
            cn(
              cn("label-tracked transition-colors hover:text-ink", compact ? "text-[11px] uppercase tracking-[0.14em]" : "text-sm"),
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
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const suggestionController = useRef(null);
  const navigate = useNavigate();

  const secondaryLink = getSecondaryLink(role, t);

  useEffect(() => {
    if (!mobileSearchOpen && window.matchMedia("(max-width: 1023px)").matches) return undefined;
    if (searchTerm.trim().length < 2) return undefined;
    const controller = new AbortController();
    suggestionController.current = controller;
    const timer = window.setTimeout(async () => {
      try {
        const { data } = await api.get("/products/suggest", { params: { q: searchTerm.trim() }, signal: controller.signal });
        if (!controller.signal.aborted) {
          setSuggestions(Array.isArray(data) ? data.slice(0, 6) : []);
          setSuggestionsOpen(true);
        }
      } catch {
        if (!controller.signal.aborted) setSuggestions([]);
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchTerm, mobileSearchOpen]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        suggestionController.current?.abort();
        setSuggestionsOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        suggestionController.current?.abort();
        setSuggestionsOpen(false);
        setMobileSearchOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const submitSearch = (event) => {
    event.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;
    setSuggestionsOpen(false);
    setMobileSearchOpen(false);
    navigate(`/shop?search=${encodeURIComponent(term)}`);
  };

  const apiOrigin = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");

  return (
    <header
      dir={isRTL ? "rtl" : "ltr"}
      className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur-sm"
    >
      <div className="mx-auto flex h-16 min-w-0 max-w-7xl items-center gap-2 px-3 sm:gap-3 sm:px-6 lg:px-8">
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center text-ink lg:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={22} strokeWidth={1.75} /> : <Menu size={22} strokeWidth={1.75} />}
        </button>

        <Link to="/" className="flex shrink-0 items-center lg:me-8" aria-label="Home">
          {!logoError ? (
            <img
              src={logo}
              alt="DEJA FRAGRANCES"
              className="h-9 w-auto max-w-32 object-contain lg:h-12 lg:max-w-44"
              onError={() => setLogoError(true)}
              onLoad={(e) => {
                if (e.currentTarget.naturalWidth <= 1) setLogoError(true);
              }}
            />
          ) : (
            <span className="font-display text-sm font-semibold tracking-tightest">DEJA FRAGRANCES</span>
          )}
        </Link>

        <NavLinks compact className="hidden min-w-0 flex-1 items-center justify-center gap-6 lg:flex" />

        <div className="ms-auto flex shrink-0 items-center gap-1.5 lg:ms-0 lg:gap-3">
          {secondaryLink && (
            <Link to={secondaryLink.to} className="hidden items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate transition-colors hover:text-ink lg:flex">
              <LayoutDashboard size={16} strokeWidth={1.75} />
              <span>{secondaryLink.label}</span>
            </Link>
          )}
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="hidden items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate transition-colors hover:text-ink lg:flex" aria-label="Account">
                <User size={16} strokeWidth={1.75} />{t("auth.signInTitle") || "Sign In"}
              </Link>
              <Link to="/register" className="hidden items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate transition-colors hover:text-ink lg:flex">
                {t("auth.signUpTitle") || "Register"}
              </Link>
            </>
          ) : (
            <>
              <Link to="/profile" className="hidden min-w-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink transition-colors hover:text-slate lg:flex" aria-label="Profile">
                <User size={16} strokeWidth={1.75} />
                <span className="max-w-24 truncate">{user?.name || user?.firstName || user?.email || t("navbar.profile")}</span>
              </Link>
              <button onClick={logout} className="hidden items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate transition-colors hover:text-red-500 lg:flex" aria-label="Logout">
                <LogOut size={16} strokeWidth={1.75} />
                <span>{t("auth.logout") || "Logout"}</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={toggleLocale}
            className="order-3 flex h-9 shrink-0 items-center gap-1 rounded-full border border-line px-2.5 text-xs font-semibold text-ink transition-colors hover:border-ink lg:order-1 lg:px-3"
            aria-label="Toggle language"
          >
            <Globe size={14} strokeWidth={1.75} />
            <span>{locale === "en" ? "AR" : "EN"}</span>
          </button>

          <button type="button" onClick={() => setMobileSearchOpen((open) => !open)} className="order-2 flex h-9 w-9 shrink-0 items-center justify-center text-ink lg:hidden" aria-label={t("navbar.search")} aria-expanded={mobileSearchOpen}>
            {mobileSearchOpen ? <X size={19} /> : <Search size={19} />}
          </button>

          <form ref={searchRef} onSubmit={submitSearch} className={cn("relative min-w-0 lg:order-2", mobileSearchOpen ? "absolute inset-x-4 top-full z-50 block bg-paper py-3 lg:static lg:block lg:bg-transparent lg:py-0" : "hidden lg:block")}>
            <label className="sr-only" htmlFor="navbar-search">{t("navbar.search")}</label>
            <div className="flex items-center border border-line bg-paper">
              <Search className="ms-3 shrink-0 text-slate" size={16} />
              <input id="navbar-search" value={searchTerm} onChange={(event) => { const nextTerm = event.target.value; setSearchTerm(nextTerm); setSuggestionsOpen(true); if (nextTerm.trim().length < 2) setSuggestions([]); }} onFocus={() => { if (suggestions.length) setSuggestionsOpen(true); }} placeholder={t("navbar.searchPlaceholder")} className="w-full min-w-0 bg-transparent px-2 py-2 text-sm outline-none lg:w-32 xl:w-40" />
            </div>
            {suggestionsOpen && searchTerm.trim().length >= 2 && <div className="absolute start-0 top-full z-[60] mt-1 w-full min-w-64 border border-line bg-paper shadow-lg">
              {suggestions.length ? suggestions.map((suggestion) => <button key={suggestion._id} type="button" onClick={() => { setSuggestionsOpen(false); setMobileSearchOpen(false); navigate(`/product/${suggestion._id}`); }} className="flex w-full items-center gap-3 border-b border-line p-3 text-start last:border-b-0 hover:bg-paper-dim">
                <img src={suggestion.image ? `${apiOrigin}${suggestion.image}` : ""} alt="" className="h-12 w-10 shrink-0 bg-paper-dim object-cover" />
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{locale === "ar" ? suggestion.nameAr || suggestion.name : suggestion.name}</span><span className="block truncate text-xs text-slate">{suggestion.brand}</span></span>
                <span className="shrink-0 text-xs text-slate">{t("navbar.fromPrice")} {suggestion.minPrice} {t("common.currency")}</span>
              </button>) : <p className="px-3 py-3 text-sm text-slate">{t("navbar.noSuggestions")}</p>}
            </div>}
          </form>

          <Link
            to="/cart"
            data-motion-interactive
            className="order-1 relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-paper-dim lg:order-3"
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

        </div>
      </div>

      {/* ── Mobile dropdown ── */}
      {mobileOpen && (
        <div className={cn("border-t border-line bg-paper lg:hidden", isRTL ? "text-right" : "text-left")}>
          <NavLinks
            className="flex flex-col gap-5 px-4 pt-6 sm:px-6"
            onLinkClick={() => setMobileOpen(false)}
          />

          <div className="flex flex-col gap-4 border-t border-line mt-5 px-4 py-6 sm:px-6">

            {/* Role-based secondary link (mobile) */}
            {secondaryLink && <Link to={secondaryLink.to} onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-wider text-slate hover:text-ink">
              <LayoutDashboard size={18} strokeWidth={1.75} />{secondaryLink.label}
            </Link>}

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
