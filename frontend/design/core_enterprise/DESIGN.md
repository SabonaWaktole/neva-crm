---
name: Core Enterprise
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#464555'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006591'
  on-secondary: '#ffffff'
  secondary-container: '#39b8fd'
  on-secondary-container: '#004666'
  tertiary: '#7e3000'
  on-tertiary: '#ffffff'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#c9e6ff'
  secondary-fixed-dim: '#89ceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  sidebar-width: 240px
  sidebar-collapsed: 64px
  max-content-width: 1280px
---

## Brand & Style
The design system is engineered for high-density productivity and long-term user endurance. It targets the modern B2B professional, evoking a sense of calm, precision, and institutional reliability. 

The aesthetic is **Corporate Modern**, drawing inspiration from industry leaders like Linear and Notion. It prioritizes functional clarity over decorative flair, utilizing generous whitespace to reduce cognitive load in data-heavy environments. The interface feels lightweight and responsive, using subtle transitions and a disciplined adherence to a systematic grid to build trust through consistency.

## Colors
The palette is anchored by **Indigo-600** (#4F46E5), a color synonymous with professional stability and action. This is supported by a comprehensive range of **Slate Grays** that manage the visual hierarchy of the interface.

- **Primary:** Used for the main "Call to Action" buttons, active states, and focus indicators.
- **Surface & Backgrounds:** We use a "Layered White" approach. The main canvas is pure white (#FFFFFF), while sidebars, headers, and secondary containers use a soft Slate-50 (#F8FAFC) to create structural depth without heavy borders.
- **Status:** Standard semantic colors apply: Emerald for success, Amber for warnings, and Rose for errors or destructive actions.

## Typography
This design system utilizes **Inter** for its exceptional legibility and systematic "neutrality" in SaaS environments. 

Hierarchy is established primarily through weight and color rather than excessive scale. **Body-md (14px)** is the workhorse size for all CRM data tables and form inputs. We use negative letter-spacing on larger headlines to maintain a tight, modern aesthetic, while small labels use increased tracking and uppercase styling for distinct categorization.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a 12-column structure for main dashboard content. 

- **Sidebar:** A left-hand collapsible navigation is the primary anchor. It transitions between a 240px expanded state and a 64px icon-only state.
- **Gutters & Margins:** Use 24px (lg) margins for desktop views and 16px (md) for mobile. Gutters are fixed at 16px to maintain a compact data view.
- **Breakpoints:** 
  - Mobile: < 640px (Single column, hidden sidebar via hamburger).
  - Tablet: 640px - 1024px (Sidebar collapses to icon-only, 2-column grids).
  - Desktop: > 1024px (Expanded sidebar, full 12-column capability).

## Elevation & Depth
Depth is communicated through **Tonal Layering** and **Low-Contrast Outlines** rather than heavy shadows.

- **Level 0 (Flat):** Main background surface.
- **Level 1 (Bordered):** Cards and input fields use a 1px border (#E2E8F0).
- **Level 2 (Lifted):** Dropdowns, popovers, and tooltips use a very soft, diffused shadow: `0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)`.
- **Level 3 (Floating):** Toasts and modals use a more pronounced shadow to indicate significant z-axis distance from the work surface.

## Shapes
The design system uses a **Soft** shape language. A 0.25rem (4px) base radius provides a modern feel while maintaining the "geometric" professional integrity of a CRM.

- **Standard Elements:** Inputs, buttons, and small cards use 4px corners.
- **Large Elements:** Modals and large containers use 8px (rounded-lg).
- **Role Badges:** Use a fully rounded pill-shape to distinguish them from interactive buttons.

## Components
### Buttons
- **Primary:** Solid Indigo-600 background, white text. Subtle hover state of Indigo-700.
- **Secondary:** White background with a Slate-200 border. Slate-900 text.
- **Danger:** Solid Rose-600 background. Used sparingly for destructive actions.

### Navigation & Sidebar
- **Sidebar Navigation:** Use a vertical list with 14px text and 20px icons. Active states should be marked with a subtle Indigo background tint (Slate-100) and a 2px Indigo left-border.
- **Breadcrumbs:** Small, Slate-500 text to provide context in deep CRM hierarchies.

### Form Elements
- **Inputs & Dropdowns:** 36px height for standard density. Use a 1px border (#E2E8F0). On focus, the border changes to Indigo-500 with a 2px Indigo-100 outer glow.
- **Role Badges:** Small, high-contrast text on soft tinted backgrounds (e.g., "Admin" in Indigo-700 on Indigo-50 background).

### Feedback & States
- **Alerts/Toasts:** Positioned in the bottom-right or top-center. Use a white background with a colored left-accent bar corresponding to the message type.
- **Empty States:** Centered illustrations in grayscale with a clear "Primary CTA" to encourage the user's first action (e.g., "Add your first lead").