require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const db = require('./db');

// Chạy migration nhanh để sửa lỗi thiếu cột total_amount
db.dbRunP("ALTER TABLE bookings ADD COLUMN total_amount REAL DEFAULT 0")
  .then(() => console.log("✅ Database: Đã kiểm tra/cập nhật cột total_amount cho bảng bookings."))
  .catch(err => console.log("ℹ️ Migration note:", err.message));

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/signin.com`;
const FRONTEND_URL = (process.env.FRONTEND_URL || "").replace(/\/$/, "");
const GMAIL_REGEX = /^[a-z0-9._%+-]+@gmail\.com$/i;
const passwordResetTokens = new Map();
const isProduction = process.env.NODE_ENV === "production";

if (isProduction && JWT_SECRET === "your-secret-key-here") {
  console.warn("WARNING: JWT_SECRET is using the default value in production. Set a strong secret before deploying.");
}

function createRateLimiter({ windowMs, max, message }) {
  const hits = new Map();

  return (req, res, next) => {
    const forwardedFor = String(req.headers["x-forwarded-for"] || "");
    const ip = forwardedFor.split(",")[0].trim() || req.ip || req.socket.remoteAddress || "unknown";
    const key = `${ip}:${req.path}`;
    const now = Date.now();
    const current = hits.get(key) || { count: 0, resetAt: now + windowMs };

    if (current.resetAt <= now) {
      current.count = 0;
      current.resetAt = now + windowMs;
    }

    current.count += 1;
    hits.set(key, current);

    if (current.count > max) {
      return res.status(429).json({ error: message || "Bạn thao tác quá nhanh. Vui lòng thử lại sau." });
    }

    next();
  };
}

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Bạn thử quá nhiều lần. Vui lòng chờ ít phút rồi thử lại.",
});

const publicWriteLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: "Bạn gửi quá nhiều yêu cầu. Vui lòng thử lại sau.",
});

let genAI = null;
try {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
  } else {
    console.warn("WARNING: GOOGLE_API_KEY is missing from .env. Chatbot features will be disabled.");
  }
} catch (error) {
  console.error("AI Initialization Error:", error.message);
}

const SYSTEM_INSTRUCTION = `Role: You are the Hotel System Core Engine. Your primary responsibility is to act as a bridge between Guest requests and the Admin Management System.

1. Data Context & State Management:
- Room Inventory: Standard (550k), VIP/Deluxe (950k), Suite Premium (1.800k).
- Services: Food (Phở Bò: 65k, Cơm Tấm: 60k, Bánh mì: 35k, Bún Chả: 65k); Drinks (Cafe muối: 35k, Trà đào: 30k, Nước suối: 10k).

2. Transaction & Logic Rules (CRITICAL):
- Automatic Revenue Calculation: Every time a guest books a room or orders a service, calculate: Total = (Room Price * Nights) + Sum(Service Prices).
- Real-time Admin Update Trigger: When a guest confirms an order, you must generate a structured notification for the Admin including: Room Number, Customer Name, Specific Items, and Status: PENDING.
- Financial Integrity: Distinguish between Collected Revenue (Paid) và Expected Revenue (Pending/Unpaid). Update these values immediately upon any transaction.

3. Output Format Control:
- For Admin Interface: Always provide updates in a clear, structured list. 
  Example: [UPDATE] Room 302 - Order: 01 Phở Bò, 01 Cafe Muối - Total: 100k - Action: Notify Staff.
- For System Stability: Never return raw Objects/JSON directly into the chat UI unless requested. Always wrap responses in clean Vietnamese prose to avoid "white screen" or "parsing errors" on the frontend.

4. Operational Constraints:
- Language: Professional, precise, and system-oriented Vietnamese.
- If a guest asks "Đói quá" or "Ăn gì", suggest menu items with prices and ask for their Room Number to link the revenue.
- Prevent unauthorized access: Only process orders if a Room Number is identified.
- Safety: If the system cannot calculate a value, return "Đang cập nhật..." instead of an error.

