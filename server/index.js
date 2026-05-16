require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const db = require("./db");

const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here";

// Safety check for API Key
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is missing from .env. Chatbot features will be disabled.");
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

Tone: Professional, precise, and system-oriented. Always identify as "HotelPro".`;

// Local state management for immediate consistency
let collectedRevenue = 0; // QR Payment
let expectedRevenue = 0;  // Direct Payment
let bookings = [];
let serviceOrders = [];
let rooms = [
  { id: 101, number: "101", type: "Standard", price: 550000, status: "available" },
  { id: 102, number: "102", type: "Standard", price: 550000, status: "available" },
  { id: 103, number: "103", type: "Standard", price: 550000, status: "available" },
  { id: 104, number: "104", type: "Standard", price: 550000, status: "available" },
  { id: 105, number: "105", type: "Standard", price: 550000, status: "available" },
  { id: 201, number: "201", type: "VIP", price: 950000, status: "available" },
  { id: 202, number: "202", type: "VIP", price: 950000, status: "available" },
  { id: 203, number: "203", type: "VIP", price: 950000, status: "available" },
  { id: 301, number: "301", type: "Suite", price: 1800000, status: "available" },
  { id: 302, number: "302", type: "Suite", price: 1800000, status: "available" },
];

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
})); 
app.use(express.json()); 
app.use(morgan("dev"));

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
    if (!message) return res.json({ reply: "HotelPro xin chào! Quý khách cần hỗ trợ gì về phòng hay thực đơn ạ?", suggestedActions: [] });

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

    // Test override for admin mkhoi10a6@gmail.com
    if (email === "mkhoi10a6@gmail.com" && password === "0938190949") {
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

    // Original test override
    if (email === "admin" && password === "admin123") {
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

    const user = await new Promise((resolve, reject) => {
      db.findUserByEmail(email, (err, u) => {
        if (err) return reject(err);
        resolve(u);
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
        phone: user.phone,
      },
    });
  } catch (e) {
    return sendError(res, e);
  }
};

app.post("/api/auth/login", handleLogin);
app.post("/api/login", handleLogin); // Alias as requested


app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name, phone } = req.body || {};
    if (!email || !password || !name) return res.status(400).json({ error: "Email, password, and name required" });

    const existingUser = await new Promise((resolve, reject) => {
      db.findUserByEmail(email, (err, u) => {
        if (err) reject(err);
        else resolve(u);
      });
    });

    if (existingUser) return res.status(409).json({ error: "User already exists" });

    const normalizedPhone = (phone ?? "").toString().trim();

    const user = await new Promise((resolve, reject) => {
      db.createUser({ email, password, name, phone: normalizedPhone, role: "customer" }, (err, u) => {
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

// --------------------
// API required by task
// --------------------

// API Dịch vụ: Lấy danh sách đơn hàng (Admin)
app.get("/api/service-orders", authenticateToken, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  res.json(serviceOrders);
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
app.get("/api/rooms", authenticateToken, (req, res) => {
  // Đồng bộ với mảng rooms local để lấy trạng thái 'occupied' thực tế
  const result = {
    Standard: rooms.filter((r) => r.type === "Standard"),
    VIP: rooms.filter((r) => r.type === "VIP"),
    Suite: rooms.filter((r) => r.type === "Suite"),
    // Trả về flat list để tương thích với logic merge ở Frontend
    rooms: rooms 
  };

  res.json(result);
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
app.post("/api/bookings", authenticateToken, async (req, res) => {
  try {
    const { roomId, room_id, customerName, customer_id, phone, checkIn, checkOut, totalAmount, paymentMethod } = req.body || {};

    const finalRoomId = roomId || room_id;
    if (!finalRoomId || !checkIn || !checkOut) {
      return res.status(400).json({ error: "Thiếu thông tin phòng hoặc ngày tháng" });
    }

    const newBooking = {
      id: bookings.length + 1,
      roomId: finalRoomId,
      customerId: customer_id || req.user.id,
      customerName,
      phone,
      checkIn,
      checkOut,
      totalAmount: Number(totalAmount),
      status: "Confirmed",
      paymentMethod: "qr",
      createdAt: new Date().toISOString(),
    };

    bookings.push(newBooking);

    // Update room status to 'booked' automatically
    const roomIndex = rooms.findIndex(r => r.id === Number(roomId));
    if (roomIndex !== -1) rooms[roomIndex].status = "occupied";

    // Ghi nhận vào Doanh thu đã thu cho Admin Dashboard
    collectedRevenue += Number(totalAmount);

    return res.status(201).json(newBooking);
  } catch (e) {
    return sendError(res, e);
  }
});

// API Booking: Cập nhật trạng thái và điều chỉnh doanh thu (Admin)
app.patch("/api/admin/bookings/:id", authenticateToken, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  const { id } = req.params;
  const { status } = req.body;
  const booking = bookings.find(b => b.id === parseInt(id));

  if (booking) {
    const oldStatus = booking.status;
    
    // Nếu hủy đơn: hoàn lại doanh thu và mở lại phòng
    if ((oldStatus === "Confirmed" || !oldStatus) && status === "Cancelled") {
      collectedRevenue -= booking.totalAmount;
      const room = rooms.find(r => Number(r.id) === Number(booking.roomId));
      if (room) room.status = "available";
    } else if (oldStatus === "Cancelled" && status === "Confirmed") {
      // Nếu khôi phục đơn: cộng lại doanh thu và khóa phòng
      collectedRevenue += booking.totalAmount;
      const room = rooms.find(r => Number(r.id) === Number(booking.roomId));
      if (room) room.status = "occupied";
    }

    booking.status = status;
    return res.json(booking);
  }
  res.status(404).json({ error: "Booking not found" });
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

app.get("/api/bookings", authenticateToken, (req, res) => {
  if (req.user.role === "admin") {
    res.json(bookings);
  } else {
    // Customers only see their own bookings
    res.json(bookings.filter(b => b.customerId === req.user.id));
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
    if (!b.createdAt) return;
    const bDate = new Date(b.createdAt);
    if (b.status !== "Cancelled" && bDate >= startDate) {
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

app.listen(port, "0.0.0.0", () => {
  console.log(`Backend started at http://localhost:${port}`);
});
