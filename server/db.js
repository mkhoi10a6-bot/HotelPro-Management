const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'hotel.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const ADMIN_EMAIL = 'mkhoi10a6@gmail.com';
const ADMIN_PASSWORD = '0938190949';
const ADMIN_NAME = 'M. Khoi Admin';
const DEFAULT_ROOMS = [
  ['101', 'Standard', 550000, 'available', 1],
  ['102', 'Standard', 550000, 'available', 1],
  ['103', 'Standard', 550000, 'available', 1],
  ['104', 'Standard', 550000, 'available', 1],
  ['105', 'Standard', 550000, 'available', 1],
  ['201', 'VIP', 950000, 'available', 2],
  ['202', 'VIP', 950000, 'available', 2],
  ['203', 'VIP', 950000, 'available', 2],
  ['301', 'Suite', 1800000, 'available', 2],
  ['302', 'Suite', 1800000, 'available', 2],
];

const DEFAULT_SERVICES = [
  ['Bánh mì', 'Bánh mì đặc biệt đầy đủ topping', 35000, 'food', 'active', 'https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/banh_mi_ha_noi_0_26350bb14e.jpg'],
  ['Phở Bò', 'Phở bò truyền thống hương vị đậm đà', 65000, 'food', 'active', 'https://i-giadinh.vnecdn.net/2025/11/17/Pho-bo-Ha-Noi-7-vnexpress-1763-7388-9585-1763372391.jpg'],
  ['Bún Chả Hà Nội', 'Bún chả Hà Nội chuẩn vị, thơm ngon', 65000, 'food', 'active', 'https://i-giadinh.vnecdn.net/2023/04/16/Buoc-11-Thanh-pham-11-7068-1681636164.jpg'],
  ['Gỏi Cuốn Tôm Thịt', 'Gỏi cuốn tươi mát (3 cuốn)', 45000, 'food', 'active', 'https://i-giadinh.vnecdn.net/2025/12/09/Goi-cuon-tom-thit-7-vnexpress-2800-5342-1765272698.jpg'],
  ['Cơm Tấm Sườn Bì Chả', 'Cơm tấm sườn bì chả đặc trưng Sài Gòn', 60000, 'food', 'active', 'https://i-giadinh.vnecdn.net/2024/03/07/7Honthinthnhphm1-1709800144-8583-1709800424.jpg'],
  ['Bánh Mì Chảo Đặc Biệt', 'Bánh mì chảo nóng hổi với trứng và pate', 50000, 'food', 'active', 'https://www.huongnghiepaau.com/wp-content/uploads/2024/01/banh-mi-chao-full-topping.jpg'],
  ['Cafe muối', 'Cà phê muối đặc sản thơm béo', 40000, 'drinks', 'active', 'https://cubes-asia.com/storage/blogs/2024-12/cach-lam-ca-phe-muoi-nguyen-lieu-cong-thuc-lam.jpg'],
  ['Nước suối', 'Nước khoáng đóng chai tinh khiết', 15000, 'drinks', 'active', 'https://truongphatdat.com/wp-content/uploads/2019/12/Dasani-500ml.jpg'],
  ['Trà đào', 'Trà đào miếng thơm mát giải nhiệt', 30000, 'drinks', 'active', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=200'],
  ['Trà Mãng Cầu Xiêm', 'Trà mãng cầu xiêm thanh mát (Hot trend)', 40000, 'drinks', 'active', 'https://blog.aeoneshop.com/wp-content/uploads/2025/11/cach-lam-tra-mang-cau-thumbnail.jpeg'],
  ['Cà Phê Trứng Hà Nội', 'Cà phê trứng béo ngậy chuẩn vị Hà Nội', 50000, 'drinks', 'active', 'https://cooponline.vn/tin-tuc/wp-content/uploads/2025/10/cach-lam-ca-phe-trung-nong-dam-da-beo-min-chuan-huong-viet-3.png'],
  ['Nước Ép Trái Cây Tươi', 'Nước ép tươi theo mùa (Thơm/Dưa hấu)', 30000, 'drinks', 'active', 'https://bizweb.dktcdn.net/100/405/121/products/pineapple-watermelon-juice-jpeg.jpg?v=1634158438353'],
  ['Sinh Tố Bơ Sáp', 'Sinh tố bơ sáp thơm ngon, bổ dưỡng', 40000, 'drinks', 'active', 'https://beptruong.edu.vn/wp-content/uploads/2021/03/sinh-to-bo-sau-rieng.jpg'],
  ['Giặt ủi (Laundry)', 'Dịch vụ giặt sấy trong ngày', 50000, 'other', 'active', 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&q=80&w=200'],
  ['Thuê xe máy (Motorbike rental)', 'Xe máy đời mới, đầy đủ xăng', 150000, 'other', 'active', 'https://motogo.vn/wp-content/uploads/2020/07/motogo-thue-xe-may-ha-giang-5.jpg'],
];

// Promisify db.exec, db.all, db.get, db.run for easier async/await usage
function dbExecP(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function dbAllP(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function dbGetP(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbRunP(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this); // Resolve with 'this' to get lastID, changes
    });
  });
}

