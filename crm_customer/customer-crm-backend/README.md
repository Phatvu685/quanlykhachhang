# Customer CRM Backend — NestJS + TypeScript + Prisma + PostgreSQL (Neon)

Backend đầy đủ chức năng cho app "Quản Lý Khách Hàng — Vị Nguyên Food", viết bằng
**NestJS + TypeScript**, dùng **async/await** cho toàn bộ thao tác bất đồng bộ (gọi DB),
tổ chức theo **module/service/controller** (mỗi nghiệp vụ 1 hàm/service riêng, dễ đọc dễ sửa).

DB dùng **PostgreSQL trên Neon** (cloud, free tier **3GB**) — không cần cài đặt gì trên máy,
nhiều laptop cùng dùng chung 1 connection string, không phải đồng bộ file DB thủ công.

---

## 1. Tạo database miễn phí trên Neon (làm 1 lần)

1. Vào https://neon.tech → **Sign up** (dùng Google/GitHub cho nhanh).
2. Tạo **Project** mới, chọn khu vực gần Việt Nam nhất (Singapore).
3. Vào **Dashboard → Connection string**, copy chuỗi dạng:
   ```
   postgresql://<user>:<password>@ep-xxxx-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Dán chuỗi đó vào biến `DATABASE_URL` trong file `.env` (xem bước 2).

> Neon free tier: **3GB storage**, tự "ngủ" khi không dùng (tự đánh thức khi có kết nối mới,
> có thể chậm ~1-2 giây lần đầu sau khi ngủ) — hoàn toàn đủ dùng cho app CRM loại này.

---

## 2. Cài đặt & cấu hình

```bash
npm install
cp .env.example .env
```

Mở `.env` vừa tạo, điền:
- `DATABASE_URL` = chuỗi kết nối Neon ở bước 1
- `JWT_SECRET` = 1 chuỗi ngẫu nhiên dài (tạo nhanh bằng lệnh dưới)

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## 3. Khởi tạo bảng trong DB (migration) + dữ liệu mẫu

```bash
# Sinh Prisma Client (đọc prisma/schema.prisma -> tạo code TS truy vấn DB)
npx prisma generate

# Tạo bảng thật trên Neon theo đúng schema.prisma
npx prisma migrate dev --name init

# Tạo 5 tài khoản đăng nhập mặc định (admin + 4 nhân viên, giống bản gốc)
npm run seed
```

Tài khoản mặc định sau khi seed:

| username | password | role |
|---|---|---|
| admin | admin123 | admin |
| hai_em | haiem123 | staff |
| ngoc_thuong | ngocthuong123 | staff |
| ai_thi | aithi123 | staff |
| tan_phat | tanphat123 | staff |

⚠️ **Nên đổi mật khẩu các tài khoản này ngay sau khi seed** (qua API `PATCH /api/users/:id`, chỉ admin gọi được).

---

## 4. Chạy server

```bash
npm run start:dev     # chế độ dev, tự reload khi sửa code
# hoặc
npm run build && npm run start:prod    # chế độ production
```

Server chạy tại `http://localhost:3001/api` (đổi port trong `.env` nếu cần).
Kiểm tra nhanh: mở `http://localhost:3001/api/health` → thấy `{"status":"ok",...}` là chạy đúng.

---

## 5. Danh sách API (tất cả đều trả JSON, cần header `Authorization: Bearer <token>` trừ 2 route auth)

### Auth
| Method | Endpoint | Quyền | Ghi chú |
|---|---|---|---|
| POST | `/api/auth/login` | công khai | `{username, password}` → `{accessToken, user}` |
| GET | `/api/auth/me` | đã đăng nhập | trả lại thông tin user trong token |

### Users (tài khoản đăng nhập) — chỉ admin
| Method | Endpoint |
|---|---|
| GET | `/api/users` |
| GET | `/api/users/:id` |
| POST | `/api/users` |
| PATCH | `/api/users/:id` |
| DELETE | `/api/users/:id` |

### Products (sản phẩm kho) — xem: ai cũng được, sửa: admin
| Method | Endpoint |
|---|---|
| GET | `/api/products` (có `currentStock` tính sẵn) |
| GET | `/api/products/:id` |
| POST | `/api/products` (admin) |
| PATCH | `/api/products/:id` (admin) |
| DELETE | `/api/products/:id` (admin) |

### Combos — xem: ai cũng được, sửa: admin
| Method | Endpoint |
|---|---|
| GET | `/api/combos` (có `basePrice`, `totalKg`, `finalPrice` tính sẵn) |
| GET | `/api/combos/:id` |
| POST | `/api/combos` (admin) |
| PATCH | `/api/combos/:id` (admin) |
| DELETE | `/api/combos/:id` (admin) |

