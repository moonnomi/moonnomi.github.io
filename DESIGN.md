---
name: "Night Reading Room"
description: "A quiet editorial portfolio where careful technical learning is presented as a growing reading-room catalogue."
colors:
  room: "#0a090c"
  room-raised: "#131116"
  paper: "#f0edee"
  article-surface: "#142124"
  article-surface-raised: "#1b2d30"
  article-ink: "#edf3f1"
  article-copy: "#bdcbc8"
  article-muted: "#aabbb8"
  article-line: "#2b3d40"
  featured-surface-hover: "#18282b"
  ink: "#171419"
  ink-muted: "#625b61"
  text: "#f0edee"
  muted: "#aaa5a8"
  faint: "#807a7f"
  line: "#302d31"
  paper-line: "#c9c2c6"
  teal: "#38a3a5"
  emerald: "#57cc99"
  orange: "#ff6b35"
  reading-teal: "#256f71"
  reading-teal-hover: "#1f6668"
  evidence-mint: "#dce9e6"
  placeholder-ink: "#817b80"
typography:
  display:
    fontFamily: '"Archivo Variable", "Arial Narrow", sans-serif'
    fontSize: "clamp(3rem, 6vw, 4.8rem)"
    fontWeight: 670
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  headline:
    fontFamily: '"Archivo Variable", "Arial Narrow", sans-serif'
    fontSize: "clamp(2rem, 4vw, 3.2rem)"
    fontWeight: 650
    lineHeight: 1
    letterSpacing: "-0.03em"
  title:
    fontFamily: '"Archivo Variable", "Arial Narrow", sans-serif'
    fontSize: "clamp(1.25rem, 2.5vw, 1.65rem)"
    fontWeight: 630
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  body:
    fontFamily: '"Public Sans Variable", "Segoe UI", sans-serif'
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
  reading:
    fontFamily: '"Public Sans Variable", "Segoe UI", sans-serif'
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.82
  label:
    fontFamily: '"Public Sans Variable", "Segoe UI", sans-serif'
    fontSize: "11px"
    fontWeight: 570
    lineHeight: 1.4
  code:
    fontFamily: '"Cascadia Code", "SFMono-Regular", Consolas, monospace'
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.75
rounded:
  square: "0px"
  inline: "4px"
  panel: "12px"
  sheet: "14px"
spacing:
  xxs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
  xxxl: "72px"
components:
  navigation-link:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "7px 0"
  navigation-link-hover:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "7px 0"
  navigation-search-action:
    backgroundColor: "transparent"
    textColor: "{colors.emerald}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "7px 0"
  vortex-mark:
    backgroundColor: "transparent"
    textColor: "{colors.teal}"
    rounded: "{rounded.square}"
    size: "28px"
  vortex-mark-arrival:
    backgroundColor: "transparent"
    textColor: "{colors.teal}"
    rounded: "{rounded.square}"
    size: "116px"
  featured-reading-sheet:
    backgroundColor: "{colors.article-surface}"
    textColor: "{colors.article-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sheet}"
    padding: "clamp(34px, 5vw, 58px)"
    width: "100%"
  featured-reading-sheet-hover:
    backgroundColor: "{colors.featured-surface-hover}"
    textColor: "{colors.article-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sheet}"
    padding: "clamp(34px, 5vw, 58px)"
    width: "100%"
  catalog-entry:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.square}"
    padding: "30px 20px 32px"
    width: "100%"
  catalog-entry-hover:
    backgroundColor: "{colors.room-raised}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.square}"
    padding: "30px 20px 32px"
    width: "100%"
  search-field:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    typography: "{typography.headline}"
    rounded: "{rounded.square}"
    padding: "10px 0 16px"
    width: "100%"
  search-result:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.square}"
    padding: "17px 18px"
    width: "100%"
  search-result-selected:
    backgroundColor: "{colors.article-surface-raised}"
    textColor: "{colors.article-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.square}"
    padding: "17px 18px"
    width: "100%"
  topic-tag-room:
    backgroundColor: "transparent"
    textColor: "{colors.faint}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
  topic-tag-paper:
    backgroundColor: "transparent"
    textColor: "{colors.reading-teal}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
  copy-action:
    backgroundColor: "transparent"
    textColor: "{colors.emerald}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "4px 0"
  copy-action-error:
    backgroundColor: "transparent"
    textColor: "{colors.orange}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "4px 0"
  evidence-panel:
    backgroundColor: "{colors.evidence-mint}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.panel}"
    padding: "15px 20px"
    width: "100%"
  article-reading-sheet:
    backgroundColor: "{colors.article-surface}"
    textColor: "{colors.article-ink}"
    typography: "{typography.reading}"
    rounded: "{rounded.sheet}"
    width: "100%"
