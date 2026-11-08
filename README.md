<!-- markdownlint-disable MD024 -->
# ΔC : DeltaChroma

## Overview

DeltaChroma generates accessible, perceptually distinct color palettes
for digital products. It bridges the gap between brand identity and
WCAG accessibility standards by utilizing modern, perceptually uniform
color spaces (OKLCH/Oklab).

## Core Goals

1. **Perceptual Uniformity:** Generate colors using OKLCH to ensure even visual spacing and predictable chroma/lightness behavior.
2. **Accessible by Default:** Guarantee every generated scale meets or exceeds WCAG 2.1 UI element standards (minimum **3:1** contrast ratio against active backgrounds).
3. **Semantic Cohesion:** Provide paired Light and Dark mode palettes where each slot maintains a clear hue and visual relationship across themes.

### Functional Requirements

* **Variable Palette Length:** Support generated palettes ranging from **3 to 12 colors**.
* **Visual Distinctness:** Maximize perceptual distance ($\Delta E_{OK}$) across all generated swatches for maximum visual differentiation.
* **Paired Theme Generation:**
  * Each palette index (e.g., Slot 1 = Warm/Red, Slot 2 = Cool/Blue) maintains its hue relationship across Light and Dark variants.
  * Adjust lightness/chroma automatically so both themes pass accessibility contrast thresholds against their respective surface backgrounds.
* **Brand Steering & Seed Inputs:** Allow users to input starting seed colors to guide palette generation toward established brand guidelines.
* **Locked Brand Slots & Inaccessibility Alerts:**
  * Allow users to "lock" specific brand colors into fixed slots.
  * If a locked color violates the minimum 3:1 contrast ratio, display prominent, uncompromising visual warnings explaining the accessibility failure while offering auto-remediation suggestions.
* **Export Tooling:** One-click copy/export options for CSS Custom Properties (`:root` blocks), Tailwind config objects, and JSON.

## Phased Implementation Plan

### Stage 1: Core Project Infrastructure & Layout Setup

Establish a repo with sensible linting, automated deployment, pages outside of the tool for information, etc.

* [x] Configure base Astro project structure ready for Github pages
* [x] Aply basic accessible styling
* [x] Add a development blog
* [x] Set up CI/CD pipeline using GitHub Actions

### Stage 2: Core Color-Math Engine (`src/utils/colorMath.ts`)

Build a zero-dependency, type-safe color calculation module supporting OKLCH, Oklab, sRGB matrix transformations, WCAG contrast calculations, and semantic pairing.

#### Step 2.1: Implement OKLCH / Oklab Conversions & Types

* **Rationale:** OKLCH avoids sudden shifts in perceived brightness during scale generation.
* **Tasks:**
  * Implement standard matrix transformations between $\text{sRGB} \leftrightarrow \text{linear RGB} \leftrightarrow \text{Oklab} \leftrightarrow \text{OKLCH}$.
  * Define strict TypeScript interfaces: `RGB`, `OKLCH`, `HEX`, `PaletteSlot`, `ThemePair`.
  * Implement gamut clipping logic to safely constrain out-of-bounds OKLCH colors back into sRGB space.

#### Step 2.2: Perceptual Distance ($\Delta E_{OK}$) & Distinctness Optimization

* **Rationale:** Calculating color differences using Euclidean distance in Oklab ($\Delta E_{OK}$) guarantees smooth, evenly spaced visual steps.
* **Tasks:**
  * Implement $\Delta E_{OK} = \sqrt{(\Delta L)^2 + (\Delta a)^2 + (\Delta b)^2}$.
  * Build an iterative hue-spacing algorithm to maximize $\Delta E_{OK}$ across 3–12 palette slots.

#### Step 2.3: Semantic Light/Dark Pairing & WCAG Evaluator

* **Rationale:** Ensure color identity remains consistent across Light/Dark modes while guaranteeing a minimum 3:1 contrast ratio against backgrounds.
* **Tasks:**
  * Implement WCAG 2.1 relative luminance calculation ($L = 0.2126 R + 0.7152 G + 0.0722 B$).
  * Build theme pairing transformation functions to shift lightness/chroma per slot while preserving hue angle.
  * Output strict pass/fail status and exact contrast ratios ($N:1$).

#### Step 2.4: Seed Steering & Locked Brand Slot Resolution

