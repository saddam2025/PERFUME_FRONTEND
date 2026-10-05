import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

export default function RouteScrollManager() {
  const location = useLocation();

  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const customContainers = document.querySelectorAll("[data-scroll-container]");
    customContainers.forEach((container) => {
      container.scrollTop = 0;
      container.scrollLeft = 0;
    });

    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.getComputedStyle(root).scrollBehavior;

    if (location.hash) {
      const targetId = decodeURIComponent(location.hash.slice(1));
      const target = document.getElementById(targetId);
      if (target) {
        const targetTop = target.getBoundingClientRect().top + window.scrollY;
        root.scrollTop = targetTop;
        if (document.body) document.body.scrollTop = targetTop;
        window.scrollTo(0, targetTop);
      }
      root.style.scrollBehavior = previousScrollBehavior;
      return;
    }

    root.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    window.scrollTo(0, 0);
    root.style.scrollBehavior = previousScrollBehavior;
  }, [location.pathname, location.search, location.hash, location.key]);

  return null;
}
