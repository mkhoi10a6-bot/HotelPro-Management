# Huong Dan Mo Code Bao Cao

## Link chay website

- Website that tren Render: `https://may-an-nhien.onrender.com`
- Website local: `http://localhost:5050/login`
- Chay bang Docker: `docker compose up -d --build`
- Dung Docker: `docker compose down`

## Cau truc chinh

```txt
.
├── client/                 Frontend React/Vite
│   ├── src/
│   │   ├── App.jsx         Khai bao route, phan quyen, layout chinh
│   │   ├── main.jsx        Diem khoi dong React
│   │   ├── store.js        Cau hinh Redux store
│   │   ├── features/
│   │   │   └── hotelSlice.js   State dang nhap, phong, dat phong
│   │   ├── services/
│   │   │   ├── api.js          Ham goi API co Authorization token
│   │   │   ├── config.js       Cau hinh API URL
│   │   │   └── chatbot.js      API chatbot
│   │   └── components/     Cac man hinh giao dien
│   └── package.json        Script build frontend
├── server/                 Backend Node/Express
│   ├── index.js            API, dang nhap, Google OAuth, booking, rooms
│   ├── db.js               Ket noi SQLite va cac ham truy van
│   ├── schema.sql          Cau truc bang database
│   └── package.json        Script start backend
├── Dockerfile              Build frontend + backend thanh 1 image
├── docker-compose.yml      Chay website o port 5050
├── KeyApi                  Cau hinh Google OAuth local, khong dua len Git
└── KeyApi.example          Mau cau hinh an toan
```

## File nen mo khi giang vien hoi

### 1. Dang nhap thuong va dang nhap Google

- Nut dang nhap Google: `client/src/components/Login.jsx`
- Route bat dau Google OAuth: `server/index.js` tim `app.get("/api/auth/google"`
- Route Google callback: `server/index.js` tim `app.get("/signin.com"`
- Bien cau hinh OAuth: `KeyApi`

### 2. Phan quyen va dieu huong

- Route admin/customer: `client/src/App.jsx`
- Kiem tra role va chan trang: `RequireAuth` trong `client/src/App.jsx`
- Luu token/user: `client/src/features/hotelSlice.js`

### 3. Quan ly phong

- Giao dien phong: `client/src/components/RoomsView.jsx`
- API phong: `server/index.js` tim `/api/rooms`
- Bang phong: `server/schema.sql` tim `CREATE TABLE IF NOT EXISTS rooms`

### 4. Dat phong va lich su dat phong

- Giao dien dat phong: `client/src/components/BookingPage.jsx`
- Quan ly don dat phong admin: `client/src/components/AdminBookingsView.jsx`
- Lich su khach hang: `client/src/components/BookingHistory.jsx`
- API booking: `server/index.js` tim `/api/bookings`

### 5. Khach hang

- Giao dien danh sach khach: `client/src/components/CustomersView.jsx`
- API khach hang: `server/index.js` tim `/api/customers`
- Ham lay khach hang tu DB: `server/db.js` tim `getCustomers`

### 6. Chatbot

- Giao dien chatbot: `client/src/components/ChatbotWidget.jsx`
- Trang chat: `client/src/components/ChatPageView.jsx`
- API chatbot: `server/index.js` tim `/api/chatbot/respond`

## File da don dep

- Da xoa `node_modules/`, `client/node_modules/`: thu vien cai dat, co the tao lai bang `npm install`.
- Da xoa `client/dist/`: ban build tu dong, co the tao lai bang `npm run build`.
- Da xoa cac file test shell cu: `test_*.sh`.
- Da xoa file React bi dat nham trong `server/`: `server/AdminBookingsView.jsx`, `server/CustomersView.jsx`.
- Da xoa `server/data.json`: du lieu demo cu, hien he thong dung SQLite.
- Da xoa `.env` va `server/.env` cu de tranh lo secret.

## Luu y khi bao cao

- Source frontend nam trong `client/src`, khong phai `client/dist`.
- Source backend nam trong `server/index.js` va `server/db.js`.
- Database local la SQLite, file runtime la `server/hotel.db` hoac volume Docker `/data/hotel.db`.
- Google Cloud phai co redirect URI: `http://localhost:5050/signin.com`.
- Google Cloud cho web that phai co redirect URI: `https://may-an-nhien.onrender.com/signin.com`.
- `localhost` la ban test tren may, `https://may-an-nhien.onrender.com` la website that tren internet.
