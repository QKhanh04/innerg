# Đánh giá phần System Admin theo `SystemSpecification.md`

Ghi chú: trong repo hiện không có file `đặc tả.md`, nên phần rà này đối chiếu theo [SystemSpecification.md](SystemSpecification.md), tập trung riêng vào **mục 11. System Admin Module** và các đoạn liên quan đến company onboarding ở **mục 4**.

## Cách chấm mức độ

- `Hoàn chỉnh`: có backend + frontend dùng được, bám spec khá sát.
- `Tương đối`: đã có phần chính nhưng còn thiếu vài nhánh hoặc chiều sâu.
- `Mới khung`: đã có dữ liệu/API/UI cơ bản nhưng chưa thành module đầy đủ.
- `Chưa có`: chưa thấy code tương ứng.

---

## 1. Company Management

**Spec yêu cầu**
- Xem danh sách tất cả công ty.
- Tạo company mới: thông tin + tạo HR account đầu tiên.
- Khóa / kích hoạt company.
- Xem thống kê: số nhân viên, số lớp học, dung lượng lưu trữ đang dùng.

**Đánh giá:** `Tương đối+`

**Đã làm được**
- Có route admin riêng theo module:
  - `/admin`
  - `/admin/companies`
  - `/admin/subscriptions`
  - `/admin/audit`
  - `/admin/moderation`
  - `/admin/platform`
  - [web/src/routes/AppRoutes.jsx](web/src/routes/AppRoutes.jsx)
- Sidebar trái hiện có đã dùng luôn cho các mục System Admin, không còn sidebar nội bộ riêng:
  - [web/src/layouts/Sidebar.tsx](web/src/layouts/Sidebar.tsx)
- Có admin dashboard và company detail:
  - [web/src/pages/admin/AdminDashboard/AdminDashboard.jsx](web/src/pages/admin/AdminDashboard/AdminDashboard.jsx)
  - [web/src/pages/admin/CompanyDetail/CompanyDetail.jsx](web/src/pages/admin/CompanyDetail/CompanyDetail.jsx)
- Có API:
  - lấy overview
  - lấy danh sách company
  - xem chi tiết company
  - activate/deactivate company
  - update company
  - soft delete company
  - [api/InnerG.Api/Controllers/AdminController.cs](api/InnerG.Api/Controllers/AdminController.cs)
- Tạo company và HR đầu tiên đã có:
  - [api/InnerG.Api/Controllers/AuthController.cs](api/InnerG.Api/Controllers/AuthController.cs)
  - [api/InnerG.Api/Services/Implementations/AuthService.cs](api/InnerG.Api/Services/Implementations/AuthService.cs)
- UI tạo/sửa company đã dùng dialog thay vì form inline.
- Activate / deactivate / delete đã dùng dialog xác nhận riêng, không còn `window.confirm`.
- Feedback thao tác đã dùng toast, không còn banner dài trong thân trang.

**Đã bổ sung thêm**
- Overview và dữ liệu company đã có thêm:
  - số lớp trong tháng
  - storage used
  - storage quota
  - storage used percent
  - retention rate

**Chưa đủ / lệch spec**
- Company detail vẫn là snapshot gọn, chưa phải màn quản trị sâu theo từng tenant.
- Chưa có luồng bulk action cho nhiều company.

**Mức hoàn thiện thực tế**
- Quản lý tenant cơ bản đã khá ổn để vận hành.
- Chưa thể xem là hoàn chỉnh tuyệt đối theo spec.

---

## 2. Subscription / Plan Management

**Spec yêu cầu**
- Admin gán plan cho company.
- Tracking usage: số user hiện tại, số lớp trong tháng, storage dùng.
- Cảnh báo khi gần vượt giới hạn plan.

**Đánh giá:** `Tương đối+`

**Đã làm được**
- Có API lấy subscription plans và gán plan cho company:
  - [api/InnerG.Api/Controllers/AdminController.cs](api/InnerG.Api/Controllers/AdminController.cs)
- Có service phía web:
  - [web/src/services/adminService.js](web/src/services/adminService.js)
- Mục `Subscriptions` đã đi qua sidebar trái.
- Mỗi company có nút `Manage plan` mở dialog cập nhật subscription.
- Có hiển thị:
  - plan hiện tại
  - subscription status
  - ngày hết hạn
  - số user
  - số lớp trong tháng
  - storage used / quota
  - trạng thái `Within plan`, `Near plan limit`, `Over plan limit`

**Chưa đủ / lệch spec**
- Chưa có CRUD subscription plan.
- Chưa có billing history hay invoice view.

**Mức hoàn thiện thực tế**
- Đủ cho tác vụ assign plan và kiểm tra usage cơ bản.
- Chưa đủ chiều sâu để gọi là subscription management đầy đủ.

---

## 3. Audit Log

**Spec yêu cầu**
- Ghi lại actor, action, target resource, timestamp, IP, result.
- Filter theo company, actor, action type, thời gian.
- Export CSV.

**Đánh giá:** `Tương đối+`