Tone: Professional, precise, and system-oriented. Always identify as "Mây An Nhiên".`;

// Local state management for immediate consistency
let collectedRevenue = 0; // QR Payment
let expectedRevenue = 0;  // Direct Payment
let bookings = [];
let serviceOrders = [];
let rooms = [
  { id: 101, number: "101", type: "Standard", price: 550000, status: "available", capacity: 1 },
  { id: 102, number: "102", type: "Standard", price: 550000, status: "available", capacity: 1 },
  { id: 103, number: "103", type: "Standard", price: 550000, status: "available", capacity: 1 },
  { id: 104, number: "104", type: "Standard", price: 550000, status: "available", capacity: 1 },
  { id: 105, number: "105", type: "Standard", price: 550000, status: "available", capacity: 1 },
  { id: 201, number: "201", type: "VIP", price: 950000, status: "available", capacity: 2 },
  { id: 202, number: "202", type: "VIP", price: 950000, status: "available", capacity: 2 },
  { id: 203, number: "203", type: "VIP", price: 950000, status: "available", capacity: 2 },
  { id: 301, number: "301", type: "Suite", price: 1800000, status: "available", capacity: 2 },
  { id: 302, number: "302", type: "Suite", price: 1800000, status: "available", capacity: 2 },
];

function normalizeRoomRow(room) {
  const numericNumber = Number(room.number);
  return {
    id: Number.isFinite(numericNumber) ? numericNumber : room.id,
    dbId: room.id,
    number: String(room.number),
    type: room.type,
    price: Number(room.price) || 0,
    status: room.status || "available",
    capacity: Number(room.capacity) || 1,
    floor: room.floor ?? null,
    amenities: room.amenities || "",
    imageUrl: room.image_url || room.imageUrl || "",
  };
}

async function loadRoomsFromDatabase() {
  const rows = await db.dbAllP(`
    SELECT id, number, type, price, status, capacity, floor, amenities, image_url
    FROM rooms
    ORDER BY CAST(number AS INTEGER), number
  `);
  rooms = (rows || []).map(normalizeRoomRow);
  return rooms;
}

function validateRoomPayload(body, { partial = false } = {}) {
  const number = body?.number?.toString().trim();
  const type = body?.type?.toString().trim();
  const price = Number(body?.price);
  const capacity = Number(body?.capacity ?? 1);
  const status = body?.status?.toString().trim() || "available";
  const floorValue = body?.floor === "" || body?.floor === undefined || body?.floor === null
    ? null
    : Number(body.floor);
  const allowedStatuses = new Set(["available", "reserved", "occupied", "maintenance"]);

  if (!partial && !number) return { error: "Vui lòng nhập số phòng." };
  if (!partial && !type) return { error: "Vui lòng nhập loại phòng." };
  if (!partial && (!Number.isFinite(price) || price <= 0)) return { error: "Giá phòng phải lớn hơn 0." };
  if (!Number.isFinite(capacity) || capacity <= 0) return { error: "Sức chứa phải lớn hơn 0." };
  if (floorValue !== null && !Number.isFinite(floorValue)) return { error: "Tầng phải là số hợp lệ." };
  if (!allowedStatuses.has(status)) return { error: "Trạng thái phòng không hợp lệ." };

  return {
    room: {
      number,
      type,
      price,
      capacity,
      status,
      floor: floorValue,
      amenities: body?.amenities?.toString().trim() || "",
      imageUrl: body?.imageUrl?.toString().trim() || body?.image_url?.toString().trim() || "",
    },
  };
}

function normalizeStatus(status) {
  return String(status || "pending").trim().toLowerCase();
}

function normalizeBookingRow(row) {
  return {
    ...row,
    roomId: row.room_id,
    roomNumber: row.roomNumber || row.room_number || row.room_id,
    customerId: row.customer_id,
    customerName: row.customerName || row.customer_name || "Khách hàng",
    checkIn: row.check_in,
    checkOut: row.check_out,
    totalAmount: Number(row.total_amount || row.totalAmount || 0),
    status: normalizeStatus(row.status),
    createdAt: row.created_at,
  };
}

async function syncRoomStatusFromBookings(roomNumber) {
  const today = new Date().toISOString().slice(0, 10);
  const active = await db.dbGetP(
    `SELECT id
     FROM bookings
     WHERE CAST(room_id AS TEXT) = CAST(? AS TEXT)
       AND LOWER(status) NOT IN ('cancelled', 'canceled', 'completed')
       AND date(check_out) >= date(?)
     LIMIT 1`,
    [String(roomNumber), today]
  );
  const nextStatus = active ? "reserved" : "available";
  await db.dbRunP("UPDATE rooms SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE number = ?", [nextStatus, String(roomNumber)]);
  const roomIndex = rooms.findIndex(r => String(r.number) === String(roomNumber) || String(r.id) === String(roomNumber));
  if (roomIndex !== -1) rooms[roomIndex].status = nextStatus;
}

async function getBookingById(id) {
  const row = await db.dbGetP(
    `SELECT b.*, r.number AS roomNumber, u.name AS customerName, u.phone, u.email
     FROM bookings b
     LEFT JOIN rooms r ON CAST(r.number AS TEXT) = CAST(b.room_id AS TEXT)
     LEFT JOIN users u ON u.id = b.customer_id
     WHERE b.id = ?`,
    [id]
  );
  return row ? normalizeBookingRow(row) : null;
}

async function listBookings({ isAdmin, userId, status, dateFrom, dateTo } = {}) {
  const params = [];
  const where = [];

  if (!isAdmin) {
    where.push("b.customer_id = ?");
    params.push(userId);
  }

  if (status && status !== "all") {
    where.push("LOWER(b.status) = ?");
    params.push(normalizeStatus(status));
  }

  if (dateFrom) {
    where.push("date(b.check_in) >= date(?)");
    params.push(dateFrom);
  }

  if (dateTo) {
    where.push("date(b.check_out) <= date(?)");
    params.push(dateTo);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const rows = await db.dbAllP(
    `SELECT b.*, r.number AS roomNumber, u.name AS customerName, u.phone, u.email
     FROM bookings b
     LEFT JOIN rooms r ON CAST(r.number AS TEXT) = CAST(b.room_id AS TEXT)
     LEFT JOIN users u ON u.id = b.customer_id
     ${whereSql}
     ORDER BY date(b.check_in) DESC, b.id DESC`,
    params
  );
  return (rows || []).map(normalizeBookingRow);
}

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:8001',
  'http://127.0.0.1:8001',
  'https://may-an-nhien.onrender.com',
  ...String(process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
]);

function isAllowedOrigin(origin) {
  if (!origin || allowedOrigins.has(origin)) return true;

  try {
    const parsed = new URL(origin);
    return parsed.protocol === "https:" && parsed.hostname.endsWith(".onrender.com");
  } catch {
    return false;
  }
}

app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
})); 
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  if (process.env.REQUIRE_HTTPS === "true" && req.headers["x-forwarded-proto"] === "http") {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }
  next();
});
app.disable("x-powered-by");
app.use(express.json()); 
app.use(morgan("dev"));
app.use(["/api/login", "/api/auth/login", "/api/auth/register", "/api/auth/forgot-password", "/api/auth/reset-password", "/api/auth/google", "/signin.com"], authLimiter);
app.use(["/api/public/contact"], publicWriteLimiter);

const clientDistPath = path.resolve(__dirname, "../client/dist");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
} else {
  app.get("/", (req, res) => {
    res.json({
      name: "Mây An Nhiên API",
      status: "ok",
      health: "/health",
      publicRooms: "/api/public/rooms",
    });
  });
}

function sendError(res, error) {
  console.error(error);
  res.status(500).json({ error: error?.message || "Server error" });
}

function parseJwtPayload(token) {
  try {
    const segment = token.split(".")[1];
    if (!segment) return null;
    let base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    return JSON.parse(Buffer.from(base64, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function getPostLoginPath(user) {
  return user?.role === "admin" ? "/admin/dashboard" : "/booking";
}

function signAuthResponse(user) {
  const safeUser = {
    id: user.id,
    email: user.email,
    role: user.role || "customer",
    name: user.name || user.email,
    phone: user.phone || "",
  };
  const token = jwt.sign(safeUser, JWT_SECRET, { expiresIn: "24h" });
  return { token, user: safeUser };
}

function sendGoogleAuthResultPage(res, { token, user }) {
  const redirectPath = getPostLoginPath(user);
  const redirectUrl = `${FRONTEND_URL}${redirectPath}`;
  res.type("html").send(`<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Đang đăng nhập...</title>
  </head>
  <body>
    <script>
      localStorage.setItem("token", ${JSON.stringify(token)});
      localStorage.setItem("user", ${JSON.stringify(JSON.stringify(user))});
      window.location.replace(${JSON.stringify(redirectUrl)});
    </script>
  </body>
