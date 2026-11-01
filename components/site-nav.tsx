"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { NAV, SITE, type NavEntry } from "@/lib/content";

/**
 * The floating glass pill, with a dropdown under each item.
 *
 * Disclosure pattern, not an ARIA menu: these are page links, and a
 * `role="menu"` would tell a screen reader to expect an application menu
 * with its own key model. Each item is a link to the page plus a toggle
 * button with `aria-expanded`; the panel is a plain list of links.
 *
 * Mouse: hover opens, leaving closes after a short grace period so the
 * pointer can cross the gap. Touch: the first tap on a label opens its
 * panel, a tap on an entry goes. Keyboard: ArrowDown opens and enters the
 * panel, arrows move, Home and End jump, Escape closes and hands focus
 * back, ArrowLeft and ArrowRight walk the top row.
 *
 * The panels are siblings of the pill, not children. An element with
 * backdrop-filter becomes the backdrop root for everything inside it, so a
 * panel nested in the pill would blur the pill and not the page.
 *
 * On a phone the row does not fit. The pill carries a menu button that
 * drops a sheet with the same four groups as an accordion.
 */
export function SiteNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [visible, setVisible] = useState(!isHome);
  const [open, setOpen] = useState<number | null>(null);
  const [sheet, setSheet] = useState(false);
  const [sheetGroup, setSheetGroup] = useState<number | null>(null);
  const [panelX, setPanelX] = useState(0);
  const ticking = useRef(false);
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const labelRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const toggleRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const closeTimer = useRef(0);

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

  // A new page closes everything.
  useEffect(() => {
    setOpen(null);
    setSheet(false);
    setSheetGroup(null);
  }, [pathname]);

  const place = useCallback((i: number) => {
    const item = itemRefs.current[i];
    const nav = navRef.current;
    if (!item || !nav) return;
    const a = item.getBoundingClientRect();
    const n = nav.getBoundingClientRect();
    setPanelX(a.left + a.width / 2 - n.left);
  }, []);

  const show = useCallback((i: number) => {
    window.clearTimeout(closeTimer.current);
    place(i);
    setOpen(i);
  }, [place]);

  const hideSoon = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(null), 140);
  }, []);

  // Outside click and Escape close whatever is open.
  useEffect(() => {
    if (open === null && !sheet) return;
    const onDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpen(null);
        setSheet(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (open !== null) {
        const i = open;
        setOpen(null);
        (toggleRefs.current[i] ?? labelRefs.current[i])?.focus();
      } else if (sheet) {
        setSheet(false);
        navRef.current?.querySelector<HTMLButtonElement>(".snav-burger")?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, sheet]);

  const entries = (i: number) =>
    Array.from(panelRefs.current[i]?.querySelectorAll<HTMLAnchorElement>("a") ?? []);

  const focusEntry = (i: number, k: number | "last") => {
    // The panel is display:none until React commits `open`, so wait a frame.
    requestAnimationFrame(() => {
      const list = entries(i);
      if (!list.length) return;
      (k === "last" ? list[list.length - 1] : list[k])?.focus();
    });
  };

  const onTopKey = (i: number) => (e: React.KeyboardEvent) => {
    const n = NAV.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      show(i);
      focusEntry(i, 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      show(i);
      focusEntry(i, "last");
    } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const j = (i + (e.key === "ArrowRight" ? 1 : n - 1)) % n;
      setOpen(null);
      labelRefs.current[j]?.focus();
    }
  };

  const onPanelKey = (i: number) => (e: React.KeyboardEvent) => {
    const list = entries(i);
    const at = list.indexOf(document.activeElement as HTMLAnchorElement);
    let next = -1;
    if (e.key === "ArrowDown") next = (at + 1) % list.length;
    else if (e.key === "ArrowUp") next = (at - 1 + list.length) % list.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = list.length - 1;
    else if (e.key === "Tab") {
      // Tabbing out of the last entry, or back out of the first, closes it.
      if ((!e.shiftKey && at === list.length - 1) || (e.shiftKey && at === 0)) setOpen(null);
      return;
    }
    if (next >= 0) {
      e.preventDefault();
      list[next]?.focus();
    }
  };

  // First tap on a touch screen opens the panel instead of leaving.
  const onLabelClick = (i: number) => (e: React.MouseEvent) => {
    const coarse = window.matchMedia("(hover: none)").matches;
    if (coarse && open !== i) {
      e.preventDefault();
      show(i);
    } else {
      setOpen(null);
    }
  };

  // Same-page jumps go through Lenis so the ride stays smooth; other pages
  // load at the anchor on their own.
  const jump = (href: string) => (e: React.MouseEvent) => {
    setOpen(null);
    setSheet(false);
    const [path, hash] = href.split("#");
    if (path !== pathname) return;
    const target = hash ? document.getElementById(hash) : null;
    const lenis = window.__lenis;
    e.preventDefault();
    if (hash) history.replaceState(null, "", `#${hash}`);
    else history.replaceState(null, "", path);
    if (lenis) lenis.scrollTo(target ?? 0, { offset: 0 });
    else if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  };

  const entryRow = (e: NavEntry) => (
    <>
      {e.n ? <span className="snav-dd-n">{e.n}</span> : null}
      <span className="snav-dd-label">{e.label}</span>
      {e.meta ? <span className="snav-dd-meta">{e.meta}</span> : null}
    </>
  );

  return (
    <nav
      ref={navRef}
      id="sticky-nav"
      className={visible ? "snav-visible" : undefined}
      aria-label="Primary"
    >
      <div className="snav-pill glass">
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
            {NAV.map((item, i) => (
              <div
                key={item.href}
                className="snav-item"
                data-open={open === i ? "1" : undefined}
                ref={(el) => { itemRefs.current[i] = el; }}
                onPointerEnter={(e) => { if (e.pointerType === "mouse") show(i); }}
                onPointerLeave={(e) => { if (e.pointerType === "mouse") hideSoon(); }}
              >
                <Link
                  href={item.href}
                  className="snav-label"
                  aria-current={pathname === item.href ? "page" : undefined}
                  ref={(el) => { labelRefs.current[i] = el; }}
                  onClick={onLabelClick(i)}
                  onKeyDown={onTopKey(i)}
                >
                  {item.label}
                </Link>
                <button
                  type="button"
                  className="snav-chev"
                  aria-expanded={open === i}
                  aria-controls={`snav-dd-${i}`}
                  aria-label={`${item.label} sections`}
                  ref={(el) => { toggleRefs.current[i] = el; }}
                  onClick={() => (open === i ? setOpen(null) : show(i))}
                  onKeyDown={onTopKey(i)}
                >
                  <svg viewBox="0 0 10 10" aria-hidden="true">
                    <path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="snav-right">
            <a href={`mailto:${SITE.email}`} className="snav-cta">
              Let&apos;s talk
            </a>
            <button
              type="button"
              className="snav-burger"
              aria-expanded={sheet}
              aria-controls="snav-sheet"
              aria-label={sheet ? "Close menu" : "Open menu"}
              onClick={() => setSheet((s) => !s)}
            >
              <span /><span />
            </button>
          </div>
        </div>
      </div>

      {NAV.map((item, i) => (
        <div
          key={item.href}
          id={`snav-dd-${i}`}
          className="snav-dd"
          hidden={open !== i}
          style={{ left: panelX }}
          ref={(el) => { panelRefs.current[i] = el; }}
          onPointerEnter={(e) => { if (e.pointerType === "mouse") show(i); }}
          onPointerLeave={(e) => { if (e.pointerType === "mouse") hideSoon(); }}
          onKeyDown={onPanelKey(i)}
        >
          <div className="snav-dd-glass">
            <ul>
              {item.items.map((e) => (
                <li key={e.href}>
                  <Link href={e.href} className={e.n ? "snav-dd-a snav-dd-num" : "snav-dd-a"} onClick={jump(e.href)}>
                    {entryRow(e)}
                  </Link>
                </li>
              ))}
            </ul>
            {item.all ? (
              <>
                <hr />
                <Link href={item.all.href} className="snav-dd-a snav-dd-all" onClick={jump(item.all.href)}>
                  {item.all.label} <span aria-hidden="true">→</span>
                </Link>
              </>
            ) : null}
          </div>
        </div>
      ))}

      <div id="snav-sheet" className="snav-sheet" hidden={!sheet}>
        <div className="snav-sheet-glass">
          {NAV.map((item, i) => (
            <div key={item.href} className="snav-sg" data-open={sheetGroup === i ? "1" : undefined}>
              <div className="snav-sg-head">
                <Link
                  href={item.href}
                  className="snav-sg-label"
                  aria-current={pathname === item.href ? "page" : undefined}
                  onClick={jump(item.href)}
                >
                  {item.label}
                </Link>
                <button
                  type="button"
                  className="snav-sg-chev"
                  aria-expanded={sheetGroup === i}
                  aria-controls={`snav-sg-${i}`}
                  aria-label={`${item.label} sections`}
                  onClick={() => setSheetGroup((g) => (g === i ? null : i))}
                >
                  <svg viewBox="0 0 10 10" aria-hidden="true">
                    <path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <ul id={`snav-sg-${i}`} hidden={sheetGroup !== i}>
                {[...item.items, ...(item.all ? [item.all] : [])].map((e) => (
                  <li key={e.href}>
                    <Link href={e.href} className="snav-dd-a" onClick={jump(e.href)}>
                      {entryRow(e)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