// Initialize database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    // Use an async IIFE to chain operations for database setup
    (async () => {
      try {
        // Step 1: Initialize schema (create tables)
        const schemaPath = path.join(__dirname, 'schema.sql');
        if (fs.existsSync(schemaPath)) {
          const schema = fs.readFileSync(schemaPath, 'utf-8');
          await dbExecP(schema);
          console.log('Database schema initialized.');
        } else {
          console.warn('Schema file not found. Skipping schema initialization.');
        }

        // Step 2: Run migrations (add missing columns)
        const columns = await dbAllP("PRAGMA table_info(users)");
        const columnNames = columns.map(c => c.name);

        if (!columnNames.includes('phone')) {
          await dbRunP("ALTER TABLE users ADD COLUMN phone TEXT");
          console.log("Added missing 'phone' column to users table.");
        }
        if (!columnNames.includes('created_at')) {
          await dbRunP("ALTER TABLE users ADD COLUMN created_at TEXT");
          console.log("Added missing 'created_at' column to users table.");
        }

        const serviceUsageColumns = await dbAllP("PRAGMA table_info(service_usage)");
        const serviceUsageColumnNames = serviceUsageColumns.map(c => c.name);
        if (!serviceUsageColumnNames.includes('status')) {
          await dbRunP("ALTER TABLE service_usage ADD COLUMN status TEXT DEFAULT 'pending_delivery'");
          console.log("Added missing 'status' column to service_usage table.");
        }
        if (!serviceUsageColumnNames.includes('payment_method')) {
          await dbRunP("ALTER TABLE service_usage ADD COLUMN payment_method TEXT");
          console.log("Added missing 'payment_method' column to service_usage table.");
        }
        if (!serviceUsageColumnNames.includes('payment_date')) {
          await dbRunP("ALTER TABLE service_usage ADD COLUMN payment_date TEXT");
          console.log("Added missing 'payment_date' column to service_usage table.");
        }
        if (!serviceUsageColumnNames.includes('delivery_notes')) {
          await dbRunP("ALTER TABLE service_usage ADD COLUMN delivery_notes TEXT");
          console.log("Added missing 'delivery_notes' column to service_usage table.");
        }
        if (!serviceUsageColumnNames.includes('invoice_id')) {
          await dbRunP("ALTER TABLE service_usage ADD COLUMN invoice_id INTEGER");
          console.log("Added missing 'invoice_id' column to service_usage table.");
        }
        if (!serviceUsageColumnNames.includes('updated_at')) {
          await dbRunP("ALTER TABLE service_usage ADD COLUMN updated_at TEXT");
          console.log("Added missing 'updated_at' column to service_usage table.");
        }

        // Migrations cho bảng bookings
        const bookingColumns = await dbAllP("PRAGMA table_info(bookings)");
        const bookingColumnNames = bookingColumns.map(c => c.name);
        if (!bookingColumnNames.includes('total_amount')) {
          await dbRunP("ALTER TABLE bookings ADD COLUMN total_amount REAL DEFAULT 0");
          console.log("Added missing 'total_amount' column to bookings table.");
        }

        const roomColumns = await dbAllP("PRAGMA table_info(rooms)");
        const roomColumnNames = roomColumns.map(c => c.name);
        if (!roomColumnNames.includes('image_url')) {
          await dbRunP("ALTER TABLE rooms ADD COLUMN image_url TEXT");
          console.log("Added missing 'image_url' column to rooms table.");
        }

        const serviceColumns = await dbAllP("PRAGMA table_info(services)");
        const serviceColumnNames = serviceColumns.map(c => c.name);
        if (!serviceColumnNames.includes('image_url')) {
          await dbRunP("ALTER TABLE services ADD COLUMN image_url TEXT");
          console.log("Added missing 'image_url' column to services table.");
        }

        // Step 3: Seed database with sample data
        await seedDatabase();

      } catch (initErr) {
        console.error('Error during database initialization sequence:', initErr.message);
      }
    })();
  }
});

