# VietnameseHandwritingGenerator

Trình tạo mẫu chữ viết ô ly tiểu học chuẩn font HP001 trực tuyến.

Website: https://chudep.hngnh.com

## Tài liệu Kỹ thuật & Kiến trúc Hệ thống

- **[ARCHITECTURE.md](file:///root/projects/handwriting/ARCHITECTURE.md)**: Tài liệu kiến trúc toàn diện mô tả đường ống xử lý ký tự font HP001, các hệ tọa độ, chu kỳ vân lưới 384px, cấu trúc tệp dự án `.json`, và hướng dẫn chi tiết cho nhà phát triển / AI agents.
- **[AGENTS.md](file:///root/projects/handwriting/AGENTS.md)**: Quy chuẩn bất biến vật lý (Line Geometry Invariants, Blackboard Layout, 11x14 Export Metrics, Browser Priority).

## Tính năng & Lưu ý Kỹ thuật

### Kiến trúc Native ES Modules (Zero-Build)
- Ứng dụng chạy theo chuẩn Native JavaScript ES Modules (`<script type="module">`). Không cần Webpack hay Vite, phục vụ trực tiếp bởi máy chủ Nginx tĩnh.
- Hệ thống chia thành các module độc lập tại `static/js/modules/`:
  - `config.js`: Cấu hình tham số và ngưỡng giãn chữ.
  - `utils.js`: Xử lý chuỗi, thanh điệu tiếng Việt.
  - `model.js`: Nạp dữ liệu `all.json` và quy tắc nối chữ.
  - `board-renderer.js`: Kết xuất lưới và đồng bộ bảng.
  - `dotting-manager.js`: Tạo chấm mẫu và chữ mờ tập tô.
  - `drag-stretch-handler.js`: Kéo thả và co giãn chữ.
  - `freestyle-dotting-modal.js`: Trình chỉnh sửa chấm tự do bằng SVG.
  - `storage-manager.js`: Lưu bản nháp LocalStorage và tệp `.json`.
  - `export-engine.js`: Bộ máy xuất ảnh PNG, Vector SVG, PDF.
  - `ui-controller.js`: Điều khiển giao diện và thanh công cụ.
  - `view.js`: Facade hợp nhất hỗ trợ tương thích ngược.

### Xuất ảnh PNG chất lượng cao (Ultra HD / In ấn)
- Ứng dụng hỗ trợ xuất ảnh PNG với độ nét cao (tỷ lệ phóng 4x, 6x, 8x) đáp ứng nhu cầu in ấn và làm tài liệu tập viết sắc nét.
- **Tối ưu hóa bộ nhớ trên thiết bị di động / Safari**: Để tránh lỗi giới hạn kích thước canvas trên trình duyệt di động (đặc biệt là iOS Safari), tỷ lệ xuất ảnh được tự động cân chỉnh động (giới hạn cạnh tối đa 8.192px và diện tích tối đa 25 megapixel), bảo đảm ảnh xuất ra luôn đạt độ sắc nét cao nhất có thể mà không gây văng trình duyệt hay lỗi tạo ảnh.

### Cấu hình xuất file bố cục Trang vở 11x14 & 14x20 (Grid Lines & Guide Dots)
Các thiết lập độ dày lưới ô ly và kích thước chấm mẫu khi xuất file (PNG, SVG, PDF) cho bố cục trang vở 11x14 và 14x20 được quản lý tách biệt trong `static/js/modules/export-engine.js` (không ảnh hưởng giao diện hiển thị web):
- **Kích thước trang vở**:
  - Vở 11x14: 11 khối x 14 khối ô ly ($883.2\text{px} \times 1152\text{px}$), 7 dòng ở cỡ 72pt và 14 dòng ở cỡ 37pt.
  - Vở 14x20: 14 khối x 20 khối ô ly ($1113.6\text{px} \times 1612.8\text{px}$), 10 dòng ở cỡ 72pt và 20 dòng ở cỡ 37pt.
- **Độ dày đường kẻ lưới ô ly (Grid Thickness)**:
  - Khai báo tại `exportEngine.exportWhite11x14ToPng` / `exportEngine.exportWhite14x20ToPng` (Canvas/PNG/PDF) và `exportEngine.renderWhite11x14PageToSvg` / `exportEngine.renderWhite14x20PageToSvg` (SVG):
    - `gridLineWidthMajor = 1.4;`: Độ dày đường kẻ chính/đậm (giảm 30% so với gốc 2.0).
    - `gridLineWidthMinor = 0.7;`: Độ dày đường kẻ phụ/mờ (giảm 30% so với gốc 1.0).
    - Màu sắc / độ trong suốt: `majorColor = 'rgba(60, 75, 115, 0.9)'`, `minorColor = 'rgba(90, 115, 165, 0.7)'`.
- **Kích thước chấm hướng dẫn (Guide Dot Size / Radius)**:
  - Khai báo tại `exportEngine.exportWhite11x14ToPng` / `exportEngine.exportWhite14x20ToPng` và `exportEngine.renderWhite11x14PageToSvg` / `exportEngine.renderWhite14x20PageToSvg`:
    - `const dotRadius = isSmall ? 1.25 : 1.75;`: Bán kính chấm mẫu (giảm 50% so với gốc 2.5 / 3.5).
    - Cỡ chữ nhỏ (37pt / 1 ô ly): `1.25px`.
    - Cỡ chữ chuẩn (72pt / 2 ô ly): `1.75px`.

## Kiểm thử Tự động (Verification Suite)
Chạy bộ kiểm thử tự động gồm 63 tiêu chí kiểm tra hồi quy:
```bash
npm test
# hoặc
node tests/verify-refactor.js
```

## Credits & Tác giả
- **Tác giả dự án**: [catmandx](https://github.com/catmandx) — Mã nguồn mở tại [VietnameseHandwritingGenerator trên GitHub](https://github.com/catmandx-llm-playground/VietnameseHandwritingGenerator).
- **Phông chữ tập viết HP001**: Phông chữ tập viết ô ly tiểu học **HP001** (HP001 3.0) thuộc bản quyền và được cung cấp bởi **Nhà In HP**: [http://nhainhp.com/?page=taive](http://nhainhp.com/?page=taive).
