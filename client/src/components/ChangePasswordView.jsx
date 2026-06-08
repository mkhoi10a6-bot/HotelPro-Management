import { useState } from "react";
import { API_URL } from "../services/config";

export default function ChangePasswordView() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setMessage({ type: "error", text: "Vui lòng nhập đầy đủ thông tin." });
      return;
    }

    if (form.newPassword.length < 6) {
      setMessage({ type: "error", text: "Mật khẩu mới phải có ít nhất 6 ký tự." });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setMessage({ type: "error", text: "Mật khẩu xác nhận không khớp." });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Không thể đổi mật khẩu." });
        return;
      }

      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setMessage({ type: "success", text: "Đã đổi mật khẩu thành công." });
    } catch {
      setMessage({ type: "error", text: "Không thể kết nối đến server." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl rounded-[28px] border border-white/80 bg-white p-6 shadow-sm shadow-slate-200/70">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-600">Account security</p>
      <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Đổi mật khẩu</h2>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold text-slate-700">
          Mật khẩu hiện tại
          <input
            type="password"
            value={form.currentPassword}
            onChange={(e) => updateField("currentPassword", e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          Mật khẩu mới
          <input
            type="password"
            value={form.newPassword}
            onChange={(e) => updateField("newPassword", e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          Nhập lại mật khẩu mới
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => updateField("confirmPassword", e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </label>

        {message && (
          <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
            message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
        </button>
      </form>
    </div>
  );
}
