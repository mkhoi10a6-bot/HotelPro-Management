const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'hotel.db');
const ADMIN_EMAIL = 'mkhoi10a6@gmail.com';
const ADMIN_PASSWORD = '0938190949';
const ADMIN_NAME = 'Admin Hotel';

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
  // Check if data already exists
  const row = await dbGetP("SELECT COUNT(*) as count FROM users");

    if (row.count === 0) {
      // Seed users
      const users = [
        [ADMIN_EMAIL, bcrypt.hashSync(ADMIN_PASSWORD, 10), 'admin', ADMIN_NAME, '0938190949'],
        ['customer@hotel.com', bcrypt.hashSync('password', 10), 'customer', 'Customer User', '0987654321']
      ];

    for (const user of users) {
      await dbRunP("INSERT INTO users (email, password, role, name, phone) VALUES (?, ?, ?, ?, ?)", user);
    }

    // Seed rooms
    const rooms = [
      ['101', 'Standard', 950000, 'available'],
      ['102', 'Deluxe', 1450000, 'available'],
      ['103', 'Suite', 2400000, 'available']
    ];

    for (const room of rooms) {
      await dbRunP("INSERT INTO rooms (number, type, price, status) VALUES (?, ?, ?, ?)", room);
    }

    // Seed customers
    const customers = [
      ['Nguyen Van A', '0901234567', 'a@example.com'],
      ['Tran Thi B', '0912345678', 'b@example.com']
    ];

    for (const customer of customers) {
      await dbRunP("INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)", customer);
    }

    console.log('Sample data seeded.');
  }

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
        ['Thành viên mới', 'Đăng ký tài khoản HotelPro và đặt phòng lần đầu: nhận voucher giảm 10% cho lần đặt tiếp theo.', 'WEL10', 1, 3],
      ];
    for (const r of promoRows) {
      await dbRunP(
          "INSERT INTO promotions (title, description, code, active, sort_order) VALUES (?, ?, ?, ?, ?)",
          r
        );
    }
    console.log('Default promotions seeded.');
  }

  // Seed services
  const serviceCount = await dbGetP("SELECT COUNT(*) as c FROM services");
  if (serviceCount.c === 0) {
      const svc = [
        ['Lễ tân 24/7', 'Check-in linh hoạt, hỗ trợ hành lý và gọi taxi.', 0, 'other', 'active'],
        ['Trà mãng cầu xiêm', 'Thức uống giải nhiệt vị chua ngọt thanh mát.', 55000, 'drinks', 'active'],
        ['Cafe muối', 'Hương vị cà phê đậm đà kết hợp lớp kem mặn béo ngậy.', 65000, 'drinks', 'active'],
        ['Trà dâu tươi', 'Sự kết hợp giữa trà tươi và dâu tây tự nhiên.', 60000, 'drinks', 'active'],
        ['Bánh mì đặc biệt', 'Bánh mì nóng với pate, chả, thịt nguội và rau ăn kèm.', 75000, 'food', 'active'],
        ['Mì tôm trứng', 'Mì gói phục vụ tại phòng kèm trứng, rau và gia vị.', 85000, 'food', 'active'],
        ['Nhà hàng & bar', 'Suất ăn hoặc đồ uống tiêu chuẩn phục vụ tại nhà hàng hoặc tại phòng.', 180000, 'food', 'active'],
        ['Spa & gym', 'Gói massage thư giãn hoặc sử dụng tiện ích chăm sóc sức khỏe.', 350000, 'spa', 'active'],
        ['Hội nghị', 'Phòng họp nhỏ theo buổi, gồm thiết bị trình chiếu cơ bản.', 1500000, 'other', 'active'],
        ['Giặt ủi', 'Dịch vụ giặt ủi tiêu chuẩn, thu và giao trong ngày.', 120000, 'laundry', 'active'],
        ['Bãi đỗ xe', 'Chỗ đỗ ô tô/xe máy qua đêm trong khu vực khách sạn.', 100000, 'transport', 'active'],
      ];
    for (const r of svc) {
      await dbRunP(
          "INSERT INTO services (name, description, price, category, status) VALUES (?, ?, ?, ?, ?)",
          r
        );
    }
    console.log('Default services for landing seeded.');
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
  db.all("SELECT * FROM customers ORDER BY name", [], callback);
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
        phone: user.phone || ''
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
    "SELECT id, number, type, price, status FROM rooms ORDER BY number COLLATE NOCASE LIMIT 40",
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
    "SELECT id, name, description, price, category FROM services WHERE status = 'active' ORDER BY category, name LIMIT 80",
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
};