// Seed database with sample data (now an async function)
async function seedDatabase() {
  // 2. Kiểm tra xem đã có User chưa, nếu chưa mới seed dữ liệu mẫu khác
  const row = await dbGetP("SELECT COUNT(*) as count FROM users");
    if (row.count === 0) {
      console.log('Đang khởi tạo dữ liệu mẫu lần đầu...');
      // Seed users
      const users = [
        [ADMIN_EMAIL, bcrypt.hashSync(ADMIN_PASSWORD, 10), 'admin', ADMIN_NAME, '0938190949'],
        ['khachhang@hotel.com', bcrypt.hashSync('password', 10), 'customer', 'Khách hàng mẫu', '0987654321']
      ];

    for (const user of users) {
      await dbRunP("INSERT INTO users (email, password, role, name, phone) VALUES (?, ?, ?, ?, ?)", user);
    }

    await ensureDefaultRooms();

    // Seed customers
    const customers = [
      ['Nguyễn Văn An', '0901234567', 'an.nguyen@gmail.com'],
      ['Trần Thị Bình', '0912345678', 'binh.tran@gmail.com']
    ];

    for (const customer of customers) {
      await dbRunP("INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)", customer);
    }

    console.log('Sample data seeded.');
  }

  await cleanupDemoUsers();
  await ensureDefaultRooms();
  await normalizeLegacyBookingRoomIds();

  // Ensure the fixed admin account still exists and is synced
  const adminRow = await dbGetP("SELECT * FROM users WHERE email = ?", [ADMIN_EMAIL]);
  const hashedPassword = bcrypt.hashSync(ADMIN_PASSWORD, 10);
  if (!adminRow) {
    await dbRunP(
      "INSERT INTO users (email, password, role, name, phone) VALUES (?, ?, ?, ?, ?)",
      [ADMIN_EMAIL, hashedPassword, 'admin', ADMIN_NAME, '0938190949']
    );
    console.log('Fixed admin account created.');
  } else {
    // Luôn cập nhật thông tin admin từ code vào DB để đảm bảo đồng bộ
    await dbRunP(
      "UPDATE users SET role = ?, password = ?, name = ?, phone = ? WHERE email = ?",
      ['admin', hashedPassword, ADMIN_NAME, '0938190949', ADMIN_EMAIL]
    );
    console.log('Admin account synchronization successful.');
  }

  // Seed promotions
  const promoCount = await dbGetP("SELECT COUNT(*) as c FROM promotions");
  if (promoCount.c === 0) {
      const promoRows = [
        ['Đặt sớm — giảm 15%', 'Đặt trước ngày nhận phòng ít nhất 14 ngày. Áp dụng phòng Standard & Deluxe trong khung giờ khuyến mãi.', 'SOM14', 1, 1],
        ['Ở 3 đêm — tặng bữa sáng', 'Gói lưu trú từ 3 đêm trở lên: buffet sáng cho 2 người/phòng (theo điều kiện khách sạn).', 'BF3N', 1, 2],
        ['Thành viên mới', 'Đăng ký tài khoản Mây An Nhiên và đặt phòng lần đầu: nhận voucher giảm 10% cho lần đặt tiếp theo.', 'WEL10', 1, 3],
      ];
    for (const r of promoRows) {
      await dbRunP(
          "INSERT INTO promotions (title, description, code, active, sort_order) VALUES (?, ?, ?, ?, ?)",
          r
        );
    }
    console.log('Default promotions seeded.');
  }

  await ensureDefaultServices();
}