---

# Design System: Night Reading Room

## Overview

**Creative North Star: "Night Reading Room"**

Night Reading Room treats the portfolio as a compact onyx interior where low-glare charcoal-teal sheets hold long-form work and platinum is reserved for occasional inserts. The voice is quiet, honest, editorial, and beginner-but-promising: credibility comes from clear explanation, visible progress, and care rather than from claims of mastery.

The interface keeps room surfaces dark and nearly flat, then introduces physical contrast only where a reading sheet should feel tangible. A hand-drawn teal vortex identifies nomi: it redraws through closely related imperfect paths on the homepage and holds on one static frame elsewhere. Archivo supplies concise editorial authority, Public Sans keeps explanation direct, and Cascadia Code appears only where technical notation benefits. Teal guides the eye, emerald marks constructive emphasis, and orange remains an accessibility and error signal.

Density is generous without becoming ceremonial. Fine rules, short labels, restrained motion, and the occasional paper lift make the system feel refined and restrained. Avoid terminal-blog styling, tactical dashboards, status telemetry, literal library decoration, and exaggerated expertise.

**Key Characteristics:**

- Onyx room framing low-glare charcoal-teal reading sheets
- Hand-drawn teal vortex with one bounded arrival animation
- Wide editorial headings paired with plain, readable prose
- Flat tonal hierarchy with selective physical paper lift
- Fine one-pixel rules and square interaction controls
- Sparse mineral accents with fixed semantic jobs
- Restrained row-pull and sheet-lift motion

## Colors

The palette moves between near-black room tones and low-glare charcoal-teal reading surfaces, with teal, emerald, and orange used as sparse mineral signals.

### Primary