</html>`);
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access token required" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

// --------------------
// Chatbot: keep fully isolated
// --------------------
app.post("/api/chatbot/respond", authenticateToken, async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message) return res.json({ reply: "Mây An Nhiên xin chào! Quý khách cần hỗ trợ gì về phòng hay thực đơn ạ?", suggestedActions: [] });

    if (!genAI) {
      return res.json({ 
        reply: "Tính năng AI hiện đang bảo trì do thiếu cấu hình API Key. Quý khách vui lòng liên hệ lễ tân.",
      });
    }

    const userName = req.user?.name || "quý khách";

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION
    });

    // Truyền tên người dùng vào prompt để AI có thể cá nhân hóa câu trả lời
    const prompt = `Người dùng tên là ${userName}. Câu hỏi: ${message}`;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    return res.json({ 
      reply: responseText,
      detectedLanguage: "vi",
      suggestedActions: [] 
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.json({ 
      reply: "Xin lỗi, tôi đang bận một chút, bạn cần hỗ trợ gì về phòng hay ăn uống không?",
      detectedLanguage: "vi",
      suggestedActions: ["Giá phòng", "Thực đơn hôm nay"]
    });
  }
});

// --------------------
// Auth: login/register compatible with client Login.jsx
// --------------------
const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    // Dev-only shortcut for local demo. Disabled in production.
    if (!isProduction && email === "mkhoi10a6@gmail.com" && password === "0938190949") {
      const adminUser = {
        id: 999,
        name: "M. Khoi Admin",
        email: "mkhoi10a6@gmail.com",
        role: "admin",
        phone: "0938190949"
      };
      const token = jwt.sign(adminUser, JWT_SECRET, { expiresIn: "24h" });
      return res.json({
        success: true,
        token,
        user: adminUser
      });
    }

    // Original dev-only test override. Disabled in production.
    if (!isProduction && email === "admin" && password === "admin123") {
      const adminUser = {
        id: 888,
        name: "Admin",
        email: "admin@hotel.com",
        role: "admin",
        phone: "0000000000"
      };
      const token = jwt.sign(adminUser, JWT_SECRET, { expiresIn: "24h" });
      return res.json({
        success: true,
        token,
        user: adminUser
      });
    }

    // Chuẩn hóa email để tránh lỗi khoảng trắng hoặc viết hoa
    const normalizedEmail = email.toLowerCase().trim();

    const user = await new Promise((resolve) => {
      db.findUserByEmail(normalizedEmail, (err, u) => {
        if (err) resolve(null);
        else resolve(u);
      });
    });

    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = db.validatePassword(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        phone: user.phone,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        phone: user.phone || "",
      },
    });
  } catch (e) {
    return sendError(res, e);
  }
};

app.post("/api/auth/login", handleLogin);
app.post("/api/login", handleLogin); // Alias as requested

app.get("/api/auth/google", (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({ error: "Google Login chưa được cấu hình trên server." });
  }

  const state = jwt.sign(
    { purpose: "google-oauth", createdAt: Date.now() },
    JWT_SECRET,
    { expiresIn: "10m" }
  );
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state,
  });

  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

async function handleGoogleCallback(req, res) {
  try {
    const { code, state, error } = req.query || {};
    if (error) return res.redirect(`${FRONTEND_URL}/login?google=cancelled`);
    if (!code || !state) return res.redirect(`${FRONTEND_URL}/login?google=missing_code`);

    let statePayload;
    try {
      statePayload = jwt.verify(String(state), JWT_SECRET);
    } catch {
      return res.redirect(`${FRONTEND_URL}/login?google=invalid_state`);
    }
    if (statePayload?.purpose !== "google-oauth") {
      return res.redirect(`${FRONTEND_URL}/login?google=invalid_state`);
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code),
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok || !tokenData.id_token) {
      console.error("Google token exchange failed:", tokenData);
      return res.redirect(`${FRONTEND_URL}/login?google=token_failed`);
    }

    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileResponse.json().catch(() => ({}));
    if (!profileResponse.ok || !profile.email || profile.email_verified === false) {
      console.error("Google profile fetch failed:", profile);
      return res.redirect(`${FRONTEND_URL}/login?google=profile_failed`);
    }

    const normalizedEmail = String(profile.email).toLowerCase().trim();
    if (!GMAIL_REGEX.test(normalizedEmail)) {
      return res.redirect(`${FRONTEND_URL}/login?google=not_gmail`);
    }

    let user = await new Promise((resolve, reject) => {
      db.findUserByEmail(normalizedEmail, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      const generatedPassword = bcrypt.hashSync(`google:${profile.sub}:${Date.now()}`, 10);
      const result = await db.dbRunP(
        "INSERT INTO users (email, password, role, name, phone, created_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
        [normalizedEmail, generatedPassword, "customer", profile.name || normalizedEmail, ""]
      );
      user = await db.dbGetP("SELECT * FROM users WHERE id = ?", [result.lastID]);
    } else if (!user.name && profile.name) {
      await db.dbRunP("UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [profile.name, user.id]);
      user = { ...user, name: profile.name };
    }

    const auth = signAuthResponse(user);
    return sendGoogleAuthResultPage(res, auth);
  } catch (e) {
    return sendError(res, e);
  }
}

app.get("/signin.com", handleGoogleCallback);
app.get("/api/auth/google/callback", handleGoogleCallback);


app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name, phone } = req.body || {};
    if (!email || !password || !name) return res.status(400).json({ error: "Vui lòng nhập đầy đủ email, mật khẩu và họ tên." });

    // Chuẩn hóa email trước khi kiểm tra và lưu
    const normalizedEmail = email.toLowerCase().trim();
    if (!GMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ error: "Email phải đúng cú pháp và dùng đuôi @gmail.com." });
    }

    const existingUser = await new Promise((resolve, reject) => {
      db.findUserByEmail(normalizedEmail, (err, u) => {
        if (err) reject(err);
        else resolve(u);
      });
    });

    if (existingUser) return res.status(409).json({ error: "Email đã được sử dụng." });

    const normalizedPhone = (phone ?? "").toString().trim();

    const user = await new Promise((resolve, reject) => {
      db.createUser({
        email: normalizedEmail,
        password,
        name,
        phone: normalizedPhone,
        role: "customer"
      }, (err, u) => {
        if (err) reject(err);
        else resolve(u);
      });
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, phone: user.phone || "" },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.status(201).json({ token, user: { ...user, phone: user.phone || "" } });
  } catch (e) {
    return sendError(res, e);
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const email = req.body?.email?.toString().toLowerCase().trim();
    if (!email || !GMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "Vui lòng nhập email @gmail.com hợp lệ." });
    }

    const user = await new Promise((resolve) => {
      db.findUserByEmail(email, (err, u) => resolve(err ? null : u));
    });

    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy tài khoản với email này." });
    }

    const resetToken = jwt.sign({ id: user.id, email: user.email, purpose: "password-reset" }, JWT_SECRET, { expiresIn: "15m" });
    passwordResetTokens.set(resetToken, { userId: user.id, expiresAt: Date.now() + 15 * 60 * 1000 });

    res.json({
      message: "Mã đặt lại mật khẩu đã được tạo. Demo local hiển thị mã trực tiếp.",
      resetToken,
    });
  } catch (err) {
    return sendError(res, err);
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body || {};
    if (!resetToken || !newPassword) return res.status(400).json({ error: "Thiếu mã đặt lại hoặc mật khẩu mới." });
    if (String(newPassword).length < 6) return res.status(400).json({ error: "Mật khẩu mới phải có ít nhất 6 ký tự." });

    const tokenState = passwordResetTokens.get(resetToken);
    if (!tokenState || tokenState.expiresAt < Date.now()) {
      passwordResetTokens.delete(resetToken);
      return res.status(400).json({ error: "Mã đặt lại đã hết hạn hoặc không hợp lệ." });
    }

    let payload;
    try {
      payload = jwt.verify(resetToken, JWT_SECRET);
    } catch {
      return res.status(400).json({ error: "Mã đặt lại không hợp lệ." });
    }

    if (payload.purpose !== "password-reset" || Number(payload.id) !== Number(tokenState.userId)) {
      return res.status(400).json({ error: "Mã đặt lại không hợp lệ." });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await db.dbRunP("UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [hashedPassword, payload.id]);
    passwordResetTokens.delete(resetToken);
    res.json({ success: true, message: "Đã đặt lại mật khẩu thành công." });
  } catch (err) {
    return sendError(res, err);
  }
});

app.post("/api/auth/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Vui lòng nhập đủ mật khẩu hiện tại và mật khẩu mới." });
    if (String(newPassword).length < 6) return res.status(400).json({ error: "Mật khẩu mới phải có ít nhất 6 ký tự." });

    const user = await db.dbGetP("SELECT * FROM users WHERE id = ?", [req.user.id]);
    if (!user || !db.validatePassword(currentPassword, user.password)) {
      return res.status(400).json({ error: "Mật khẩu hiện tại không đúng." });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await db.dbRunP("UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [hashedPassword, req.user.id]);
    res.json({ success: true, message: "Đã đổi mật khẩu thành công." });
  } catch (err) {
    return sendError(res, err);
  }
});

// --------------------
// API required by task
// --------------------

// API Dịch vụ: Lấy danh sách đơn hàng (Admin)
app.get("/api/service-orders", authenticateToken, (req, res) => {
  if (req.user.role === "admin") {
    res.json(serviceOrders || []);
  } else {
    const orders = (serviceOrders || []).filter(o => o.customerName === req.user.name);
    res.json(orders);
  }
});

// API Dịch vụ: Tạo đơn hàng mới (Customer)
app.post("/api/service-orders", authenticateToken, (req, res) => {
  const { roomNumber, customerName, items, totalAmount, paymentMethod } = req.body || {};

  const amount = Number(totalAmount) || 0;
  const newOrder = {
    id: serviceOrders.length + 1,
    roomNumber,
    customerName,
    items,
    totalAmount: amount,
    status: "Pending", // Mặc định trạng thái ban đầu là Đang phục vụ
    paymentMethod: 'qr',
    createdAt: new Date().toISOString()
  };

  serviceOrders.push(newOrder);

  // Ghi nhận trực tiếp vào Doanh thu đã thu (QR Flow)
  collectedRevenue += amount;

  res.status(201).json(newOrder);
});

// API Dịch vụ: Cập nhật trạng thái hoàn thành (Admin)
app.patch("/api/service-orders/:id", authenticateToken, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  const { id } = req.params;
  const order = serviceOrders.find(o => o.id === parseInt(id));
  if (order) {
    order.status = "Completed";
    return res.json(order);
  }
  res.status(404).json({ error: "Order not found" });
});

// GET hạng phòng: Standard, VIP, Suite
app.get("/api/rooms", authenticateToken, async (req, res) => {
  let sourceRooms = rooms;
  try {
    sourceRooms = await loadRoomsFromDatabase();
  } catch (err) {
    console.error("Load rooms from database failed:", err.message);
  }

  const roomsWithRevenue = sourceRooms.map(room => {
    const roomRevenue = bookings
      .filter(b => Number(b.roomId) === Number(room.id) && b.status !== "Cancelled")
      .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

    return { ...room, revenue: roomRevenue };
  });

  const result = {
    Standard: roomsWithRevenue.filter((r) => r.type === "Standard"),
    VIP: roomsWithRevenue.filter((r) => r.type === "VIP"),
    Suite: roomsWithRevenue.filter((r) => r.type === "Suite"),
    RoyalSuite: roomsWithRevenue.filter((r) => r.type === "Royal Suite"),
    // Trả về flat list để tương thích với logic merge ở Frontend
    rooms: roomsWithRevenue
  };

  res.json(result);
});

app.post("/api/rooms", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Chỉ Admin mới có quyền này" });

  const { room, error } = validateRoomPayload(req.body);
  if (error) return res.status(400).json({ error });

  try {
    await db.dbRunP(
      `INSERT INTO rooms (number, type, price, status, capacity, floor, amenities, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [room.number, room.type, room.price, room.status, room.capacity, room.floor, room.amenities, room.imageUrl]
    );
    const updatedRooms = await loadRoomsFromDatabase();
    const createdRoom = updatedRooms.find(r => r.number === room.number);
    res.status(201).json(createdRoom || room);
  } catch (err) {
    if (err.message?.includes("UNIQUE")) {
      return res.status(409).json({ error: "Số phòng này đã tồn tại." });
    }
    return sendError(res, err);
  }
});

