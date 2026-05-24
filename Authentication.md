# Authentication Overview

Tài liệu này mô tả phần authentication hiện có trong dự án `innerg`, bám theo code hiện tại ở `api/InnerG.Api/Controllers/AuthController.cs` và frontend `web/src`.

## 1. Mục tiêu hiện tại

Hệ thống auth đang đi theo mô hình:

- `invite-based`
- `multi-tenant`
- `JWT access token + refresh token`
- `company-scoped authorization`
- hỗ trợ `Google login`
- hỗ trợ `email verification`, `forgot/reset password`, `2FA cơ bản qua email code`

Điểm quan trọng:

- Không còn public register.
- Người dùng mới được tạo account qua invite link.
- Một email có thể thuộc nhiều company/workspace.
- Khi login, nếu email thuộc nhiều workspace thì hệ thống trả về danh sách workspace để người dùng chọn.

## 2. Các thành phần chính

### AppUser

Người dùng hệ thống, gắn với tenant/company.

Thông tin auth liên quan:

- `UserName`
- `Email`
- `FullName`
- `CompanyId`
- roles qua ASP.NET Identity
- trạng thái email confirm / 2FA / lockout theo Identity

### Company

Tenant/workspace của hệ thống.

Hiện có các trường chính:

- `Id`
- `Name`
- `Domain`
- `Timezone`
- `Language`
- `IsActive`

### Invite

Đại diện cho lời mời tham gia company.

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

Trạng thái invite:

- `PENDING`
- `ACCEPTED`
- `EXPIRED`
- `REVOKED`

### UserSession

Lưu refresh session theo thiết bị/phiên đăng nhập.

Thông tin chính:

- `UserId`
- `TokenHash`
- `DeviceInfo`
- `IpAddress`
- `IsActive`
- `ExpiresAt`
- `RevokedAt`

## 3. Roles hiện đang dùng

Code hiện có constants chính:

- `Mentee`
- `Mentor`
- `HR`
- `SystemAdmin`

Ngoài ra controller hiện vẫn allow thêm các role sau ở một số endpoint:

- `HRManager`
- `Admin`
- `SuperAdmin`

Điều này có nghĩa là code đang hỗ trợ cả nhóm role cũ/lớn hơn để không chặn nghiệp vụ quản trị.

## 4. Luồng auth hiện tại

### 4.1 Bootstrap company đầu tiên

Endpoint: `POST /api/auth/bootstrap-company`

Mục đích:

- tạo company đầu tiên
- tạo HR đầu tiên
- login ngay sau khi tạo thành công

Kết quả:

- trả `AuthResponse`
- set `refresh_token` vào `HttpOnly cookie`

### 4.2 Tạo company mới bởi admin hệ thống

Endpoint: `POST /api/auth/companies`

Role:

- `SystemAdmin`
- `Admin`
- `SuperAdmin`

Mục đích:

- tạo company mới
- tạo HR invite đầu tiên cho company đó

Kết quả:

- trả `CompanyOnboardingResponse`
- trong đó có thông tin company và HR invite

### 4.3 Invite user

Endpoints:

- `POST /api/auth/invites`
- `POST /api/auth/invites/bulk`
- `POST /api/auth/invites/{inviteId}/resend`
- `POST /api/auth/invites/{inviteId}/revoke`

Role:

- `HR`
- `HRManager`
- `SystemAdmin`
- `Admin`
- `SuperAdmin`

Nguyên tắc:

- HR chỉ nên thao tác trong company hiện tại.
- System-level roles có thể thao tác cross-company.
- Invite chỉ lưu `TokenHash`, không lưu raw token trong DB.
- Link invite dùng để frontend mở trang `/accept-invite?token=...`

### 4.4 Accept invite

Endpoints:

- `GET /api/auth/invites/{token}`: xem preview invite
- `POST /api/auth/accept-invite`: tạo account từ invite

Flow:

1. frontend đọc token từ query string
2. gọi preview invite
3. người dùng nhập `fullName`, `password`, `confirmPassword`
4. backend tạo user, gán company, gán roles, đánh dấu invite đã dùng
5. trả `AuthResponse` và set `refresh_token`

Frontend hiện tại:

- route chính: `/accept-invite`
- route cũ `/register?...` đã được redirect sang `/accept-invite?...`

### 4.5 Login bằng email/password

Endpoint: `POST /api/auth/login`

Hành vi:

- nếu email chỉ thuộc một workspace và thông tin đúng: login thành công
- nếu email thuộc nhiều workspace: trả `RequiresWorkspaceSelection = true`
- nếu account bật 2FA: trả `RequiresTwoFactor = true`

Khi cần chọn workspace, response trả danh sách:

- `CompanyId`
- `CompanyName`
- `EmailDomain`
- `Roles`

### 4.6 Login bằng Google

Endpoint: `POST /api/auth/google-login`

Hành vi:

- verify Google ID token
- chỉ login nếu email đã tồn tại đúng trong hệ thống
- không tự public-register user mới qua Google
- nếu email thuộc nhiều workspace thì cũng trả workspace list để chọn

### 4.7 Refresh token

Endpoint: `POST /api/auth/refresh-token`

Hành vi:

- đọc cookie `refresh_token`
- kiểm tra session còn hiệu lực
- rotate refresh token
- trả access token mới và set lại cookie mới

Cookie refresh token hiện có:

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

Chức năng:

- logout session hiện tại bằng refresh token cookie
- logout toàn bộ session của user
- xem danh sách phiên đăng nhập
- revoke từng session

