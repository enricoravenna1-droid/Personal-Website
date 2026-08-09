"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/**
 * Counts up once, when the number first comes into view.
 *
 * Server-renders the final value rather than a zero. A count-up that starts
 * from a server-rendered "0" ships a page whose visible content is a lie
 * until hydration finishes, and anything reading the HTML without running
 * JS — a crawler, a link preview, a reader mode — sees the lie and nothing
 * else. Here the correct figure is in the markup and the animation is a
 * progressive enhancement on top of it.
 */
export function CountUp({
  value,
  suffix = "",
  display,
}: {
  value: number;
  suffix?: string;
  display: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const [shown, setShown] = useState<string | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || reduced) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();

        const duration = 1400;
        const start = performance.now();
        let frame = 0;

        const step = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          // Cubic ease-out: fast off the mark, settling onto the figure.
          const eased = 1 - Math.pow(1 - t, 3);
          setShown(`${Math.round(eased * value)}${suffix}`);
          if (t < 1) frame = requestAnimationFrame(step);
          else setShown(null); // hand back to the exact display string
        };

        frame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frame);
      },
      { threshold: 0.6 },
    );

    io.observe(node);
    return () => io.disconnect();
  }, [value, suffix, reduced]);

  return (
    <span className="people-num" ref={ref}>
      {shown ?? display}
    </span>
  );
}