app.put("/api/rooms/:id", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Chỉ Admin mới có quyền này" });

  const originalNumber = req.params.id.toString().trim();
  const { room, error } = validateRoomPayload(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const result = await db.dbRunP(
      `UPDATE rooms
       SET number = ?, type = ?, price = ?, status = ?, capacity = ?, floor = ?, amenities = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
       WHERE number = ?`,
      [room.number, room.type, room.price, room.status, room.capacity, room.floor, room.amenities, room.imageUrl, originalNumber]
    );

    if (result.changes === 0) return res.status(404).json({ error: "Không tìm thấy phòng." });

    const updatedRooms = await loadRoomsFromDatabase();
    const updatedRoom = updatedRooms.find(r => r.number === room.number);
    res.json(updatedRoom || room);
  } catch (err) {
    if (err.message?.includes("UNIQUE")) {
      return res.status(409).json({ error: "Số phòng này đã tồn tại." });
    }
    return sendError(res, err);
  }
});

app.delete("/api/rooms/:id", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Chỉ Admin mới có quyền này" });

  const roomNumber = req.params.id.toString().trim();

  try {
    const result = await db.dbRunP("DELETE FROM rooms WHERE number = ?", [roomNumber]);
    if (result.changes === 0) return res.status(404).json({ error: "Không tìm thấy phòng." });
    await loadRoomsFromDatabase();
    res.json({ success: true });
  } catch (err) {
    return sendError(res, err);
  }
});

