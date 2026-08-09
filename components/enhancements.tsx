"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Progressive enhancements that need the DOM.
 *
 * Everything here is optional: the page is complete and readable without a
 * line of it. Two groups:
 *
 *  1. Class-triggered entrances, for the handful of effects CSS scroll
 *     timelines cannot express (a clip-path wipe that must not replay, a
 *     three-stage staggered fade). Skipped entirely where the browser drives
 *     entrances from scroll natively.
 *  2. Pointer effects: the glass specular, magnetic buttons, photo tilt.
 *     These have no scroll-driven equivalent at all.
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

    // Entrances CSS cannot own.
    observe(".journey-chapter", "ch-in");
    observe("#ch-interlude", "interlude-in", { threshold: 0.15 });
    observe(".arc-thesis", "arc-in", { threshold: 0.2 });
    observe(".spotlight-img-panel", "curtain-in", { threshold: 0.25 });

    // Fallback path only. Where the CSS is driving these off the scroll,
    // adding classes would be redundant work fighting a live animation.
    if (!scrollDriven) {
      observe(".reveal", "in", { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });
      observe(".vb-1,.vb-2,.vb-3", "vb-in");
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

      // Chapter photo tilt. Applied to the frame, not the image: the image
      // carries the scroll-driven parallax on its own transform.
      $("[data-tilt]").forEach((el) => {
        const node = el as HTMLElement;
        const max = parseFloat(node.dataset.tiltMax ?? "6");
        const onMove = (e: Event) => {
          const ev = e as PointerEvent;
          const r = node.getBoundingClientRect();
          const rx = ((ev.clientY - r.top) / r.height - 0.5) * -max * 2;
          const ry = ((ev.clientX - r.left) / r.width - 0.5) * max * 2;
          node.style.transition = "transform .12s linear";
          node.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
        };
        const onLeave = () => {
          node.style.transition = "transform .6s cubic-bezier(0.16,1,0.3,1)";
          node.style.transform = "";
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
