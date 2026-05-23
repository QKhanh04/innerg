# InnerG — System Specification Document

> **Version:** 1.0 | **Audience:** Development Team

---

## Table of Contents

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Kiến trúc Role trong hệ thống](#2-kiến-trúc-role-trong-hệ-thống)
3. [Authentication & Authorization Flow](#3-authentication--authorization-flow)
4. [Company / Workspace Management](#4-company--workspace-management)
5. [Mentee Module](#5-mentee-module)
6. [Mentor Module](#6-mentor-module)
7. [HR / Company Admin Module](#7-hr--company-admin-module)
8. [Class & Session Flow (Booking)](#8-class--session-flow-booking)
9. [Notification System](#9-notification-system)
10. [AI Features](#10-ai-features)
11. [System Admin Module](#11-system-admin-module)
12. [Data & Entity Overview](#12-data--entity-overview)
13. [System Rules & Business Rules](#13-system-rules--business-rules)
14. [Future Scalability](#14-future-scalability)

---

## 1. Tổng quan hệ thống

### 1.1. InnerG là gì

InnerG là nền tảng SaaS B2B dạng multi-tenant, cho phép doanh nghiệp xây dựng hệ sinh thái học tập nội bộ. Hệ thống kết nối nhân viên có nhu cầu học kỹ năng (Mentee) với nhân viên có chuyên môn sẵn sàng chia sẻ (Mentor) trong cùng một tổ chức.

### 1.2. Mục tiêu hệ thống

- Cung cấp nền tảng tạo, quản lý và tham gia lớp học nội bộ.
- Hệ thống hóa dữ liệu năng lực nhân sự để HR theo dõi và phân tích.
- Tự động hóa lịch học, thông báo, điểm thưởng và báo cáo.
- Cung cấp công cụ cho HR để quản lý toàn bộ vòng đời học tập nội bộ.

### 1.3. Các nhóm người dùng chính

| Role | Mô tả ngắn |
|---|---|
| Guest | Chưa đăng nhập, chỉ xem trang giới thiệu |
| Mentee | Nhân viên học tập, đăng ký lớp, đề xuất kỹ năng |
| Mentor | Nhân viên giảng dạy, tạo lớp, upload tài liệu |
| HR Manager | Quản lý toàn bộ hệ thống trong phạm vi công ty |
| System Admin | Quản trị toàn bộ nền tảng ở tầng hạ tầng |

### 1.4. Cách hệ thống hoạt động tổng quát

```
[Company onboarding]
        |
        v
[HR tạo workspace, import nhân viên]
        |
        v
[Nhân viên nhận invite → đăng ký tài khoản]
        |
        +--> Mentor: tạo lớp học / upload tài liệu
        |
        +--> Mentee: tìm kiếm lớp / đăng ký / học
        |
        +--> Learning Wishlist: đề xuất nhu cầu → HR gom nhóm → mở lớp
        |
        v
[Lớp diễn ra → Feedback 360° → Cộng InnerG Points cho Mentor]
        |
        v
[HR xem Analytics → Export báo cáo → Tích hợp KPI]
```

---

## 2. Kiến trúc Role trong hệ thống

### 2.1. Guest

- **Mục đích:** Người chưa xác thực, chỉ có thể truy cập trang marketing/landing page.
- **Quyền hạn:** Chỉ đọc trang công khai.
- **Module truy cập:** Landing page, trang đăng nhập, trang quên mật khẩu.
- **Hành động chính:** Đăng nhập, nhập invite link.

---

### 2.2. Mentee

- **Mục đích:** Nhân viên trong công ty muốn học kỹ năng từ đồng nghiệp.
- **Quyền hạn:**
  - Xem và đăng ký lớp học.
  - Gửi Learning Wishlist.
  - Tải tài liệu từ Resource Hub (chỉ lớp đã đăng ký).
  - Đánh giá Mentor sau buổi học.
  - Xem hồ sơ cá nhân, lịch sử học tập, InnerG Points cá nhân.
- **Module truy cập:** Dashboard, Skill Marketplace, Learning Wishlist, Resource Hub (restricted), Profile, Notification, Calendar cá nhân, Feedback.
- **Hành động chính:**

| Hành động | Điều kiện |
|---|---|
| Đăng ký lớp học | Lớp còn chỗ, chưa đăng ký trước đó |
| Hủy đăng ký | Trước giờ học ít nhất X giờ (HR cấu hình) |
| Vào danh sách chờ | Lớp đã đầy |
| Gửi Learning Wishlist | Tài khoản active |
| Upvote Wishlist của người khác | Chưa upvote cùng item đó |
| Đánh giá Mentor | Sau khi lớp kết thúc, trong vòng X ngày |
| Xem tài liệu / Download | Đã đăng ký lớp tương ứng |

---

### 2.3. Mentor

- **Mục đích:** Nhân viên chuyên môn, đăng ký chia sẻ kiến thức nội bộ.
- **Quyền hạn:**
  - Tạo, chỉnh sửa, hủy lớp học.
  - Upload / quản lý tài liệu trong lớp của mình.
  - Xem danh sách học viên đăng ký.
  - Đánh giá thái độ Mentee sau buổi học.
  - Xem thống kê lớp học, InnerG Points cá nhân.
- **Module truy cập:** Tất cả module của Mentee + Class Management, Resource Hub (full cho lớp của mình), Mentor Analytics, Feedback (gửi đi).
- **Hành động chính:**

| Hành động | Điều kiện |
|---|---|
| Tạo lớp học | Tài khoản có role Mentor |
| Chỉnh sửa lớp | Lớp chưa diễn ra |
| Hủy lớp | Lớp chưa diễn ra; hệ thống gửi thông báo cho học viên |
| Duyệt / từ chối học viên | Nếu lớp ở chế độ approval |
| Upload tài liệu | Thuộc lớp của mình |
| Đánh giá Mentee | Sau khi lớp kết thúc |

> Một user có thể vừa là Mentor vừa là Mentee trong các lớp khác nhau.

---

### 2.4. HR Manager

- **Mục đích:** Quản lý toàn bộ hoạt động học tập và nhân sự trong phạm vi công ty.
- **Quyền hạn:** Toàn bộ quyền trong workspace của công ty, không vượt sang workspace khác.
- **Module truy cập:** Tất cả module + Employee Management, Analytics Dashboard, Wishlist Management, Reward Configuration, Department Management, Report Export, Content Moderation.
- **Hành động chính:**

| Hành động | Mô tả |
|---|---|
| Invite / import nhân viên | Thêm user vào workspace |
| Tạo lớp học thay Mentor | Trong trường hợp đặc biệt |
| Duyệt nội dung | Duyệt lớp học, tài liệu trước khi xuất bản |
| Cấu hình điểm thưởng | Tỷ lệ điểm, ngưỡng mốc, danh mục quà |
| Xem toàn bộ hồ sơ nhân viên | Lịch sử học tập, kỹ năng, điểm đánh giá |
| Gửi thông báo diện rộng | Theo phòng ban hoặc toàn công ty |
| Export báo cáo | PDF, Excel |
| Quản lý Wishlist | Duyệt, gom nhóm, gán Mentor |

---

### 2.5. System Admin

- **Mục đích:** Quản trị hạ tầng nền tảng, không liên quan đến nghiệp vụ học tập.
- **Quyền hạn:** Truy cập tất cả workspace và dữ liệu toàn hệ thống.
- **Module truy cập:** Admin Panel (riêng), Audit Log, Global Settings, Company Management, Subscription Management.
- **Hành động chính:**

| Hành động | Mô tả |
|---|---|
| Tạo / khóa / xóa company | Quản lý toàn bộ tenant |
| Quản lý subscription | Gán plan, gia hạn, nâng cấp |
| Xem audit log | Toàn bộ hành động quan trọng trên hệ thống |
| Cấu hình tích hợp global | Zoom, Google, Microsoft |
| Backup & restore | Dữ liệu toàn hệ thống |
| Moderation nội dung vi phạm | Xử lý báo cáo từ HR |

---

## 3. Authentication & Authorization Flow

### 3.1. Authentication

#### 3.1.1. Đăng ký tài khoản (Register via Invite)

InnerG không có đăng ký công khai. Tài khoản chỉ được tạo thông qua lời mời từ HR hoặc System Admin.

```
[HR gửi invite qua email]
        |
        v
[User nhận email → click link invite]
        |
        v
[Hệ thống kiểm tra: token còn hiệu lực? (mặc định 7 ngày)]
        |
   [Hợp lệ]                    [Hết hạn / đã dùng]
        |                               |
        v                               v
[Form điền thông tin:          [Hiển thị lỗi, yêu cầu
 tên, mật khẩu, avatar]         HR gửi lại invite]
        |
        v
[Hệ thống tạo User + gán role + gán vào company]
        |
        v
[Redirect vào Dashboard]
```

**Trạng thái invite:**
- `PENDING` — Đã gửi, chưa dùng.
- `ACCEPTED` — Đã đăng ký.
- `EXPIRED` — Quá 7 ngày (hoặc thời gian HR cấu hình).
- `REVOKED` — HR thu hồi thủ công.

---

#### 3.1.2. Đăng nhập (Login)

**Phương thức 1: Email + Password**

```
[User nhập email + password]
        |
        v
[Kiểm tra email tồn tại trong system]
        |
   [Không tồn tại] → Lỗi: "Email không hợp lệ"
        |
   [Tồn tại] → Kiểm tra password hash
        |
   [Sai password] → Lỗi + đếm thất bại (max 5 lần → khóa tạm)
        |
   [Đúng] → Kiểm tra 2FA bật chưa
        |
   [2FA bật] → Yêu cầu OTP
   [2FA tắt] → Tạo session / JWT token → Redirect Dashboard
```

**Phương thức 2: SSO (Google Workspace / Microsoft Azure AD)**

```
[User click "Đăng nhập với Google/Microsoft"]
        |
        v
[Redirect đến OAuth provider]
        |
        v
[Provider trả về token + email]
        |
        v
[Hệ thống kiểm tra email có trong workspace nào không]
        |
   [Có] → Đăng nhập, tạo session
   [Không] → Lỗi: "Tài khoản chưa được cấp quyền"
```

> **Edge case:** Một email có thể thuộc nhiều workspace (nhiều công ty). Sau đăng nhập, hệ thống hiển thị màn hình chọn workspace nếu có nhiều hơn 1.

---

#### 3.1.3. Forgot Password / Reset Password

```
[User nhập email tại trang "Quên mật khẩu"]
        |
        v
[Hệ thống kiểm tra email tồn tại]
        |
   [Không tồn tại] → Vẫn hiển thị "Nếu email hợp lệ, bạn sẽ nhận được mail"
   (Bảo mật: không tiết lộ email có tồn tại hay không)
        |
   [Tồn tại] → Tạo reset token (expire sau 1 giờ) → Gửi email
        |
        v
[User click link trong email]
        |
        v
[Kiểm tra token còn hiệu lực]
        |
   [Hết hạn] → Yêu cầu gửi lại
   [Hợp lệ]  → Hiển thị form nhập mật khẩu mới
        |
        v
[Validate: mật khẩu đủ mạnh, xác nhận trùng khớp]
        |
        v
[Lưu password mới + vô hiệu hóa token + thu hồi tất cả session cũ]
```

---

#### 3.1.4. Two-Factor Authentication (2FA)

- Khi bật: sau khi nhập đúng email + password, hệ thống yêu cầu OTP.
- OTP gửi qua email hoặc app Authenticator (TOTP — Google Authenticator / Authy).
- OTP hết hạn sau 5 phút.
- Sai OTP 3 lần liên tiếp → khóa phiên, yêu cầu đăng nhập lại từ đầu.

---

#### 3.1.5. Session Management

- Token-based (JWT + Refresh Token) hoặc server-side session (quyết định khi thiết kế backend).
- Access Token: expire ngắn (15–60 phút).
- Refresh Token: expire dài (7–30 ngày), lưu HttpOnly cookie.
- User có thể xem danh sách thiết bị đang đăng nhập và đăng xuất từng thiết bị.
- HR / Admin có thể thu hồi toàn bộ session của một user.

---

### 3.2. Authorization

#### 3.2.1. Role-Based Access Control (RBAC)

Mỗi request đến API đều phải qua middleware kiểm tra:
1. Token hợp lệ chưa? (Authentication)
2. User có role phù hợp không? (Authorization)
3. Resource thuộc company của user không? (Company scope)

#### 3.2.2. Permission Matrix

| Hành động | Mentee | Mentor | HR | Admin |
|---|:---:|:---:|:---:|:---:|
| Xem lớp học | ✅ | ✅ | ✅ | ✅ |
| Đăng ký lớp học | ✅ | ✅ | ✅ | — |
| Tạo lớp học | — | ✅ | ✅ | — |
| Chỉnh sửa lớp học | — | ✅ (lớp mình) | ✅ | — |
| Xóa lớp học | — | — | ✅ | ✅ |
| Upload tài liệu | — | ✅ (lớp mình) | ✅ | — |
| Xem analytics toàn công ty | — | — | ✅ | ✅ |
| Quản lý nhân viên | — | — | ✅ | ✅ |
| Cấu hình điểm thưởng | — | — | ✅ | — |
| Xem audit log | — | — | — | ✅ |
| Quản lý company | — | — | — | ✅ |

#### 3.2.3. Company-Scoped Permission

- Mọi resource (lớp học, tài liệu, user, analytics) đều gắn với `company_id`.
- User chỉ truy cập được resource trong công ty mình.
- HR chỉ có quyền trong company của mình, không cross-company.
- System Admin là role duy nhất có thể truy cập cross-company.

---

## 4. Company / Workspace Management

### 4.1. Company Onboarding

```
[System Admin tạo company record]
        |
        v
[Cấu hình thông tin: tên công ty, domain email, logo, timezone, ngôn ngữ]
        |
        v
[Gán plan (Free / Pro / Enterprise)]
        |
        v
[Tạo tài khoản HR đầu tiên (Company Admin)]
        |
        v
[HR nhận email mời → Đăng ký → Truy cập workspace]
```

**Thông tin bắt buộc khi tạo company:**
- Tên công ty
- Domain email hợp lệ (ví dụ: `@company.com`) này hên xui nha cốt! tự lên idea
- Múi giờ (dùng cho scheduling)
- Ngôn ngữ mặc định

---

### 4.2. Invite Employee

**Invite đơn lẻ:**
```
[HR nhập email nhân viên + chọn role + chọn phòng ban]
        |
        v
[Validate: email thuộc domain công ty? Email chưa tồn tại trong hệ thống?]
        |
   [Không hợp lệ] → Báo lỗi cụ thể
   [Hợp lệ]       → Tạo invite record (status: PENDING) → Gửi email
```

**Invite hàng loạt (Import CSV/Excel):**
```
[HR upload file CSV/Excel với cột: email, tên, phòng ban, chức vụ, role]
        |
        v
[Hệ thống validate từng dòng: format, duplicate, domain]
        |
        v
[Hiển thị preview: danh sách hợp lệ + danh sách lỗi]
        |
        v
[HR xác nhận → hệ thống gửi invite hàng loạt]
        |
        v
[Lưu kết quả: X invite gửi thành công, Y lỗi]
```

### 4.3. Member Management

| Hành động | Điều kiện |
|---|---|
| Xem danh sách nhân viên | HR role |
| Thay đổi role nhân viên | HR role; không thể tự thay đổi role của chính mình |
| Vô hiệu hóa tài khoản | HR role; user bị vô hiệu hóa không đăng nhập được, dữ liệu vẫn giữ |
| Xóa tài khoản | HR role; soft delete — dữ liệu lịch sử không bị xóa |
| Gán Mentor role | HR chọn nhân viên → gán role Mentor |

---

## 5. Mentee Module

### 5.1. Dashboard

**Mục tiêu:** Tổng quan nhanh về hoạt động học tập của Mentee.

**Nội dung hiển thị:**
- Lớp học sắp tới (trong 7 ngày tới).
- Lớp đang đăng ký chờ xác nhận.
- Thông báo mới chưa đọc.
- InnerG Points cá nhân hiện tại.
- Gợi ý lớp học dựa trên Skill Profile.
- Learning Wishlist đang theo dõi (trạng thái hiện tại).

---

### 5.2. Profile

**Thông tin cơ bản:**
- Họ tên, ảnh đại diện, phòng ban, chức vụ, email nội bộ.

**Skill Profile:**
- Danh sách kỹ năng + mức độ thành thạo: `Beginner / Intermediate / Expert`.
- Mentee tự khai báo và cập nhật.
- HR có thể xem toàn bộ.

**Learning Wishlist cá nhân:**
- Danh sách kỹ năng muốn học.
- Trạng thái từng item: `Pending / Matched / Scheduled / Completed`.

**Badge & Thành tích:**
- Hiển thị badge đã nhận (từ hệ thống tự động cấp).
- Xếp hạng trên bảng vinh danh.

**Lịch sử học tập:**
- Danh sách các lớp đã tham gia, ngày học, điểm đánh giá Mentor từ mình.

---

### 5.3. Skill Marketplace — Tìm kiếm & Đăng ký lớp học

**Feed lớp học:**
- Trang chính hiển thị các lớp học sắp diễn ra theo dạng card/feed.
- Mỗi card hiển thị: tiêu đề, Mentor, ngày giờ, số chỗ còn, kỹ năng, hình thức (online/offline).

**Tìm kiếm:**
- Tìm theo: tên lớp, tên Mentor, tên kỹ năng, phòng ban, thời gian.
- Bộ lọc: trạng thái (Mở / Đầy / Sắp diễn ra / Đã kết thúc), hình thức (Online / Offline), cấp độ.

**Flow đăng ký lớp:**
```
[Mentee click "Đăng ký" trên card lớp học]
        |
        v
[Kiểm tra: còn chỗ không?]
        |
   [Còn chỗ] → Tạo Enrollment record (status: CONFIRMED)
               → Thêm vào lịch cá nhân
               → Gửi email xác nhận
               → Thông báo cho Mentor
        |
   [Hết chỗ] → Tạo Waitlist record
               → Thông báo "Bạn đã vào danh sách chờ, vị trí #N"
```

**Hủy đăng ký:**
```
[Mentee hủy đăng ký]
        |
        v
[Kiểm tra: còn trong thời gian cho phép hủy?]
        |
   [Được phép] → Xóa Enrollment
                → Kiểm tra Waitlist: nếu có → notify người đầu danh sách
                → Gửi email xác nhận hủy cho Mentee
                → Thông báo cho Mentor
        |
   [Quá hạn]   → Báo lỗi: "Không thể hủy sau X giờ trước giờ học"
```

---

### 5.4. Learning Wishlist

**Gửi đề xuất kỹ năng:**
```
[Mentee nhập tên kỹ năng + mô tả lý do + mức độ cần thiết (Low/Medium/High)]
        |
        v
[Hệ thống kiểm tra: kỹ năng này đã có đề xuất tương tự chưa?]
        |
   [Đã có] → Gợi ý "Đề xuất tương tự đang có N người quan tâm" → Mentee có thể Upvote thay vì tạo mới
   [Chưa có] → Tạo Wishlist item mới (status: PENDING)
```

**Upvote:**
- Mỗi user chỉ upvote 1 lần cho mỗi Wishlist item.
- Khi đạt ngưỡng (HR cấu hình, mặc định 5 người), hệ thống tự động thông báo HR.

**Theo dõi trạng thái:**
- `PENDING` → `REVIEWING` (HR đang xem xét) → `FINDING_MENTOR` → `SCHEDULED` (đã lên lịch) → `COMPLETED`
- Mentee nhận thông báo khi trạng thái thay đổi.

---

### 5.5. Calendar cá nhân

- Hiển thị tất cả lớp học đã đăng ký theo tuần/tháng.
- Đồng bộ hai chiều với Google Calendar / Outlook (nếu user cấp quyền).
- Hiển thị conflict warning nếu có 2 lớp trùng giờ.

---

### 5.6. Resource Hub (Kho tài liệu)

- Mentee có thể xem và tải tài liệu của các lớp đã tham gia.
- Tài liệu công khai (HR gán quyền) thì xem được mà không cần đăng ký lớp.

---

### 5.7. Feedback sau buổi học

- Sau khi lớp kết thúc, hệ thống tự động gửi thông báo "Đánh giá buổi học".
- Mentee đánh giá Mentor theo 4 tiêu chí: Nội dung, Trình bày, Tương tác, Hữu ích.
- Mỗi tiêu chí: 1–5 sao + nhận xét văn bản tự do.
- Tùy chọn gửi ẩn danh.
- Deadline đánh giá: X ngày sau buổi học (HR cấu hình, mặc định 3 ngày).

---

## 6. Mentor Module

### 6.1. Mentor Onboarding

```
[HR gán role Mentor cho nhân viên]
        |
        v
[User nhận thông báo "Bạn đã được gán role Mentor"]
        |
        v
[Mentor hoàn thiện Mentor Profile:
 - Danh sách kỹ năng có thể dạy + mức độ
 - Giới thiệu ngắn
 - Ảnh đại diện
 - Cài đặt lịch rảnh (Availability)]
        |
        v
[HR duyệt profile (nếu bật chế độ approval)]
        |
        v
[Mentor có thể tạo lớp học]
```

---

### 6.2. Mentor Profile

- **Kỹ năng có thể dạy:** Chọn từ danh mục kỹ năng chuẩn của công ty + mức độ.
- **Availability:** Mentor khai báo khung giờ rảnh theo tuần (Monday 9:00–11:00, etc.).
- **Thống kê cá nhân:** Tổng số lớp đã dạy, tổng số học viên, điểm trung bình đánh giá, InnerG Points.
- **Badge nhận được:** Hiển thị huy hiệu theo thành tích giảng dạy.

---

### 6.3. Tạo & Quản lý lớp học

**Tạo lớp mới:**

Form yêu cầu:
- Tiêu đề lớp học (bắt buộc)
- Kỹ năng mục tiêu (chọn từ danh mục)
- Mô tả + mục tiêu buổi học
- Yêu cầu đầu vào (nếu có)
- Hình thức: Online / Offline
  - Online: chọn nền tảng (Zoom / Google Meet / Teams) hoặc nhập link thủ công
  - Offline: chọn phòng (từ danh sách phòng HR quản lý) hoặc nhập địa điểm
- Ngày giờ (hoặc dùng Auto-Scheduler)
- Số chỗ tối đa
- Thời lượng (phút)
- Phòng ban mục tiêu (optional — dùng cho smart notification)
- Cấp độ kỹ năng đề xuất: Beginner / Intermediate / All
- Chế độ đăng ký: Open (ai cũng đăng ký được) / Approval Required

```
[Mentor submit form]
        |
        v
[Validate dữ liệu: tiêu đề, ngày giờ hợp lệ, không trùng lịch Mentor]
        |
        v
[Trạng thái lớp: DRAFT hoặc PENDING_APPROVAL (nếu HR bật kiểm duyệt)]
        |
   [DRAFT]            → Mentor publish → PUBLISHED
   [PENDING_APPROVAL] → HR duyệt → PUBLISHED / REJECTED
        |
        v
[Khi PUBLISHED: hệ thống gửi smart notification đến nhân viên liên quan]
```

**Chỉnh sửa lớp:**
- Được phép khi lớp chưa diễn ra.
- Nếu đã có học viên đăng ký: hệ thống tự gửi thông báo "Lớp học đã được cập nhật" cho tất cả học viên.

**Hủy lớp:**
```
[Mentor / HR click Hủy lớp]
        |
        v
[Nhập lý do hủy]
        |
        v
[Hệ thống gửi email + push notification cho tất cả học viên đã đăng ký]
        |
        v
[Xóa event khỏi calendar]
        |
        v
[Hoàn trả InnerG Points nếu đã được cộng trước]
```

---

### 6.4. Auto-Scheduler

```
[Mentor chọn "Gợi ý lịch tự động"]
        |
        v
[Hệ thống lấy:
  - Availability của Mentor
  - Lịch bận của Mentor (từ Google Calendar / Outlook nếu đã sync)
  - Lịch bận trung bình của phòng ban mục tiêu (aggregate)
  - Giờ làm việc của công ty (HR cấu hình)]
        |
        v
[Thuật toán tính "golden time slots" — khung giờ tối ưu]
        |
        v
[Hiển thị top 3 gợi ý cho Mentor chọn]
```

---

### 6.5. Quản lý học viên

- Xem danh sách học viên đã đăng ký (tên, phòng ban, ngày đăng ký).
- Nếu lớp ở chế độ Approval: Mentor duyệt/từ chối từng học viên kèm lý do.
- Xem danh sách chờ.
- Gửi thông báo chuẩn bị cho học viên (chức năng message hàng loạt).

---

### 6.6. Upload tài liệu (Resource Hub)

- Upload trước buổi học: học viên tải về để chuẩn bị.
- Upload sau buổi học: slide, recording link, tài liệu bổ sung.
- Định dạng hỗ trợ: PDF, DOCX, PPTX, XLSX, MP4, YouTube link.
- Phân quyền: chỉ học viên đã đăng ký lớp (hoặc public nếu Mentor chọn).

---

### 6.7. InnerG Points

- Điểm tự động tính sau khi lớp kết thúc và có đánh giá từ học viên.
- Công thức cơ bản: `Points = Số học viên tham gia × Hệ số điểm trung bình × Hệ số độ dài buổi học`
- HR cấu hình các hệ số này.
- Mentor xem lịch sử giao dịch điểm và đổi thưởng từ cửa hàng điểm.
** từ rồi làm cái này (Nice to have not must to have)
---

### 6.8. Mentor Analytics

- Tổng số lớp đã dạy, tổng số giờ, tổng số học viên.
- Biểu đồ điểm đánh giá theo thời gian.
- Top nhận xét tốt nhất từ học viên.
- Phân tích kỹ năng dạy nhiều nhất.

---

## 7. HR / Company Admin Module

### 7.1. Employee Management

**Mục tiêu:** Quản lý toàn bộ vòng đời nhân viên trong hệ thống.

**Danh sách nhân viên:**
- Bảng toàn bộ nhân viên với cột: Tên, Email, Phòng ban, Chức vụ, Role, Trạng thái, Ngày tham gia, Điểm học tập.
- Filter: theo phòng ban, role, trạng thái hoạt động.
- Search: tên, email.
- Export: Excel / CSV.

**Hành động trên từng nhân viên:**

| Hành động | Mô tả |
|---|---|
| Xem profile chi tiết | Lịch sử học, kỹ năng, điểm, badge |
| Chỉnh sửa thông tin | Phòng ban, chức vụ, role |
| Gán / thu hồi role Mentor | Thêm hoặc xóa role |
| Vô hiệu hóa tài khoản | User không đăng nhập được; dữ liệu giữ nguyên |
| Gửi lại invite | Nếu invite chưa dùng hoặc hết hạn |

---

### 7.2. Analytics Dashboard

**Mục tiêu:** Cung cấp cái nhìn tổng quan về sức khỏe học tập của tổ chức.

**Các chỉ số chính (KPIs):**
- Tổng số lớp học trong kỳ (tuần/tháng/quý).
- Tổng số giờ học tích lũy.
- Tỷ lệ tham gia (tổng đăng ký / tổng có thể đăng ký).
- Số nhân viên tham gia ít nhất 1 lớp / tổng nhân viên.
- Top 10 Mentor theo điểm đánh giá.
- Top 10 Learner theo giờ học tích lũy.

**Skill Map:**
- Bản đồ kỹ năng toàn công ty.
- Phòng ban nào có / thiếu kỹ năng gì.
- Kỹ năng nào đang được đề xuất nhiều nhất (từ Wishlist).
- Kỹ năng nào không có Mentor nội bộ.

**Biểu đồ:**
- Xu hướng học tập theo thời gian (line chart).
- Phân bổ hoạt động theo phòng ban (bar chart).
- Tỷ lệ hoàn thành lớp học (pie chart).

---

### 7.3. Wishlist Management

```
[Hệ thống tự động thông báo HR khi Wishlist item đạt ngưỡng]
        |
        v
[HR vào trang Wishlist Management]
        |
        v
[Xem danh sách item: tên kỹ năng, số lượt upvote, trạng thái, người đề xuất]
        |
        v
[HR chọn action:]
   a) "Tìm Mentor nội bộ" → Hệ thống gợi ý nhân viên có kỹ năng phù hợp
                           → HR liên hệ / gán Mentor → Tạo lớp học
   b) "Đánh dấu: cần chuyên gia bên ngoài" → Xử lý ngoài hệ thống
   c) "Từ chối / Tạm hoãn" → Kèm lý do → Thông báo người đề xuất
```

---

### 7.4. Content Moderation (Kiểm duyệt nội dung)

- HR duyệt lớp học và tài liệu trước khi xuất bản (nếu bật).
- Queue duyệt: danh sách chờ với thông tin đầy đủ.
- Hành động: Duyệt (APPROVED) / Từ chối (REJECTED kèm lý do).
- Khi từ chối: hệ thống thông báo cho Mentor và ghi rõ lý do.

---

### 7.5. Reward Configuration

HR cấu hình toàn bộ hệ thống InnerG Points:

| Cấu hình | Mô tả |
|---|---|
| Công thức tính điểm | Hệ số theo số học viên, điểm đánh giá, thời lượng |
| Mốc thành tích | Điểm cần đạt để nhận badge |
| Danh mục quà tặng | Ngày nghỉ phép, voucher, vinh danh... |
| Tỷ giá đổi thưởng | X điểm = 1 ngày nghỉ phép, etc. |
| Chu kỳ reset | Điểm reset theo tháng / quý / năm hay tích lũy |
** Này từ nha cốt
---

### 7.6. Department Management

- Tạo/sửa/xóa phòng ban.
- Hỗ trợ phân cấp (phòng ban cha – con).
- Gán manager cho phòng ban.
- Xem thống kê học tập theo từng phòng ban.
** Này từ nha cốt
---

### 7.7. Session Reports

- Báo cáo từng lớp học: danh sách học viên tham gia, điểm feedback, tỷ lệ hoàn thành.
- Báo cáo cá nhân: lịch sử học tập đầy đủ của từng nhân viên.
- Báo cáo ROI: ước tính chi phí tiết kiệm được so với đào tạo ngoài.
- Export: PDF (biểu đồ đẹp), Excel (raw data).

---

### 7.8. Notification System (HR side)

- Gửi thông báo đến phòng ban cụ thể hoặc toàn công ty.
- Gửi kèm link lớp học.
- Lên lịch gửi (schedule notification).
- Xem lịch sử các thông báo đã gửi + tỷ lệ mở (nếu email).

---

## 8. Class & Session Flow (Booking)

### 8.1. Session Lifecycle

```
[Mentor tạo lớp] → DRAFT
        |
        v
[Mentor publish / HR duyệt] → PUBLISHED
        |
        v
[Đang nhận đăng ký]
        |
        v
[Lớp diễn ra] → IN_PROGRESS
        |
        v
[Lớp kết thúc] → COMPLETED
        |
        v
[Chờ feedback] → FEEDBACK_PENDING → CLOSED (sau khi deadline feedback)

Luồng ngoại lệ:
PUBLISHED → CANCELLED (Mentor/HR hủy)
PUBLISHED → RESCHEDULED (dời lịch → tạo session mới, giữ danh sách học viên)
```

**Trạng thái Enrollment (đăng ký của từng học viên):**

| Trạng thái | Mô tả |
|---|---|
| `CONFIRMED` | Đã đăng ký thành công |
| `WAITLISTED` | Trong danh sách chờ |
| `ATTENDED` | Đã tham gia (HR / Mentor xác nhận điểm danh) |
| `ABSENT` | Đã đăng ký nhưng không tham gia |
| `CANCELLED` | Tự hủy đăng ký |

---

### 8.2. Calendar Sync

**Google Calendar:**
```
[User cấp quyền Google Calendar OAuth]
        |
        v
[Hệ thống lưu refresh token]
        |
        v
[Khi user đăng ký lớp] → Tạo event trong Google Calendar
[Khi lớp bị hủy/dời]  → Cập nhật / xóa event
[Khi cần Auto-Schedule] → Read user's calendar để check busy slots
```

**Microsoft Outlook:** Tương tự, dùng Microsoft Graph API.

---

### 8.3. Online Meeting Integration

- Khi tạo lớp online, Mentor chọn nền tảng.
- Hệ thống tự tạo meeting link (qua API của Zoom / Google Meet / Teams) hoặc Mentor nhập thủ công.
- Link được nhúng vào event calendar và email nhắc nhở.
- Link chỉ hiển thị cho học viên đã đăng ký.

---

### 8.4. Reminder System

| Thời điểm | Đối tượng nhận | Kênh |
|---|---|---|
| 7 ngày trước | Học viên đã đăng ký | Email |
| 24 giờ trước | Học viên + Mentor | Email + Push |
| 1 giờ trước | Học viên + Mentor | Push + In-app |
| Ngay khi lớp bắt đầu | Học viên chưa vào | Push |
| Sau khi lớp kết thúc 1 giờ | Học viên | Email (yêu cầu feedback) |

---

### 8.5. Offline Room Management

- HR nhập danh sách phòng họp: tên, tầng, sức chứa, thiết bị.
- Khi tạo lớp offline: Mentor chọn phòng từ danh sách phòng còn trống.
- Hệ thống block phòng trong khoảng thời gian lớp học.
- Cảnh báo conflict tự động nếu cùng phòng, trùng giờ.

---

## 9. Notification System

### 9.1. Kênh thông báo

| Kênh | Mô tả |
|---|---|
| Email | Gửi qua SMTP / email service |
| Push Notification | Browser push trên web |

User có thể tùy chỉnh: bật/tắt từng loại thông báo theo kênh.

---

### 9.2. Trigger Map

| Sự kiện | Người nhận | Kênh | Thời điểm |
|---|---|---|---|
| Lớp mới được publish | Nhân viên liên quan (theo kỹ năng / phòng ban) | Push + Email | Ngay lập tức |
| Đăng ký thành công | Mentee | Email | Ngay lập tức |
| Vào danh sách chờ | Mentee | In-app | Ngay lập tức |
| Có chỗ trống từ danh sách chờ | Mentee đầu danh sách | Push + Email | Ngay lập tức |
| Lớp bị hủy | Tất cả học viên đã đăng ký | Email + Push | Ngay lập tức |
| Lớp bị dời lịch | Tất cả học viên | Email + Push | Ngay lập tức |
| Nhắc nhở lớp học | Học viên + Mentor | Email + Push | 24h và 1h trước |
| Yêu cầu feedback | Học viên | Email + Push | Sau khi lớp kết thúc |
| Nhận InnerG Points | Mentor | In-app | Sau khi điểm được tính |
| Nhận Badge | User | In-app + Email | Ngay lập tức |
| Wishlist đạt ngưỡng | HR | In-app + Email | Ngay lập tức |
| Wishlist được duyệt / tạo lớp | Người đề xuất + người upvote | Push + Email | Ngay lập tức |
| Invite gửi | Nhân viên mới | Email | Ngay lập tức |
| Lớp chờ duyệt nội dung | HR | In-app | Ngay lập tức |
| Tài khoản bị vô hiệu hóa | User bị vô hiệu | Email | Ngay lập tức |

---

### 9.3. Notification Settings (User-level)

- User vào Settings → Notifications.
- Toggle on/off cho từng loại thông báo.
- Chọn kênh nhận: App / Email / Cả hai / Tắt.
- Giờ "Không làm phiền" (Do Not Disturb): push notifications không gửi trong khoảng giờ này.
** Này từ nha cốt
---

## 10. AI Features

> Các tính năng AI là lớp enhancement, không phải core flow. Hệ thống vẫn hoạt động đầy đủ khi AI không khả dụng.

### 10.1. Smart Notification — Phân phối thông minh

| | Chi tiết |
|---|---|
| **Input** | Skill Profile của từng nhân viên, Wishlist, lịch sử học tập, phòng ban |
| **Output** | Danh sách nhân viên phù hợp nhất nhận thông báo lớp học mới |
| **Mục đích** | Tránh spam thông báo không liên quan |
| **Flow** | Khi lớp PUBLISHED → AI scoring → Top N nhân viên → Push notification |

---

### 10.2. Auto-Scheduling Suggestion

| | Chi tiết |
|---|---|
| **Input** | Availability của Mentor, lịch bận của nhân viên (aggregate), giờ làm việc công ty |
| **Output** | Top 3 khung giờ tối ưu cho buổi học |
| **Mục đích** | Tối đa hóa tỷ lệ tham gia |
| **Flow** | Mentor request → Thuật toán phân tích lịch → Đề xuất → Mentor chọn |

---

### 10.3. Gợi ý cá nhân hóa lớp học

| | Chi tiết |
|---|---|
| **Input** | Skill Profile, Wishlist, lịch sử học, phòng ban, chức vụ |
| **Output** | Danh sách lớp học được đề xuất cho Mentee |
| **Mục đích** | Giúp Mentee khám phá lớp học phù hợp nhanh hơn |
| **Flow** | Mentee vào Dashboard → Hệ thống tính recommendation score → Hiển thị "Dành cho bạn" |

---

### 10.4. Mentor Matching cho Wishlist

| | Chi tiết |
|---|---|
| **Input** | Tên kỹ năng trong Wishlist, Skill Profile của tất cả nhân viên |
| **Output** | Danh sách Mentor nội bộ phù hợp nhất (ranked) |
| **Mục đích** | Giúp HR tìm Mentor nhanh cho Wishlist được duyệt |
| **Flow** | HR vào Wishlist item → Click "Tìm Mentor" → Hệ thống trả danh sách gợi ý |

---


### 10.5. Tính năng AI dự kiến (Phase 3)

- **Session Summary AI:** Sau buổi học, AI tổng hợp nội dung từ transcript/notes thành tóm tắt ngắn gọn.
- **AI-generated Feedback Analysis:** Phân tích toàn bộ nhận xét text của Mentee để tổng hợp điểm mạnh/yếu của Mentor.
- **Career Roadmap Suggestion:** Dựa vào chức vụ và Skill Profile, AI gợi ý lộ trình học kỹ năng theo thứ tự.
- **AI Chatbot:** Hỏi đáp trong app về lịch học, tài liệu, hướng dẫn sử dụng.

---

## 11. System Admin Module

### 11.1. Company Management

- Xem danh sách tất cả công ty (tenant) trên hệ thống.
- Tạo company mới: thông tin + tạo HR account đầu tiên.
- Khóa / kích hoạt company.
- Xem thống kê: số nhân viên, số lớp học, dung lượng lưu trữ đang dùng.

---

### 11.2. Subscription / Plan Management

| Plan | Giới hạn điển hình |
|---|---|
| Free | Tối đa 50 nhân viên, 5 lớp/tháng, 1GB storage |
| Pro | Tối đa 500 nhân viên, unlimited lớp, 20GB storage, AI features |
| Enterprise | Unlimited, SLA, custom integration, dedicated support |

- Admin gán plan cho company.
- Tracking usage: số user hiện tại, số lớp trong tháng, storage dùng.
- Cảnh báo khi gần vượt giới hạn plan.

---

### 11.3. Audit Log

Ghi lại toàn bộ hành động quan trọng:
- Actor (user_id, role, company_id)
- Action (CREATE_CLASS, DELETE_USER, CHANGE_ROLE, ...)
- Target resource (resource_type, resource_id)
- Timestamp
- IP address
- Result (SUCCESS / FAILED)

Filter: theo company, actor, action type, thời gian.
Export: CSV.

---

### 11.4. Moderation

- Tiếp nhận báo cáo từ HR về nội dung vi phạm.
- Xem xét và xử lý: xóa nội dung, cảnh báo user, khóa tài khoản.

---

### 11.5. Global Settings

- Cấu hình email service (SMTP settings).
- Cấu hình OAuth credentials (Google, Microsoft).
- Cấu hình meeting platform API keys (Zoom).
- Maintenance mode.
- Thông báo hệ thống (system-wide banner).

---

### 11.6. System Analytics

- Tổng số công ty đang active.
- Tổng số user trên toàn hệ thống.
- Tổng số lớp học trong tháng.
- Tỷ lệ retention theo company.
- Storage usage tổng thể.

---

## 12. Data & Entity Overview

### 12.1. Core Entities

#### User

Đại diện cho một tài khoản người dùng.

| Field | Ghi chú |
|---|---|
| id | UUID |
| email | Unique toàn hệ thống |
| name | Tên hiển thị |
| avatar_url | |
| company_id | FK → Company |
| department_id | FK → Department |
| position | Chức vụ |
| role | `MENTEE / MENTOR / HR / ADMIN` |
| status | `ACTIVE / INACTIVE / PENDING` |
| created_at / updated_at | |

> Một user có thể có nhiều role (ví dụ: MENTEE + MENTOR). Xem xét lưu dưới dạng array hoặc bảng UserRoles.

---

#### Company

Đại diện cho một tenant (một công ty).

- `id`, `name`, `email_domain`, `logo_url`, `timezone`, `language`
- `plan_id` → FK Plan
- `status`: ACTIVE / SUSPENDED

---

#### Department

- `id`, `company_id`, `name`, `parent_id` (self-reference cho phân cấp)

---

#### MentorProfile

Thông tin bổ sung của user có role Mentor.

- `user_id` (FK, 1-1 với User)
- `bio`
- `skills[]` → Danh sách kỹ năng có thể dạy + mức độ
- `availability[]` → Khung giờ rảnh theo tuần
- `avg_rating` (tính toán, không lưu thủ công)
- `total_classes_taught`, `total_students`
- `status`: ACTIVE / PENDING_VERIFICATION / INACTIVE

---

#### Class (Lớp học)

- `id`, `company_id`, `mentor_id`
- `title`, `description`, `objectives`
- `skill_id` → FK Skill
- `skill_level`: BEGINNER / INTERMEDIATE / ALL
- `format`: ONLINE / OFFLINE
- `meeting_link` (nếu online)
- `room_id` → FK Room (nếu offline)
- `max_capacity`, `current_enrolled`
- `scheduled_at`, `duration_minutes`
- `status`: DRAFT / PENDING_APPROVAL / PUBLISHED / IN_PROGRESS / COMPLETED / CANCELLED
- `enrollment_mode`: OPEN / APPROVAL_REQUIRED
- `target_departments[]`

---

#### Enrollment (Đăng ký)

- `id`, `class_id`, `user_id`
- `status`: CONFIRMED / WAITLISTED / ATTENDED / ABSENT / CANCELLED
- `enrolled_at`, `cancelled_at`
- `waitlist_position` (nếu WAITLISTED)

---

#### Skill

- `id`, `company_id`, `name`, `category`, `description`
- Danh mục kỹ năng chuẩn của công ty, do Admin/HR quản lý.

---

#### WishlistItem

- `id`, `company_id`, `creator_id`
- `skill_name`, `description`, `priority`: LOW / MEDIUM / HIGH
- `upvote_count`
- `status`: PENDING / REVIEWING / FINDING_MENTOR / SCHEDULED / COMPLETED / REJECTED
- `matched_class_id` (khi đã có lớp)

---

#### WishlistUpvote

- `wishlist_item_id`, `user_id` — unique constraint để tránh upvote 2 lần.

---

#### Resource (Tài liệu)

- `id`, `class_id`, `uploader_id`
- `title`, `file_url`, `file_type`: PDF / DOCX / PPTX / VIDEO / LINK
- `file_size`
- `visibility`: CLASS_ONLY / COMPANY_PUBLIC
- `uploaded_at`

---

#### Feedback

- `id`, `class_id`, `reviewer_id`, `reviewee_id`
- `type`: MENTEE_TO_MENTOR / MENTOR_TO_MENTEE
- `ratings`: JSON object `{content: 4, presentation: 5, interaction: 4, usefulness: 5}`
- `comment`: text
- `is_anonymous`: boolean
- `submitted_at`

---

#### PointTransaction

- `id`, `user_id`, `company_id`
- `type`: EARNED / REDEEMED / ADJUSTED
- `amount`, `balance_after`
- `reference_id` (class_id khi EARNED, reward_id khi REDEEMED)
- `description`
- `created_at`

---

#### Notification

- `id`, `recipient_id`, `company_id`
- `type`: CLASS_NEW / ENROLLMENT_CONFIRM / CLASS_CANCELLED / ...
- `title`, `body`
- `reference_type`, `reference_id` (liên kết đến resource liên quan)
- `is_read`: boolean
- `channel`: IN_APP / EMAIL / PUSH
- `sent_at`, `read_at`

---

#### Invite

- `id`, `company_id`, `inviter_id`
- `email`, `role`, `department_id`
- `token` (unique, random)
- `status`: PENDING / ACCEPTED / EXPIRED / REVOKED
- `expires_at`

---

#### Room (Phòng họp)

- `id`, `company_id`, `name`, `floor`, `capacity`
- `amenities[]`: projector, whiteboard, etc.
- `status`: ACTIVE / INACTIVE

---

#### Badge

- `id`, `name`, `description`, `icon_url`
- `trigger_type`: FIRST_CLASS_TAUGHT / X_CLASSES_TAUGHT / TOP_RATED / ...
- `trigger_value`: giá trị ngưỡng

---

#### UserBadge

- `user_id`, `badge_id`, `awarded_at`

---

### 12.2. Relationship Summary

```
Company ──< User
Company ──< Department
Company ──< Skill
Company ──< Class
User (Mentor) ──< Class
Class ──< Enrollment >── User (Mentee)
Class ──< Resource
Class ──< Feedback
User ──< PointTransaction
User ──< WishlistItem
WishlistItem ──< WishlistUpvote
User ──< UserBadge >── Badge
Company ──< Room
Class ── Room (optional)
```

---

## 13. System Rules & Business Rules

### 13.1. Validation Rules

| Rule | Chi tiết |
|---|---|
| Email domain | Khi invite, email phải thuộc domain đã đăng ký của company (trừ khi HR tắt rule này) |
| Mật khẩu | Tối thiểu 8 ký tự, có chữ hoa, chữ thường, số |
| Tên lớp | Không để trống, tối đa 200 ký tự |
| Số chỗ tối đa | Tối thiểu 1, tối đa theo plan |
| Thời lượng | Tối thiểu 15 phút |
| Thời gian lớp học | Phải trong tương lai khi tạo; ít nhất 2 giờ sau thời điểm tạo |
| Upload file | Giới hạn kích thước theo plan (Free: 50MB/file, Pro: 200MB) |

---

### 13.2. Permission Rules

- User chỉ thao tác trên resource thuộc `company_id` của mình.
- Mentor chỉ edit/delete lớp do mình tạo (trừ khi HR can thiệp).
- HR không thể xem dữ liệu của company khác.
- Admin không thể bị xóa hoặc vô hiệu hóa bởi HR (chỉ System Admin).
- User không thể tự thay đổi role của mình.

---

### 13.3. Session / Class Rules

- Một lớp học không thể bắt đầu nếu không có Mentor active.
- Mentor không thể tạo 2 lớp cùng giờ.
- Khi lớp hủy sau khi đã có học viên đăng ký, InnerG Points chưa phát thì không phát; đã phát thì thu hồi.
- Mentor có thể dời lịch tối đa X lần (mặc định: 2 lần); lần thứ X+1 cần HR duyệt.
- Feedback chỉ được gửi sau khi lớp ở trạng thái COMPLETED.
- Sau X ngày kể từ lớp kết thúc, deadline feedback tự động đóng.

---

### 13.4. Enrollment Rules

- Một user chỉ đăng ký một lần cho một lớp học.
- Hủy đăng ký chỉ được phép trước X giờ (HR cấu hình, mặc định 2 giờ).
- Danh sách chờ theo thứ tự FIFO (First In First Out).
- Khi có chỗ trống, hệ thống tự động notify người đầu danh sách. Người đó có Y giờ để xác nhận, nếu không sẽ bỏ qua và notify người tiếp theo.

---

### 13.5. Wishlist Rules

- Một user chỉ upvote một item một lần.
- Ngưỡng kích hoạt thông báo HR do HR cấu hình (default: 5).
- Người đề xuất nhận thông báo mỗi khi trạng thái item thay đổi.

---

### 13.6. InnerG Points Rules

- Điểm chỉ được tính sau khi lớp ở trạng thái COMPLETED và đã có ít nhất 1 feedback.
- Nếu không có feedback sau deadline, điểm vẫn được tính với hệ số mặc định.
- Điểm âm không xảy ra — tối thiểu là 0.
- Đổi thưởng: điểm bị trừ ngay khi xác nhận đổi; vật phẩm xử lý ngoài hệ thống (HR xác nhận thủ công).
** Này từ nha cốt
---

### 13.7. Invite Rules

- Invite link expire sau 7 ngày (HR cấu hình).
- Một invite link chỉ dùng một lần.
- HR có thể gửi lại / thu hồi invite bất kỳ lúc nào khi còn PENDING.
- Sau khi invite ACCEPTED, không thể thu hồi (tài khoản đã tạo).

---

### 13.8. Account States

```
PENDING (chưa dùng invite) 
    → ACTIVE (đã đăng ký)
    → INACTIVE (HR vô hiệu hóa)
    → DELETED (soft delete)

INACTIVE → ACTIVE (HR kích hoạt lại)
DELETED → (không thể khôi phục qua UI, chỉ System Admin)
```

---

### 13.9. Multi-Company / Multi-Workspace

- Một email có thể thuộc nhiều company nếu được invite vào nhiều workspace.
- Sau khi đăng nhập, nếu có nhiều workspace → hiển thị màn hình chọn workspace.
- Mỗi workspace là isolated: dữ liệu không chia sẻ giữa các company.
- User phải đăng nhập và chọn workspace riêng cho từng công ty.

---

### 13.10. Security Rules

- HTTPS bắt buộc.
- File upload: scan malware, validate MIME type.
- SQL injection / XSS: validate và sanitize toàn bộ input.
- Tài liệu lưu trữ: URL signed (expire sau X phút) để tránh public access trực tiếp.
- Audit log: không thể xóa (append-only).

---

## 14. Future Scalability

### 14.1. Multi-tenant Architecture

- Hiện tại: shared database với `company_id` làm tenant discriminator.
- Tương lai (Enterprise): tùy chọn database per tenant cho isolation cao hơn.
- Mọi query phải có filter `company_id` — enforce ở tầng ORM/middleware.

---

### 14.2. AI Extensibility

- AI features được tách thành service độc lập (AI Service), giao tiếp qua internal API.
- Thay thế / nâng cấp AI model mà không ảnh hưởng core system.
- Feature flags để bật/tắt AI feature theo plan hoặc per-company.

---

### 14.3. External HRM Integration

- Chuẩn hóa import/export user data qua API.
- Hỗ trợ webhook để sync dữ liệu hai chiều với hệ thống HRM bên ngoài (BambooHR, SAP, etc.).
- Dữ liệu học tập có thể export sang hệ thống KPI nội bộ.

---

### 14.5. Video Integration

- Phase 1: Link Zoom / Google Meet / Teams thủ công hoặc qua API.
- Phase 2: Tích hợp recording API → lưu video buổi học vào Resource Hub.

---

### 14.6. Internationalization (i18n)

- Giao diện hỗ trợ đa ngôn ngữ (bắt đầu với Tiếng Việt + Tiếng Anh).
- Timezone per-company, per-user.
- Date/time format theo locale.
- Nội dung do user tạo (tên lớp, mô tả): không dịch tự động, hiển thị nguyên bản.

---

### 14.7. Subscription & Billing

- Tích hợp payment gateway (Stripe hoặc tương đương) cho tự động gia hạn.
- Usage-based billing: tính theo số active user hoặc số lớp học trong tháng.
- Admin portal để theo dõi invoice, payment history.

---

**InnerG • Internal + Growth • System Spec v1.0 • 2026**