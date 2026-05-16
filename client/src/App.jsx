import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { loadData, setAuth, logout } from "./features/hotelSlice";

import Dashboard from "./components/Dashboard";
import RoomsView from "./components/RoomsView";
import ServicesView from "./components/ServicesView";
import Login from "./components/Login";
import ChatPageView from "./components/ChatPageView";
import BookingPage from "./components/BookingPage";
import CustomersView from "./components/CustomersView"; 
import AdminBookingsView from "./components/AdminBookingsView"; // Tính năng mới: Danh sách đặt phòng

// Component bảo vệ Route: Kiểm tra đăng nhập
function RequireAuth({ children }) {
  // Defensive selection to prevent crash if hotel slice is missing
  const hotelState = useSelector((s) => s?.hotel || {});
  const { isAuthenticated, token } = hotelState;

  if (token && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <p className="text-xl animate-pulse">Đang xác thực...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Giao diện khung (Sidebar & Header)
function AppShell({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const hotelState = useSelector((s) => s?.hotel || {});
  const user = hotelState?.user || null;
  const isAdmin = user?.role === "admin";
  const path = location.pathname;

  // Helper để hiển thị tiêu đề header linh hoạt
  const getPageTitle = () => {
    if (path === "/") return isAdmin ? "Tổng quan hệ thống" : "Hệ thống Đặt phòng";
    if (path === "/booking") return "Đặt phòng khách sạn";
    if (path === "/rooms") return isAdmin ? "Quản lý danh sách phòng" : "Truy cập bị hạn chế";
    if (path === "/services") return isAdmin ? "Quản lý dịch vụ" : "Dịch vụ của tôi";
    if (path === "/customers") return "Danh sách khách hàng";
    if (path === "/admin/bookings") return "Quản lý đơn đặt phòng";
    if (path === "/chat") return "Hỗ trợ AI";
    return "HotelPro";
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Sidebar Layout: Fixed width w-72 and full height */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200 bg-white p-6 md:flex">
        <div className="mb-8 shrink-0">
          <div className="text-2xl font-black tracking-tight text-slate-800">HotelPro</div>
            <p className="mt-2 text-sm text-slate-600">Xin chào, {user?.name}</p>
            <p className="text-xs text-slate-500">Vai trò: {user?.role}</p>
          </div>

          <div className="space-y-2">
            {isAdmin ? (
              <>
                <button onClick={() => navigate("/")} className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${path === "/" ? "bg-sky-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"}`}>Bảng điều khiển</button>
                <button onClick={() => navigate("/rooms")} className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${path === "/rooms" ? "bg-sky-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"}`}>Quản lý phòng</button>
                <button onClick={() => navigate("/customers")} className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${path === "/customers" ? "bg-sky-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"}`}>Khách hàng</button>
              </>
            ) : (
              <>
                <button onClick={() => navigate("/")} className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${path === "/" || path === "/booking" ? "bg-sky-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"}`}>Đặt phòng</button>
              </>
            )}
            <button onClick={() => navigate("/services")} className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${path === "/services" ? "bg-sky-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"}`}>Dịch vụ</button>
            <button onClick={() => navigate("/chat")} className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${path === "/chat" ? "bg-sky-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"}`}>Hỗ trợ AI</button>
          </div>

          <button onClick={handleLogout} className="mt-6 w-full rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700">Đăng xuất</button>
        </aside>

      {/* Main Content Layout: flex-1 and overflow-auto to prevent overlap */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            {getPageTitle()}
          </h1>
        </header>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation cho Mobile (Chỉ dành cho Customer) */}
      {!isAdmin && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t bg-white/80 p-3 backdrop-blur-lg md:hidden">
          <button
            onClick={() => navigate("/booking")}
            className={`flex flex-col items-center gap-1 ${path === "/booking" || path === "/" ? "text-sky-600" : "text-slate-400"}`}
          >
            <span className="text-[10px] font-bold">Đặt phòng</span>
          </button>
          <button
            onClick={() => navigate("/services")}
            className={`flex flex-col items-center gap-1 ${path === "/services" ? "text-sky-600" : "text-slate-400"}`}
          >
            <span className="text-[10px] font-bold">Dịch vụ</span>
          </button>
          <button
            onClick={() => navigate("/chat")}
            className={`flex flex-col items-center gap-1 ${path === "/chat" ? "text-sky-600" : "text-slate-400"}`}
          >
            <span className="text-[10px] font-bold">Trợ giúp</span>
          </button>
        </nav>
      )}
    </div>
  );
}

function AppContent() {
  const { user } = useSelector((s) => s.hotel);
  const isAdmin = user?.role === "admin";

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {/* Sử dụng /* để hỗ trợ định tuyến lồng nhau bên trong AppShell */}
      <Route path="/*" element={
        <RequireAuth>
          <AppShell>
            <Routes>
              {/* Nếu là Admin thì vào Dashboard, Customer thì vào BookingPage */}
              <Route path="/" element={isAdmin ? <Dashboard /> : <BookingPage />} />
              <Route path="/booking" element={<BookingPage />} />
              <Route path="/rooms" element={isAdmin ? <RoomsView /> : <Navigate to="/" />} />
              <Route path="/customers" element={isAdmin ? <CustomersView /> : <Navigate to="/" />} />
              <Route path="/admin/bookings" element={isAdmin ? <AdminBookingsView /> : <Navigate to="/" />} />
              <Route path="/services" element={<ServicesView />} />
              <Route path="/chat" element={<ChatPageView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppShell>
        </RequireAuth>
      } />
    </Routes>
  );
}

// Main Bootstrap logic
function AuthBootstrap() {
  const dispatch = useDispatch();
  const hotelState = useSelector((s) => s?.hotel || {});
  const { isAuthenticated, token: currentToken } = hotelState;

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    
    if (!token || currentToken) return;
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
      localStorage.removeItem("token");
    }
  }, [dispatch, currentToken]);

  useEffect(() => {
    if (isAuthenticated) dispatch(loadData()).unwrap().catch(() => {});
  }, [dispatch, isAuthenticated]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthBootstrap />
      <AppContent />
    </BrowserRouter>
  );
}