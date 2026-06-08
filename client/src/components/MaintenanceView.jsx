import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

const priorities = [
  { value: "low", label: "Thấp", color: "bg-blue-100 text-blue-800" },
  { value: "medium", label: "Trung bình", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "Cao", color: "bg-red-100 text-red-800" },
];

const statuses = [
  { value: "new", label: "Mới", color: "bg-gray-100 text-gray-800" },
  { value: "in_progress", label: "Đang xử lý", color: "bg-blue-100 text-blue-800" },
  { value: "completed", label: "Hoàn thành", color: "bg-green-100 text-green-800" },
  { value: "cancelled", label: "Hủy", color: "bg-red-100 text-red-800" },
];

export default function MaintenanceView() {
  const { rooms } = useSelector((state) => state.hotel);
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    room_id: "",
    issue_description: "",
    priority: "medium",
    status: "new",
    assigned_to: "",
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/maintenance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setRequests(data || []);
    } catch (err) {
      console.error("Error loading requests:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.room_id || !form.description) {
      setMessage({ type: "error", text: "Vui lòng điền đầy đủ thông tin" });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/maintenance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Tạo yêu cầu bảo trì thành công" });
        setForm({ room_id: "", issue_description: "", priority: "medium", status: "new", assigned_to: "" });
        setShowForm(false);
        loadRequests();
      } else {
        setMessage({ type: "error", text: "Lỗi khi lưu" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi kết nối: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityLabel = (priority) => priorities.find((p) => p.value === priority)?.label;
  const getPriorityColor = (priority) => priorities.find((p) => p.value === priority)?.color;
  const getStatusLabel = (status) => statuses.find((s) => s.value === status)?.label;
  const getStatusColor = (status) => statuses.find((s) => s.value === status)?.color;

  const handleDelete = async (id) => {
    if (!window.confirm("Xác nhận xóa?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/maintenance/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Xóa thành công" });
        loadRequests();
      } else {
        setMessage({ type: "error", text: "Lỗi khi xóa" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi kết nối: " + err.message });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Quản lý bảo trì</h1>

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
          <p className="text-sm text-slate-600">Tổng yêu cầu: {requests.length}</p>
          <p className="text-sm text-slate-600">Đang xử lý: {requests.filter((r) => r.status === "in_progress").length}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition"
        >
          {showForm ? "Hủy" : "+ Yêu cầu bảo trì"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Tạo yêu cầu bảo trì mới</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Phòng</label>
                <select
                  required
                  value={form.room_id}
                  onChange={(e) => setForm({ ...form, room_id: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Chọn phòng</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      Phòng {room.number}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Ưu tiên</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {priorities.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Mô tả vấn đề</label>
              <textarea
                required
                value={form.issue_description}
                onChange={(e) => setForm({ ...form, issue_description: e.target.value })}
                rows="3"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Mô tả chi tiết vấn đề cần bảo trì"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Giao cho (ID)</label>
                <input
                  type="number"
                  value={form.assigned_to}
                  onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="ID nhân viên"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Trạng thái</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {statuses.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition disabled:opacity-60"
              >
                {loading ? "Đang lưu..." : "Tạo"}
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

      {/* Requests Table */}
      <div className="rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-slate-900">Phòng</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-900">Vấn đề</th>
              <th className="px-6 py-3 text-center font-semibold text-slate-900">Ưu tiên</th>
              <th className="px-6 py-3 text-center font-semibold text-slate-900">Trạng thái</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-900">Giao cho</th>
              <th className="px-6 py-3 text-center font-semibold text-slate-900">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                  Không có yêu cầu nào
                </td>
              </tr>
            ) : (
              requests.map((req) => {
                const room = rooms.find((r) => r.id === req.room_id);
                return (
                  <tr key={req.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium">Phòng {room?.number}</td>
                    <td className="px-6 py-4">{req.issue_description}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(req.priority)}`}>
                        {getPriorityLabel(req.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(req.status)}`}>
                        {getStatusLabel(req.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">{req.assigned_to || "Chưa giao"}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleDelete(req.id)}
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
