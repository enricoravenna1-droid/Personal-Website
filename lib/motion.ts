import type { Transition, Variants } from "motion/react";

/**
 * Shared motion vocabulary.
 *
 * Rule: components import from here. They do not invent their own
 * durations or easings. Consistency across the whole site is what
 * separates "designed" from "animated by whoever touched it last".
 */

export const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const;
export const EASE_IN_OUT_QUART = [0.76, 0, 0.24, 1] as const;

/**
 * Entrance curve. Deliberately NOT ease-out-quart.
 *
 * Measured, ease-out-quart puts 60% of the change in the first 100ms and
 * completes 85% of it within 189ms. The rest of the duration drifts from
 * 0.87 to 1.0, which nobody can see. That makes the duration knob almost
 * useless on entrances: raising it from 380ms to 500ms only lengthens the
 * invisible tail.
 *
 * This curve spreads the same change across 361ms of visible movement.
 * Front-loading is correct for interactive feedback, where the user wants
 * an instant response. It is wrong for an entrance, where the movement
 * itself is the whole point.
 */
export const EASE_REVEAL = [0.45, 0, 0.55, 1] as const;

export const DURATION = {
  fast: 0.15,
  base: 0.22,
  slow: 0.38,
  /**
   * Entrance animations only, and deliberately longer than the 150-300ms
   * band the other tokens sit in.
   *
   * That band governs *interactive feedback*, where anything slower feels
   * laggy because the user is waiting on it. A scroll entrance is not
   * feedback and nobody is waiting on it, so it can run longer without
   * feeling sluggish. At 380ms with 16px of travel the effect was below
   * the threshold of notice, which made it dead weight.
   */
  reveal: 0.5,
} as const;

/** Default transition for UI state changes: hovers, toggles, presses. */
export const uiTransition: Transition = {
  duration: DURATION.base,
  ease: EASE_OUT_QUART,
};

/** Spring for layout shifts. Critically damped, no visible bounce. */
export const layoutSpring: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 40,
  mass: 1,
};

/**
 * Entrance for content revealed on scroll. Small distance, short duration.
 *
 * `visible` is a function so per-element delay arrives via the `custom` prop.
 * Do not pass a `transition` prop on the consuming motion element instead:
 * that prop REPLACES the variant's transition wholesale rather than merging,
 * which strips duration and easing and leaves the tween stranded partway.
 */
export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.reveal, ease: EASE_REVEAL, delay },
  }),
};

/** Stagger container for lists. 60ms is the sweet spot; 100ms+ feels slow. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};
