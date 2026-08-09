"use client";

import { useEffect, useState } from "react";
import { BANNER_MESSAGES, SITE } from "@/lib/content";
import { useReducedMotion } from "@/lib/use-reduced-motion";

export function UtilityBanner() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      setVisible(false);
      // Matches the 0.55s opacity transition in globals.css; swapping the
      // text sooner shows the change mid-fade.
      setTimeout(() => {
        setIndex((i) => (i + 1) % BANNER_MESSAGES.length);
        setVisible(true);
      }, 560);
    }, 6000);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <div id="utility-banner">
      <span className="banner-dot" aria-hidden="true" />
      {/* aria-live is deliberately absent: this rotates on a timer and is
          marketing copy, so announcing each change would interrupt a screen
          reader mid-sentence for no benefit. */}
      <span id="banner-msg" style={{ opacity: visible ? 1 : 0 }}>
        {BANNER_MESSAGES[index]}
      </span>
      &nbsp;·&nbsp;
      <a href={SITE.linkedin} target="_blank" rel="noopener noreferrer">
        Connect on LinkedIn →
      </a>
    </div>
  );
}
