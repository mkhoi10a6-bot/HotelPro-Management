import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate, Outlet } from "react-router-dom";
import { loadData, setAuth, logout } from "./features/hotelSlice";

import Dashboard from "./components/Dashboard";
import RoomsView from "./components/RoomsView";
import ServicesView from "./components/ServicesView";
import Login from "./components/Login";
import ChatPageView from "./components/ChatPageView";
import BookingPage from "./components/BookingPage";
import CustomersView from "./components/CustomersView"; 
import AdminBookingsView from "./components/AdminBookingsView";
import BookingHistory from "./components/BookingHistory";
import ChangePasswordView from "./components/ChangePasswordView";

// New: Unauthorized component
import Unauthorized from "./components/Unauthorized";

// 1. RequireAuth: Thành phần bảo vệ nghiêm ngặt (Xác thực & Phân quyền)
function RequireAuth({ allowedRoles }) {
  const hotelState = useSelector((s) => s?.hotel || {});
  const { isAuthenticated, token, user } = hotelState;
  const location = useLocation();

  const tokenInStorage = localStorage.getItem("token");
  const userInStorage = JSON.parse(localStorage.getItem("user") || "null");

  if (tokenInStorage && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <p className="text-xl animate-pulse font-sans">Đang đồng bộ quyền truy cập...</p>
      </div>
    );
  }

  if (!isAuthenticated && !tokenInStorage) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Lấy role từ Redux, nếu chưa có thì lấy từ localStorage làm dự phòng
  const currentRole = user?.role || userInStorage?.role;

  // Admin có quyền truy cập mọi trang bảo vệ (super-user)
  if (allowedRoles && currentRole !== "admin" && !allowedRoles.includes(currentRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

// 2. AppShell: Giao diện khung dùng Outlet để render nội dung con
function AppShell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const hotelState = useSelector((s) => s?.hotel || {});
  const user = hotelState?.user || null;
  const isAdmin = user?.role === "admin";
  const path = location.pathname;

  // Helper để hiển thị tiêu đề header linh hoạt
  const getPageTitle = () => {
    if (path.startsWith("/admin/dashboard")) return "Bảng điều khiển";
    if (path === "/booking") return "Đặt phòng khách sạn";
    if (path.startsWith("/admin/rooms")) return "Quản lý danh sách phòng";
    if (path === "/services") return isAdmin ? "Quản lý dịch vụ" : "Dịch vụ của tôi";
    if (path.startsWith("/admin/customers")) return "Danh sách khách hàng";
    if (path.startsWith("/admin/bookings")) return "Quản lý đơn đặt phòng";
    if (path === "/account/password") return "Đổi mật khẩu";
    if (path === "/history") return "Lịch sử đặt phòng";
    if (path === "/chat") return "Hỗ trợ AI";
    return "Mây An Nhiên";
  };

  const getPageSubtitle = () => {
    if (path.startsWith("/admin/dashboard")) return "Theo doi doanh thu, phong va luot dat trong he thong.";
    if (path.startsWith("/admin/rooms")) return "Cap nhat hinh anh, gia va tinh trang phong.";
    if (path.startsWith("/admin/customers")) return "Thong tin khach hang da dang ky tai khoan.";
    if (path.startsWith("/admin/bookings")) return "Xu ly xac nhan, huy va hoan thanh don dat phong.";
    if (path === "/booking") return "Chon phong phu hop va dat lich nhanh.";
    if (path === "/services") return "Quan ly va su dung cac dich vu khach san.";
    if (path === "/history") return "Theo doi cac lich dat phong da tao.";
    if (path === "/chat") return "Nhan ho tro nhanh trong qua trinh su dung.";
    if (path === "/account/password") return "Cap nhat bao mat tai khoan.";
    return "Khong gian quan ly khach san May An Nhien.";
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const navItems = [
    ...(isAdmin
      ? [
          { label: "Bảng điều khiển", to: "/admin/dashboard", match: "/admin/dashboard", marker: "BD" },
          { label: "Quản lý phòng", to: "/admin/rooms", match: "/admin/rooms", marker: "P" },
          { label: "Khách hàng", to: "/admin/customers", match: "/admin/customers", marker: "K" },
          { label: "Đơn đặt phòng", to: "/admin/bookings", match: "/admin/bookings", marker: "D" }
        ]
      : [
          { label: "Đặt phòng", to: "/booking", match: "/booking", marker: "DP" }
        ]),
    { label: "Dịch vụ", to: "/services", match: "/services", marker: "DV" },
    { label: "Lịch sử đặt phòng", to: "/history", match: "/history", marker: "LS" },
    { label: "Hỗ trợ AI", to: "/chat", match: "/chat", marker: "AI" },
    { label: "Đổi mật khẩu", to: "/account/password", match: "/account/password", marker: "MK" }
  ];

  const mobileNavItems = isAdmin
    ? navItems.filter((item) => ["/admin/dashboard", "/admin/rooms", "/admin/bookings", "/admin/customers", "/account/password"].includes(item.to))
    : navItems.filter((item) => ["/booking", "/services", "/history", "/chat"].includes(item.to));

  const isActive = (item) => path === item.match || path.startsWith(`${item.match}/`);
  const todayLabel = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date());
  const userInitial = (user?.name || "H").trim().charAt(0).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f7fb] text-slate-900">
      <aside className="hidden w-80 shrink-0 flex-col border-r border-slate-200/80 bg-white/95 p-5 shadow-xl shadow-slate-200/50 md:flex">
        <div className="rounded-[28px] bg-slate-950 p-5 text-white shadow-lg shadow-slate-900/15">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-black text-slate-950">
              H
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight">Mây An Nhiên</div>
              <p className="text-xs font-semibold text-cyan-100">Nghỉ ngơi thật dịu dàng</p>
            </div>
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-4">
            <p className="text-xs font-semibold text-slate-300">Xin chào</p>
            <p className="mt-1 truncate text-sm font-black">{user?.name}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">{user?.role}</p>
          </div>
        </div>

        <nav className="mt-6 space-y-1.5">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className={`group flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm font-bold transition ${
                  active
                    ? "bg-sky-600 text-white shadow-lg shadow-sky-600/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-black ${
                  active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-white"
                }`}>
                  {item.marker}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto w-full rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-700"
        >
          Đăng xuất
        </button>
      </aside>

      <main className="relative flex-1 overflow-y-auto p-4 pb-24 md:p-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_20%_0%,rgba(14,165,233,0.16),transparent_34%),radial-gradient(circle_at_86%_8%,rgba(16,185,129,0.12),transparent_32%)]" />
        <div className="relative mx-auto max-w-[1440px]">
          <header className="mb-7 rounded-[28px] border border-white/80 bg-white/80 p-5 shadow-sm shadow-slate-200/70 backdrop-blur md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-600">Mây An Nhiên Workspace</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                  {getPageTitle()}
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                  {getPageSubtitle()}
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-sm font-black text-emerald-700">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-800">{user?.name}</p>
                  <p className="text-xs font-semibold text-slate-400">{todayLabel}</p>
                </div>
              </div>
            </div>
          </header>

          <Outlet /> {/* This is where nested routes will render */}
        </div>
      </main>

      <nav className="fixed bottom-3 left-3 right-3 z-50 flex gap-2 overflow-x-auto rounded-[24px] border border-white/80 bg-white/90 p-2 shadow-2xl shadow-slate-900/10 backdrop-blur-xl md:hidden">
        {mobileNavItems.map((item) => {
          const active = isActive(item);
          return (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className={`min-w-0 flex-1 rounded-2xl px-2 py-2 text-[10px] font-black transition ${
                active ? "bg-sky-600 text-white shadow-md shadow-sky-600/20" : "text-slate-500"
              }`}
            >
              {item.label.replace("Quản lý ", "").replace(" đặt phòng", "")}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function AppContent() {
  const { user, isAuthenticated } = useSelector((s) => s.hotel);

  // Xác định quyền Admin an toàn hơn
  const userInStorage = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = (user?.role || userInStorage?.role) === "admin";

  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* PROTECTED ROUTES (Cần đăng nhập) */}
      <Route element={<RequireAuth />}>
        {/* Điều hướng gốc dựa trên Role */}
        <Route path="/" element={<Navigate to={isAdmin ? "/admin/dashboard" : "/booking"} replace />} />

        {/* Layout chung AppShell cho các trang bên trong ứng dụng */}
        <Route element={<AppShell />}>

          {/* NHÓM ROUTE ADMIN ONLY */}
          <Route element={<RequireAuth allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/rooms" element={<RoomsView />} />
            <Route path="/admin/customers" element={<CustomersView />} />
            <Route path="/admin/bookings" element={<AdminBookingsView />} />
          </Route>

          {/* NHÓM ROUTE CUSTOMER ONLY */}
          <Route element={<RequireAuth allowedRoles={['customer']} />}>
            <Route path="/booking" element={<BookingPage />} />
          </Route>

          {/* NHÓM ROUTE DÙNG CHUNG (Cả Admin và Customer) */}
          <Route path="/services" element={<ServicesView />} />
          <Route path="/history" element={<BookingHistory />} />
          <Route path="/chat" element={<ChatPageView />} />
          <Route path="/account/password" element={<ChangePasswordView />} />
        </Route>
      </Route>

      {/* CATCH ALL (404) */}
      <Route path="*" element={
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
          <h2 className="text-9xl font-black text-slate-200">404</h2>
          <p className="text-xl font-bold text-slate-500 -mt-8">Trang không tồn tại.</p>
          <button
            onClick={() => window.location.href = "/"}
            className="mt-6 px-6 py-3 bg-sky-600 text-white rounded-2xl font-bold hover:bg-sky-700 transition"
          >
            Về trang chủ
          </button>
        </div>
      } />
    </Routes>
  );
}

// 4. Main App Component with Initialization Guard
export default function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((s) => s.hotel);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    
    // logic gate to recover session before app becomes "ready"
    if (token && !isAuthenticated) {
      try {
        if (savedUser) {
          dispatch(setAuth({ user: JSON.parse(savedUser), token }));
        } else {
          const segment = token.split(".")[1];
          if (segment) {
            const payload = JSON.parse(window.atob(segment.replace(/-/g, "+").replace(/_/g, "/")));
            dispatch(setAuth({ user: payload, token }));
          }
        }
      } catch (e) {
        console.error("Auth recovery failed:", e);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setIsReady(true);
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    // Only load global system data if the user is an admin
    if (isAuthenticated && user?.role === "admin") {
      dispatch(loadData()).unwrap().catch(() => {});
    }
  }, [dispatch, isAuthenticated, user?.role]);

  // Prevents the "Flash of Unauthorized Content" or 403 redirects during sync
  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <p className="text-xl animate-pulse font-sans">Đang đồng bộ quyền truy cập...</p>
      </div>
    );
  }

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AppContent />
    </BrowserRouter>
  );
}