- **Edge Teal** (`teal`, #38a3a5): Draws the vortex identity and marks links, the featured sheet edge, scrollbars, and other navigational traces.
- **Reading Teal** (`reading-teal`, #256f71): Carries paper-side links, tags, and small directional labels where the brighter room teal would be too loud.
- **Reading Teal Hover** (`reading-teal-hover`, #1f6668): Darkens paper-side links on hover while preserving their editorial restraint.

### Secondary

- **Emerald Marker** (`emerald`, #57cc99): Identifies constructive actions and positive emphasis, including the search action, copy control, and selection highlight.

### Tertiary

- **Orange Focus** (`orange`, #ff6b35): Reserved for keyboard focus, text carets, and explicit error states.

### Neutral

- **Room Onyx** (`room`, #0a090c): The continuous site background and dark chrome.
- **Raised Room** (`room-raised`, #131116): The shallow tonal layer for selected rows, code blocks, and the search sheet.
- **Platinum Paper** (`paper`, #f0edee): The selected search result and print fallback.
- **Article Surface** (`article-surface`, #142124): The low-glare charcoal-teal field for long-form write-ups.
- **Raised Article Surface** (`article-surface-raised`, #1b2d30): Evidence lists and contained facts inside article pages.
- **Article Ink** (`article-ink`, #edf3f1): Headlines and primary labels on the dark article surface.
- **Article Copy** (`article-copy`, #bdcbc8): Long-form prose tuned for sustained reading on the dark article surface.
- **Article Muted** (`article-muted`, #aabbb8): Summaries, metadata, and contents links in articles.
- **Article Line** (`article-line`, #2b3d40): Dividers and table-of-contents rails on article pages.
- **Featured Surface Hover** (`featured-surface-hover`, #18282b): The restrained lift state for the homepage feature.
- **Reading Ink** (`ink`, #171419): Primary text on platinum and mint paper.
- **Muted Reading Ink** (`ink-muted`, #625b61): Summaries, metadata, and supporting prose on paper.
- **Platinum Text** (`text`, #f0edee): Primary text in the dark room.
- **Muted Room Text** (`muted`, #aaa5a8): Secondary navigation, descriptions, and subdued controls in the room.
- **Faint Room Text** (`faint`, #807a7f): Placeholder identity, tertiary metadata, and low-priority notes.
- **Room Line** (`line`, #302d31): One-pixel separators on dark surfaces.
- **Paper Line** (`paper-line`, #c9c2c6): One-pixel separators and table-of-contents rails on paper.
- **Evidence Mint** (`evidence-mint`, #dce9e6): The print fallback for article evidence lists.
- **Placeholder Ink** (`placeholder-ink`, #817b80): Search placeholder copy in the raised room.

### Named Rules

**The Mineral Accent Rule.** Teal guides, emerald confirms, and orange focuses or warns; never distribute all three as interchangeable decoration.

**The Low-Glare Reading Rule.** Long-form write-ups stay on a charcoal-teal surface close to the room, while light neutrals are reserved for shorter information inserts.

## Typography

**Display Font:** Archivo Variable (with Arial Narrow and sans-serif fallbacks)
**Body Font:** Public Sans Variable (with Segoe UI and sans-serif fallbacks)
**Code/Metadata Mono Font:** Cascadia Code (with SFMono-Regular, Consolas, and monospace fallbacks)

**Character:** Archivo is broad, compact, and editorial without implying institutional authority. Public Sans is neutral and candid; Cascadia Code is a functional technical accent reserved for dates, code, and tabular metadata.

### Hierarchy

- **Display** (670, `clamp(3rem, 6vw, 4.8rem)`, 0.98): Homepage identity and major page titles; archive titles may expand to 6rem and article titles to 5.2rem while keeping the same tight rhythm.
- **Headline** (650, `clamp(2rem, 4vw, 3.2rem)`, 1): Section openings and search headings.
- **Title** (630, `clamp(1.25rem, 2.5vw, 1.65rem)`, 1.25): Catalogue entries and compact component titles.
- **Body** (400, 16px, 1.65): Interface descriptions and ordinary prose.
- **Reading** (400, 17px, 1.82): Article paragraphs and lists, held to a 70ch maximum.
- **Label** (570, 11px, 1.4): Navigation, dates, tags, metadata, and small action copy; use tabular numerals for dates and reading-time metadata.
- **Code** (400, 13px, 1.75): Code bodies; code headers reduce to 10px while keeping the mono family.

### Named Rules

**The Short Display Rule.** Keep Archivo display lines compact and deliberately short; explanation belongs in Public Sans below, not in six-line headings.

## Layout

The primary shell is capped at 1120px with 24px desktop side insets, tightening to 16px at 720px and 14px at 520px. A sticky 72px header frames the room and becomes 64px on compact screens. Major sections use 76-140px vertical breathing room, while component spacing follows a compact 4, 8, 12, 16, 24, 32, 48, and 72px rhythm.

The homepage opens as a 0.8/1.2 two-column room with a 440px minimum reading-sheet column and a fluid 48–96px gap. A small centered chevron cues the Latest posts section at the fold. The posts archive uses one unaccompanied title before returning to full-width catalogue rows. Article interiors use a wider 1240px sheet, bias an up-to-820px content column toward the left, and separate it from a 190–230px “On this page” rail on the far right.

At 900px, catalogue metadata and tags reflow and the article rail narrows. At 720px, primary grids collapse, navigation becomes a stacked menu, the table of contents becomes a native disclosure, and article paper runs edge to edge without radius or shadow. At 520px, catalogue rows and adjacent-post links become single-column and major padding contracts without reducing reading type.

**The Wide Room, Narrow Page Rule.** Let the room feel spacious, but constrain explanation to readable measures and collapse structure before type becomes cramped.

## Elevation & Depth

The system is flat and tonal by default. One-pixel dividers and shifts between Room Onyx and Raised Room establish most hierarchy; shadow is reserved for reading sheets and the temporary search layer. Featured and about sheets use a restrained 0 22px 58px shadow, the article uses 0 24px 66px, and the search sheet uses 0 24px 64px. The featured sheet alone deepens slightly as it lifts 3px on hover or keyboard focus.

### Shadow Vocabulary

- **Sheet Rest** (`0 22px 58px rgba(0, 0, 0, 0.24)`): Default featured and about reading sheets.
- **Sheet Lift** (`0 28px 64px rgba(0, 0, 0, 0.32)`): Featured sheet hover and focus response.
- **Article Sheet** (`0 24px 66px rgba(0, 0, 0, 0.24)`): Long-form article container.
- **Search Layer** (`0 24px 64px rgba(0, 0, 0, 0.42)`): Modal search sheet above its onyx scrim.

### Named Rules

**The Flat Room Rule.** Do not shadow ordinary navigation, catalogue rows, controls, or tonal inserts; elevation belongs only to paper and temporary overlay layers.

## Shapes

The form language is mostly square and ruled. Navigation, inputs, buttons, tags, catalogue rows, and the mobile menu avoid pill geometry. The identity is one open, asymmetric vortex line rather than a container or badge. Physical reading surfaces use gently curved 14px corners, while smaller evidence and code panels use 12px corners. Hairline borders and narrow vertical teal rules create structure without ornamental frames.

**The Sheet Geometry Rule.** Reserve rounded corners for surfaces that read as sheets or contained technical inserts; interactive chrome remains square.

## Components

Components are refined and restrained: state changes are precise, readable, and rarely ornamental.

### Buttons

- **Shape:** Square and unboxed (0px radius); there is no generic filled primary button in the current system.
- **Primary actions:** Search and Copy are text actions using Emerald Marker on room surfaces with minimal vertical padding.
- **Hover / Focus:** Hover moves action text to Platinum Text; keyboard focus uses a 2px Orange Focus outline with a 4px offset. Copy errors switch to Orange Focus.
- **Menu toggle:** Appears only below 720px, uses strong compact text, and exposes the navigation as a full-width stacked list.

### Chips

- **Style:** Tags are unboxed, hash-prefixed text with 10–11px label sizing and no fill or radius.
- **Context:** Use Faint Room Text in catalogue rows, Article Muted in the featured sheet, and Edge Teal in articles.

### Cards / Containers

- **Featured reading sheet:** Low-glare Article Surface with Article Ink, gently curved 14px corners, fluid 34–58px padding, a one-pixel teal edge, and a 3px lift on hover or focus. The entire sheet is the link, so it carries no redundant action label.
- **Catalogue entry:** A full-width ruled row with a three-column desktop grid, 30px 20px 32px padding, and no radius or rest shadow. Hover or focus shifts it 10px into Raised Room and reveals a vertical teal rule; narrow screens reduce the shift to 4px.
- **Article sheet:** Low-glare Article Surface with 14px corners on larger screens; it becomes edge-to-edge, square, and shadowless below 720px.
- **About sheet:** Low-glare Article Surface with a Raised Article Surface contact insert and 14px corners on larger screens.
- **Technical inserts:** Evidence and code containers use 12px corners; evidence uses Raised Article Surface on screen and a mint print fallback, while code returns to Raised Room.

### Inputs / Fields

- **Style:** The search field is transparent and square, with a one-pixel teal bottom rule, Archivo headline text, and 10px 0 16px padding.
- **Focus:** The teal rule remains the structural focus cue and the caret becomes Orange Focus; the surrounding modal traps keyboard focus.
- **Placeholder:** Placeholder copy uses Placeholder Ink so it remains subordinate to entered Platinum Text.

### Navigation

- **Desktop:** A sticky onyx header uses 13px Public Sans links, 28px gaps, muted default text, Platinum Text on hover, and an Emerald Marker search action.
- **Brand:** The home link is a static 28px teal vortex with an accessible name and no repeated wordmark.
- **Continuation cue:** A small CSS-drawn chevron briefly nudges downward toward Latest posts, remains a 44px link target, and becomes still when reduced motion is requested.
- **Mobile:** Below 720px, links stack beneath the 64px header with 12px vertical hit areas and a one-pixel bottom boundary.
- **Search:** A full-width Raised Room sheet descends beneath the header over a translucent onyx dismissal layer. Results move into Raised Article Surface with Article Ink when keyboard-selected or hovered, preserving the room's low-glare character.

### Vortex Identity Mark

The homepage uses a 116px teal SVG mark whose seven closely related hand-drawn paths replace one another every 160ms. A short dash-offset settle makes each replacement feel freshly inked without rotating, glowing, or changing the surrounding layout. The animation runs only while the mark is visible and the page is active; reduced-motion visitors receive one deliberate static frame. Header, about, and footer placements are always static.

**The Vortex Identity Rule.** Redrawing belongs only to the homepage arrival mark. Every identity placement uses the exact Edge Teal token at full opacity; compact marks share one static path, round caps, and no decorative container.

### Route Arrival

Non-home routes use one restrained 560ms reveal built from the homepage's existing motion language: content begins visibly present, then resolves from a shallow crop, soft blur, and reduced saturation. It runs once per navigation, leaves the sticky reading layout untouched after settling, and disappears entirely when reduced motion is requested.

### Article Reading Sheet

The article sheet combines a left-biased editorial header, generous 17px/1.82 low-glare reading copy, teal monospace tokens for inline variable and function names, raised charcoal-teal evidence lists, dark code blocks, a sticky desktop “On this page” rail with a teal current-section marker, a native compact disclosure below 900px, and simple ruled adjacent-post navigation. The sheet uses `overflow: clip` so its rounded boundary does not disable viewport-relative sticky positioning.

### Named Rules

**The Restrained Response Rule.** State changes may lift a reading sheet, pull a catalogue row, redraw the homepage identity, or shift text color; do not combine those responses on ordinary controls.

## Do's and Don'ts

### Do:

- **Do** keep dark room chrome flat and separate regions with one-pixel Room Line rules.
- **Do** keep long-form reading surfaces charcoal-teal and use Platinum Paper only for shorter inserts; retain 14px corners only while those surfaces remain inset.
- **Do** reserve the 2px Orange Focus outline with a 4px offset for visible keyboard focus.
- **Do** hold long-form article copy to 17px, 1.82 line-height, and a 70ch maximum.
- **Do** preserve the 900px, 720px, and 520px responsive transformations when extending the surface.
- **Do** reduce transitions to effectively zero when the visitor prefers reduced motion.
- **Do** keep the animated vortex visible by default, pause it offscreen or in background tabs, and hold one static frame for reduced motion.

### Don't:

- **Don't** introduce terminal-blog chrome, tactical dashboards, status telemetry, or exaggerated expertise cues.
- **Don't** turn the reading-room metaphor into literal shelves, lamps, paper textures, or vintage decoration.
- **Don't** add rounded pills, floating glass panels, gradients, or generic card stacks.
- **Don't** spread teal, emerald, and orange evenly across a screen; each accent has a fixed job.
- **Don't** shadow ordinary rows, controls, or mint inserts.
- **Don't** let responsive compression narrow the reading measure by shrinking body text.
- **Don't** rotate, glow, continuously distort, or independently redraw compact vortex marks.
