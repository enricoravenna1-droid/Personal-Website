"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";

type Voice = {
  name: string;
  title: string;
  photo: string;
  alt: string;
  pull: string;
  quote: string;
};

/**
 * A community-voice card: the photograph, and the quote that racks it out of
 * focus.
 *
 * The old card laid the whole quote on a glass panel over the picture. That
 * was a legibility solution to a legibility problem and it created a worse
 * one: on Cathie Dorsch's sixty-word quote the panel covered two thirds of the
 * frame, so the two people in the room — which is the entire evidentiary point
 * of a card like this — were hidden behind the text describing them.
 *
 * The fix is not a smaller panel. It is deciding that the card has two states
 * and that both of them are complete.
 *
 * **At rest** the photograph is the card. It is sharp, full-bleed, and carries
 * only an attribution bar and one pulled line — enough that a visitor who never
 * interacts still gets a name, a title, and a claim.
 *
 * **Open** — on hover, on focus, or on tap — a glass panel rises and the
 * photograph pulls back, dims and goes soft behind it. The rack focus is the
 * whole idea: a real lens cannot hold the foreground and the background at the
 * same time, and neither can a reader. Whichever layer is being attended to is
 * the layer that is sharp.
 *
 * Nothing is hidden from assistive technology in either state: the full quote
 * is in the markup at all times, and the control that reveals it is a real
 * button with `aria-expanded`, not a div listening for clicks.
 */
export function CommunityVoiceCard({
  voice,
  /** Reveal-stagger class from the page's own scroll-in system, e.g. "d2". */
  delay,
}: {
  voice: Voice;
  delay?: string;
}) {
  const [open, setOpen] = useState(false);
  /**
   * Hover opens the card, but only where hovering is a thing that happens.
   *
   * A touch browser reports a `pointerenter` on first tap and then keeps the
   * element in a sticky :hover state until you tap elsewhere, so wiring open
   * to hover unconditionally gives phones a card that opens on the tap meant
   * to scroll and never closes. Below, the pointer-enter handlers are simply
   * not attached unless the device actually has a fine pointer.
   */
  const [hoverable, setHoverable] = useState(false);
  const quoteId = useId();

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setHoverable(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Escape closes it, matching every other transient panel a keyboard user
  // has ever met. Only bound while something is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const hoverProps = hoverable
    ? {
        onPointerEnter: () => setOpen(true),
        onPointerLeave: () => setOpen(false),
      }
    : {};

  return (
    <figure
      className={`cv-card reveal${delay ? ` ${delay}` : ""}${open ? " cv-card-open" : ""}`}
      /**
       * Hover and the button, and deliberately not focus.
       *
       * An earlier version also opened on `focus` anywhere inside the card,
       * reasoning that a keyboard user tabbing in never generates a pointer
       * event. It broke every tap. On a touch device the sequence is focus
       * then click, both in one React batch: focus queued `true`, the click's
       * toggle then read that pending `true` and queued `false`, and the card
       * ended a tap exactly where it started.
       *
       * Removing it costs nothing, because nothing focusable is hidden in the
       * closed state — the quote is in the markup either way. Tab lands on a
       * button that says "Read the quote", Enter opens it, Escape closes it,
       * which is the disclosure pattern a keyboard user already knows.
       */
      {...hoverProps}
    >
      <div className="cv-card-frame">
        <Image
          src={voice.photo}
          alt={voice.alt}
          className="cv-card-photo"
          width={1200}
          height={900}
          sizes="(max-width: 720px) 92vw, 44vw"
          priority={false}
        />
        {/* Two scrims, not one. The rest-state scrim only has to hold a name
            and a single line at the foot of the frame; the open-state scrim
            has to hold a paragraph. Cross-fading between them means the
            picture is never darkened more than whatever is currently sitting
            on it requires. */}
        <div className="cv-card-scrim" aria-hidden="true" />
        <div className="cv-card-scrim-open" aria-hidden="true" />
      </div>

      <figcaption className="cv-card-panel">
        <span className="cv-card-rule" aria-hidden="true" />
        <p className="cv-card-name">{voice.name}</p>
        <p className="cv-card-title">{voice.title}</p>

        {/* The pulled line and the full quote trade places: one collapses as
            the other opens, both through a 0fr ↔ 1fr grid row.

            That grid row is what makes these real height animations rather
            than max-height guesses. A max-height large enough for the longest
            quote makes every shorter card ease at the wrong speed, because the
            transition is timed against a height the content never reaches, and
            one set too small clips the longest quote outright.

            The pulled line is aria-hidden because it is a verbatim fragment of
            the quote beneath it: to a screen reader, reading both is reading
            the same sentence twice. */}
        <div className="cv-card-pull" aria-hidden="true">
          <p>{voice.pull}</p>
        </div>

        <div className="cv-card-reveal" id={quoteId}>
          <blockquote className="cv-card-quote">
            <span className="cv-card-open-glyph" aria-hidden="true">
              &ldquo;
            </span>
            {voice.quote}
          </blockquote>
        </div>

        <button
          type="button"
          className="cv-card-toggle"
          aria-expanded={open}
          aria-controls={quoteId}
          onClick={() => setOpen((v) => !v)}
        >
          <span>{open ? "Close" : "Read the quote"}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.2"
              d="m6 9 6 6 6-6"
            />
          </svg>
          {/* Only on the way in. "Read the quote" out of context could be
              anyone's quote and wants the name; "Close from Dr. Cathie
              Dorsch, PhD" is not a sentence. */}
          {open ? null : <span className="sr-only"> from {voice.name}</span>}
        </button>
      </figcaption>
    </figure>
  );
}
