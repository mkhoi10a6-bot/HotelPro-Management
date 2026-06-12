import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { setAuth } from "../features/hotelSlice";
import { API_URL } from "../services/config";

const initialCredentials = { email: "", password: "", name: "", phone: "" };
const GMAIL_REGEX = /^[a-z0-9._%+-]+@gmail\.com$/i;
const ROOM_IMAGE_FALLBACK = "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=800";

const PUBLIC_API = `${API_URL}/public`;

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("login");
  const [credentials, setCredentials] = useState(initialCredentials);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activePanel, setActivePanel] = useState(null);
  const [publicRooms, setPublicRooms] = useState([]);
  const [publicRoomsLoading, setPublicRoomsLoading] = useState(false);
  const [publicRoomsError, setPublicRoomsError] = useState("");
  const [publicOffers, setPublicOffers] = useState([]);
  const [publicOffersLoading, setPublicOffersLoading] = useState(false);
  const [publicOffersError, setPublicOffersError] = useState("");
  const [publicServices, setPublicServices] = useState([]);
  const [publicServicesLoading, setPublicServicesLoading] = useState(false);
  const [publicServicesError, setPublicServicesError] = useState("");
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactStatus, setContactStatus] = useState({ type: null, text: "" });
  const [contactSending, setContactSending] = useState(false);

  useEffect(() => {
    const googleStatus = new URLSearchParams(location.search).get("google");
    if (!googleStatus) return;

    const messages = {
      cancelled: "Bạn đã huỷ đăng nhập Google.",
      missing_code: "Google chưa trả về mã đăng nhập.",
      invalid_state: "Phiên đăng nhập Google đã hết hạn. Vui lòng thử lại.",
      token_failed: "Không thể xác thực với Google. Kiểm tra Client ID, Secret và Redirect URI.",
      profile_failed: "Không lấy được thông tin tài khoản Google.",
      not_gmail: "Vui lòng dùng tài khoản Gmail để đăng nhập.",
    };
    setError(messages[googleStatus] || "Đăng nhập Google thất bại.");
  }, [location.search]);

  const closePanel = useCallback(() => {
    setActivePanel(null);
    setContactStatus({ type: null, text: "" });
  }, []);

  useEffect(() => {
    if (!activePanel || activePanel === "contact") return;

    if (activePanel === "hotel") {
    setPublicRoomsLoading(true);
    setPublicRoomsError("");
    fetch(`${PUBLIC_API}/rooms`)
      .then((r) => {
        if (!r.ok) throw new Error("fetch_failed");
        return r.json();
      })
      .then((data) => setPublicRooms(Array.isArray(data) ? data : []))
      .catch(() => setPublicRoomsError("Không tải được danh sách phòng. Kiểm tra server đang chạy."))
      .finally(() => setPublicRoomsLoading(false));
    }

    if (activePanel === "offers") {
      setPublicOffersLoading(true);
      fetch(`${PUBLIC_API}/offers`)
        .then(r => r.json())
        .then(data => setPublicOffers(Array.isArray(data) ? data : []))
        .catch(() => setPublicOffersError("Lỗi tải ưu đãi"))
        .finally(() => setPublicOffersLoading(false));
    }

    if (activePanel === "services") {
      setPublicServicesLoading(true);
      fetch(`${PUBLIC_API}/services-list`)
        .then(r => r.json())
        .then(data => setPublicServices(Array.isArray(data) ? data : []))
        .catch(() => setPublicServicesError("Lỗi tải dịch vụ"))
        .finally(() => setPublicServicesLoading(false));
    }
  }, [activePanel]);

  useEffect(() => {
    if (!activePanel) return;
    const onKey = (e) => {
      if (e.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activePanel, closePanel]);

  const handleSubmit = async (event) => {
    event?.preventDefault?.();
    setError("");
    const normalizedEmail = credentials.email.trim().toLowerCase();

    if (!GMAIL_REGEX.test(normalizedEmail)) {
      setError("Email phải đúng cú pháp và dùng đuôi @gmail.com.");
      return;
    }

    if (!credentials.password) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }

    if (mode === "register" && !credentials.name.trim()) {
      setError("Vui lòng nhập họ và tên.");
      return;
    }

    if (mode === "register" && !credentials.phone.trim()) {
      setError("Vui lòng nhập số điện thoại.");
      return;
    }

    setLoading(true);
    try {
      const url = mode === "login" ? `${API_URL}/login` : `${API_URL}/auth/register`;
      const payload = {
        email: normalizedEmail,
        password: credentials.password,
      };
      if (mode === "register") {
        payload.name = credentials.name.trim();
        payload.phone = credentials.phone.trim();
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          setError("Email đã được sử dụng.");
        } else {
          setError(data.error || (mode === "login" ? "Đăng nhập thất bại" : "Đăng ký thất bại"));
        }
      } else {
        // backend may return either {token,user} or {success:true, token, user}
        if (!data || !data.token || !data.user) {
          setError(data?.error || "Đăng nhập thất bại");
        } else {
          // Lưu cả token và user để AuthBootstrap ở App.jsx có thể khôi phục session
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));

          dispatch(setAuth({ user: data.user, token: data.token }));
          navigate("/"); // Chuyển hướng về trang chủ/dashboard sau khi đăng nhập thành công
        }
      }


    } catch (err) {
      setError("Không thể kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    const email = credentials.email.trim().toLowerCase();
    if (!GMAIL_REGEX.test(email)) {
      setError("Vui lòng nhập email @gmail.com hợp lệ.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Không thể tạo mã đặt lại mật khẩu.");
        return;
      }
      setResetToken(data.resetToken || "");
      setMode("reset");
      setSuccess("Đã tạo mã đặt lại mật khẩu. Nhập mật khẩu mới để hoàn tất.");
    } catch {
      setError("Không thể kết nối đến server.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!resetToken.trim()) {
      setError("Thiếu mã đặt lại mật khẩu.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken: resetToken.trim(), newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Không thể đặt lại mật khẩu.");
        return;
      }
      setSuccess("Đã đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.");
      setNewPassword("");
      setResetToken("");
      setMode("login");
    } catch {
      setError("Không thể kết nối đến server.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError("");
    setSuccess("");
    setCredentials(initialCredentials);
    setNewPassword("");
    setResetToken("");
  };

  const focusAuthLogin = useCallback(() => {
    closePanel();
    setMode("login");
    setError("");
    setSuccess("");
    setCredentials(initialCredentials);
  }, [closePanel]);

  const submitContact = async (e) => {
    e.preventDefault();
    setContactStatus({ type: null, text: "" });
    setContactSending(true);
    try {
      const res = await fetch(`${PUBLIC_API}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setContactStatus({ type: "error", text: data.error || "Gửi thất bại" });
      } else {
        setContactStatus({ type: "success", text: "Đã gửi tin nhắn. Chúng tôi sẽ phản hồi qua email." });
        setContactForm({ name: "", email: "", message: "" });
      }
    } catch {
      setContactStatus({ type: "error", text: "Không kết nối được server." });
    } finally {
      setContactSending(false);
    }
  };

  const authSubmitHandler = mode === "forgot" ? handleForgotPassword : mode === "reset" ? handleResetPassword : handleSubmit;
  const productNav = ["Khách sạn", "Vé xe", "Đưa đón sân bay", "Cho thuê xe", "Dịch vụ", "Ưu đãi"];
  const searchTabs = ["Khách sạn", "Thuê xe", "Dịch vụ"];
  const partners = ["Mây Local", "An Nhiên Car", "Sky Shuttle", "Bếp Nhà Mây", "City Tour"];

  return (
    <div className="min-h-screen bg-[#f5f8fb] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-5">
            <button type="button" onClick={() => setActivePanel("hotel")} className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-500 text-xl font-black text-white shadow-lg shadow-sky-200">M</span>
              <span className="text-3xl font-black tracking-tight text-slate-800">mayanhien</span>
            </button>
            <div className="hidden items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 sm:flex">
              <span className="rounded bg-red-500 px-2 py-1 text-xs text-yellow-300">VN</span>
              VND | VI
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-600 lg:justify-end">
            <button type="button" onClick={() => setActivePanel("offers")} className="rounded-full px-4 py-2 hover:bg-sky-50 hover:text-sky-600">
              Khuyến mãi
            </button>
            <button type="button" onClick={() => setActivePanel("contact")} className="rounded-full px-4 py-2 hover:bg-sky-50 hover:text-sky-600">
              Hỗ trợ
            </button>
            <button type="button" onClick={() => switchMode("login")} className="rounded-full bg-sky-100 px-5 py-3 font-black text-sky-700 hover:bg-sky-200">
              Đăng nhập
            </button>
            <button type="button" onClick={() => switchMode("register")} className="rounded-full bg-sky-500 px-5 py-3 font-black text-white shadow-lg shadow-sky-200 hover:bg-sky-600">
              Đăng ký
            </button>
          </nav>
        </div>

        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 pb-4 text-sm font-bold text-slate-500">
          {productNav.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setActivePanel(item === "Dịch vụ" ? "services" : item === "Ưu đãi" ? "offers" : "hotel")}
              className="shrink-0 rounded-full px-4 py-2 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {item}
            </button>
          ))}
        </div>
      </header>

      <main>
        <section
          className="relative overflow-hidden bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(120deg, rgba(2, 132, 199, 0.96), rgba(14, 165, 233, 0.9), rgba(3, 105, 161, 0.92)), url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1800')",
          }}
        >
          <div className="mx-auto grid max-w-7xl gap-8 px-5 pb-28 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="max-w-3xl text-white">
              <p className="text-sm font-black uppercase tracking-[0.28em] text-sky-100">Mây An Nhiên Travel</p>
              <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                Đặt phòng, dịch vụ và chuyến đi nhanh trong một nơi.
              </h1>
              <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-sky-50">
                Tìm phòng trống, chọn dịch vụ ăn uống, thuê xe hoặc liên hệ hỗ trợ. Giao diện mới tập trung vào thao tác đặt chỗ rõ ràng cho khách hàng.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={() => setActivePanel("hotel")} className="rounded-full bg-white px-6 py-3 text-sm font-black text-sky-700 shadow-xl shadow-sky-900/10">
                  Xem phòng
                </button>
                <button type="button" onClick={() => setActivePanel("services")} className="rounded-full border border-white/50 px-6 py-3 text-sm font-black text-white hover:bg-white/10">
                  Xem dịch vụ
                </button>
              </div>
            </div>

            <div className="rounded-[28px] bg-white p-5 shadow-2xl shadow-sky-900/20">
              <div className="flex flex-wrap gap-3 border-b border-slate-100 pb-4">
                {searchTabs.map((tab, index) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActivePanel(tab === "Dịch vụ" ? "services" : "hotel")}
                    className={`rounded-full px-4 py-2 text-sm font-black ${index === 0 ? "bg-sky-100 text-sky-700" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="mt-5 grid gap-4">
                <label className="block">
                  <span className="text-sm font-black text-slate-700">Điểm đến hoặc tên khách sạn</span>
                  <input className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100" placeholder="Mây An Nhiên, Đà Lạt, Nha Trang..." />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-black text-slate-700">Ngày nhận phòng</span>
                    <input type="date" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-black text-slate-700">Ngày trả phòng</span>
                    <input type="date" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                  <label className="block">
                    <span className="text-sm font-black text-slate-700">Khách và phòng</span>
                    <input className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100" placeholder="2 người lớn, 1 phòng" />
                  </label>
                  <button type="button" onClick={() => focusAuthLogin()} className="rounded-xl bg-orange-500 px-8 py-3 text-sm font-black text-white shadow-lg shadow-orange-200 hover:bg-orange-600">
                    Tìm kiếm
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-[#f5f8fb]" />
        </section>

        <section className="mx-auto -mt-16 max-w-7xl px-5">
          <div className="rounded-[28px] bg-white p-5 shadow-xl shadow-slate-200">
            <p className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-slate-400">Đối tác & tiện ích</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {partners.map((partner) => (
                <div key={partner} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-5 text-center text-sm font-black text-slate-600">
                  {partner}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-3">
              {[
                ["Khách sạn", "Kiểm tra phòng trống, xem giá theo từng hạng phòng.", "Xem phòng"],
                ["Dịch vụ", "Đặt món ăn, đồ uống, giặt ủi và thuê xe từ giỏ hàng.", "Xem dịch vụ"],
                ["Quản lý", "Admin theo dõi doanh thu, phòng, đơn đặt và trạng thái.", "Đăng nhập"],
              ].map(([title, desc, action]) => (
                <div key={title} className="rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-black text-slate-900">{title}</h2>
                  <p className="mt-3 min-h-16 text-sm font-medium leading-6 text-slate-500">{desc}</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (title === "Dịch vụ") setActivePanel("services");
                      else if (title === "Khách sạn") setActivePanel("hotel");
                      else focusAuthLogin();
                    }}
                    className="mt-5 rounded-full bg-sky-50 px-4 py-2 text-sm font-black text-sky-700 hover:bg-sky-100"
                  >
                    {action}
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-[28px] bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-sky-500">Ưu đãi hôm nay</p>
                  <h2 className="mt-2 text-3xl font-black text-slate-900">Trải nghiệm nghỉ dưỡng dễ đặt hơn</h2>
                </div>
                <button type="button" onClick={() => setActivePanel("offers")} className="rounded-full bg-slate-900 px-5 py-3 text-sm font-black text-white">
                  Xem ưu đãi
                </button>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="overflow-hidden rounded-3xl bg-sky-100">
                  <img className="h-48 w-full object-cover" src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=900" alt="Không gian khách sạn Mây An Nhiên" />
                  <div className="p-5">
                    <h3 className="text-lg font-black">Combo phòng + bữa sáng</h3>
                    <p className="mt-2 text-sm font-medium text-slate-600">Phù hợp cho khách đi công tác hoặc nghỉ dưỡng ngắn ngày.</p>
                  </div>
                </div>
                <div className="overflow-hidden rounded-3xl bg-orange-100">
                  <img className="h-48 w-full object-cover" src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=900" alt="Dịch vụ ăn uống Mây An Nhiên" />
                  <div className="p-5">
                    <h3 className="text-lg font-black">Dịch vụ tại phòng</h3>
                    <p className="mt-2 text-sm font-medium text-slate-600">Khách thêm món vào giỏ hàng và thanh toán QR nhanh chóng.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-[28px] bg-white p-6 shadow-xl shadow-slate-200 lg:sticky lg:top-32 lg:self-start">
            <div className="mb-5 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
              <button type="button" onClick={() => switchMode("login")} className={`rounded-xl px-4 py-3 text-sm font-black ${mode !== "register" ? "bg-white text-sky-700 shadow-sm" : "text-slate-500"}`}>
                Đăng nhập
              </button>
              <button type="button" onClick={() => switchMode("register")} className={`rounded-xl px-4 py-3 text-sm font-black ${mode === "register" ? "bg-white text-sky-700 shadow-sm" : "text-slate-500"}`}>
                Đăng ký
              </button>
            </div>

            <form onSubmit={authSubmitHandler} className="space-y-4" autoComplete="off" noValidate>
              {mode === "forgot" && <p className="rounded-2xl bg-sky-50 p-3 text-sm font-semibold text-sky-700">Nhập email để tạo mã đặt lại mật khẩu.</p>}
              {mode === "reset" && <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">Nhập mật khẩu mới để hoàn tất đặt lại.</p>}

              <label className="block">
                <span className="text-sm font-black text-slate-700">Email</span>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="ten@gmail.com"
                  autoComplete="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, email: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                />
              </label>

              {mode === "register" && (
                <>
                  <label className="block">
                    <span className="text-sm font-black text-slate-700">Họ tên</span>
                    <input type="text" value={credentials.name} onChange={(e) => setCredentials((prev) => ({ ...prev, name: e.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100" placeholder="Nguyễn Văn A" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-black text-slate-700">Số điện thoại</span>
                    <input type="tel" value={credentials.phone} onChange={(e) => setCredentials((prev) => ({ ...prev, phone: e.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100" placeholder="09..." />
                  </label>
                </>
              )}

              {(mode === "login" || mode === "register") && (
                <label className="block">
                  <span className="text-sm font-black text-slate-700">Mật khẩu</span>
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="Nhập mật khẩu"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    value={credentials.password}
                    onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  />
                </label>
              )}

              {mode === "reset" && (
                <>
                  <label className="block">
                    <span className="text-sm font-black text-slate-700">Mã đặt lại</span>
                    <textarea value={resetToken} onChange={(e) => setResetToken(e.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-black text-slate-700">Mật khẩu mới</span>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
                  </label>
                </>
              )}

              {error && <p className="rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-600">{error}</p>}
              {success && <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{success}</p>}

              <button type="submit" disabled={loading} className="w-full rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-200 hover:bg-orange-600 disabled:opacity-60">
                {loading ? "Đang xử lý..." : mode === "register" ? "Tạo tài khoản" : mode === "forgot" ? "Tạo mã đặt lại" : mode === "reset" ? "Đặt lại mật khẩu" : "Đăng nhập"}
              </button>
            </form>

            {(mode === "login" || mode === "register") && (
              <a href={`${API_URL}/auth/google`} className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50">
                <span className="grid h-6 w-6 place-items-center rounded-full text-lg font-black text-blue-600">G</span>
                Tiếp tục với Google
              </a>
            )}

            <div className="mt-4 text-center text-sm font-semibold text-slate-500">
              {mode === "login" ? (
                <>
                  Chưa có tài khoản?{" "}
                  <button type="button" onClick={() => switchMode("register")} className="font-black text-sky-600">Đăng ký ngay</button>
                  <br />
                  <button type="button" onClick={() => switchMode("forgot")} className="mt-2 font-black text-slate-600">Quên mật khẩu?</button>
                </>
              ) : (
                <>
                  Đã có tài khoản?{" "}
                  <button type="button" onClick={() => switchMode("login")} className="font-black text-sky-600">Đăng nhập</button>
                </>
              )}
            </div>
          </aside>
        </section>
      </main>

      {activePanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-500">Mây An Nhiên</p>
                <h2 className="mt-1 text-2xl font-black text-slate-900">
                  {activePanel === "hotel" && "Khách sạn"}
                  {activePanel === "offers" && "Ưu đãi"}
                  {activePanel === "services" && "Dịch vụ"}
                  {activePanel === "contact" && "Liên hệ"}
                </h2>
              </div>
              <button type="button" onClick={closePanel} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-200">
                Đóng
              </button>
            </div>

            {activePanel === "hotel" && (
              <div className="space-y-4">
                {publicRoomsLoading && <p className="text-sm font-semibold text-sky-600">Đang tải danh sách phòng...</p>}
                {publicRoomsError && <p className="text-sm font-semibold text-rose-600">{publicRoomsError}</p>}
                {!publicRoomsLoading && !publicRoomsError && publicRooms.length === 0 && <p className="text-sm font-semibold text-slate-500">Chưa có phòng khả dụng.</p>}
                <div className="grid gap-4 md:grid-cols-2">
                  {publicRooms.map((room) => (
                    <div key={room.id || room.number} className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50">
                      <img className="h-44 w-full object-cover" src={room.image_url || ROOM_IMAGE_FALLBACK} alt={`Phòng ${room.number}`} />
                      <div className="p-5">
                        <h3 className="text-lg font-black">Phòng {room.number}</h3>
                        <p className="text-sm font-semibold text-slate-500">{room.type}</p>
                        <p className="mt-2 text-xl font-black text-sky-600">{Number(room.price || 0).toLocaleString("vi-VN")}đ/đêm</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePanel === "offers" && (
              <div className="grid gap-4 md:grid-cols-2">
                {publicOffersLoading && <p className="text-sm font-semibold text-sky-600">Đang tải ưu đãi...</p>}
                {publicOffersError && <p className="text-sm font-semibold text-rose-600">{publicOffersError}</p>}
                {!publicOffersLoading && publicOffers.length === 0 && <p className="text-sm font-semibold text-slate-500">Chưa có ưu đãi.</p>}
                {publicOffers.map((offer) => (
                  <div key={offer.id || offer.title} className="rounded-3xl bg-sky-50 p-5">
                    <h3 className="text-lg font-black">{offer.title}</h3>
                    <p className="mt-2 text-sm font-semibold text-slate-600">{offer.description}</p>
                  </div>
                ))}
              </div>
            )}

            {activePanel === "services" && (
              <div>
                {publicServicesLoading && <p className="text-sm font-semibold text-sky-600">Đang tải dịch vụ...</p>}
                {publicServicesError && <p className="text-sm font-semibold text-rose-600">{publicServicesError}</p>}
                <div className="grid gap-4 md:grid-cols-2">
                  {publicServices.map((service) => (
                    <div key={service.id || service.name} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                      <h3 className="text-lg font-black">{service.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{service.description}</p>
                      <p className="mt-3 text-xl font-black text-sky-600">{Number(service.price || 0).toLocaleString("vi-VN")}đ</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePanel === "contact" && (
              <form onSubmit={submitContact} className="space-y-4">
                <input value={contactForm.name} onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100" placeholder="Họ tên" />
                <input value={contactForm.email} onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100" placeholder="Email" />
                <textarea value={contactForm.message} onChange={(e) => setContactForm((prev) => ({ ...prev, message: e.target.value }))} className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100" placeholder="Nội dung cần hỗ trợ" />
                {contactStatus.type && <p className={`text-sm font-semibold ${contactStatus.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>{contactStatus.text}</p>}
                <button disabled={contactSending} className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-black text-white disabled:opacity-60">
                  {contactSending ? "Đang gửi..." : "Gửi liên hệ"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),_transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-white">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-lg font-semibold shadow-sm shadow-slate-950/20">
                Mây An Nhiên
              </div>
              <nav className="flex flex-wrap gap-4 text-sm text-slate-200 sm:gap-6">
                <button type="button" onClick={() => setActivePanel("hotel")} className="transition hover:text-white">
                  Khách sạn
                </button>
                <button type="button" onClick={() => setActivePanel("offers")} className="transition hover:text-white">
                  Ưu đãi
                </button>
                <button type="button" onClick={() => setActivePanel("services")} className="transition hover:text-white">
                  Dịch vụ
                </button>
                <button type="button" onClick={() => setActivePanel("contact")} className="transition hover:text-white">
                  Liên hệ
                </button>
              </nav>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => switchMode("login")} className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white transition hover:border-white/40 hover:bg-white/10">
                Đăng nhập
              </button>
              <button type="button" onClick={() => switchMode("register")} className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400">
                Đăng ký
              </button>
            </div>
          </header>

          <main className="grid gap-10 py-12 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div className="space-y-8">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
                <p className="text-sm uppercase tracking-[0.3em] text-sky-300">Khách sạn &amp; đặt phòng</p>
                <h1 className="mt-4 text-4xl font-semibold leading-tight text-white sm:text-5xl">
                  Đặt phòng khách sạn nhanh chóng, an toàn và giá tốt nhất.
                </h1>
                <p className="mt-4 max-w-xl text-slate-300 leading-7">
                  Tìm nơi nghỉ phù hợp cho chuyến đi của bạn, so sánh giá và đặt ngay trong vài giây. Không gian thân thiện, nhẹ nhàng tại Mây An Nhiên.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-slate-950/10">
                  <p className="text-sm text-slate-300">Ưu đãi hàng đầu</p>
                  <p className="mt-3 text-xl font-semibold text-white">Giá tốt mỗi ngày</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-slate-950/10">
                  <p className="text-sm text-slate-300">Đặt nhanh</p>
                  <p className="mt-3 text-xl font-semibold text-white">Chỉ trong vài phút</p>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
              <div className="mb-6 flex items-center justify-between rounded-3xl bg-slate-950/80 p-4 text-slate-300">
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${mode === "login" || mode === "forgot" || mode === "reset" ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800"}`}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${mode === "register" ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800"}`}
                >
                  Đăng ký
                </button>
              </div>

              <form
                onSubmit={mode === "forgot" ? handleForgotPassword : mode === "reset" ? handleResetPassword : handleSubmit}
                className="space-y-5"
                autoComplete="off"
                noValidate
              >
                {mode === "forgot" && (
                  <div className="rounded-3xl bg-sky-500/10 p-4 text-sm text-sky-100">
                    Nhập email tài khoản để tạo mã đặt lại mật khẩu.
                  </div>
                )}
                {mode === "reset" && (
                  <div className="rounded-3xl bg-sky-500/10 p-4 text-sm text-sky-100">
                    Demo local hiển thị mã trực tiếp. Khi triển khai thật, mã này nên được gửi qua email.
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-300">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="Nhập email"
                    autoComplete="email"
                    value={credentials.email}
                    onChange={(e) => setCredentials((prev) => ({ ...prev, email: e.target.value }))}
                    className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                  />
                </div>

                {mode === "register" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300">Tên đầy đủ</label>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="Nhập họ và tên"
                        value={credentials.name}
                        onChange={(e) => setCredentials((prev) => ({ ...prev, name: e.target.value }))}
                        className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300">Số điện thoại</label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        placeholder="Nhập số điện thoại"
                        value={credentials.phone}
                        onChange={(e) => setCredentials((prev) => ({ ...prev, phone: e.target.value }))}
                        className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                      />
                    </div>
                  </>
                )}

                {(mode === "login" || mode === "register") && (
                <div>
                  <label className="block text-sm font-medium text-slate-300">Mật khẩu</label>
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder={mode === "login" ? "Nhập mật khẩu" : "Tạo mật khẩu"}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    value={credentials.password}
                    onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
                    className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                  />
                </div>
                )}

                {mode === "reset" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300">Mã đặt lại</label>
                      <textarea
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        rows={3}
                        className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-xs text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300">Mật khẩu mới</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nhập mật khẩu mới"
                        className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                      />
                    </div>
                  </>
                )}

                {error && (
                  <div className="rounded-3xl bg-rose-100/10 p-3 text-sm text-rose-200">{error}</div>
                )}
                {success && (
                  <div className="rounded-3xl bg-emerald-100/10 p-3 text-sm text-emerald-200">{success}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-3xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading
                    ? mode === "register"
                      ? "Đang đăng ký..."
                      : mode === "forgot"
                      ? "Đang tạo mã..."
                      : mode === "reset"
                      ? "Đang đặt lại..."
                      : "Đang đăng nhập..."
                    : mode === "register"
                    ? "Đăng ký"
                    : mode === "forgot"
                    ? "Tạo mã đặt lại"
                    : mode === "reset"
                    ? "Đặt lại mật khẩu"
                    : "Đăng nhập"}
                </button>
              </form>

              {(mode === "login" || mode === "register") && (
                <div className="mt-5">
                  <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <span className="h-px flex-1 bg-slate-800" />
                    <span>hoặc</span>
                    <span className="h-px flex-1 bg-slate-800" />
                  </div>
                  <a
                    href={`${API_URL}/auth/google`}
                    className="mt-4 flex w-full items-center justify-center gap-3 rounded-3xl border border-slate-700 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-base font-black text-blue-600">G</span>
                    Tiếp tục với Google
                  </a>
                </div>
              )}

              <div className="mt-4 text-center text-sm text-slate-400">
                {mode === "login" ? (
                  <div className="space-y-2">
                    <p>
                      Chưa có tài khoản?{" "}
                      <button type="button" onClick={() => switchMode("register")} className="font-semibold text-white hover:text-sky-200">
                        Đăng ký ngay
                      </button>
                    </p>
                    <button type="button" onClick={() => switchMode("forgot")} className="font-semibold text-sky-200 hover:text-white">
                      Quên mật khẩu?
                    </button>
                  </div>
                ) : mode === "forgot" || mode === "reset" ? (
                  <span>
                    Nhớ mật khẩu?{" "}
                    <button type="button" onClick={() => switchMode("login")} className="font-semibold text-white hover:text-sky-200">
                      Quay lại đăng nhập
                    </button>
                  </span>
                ) : (
                  <span>
                    Đã có tài khoản?{' '}
                    <button type="button" onClick={() => switchMode("login")} className="font-semibold text-white hover:text-sky-200">
                      Quay lại đăng nhập
                    </button>
                  </span>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {activePanel && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="landing-panel-title"
        >
          <button type="button" className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" aria-label="Đóng" onClick={closePanel} />
          <div className="relative z-10 max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 p-6 text-left shadow-2xl sm:max-w-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 id="landing-panel-title" className="text-xl font-semibold text-white">
                {activePanel === "hotel" && "Khách sạn"}
                {activePanel === "offers" && "Ưu đãi"}
                {activePanel === "services" && "Dịch vụ"}
                {activePanel === "contact" && "Liên hệ"}
              </h2>
              <button
                type="button"
                onClick={closePanel}
                className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-sm text-slate-200 transition hover:bg-white/10"
              >
                Đóng
              </button>
            </div>

            {activePanel === "hotel" && (
              <div className="space-y-4 text-slate-300">
                <p className="text-sm leading-relaxed">
                  Xem loại phòng và giá tham khảo. Để đặt phòng, vui lòng đăng nhập hoặc đăng ký tài khoản.
                </p>
                {publicRoomsLoading && <p className="text-sm text-sky-300">Đang tải danh sách phòng…</p>}
                {publicRoomsError && <p className="text-sm text-rose-300">{publicRoomsError}</p>}
                {!publicRoomsLoading && !publicRoomsError && publicRooms.length === 0 && (
                  <p className="text-sm text-slate-400">Chưa có dữ liệu phòng.</p>
                )}
                {!publicRoomsLoading && !publicRoomsError && publicRooms.length > 0 && (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {publicRooms.map((room) => (
                      <li
                        key={room.id}
                        className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 text-sm"
                      >
                        <img
                          src={room.imageUrl || ROOM_IMAGE_FALLBACK}
                          alt={`Phòng ${room.number}`}
                          className="h-28 w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = ROOM_IMAGE_FALLBACK;
                          }}
                        />
                        <div className="px-4 py-3">
                          <p className="font-semibold text-white">
                            Phòng {room.number} · {room.type}
                          </p>
                          <p className="mt-1 text-slate-400">
                            {(Number(room.price) || 0).toLocaleString("vi-VN")} ₫ / đêm · {room.status || "—"}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={focusAuthLogin}
                  className="w-full rounded-2xl bg-sky-500 py-3 text-sm font-semibold text-white hover:bg-sky-400"
                >
                  Đăng nhập để đặt phòng
                </button>
              </div>
            )}

            {activePanel === "offers" && (
              <div className="space-y-3">
                {publicOffersLoading && <p className="text-sm text-sky-300">Đang tải...</p>}
                {publicOffersError && <p className="text-sm text-rose-300">{publicOffersError}</p>}
                {!publicOffersLoading && publicOffers.length === 0 && (
                  <p className="text-sm text-slate-400">Hiện chưa có ưu đãi nào.</p>
                )}
                {publicOffers.map((o) => (
                  <div key={o.code} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-white">{o.title}</h3>
                      <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-xs font-medium text-sky-300">{o.code}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">{o.desc}</p>
                  </div>
                ))}
                <p className="text-xs text-slate-500">Mã áp dụng khi thanh toán tại quầy hoặc theo chương trình đang diễn ra.</p>
                <button
                  type="button"
                  onClick={focusAuthLogin}
                  className="w-full rounded-2xl border border-white/20 py-3 text-sm font-semibold text-white hover:bg-white/5"
                >
                  Đăng nhập để xem ưu đãi của bạn
                </button>
              </div>
            )}

            {activePanel === "services" && (
              <div className="space-y-3">
                <ul className="space-y-3">
                  {publicServices.map((s) => (
                    <li key={s.id || s.name} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                      <p className="font-medium text-white">{s.title}</p>
                      <p className="mt-1 text-sm text-slate-300">{s.desc}</p>
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={focusAuthLogin} className="w-full rounded-2xl bg-sky-500 py-3 text-sm font-semibold text-white hover:bg-sky-400">
                  Đăng nhập để đặt thêm dịch vụ
                </button>
              </div>
            )}

            {activePanel === "contact" && (
              <form onSubmit={submitContact} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Họ tên</label>
                  <input
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-600 bg-slate-950/70 px-4 py-2.5 text-sm text-white outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Email</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-600 bg-slate-950/70 px-4 py-2.5 text-sm text-white outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Nội dung</label>
                  <textarea
                    required
                    rows={4}
                    maxLength={5000}
                    value={contactForm.message}
                    onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                    className="mt-1 w-full resize-y rounded-2xl border border-slate-600 bg-slate-950/70 px-4 py-2.5 text-sm text-white outline-none focus:border-sky-400"
                  />
                </div>
                {contactStatus.type && (
                  <p className={`text-sm ${contactStatus.type === "success" ? "text-emerald-300" : "text-rose-300"}`}>{contactStatus.text}</p>
                )}
                <button
                  type="submit"
                  disabled={contactSending}
                  className="w-full rounded-2xl bg-sky-500 py-3 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-60"
                >
                  {contactSending ? "Đang gửi…" : "Gửi tin nhắn"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
