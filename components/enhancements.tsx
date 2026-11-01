"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Progressive enhancements that need the DOM.
 *
 * Everything here is optional: the page is complete and readable without a
 * line of it. Two groups:
 *
 *  1. The `.reveal` entrance fallback, for browsers that cannot drive it
 *     from scroll natively.
 *  2. Pointer effects: the glass specular and magnetic buttons. The photo
 *     tilt was removed in round three (2026-11-01): photographs now move
 *     only with the scroll, at one speed rule, on every page.
 *
 * Re-runs on route change, because App Router keeps the layout mounted and
 * swaps the page under it: without the pathname dependency, only the first
 * page visited would ever get wired up.
 */
export function Enhancements() {
  const pathname = usePathname();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const scrollDriven =
      !reduced &&
      typeof CSS !== "undefined" &&
      CSS.supports?.("animation-timeline", "view()");

    const cleanups: (() => void)[] = [];
    const $ = (sel: string) => Array.from(document.querySelectorAll(sel));

    const observe = (
      sel: string,
      cls: string,
      opts: IntersectionObserverInit = {
        threshold: 0.12,
        rootMargin: "0px 0px -6% 0px",
      },
    ) => {
      const nodes = $(sel);
      if (!nodes.length) return;
      if (reduced) {
        nodes.forEach((n) => n.classList.add(cls));
        return;
      }
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add(cls);
            io.unobserve(e.target);
          }
        });
      }, opts);
      nodes.forEach((n) => io.observe(n));
      cleanups.push(() => io.disconnect());
    };

    // Fallback path only. Where the CSS is driving these off the scroll,
    // adding classes would be redundant work fighting a live animation.
    if (!scrollDriven) {
      observe(".reveal", "in", { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });
      const settle = window.setTimeout(() => {
        $(".reveal").forEach((el) => {
          if (el.getBoundingClientRect().top < window.innerHeight * 0.96) {
            el.classList.add("in");
          }
        });
      }, 60);
      cleanups.push(() => window.clearTimeout(settle));
    }

    if (!reduced && fine) {
      // Glass specular. Percentages, read straight by the radial-gradient.
      $(".glass").forEach((el) => {
        const node = el as HTMLElement;
        const onMove = (e: Event) => {
          const ev = e as PointerEvent;
          const r = node.getBoundingClientRect();
          node.style.setProperty("--mx", `${(((ev.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
          node.style.setProperty("--my", `${(((ev.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
        };
        node.addEventListener("pointermove", onMove, { passive: true });
        cleanups.push(() => node.removeEventListener("pointermove", onMove));
      });

      // Magnetic buttons. The offset goes to --tx/--ty so the press scale and
      // any hover lift compose with it instead of overwriting it.
      $(".btn-primary,.btn-secondary,.btn-hero-primary,.btn-hero-ghost").forEach((el) => {
        const node = el as HTMLElement;
        const onMove = (e: Event) => {
          const ev = e as PointerEvent;
          const r = node.getBoundingClientRect();
          node.style.setProperty("--tx", `${((ev.clientX - r.left - r.width / 2) * 0.18).toFixed(1)}px`);
          node.style.setProperty("--ty", `${((ev.clientY - r.top - r.height / 2) * 0.18 - 2).toFixed(1)}px`);
        };
        const onLeave = () => {
          node.style.setProperty("--tx", "0px");
          node.style.setProperty("--ty", "0px");
        };
        node.addEventListener("pointermove", onMove, { passive: true });
        node.addEventListener("pointerleave", onLeave);
        cleanups.push(() => {
          node.removeEventListener("pointermove", onMove);
          node.removeEventListener("pointerleave", onLeave);
        });
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, [pathname]);

  return null;
}
