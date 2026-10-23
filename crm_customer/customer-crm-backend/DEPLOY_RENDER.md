# Deploy CRM lên Render (frontend + backend)

Cần 1 tài khoản [Render](https://render.com) (đăng nhập bằng GitHub cho nhanh) và repo GitHub chứa project này.

## Cách nhanh: Blueprint (`render.yaml`)

1. Push code lên GitHub (cả repo `files 2`, gồm `customer-crm-backend` và `customer-crm-nextjs`).
2. Vào https://dashboard.render.com → **New** → **Blueprint**.
3. Chọn repo → Render đọc `render.yaml` và tạo 2 Web Service:
   - `customer-crm-backend` (API NestJS)
   - `customer-crm-web` (giao diện Next.js)
4. Khi Render hỏi **DATABASE_URL**, dán chuỗi Postgres (Neon hiện tại cũng được).
5. Đợi build xong. Mở URL **customer-crm-web** trên trình duyệt.

Đăng nhập mặc định: `admin` / `admin123` (đổi ngay sau khi vào được).

## Cách thủ công (nếu không dùng Blueprint)

### Backend

- **New → Web Service** → chọn repo
- Root Directory: `customer-crm-backend`
- Environment: **Docker**
- Env vars: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` = URL frontend (ví dụ `https://customer-crm-web.onrender.com`)

### Frontend

- **New → Web Service** → cùng repo
- Root Directory: `customer-crm-nextjs`
- Environment: **Docker**
- Env var: `NEXT_PUBLIC_API_BASE_URL` = URL backend (ví dụ `https://customer-crm-backend.onrender.com`)
- Sau khi đổi biến này, **Clear build cache & deploy** lại frontend (vì Next.js nhúng URL lúc build)

## Lưu ý gói Free

App có thể ngủ khi không ai vào. Lần mở đầu mất ~30–60 giây.

File `.exe` desktop không đưa lên Render.
