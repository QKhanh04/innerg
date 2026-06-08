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
- `SystemAdmin` hiện không còn thuộc một company cố định:
  - `CompanyId` của system admin có thể là `null`
  - login/session vẫn hoạt động bình thường ở mức platform
  - phần admin không còn phụ thuộc vào tenant gốc để chạy

**Chưa đủ / lệch spec**
- Company detail vẫn là snapshot gọn, chưa phải màn quản trị sâu theo từng tenant.
- Bulk action hiện mới tập trung vào activate/deactivate theo lô, chưa mở sang delete hay bulk plan assignment.

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
- Đã có CRUD subscription plan:
  - tạo plan
  - update plan
  - archive / delete plan tùy trạng thái sử dụng
- Có service phía web:
  - [web/src/services/adminService.js](web/src/services/adminService.js)
- Mục `Subscriptions` đã đi qua sidebar trái.
- Mỗi company có nút `Manage plan` mở dialog cập nhật subscription.
- Có catalog plan riêng trong UI admin:
  - tạo mới bằng dialog
  - sửa bằng dialog
  - archive / delete bằng confirm dialog
- Có hiển thị:
  - plan hiện tại
  - subscription status
  - ngày hết hạn
  - số user
  - số lớp trong tháng
  - storage used / quota
  - trạng thái `Within plan`, `Near plan limit`, `Over plan limit`

**Chưa đủ / lệch spec**
- Billing hiện ở mức invoice/history nội bộ cho admin, chưa tích hợp payment gateway thật hoặc webhook thu tiền tự động.

**Mức hoàn thiện thực tế**
- Đủ cho tác vụ assign plan, kiểm tra usage, và theo dõi billing records / payment status cơ bản.
- Chưa đủ chiều sâu để gọi là subscription management đầy đủ kiểu production billing stack.

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
  - create / update / archive / delete subscription plan
  - assign subscription
  - moderation action
  - update platform settings
- Audit log hiện đã có field `result` ở response/UI và export CSV.
- Các mutation chính của system admin hiện đã ghi `FAILED` có hệ thống khi ném `AppException`:
  - company status / update / delete
  - create / update / delete subscription plan
  - assign subscription
  - moderation lock / remove / cancel
  - update platform settings

**Chưa đủ / lệch spec**
- Hiện đã thể hiện `SUCCESS / FAILED` rõ ràng cho các flow mutate chính của admin.
- Chưa phải mọi lỗi hệ thống ngoài `AppException` đều được chuẩn hóa thành audit `FAILED` một cách đầy đủ ở toàn bộ module ngoài admin.

**Mức hoàn thiện thực tế**
- Có nền audit log thật và usable.
- Nhưng vẫn mới ở mức xem log cơ bản + export.

---

## 4. Moderation

**Spec yêu cầu**
- Tiếp nhận báo cáo từ HR về nội dung vi phạm.
- Xem xét và xử lý: xóa nội dung, cảnh báo user, khóa tài khoản.

**Đánh giá:** `Tương đối+`

**Đã làm được**
- Có tab `Moderation` trong admin dashboard.
- Có API queue moderation ở tầng system admin:
  - [api/InnerG.Api/Controllers/AdminController.cs](api/InnerG.Api/Controllers/AdminController.cs)
- Queue hiện lấy từ:
  - entity `ModerationEscalationReport` riêng cho HR escalation
  - các `TrainingEvent` đang `PendingApproval`
- HR hiện đã có endpoint tạo escalation riêng và admin queue đọc trực tiếp từ entity này thay vì suy từ audit log.
- Admin có thể thao tác:
  - cảnh báo user nếu target là `AppUser`
  - khóa user nếu target là `AppUser`
  - xóa resource nếu target là `Resource`
  - cancel + soft delete training event nếu target là `TrainingEvent`
- `Apply action` hiện đã dùng dialog nhập lý do, không còn `window.prompt`.
- Với `AppUser`, dialog moderation hiện cho phép chọn giữa `Warn user` và `Lock user`.
- Kết quả xử lý moderation đã hiện bằng toast.
- HR moderation page hiện đã:
  - dùng dialog thay cho `window.prompt` khi reject/escalate
  - có tab review riêng cho `Resource`
  - có escalation history với trạng thái `Pending / Resolved / Dismissed`
  - cho HR escalate trực tiếp `TrainingEvent` và `Resource` từ UI
- Màn `HR Members` hiện đã có action `Escalate User` để tạo escalation cho `AppUser` ngay từ member management.

**Chưa đủ / lệch spec**
- Workflow moderation hiện đã có `Report Center` hợp nhất cho `TrainingEvent`, `Resource`, và `AppUser`.

**Mức hoàn thiện thực tế**
- Đã có module dùng được khá tròn cho event/resource/user.
- Report workflow đã có entity riêng và queue riêng.
- HR hiện có thể xem workflow đa target ở một nơi thay vì phải chỉ tự ghép từ nhiều màn riêng.

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
  - Zoom configured hay chưa
  - Microsoft OAuth configured hay chưa
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
  - Google OAuth client ID / secret
  - SMTP host / port / username / password / from name / SSL
  - Zoom client ID / secret
  - Microsoft client ID / secret / tenant ID
