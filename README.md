# Zero Trust Console

Web admin quản lý Cloudflare Zero Trust: xem/sửa Access Policies, xem/sửa Gateway
Policies, xem Access Logs và Gateway Logs, danh sách Users/Devices. Deploy trên
Cloudflare Pages, backend chạy bằng Pages Functions để giấu API Token khỏi trình duyệt.

## Kiến trúc

```
src/                    React frontend (Vite)
functions/api/          Pages Functions — server-side, gọi Cloudflare API
  _utils.js             Wrapper cfFetch(), xử lý lỗi thống nhất
  access/policies.js       GET  /api/access/policies       (list + create)
  access/policies/[id].js  GET/PUT/DELETE /api/access/policies/:id
  access/users.js          GET  /api/access/users
  access/devices.js        GET  /api/access/devices
  access/logs.js           GET  /api/access/logs
  gateway/policies.js      GET  /api/gateway/policies      (list + create)
  gateway/policies/[id].js PUT/DELETE /api/gateway/policies/:id
  gateway/logs.js          GET  /api/gateway/logs           (GraphQL Analytics)
  gateway/categories.js    GET  /api/gateway/categories      (Content/Security Categories, cho Visual Builder)
  gateway/app-types.js     GET  /api/gateway/app-types       (Application selector, cho Visual Builder)
```

Token Cloudflare (`CF_API_TOKEN`) chỉ tồn tại trong biến môi trường của Pages
Functions — **không bao giờ** gửi xuống client. Frontend chỉ gọi `/api/*` cùng origin.

## 1. Tạo API Token

Vào https://dash.cloudflare.com/profile/api-tokens → **Create Token** → Custom token,
cấp các quyền (Account level):

| Permission | Quyền |
|---|---|
| Access: Organizations, Identity Providers, and Groups | Edit |
| Access: Apps and Policies | Edit |
| Zero Trust | Edit |
| Logs | Read |

Ghi lại token — chỉ hiện 1 lần.

Lấy **Account ID**: trong Cloudflare Dashboard, trang tổng quan bất kỳ domain nào,
cột phải, hoặc trong URL `dash.cloudflare.com/<ACCOUNT_ID>/...`.

## 2. Chạy local

```bash
npm install
cp .env.example .dev.vars   # rồi điền CF_API_TOKEN, CF_ACCOUNT_ID thật vào .dev.vars
npm run build
npx wrangler pages dev dist
```

`wrangler pages dev` tự đọc `.dev.vars` và chạy cả frontend lẫn `/functions`.

## 3. Deploy lên Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy dist --project-name=zt-console
```

Hoặc nối Git repo trong Dashboard → Pages → Create project → chọn repo, build
command `npm run build`, output directory `dist`.

Sau khi tạo project, vào **Settings → Environment variables** (áp dụng cho cả
Production và Preview) và thêm:

- `CF_API_TOKEN` — đánh dấu **Encrypt** (secret)
- `CF_ACCOUNT_ID`

## 4. Bảo vệ trang admin bằng Cloudflare Access

Vì đây là trang quản trị có quyền sửa chính sách Zero Trust, cần khóa nó lại
bằng chính Cloudflare Access:

1. Zero Trust Dashboard → **Access → Applications → Add an application** → Self-hosted
2. Domain: domain Pages của bạn (vd: `zt-console.pages.dev` hoặc custom domain)
3. Tạo policy Access (vd: chỉ allow email thuộc domain công ty, hoặc 1 nhóm cụ thể)
4. Sau khi bật, mọi request tới trang đều bị Cloudflare chặn ở edge trước khi
   tới được Pages Function — người ngoài không có quyền sẽ không bao giờ chạm
   tới `/api/*`.

`functions/api/_utils.js` có sẵn `getAccessIdentity(request)` đọc header
`Cf-Access-Authenticated-User-Email` mà Cloudflare Access tự động đính kèm,
để bạn có thể ghi log ai thao tác gì nếu cần mở rộng sau này (audit trail).

## Giới hạn hiện tại / hướng mở rộng

- Gateway Logs dùng GraphQL Analytics API (dữ liệu tổng hợp theo phút). Muốn xem
  log chi tiết từng request cần bật **Logpush** sang R2/S3 rồi đọc từ đó.
- Access Policy Form hỗ trợ UI cho các rule phổ biến (email, email domain, IP,
  everyone). Rule phức tạp hơn (group, service token, geo...) hiện cần sửa qua
  Cloudflare Dashboard trực tiếp — có thể bổ sung sau nếu cần.
- Gateway Policy Form có Visual Builder cho **DNS** với 3 selector: Application,
  Content Categories, Security Categories (operator: is/is not/in/not in/matches/contains,
  ghép 1 tầng bằng AND hoặc OR). HTTP và Network dùng tab Wirefilter thô. Khi sửa
  1 rule DNS đã có sẵn, hệ thống cố gắng đọc ngược biểu thức để tiền điền Visual
  Builder; nếu biểu thức quá phức tạp hoặc viết tay, form tự chuyển sang tab
  Wirefilter để không làm mất dữ liệu.
- Chưa có audit trail nội bộ (ai bấm sửa/xóa policy gì trong chính app này).
  Có thể thêm bằng cách ghi log vào KV hoặc D1, dùng `getAccessIdentity()`.
