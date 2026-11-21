# Vietnamese Handwriting Script for Adobe Illustrator (HP001 Font)

Kịch bản mở rộng (**Adobe Illustrator ExtendScript `.jsx`**) giúp soạn thảo và chèn chữ viết tay tiểu học chuẩn phông **HP001** trực tiếp vào Adobe Illustrator trên hệ thống ô ly tập viết.

---

## 1. Cơ chế Căn Lưới Thông Minh (Named Lines `H1..Hxx` & Bounding Box `BB`)

Thay vì phải đoán bước dòng hay căn chỉnh thủ công, script hỗ trợ **tự động bắt dính chính xác 100%** theo các đường kẻ và khung viền đã đặt tên trong file Illustrator của bạn:

1. **Đường kẻ dòng (`H1`, `H2`, `H3`, ... `Hxx`)**:
   - Mỗi đường kẻ ngang cơ sở (baseline) của dòng chỉ cần đặt tên trong bảng Layers là `H1`, `H2`, `H3`, v.v.
   - Script tự động đọc tọa độ trục $Y$ chính xác ở giữa nét vẽ của đường kẻ và đặt chân chữ (baseline) nằm chuẩn xác tuyệt đối trên đường kẻ đó.
   - **Rải nhiều dòng tự động**: Nếu văn bản có 3 dòng và bạn chọn bắt đầu từ `H1`, dòng 1 sẽ vào `H1`, dòng 2 vào `H2`, dòng 3 vào `H3`.

2. **Khung bao giới hạn (`BB`)**:
   - Đối tượng khung viền lưới đặt tên là `BB` (Bounding Box).
   - Chữ sẽ tự động lấy điểm bắt đầu từ **mép trái của BB** cộng thêm khoảng lùi đầu dòng (**Indent**).
   - **Tự động ép vừa khung BB (Auto-fit to BB)**: Nếu một câu quá dài vượt quá mép phải của `BB`, script sẽ tự động tính toán và điều chỉnh tỷ lệ giãn ngang (`horizontalScale`) vừa khít với chiều rộng của `BB` mà không bị tràn ra ngoài.

---

## 2. Tính năng chính (Key Features)

* **Bộ chuyển đổi chữ viết tay tiểu học**:
  Tự động ghép phụ âm ghép (`kh`, `nh`, `ch`, `gh`, `ph`, `th`, `Gh`), vần đặc biệt (`ooc`, `oon`) và dấu thanh sang các ký tự nối nét mở rộng trong font **HP001 Normal** và **HP001 Bold**.
* **Giao diện Modal Dialog không bao giờ biến mất**:
  Cửa sổ luôn mở cho tới khi bạn bấm **Đóng (Close)**, kết hợp lệnh `app.redraw()` cập nhật trực tiếp thay đổi trên Artboard trong thời gian thực.
* **Kéo giãn & Di chuyển dọc theo dòng**:
  - Tùy chỉnh độ giãn ngang (**Horizontal Scale %**) với nút chuẩn tiểu học **121.89%** (tối ưu nét nối giữa các con chữ) hoặc 100%.
  - Các nút bấm dịch chuyển nhanh dọc theo đường kẻ: `<< -10pt`, `< -1pt`, `+1pt >`, `+10pt >>`.
  - Nút **"Thu vừa khung BB cho chữ đang chọn"** để ép các khối chữ có sẵn vừa vặn với `BB`.

---

## 3. Cách chạy trong Adobe Illustrator

1. Mở file Illustrator chứa lưới có các đường kẻ đặt tên `H1`, `H2`... và khung `BB`.
2. Vào menu: **File $\rightarrow$ Scripts $\rightarrow$ Other Script...** (`Ctrl + F12` trên Windows / `Cmd + F12` trên Mac).
3. Chọn file [VietnameseHandwriting.jsx](file:///root/projects/handwriting/illustrator/VietnameseHandwriting.jsx).
4. Cửa sổ script sẽ mở ra và tự động hiển thị: `✓ [BB: ...x...pt] Tìm thấy N dòng (H1 -> H{N})`.
5. Nhập văn bản, chọn dòng bắt đầu (H1, H2...), rồi bấm **"Chèn Chữ vào Lưới (Insert to Grid)"**.