// API Admin: Cập nhật trạng thái phòng thủ công
// API cho Admin cập nhật trạng thái phòng thủ công
// Task 2: API cho Admin cập nhật trạng thái phòng thủ công vào Database
app.put("/api/rooms/:id/status", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Chỉ Admin mới có quyền này" });

  const { id } = req.params;
  const { status } = req.body;

  try {
    // Thực hiện UPDATE trực tiếp vào SQLite để dữ liệu được lưu bền vững
    const result = await db.dbRunP(
      "UPDATE rooms SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE number = ?",
      [status, String(id)]
    );
    if (result.changes === 0) return res.status(404).json({ error: "Không tìm thấy phòng." });

    // Đồng bộ mảng local trong RAM để các thành phần khác (Dashboard) nhận diện ngay lập tức
    const updatedRooms = await loadRoomsFromDatabase();
    const updatedRoom = updatedRooms.find(r => String(r.number) === String(id));

    res.json({ success: true, message: "Cập nhật trạng thái thành công", status, room: updatedRoom });
  } catch (err) {
    console.error("Manual Status Update Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET dịch vụ: Cafe muối, Trà mãng cầu
app.get("/api/services", authenticateToken, (req, res) => {
  const getter = db.getPublicServicesLanding;
  if (typeof getter !== "function") return res.json([]);

  getter((err, rows) => {
    if (err) return sendError(res, err);

    const allowedNames = new Set(["Cafe muối", "Trà mãng cầu"]);
    const filtered = (rows || []).filter((s) => allowedNames.has(s.name));
    res.json(filtered);
  });
});

// POST booking: store info
// Task 1: Tự động cập nhật trạng thái phòng khi đặt thành công
app.post("/api/bookings", authenticateToken, async (req, res) => {
  try {
    const { roomId, room_id, customerName, customer_id, phone, checkIn, checkOut, totalAmount } = req.body || {};
    const finalRoomId = roomId || room_id;

    if (!finalRoomId || !checkIn || !checkOut) return res.status(400).json({ error: "Thiếu thông tin phòng hoặc ngày tháng" });
    if (new Date(checkOut) <= new Date(checkIn)) return res.status(400).json({ error: "Ngày trả phải sau ngày nhận." });

    const amount = Number(totalAmount || 0);
    const bookingCustomerId = customer_id || req.user.id;

    await db.dbRunP("BEGIN IMMEDIATE");
    let insertResult;
    try {
      const overlap = await db.dbGetP(
        `SELECT id
         FROM bookings
         WHERE CAST(room_id AS TEXT) = CAST(? AS TEXT)
           AND LOWER(status) NOT IN ('cancelled', 'canceled')
           AND date(?) < date(check_out)
           AND date(?) > date(check_in)
         LIMIT 1`,
        [String(finalRoomId), checkIn, checkOut]
      );

      if (overlap) {
        await db.dbRunP("ROLLBACK");
        return res.status(409).json({ error: "Phòng này đã có lịch đặt trùng thời gian. Vui lòng chọn phòng hoặc ngày khác." });
      }

      insertResult = await db.dbRunP(
        "INSERT INTO bookings (room_id, customer_id, check_in, check_out, total_amount, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [finalRoomId, bookingCustomerId, checkIn, checkOut, amount, "pending", "Chờ admin xác nhận"]
      );
      await db.dbRunP("UPDATE rooms SET status = 'reserved', updated_at = CURRENT_TIMESTAMP WHERE number = ?", [String(finalRoomId)]);
      await db.dbRunP("COMMIT");
    } catch (err) {
      await db.dbRunP("ROLLBACK").catch(() => {});
      throw err;
    }

    await loadRoomsFromDatabase();

    const newBooking = {
      id: insertResult.lastID,
      roomId: finalRoomId,
      customerId: bookingCustomerId,
      customerName: customerName || "Khách hàng",
      phone,
      checkIn,
      checkOut,
      totalAmount: amount,
      status: "pending",
      paymentMethod: "qr",
      createdAt: new Date().toISOString(),
    };

    bookings.push(newBooking);

    return res.status(201).json(newBooking);
  } catch (e) {
    return sendError(res, e);
  }
});

// API Booking: Cập nhật trạng thái và điều chỉnh doanh thu (Admin)
app.get("/api/admin/bookings", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  try {
    const data = await listBookings({
      isAdmin: true,
      status: req.query.status,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    });
    res.json(data);
  } catch (err) {
    return sendError(res, err);
  }
});

app.patch("/api/admin/bookings/:id", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  const { id } = req.params;
  const status = normalizeStatus(req.body?.status);
  const allowedStatuses = new Set(["pending", "confirmed", "completed", "cancelled"]);
  if (!allowedStatuses.has(status)) return res.status(400).json({ error: "Trạng thái đơn không hợp lệ." });

  try {
    const current = await getBookingById(id);
    if (!current) return res.status(404).json({ error: "Booking not found" });

    if (status === "confirmed" && normalizeStatus(current.status) !== "confirmed") {
      const overlap = await db.dbGetP(
        `SELECT id
         FROM bookings
         WHERE id <> ?
           AND CAST(room_id AS TEXT) = CAST(? AS TEXT)
           AND LOWER(status) IN ('pending', 'confirmed')
           AND date(?) < date(check_out)
           AND date(?) > date(check_in)
         LIMIT 1`,
        [id, String(current.roomId), current.checkIn, current.checkOut]
      );
      if (overlap) {
        return res.status(409).json({ error: "Không thể xác nhận vì phòng có lịch đặt trùng." });
      }
    }

    await db.dbRunP("UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [status, id]);
    await syncRoomStatusFromBookings(current.roomId);

    const updated = await getBookingById(id);
    return res.json(updated);
  } catch (err) {
    return sendError(res, err);
  }
});

// API Promotions: Management
app.get("/api/promotions", authenticateToken, (req, res) => {
  db.getAll("promotions", (err, rows) => {
    if (err) return sendError(res, err);
    res.json(rows || []);
  });
});

app.post("/api/promotions", authenticateToken, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  db.create("promotions", req.body, (err, row) => {
    if (err) return sendError(res, err);
    res.status(201).json(row);
  });
});

app.put("/api/promotions/:id", authenticateToken, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  db.update("promotions", req.params.id, req.body, (err, row) => {
    if (err) return sendError(res, err);
    res.json(row);
  });
});

