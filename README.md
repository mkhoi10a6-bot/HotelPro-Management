# 🏨 Hotel Management System - Complete Edition

A comprehensive, production-ready hotel management system built with **React**, **Node.js**, **TailwindCSS**, and **PostgreSQL/SQLite**.

## 📋 Table of Contents
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Security](#security)
- [Deployment](#deployment)

---

## ✨ Features

### Core Modules (✅ Complete)
- ✅ **Authentication & Authorization** - JWT-based with role management
- ✅ **Dashboard** - Revenue overview, occupancy metrics, quick actions
- ✅ **Room Management** - CRUD operations, status tracking
- ✅ **Booking Management** - Reservations, conflict detection, calendar view
- ✅ **Customer Management** - Customer profiles, booking history
- ✅ **Invoice & Payment** - Billing, payment processing
- ✅ **User Management** - Admin user creation and role assignment
- ✅ **Services Management** - Additional services (food, laundry, etc.)

### Advanced Modules (🔄 In Development)
- 🔄 **Housekeeping** - Cleaning schedules, maintenance requests
- 🔄 **HR Management** - Employee contracts, benefits
- 🔄 **Payroll System** - Salary calculation, deductions
- 🔄 **Attendance** - Time tracking, shift management
- 🔄 **Inventory** - Stock management, reorder alerts
- 🔄 **Reports** - Revenue analysis, occupancy trends, staff performance

### UI/UX Highlights
- 📱 Responsive design (mobile-first)
- 🎨 Modern TailwindCSS styling
- 🌐 Multi-language support (Vietnamese/English)
- ⚡ Real-time data updates (30-second refresh)
- 🎯 Intuitive navigation and workflows

---

## 🛠️ Technology Stack

### Frontend
```
React 18.3 + Vite
├── Redux Toolkit (State Management)
├── TailwindCSS 3.4 (Styling)
├── Material UI (Components - Migrating to Tailwind)
├── date-fns (Date Manipulation)
└── Axios (HTTP Client)
```

### Backend
```
Node.js v24.15 + Express 4.18
├── JWT (Authentication)
├── bcryptjs (Password Security)
├── SQLite3 (Primary)
├── PostgreSQL (Production)
└── CORS, Morgan (Middleware)
```

### Database
- **Development**: SQLite3 (included)
- **Production**: PostgreSQL (recommended)
- **Alternative**: MySQL

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ ([Download](https://nodejs.org))
- npm v9+
- Git

### Installation & Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd "quản lí khách sạn"

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your configuration

# 4. Backend - Terminal 1
cd server
npm install
npm start
# Backend running on http://localhost:4000

# 5. Frontend - Terminal 2
cd client
npm install
npm run dev
# Frontend running on http://localhost:5173

# 6. Login
# Email: admin@hotel.com
# Password: password
```

### Docker Support (Optional)
```bash
# Build
docker-compose build

# Run
docker-compose up -d

# Access
# Frontend: http://localhost:5173
# Backend: http://localhost:4000
```

---

## 📁 Project Structure

```
quản lí khách sạn/
│
├── 📂 server/                     # Node.js Backend
│   ├── index.js                   # Express server & routes
│   ├── db.js                      # Database abstraction
│   ├── schema.sql                 # Database schema
│   ├── hotel.db                   # SQLite database
│   └── package.json
│
├── 📂 client/                     # React Frontend
│   ├── src/
│   │   ├── App.jsx                # Main application
│   │   ├── store.js               # Redux store
│   │   ├── 📂 components/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── RoomsView.jsx
│   │   │   ├── BookingView.jsx
│   │   │   ├── CustomerView.jsx
│   │   │   ├── PaymentView.jsx
│   │   │   ├── ServicesView.jsx
│   │   │   └── UsersView.jsx
│   │   ├── 📂 features/           # Redux slices
│   │   │   └── hotelSlice.js
│   │   └── 📂 services/
│   │       └── api.js             # API client
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── .env.example                   # Environment template
├── package.json                   # Root configuration
└── README.md                      # This file
```

---

## 🔌 API Documentation

### Authentication Endpoints
```
POST   /api/auth/login              Login user, receive JWT token
POST   /api/auth/register           Register new user account
POST   /api/auth/logout             Logout current user
```

### Collections (Generic CRUD)
```
GET    /api/:collection             Get all records
GET    /api/:collection/:id         Get specific record
POST   /api/:collection             Create new record
PUT    /api/:collection/:id         Update record
DELETE /api/:collection/:id         Delete record (admin only)
```

### Supported Collections
- `rooms` - Room inventory
- `customers` - Customer profiles
- `bookings` - Reservations
- `invoices` - Billing records
- `users` - System users (admin only)
- `services` - Additional services (pending)

### Example Requests

**Login:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hotel.com","password":"password"}'
```

**Get All Rooms:**
```bash
curl -X GET http://localhost:4000/api/rooms \
  -H "Authorization: Bearer <token>"
```

**Create Booking:**
```bash
curl -X POST http://localhost:4000/api/bookings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": 1,
    "customer_id": 1,
    "check_in": "2026-05-15",
    "check_out": "2026-05-20"
  }'
```

---

## 🗄️ Database Schema

### Core Tables

#### `users` - User authentication & authorization
| Field | Type | Constraints |
|-------|------|-------------|
| id | INTEGER | PRIMARY KEY |
| email | TEXT | UNIQUE, NOT NULL |
| password | TEXT | NOT NULL, Hashed |
| role | TEXT | admin/customer/receptionist/accountant |
| name | TEXT | NOT NULL |
| phone | TEXT | |
| status | TEXT | active/inactive |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

#### `rooms` - Room inventory
| Field | Type | Constraints |
|-------|------|-------------|
| id | INTEGER | PRIMARY KEY |
| number | TEXT | UNIQUE, NOT NULL |
| type | TEXT | Standard/Deluxe/Suite |
| price | REAL | NOT NULL |
| capacity | INTEGER | Default: 1 |
| status | TEXT | available/occupied/reserved/maintenance |
| floor | INTEGER | |
| created_at | DATETIME | |

#### `customers` - Customer profiles
| Field | Type | Constraints |
|-------|------|-------------|
| id | INTEGER | PRIMARY KEY |
| name | TEXT | NOT NULL |
| phone | TEXT | UNIQUE |
| email | TEXT | UNIQUE |
| identity_number | TEXT | UNIQUE |
| address | TEXT | |
| created_at | DATETIME | |

#### `bookings` - Reservations
| Field | Type | Constraints |
|-------|------|-------------|
| id | INTEGER | PRIMARY KEY |
| room_id | INTEGER | FOREIGN KEY (rooms) |
| customer_id | INTEGER | FOREIGN KEY (customers) |
| check_in | DATE | NOT NULL |
| check_out | DATE | NOT NULL |
| status | TEXT | confirmed/checked-in/checked-out |
| created_at | DATETIME | |

#### `invoices` - Billing
| Field | Type | Constraints |
|-------|------|-------------|
| id | INTEGER | PRIMARY KEY |
| booking_id | INTEGER | FOREIGN KEY (bookings) |
| amount | REAL | NOT NULL |
| discount | REAL | Default: 0 |
| total_amount | REAL | NOT NULL |
| status | TEXT | pending/paid |
| payment_method | TEXT | cash/bank_transfer |
| payment_date | DATETIME | |
| created_at | DATETIME | |

### Additional Tables
- `services` - Service catalog
- `service_usage` - Service tracking
- `housekeeping_staff`, `cleaning_schedule` - Housekeeping
- `maintenance_requests` - Maintenance
- `employees`, `contracts` - HR
- `payroll_records`, `attendance` - Payroll
- `inventory_items` - Inventory
- `daily_reports` - Analytics

---

## 🔐 Security Features

### Authentication
- **JWT Tokens**: 24-hour expiration, signed with secret key
- **Password Hashing**: bcryptjs with 10 salt rounds
- **Token Validation**: Every protected request verified

### Authorization
- **Role-Based Access Control**: Admin, Receptionist, Accountant, Customer
- **Middleware Protection**: `authenticateToken()`, `requireRole()`
- **Admin-Only Operations**: User management, deletions

### Input Validation
- Email format validation
- Password strength requirements
- SQL injection prevention via prepared statements
- CORS protection
- Rate limiting (recommended for production)

### Best Practices
- Environment variables for secrets
- No sensitive data in API responses
- HTTPS enforced (production)
- Database connection pooling
- Request logging via Morgan

---

## 👥 User Roles & Permissions

### Admin (Quản trị viên)
```
✅ Full system access
✅ User management
✅ System configuration
✅ All reports
✅ Delete operations
```

### Receptionist (Lễ tân)
```
✅ Room management
✅ Booking creation
✅ Check-in/Check-out
✅ Customer management
✅ Invoice viewing
❌ User management
❌ Deletions
```

### Accountant (Kế toán)
```
✅ Payment processing
✅ Invoice management
✅ Financial reports
✅ Revenue tracking
❌ Room modifications
❌ User management
```

### Customer (Khách hàng)
```
✅ View own bookings
✅ View own invoices
❌ Booking creation
❌ Management access
```

---

## 🎨 UI/UX Design

### Color Scheme
```
Primary:      #1f2937 (Slate-900)
Success:      #22c55e (Green-500)
Error:        #ef4444 (Red-500)
Warning:      #f59e0b (Amber-500)
Info:         #3b82f6 (Blue-500)

Room Status:
- Available:   #22c55e (Green)
- Occupied:    #ef4444 (Red)
- Reserved:    #f59e0b (Amber)
- Maintenance: #9ca3af (Gray)
```

### Key Components
- Sidebar navigation
- Dashboard cards with metrics
- Data tables with pagination
- Modal forms for CRUD
- Real-time notifications
- Loading indicators

---

## 📊 Dashboard Features

### Metrics
- 📈 Total Rooms Count
- 📊 Available Rooms
- 🔴 Occupied Rooms
- 💰 Today's Revenue (VND)

### Charts
- 7-Day Revenue Trend (Bar Chart)
- Occupancy Rate Tracking
- Booking Statistics
- Payment Status Overview

### Quick Actions
- 🚀 Create Booking
- ⚡ Fast Check-in
- 📄 View Reports
- 👥 Manage Users

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check if port 4000 is in use
lsof -i :4000

# Kill conflicting process
kill -9 <PID>

# Check Node.js installation
node --version  # Should be v18+
npm --version   # Should be v9+
```

### Database Issues
```bash
# SQLite - Check if file exists
ls -la server/hotel.db

# PostgreSQL - Test connection
psql -h localhost -U postgres -d hotel_management

# Reinitialize database
rm server/hotel.db        # SQLite only
node server/index.js      # Recreates schema
```

### CORS Errors
- Ensure backend running on `http://localhost:4000`
- Verify CORS middleware enabled in `server/index.js`
- Check browser console for specific error messages

### Login Issues
- Clear browser cache and localStorage
- Check credentials: `admin@hotel.com` / `password`
- Verify JWT token in browser DevTools
- Check backend logs for errors

### Build Errors
```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf client/.next  # if using Next.js
npm run build
```

---

## 📈 Performance Optimization

### Database
- Indexed columns for frequent queries
- Optimized booking date range queries
- Connection pooling (recommended for production)

### Frontend
- React component lazy loading
- Redux caching strategy
- Tailwind CSS purging for production
- Image optimization

### Backend
- Express middleware optimization
- Database query caching
- Pagination for large datasets
- Request compression (gzip)

---

## 🚀 Deployment Guide

### Prerequisites
- Production database (PostgreSQL/MySQL)
- Node.js v18+ on server
- Environment variables configured
- SSL certificate (HTTPS)
- Backup strategy

### Deployment Checklist
- [ ] Update JWT_SECRET in `.env`
- [ ] Set NODE_ENV=production
- [ ] Use PostgreSQL (production database)
- [ ] Enable HTTPS/SSL
- [ ] Configure environment variables
- [ ] Test all user roles
- [ ] Setup monitoring
- [ ] Configure backups
- [ ] Load testing

### Recommended Hosting Platforms

**Backend:**
- AWS EC2, Heroku, DigitalOcean, Railway

**Frontend:**
- Vercel, Netlify, AWS S3 + CloudFront

**Database:**
- AWS RDS, Heroku Postgres, DigitalOcean, PlanetScale

### Docker Deployment
```bash
# Build images
docker build -t hotel-backend ./server
docker build -t hotel-frontend ./client

# Push to registry
docker push hotel-backend
docker push hotel-frontend

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📝 Development Workflow

### Adding Features
1. Define database schema
2. Add/update API endpoints
3. Create React component
4. Add Redux slice
5. Update API client
6. Test thoroughly
7. Update documentation

### Code Standards
- Use English for code/comments
- Vietnamese for UI text
- ES6+ syntax
- Functional components with hooks
- Comprehensive error handling
- Input validation
- Loading states
- Accessible UI

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/feature-name

# Commit changes
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/feature-name

# Create pull request
```

---

## 📚 Documentation Links

- [React Documentation](https://react.dev)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Express.js Guide](https://expressjs.com)
- [Redux Toolkit](https://redux-toolkit.js.org)
- [JWT Introduction](https://jwt.io/introduction)
- [PostgreSQL Docs](https://www.postgresql.org/docs)

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Request review from team

---

## 📄 License

This project is proprietary and confidential. Unauthorized copying or distribution is prohibited.

---

## 📞 Support

For issues and questions:
1. Check documentation
2. Review error logs
3. Test in browser DevTools
4. Contact development team

---

**Project Status**: 🟢 Active Development

**Last Updated**: May 13, 2026

**Version**: 1.0.0

**Maintainer**: Development Team