**Đã làm được**
- Có endpoint lấy audit logs và export CSV:
  - [api/InnerG.Api/Controllers/AdminController.cs](api/InnerG.Api/Controllers/AdminController.cs)
- Có tab `Audit` trong admin dashboard.
- Có filter:
  - company
  - actor id
  - action
  - entity type
  - from/to date
  - số dòng lấy về
- Dữ liệu audit đang có các field quan trọng:
  - companyId
  - userId
  - entityType
  - entityId
  - action
  - ipAddress
  - createdAt
- Nhiều thao tác admin đã có audit log:
  - đổi trạng thái company
  - update company
  - delete company
  - assign subscription
  - moderation action
  - update platform settings

**Chưa đủ / lệch spec**
- Chưa thấy field `result = SUCCESS / FAILED` được thể hiện rõ thành module chuẩn như spec.

**Mức hoàn thiện thực tế**
- Có nền audit log thật và usable.
- Nhưng vẫn mới ở mức xem log cơ bản + export.

---

## 4. Moderation

**Spec yêu cầu**
- Tiếp nhận báo cáo từ HR về nội dung vi phạm.
- Xem xét và xử lý: xóa nội dung, cảnh báo user, khóa tài khoản.

**Đánh giá:** `Tương đối`

**Đã làm được**
- Có tab `Moderation` trong admin dashboard.
- Có API queue moderation ở tầng system admin:
  - [api/InnerG.Api/Controllers/AdminController.cs](api/InnerG.Api/Controllers/AdminController.cs)
- Queue hiện lấy từ:
  - audit signal dạng `report`, `reject`, `violation`, `flag`
  - các `TrainingEvent` đang `PendingApproval`
- Admin có thể thao tác:
  - khóa user nếu target là `AppUser`
  - xóa resource nếu target là `Resource`
  - cancel + soft delete training event nếu target là `TrainingEvent`
- `Apply action` hiện đã dùng dialog nhập lý do, không còn `window.prompt`.
- Kết quả xử lý moderation đã hiện bằng toast.

**Chưa đủ / lệch spec**
- Chưa có entity riêng cho HR report/escalation.
- Chưa có action `warn user` riêng.
- Tên nút `Apply action` còn hơi generic, chưa tách thành `Lock user` / `Remove resource` / `Cancel event`.

**Mức hoàn thiện thực tế**
- Đã có module dùng được ở mức nền tảng.
- Nếu muốn bám spec sâu hơn, nên tách report workflow thành module riêng.

---

## 5. Global Settings

**Spec yêu cầu**
- SMTP settings
- OAuth credentials
- meeting platform API keys
- maintenance mode
- system-wide banner

**Đánh giá:** `Tương đối`

**Đã làm được**
- `overview` của admin có trả về `PlatformSettings`:
  - environment
  - Google OAuth configured hay chưa
  - SMTP configured hay chưa
  - invite expiry days
  - refresh token days
  - maintenance mode
  - system-wide banner
  - frontend URLs
- Tham chiếu:
  - [api/InnerG.Api/Controllers/AdminController.cs](api/InnerG.Api/Controllers/AdminController.cs)
  - [api/InnerG.Api/DTOs/AdminDTOs.cs](api/InnerG.Api/DTOs/AdminDTOs.cs)
- Mục `Platform` đã đi qua sidebar trái.
- Platform settings hiện dùng dialog để cập nhật:
  - invite expiry days
  - refresh token days
  - maintenance mode
  - system-wide banner
  - frontend origins
- Backend cập nhật các giá trị này vào `appsettings.json`.

**Chưa đủ / lệch spec**
- Không thấy cấu hình Zoom/Microsoft dưới dạng module thao tác được.
- OAuth/SMTP hiện vẫn chỉ hiển thị trạng thái configured/missing, chưa nhập secret trực tiếp từ UI.

**Mức hoàn thiện thực tế**
- Đã chỉnh được các policy nền tảng không nhạy cảm.
- Chưa phải một global settings module hoàn chỉnh cho secret/integration management.

---

## 6. System Analytics

**Spec yêu cầu**
- Tổng số công ty active.
- Tổng số user toàn hệ thống.
- Tổng số lớp học trong tháng.
- Retention theo company.
- Storage usage tổng thể.

**Đánh giá:** `Tương đối+`

**Đã làm được**
- Admin dashboard có overview khá tốt:
  - total companies
  - active companies
  - total users
  - classes this month
  - storage usage tổng thể
  - storage quota tổng thể
  - platform storage used percent
  - average retention rate
  - pending invites
  - active subscriptions
  - active sessions
  - privileged accounts
  - audit events 7 ngày
  - role distribution
  - company growth trend
  - subscription health
  - recent activity
- Có thể xem đây là analytics vận hành hệ thống ở mức khá hữu dụng.

**Chưa đủ / lệch spec**
- Retention hiện tính theo user active có `LastLoginAt` trong 30 ngày gần nhất; chưa phải cohort retention nâng cao.
- Storage usage lấy từ `Resource.FileSizeBytes`, nên chỉ chính xác với resource có lưu file size.

