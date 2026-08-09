"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAV, SITE } from "@/lib/content";

/**
 * The floating glass pill.
 *
 * Two behaviours changed in the move off the single page:
 *
 *  - The active link is now derived from the route, not from an
 *    IntersectionObserver racing five sections for the honour. Simpler and
 *    always correct.
 *  - On the home page the pill still hides until you scroll, because the
 *    hero is a full-bleed composition and a bar across it costs more than it
 *    gives. On every other route there is no hero to protect, so the nav is
 *    present from the first paint.
 */
export function SiteNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [visible, setVisible] = useState(!isHome);
  const ticking = useRef(false);

  useEffect(() => {
    if (!isHome) {
      setVisible(true);
      return;
    }
    setVisible(window.scrollY > 120);

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        setVisible(window.scrollY > 120);
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  return (
    <nav
      id="sticky-nav"
      className={`glass${visible ? " snav-visible" : ""}`}
      aria-label="Primary"
    >
      <div className="snav-inner">
        <Link href="/" className="snav-identity" aria-label="Home">
          <Image
            src="/photo.jpg"
            alt=""
            className="snav-avatar"
            width={34}
            height={34}
            priority
            aria-hidden="true"
          />
        </Link>

        <div className="snav-links">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="snav-right">
          <a
            href={SITE.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="snav-cta"
          >
            Connect
          </a>
        </div>
      </div>
    </nav>
  );
}
