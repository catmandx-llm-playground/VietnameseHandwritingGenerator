# Issue: [Feature] Integrated A4 Worksheet Studio & Primary School Practice Sheet Editor

**Labels**: `enhancement`, `ux`, `export`, `templates`, `roadmap`  
**Milestone**: `v1.2.0 - Worksheet Studio`

---

## 📌 Executive Summary & User Goal

Primary school teachers and parents regularly generate Vietnamese handwriting practice lines (using 14x20 or 11x14 notebook layouts) to print worksheets (`Phiếu bài tập / Vở luyện chữ`). Currently, assembling a finished worksheet requires manually exporting images/SVGs and arranging them in Microsoft Word or PowerPoint, which frequently introduces:
1. **Severe raster downsampling** (Word defaults to 150/220 ppi compression on save).
2. **Font substitution / rendering bugs** with custom Vietnamese cursive fonts (`HP001`).
3. **Distorted grid cell scaling** (difficult to guarantee exact $1.0\text{ cm} \times 1.0\text{ cm}$ primary school ô ly sizing).

**Proposed Solution:**  
Add a 1-click **"Thiết kế phiếu A4"** (*Design A4 Worksheet*) button to the main toolbar. Clicking this opens a dedicated, lightweight, and self-hosted editor in a new tab where a **pre-defined Vietnamese primary school worksheet template** is automatically applied around the generated handwriting grid, ready for non-technical teachers to customize, save, and print.

---

## 🎯 Target User Persona & Non-Tech UX Flow

- **Primary Persona:** Vietnamese primary school teachers and parents (non-technical, accustomed to simple drag-and-drop tools like Canva or Word).
- **Core Workflow:**
  1. **Write & Style:** Teacher inputs poem or handwriting drills on the main site.
  2. **Launch Editor:** Clicks **`[ 📄 Thiết kế phiếu A4 ]`** on the main toolbar.
  3. **Auto-Applied Template:** A new browser tab opens (`/worksheet.html`). The handwriting grid is already centered on an A4 sheet at **exact $1\text{ cm} \times 1\text{ cm}$ cell scale**, pre-populated with:
     - Header: *"Trường Tiểu học: ........................"* | *"Lớp: ............."*
     - Header: *"Họ và tên học sinh: ........................"* | *"Ngày: .../.../20..."*
     - Title: *"PHIẾU LUYỆN VIẾT CHỮ ĐẸP"* *(editable)*
     - Footer: Teacher assessment box (*"Điểm: ........ | Lời phê của cô giáo: ........................."*).
  4. **Simple Customization:**
     - Click any text element to edit inline.
     - Use a simple **Grid Scale Slider** ($80\%$, $100\%$ [1cm standard], $110\%$, $125\%$).
     - Upload a school logo or cute sticker/mascot.
     - Choose from 3-4 pre-built templates (Standard, Decorative Floral Border, Homework, Minimal).
  5. **Output:**
     - 1-Click **"In ngay (Print A4)"** at 100% hardware scale.
     - Export to vector PDF or high-resolution PNG.
     - **Save/Load Project (`.json`)** to reuse templates week after week.

---

## 📐 Architecture & Recommended Implementation

### Option 1 (Recommended): Built-in Native "Worksheet Studio" Sub-App
- **Tech Stack:** Static HTML5 + Fabric.js (canvas/SVG engine), served directly by the existing Nginx container (`chudep`).
- **Footprint:** ~500 KB static files, 0 extra Docker containers, 0 API keys, 0 backend dependencies.
- **Data Transfer:** Seamless browser memory hand-off via `sessionStorage` or `localStorage` (zero backend round-trip).
- **Template System:** Lightweight JSON layout definitions rendered directly onto an A4 virtual canvas ($794\text{ px} \times 1123\text{ px}$ at 96 DPI).

### Alternative Options:
- **Option 2 (Polotno Studio):** Self-hosted Canva clone (React/Node). Richer element library, but heavier footprint.
- **Option 3 (Draw.io Docker):** Containerized Diagrams.net on port 8085. Powerful, but interface has complex flowchart/diagramming tools.

---

## 📋 Task Checklist & Implementation Breakdown

### Phase 1: Main App Integration & Data Contract
- [ ] Add `[ 📄 Thiết kế phiếu A4 ]` button to the primary action bar in `index.html`.
- [ ] Add event handler in `static/js/modules/ui-controller.js` to serialize the current board SVG, layout type (14x20 / 11x14), and font metrics.
- [ ] Save payload into `sessionStorage.setItem('pending_worksheet_grid', ...)` and open `/worksheet.html` in a new browser tab.

### Phase 2: Worksheet Studio Canvas & Primary School Templates
- [ ] Create `worksheet.html` and supporting modules in `static/js/worksheet/`.
- [ ] Embed Fabric.js (or lightweight native SVG canvas) with fixed A4 dimensions ($210\text{ mm} \times 297\text{ mm}$).
- [ ] Implement pre-defined template definitions:
  - **Template 1: Chuẩn Tiểu Học (Standard Practice Sheet)**: School name, Class, Student name, Date, Title, Grid, Grading Box.
  - **Template 2: Khung Viền Trang Trí (Decorative Floral Border)**: Classical ornamental border frame with centered grid.
  - **Template 3: Phiếu Bài Tập Cuối Tuần (Weekly Homework)**: Multi-section layout with instruction notes.
  - **Template 4: Tối Giản / Trang Vở (Minimalist)**: Maximized grid area with compact 2-line header.

### Phase 3: Teacher-Friendly Editing Controls
- [ ] **Grid Scale Slider:** Interactive slider with preset snap at $100\%$ ($1.0\text{ cm}$ cell size), $80\%$, $110\%$, and $120\%$.
- [ ] **Inline Text Editing:** Double-click to edit headers, titles, and instructions without opening dialog boxes.
- [ ] **Image / Logo Upload:** Simple drag-and-drop or file picker to insert school badges and clipart.
- [ ] **Assessment Box Component:** Pre-made grading box with score and teacher feedback lines.

### Phase 4: Export, Storage & Print Calibration
- [ ] **100% True-Scale Print Engine:** CSS `@media print` rules calibrated to output exact $1\text{ cm}$ cells when printed from browser dialog.
- [ ] **Vector PDF & High-Res PNG Export:** Client-side generation of print-ready A4 PDF and 300+ DPI PNG.
- [ ] **Project Save / Load (`.json`):** Download and restore full worksheet state for recurring weekly assignments.

---

## 🔍 Acceptance Criteria

1. **Zero-Tech Friendliness:** A teacher with no graphic design experience can go from generating handwriting to printing a complete A4 practice sheet in under 30 seconds.
2. **Dimension Precision:** When printed at 100% scale, the 14x20 grid cells on the physical sheet measure exactly $1.0\text{ cm} \times 1.0\text{ cm}$ ($10\text{ mm}$) for big blocks and $2.5\text{ mm} \times 2.5\text{ mm}$ for small ô ly.
3. **No Quality Degradation:** Grid lines and handwriting curves remain vector-crisp with zero pixelation or blurriness.
4. **Self-Hosted & Independent:** Operates entirely within the existing Docker / Nginx environment with no external network or API dependencies.
