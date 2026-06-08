import { useEffect, useState } from "react";

const emptyForm = {
  title: "",
  description: "",
  code: "",
  active: true,
  sort_order: 0,
};

export default function PromotionsView() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const token = () => localStorage.getItem("token");

  const load = async () => {
    try {
      const res = await fetch("/api/promotions", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (res.ok) setRows(Array.isArray(data) ? data : []);
    } catch {
      setMessage({ type: "error", text: "Không tải được danh sách ưu đãi." });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setMessage(null);
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setForm({
      title: row.title || "",
      description: row.description || "",
      code: row.code || "",
      active: Number(row.active) !== 0,
      sort_order: Number(row.sort_order) || 0,
    });
    setShowForm(true);
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.code.trim()) {
      setMessage({ type: "error", text: "Tiêu đề và mã là bắt buộc." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const body = {
        title: form.title.trim(),
        description: (form.description || "").trim(),
        code: form.code.trim(),
        active: form.active ? 1 : 0,
        sort_order: Number(form.sort_order) || 0,
      };
      const url = editingId
        ? `/api/promotions/${editingId}`
        : "/api/promotions";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: d.error || "Lưu thất bại" });
      } else {
        setMessage({ type: "success", text: editingId ? "Đã cập nhật." : "Đã thêm ưu đãi." });
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        load();
      }
    } catch {
      setMessage({ type: "error", text: "Lỗi kết nối." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa ưu đãi này?")) return;
    try {
      const res = await fetch(`/api/promotions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Đã xóa." });
        load();
      } else {
        setMessage({ type: "error", text: "Xóa thất bại." });
      }
    } catch {
      setMessage({ type: "error", text: "Lỗi kết nối." });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Ưu đãi website</h1>
          <p className="mt-1 text-sm text-slate-600">
            Nội dung hiển thị trên trang đăng nhập → mục <strong>Ưu đãi</strong> (chỉ bản đang bật).
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Thêm ưu đãi
        </button>
      </div>

      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            message.type === "success" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">{editingId ? "Sửa ưu đãi" : "Ưu đãi mới"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">Tiêu đề</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">Mô tả</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Mã</label>
              <input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Thứ tự</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                id="promo-active"
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300"
              />
              <label htmlFor="promo-active" className="text-sm text-slate-700">
                Đang hiển thị trên web
              </label>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
            >
              {loading ? "Đang lưu…" : "Lưu"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 font-semibold">Thứ tự</th>
              <th className="px-4 py-3 font-semibold">Tiêu đề</th>
              <th className="px-4 py-3 font-semibold">Mã</th>
              <th className="px-4 py-3 font-semibold">Bật</th>
              <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Chưa có ưu đãi. Thêm mới hoặc khởi động lại server để seed mặc định.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 text-slate-600">{r.sort_order}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{r.title}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.code}</td>
                  <td className="px-4 py-3">{Number(r.active) ? "Có" : "Không"}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button type="button" onClick={() => startEdit(r)} className="text-sky-600 hover:underline">
                      Sửa
                    </button>
                    <button type="button" onClick={() => handleDelete(r.id)} className="text-rose-600 hover:underline">
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
