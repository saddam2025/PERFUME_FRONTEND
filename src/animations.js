const revealSelector = 'main section:not([data-motion-hero]), main h1, [data-motion-reveal], [data-motion-card], [data-motion-image]';
const privatePaths = /^\/(admin|affiliate|checkout|order-success|login|register|profile|cart)(\/|$)/;

export function initAnimations() {
  const root = document.getElementById("root");
  const html = document.documentElement;
  if (!root) return;

  function isPublicPage() {
    return !privatePaths.test(window.location.pathname);
  }

  html.classList.toggle("motion-public", isPublicPage());
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let observer = null;
  if ("IntersectionObserver" in window) {
    try {
      observer = new IntersectionObserver((entries) => {
        const visibleCards = entries
          .filter((entry) => entry.isIntersecting && entry.target.hasAttribute("data-motion-card"))
          .map((entry) => entry.target);
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          const grid = entry.target.closest("[data-motion-stagger]");
          const batchIndex = entry.target.hasAttribute("data-motion-card")
            ? visibleCards.filter((card) => card.closest("[data-motion-stagger]") === grid).indexOf(entry.target)
            : undefined;
          reveal(entry.target, getDelay(entry.target, batchIndex));
        });
      }, { threshold: 0, rootMargin: "0px" });
    } catch {
      observer = null;
    }
  }

  function getDelay(element, batchIndex) {
    const styles = getComputedStyle(html);
    const step = parseFloat(styles.getPropertyValue("--motion-stagger-step")) || 70;
    const limit = parseFloat(styles.getPropertyValue("--motion-stagger-limit")) || 500;
    const explicitIndex = Number(element.dataset.motionStaggerIndex);
    if (Number.isFinite(explicitIndex) && element.dataset.motionStaggerIndex !== undefined) {
      return Math.min(explicitIndex * step, limit);
    }
    const grid = element.closest("[data-motion-stagger]");
    if (!grid || !element.hasAttribute("data-motion-card")) return 0;
    const cards = [...grid.querySelectorAll("[data-motion-card]")];
    const index = Number.isInteger(batchIndex) && batchIndex >= 0 ? batchIndex : cards.indexOf(element);
    return Math.min(Math.max(index, 0) * step, limit);
  }

  function reveal(element, delay = 0) {
    element.classList.remove("motion-pending");
    if (reducedMotion) {
      element.classList.add("motion-visible");
      return;
    }
    element.style.setProperty("--motion-delay", `${delay}ms`);
    element.classList.add("motion-enter");
    element.addEventListener("animationend", () => {
      element.classList.remove("motion-enter");
      element.classList.add("motion-visible");
      element.style.removeProperty("--motion-delay");
    }, { once: true });
  }

  function scan(node = root) {
    html.classList.toggle("motion-public", isPublicPage());
    if (!isPublicPage()) return;
    const elements = [];
    if (node instanceof Element && node.matches(revealSelector)) elements.push(node);
    if (node.querySelectorAll) elements.push(...node.querySelectorAll(revealSelector));
    const visibleCards = elements.filter((element) => {
      if (!element.hasAttribute("data-motion-card")) return false;
      const rect = element.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    });
    elements.forEach((element) => {
      if (element.dataset.motionReady) return;
      element.dataset.motionReady = "true";
      const rect = element.getBoundingClientRect();
      const inViewport = rect.bottom > 0 && rect.top < window.innerHeight;
      const batchIndex = element.hasAttribute("data-motion-card") ? visibleCards.indexOf(element) : undefined;
      if (inViewport || element.hasAttribute("data-motion-reveal") || !observer) {
        reveal(element, getDelay(element, batchIndex));
      } else {
        element.classList.add("motion-pending");
        try {
          observer.observe(element);
        } catch {
          reveal(element, getDelay(element, batchIndex));
        }
      }
    });
  }

  const mutations = new MutationObserver((records) => {
    html.classList.toggle("motion-public", isPublicPage());
    if (!isPublicPage() && html.classList.contains("splash-active")) {
      html.classList.remove("splash-active");
      document.dispatchEvent(new Event("deja:splash-ended"));
    }
    records.forEach((record) => record.addedNodes.forEach((node) => {
      if (node instanceof Element) scan(node);
    }));
  });
  mutations.observe(root, { childList: true, subtree: true });

  document.addEventListener("deja:splash-ended", () => scan(root), { once: true });
  if (!html.classList.contains("splash-active")) scan(root);
}