**Mức hoàn thiện thực tế**
- Có dashboard thật và dùng được.
- Nhưng chưa phủ hết các chỉ số phân tích sâu mà spec có thể kỳ vọng.

---

## 7. UX / Interaction hiện tại

**Đã làm được**
- Điều hướng admin đã chuyển sang dùng sidebar trái của app.
- Các thao tác create/update chính đã dùng dialog:
  - create company
  - edit company
  - manage subscription
  - edit platform settings
  - moderation action
- Các thao tác nguy hiểm đã có dialog xác nhận riêng:
  - activate/deactivate company
  - delete company
- Feedback thành công/thất bại đã dùng toast thay cho banner trong page.

**Chưa đủ**
- Một số flow ngoài admin ở repo vẫn còn `window.confirm` hoặc `window.prompt`.
- Riêng trong admin, moderation action đã là dialog nhưng nội dung action label còn có thể cụ thể hơn.

---

## 8. Tổng kết riêng cho System Admin

### Những phần đã làm được

- Tạo company mới và tạo HR đầu tiên
- Xem danh sách company
- Xem company detail
- Activate / deactivate / update / soft delete company
- Gán subscription plan cho company
- Xem audit/activity cơ bản
- Filter/export audit log
- Xem và chỉnh một số platform settings
- Xem analytics vận hành gồm user, class tháng này, storage, retention
- Xử lý moderation queue ở mức nền tảng
- Điều hướng admin qua sidebar trái
- Dùng dialog cho create/update/action chính
- Dùng toast cho feedback thao tác

### Những phần chưa làm hoặc chưa hoàn chỉnh

- CRUD subscription plan
- Nhập/chỉnh OAuth, SMTP, Zoom/Microsoft credentials trực tiếp từ UI
- Entity riêng cho HR report/escalation
- Retention analytics dạng cohort nâng cao
- Field audit result `SUCCESS / FAILED`
- Action `warn user`

### Đánh giá chung

- Phần **System Admin** hiện ở mức `khá+ cho vận hành cơ bản`.
- Điểm mạnh là đã có **dashboard admin thật**, có **company management**, **subscription flow cơ bản**, **audit/export**, và **moderation action**.
- Điểm còn thiếu chủ yếu là chiều sâu nâng cao:
  1. CRUD plan
  2. Secret management cho OAuth/SMTP/Zoom/Microsoft
  3. Entity report/escalation riêng
  4. Audit result và retention cohort
  5. Moderation workflow chi tiết hơn

### Kết luận ngắn

- Nếu câu hỏi là **“phần admin đã làm được chưa?”** thì câu trả lời là: **đã làm được phần lõi và đã có thể vận hành được ở mức khá ổn**.
- Nếu câu hỏi là **“đã hoàn chỉnh tuyệt đối theo spec chưa?”** thì câu trả lời là: **chưa, vẫn còn vài phần nâng cao và vài module quản trị sâu cần làm thêm**.

---

## 9. Checklist tiến độ ngắn gọn

### Đã xong

- [x] Điều hướng System Admin bằng sidebar trái của app
- [x] Overview dashboard cho system admin
- [x] Danh sách company toàn hệ thống
- [x] Tạo company mới và tạo HR đầu tiên
- [x] Xem company detail
- [x] Update company
- [x] Activate / deactivate company
- [x] Soft delete company
- [x] Gán subscription plan cho company
- [x] Hiển thị usage theo company: users / classes / storage
- [x] Cảnh báo near limit / over limit
- [x] Xem audit log
- [x] Filter audit log
- [x] Export audit log CSV
- [x] Xem moderation queue
- [x] Thực hiện moderation action: lock user / remove resource / cancel event
- [x] Xem platform settings tổng quan
- [x] Chỉnh invite TTL / refresh token TTL / maintenance mode / banner / frontend origins
- [x] Dùng dialog cho create/update/action chính
- [x] Dùng toast cho feedback thao tác

### Chưa xong

- [ ] CRUD subscription plan
- [ ] UI nhập/chỉnh OAuth credentials
- [ ] UI nhập/chỉnh SMTP credentials
- [ ] UI nhập/chỉnh Zoom / Microsoft meeting credentials
- [ ] Entity riêng cho HR report / escalation
- [ ] Moderation action kiểu `warn user`
- [ ] Audit result chuẩn kiểu `SUCCESS / FAILED`
- [ ] Retention analytics dạng cohort nâng cao
- [ ] Billing history / invoice / payment tracking
- [ ] Bulk action cho nhiều company

### Nên làm tiếp trước

- [ ] Đổi `Apply action` ở moderation thành label cụ thể theo từng loại action
- [ ] Tách report/escalation thành entity riêng thay vì suy từ audit log
- [ ] Làm CRUD subscription plan
- [ ] Bổ sung phần secret/integration management cho OAuth / SMTP / meeting platforms
- [ ] Hoàn thiện audit log với kết quả action `SUCCESS / FAILED`