* **Rationale:** Designers must be able to anchor key brand colors while filling out remaining slots algorithmically.
* **Tasks:**
  * Implement constrained generation logic that respects user-locked slots and interpolates surrounding slots.
  * Add contrast threshold check for locked slots with explicit warning flags when compliance fails.

#### Stage 2 Checklist

* [ ] Implement matrix conversions (sRGB $\leftrightarrow$ linear RGB $\leftrightarrow$ Oklab $\leftrightarrow$ OKLCH) in `src/utils/colorMath.ts`.
* [ ] Add unit tests verifying conversion accuracy and gamut clamping.
* [ ] Implement $\Delta E_{OK}$ calculation function.
* [ ] Build WCAG 3:1 relative luminance checker.
* [ ] Build semantic Light/Dark theme pairing transformer.
* [ ] Build seed-steering and locked-slot interpolation algorithm.

### Stage 3: Interactive Palette Generator Component

**Goal:** Build a lightweight, responsive interactive UI for adjusting palette parameters, locking brand colors, and inspecting contrast compliance in real time.

#### Step 3.1: Interactive Control Panel & Reactive Swatches

* **Rationale:** Immediate feedback helps users quickly explore palette options and fix accessibility issues.
* **Tasks:**
  * Build controls for palette size (3 to 12 count slider/stepper).
  * Build inputs for seed color entry and individual slot "Lock" toggle buttons.
  * Create swatch card UI displaying HEX, OKLCH strings, WCAG contrast ratios, and theme-toggle preview.

#### Step 3.2: Inaccessibility Alerts & Remediation Suggestions

* **Rationale:** Ensure users are clearly warned when a locked brand color fails accessibility standards.
* **Tasks:**
  * Add visual warning badges to swatches falling below 3:1 contrast.
  * Offer a one-click "Auto-adjust Lightness" button to remediate failing colors.

#### Step 3.3: One-Click Export Suite

* **Rationale:** Streamline integration into production codebases.
* **Tasks:**
  * Generate export payloads for CSS Custom Properties (`:root` light/dark blocks), Tailwind CSS config, and JSON.
  * Add copy-to-clipboard functionality with toast notifications.

#### Stage 3 Checklist

* [ ] Build `Generator.astro` component and integration hooks.
* [ ] Connect sliders and slot locking controls to `colorMath.ts`.
* [ ] Implement Light/Dark preview toggle within the generator.
* [ ] Implement accessibility warning badges and auto-remediation triggers.
* [ ] Build export modal for CSS, Tailwind, and JSON.

### Stage 4: Documentation & Content Strategy

**Goal:** Expand the blog with technical guides on OKLCH, WCAG contrast standards, and palette architecture.

#### Step 4.1: Technical Deep-Dives

* **Rationale:** Educate users on the math behind the generator and improve SEO.
* **Tasks:**
  * Write post: *"Why OKLCH is Superior to HSL for Color Systems"*.
  * Write post: *"Designing Accessible Light/Dark Theme Pairs with 3:1 Contrast"*.

#### Step 4.2: Integration Guides

* **Tasks:**
  * Publish guide on consuming DeltaChroma CSS variables in Astro, Tailwind, and React projects.

#### Stage 4 Checklist

* [ ] Publish post on OKLCH vs HSL color spaces.
* [ ] Publish guide on WCAG contrast compliance and semantic slots.
* [ ] Add export and usage documentation to the home page.

### Stage 5: Polish, Accessibility Audit & Release (`v1.0.0`)

**Goal:** Ensure 100/100 Lighthouse metrics, complete keyboard accessibility, and tag the production release.

#### Step 5.1: Accessibility (a11y) & Keyboard Audit

* **Tasks:**
  * Ensure full keyboard navigation support across all generator controls, inputs, and swatch cards.
  * Validate ARIA live regions for screen readers during dynamic palette generation.

#### Step 5.2: Production Build & Release Verification

* **Tasks:**
  * Verify zero unnecessary JS is shipped outside of the generator UI script.
  * Run Lighthouse audits for Performance, Accessibility, and SEO.
  * Tag and release `v1.0.0` on GitHub.

#### Stage 5 Checklist

* [ ] Conduct complete keyboard navigation and screen reader pass.
* [ ] Verify Lighthouse score (100 in Accessibility and Performance).
* [ ] Tag and deploy `v1.0.0` release.
