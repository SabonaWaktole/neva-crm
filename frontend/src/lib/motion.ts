import type { Transition, Variants } from 'framer-motion';

/**
 * Shared framer-motion presets, tuned to the existing --transition-* timing
 * tokens in tokens.css, so JS-driven and CSS-driven motion feel consistent.
 */

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 32,
};

export const easeTransition: Transition = {
  duration: 0.25,
  ease: [0.4, 0, 0.2, 1],
};

/** Modal / dialog content: scale + fade in from a centered origin. */
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: easeTransition },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

/** Backdrop overlay behind modals/slide-overs. */
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/** Drawer/sidebar/slide-over panel sliding in from the right. */
export const drawerVariants: Variants = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: springTransition },
  exit: { x: '100%', transition: easeTransition },
};

/** Mobile bottom sheet sliding up from the bottom edge. */
export const bottomSheetVariants: Variants = {
  hidden: { y: '100%' },
  visible: { y: 0, transition: springTransition },
  exit: { y: '100%', transition: easeTransition },
};

/** Page-level enter/exit transition for route content. */
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: easeTransition },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

/** Parent container for staggered list/grid item entrances. */
export const listContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};

/** Individual item used together with listContainerVariants. */
export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: easeTransition },
};

/* ============================================================================
 * Marketing / landing motion
 * ----------------------------------------------------------------------------
 * A slower, more deliberate register than the in-app presets above: longer
 * durations and a deeper ease-out, which is what makes marketing motion read
 * as "considered" rather than "snappy".
 *
 * Everything here animates ONLY transform and opacity so the compositor can
 * run it off the main thread. Nothing animates layout, colour or filters.
 * ========================================================================= */

/** Matches --ease-out in tokens.css, so JS and CSS motion agree. */
export const marketingEase = [0.22, 1, 0.36, 1] as const;

export const marketingTransition: Transition = {
  duration: 0.7,
  ease: marketingEase,
};

/**
 * Hero container. Children opt in via `heroItemVariants`; the delay lets the
 * first paint settle before anything moves.
 */
export const heroContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

export const heroItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: marketingTransition },
};

/**
 * Per-word headline reveal. Words rise and fade in sequence — the signature
 * Linear/Framer headline treatment. Kept fast per word so the whole line
 * resolves in well under a second and never delays reading.
 */
export const headlineContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.045, delayChildren: 0.15 },
  },
};

export const headlineWordVariants: Variants = {
  hidden: { opacity: 0, y: '0.45em' },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: marketingEase },
  },
};

/** Section that animates the first time it scrolls into view. */
export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: marketingTransition },
};

/** Grid wrapper for cards that reveal in sequence on scroll. */
export const revealContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

/**
 * Shared viewport config: animate once, and trigger slightly before the
 * element is fully on screen so motion completes as the user arrives.
 */
export const revealViewport = { once: true, amount: 0.25, margin: '0px 0px -80px 0px' } as const;

/**
 * Reduced-motion fallbacks. Positional variants collapse to a plain
 * cross-fade — the information still arrives, nothing travels.
 */
export const staticVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

export const noopVariants: Variants = {
  hidden: {},
  visible: {},
};
