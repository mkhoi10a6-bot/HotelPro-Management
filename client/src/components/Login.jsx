import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setAuth } from "../features/hotelSlice";

const initialCredentials = { email: "", password: "", name: "", phone: "" };

const PUBLIC_API = "/api/public";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [credentials, setCredentials] = useState(initialCredentials);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
    setLoading(true);
    try {
      const url = mode === "login" ? "/api/login" : `/api/auth/${mode}`;
      const payload = {
        email: credentials.email,
        password: credentials.password,
      };
      if (mode === "register") {
        payload.name = credentials.name;
        payload.phone = credentials.phone;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || (mode === "login" ? "Đăng nhập thất bại" : "Đăng ký thất bại"));
      } else {
        // backend may return either {token,user} or {success:true, token, user}
        if (!data || !data.token || !data.user) {
          setError(data?.error || "Đăng nhập thất bại");
        } else {
          // Lưu cả token và user để AuthBootstrap ở App.jsx có thể khôi phục session
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));

          dispatch(setAuth({ user: data.user, token: data.token }));
          navigate("/");
        }
      }


    } catch (err) {
      setError("Không thể kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError("");
    setCredentials(initialCredentials);
  };

  const focusAuthLogin = useCallback(() => {
    closePanel();
    setMode("login");
    setError("");
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

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),_transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-white">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-lg font-semibold shadow-sm shadow-slate-950/20">
                HotelPro
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
                  Tìm nơi nghỉ phù hợp cho chuyến đi của bạn, so sánh giá và đặt ngay trong vài giây. Giao diện thân thiện, chuyên nghiệp giống Traveloka.
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
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${mode === "login" ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800"}`}
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

              <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
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

                {error && (
                  <div className="rounded-3xl bg-rose-100/10 p-3 text-sm text-rose-200">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-3xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (mode === "login" ? "Đang đăng nhập..." : "Đang đăng ký...") : mode === "login" ? "Đăng nhập" : "Đăng ký"}
                </button>
              </form>

              <div className="mt-4 text-center text-sm text-slate-400">
                {mode === "login" ? (
                  <span>
                    Chưa có tài khoản?{' '}
                    <button type="button" onClick={() => switchMode("register")} className="font-semibold text-white hover:text-sky-200">
                      Đăng ký ngay
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
                        className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm"
                      >
                        <p className="font-semibold text-white">
                          Phòng {room.number} · {room.type}
                        </p>
                        <p className="mt-1 text-slate-400">
                          {(Number(room.price) || 0).toLocaleString("vi-VN")} ₫ / đêm · {room.status || "—"}
                        </p>
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