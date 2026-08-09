/**
 * Stroked line icons for the capability cards.
 *
 * These replaced colour emoji. Emoji render in the system's own palette,
 * which on this page meant a red shield, a purple star and a blue wrench
 * sitting inside a strictly red/black/gray design — six accent colours the
 * palette does not contain, arriving through a glyph nobody chose.
 */
const PATHS: Record<string, React.ReactNode> = {
  shield: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.4 3.1 8.2 7.5 9.5 4.4-1.3 7.5-5.1 7.5-9.5V6L12 3Z" />
      <path d="m9.2 12 2 2 3.6-3.8" />
    </>
  ),
  rings: (
    <>
      <circle cx="9.2" cy="12" r="5.2" />
      <circle cx="14.8" cy="12" r="5.2" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="m7.5 15 3.5-4 3 2.5 5-6.5" />
      <path d="M19.5 7h-3.2M19.5 7v3.2" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" />
      <path d="M12 4V2M12 22v-2M4 12H2M22 12h-2" />
    </>
  ),
  star: (
    <>
      <path d="M12 3.5 19.4 16.3H4.6L12 3.5Z" />
      <path d="M12 20.5 4.6 7.7h14.8L12 20.5Z" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20.2 4.4v4.2H16" />
    </>
  ),
};

export function AreaIcon({ name }: { name: string }) {
  return (
    <span className="area-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24">{PATHS[name] ?? null}</svg>
    </span>
  );
}