// Task 4: API lấy lịch sử đặt phòng (Joined với Users cho Admin)
app.get("/api/bookings", authenticateToken, async (req, res) => {
  try {
    const data = await listBookings({
      isAdmin: req.user.role === "admin",
      userId: req.user.id,
      status: req.query.status,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    });
    res.json(data);
  } catch (err) {
    res.json(req.user.role === "admin" ? bookings : bookings.filter(b => Number(b.customerId) === Number(req.user.id)));
  }
});

// API Khách hàng: Lấy danh sách khách hàng (Admin)
app.get("/api/customers", authenticateToken, (req, res) => {
  // Chỉ cho phép Admin xem danh sách khách hàng, Customer nhận mảng rỗng để không lỗi loadData
  if (req.user.role !== "admin") return res.json([]);

  if (typeof db.getCustomers === "function") {
    db.getCustomers((err, rows) => {
      if (err) return sendError(res, err);
      res.json(rows || []);
    });
  } else {
    res.json([]);
  }
});

// Admin endpoint to fetch system statistics (revenue)
app.get("/api/admin/stats", authenticateToken, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });

  const range = parseInt(req.query.range) || 7;
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - range);

  let filteredRevenue = 0;
  let filteredBookingCount = 0;
  const dailyData = {};

  // Khởi tạo các ngày trong khoảng range để biểu đồ không bị trống
  for (let i = 0; i < range; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyData[d.toISOString().split('T')[0]] = 0;
  }

  // Lọc doanh thu từ bookings
  bookings.forEach(b => {
    if (!b || !b.createdAt) return;
    const bDate = new Date(b.createdAt);
    if (b.status !== "Cancelled" && !isNaN(bDate.getTime()) && bDate >= startDate) {
      const dateStr = bDate.toISOString().split('T')[0];
      const amount = Number(b.totalAmount) || 0;
      if (dailyData[dateStr] !== undefined) dailyData[dateStr] += amount;
      filteredRevenue += amount;
      filteredBookingCount++;
    }
  });

  // Lọc doanh thu từ dịch vụ
  serviceOrders.forEach(o => {
    if (!o.createdAt) return;
    const oDate = new Date(o.createdAt);
    if (oDate >= startDate) {
      const dateStr = oDate.toISOString().split('T')[0];
      const amount = Number(o.totalAmount) || 0;
      if (dailyData[dateStr] !== undefined) dailyData[dateStr] += amount;
      filteredRevenue += amount;
    }
  });

  const revenueChart = Object.keys(dailyData).sort().map(date => ({ date, revenue: dailyData[date] }));

  res.json({ 
    totalRevenue: filteredRevenue,
    bookingCount: filteredBookingCount,
    occupiedRooms: rooms.filter(r => r.status === 'occupied').length,
    availableRooms: rooms.filter(r => r.status === 'available').length,
    revenueChart
  });
});