- Backend cập nhật các giá trị này vào `appsettings.json`.
- Secret/integration settings hiện đồng bộ vào file env đang được app dùng:
  - `api/.env`
  - `web/.env` cho `VITE_GOOGLE_CLIENT_ID`
- Audit log của platform settings hiện đã sanitize secret, chỉ log trạng thái cập nhật chứ không ghi raw secret.

**Chưa đủ / lệch spec**
- Chưa có secret vault riêng hoặc cơ chế mã hóa secret trong database.
- Google client ID phía web vẫn cần rebuild frontend để áp dụng giá trị `VITE_GOOGLE_CLIENT_ID` mới.

**Mức hoàn thiện thực tế**
- Đã chỉnh được cả policy nền tảng và integration credentials chính ngay từ admin UI.
- Chưa phải secret management hoàn chỉnh kiểu production-grade vault/rotation.

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
  - cohort retention theo tháng với các mốc `D30 / D60 / D90`
- Có thể xem đây là analytics vận hành hệ thống ở mức khá hữu dụng.

**Chưa đủ / lệch spec**
- Cohort retention hiện dựa trên `CreatedAt` và `LastLoginAt`, chưa phải behavioral cohort rất sâu theo nhiều loại activity.
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
  - create/edit subscription plan
  - edit platform settings
  - moderation action
- Các thao tác nguy hiểm đã có dialog xác nhận riêng:
  - activate/deactivate company
  - delete company
  - archive/delete subscription plan
- Feedback thành công/thất bại đã dùng toast thay cho banner trong page.
- Moderation action đã dùng label cụ thể theo loại:
  - `Lock user`
  - `Remove resource`
  - `Cancel event`
- Các flow web còn sót trước đây như HR wishlist reject, invitation delete/bulk delete, mentor cancel class, và member management confirm hiện cũng đã chuyển sang dialog riêng.

**Chưa đủ**
- Riêng trong admin, moderation action đã là dialog nhưng nội dung action label còn có thể cụ thể hơn.

---

## 8. Tổng kết riêng cho System Admin

### Những phần đã làm được

- Tạo company mới và tạo HR đầu tiên
- System admin hoạt động ở mức platform, không thuộc company nào
- Xem danh sách company
- Xem company detail
- Activate / deactivate / update / soft delete company
- Gán subscription plan cho company
- CRUD subscription plan
- Xem audit/activity cơ bản
- Filter/export audit log
- Hiển thị audit result `SUCCESS / FAILED`
- Xem và chỉnh một số platform settings
- Xem analytics vận hành gồm user, class tháng này, storage, retention
- Xử lý moderation queue ở mức nền tảng
- Thực hiện moderation action `warn user`
- Có entity riêng cho HR report/escalation
- Nhập/chỉnh OAuth, SMTP, Zoom/Microsoft credentials từ admin UI
- Bulk activate/deactivate cho nhiều company
- Retention analytics dạng cohort nâng cao
- Billing history / invoice / payment tracking cơ bản
- Điều hướng admin qua sidebar trái
- Dùng dialog cho create/update/action chính
- Dùng toast cho feedback thao tác

### Những phần chưa làm hoặc chưa hoàn chỉnh

### Đánh giá chung

- Phần **System Admin** hiện ở mức `khá+ cho vận hành cơ bản`.
- Điểm mạnh là đã có **dashboard admin thật**, có **company management**, **subscription flow cơ bản**, **audit/export**, và **moderation action**.
- Điểm còn thiếu chủ yếu là chiều sâu nâng cao:
  1. Moderation workflow chi tiết hơn
  2. Coverage UI rộng hơn cho escalation/report
  3. Secret storage/rotation theo hướng production-grade
  4. Billing/payment depth

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
- [x] Xóa company sẽ revoke session hiện có của user trong company và chặn truy cập tiếp bằng JWT validation theo trạng thái company
- [x] System admin không thuộc company nào
- [x] Gán subscription plan cho company
- [x] CRUD subscription plan
- [x] Bulk action cho nhiều company
- [x] Hiển thị usage theo company: users / classes / storage
- [x] Cảnh báo near limit / over limit
- [x] Retention analytics dạng cohort nâng cao
- [x] Xem audit log
- [x] Filter audit log
- [x] Export audit log CSV
- [x] Hiển thị audit result `SUCCESS / FAILED`
- [x] Xem moderation queue
- [x] Thực hiện moderation action: warn user / lock user / remove resource / cancel event
- [x] Entity riêng cho HR report / escalation
- [x] Dùng label moderation cụ thể theo action type
- [x] HR moderation UI cho event/resource + escalation history
- [x] Escalate `AppUser` trực tiếp từ HR member management
- [x] Xem platform settings tổng quan
- [x] Chỉnh invite TTL / refresh token TTL / maintenance mode / banner / frontend origins
- [x] UI nhập/chỉnh OAuth credentials
- [x] UI nhập/chỉnh SMTP credentials
- [x] UI nhập/chỉnh Zoom / Microsoft meeting credentials
- [x] Billing history / invoice / payment tracking
- [x] Dùng dialog cho create/update/action chính
- [x] Dùng toast cho feedback thao tác

### Chưa xong

### Nên làm tiếp trước

- [x] Gom moderation/report thành workflow đa target thống nhất hơn
