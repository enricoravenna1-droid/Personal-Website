import Link from "next/link";
import { PAGE_TITLES, READING_ORDER } from "@/lib/content";

/**
 * Previous / next at the foot of every page.
 *
 * Splitting one long scroll into five routes takes away the thing a long
 * page gives you for free: a reader who simply keeps going. Without this,
 * every page is a dead end and the narrative order — soldier, builder,
 * leader, then the people who vouch for it, then the work, then where it is
 * going — is only discoverable from the nav. This puts the thread back.
 */
export function PageNav({ current }: { current: string }) {
  const i = READING_ORDER.indexOf(current as (typeof READING_ORDER)[number]);
  if (i === -1) return null;

  const prev = i > 0 ? READING_ORDER[i - 1] : null;
  const next = i < READING_ORDER.length - 1 ? READING_ORDER[i + 1] : null;
  if (!prev && !next) return null;

  return (
    <nav className="page-nav" aria-label="Page">
      <div className="container page-nav-inner">
        {prev ? (
          <Link href={prev} className="page-nav-link page-nav-prev">
            <span className="page-nav-dir">← Previous</span>
            <span className="page-nav-title">{PAGE_TITLES[prev]}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={next} className="page-nav-link page-nav-next">
            <span className="page-nav-dir">Next →</span>
            <span className="page-nav-title">{PAGE_TITLES[next]}</span>
          </Link>
        ) : (
          <span />
        )}
      </div>
    </nav>
  );
}
