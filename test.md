# Tài liệu Thử nghiệm (Test Markdown)

Chào bạn! Đây là một file Markdown (`test.md`) được tạo tự động để bạn có thể kiểm tra định dạng và giao diện hiển thị.

## 1. Định dạng cơ bản

Dưới đây là một số định dạng Markdown phổ biến:

* **Chữ in đậm** (`**chữ**`)
* *Chữ in nghiêng* (`*chữ*`)
* ~~Chữ gạch ngang~~ (`~~chữ~~`)
* `Mã nguồn (inline code)` (\`mã\`)

---

## 2. Danh sách (Lists)

### Danh sách không thứ tự:
- Item A
- Item B
  - Sub-item B1
  - Sub-item B2

### Danh sách có thứ tự:
1. Bước một
2. Bước hai
3. Bước ba

---

## 3. Khối mã nguồn (Code Blocks)

Dưới đây là một đoạn code JavaScript ví dụ:

```javascript
// Hàm chào mừng người dùng
function sayHello(name) {
    console.log(`Xin chào, ${name}! Chúc bạn một ngày tốt lành.`);
}

sayHello("User");
```

---

## 4. Bảng biểu (Tables)

| STT | Chức năng | Trạng thái | Ghi chú |
| :--- | :--- | :--- | :--- |
| 1 | Tạo file test | ✅ Hoàn thành | File Markdown cơ bản |
| 2 | Chạy dev server | 🏃 Đang chạy | `npm run dev` & `dotnet watch run` |
| 3 | Quản lý lịch trình | 🛠️ Đang phát triển | Nhánh `feature/schedule-management` |

---

## 5. Hộp lưu ý (Alerts)

> [!NOTE]
> Hệ thống hiện tại đang chạy hai dịch vụ song song:
> - Backend: C# (đang chạy `dotnet watch run`)
> - Frontend: React (đang chạy `npm run dev`)

> [!TIP]
> Bạn có thể sử dụng các file tài liệu khác như [SystemSpecification.md](file:///c:/Users/ASUS/OneDrive/Máy tính/Workspace/Theory/2026_Summer/EXE201/innerg/SystemSpecification.md) để tham khảo thông tin chi tiết về dự án nhé!