// --------------------
// Keep minimal public endpoints for Login landing panels
// --------------------
app.get("/api/public/rooms", (req, res) => {
  if (typeof db.getPublicRoomsPreview !== "function") return res.json([]);
  db.getPublicRoomsPreview((err, rows) => {
    if (err) return sendError(res, err);
    res.json(rows || []);
  });
});

app.get("/api/public/offers", (req, res) => {
  if (typeof db.getPublicPromotions !== "function") return res.json([]);
  db.getPublicPromotions((err, rows) => {
    if (err) return sendError(res, err);
    res.json(rows || []);
  });
});

app.get("/api/public/services-list", (req, res) => {
  if (typeof db.getPublicServicesLanding !== "function") return res.json([]);
  db.getPublicServicesLanding((err, rows) => {
    if (err) return sendError(res, err);
    res.json(rows || []);
  });
});

app.post("/api/public/contact", (req, res) => {
  try {
    const { name, email, message } = req.body || {};
    db.saveContactMessage({ name, email, message }, (err) => {
      if (err) return sendError(res, err);
      return res.json({ ok: true });
    });
  } catch (e) {
    return sendError(res, e);
  }
});

// API Invoices: Lấy danh sách hóa đơn (Cần thiết cho loadData)
app.get("/api/invoices", authenticateToken, (req, res) => {
  res.json([]); // Trả về mảng rỗng nếu chưa triển khai logic hóa đơn
});

app.get("/health", (req, res) => res.send("ok"));

if (fs.existsSync(clientDistPath)) {
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend started at http://localhost:${PORT}`);
});
