import { useState, useEffect } from "react";

export default function InventoryView() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    quantity: "",
    category: "other",
    reorder_level: "",
    supplier: "",
    unit_price: "",
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/inventory", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setItems(data || []);
    } catch (err) {
      console.error("Error loading inventory:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.quantity) {
      setMessage({ type: "error", text: "Vui lòng điền đầy đủ thông tin" });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Thêm mục kho thành công" });
        setForm({ name: "", quantity: "", category: "other", reorder_level: "", supplier: "", unit_price: "" });
        setShowForm(false);
        loadItems();
      } else {
        setMessage({ type: "error", text: "Lỗi khi lưu" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi kết nối: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (quantity, minQuantity) => {
    if (quantity <= minQuantity) return { status: "Cảnh báo", color: "bg-red-100 text-red-800" };
    if (quantity <= minQuantity * 1.5) return { status: "Thấp", color: "bg-yellow-100 text-yellow-800" };
    return { status: "Bình thường", color: "bg-green-100 text-green-800" };
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xác nhận xóa?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/inventory/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Xóa thành công" });
        loadItems();
      } else {
        setMessage({ type: "error", text: "Lỗi khi xóa" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi kết nối: " + err.message });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Quản lý kho hàng</h1>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex justify-between">
        <div>
          <p className="text-sm text-slate-600">Tổng mục: {items.length}</p>
          <p className="text-sm text-slate-600">Cảnh báo: {items.filter((i) => Number(i.quantity) <= Number(i.min_quantity || 0)).length}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition"
        >
          {showForm ? "Hủy" : "+ Thêm mục"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Thêm mục kho mới</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Tên mục</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Ví dụ: Khăn tắm"
              />
            </div>

<div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Số lượng</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Danh mục</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="food">Thực phẩm</option>
                  <option value="linens">Vải</option>
                  <option value="toiletries">Vệ sinh</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Mức tái đặt hàng</label>
                <input
                  type="number"
                  min="0"
                  value={form.reorder_level}
                  onChange={(e) => setForm({ ...form, reorder_level: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Giá/đơn vị</label>
                <input
                  type="number"
                  min="0"
                  value={form.unit_price}
                  onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Nhà cung cấp</label>
              <input
                type="text"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Tên nhà cung cấp"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition disabled:opacity-60"
              >
                {loading ? "Đang lưu..." : "Thêm"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 transition"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inventory Table */}
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-slate-900">Tên mục</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-900">Số lượng</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-900">Danh mục</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-900">Giá</th>
              <th className="px-6 py-3 text-center font-semibold text-slate-900">Trạng thái</th>
              <th className="px-6 py-3 text-center font-semibold text-slate-900">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                  Không có mục nào
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const { status, color } = getStatus(item.quantity, item.min_quantity);
                return (
                  <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium">{item.name}</td>
                    <td className="px-6 py-4">{item.quantity}</td>
                    <td className="px-6 py-4">{item.category}</td>
                    <td className="px-6 py-4 text-slate-600">{item.unit_price || "N/A"}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