### Customers (khách hàng / đơn hàng / CSKH — dùng chung 1 bảng) — mọi nhân viên
| Method | Endpoint | Ghi chú |
|---|---|---|
| GET | `/api/customers?stage=&search=&type=&staffUserId=&paymentStatus=&packed=&delivered=&onlyOrders=&fromDate=&toDate=` | lọc động |
| GET | `/api/customers/stats` | `{total, cskh, old, lead}` |
| GET | `/api/customers/today-order-count` | số đơn hôm nay |
| GET | `/api/customers/:id` | |
| POST | `/api/customers` | tạo mới, tự đồng bộ phiếu xuất kho |
| POST | `/api/customers/:id/repeat` | "Mua lại": tạo đơn mới giữ thông tin khách |
| PATCH | `/api/customers/:id` | sửa, tự đồng bộ lại phiếu xuất kho nếu đổi SP/kg/combo |
| PATCH | `/api/customers/:id/toggle-payment` | đổi đã trả ⇄ chưa trả |
| PATCH | `/api/customers/:id/toggle-packed` | đổi đã đóng gói ⇄ chưa |
| PATCH | `/api/customers/:id/toggle-delivered` | đổi đã giao ⇄ chưa |
| PATCH | `/api/customers/:id/toggle-stage` | chuyển Đơn hàng ⇄ CSKH |
| PATCH | `/api/customers/:id/transfer` | `{staffUserId}` — chuyển nhân viên phụ trách |
| DELETE | `/api/customers/:id` | xoá kèm phiếu kho liên quan |

### Stock Entries (phiếu nhập/xuất kho) — admin
| Method | Endpoint | Ghi chú |
|---|---|---|
| GET | `/api/stock-entries` | |
| GET | `/api/stock-entries/:id` | |
| POST | `/api/stock-entries` | phiếu NHẬP có giá > 0 tự sinh khoản chi phí |
| PATCH | `/api/stock-entries/:id` | |
| DELETE | `/api/stock-entries/:id` | xoá kèm khoản chi phí tự sinh (nếu có) |

### Expenses (sổ dòng tiền) — xem: ai cũng được, sửa: admin
| Method | Endpoint | Ghi chú |
|---|---|---|
| GET | `/api/expenses` | danh sách khoản nhập tay (chi_phi/von/hoan_von) |
| GET | `/api/expenses/summary` | `{totalRevenue, totalDebt, totalExpense, totalCapital, totalRefund, capitalOutstanding, profit}` |
| GET | `/api/expenses/ledger` | sổ cái gộp (doanh thu+công nợ+chi phí/vốn), sort theo ngày |
| GET | `/api/expenses/:id` | |
| POST | `/api/expenses` (admin) | |
| PATCH | `/api/expenses/:id` (admin) | chặn sửa khoản autoStock=true |
| DELETE | `/api/expenses/:id` (admin) | chặn xoá khoản autoStock=true |

### Social Accounts (tài khoản MXH chăm sóc khách hàng) — chỉ admin
| Method | Endpoint |
|---|---|
| GET / POST / PATCH / DELETE | `/api/social-accounts` |

---

## 6. Cấu trúc thư mục

```
src/
  prisma/            # PrismaService/PrismaModule dùng chung toàn app
  common/
    decorators/      # @Roles(), @CurrentUser()
    guards/          # JwtAuthGuard, RolesGuard
  auth/              # login, JWT strategy
  users/             # tài khoản đăng nhập
  products/          # sản phẩm kho
  combos/            # combo khuyến mãi
  customers/         # khách hàng/đơn hàng/CSKH — module lõi, nhiều logic nhất
  stock-entries/      # phiếu nhập/xuất kho
  expenses/          # sổ dòng tiền
  social-accounts/    # tài khoản MXH
  app.module.ts       # module gốc, import tất cả module trên
  main.ts             # entry point: CORS, ValidationPipe, prefix /api
prisma/
  schema.prisma       # định nghĩa toàn bộ bảng/quan hệ
  seed.ts              # tạo 5 tài khoản mặc định
```

Mỗi module con đều theo cùng 1 khuôn:
- `*.dto.ts` — khai báo + validate dữ liệu đầu vào (class-validator)
- `*.service.ts` — toàn bộ logic nghiệp vụ, gọi Prisma bằng `async/await`
- `*.controller.ts` — khai báo route REST, gọi xuống service
- `*.module.ts` — gói controller+service lại, export service nếu module khác cần dùng lại

---

## 7. Ghi chú quan trọng

- **Đơn vị tiền**: field `price` lưu ĐỦ đơn vị đồng (VNĐ), không phải nghìn đồng — nếu
  form nhập theo "nghìn đồng" như bản gốc, **frontend phải tự nhân 1000** trước khi gửi lên.
- **Đồng bộ kho tự động**: tạo/sửa khách hàng có `productId` + `kg` sẽ tự tạo/cập nhật 1
  phiếu xuất kho; có `comboId` kèm quà tặng sẽ tự tạo thêm phiếu xuất kho quà tặng —
  y hệt hành vi `syncCustomerStockEntry`/`syncCustomerGiftStockEntry` ở bản HTML gốc.
- **Chi phí tự sinh từ kho**: phiếu NHẬP kho có đơn giá > 0 tự tạo 1 dòng "Chi phí bán hàng"
  bên Sổ dòng tiền (`autoStock: true`) — không sửa/xoá trực tiếp dòng này qua `/expenses`,
  phải sửa/xoá phiếu kho gốc ở `/stock-entries`.
- **Bảo mật mật khẩu**: khác bản gốc (lưu plaintext), backend này băm mật khẩu bằng **bcrypt**
  trước khi lưu DB — an toàn hơn nhiều, đăng nhập vẫn hoạt động y hệt từ phía client.
