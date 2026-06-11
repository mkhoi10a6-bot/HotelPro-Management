# Chạy Mây An Nhiên với database trên Docker

App hiện đang dùng SQLite. Cấu hình Docker này lưu file database vào Docker Volume tên `may_an_nhien_db`, nên dữ liệu vẫn còn khi tắt/mở container.

## Chạy lần đầu

```bash
docker compose up --build
```

Docker local đọc cấu hình OAuth từ file `KeyApi.local`.
Tạo file này từ `KeyApi.local.example`, rồi điền Client ID/Secret thật.
Google Cloud cho Docker local cần:

```text
Authorized JavaScript origins: http://localhost:5050
Authorized redirect URIs: http://localhost:5050/signin.com
```

Mở web:

```text
http://localhost:5050
```

Tài khoản admin:

```text
Email: mkhoi10a6@gmail.com
Mật khẩu: 0938190949
```

## Chạy lại sau này

```bash
docker compose up
```

## Dừng web

```bash
docker compose down
```

Lệnh này chỉ dừng container, không xóa database.

## Xóa sạch database Docker

Chỉ dùng khi muốn reset toàn bộ dữ liệu:

```bash
docker compose down -v
```

## Xem database nằm ở đâu

Trong Docker Desktop:

1. Vào `Volumes`.
2. Tìm volume `may_an_nhien_db`.
3. File database nằm trong container ở đường dẫn `/data/hotel.db`.

## Lưu ý khi deploy Render

Docker database này dùng cho máy local. Website Render `may-an-nhien.onrender.com` không dùng Docker Desktop trên máy bạn. Muốn dữ liệu trên Render không mất, nên dùng Render PostgreSQL hoặc Disk trả phí.
