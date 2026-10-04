import { useLayoutEffect, useRef } from "react";

/** Observe only marked presentation elements; content stays visible without JS. */
export function useScrollMotion(route: string) {
  const root = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const container = root.current?.parentElement;
    if (!container || !("IntersectionObserver" in window)) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const registered = new Set<HTMLElement>();
    const reveal = (element: HTMLElement, instant = false) => {
      element.classList.remove("motion-pending");
      element.classList.add("is-revealed");
      if (instant) element.classList.add("motion-instant");
      observer.unobserve(element);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) reveal(entry.target as HTMLElement);
        }
      },
      // Long articles can exceed the viewport by many times; an area-based
      // threshold would leave them hidden forever. Reveal on first intersection.
      { threshold: 0, rootMargin: "0px 0px -32px 0px" },
    );
    const register = () => {
      for (const element of container.querySelectorAll<HTMLElement>(
        "[data-reveal]",
      )) {
        if (registered.has(element)) continue;
        if (!element.getClientRects().length) continue;
        registered.add(element);
        if (preference.matches) {
          reveal(element, true);
          continue;
        }
        const group = element.parentElement;
        const index = group?.hasAttribute("data-motion-group")
          ? Array.from(group.children).indexOf(element)
          : 0;
        element.style.setProperty(
          "--motion-delay",
          `${Math.min(index, 4) * 85}ms`,
        );
        element.classList.add("motion-pending");
        observer.observe(element);
      }
    };
    // Async releases and other newly mounted content join the same sequence.
    const mutations = new MutationObserver(register);
    mutations.observe(container, { childList: true, subtree: true });
    const onPreference = () => {
      if (preference.matches) {
        for (const element of registered) reveal(element, true);
      }
    };
    const onFocus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      let element: HTMLElement | null = event.target.closest("[data-reveal]");
      while (element && container.contains(element)) {
        reveal(element, true);
        element =
          element.parentElement?.closest<HTMLElement>("[data-reveal]") ?? null;
      }
    };
    register();
    preference.addEventListener("change", onPreference);
    window.addEventListener("resize", register);
    container.addEventListener("focusin", onFocus);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      preference.removeEventListener("change", onPreference);
      window.removeEventListener("resize", register);
      container.removeEventListener("focusin", onFocus);
      for (const element of registered) {
        element.classList.remove(
          "motion-pending",
          "is-revealed",
          "motion-instant",
        );
        element.style.removeProperty("--motion-delay");
      }
    };
  }, [route]);
  return root;
}