### 4.9 Forgot/reset password

Endpoints:

- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

Mục đích:

- gửi email reset password
- đặt lại password bằng token

### 4.10 Email verification

Endpoints:

- `GET /api/auth/verify-email`
- `POST /api/auth/resend-verification-email`

Mục đích:

- xác nhận email người dùng
- gửi lại email xác nhận

### 4.11 Two-factor authentication

Endpoints:

- `POST /api/auth/2fa/send-enable-code`
- `POST /api/auth/2fa/enable`
- `POST /api/auth/2fa/disable`

Mô hình hiện tại:

- 2FA cơ bản qua code gửi email
- chưa phải TOTP app như Google Authenticator

## 5. Access token và company scope

Sau khi login thành công, backend trả `AuthResponse` chứa:

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

Access token dùng để gọi API protected.

Hệ thống đang dùng `company_id` trong claims để xác định tenant context cho user hiện tại.

## 6. API hiện có

## Public / anonymous

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/auth/login` | Login bằng email/username + password |
| `POST` | `/api/auth/google-login` | Login bằng Google ID token |
| `POST` | `/api/auth/bootstrap-company` | Tạo company đầu tiên và HR đầu tiên |
| `GET` | `/api/auth/invites/{token}` | Lấy preview của invite |
| `POST` | `/api/auth/accept-invite` | Accept invite và tạo account |
| `POST` | `/api/auth/refresh-token` | Đổi access token bằng refresh token cookie |
| `POST` | `/api/auth/forgot-password` | Gửi email reset password |
| `POST` | `/api/auth/reset-password` | Đặt lại password |
| `GET` | `/api/auth/verify-email` | Xác nhận email |
| `POST` | `/api/auth/resend-verification-email` | Gửi lại email xác nhận |
| `POST` | `/api/auth/logout` | Logout theo refresh token cookie hiện tại |

## Protected

| Method | Endpoint | Role / yêu cầu | Mô tả |
|---|---|---|---|
| `POST` | `/api/auth/companies` | `SystemAdmin, Admin, SuperAdmin` | Tạo company mới |
| `POST` | `/api/auth/invites` | `HR, SystemAdmin, HRManager, Admin, SuperAdmin` | Tạo 1 invite |
| `POST` | `/api/auth/invites/bulk` | `HR, SystemAdmin, HRManager, Admin, SuperAdmin` | Tạo nhiều invite |
| `POST` | `/api/auth/invites/{inviteId}/resend` | `HR, SystemAdmin, HRManager, Admin, SuperAdmin` | Gửi lại invite |
| `POST` | `/api/auth/invites/{inviteId}/revoke` | `HR, SystemAdmin, HRManager, Admin, SuperAdmin` | Thu hồi invite |
| `POST` | `/api/auth/2fa/send-enable-code` | Authenticated | Gửi code bật 2FA |
| `POST` | `/api/auth/2fa/enable` | Authenticated | Bật 2FA |
| `POST` | `/api/auth/2fa/disable` | Authenticated | Tắt 2FA |
| `GET` | `/api/auth/sessions` | Authenticated | Lấy danh sách session |
| `POST` | `/api/auth/sessions/{sessionId}/revoke` | Authenticated | Thu hồi 1 session |
| `POST` | `/api/auth/logout-all` | Authenticated | Logout tất cả session |
| `GET` | `/api/auth/users/{userId}` | Authenticated, chỉ chính user đó | Lấy thông tin user hiện tại |
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
  "hrFullName": "Admin HR",
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

## 8. AuthResponse thực tế

```json
{
  "token": "jwt-access-token",
  "refreshToken": "opaque-refresh-token",
  "userId": "user-id",
  "userName": "username",
  "fullName": "Nguyen Van A",
  "email": "user@company.com",
  "companyId": "guid",
  "companyName": "InnerG",
  "roles": ["HR"],
  "requiresWorkspaceSelection": false,
  "requiresTwoFactor": false,
  "workspaces": []
}
```

Nếu cần chọn workspace:

```json
{
  "requiresWorkspaceSelection": true,
  "workspaces": [
    {
      "companyId": "guid-1",
      "companyName": "Company A",
      "emailDomain": "a.com",
      "roles": ["Mentee"]
    },
    {
      "companyId": "guid-2",
      "companyName": "Company B",
      "emailDomain": "b.com",
      "roles": ["Mentor"]
    }
  ]
}
```

Nếu cần 2FA:

```json
{
  "requiresTwoFactor": true
}
```

## 9. Những gì đã làm được

- Đã chuyển sang `invite-only registration`
- Đã hỗ trợ `multi-tenant auth`
- Đã hỗ trợ một email thuộc nhiều workspace
- Đã có `workspace selection`
- Đã có `Google login`
- Đã có `refresh token rotation`
- Đã có `session management`
- Đã có `forgot/reset password`
- Đã có `email verification`
- Đã có `2FA enable/disable`
- Đã có `company bootstrap` và `company onboarding`
- Đã có `bulk invite`, `resend invite`, `revoke invite`

## 10. Những điểm cần lưu ý

- Hệ thống hiện không còn endpoint public register.
- Frontend onboarding user mới là `/accept-invite`.
- 2FA hiện là email code, chưa phải TOTP app.
- Google login chỉ dùng cho account đã tồn tại theo invite flow.
- Một số role legacy như `HRManager`, `Admin`, `SuperAdmin` đang vẫn được allow ở controller để phục vụ quản trị.

