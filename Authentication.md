# Authentication Overview

Tài liệu này mô tả phần authentication hiện tại của dự án `innerg`, bám theo code đang chạy ở `api/InnerG.Api` và `web/src`.

## 1. Mô hình auth hiện tại

Hệ thống đang dùng:

- invite-based registration
- multi-tenant theo `Company`
- JWT access token
- refresh token qua `HttpOnly cookie`
- company-scoped authorization
- Google login cho account đã tồn tại
- forgot/reset password
- 2FA cơ bản qua email code

Điểm quan trọng:

- không còn public register
- user mới chỉ được tạo qua invite
- một email có thể thuộc nhiều company/workspace
- nếu cùng email thuộc nhiều workspace, login sẽ yêu cầu chọn workspace

## 2. 4 role chính thức

Hệ thống hiện chỉ dùng 4 role:

- `SystemAdmin`
- `HR`
- `Mentor`
- `Mentee`

Ý nghĩa:

- `SystemAdmin`: quản trị cấp hệ thống, có thể tạo company và thao tác cross-company
- `HR`: quản trị trong company của mình, có thể tạo/revoke/resend invite
- `Mentor`: người hướng dẫn/chia sẻ kiến thức
- `Mentee`: người học

## 3. Các thực thể auth chính

### Company

Tenant/workspace của hệ thống.

Trường chính:

- `Id`
- `Name`
- `Domain`
- `Timezone`
- `Language`
- `IsActive`

### AppUser

Người dùng hệ thống.

Thông tin auth liên quan:

- `UserName`
- `Email`
- `FullName`
- `CompanyId`
- roles qua ASP.NET Identity
- `EmailConfirmed`
- `TwoFactorEnabled`
- `IsActive`
- `LastLoginAt`

### Invite

Lời mời tham gia company.

Thông tin chính:

- `CompanyId`
- `InviterId`
- `DepartmentId`
- `Email`
- `FullName`
- `Position`
- `RolesCsv`
- `TokenHash`
- `Status`
- `ExpiresAt`
- `AcceptedAt`
- `RevokedAt`

Trạng thái:

- `PENDING`
- `ACCEPTED`
- `EXPIRED`
- `REVOKED`

### UserSession

Phiên đăng nhập / refresh token.

Thông tin chính:

- `UserId`
- `TokenHash`
- `DeviceInfo`
- `IpAddress`
- `IsActive`
- `ExpiresAt`
- `RevokedAt`

## 4. Luồng auth chính

### 4.1 Bootstrap company đầu tiên

Endpoint: `POST /api/auth/bootstrap-company`

Mục đích:

- tạo company đầu tiên
- tạo user HR đầu tiên
- login ngay sau khi tạo xong

Kết quả:

- trả `AuthResponse`
- set `refresh_token` vào cookie

### 4.2 Tạo company mới

Endpoint: `POST /api/auth/companies`

Role:

- `SystemAdmin`

Mục đích:

- tạo company mới
- tạo HR invite đầu tiên cho company đó

Kết quả:

- trả `CompanyOnboardingResponse`

### 4.3 Invite user

Endpoints:

- `POST /api/auth/invites`
- `POST /api/auth/invites/bulk`
- `POST /api/auth/invites/{inviteId}/resend`
- `POST /api/auth/invites/{inviteId}/revoke`

Role:

- `HR`
- `SystemAdmin`

Nguyên tắc:

- HR chỉ thao tác trong company hiện tại
- `SystemAdmin` có thể thao tác cross-company
- invite chỉ lưu `TokenHash`, không lưu raw token
- frontend dùng link `/accept-invite?token=...`

### 4.4 Accept invite

Endpoints:

- `GET /api/auth/invites/{token}`
- `POST /api/auth/accept-invite`

Flow:

1. frontend lấy token từ query string
2. gọi API preview invite
3. user nhập `fullName`, `password`, `confirmPassword`
4. backend tạo user, gán company, gán role từ invite
5. backend đánh dấu invite là `ACCEPTED`
6. trả `AuthResponse` và set `refresh_token`

### 4.5 Login bằng email/password

Endpoint: `POST /api/auth/login`

Hành vi:

- đúng credentials và chỉ có 1 workspace: login thành công
- đúng credentials nhưng có nhiều workspace: trả `requiresWorkspaceSelection = true`
- nếu bật 2FA: trả `requiresTwoFactor = true`

### 4.6 Login bằng Google

Endpoint: `POST /api/auth/google-login`

Hành vi:

- verify Google ID token
- chỉ cho login nếu account đã tồn tại
- không tự tạo public account mới
- nếu có nhiều workspace thì trả workspace list để chọn

### 4.7 Refresh token

Endpoint: `POST /api/auth/refresh-token`

Hành vi:

- đọc cookie `refresh_token`
- kiểm tra session còn hiệu lực
- rotate refresh token
- trả access token mới và set cookie mới

Cookie hiện tại:

- `HttpOnly`
- `Path = /api/auth`
- `SameSite = None` nếu HTTPS, ngược lại `Lax`
- `Secure = true` nếu HTTPS

### 4.8 Logout và session management

Endpoints:

- `POST /api/auth/logout`
- `POST /api/auth/logout-all`
- `GET /api/auth/sessions`
- `POST /api/auth/sessions/{sessionId}/revoke`

### 4.9 Forgot/reset password

Endpoints:

- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### 4.10 Email verification

Endpoints:

- `GET /api/auth/verify-email`
- `POST /api/auth/resend-verification-email`

Ghi chú:

- trong invite-based auth hiện tại, email confirmation không phải flow chính
- service hiện đang chặn flow này với thông báo không dùng trong invite-based registration

### 4.11 Two-factor authentication

