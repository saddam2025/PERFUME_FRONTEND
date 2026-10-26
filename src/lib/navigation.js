export function getSecondaryLink(role, t) {
  const normalizedRole = (role || "").toLowerCase();
  if (normalizedRole === "manager" || normalizedRole === "admin") {
    return { to: "/admin", label: t("navbar.dashboard"), shortLabel: t("navbar.dashboardShort"), icon: "dashboard" };
  }
  if (normalizedRole === "affiliate") {
    return { to: "/affiliate/dashboard", label: t("navbar.affiliateDashboard"), shortLabel: t("navbar.affiliateDashboardShort"), icon: "affiliate" };
  }
  return null;
}
