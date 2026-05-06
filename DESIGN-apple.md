# Design System inspired by Apple

Consumer electronics. Premium white space, SF Pro, cinematic imagery.

## Color Palette & Roles

A single Action Blue drives every interactive element, paired with a disciplined set of pure/parchment/near-black surfaces and a near-black ink for text.

### Primary
- **Action Blue**: `#0066cc` - Every interactive element — links, pill CTAs, focus signal root.
- **Focus Blue**: `#0071e3` - Keyboard focus ring outline on buttons.
- **Near-Black Ink**: `#1d1d1f` - Headlines, body, dark utility button fill.

### Secondary & Accent
- **Sky Link Blue**: `#2997ff` - In-copy links on dark surfaces.
- **Pearl Button**: `#fafafc` - Secondary "ghost" button fill on parchment canvas.
- **Soft Chip Gray**: `rgba(210,210,215,.64)` - Circular control chips over photography.

### Surface & Background
- **Pure White**: `#ffffff` - Dominant canvas, content cards, store tiles.
- **Parchment**: `#f5f5f7` - Signature off-white tile, footer canvas.
- **Near-Black Tile 1**: `#272729` - Primary dark-tile surface on homepage product grid.
- **Near-Black Tile 2**: `#2a2a2c` - Micro-lighter dark tile for stacked separation.
- **Near-Black Tile 3**: `#252527` - Micro-darker tile for video/player frames.
- **Pure Black**: `#000000` - Global nav, video player backgrounds.

### Neutrals & Text
- **Near-Black Ink**: `#1d1d1f` - Primary heading + body on light surfaces.
- **Paper White**: `#ffffff` - All text on dark tiles and global nav.
- **Muted Ink 80%**: `rgba(0,0,0,.8)` - Body text on Pearl Button fill.
- **Muted Ink 48%**: `rgba(0,0,0,.48)` - Disabled button text and legal fine-print.
- **Hairline Border**: `rgba(0,0,0,.08)` - Utility card borders, sub-nav separator.

---

## Typography Scale

SF Pro Display carries headlines with negative letter-spacing; SF Pro Text runs body at 17px for an editorial reading pace. Inter is the closest open-source substitute.

- **Hero Headline**: 56px · 600 · 1.07 · -0.28px
- **H1 / Tile**: 40px · 600 · 1.10
- **H2 / Section**: 34px · 600 · 1.47 · -0.374px
- **Lead / Subhead**: 28px · 400 · 1.14 · 0.196px
- **Large Lead (weight 300)**: 24px · 300 · 1.50
- **Sub-tile Tagline**: 21px · 400 · 1.19 · 0.231px
- **Body Strong**: 17px · 600 · 1.24 · -0.374px
- **Body**: 17px · 400 · 1.47 · -0.374px
- **Caption / Meta**: 14px · 400 · 1.43 · -0.224px
- **Fine Print**: 12px · 400 · 1.00 · -0.12px
- **Micro Legal**: 10px · 400 · 1.30 · -0.08px

---

## Component Stylings

### Buttons
- **Primary Blue Pill**: 980px radius, Action Blue fill.
- **Ghost Blue Pill**: 980px radius, Action Blue border.
- **Dark Utility**: 8px radius, Near-Black Ink fill.
- **Pearl Capsule**: 11px radius, Pearl Button fill.
- **Circular Chip**: 50% radius, Soft Chip Gray fill.
- **Active State**: All buttons carry a `scale(0.95)` transition on click.

### Cards
- **Utility Cards**: 18px radius, Hairline Border (`rgba(0,0,0,0.08)`).
- **Product Tiles**: Full-bleed (0 radius) or 18px radius depending on context.

### Navigation
- **Frosted Sub-Nav**: Parchment at 80% opacity with `backdrop-blur`.

---

## Spacing & Layout
- **Base Unit**: 8px.
- **Structural Snaps**: 8 / 12 / 17 / 20 / 40 / 64 / 80.
- **Content Lock**: 1440px.

---

## Responsive Behavior
- **Nav Collapse**: 833px.
- **Phone**: 640px.
- **Small Phone**: 419px.
