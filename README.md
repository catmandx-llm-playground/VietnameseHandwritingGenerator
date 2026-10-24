# VietnameseHandwritingGenerator

Trình tạo mẫu chữ viết ô ly tiểu học chuẩn font HP001 trực tuyến.

Website: https://chudep.hngnh.com

## Tính năng & Lưu ý Kỹ thuật

### Xuất ảnh PNG chất lượng cao (Ultra HD / In ấn)
- Ứng dụng hỗ trợ xuất ảnh PNG với độ nét cao (tỷ lệ phóng mặc định 4x) đáp ứng nhu cầu in ấn và làm tài liệu tập viết sắc nét.
- **Tối ưu hóa bộ nhớ trên thiết bị di động / Safari**: Để tránh lỗi giới hạn kích thước canvas trên trình duyệt di động (đặc biệt là iOS Safari), tỷ lệ xuất ảnh được tự động cân chỉnh động (giới hạn cạnh tối đa 8.192px và diện tích tối đa 25 megapixel), bảo đảm ảnh xuất ra luôn đạt độ sắc nét cao nhất có thể mà không gây văng trình duyệt hay lỗi tạo ảnh.

### Cấu hình xuất file bố cục Trang vở 11x14 (Grid Lines & Guide Dots)
Các thiết lập độ dày lưới ô ly và kích thước chấm mẫu khi xuất file (PNG, SVG, PDF) cho bố cục trang vở 11x14 được quản lý tách biệt trong `static/js/view.js` (không ảnh hưởng giao diện hiển thị web):
- **Độ dày đường kẻ lưới ô ly (Grid Thickness)**:
  - Khai báo tại `view.exportWhite11x14ToPng` (Canvas/PNG/PDF) và `view.renderWhite11x14SvgPage` (SVG):
    - `gridLineWidthMajor = 1.4;`: Độ dày đường kẻ chính/đậm (giảm 30% so với gốc 2.0).
    - `gridLineWidthMinor = 0.7;`: Độ dày đường kẻ phụ/mờ (giảm 30% so với gốc 1.0).
    - Màu sắc / độ trong suốt: `majorColor = 'rgba(60, 75, 115, 0.9)'`, `minorColor = 'rgba(90, 115, 165, 0.7)'`.
- **Kích thước chấm hướng dẫn (Guide Dot Size / Radius)**:
  - Khai báo tại `view.exportWhite11x14ToPng` và `view.renderWhite11x14SvgPage`:
    - `const dotRadius = isSmall ? 1.25 : 1.75;`: Bán kính chấm mẫu (giảm 50% so với gốc 2.5 / 3.5).
    - Cỡ chữ nhỏ (37pt / 1 ô ly): `1.25px`.
    - Cỡ chữ chuẩn (72pt / 2 ô ly): `1.75px`.

## Credits & Tác giả
- **Tác giả dự án**: [catmandx](https://github.com/catmandx) — Mã nguồn mở tại [VietnameseHandwritingGenerator trên GitHub](https://github.com/catmandx-llm-playground/VietnameseHandwritingGenerator).
- **Phông chữ tập viết HP001**: Phông chữ tập viết ô ly tiểu học **HP001** (HP001 3.0) thuộc bản quyền và được cung cấp bởi **Nhà In HP**: [http://nhainhp.com/?page=taive](http://nhainhp.com/?page=taive).