Endpoints:

- `POST /api/auth/2fa/send-enable-code`
- `POST /api/auth/2fa/enable`
- `POST /api/auth/2fa/disable`

2FA hiện tại là:

- email code
- chưa phải TOTP app

## 5. Access token và company scope

`AuthResponse` hiện trả:

- `token`
- `refreshToken`
- `userId`
- `userName`
- `fullName`
- `email`
- `companyId`
- `companyName`
- `roles`
- `requiresWorkspaceSelection`
- `requiresTwoFactor`
- `workspaces`

Claims quan trọng trong JWT:

- `nameidentifier`
- `name`
- `emailaddress`
- `full_name`
- `CompanyId`
- `company_id`
- `company_name`
- `role`

`company_id` được dùng để xác định tenant context của user hiện tại.

## 6. API hiện có

### Public / anonymous

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/auth/login` | Login bằng email/username + password |
| `POST` | `/api/auth/google-login` | Login bằng Google ID token |
| `POST` | `/api/auth/bootstrap-company` | Tạo company đầu tiên và HR đầu tiên |
| `GET` | `/api/auth/invites/{token}` | Lấy preview invite |
| `POST` | `/api/auth/accept-invite` | Accept invite và tạo account |
| `POST` | `/api/auth/refresh-token` | Đổi access token bằng refresh token cookie |
| `POST` | `/api/auth/forgot-password` | Gửi email reset password |
| `POST` | `/api/auth/reset-password` | Đặt lại password |
| `GET` | `/api/auth/verify-email` | Xác nhận email |
| `POST` | `/api/auth/resend-verification-email` | Gửi lại email xác nhận |
| `POST` | `/api/auth/logout` | Logout theo refresh token cookie hiện tại |

### Protected

| Method | Endpoint | Role / yêu cầu | Mô tả |
|---|---|---|---|
| `POST` | `/api/auth/companies` | `SystemAdmin` | Tạo company mới |
| `POST` | `/api/auth/invites` | `HR, SystemAdmin` | Tạo 1 invite |
| `POST` | `/api/auth/invites/bulk` | `HR, SystemAdmin` | Tạo nhiều invite |
| `POST` | `/api/auth/invites/{inviteId}/resend` | `HR, SystemAdmin` | Gửi lại invite |
| `POST` | `/api/auth/invites/{inviteId}/revoke` | `HR, SystemAdmin` | Thu hồi invite |
| `POST` | `/api/auth/2fa/send-enable-code` | Authenticated | Gửi code bật 2FA |
| `POST` | `/api/auth/2fa/enable` | Authenticated | Bật 2FA |
| `POST` | `/api/auth/2fa/disable` | Authenticated | Tắt 2FA |
| `GET` | `/api/auth/sessions` | Authenticated | Lấy danh sách session |
| `POST` | `/api/auth/sessions/{sessionId}/revoke` | Authenticated | Thu hồi 1 session |
| `POST` | `/api/auth/logout-all` | Authenticated | Logout tất cả session |
| `GET` | `/api/auth/users/{userId}` | Authenticated, đúng chính user đó | Lấy thông tin user hiện tại |
| `GET` | `/api/auth/claims` | Authenticated | Xem claims hiện tại |

## 7. Request models chính

### LoginRequest

```json
{
  "emailOrUsername": "user@company.com",
  "password": "string",
  "companyId": "optional-guid",
  "twoFactorCode": "optional-code"
}
```

### AcceptInviteRequest

```json
{
  "token": "invite-token",
  "fullName": "Nguyen Van A",
  "avatarUrl": "optional-url",
  "password": "string",
  "confirmPassword": "string"
}
```

### BootstrapCompanyRequest

```json
{
  "companyName": "InnerG",
  "emailDomain": "innerg.com",
  "timezone": "Asia/Ho_Chi_Minh",
  "language": "vi",
  "hrFullName": "First HR",
  "hrEmail": "hr@innerg.com",
  "hrPassword": "string",
  "confirmPassword": "string"
}
```

### CreateCompanyRequest

```json
{
  "companyName": "ABC Corp",
  "emailDomain": "abc.com",
  "timezone": "Asia/Ho_Chi_Minh",
  "language": "vi",
  "hrEmail": "hr@abc.com",
  "hrFullName": "Nguyen B"
}
```

### CreateInviteRequest

```json
{
  "companyId": "optional-guid",
  "email": "member@company.com",
  "fullName": "Optional Name",
  "departmentId": "optional-guid",
  "position": "optional-position",
  "roles": ["Mentee"]
}
```

## 8. Seed accounts hiện tại

Seeder hiện tạo 4 account mẫu:

- `systemadmin@innerg.com` → `SystemAdmin`
- `hr@innerg.com` → `HR`
- `mentor@innerg.com` → `Mentor`
- `mentee@innerg.com` → `Mentee`

Password chung:

- `InnerG123`

Seeder nằm ở:

- `api/InnerG.Api/Data/Seed/DataSeeder.cs`

## 9. Những gì đã làm được

- Đã chuyển sang invite-only registration
- Đã hỗ trợ multi-tenant auth
- Đã hỗ trợ một email thuộc nhiều workspace
- Đã có workspace selection
- Đã có Google login
- Đã có refresh token rotation
- Đã có session management
- Đã có forgot/reset password
- Đã có 2FA enable/disable
- Đã có company bootstrap và company onboarding
- Đã có bulk invite, resend invite, revoke invite

## 10. Ghi chú

- Frontend onboarding user mới là `/accept-invite`
- Không còn public register
- Google login chỉ dành cho account đã tồn tại
- Auth hiện chỉ còn 4 role chính thức: `SystemAdmin`, `HR`, `Mentor`, `Mentee`
