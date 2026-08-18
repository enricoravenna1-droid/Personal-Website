/**
 * Section marks: a small emblem above the sections that are only words.
 *
 * Most sections on this site have a photograph, a globe, a card grid or a set
 * of counting numbers to anchor them. A handful do not — "Where I add value",
 * "What I'm thinking about", "People, not just programs" — and those open with
 * a 10px eyebrow and then a headline, which is a lot of empty page to ask a
 * line of small caps to hold.
 *
 * These are not logos in the trademark sense and they are deliberately not
 * organisational: the standing rule on this account is that documents are
 * unbranded and the name is the brand. They are a system of six marks in one
 * language — 24px line art, one stroke weight, one accent — so that a reader
 * moving between pages recognises the furniture rather than reading a new
 * decoration each time.
 *
 * The glyphs share their construction with components/area-icon.tsx on
 * purpose. Two stroked-icon vocabularies on one site is one too many.
 */

const GLYPHS: Record<string, React.ReactNode> = {
  /**
   * Where I add value — steps, and the line that keeps going past them.
   *
   * Two drafts died here and both for the same reason, which is worth
   * recording. Three radiating arcs drew a perfectly good mark that every
   * reader identifies as a wifi symbol. An arch with a seated keystone was
   * meaningful — the piece that takes the load — and at 23px it read as a
   * gate wearing a hat. A glyph does not get to be clever at a size where it
   * cannot first be read.
   *
   * Steps survive the size test, and the arrow leaving the top step is his
   * own sentence from /vision: "and I'm not done growing".
   */
  value: (
    <>
      <path d="M3.4 19.6h4.6v-4.6h4.6v-4.6h4.6V5.6" />
      <path d="m14.4 8.4 2.8-2.8 2.8 2.8" />
    </>
  ),
  /**
   * What I'm thinking about — a compass, not an aperture.
   *
   * The aperture it replaces was a circle with a diagonal through it, which
   * at 23px is indistinguishable from a prohibition sign. A needle reads as a
   * bearing, which is closer to the point anyway: the section is a point of
   * view, not a lens.
   */
  insight: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M8.3 15.7 14.4 13 17 6.9 10.9 9.6z" />
      <circle cx="12" cy="12" r="0.9" />
    </>
  ),
  /** People, not just programs — nodes, and the ties between them. */
  people: (
    <>
      <circle cx="12" cy="5.4" r="1.9" />
      <circle cx="5.2" cy="17.4" r="1.9" />
      <circle cx="18.8" cy="17.4" r="1.9" />
      <path d="M10.6 7.1 6.6 15.7" />
      <path d="M13.4 7.1l4 8.6" />
      <path d="M7.1 17.4h9.8" />
    </>
  ),
  /** Let's connect — an approach, and a way in. */
  connect: (
    <>
      <path d="M20 12a8 8 0 1 1-4.6-7.25" />
      <path d="M3.4 12h9.2" />
      <path d="m9.6 8.6 3.4 3.4-3.4 3.4" />
    </>
  ),
  /** Voices — the shape a room full of people makes. */
  voices: (
    <>
      <path d="M4 10.4v3.2" />
      <path d="M8 6.6v10.8" />
      <path d="M12 3.4v17.2" />
      <path d="M16 7.8v8.4" />
      <path d="M20 10.4v3.2" />
    </>
  ),
  /**
   * Where to next — a road running to a sunrise on the horizon.
   *
   * The one glyph in the set that is not abstract, and it earns that: the
   * hero plate is a sunrise over a desert road and the departure imagery on
   * his own feed is a road at dawn. This is that picture at 23 pixels.
   */
  next: (
    <>
      <path d="M3.4 15.2h17.2" />
      <path d="M8.4 15.2a3.6 3.6 0 0 1 7.2 0" />
      <path d="M8.6 21.2 11.3 15.2" />
      <path d="m15.4 21.2-2.7-6" />
      {/* Rays kept short and set off the arc by a clear gap. Drawn any
          longer or any closer they merge with the sun into one blob at
          23px, which is the size that matters. */}
      <path d="M12 5.4v1.6M6.4 8.2l1.1 1.1M17.6 8.2l-1.1 1.1" />
    </>
  ),
};

export type SectionMarkName = keyof typeof GLYPHS;

export function SectionMark({ name }: { name: SectionMarkName }) {
  return (
    <span className="section-mark reveal" aria-hidden="true">
      <span className="section-mark-ring" />
      <svg viewBox="0 0 24 24">{GLYPHS[name] ?? null}</svg>
    </span>
  );
}
