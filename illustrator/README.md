# Vietnamese Handwriting Script for Adobe Illustrator (HP001 Font)

Kịch bản mở rộng (**Adobe Illustrator ExtendScript `.jsx`**) giúp soạn thảo và chèn chữ viết tay tiểu học chuẩn phông **HP001** trực tiếp vào Adobe Illustrator trên hệ thống ô ly tập viết.

---

## 1. Tính năng chính (Key Features)

1. **Bộ chuyển đổi chữ viết tay (Vietnamese Handwriting Engine)**:
   - Tự động nhận diện phụ âm ghép (`kh`, `nh`, `ch`, `gh`, `ph`, `th`, `Gh`) và vần đặc biệt (`ooc`, `oon`).
   - Phân tích thanh điệu (huyền, sắc, hỏi, ngã, nặng) và tra cứu các ký tự nối nét (ligatures) chuẩn ngữ cảnh từ cơ sở dữ liệu `all.json` nhúng sẵn.
   - Hỗ trợ cả 2 biến thể: **HP001 Normal** và **HP001 Bold**.

2. **Tương thích & Bắt dính Ô Ly (Grid Detection & Line Snapping)**:
   - Hỗ trợ nhóm lưới gộp 2 bảng ô ly: Chỉ cần dùng công cụ Chọn (`V`) bấm chọn nhóm lưới, sau đó bấm **"Nhận diện Lưới đang chọn (Detect Selected Grid)"**.
   - Tự động lấy tọa độ góc $X, Y$ và kích thước để đặt chữ chuẩn xác.
   - Chọn dòng muốn đặt chữ (Dòng 1, 2, 3...) kèm tính năng rải nhiều dòng tự động theo thứ tự.
   - Tinh chỉnh khoảng cách lùi đầu dòng (**Indent**) và độ lệch đường kẻ nét viết (**Baseline Nudge**).

3. **Kéo giãn & Di chuyển dọc theo dòng (Stretch & Movement)**:
   - Tùy chỉnh độ giãn ngang (**Horizontal Scale %**) với nút bấm sẵn chuẩn tiểu học **121.89%** (tối ưu nét nối giữa các con chữ) hoặc 100%.
   - Thanh trượt và các nút bấm dịch chuyển nhanh dọc theo dòng kẻ: `<< -10pt`, `< -1pt`, `+1pt >`, `+10pt >>`.
   - Có thể chọn bất kỳ khối chữ nào trên artboard và bấm nút áp dụng lại độ giãn hoặc dịch chuyển tức thì.

---

## 2. Chuẩn bị Font chữ (Prerequisites)

Để Illustrator hiển thị đúng các nét nối và không bị lỗi phông, hãy cài đặt các phông chữ HP001 có sẵn trong thư mục `static/font/`:
- `static/font/HP001N30.ttf` (HP001 Normal 3.0)
- `static/font/HP001B30.ttf` (HP001 Bold 3.0)

*(Trên Windows: Nhấp chuột phải vào file `.ttf` $\rightarrow$ Chọn **Install for all users**. Trên macOS: Mở file bằng **Font Book** $\rightarrow$ Bấm **Install Font**).*

---

## 3. Cách cài đặt & Chạy script trong Adobe Illustrator

### Cách 1: Chạy trực tiếp (Không cần cài đặt)
1. Mở file thiết kế của bạn trong Adobe Illustrator.
2. Vào menu: **File $\rightarrow$ Scripts $\rightarrow$ Other Script...** (hoặc phím tắt `Ctrl + F12` trên Windows / `Cmd + F12` trên macOS).
3. Chọn file [VietnameseHandwriting.jsx](file:///root/projects/handwriting/illustrator/VietnameseHandwriting.jsx).

### Cách 2: Cài đặt vĩnh viễn vào menu Illustrator
Sao chép file `VietnameseHandwriting.jsx` vào thư mục Scripts của Illustrator:
- **Windows (64-bit)**:
  `C:\Program Files\Adobe\Adobe Illustrator [Năm]\Presets\[Ngôn ngữ]\Scripts\`
- **macOS**:
  `/Applications/Adobe Illustrator [Năm]/Presets/[Ngôn ngữ]/Scripts/`

*Khởi động lại Illustrator, script sẽ xuất hiện tại menu **File $\rightarrow$ Scripts $\rightarrow$ VietnameseHandwriting**.*

---

## 4. Hướng dẫn sử dụng nhanh

1. **Nhận diện lưới**:
   - Dùng chuột chọn nhóm lưới (2 grids merged group) trên màn hình.
   - Mở bảng script, bấm nút **"Nhận diện Lưới đang chọn (Detect Selected Grid)"**.
2. **Nhập văn bản**:
   - Gõ hoặc dán đoạn văn bản tiếng Việt vào ô nhập liệu.
   - Chọn cỡ chữ (37 pt cho ô ly nhỏ, 72 pt cho ô ly lớn, hoặc tùy chỉnh).
   - Chọn dòng cần bắt đầu đặt chữ.
3. **Chèn chữ**:
   - Bấm nút **"Chèn Chữ vào Lưới (Insert to Grid)"**.
   - Chữ sẽ được tự động chuyển thành ký tự nối nét và nằm ngay ngắn trên dòng kẻ bạn chọn.
4. **Giãn chữ & Tinh chỉnh vị trí**:
   - Dùng thanh trượt **Độ giãn ngang** để giãn/thu hẹp chữ.
   - Dùng các nút `+1pt / -1pt` để dịch chuyển chữ dọc theo dòng kẻ, hoặc kéo tự do bằng công cụ `V` (giữ phím `Shift` để khóa trục ngang).
