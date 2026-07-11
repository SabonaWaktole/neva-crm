---
name: Core Enterprise Dark
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#b9c8de'
  on-secondary: '#233143'
  secondary-container: '#39485a'
  on-secondary-container: '#a7b6cc'
  tertiary: '#ffb783'
  on-tertiary: '#4f2500'
  tertiary-container: '#d97721'
  on-tertiary-container: '#452000'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#d4e4fa'
  secondary-fixed-dim: '#b9c8de'
  on-secondary-fixed: '#0d1c2d'
  on-secondary-fixed-variant: '#39485a'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#ffb783'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#703700'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

This design system is built for high-scale enterprise environments where focus, density, and reduced eye strain are paramount. The brand personality is authoritative, systematic, and precise. By transitioning to a dark-centric model, the UI shifts from a traditional "paper" metaphor to a "terminal-refined" aesthetic, emphasizing data clarity and structural hierarchy.

The design style is **Corporate / Modern**, leaning into high-performance SaaS conventions. It utilizes a disciplined application of depth through tonal layering rather than excessive decoration, ensuring that the interface remains unobtrusive while handling complex information architectures.

## Colors

The palette is anchored in a deep slate foundation to provide a sophisticated backdrop for enterprise data. 

- **Primary:** The Indigo (#4f46e5) has been shifted to a slightly more vibrant Indigo-500 (#6366f1) to ensure AA/AAA accessibility compliance against dark backgrounds. It is used for primary actions and active states.
- **Surface Hierarchy:** Depth is created through a "stepped" slate scale. The base background is the darkest layer, with cards and navigation elements using progressively lighter shades to indicate elevation.
- **Typography:** High-contrast White/Slate-50 is reserved for headings to ensure scannability. Secondary text uses Slate-400 to reduce visual noise in dense layouts.
- **Accents:** Success, Warning, and Error states should use desaturated versions of their respective hues to prevent "neon vibration" against the dark UI.

## Typography

The design system utilizes **Inter** exclusively to maintain a functional, systematic appearance. 

- **Weight Scaling:** Use SemiBold (600) for section headers and Bold (700) for primary page titles to create strong anchors.
- **Readability:** For long-form data or documentation, `body-md` is the standard. Use `body-sm` for secondary metadata and sidebars.
- **Letter Spacing:** Headlines utilize tight tracking to maintain a compact, professional feel, while labels utilize slight tracking increases for legibility at small sizes.

## Layout & Spacing

This design system follows a **12-column Fluid Grid** model for the main content area, with fixed-width sidebars for navigation. 

- **Rhythm:** A strict 4px baseline grid ensures vertical consistency. All padding and margins must be multiples of 4px.
- **Breakpoints:**
  - **Mobile (< 768px):** 4-column layout, 16px margins, vertical stack for all cards.
  - **Tablet (768px - 1024px):** 8-column layout, 24px margins.
  - **Desktop (> 1024px):** 12-column layout, 40px margins, max-width container of 1440px.
- **Density:** In "Data-Heavy" views (tables/dashboards), use the `sm` (8px) spacing unit for row padding to maximize information density.

## Elevation & Depth

In this dark mode environment, depth is communicated through **Tonal Layers** and subtle **Inner Glows** rather than heavy drop shadows.

- **Level 0 (Base):** #0f172a - Used for the main application background.
- **Level 1 (Card/Sidebar):** #1e293b - Used for the primary content containers. These should have a subtle 1px border (#334155) to define edges.
- **Level 2 (Popovers/Modals):** #334155 - Used for elements that sit on top of the UI. These are the only elements that receive a drop shadow (Large, 15% opacity black).
- **Interactions:** Hover states on list items should use a subtle highlight of #1e293b or a low-opacity Indigo tint to indicate focus without breaking the dark aesthetic.

## Shapes

The design system employs a refined, moderate roundedness to soften the technical nature of the enterprise data. 

- **Standard Elements:** Buttons, input fields, and small components use `0.5rem` (rounded-md).
- **Large Containers:** Dashboard cards and modals use `1rem` (rounded-lg) to clearly distinguish them from the base layout.
- **Consistent Radii:** Do not use "Pill" shapes for buttons; maintain the `0.5rem` radius to ensure a professional, architectural feel across all interactive elements.

## Components

- **Buttons:** Primary buttons use the Indigo-500 background with White text. Secondary buttons use a Ghost style (transparent background, #334155 border) to maintain hierarchy.
- **Inputs:** Input fields use the `#1e293b` surface color with a 1px border. On focus, the border transitions to Indigo-500 with a subtle outer glow.
- **Cards:** Cards are the primary container. They should use #1e293b as the background with no shadow, relying on the 1px #334155 border for separation.
- **Data Tables:** Headers should have a subtle bottom border. Rows should use an alternate-shading "Zebra" stripe or a hover-state highlight to assist eye-tracking.
- **Chips/Badges:** Use low-contrast backgrounds (e.g., Indigo at 15% opacity) with high-contrast text for status indicators to ensure they don't dominate the visual field.
- **Navigation:** The sidebar should be slightly darker than the main content area or use a distinct border-right to define the application's structure.