async function ensureDefaultRooms() {
  let insertedCount = 0;

  for (const room of DEFAULT_ROOMS) {
    const result = await dbRunP(
      "INSERT OR IGNORE INTO rooms (number, type, price, status, capacity) VALUES (?, ?, ?, ?, ?)",
      room
    );
    insertedCount += result.changes || 0;
  }

  if (insertedCount > 0) {
    console.log(`Default room sync added ${insertedCount} missing room(s).`);
  }
}

async function ensureDefaultServices() {
  let changedCount = 0;
  const defaultNames = DEFAULT_SERVICES.map(([name]) => name);

  for (const service of DEFAULT_SERVICES) {
    const [name, description, price, category, status, imageUrl] = service;
    const existing = await dbGetP("SELECT id FROM services WHERE name = ? LIMIT 1", [name]);

    if (existing) {
      const result = await dbRunP(
        `UPDATE services
         SET description = ?, price = ?, category = ?, status = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [description, price, category, status, imageUrl, existing.id]
      );
      changedCount += result.changes || 0;
    } else {
      const result = await dbRunP(
        "INSERT INTO services (name, description, price, category, status, image_url) VALUES (?, ?, ?, ?, ?, ?)",
        service
      );
      changedCount += result.changes || 0;
    }
  }

  if (defaultNames.length > 0) {
    const placeholders = defaultNames.map(() => "?").join(", ");
    const result = await dbRunP(
      `UPDATE services
       SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
       WHERE name NOT IN (${placeholders})`,
      defaultNames
    );
    changedCount += result.changes || 0;
  }

  if (changedCount > 0) {
    console.log(`Default service catalog synced (${changedCount} row update/insert operation(s)).`);
  }
}

async function normalizeLegacyBookingRoomIds() {
  const result = await dbRunP(
    `UPDATE bookings
     SET room_id = (
       SELECT rooms.number
       FROM rooms
       WHERE CAST(rooms.id AS TEXT) = CAST(bookings.room_id AS TEXT)
       LIMIT 1
     ),
     updated_at = CURRENT_TIMESTAMP
     WHERE EXISTS (
       SELECT 1
       FROM rooms
       WHERE CAST(rooms.id AS TEXT) = CAST(bookings.room_id AS TEXT)
     )
     AND NOT EXISTS (
       SELECT 1
       FROM rooms
       WHERE CAST(rooms.number AS TEXT) = CAST(bookings.room_id AS TEXT)
     )`
  );

  if (result.changes > 0) {
    console.log(`Normalized ${result.changes} legacy booking room id(s) to room numbers.`);
  }
}

async function cleanupDemoUsers() {
  const demoEmailsToDelete = [
    'customer@hotel.com',
    'phone.test@example.com',
    'test@example.com',
  ];

  for (const email of demoEmailsToDelete) {
    await dbRunP("DELETE FROM users WHERE email = ? AND role = 'customer'", [email]);
  }

  const friendlyNames = [
    ['Trần Thị Hồng Hạnh', 'honghanh354@gmail.com'],
    ['Khách hàng Mây An Nhiên', 'khachhang@hotel.com'],
  ];

  for (const [name, email] of friendlyNames) {
    await dbRunP(
      "UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ? AND role = 'customer'",
      [name, email]
    );
  }
}

// Generic database operations
function getAll(collection, callback) {
  const tableName = getTableName(collection);
  db.all(`SELECT * FROM ${tableName}`, [], callback);
}

function get(collection, id, callback) {
  const tableName = getTableName(collection);
  db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [id], callback);
}

function create(collection, data, callback) {
  const tableName = getTableName(collection);
  const columns = Object.keys(data).join(', ');
  const placeholders = Object.keys(data).map(() => '?').join(', ');
  const values = Object.values(data);

  const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;

  db.run(sql, values, function(err) {
    if (err) {
      callback(err);
    } else {
      // Get the created record
      db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [this.lastID], callback);
    }
  });
}

function update(collection, id, data, callback) {
  const tableName = getTableName(collection);
  const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(data), id];

  const sql = `UPDATE ${tableName} SET ${setClause} WHERE id = ?`;

  db.run(sql, values, function(err) {
    if (err) {
      callback(err);
    } else if (this.changes === 0) {
      callback(new Error('Not found'));
    } else {
      // Get the updated record
      db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [id], callback);
    }
  });
}

function remove(collection, id, callback) {
  const tableName = getTableName(collection);
  db.run(`DELETE FROM ${tableName} WHERE id = ?`, [id], function(err) {
    if (err) {
      callback(err);
    } else if (this.changes === 0) {
      callback(new Error('Not found'));
    } else {
      callback(null, { success: true });
    }
  });
}

// Lấy danh sách khách hàng
function getCustomers(callback) {
  db.all(
    `SELECT
      id,
      name,
      email,
      COALESCE(phone, '') AS phone,
      COALESCE(status, 'active') AS status,
      created_at
    FROM users
    WHERE role = 'customer'
    ORDER BY datetime(created_at) DESC, id DESC`,
    [],
    callback
  );
}

// User-specific functions
function findUserByEmail(email, callback) {
  db.get("SELECT * FROM users WHERE email = ?", [email], callback);
}

function createUser(userData, callback) {
  const hashedPassword = bcrypt.hashSync(userData.password, 10);
  const data = {
    email: userData.email,
    password: hashedPassword,
    role: userData.role || 'customer',
    name: userData.name,
    // Chuẩn hóa phone: loại bỏ khoảng trắng; chấp nhận chuỗi số
    phone: (userData.phone ?? '').toString().trim(),
    created_at: new Date().toISOString(),
  };

  create('users', data, (err, user) => {
    if (err) {
      callback(err);
    } else if (user) {
      callback(null, {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        phone: user.phone || '',
        status: user.status || 'active',
        created_at: user.created_at || data.created_at
      });
    } else {
      callback(new Error("Không thể lấy thông tin người dùng vừa tạo"));
    }
  });
}

function validatePassword(plainPassword, hashedPassword) {
  return bcrypt.compareSync(plainPassword, hashedPassword);
}

/** Room list for public landing (no token). */
function getPublicRoomsPreview(callback) {
  db.all(
    "SELECT id, number, type, price, status, image_url AS imageUrl FROM rooms ORDER BY number COLLATE NOCASE LIMIT 40",
    [],
    callback
  );
}

/** Active promotions for public landing. */
function getPublicPromotions(callback) {
  db.all(
    "SELECT id, title, description, code FROM promotions WHERE active = 1 ORDER BY sort_order ASC, id ASC",
    [],
    callback
  );
}

/** Active billable services for public landing (name + description). */
function getPublicServicesLanding(callback) {
  db.all(
    `SELECT id, name, description, price, category, image_url AS image
     FROM services
     WHERE status = 'active'
     ORDER BY
       CASE category
         WHEN 'food' THEN 1
         WHEN 'drinks' THEN 2
         ELSE 3
       END,
       id ASC
     LIMIT 80`,
    [],
    callback
  );
}

/** All contact form submissions (admin). */
function getAllContactMessages(callback) {
  db.all(
    "SELECT id, name, email, message, created_at FROM contact_messages ORDER BY datetime(created_at) DESC LIMIT 300",
    [],
    callback
  );
}

function saveContactMessage({ name, email, message }, callback) {
  const n = (name ?? "").toString().trim();
  const e = (email ?? "").toString().trim();
  const m = (message ?? "").toString().trim();
  if (!n || !e || !m) {
    return callback(new Error("missing fields"));
  }
  if (m.length > 5000) {
    return callback(new Error("message too long"));
  }
  db.run(
    "INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)",
    [n, e, m],
    function onRun(err) {
      if (err) callback(err);
      else callback(null, { id: this.lastID });
    }
  );
}

// Helper function to get table name from collection
function getTableName(collection) {
  const tableMap = {
    rooms: 'rooms',
    customers: 'customers',
    bookings: 'bookings',
    invoices: 'invoices',
    users: 'users',
    services: 'services',
    service_usage: 'service_usage',
    housekeeping: 'cleaning_schedule',
    inventory: 'inventory_items',
    maintenance: 'maintenance_requests',
    employees: 'employees',
    promotions: 'promotions',
  };
  return tableMap[collection] || collection;
}

// Close database connection on process exit
process.on('exit', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
  });
});

module.exports = {
  getAll,
  get,
  create,
  update,
  remove,
  findUserByEmail,
  createUser,
  validatePassword,
  getPublicRoomsPreview,
  getPublicPromotions,
  getPublicServicesLanding,
  getAllContactMessages,
  saveContactMessage,
  getCustomers,
  dbRunP,
  dbGetP,
  dbAllP
};
