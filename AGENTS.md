# Agent Guidelines & Invariants

> [!NOTE]
> For a comprehensive system architectural overview, glyph pipeline diagrams, state schemas, and subsystem documentation, see **[ARCHITECTURE.md](file:///root/projects/handwriting/ARCHITECTURE.md)**.

## ES Module Architecture & Subsystems
- **Zero-Build Native ES Modules**: The core frontend runs native browser ES modules (`type="module"` in `index.html`) served directly by Nginx without bundlers.
- **Module Separation (`static/js/modules/`)**:
  - `config.js`: Central configuration (`APP_CONFIG`).
  - `utils.js`: Vietnamese linguistic functions, tone detection, accent stripping.
  - `model.js`: Glyph data loader, compound consonant grouping, ligature lookup.
  - `board-renderer.js`: Board layout synchronization and DOM line rendering.
  - `dotting-manager.js`: Auto-spacing, guide dot overlay, and outline tracing.
  - `drag-stretch-handler.js`: Word drag positioning, horizontal stretch, bold override.
  - `freestyle-dotting-modal.js`: Interactive SVG ô ly grid editor.
  - `storage-manager.js`: LocalStorage draft auto-save and `.json` project file import/export.
  - `export-engine.js`: Multi-format Canvas PNG, SVG vector, and PDF rendering.
  - `ui-controller.js`: Main toolbar bindings, input controls, presets, and sample loader.
- **Facade Pattern**: `static/js/view.js` acts as the unified facade providing backward compatibility for inline HTML event handlers (`window.view = view`). When adding new features, implement logic in the specialized module and expose via the facade.
- **Automated Verification**: Always run `npm test` (or `node tests/verify-refactor.js`) after making changes to verify all 54 regression and invariant checks.

## Line Geometry & Spacing Invariant
- **Immutable Line Heights**: The text lines (`#result, .result-text`) use a rigid CSS Grid architecture with fixed row tracks:
  - 72pt (large / 2 ô ly): `grid-auto-rows: calc(var(--grid-unit) * 8);` (153.6px)
  - 37pt (small / 1 ô ly): `grid-auto-rows: calc(var(--grid-unit) * 4);` (76.8px)
- **Rigid Line Capping**: `<p class="line">` inside `#result` and `.result-text` must have explicit capped height and `min-height: 0 !important;`:
  - 72pt: `height: calc(var(--grid-unit) * 8) !important; max-height: calc(var(--grid-unit) * 8) !important; min-height: 0 !important;`
  - 37pt: `height: calc(var(--grid-unit) * 4) !important; max-height: calc(var(--grid-unit) * 4) !important; min-height: 0 !important;`
  - This prevents CSS Grid items from defaulting to `min-height: auto`, which otherwise expands row tracks when tall font ascenders or Vietnamese accents exceed the track height in certain browser rendering engines.
- **Integer-Period Background Tiling (384px Invariant)**:
  - Canvas background tile vertical period MUST be set to `calc(var(--grid-unit) * 20)` (384px = 5 blocks = 20 ô ly), NEVER `var(--grid-size)` (76.8px).
  - $19.2\text{px} \times 4 = 76.8\text{px}$ is a non-integer pixel value that causes GPU rasterizers (Chrome Skia, Firefox WebRender, Safari CoreGraphics) to round tile heights to 77px, accumulating $+0.4\text{px}$ downward drift per line ($+8\text{px}$ over 20 lines).
  - In contrast, $19.2\text{px} \times 20 = 384.0\text{px}$ is an exact integer across all DPR displays (1x: 384px, 1.25x: 480px, 1.5x: 576px, 2x: 768px), permanently eliminating vertical drift across unlimited lines.
- **Child Conformance**: Any new inline child element added inside a line (e.g. `.word`, `.word-space`, handles, toolbars, badges, outlines) MUST conform to the line box and NEVER expand its height:
  - All direct text and spacing elements (`.word`, `.word-text`, `.word-space`) must use `line-height: inherit; vertical-align: baseline;`.
  - `.word-space` must be `display: inline-block;` (never unconstrained `display: inline`, which causes font-leading inflation with tall Vietnamese diacritics).
  - Floating controls, popovers, and outline/dot layers must be positioned absolutely (`position: absolute`) with `pointer-events` properly scoped.
  - `<p class="line">` must have `box-sizing: border-box; margin: 0; padding: 0;`.
- **Guideline Centering Invariant**: The bottom edge/curve of glyphs (baseline) MUST sit directly in the middle (vertical midpoint) of the 1.5px major horizontal guideline across all layouts (72pt and 37pt), never on its top or bottom edge. Container `padding-top` calibrations (`calc(var(--grid-unit) * 0.7 - 1.25px)` for 72pt, `calc(var(--grid-unit) * 3.32 - 0.4px)` for 37pt on normal infinite boards; and `calc(var(--grid-unit) * 0.2 + 8.75px)` / `calc(var(--grid-unit) * 3.34 - 0.4px)` on 11x14 and 14x20) are calibrated to center the stroke through the guideline stroke thickness. Do not arbitrarily alter these calibrations.

## Blackboard Layout & Isolation Invariant
- **Single-Line Absolute Architecture**: The mini blackboard (`.board.blackboard`) does NOT use CSS Grid row tracks. It renders 1 line of text per board anchored on Line 1 ($y = 408.05\text{px}$) inside an 842px x 595px SVG vector frame.
- **Uncapped Single-Line Metrics**:
  - `#result, .result-text` inside `.board.blackboard` must have `display: block !important; position: absolute !important; left: 96.09px !important; line-height: 1 !important; height: auto !important; min-width: 0 !important;`.
  - `<p class="line">` inside `.board.blackboard` must have `height: auto !important; max-height: none !important; min-height: 0 !important; line-height: 1 !important;`.
  - `.word, .word-text, .word-space` inside `.board.blackboard` must have `line-height: 1 !important; vertical-align: baseline !important;`.
  - **Never apply CSS Grid multiline line-height capping (`76.8px` or `153.6px`) to `.board.blackboard`**, as this applies negative half-leading to the large font ($144.66\text{px}$ / $281.5\text{px}$), shifting the text $34\text{px}$–$68\text{px}$ above the guideline and displacing italicized text horizontally.

## 11x14 & 14x20 Notebook Layout Export Metrics & Invariants
- **Scope Isolation**: Export rendering logic (Canvas PNG/PDF via `exportEngine.exportWhite11x14ToPng` / `exportEngine.exportWhite14x20ToPng` and SVG via `exportEngine.renderWhite11x14PageToSvg` / `exportEngine.renderWhite14x20PageToSvg` in `static/js/modules/export-engine.js`) is completely isolated from on-screen DOM styles (`.board.white_11x14`, `.board.white_14x20`, `.grid`, `.guide-dot`). Changes to export boldness or dot sizes do not mutate web view presentation.
- **Grid Dimensions**:
  - 11x14: 11 blocks x 14 blocks, total 883.2px x 1152px (7 lines in 72pt, 14 lines in 37pt).
  - 14x20: 14 blocks x 20 blocks, total 1113.6px x 1612.8px (10 lines in 72pt, 20 lines in 37pt).
- **Grid Thickness Constants**:
  - `gridLineWidthMajor = 1.4;` (30% reduction from 2.0 baseline)
  - `gridLineWidthMinor = 0.7;` (30% reduction from 1.0 baseline)
  - Colors: `majorColor = 'rgba(60, 75, 115, 0.9)'`, `minorColor = 'rgba(90, 115, 165, 0.7)'`.
- **Guide Dot Radius Constants**:
  - `dotRadius = isSmall ? 1.25 : 1.75;` (50% reduction from 2.5 / 3.5 baseline).

## Browser Testing Priority
When testing layout, rendering, or features, prioritize browser compatibility in this order:
1. **Google Chrome** (Primary target)
2. **Mozilla Firefox** (Secondary target)
3. **Apple Safari / WebKit** (Tertiary target)

## Deployment Rule
- Deploy changes to Docker container `chudep` on `127.0.0.1:8080`.
- Commit changes locally to git, but **DO NOT PUSH** to remote unless explicitly requested.
