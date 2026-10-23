# Quản Lý Khách Hàng — Next.js

Bản chuyển đổi 100% sang Next.js (App Router) từ file HTML gốc
`quan-ly-khach-hang.html`. Toàn bộ **CSS, HTML và logic JS được giữ nguyên
vẹn**, chỉ thay đổi cách tổ chức file cho phù hợp với Next.js:

| Gốc (1 file HTML) | Next.js |
|---|---|
| `<style>...</style>` | `app/globals.css` (copy y nguyên) |
| `<body>...</body>` (trước `<script>` cuối) | `app/bodyMarkup.js` — chuỗi HTML y nguyên, render qua `dangerouslySetInnerHTML` trong `app/page.js` |
| `<script>...</script>` (logic chính) | `public/legacy/app.js` — y nguyên, được nạp bằng `next/script` sau khi markup đã mount |
| `<script src=".../xlsx.full.min.js">` (CDN) | `public/legacy/xlsx.full.min.js` — cùng phiên bản `xlsx@0.18.5`, tự host để không phụ thuộc mạng ngoài |
| Ảnh nền + logo (base64 inline) | `public/assets/bg-pattern.png`, `public/assets/logo.png` — tách ra file thật, CSS/HTML trỏ tới `/assets/...` |

Không có logic nào bị viết lại — `app.js` là **chính xác nội dung script gốc**,
chỉ được nạp muộn hơn (sau khi HTML đã có trên trang) để các
`document.getElementById(...)` trong đó hoạt động bình thường.

## Chạy thử

```bash
npm install
npm run dev
```

Mở http://localhost:3000

## Build production

```bash
npm run build
npm run start
```

## Lưu ý

- Ứng dụng vẫn lưu toàn bộ dữ liệu trong bộ nhớ (biến JS), y như bản gốc —
  tải lại trang sẽ mất dữ liệu, tài khoản đăng nhập mặc định vẫn là
  `admin / admin123` (và `hai_em/haiem123`, `ngoc_thuong/ngocthuong123`,
  `ai_thi/aithi123`, `tan_phat/tanphat123`).
- Nếu muốn sửa logic nghiệp vụ, chỉnh trực tiếp trong `public/legacy/app.js`.
- Nếu muốn sửa giao diện tĩnh (thêm/bớt phần tử HTML), chỉnh
  `app/bodyMarkup.js`.
