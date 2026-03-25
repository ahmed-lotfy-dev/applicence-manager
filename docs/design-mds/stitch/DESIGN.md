# Design System Strategy: The Financial Command Center

## 1. Overview & Creative North Star: "The Digital Curator"
This design system is built for the modern freelancer—the solo operator who requires the precision of a high-frequency trading floor with the aesthetic calm of a premium gallery. Our Creative North Star is **"The Digital Curator."** 

To move beyond the "SaaS template" look, we reject the rigid, boxed-in layouts of traditional fintech. Instead, we utilize **Intentional Asymmetry** and **Tonal Depth**. By overlapping glassy surfaces and using a hyper-exaggerated typographic scale, we transform a simple dashboard into a bespoke command center. We don't just display data; we curate an atmosphere of financial authority.

---

## 2. Colors & Surface Architecture
The palette is rooted in deep obsidian tones, punctuated by high-energy indigo and violet accents.

### The "No-Line" Rule
Standard 1px borders are prohibited for sectioning. Structural boundaries must be defined exclusively through **Background Color Shifts**. For example, a global navigation bar should not have a bottom border; it should transition from `surface` to `surface-container-low`.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-transparent materials.
- **Base Layer:** `surface` (#131314)
- **Secondary Sections:** `surface-container-low` (#1C1B1C)
- **Interactive Cards:** `surface-container` (#201F20)
- **Floating Modals/Popovers:** `surface-container-highest` (#353436)

### The "Glass & Gradient" Rule
To achieve the "Equinox" atmosphere, main CTAs and hero elements must use **Signature Textures**. 
- **Glassmorphism:** Use `surface-variant` at 60% opacity with a `20px` backdrop-blur for floating headers or sidebars.
- **The Core Gradient:** Transition from `primary` (#C0C1FF) to `primary-container` (#8083FF) at a 135° angle to give interactive elements a "soul" that flat hex codes cannot replicate.

---

## 3. Typography: The Editorial Voice
We use **Inter** exclusively, but we treat it with the spatial awareness of a luxury magazine.

*   **Display (The Hook):** `display-lg` (3.5rem) is reserved for high-level balances or total earnings. It should feel monumental.
*   **Headline (The Statement):** `headline-md` (1.75rem) defines clear sections without the need for dividers.
*   **Labels (The Metadata):** `label-sm` (0.6875rem) should always be in `on-surface-variant` with a tracking (letter-spacing) of `0.05em` to ensure readability at small scales.

**Hierarchy Tip:** Never put two different font sizes of the same weight next to each other. If you use `title-lg`, pair it with `body-md` in a lighter weight or a muted color (`on-surface-variant`) to create an immediate visual anchor.

---

## 4. Elevation & Depth
Depth is the difference between a "website" and a "platform."

### The Layering Principle
Achieve lift by stacking surface tiers. A card (using `surface-container-low`) placed on a page background (`surface`) creates a soft, natural elevation. 

### Ambient Shadows
When an element must "float" (like a dropdown or a modal), use a shadow that mimics natural light:
- **Color:** A tinted version of `on-surface` (at 4-8% opacity).
- **Spread:** Large blur values (32px to 64px) to avoid hard edges.

### The "Ghost Border" Fallback
If accessibility requires a container boundary, use a **Ghost Border**: `outline-variant` (#464554) at **15% opacity**. This provides a "suggestion" of a line without cutting the layout into pieces.

---

## 5. Components & Primitive Logic

### Buttons (The Interaction Points)
*   **Primary:** A gradient fill from `primary` to `primary-container`. Corner radius: `full` (9999px) to contrast with card shapes.
*   **Secondary:** `surface-container-highest` fill with no border. Use for "Add Income" or "View Details."
*   **Tertiary:** Ghost style. No fill, `on-surface` text. Use for "Cancel" or "Go Back."

### Cards (The Data Containers)
*   **Style:** No borders. Use `surface-container` fill.
*   **Roundness:** Apply the `xl` (3rem) or `md` (1.5rem) scale based on the parent-child relationship. Inner cards should be `sm` (0.5rem).
*   **Spacing:** Use `spacing-8` (2rem) for internal padding to give financial data room to breathe.

### Input Fields
*   **Default State:** `surface-container-lowest` background. 
*   **Focus State:** A 2px "Ghost Border" using `primary`. 
*   **Error State:** Text changes to `error`, but the background remains dark to maintain the "Command Center" aesthetic.

### Additional Signature Components
*   **The "Pulse" Indicator:** A small, glowing `primary` dot used next to "Live Market Data" or "Current Balance" to signify real-time updates.
*   **The Glass Header:** A sticky navigation bar using `surface` at 70% opacity with `blur(12px)`.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use vertical white space (`spacing-12` or `16`) instead of divider lines.
*   **Do** use `tertiary` (#FFB783) for "warning" or "pending" states to create a sophisticated alternative to standard orange.
*   **Do** use `primary-fixed-dim` for inactive icons to keep the visual weight low.

### Don’t
*   **Don't** use pure white (#FFFFFF) for body text. Use `on-surface` (#E5E2E3) to reduce eye strain in dark mode.
*   **Don't** use the `none` or `px` spacing for layout. Financial data requires extreme "breathing room" to feel manageable.
*   **Don't** use 100% opaque borders. They create "visual noise" that breaks the premium, glassy immersion.