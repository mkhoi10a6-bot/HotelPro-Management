import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

const cleaningStatuses = [
  { value: "pending", label: "Chưa dọn", color: "bg-yellow-100 text-yellow-800" },
  { value: "in_progress", label: "Đang dọn", color: "bg-blue-100 text-blue-800" },
  { value: "completed", label: "Đã dọn", color: "bg-green-100 text-green-800" },
  { value: "inspected", label: "Đã kiểm tra", color: "bg-purple-100 text-purple-800" },
];

export default function HousekeepingView() {
  const { rooms, bookings } = useSelector((state) => state.hotel);
  const [cleaningSchedule, setCleaningSchedule] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [form, setForm] = useState({
    room_id: "",
    status: "pending",
    notes: "",
    staff_id: "",
    scheduled_date: new Date().toISOString().split('T')[0],
  });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/housekeeping", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setCleaningSchedule(data || []);
    } catch (err) {
      console.error("Error loading schedule:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.room_id) {
      setMessage({ type: "error", text: "Vui lòng chọn phòng" });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const method = selectedRoom ? "PUT" : "POST";
      const url = selectedRoom
        ? `/api/housekeeping/${selectedRoom.id}`
        : "/api/housekeeping";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: selectedRoom ? "Cập nhật thành công" : "Thêm lịch mới thành công",
        });
        setForm({ room_id: "", status: "pending", notes: "", staff_assigned: "" });
        setSelectedRoom(null);
        setShowForm(false);
        loadSchedule();
      } else {
        setMessage({ type: "error", text: "Lỗi khi lưu" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi kết nối: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    return cleaningStatuses.find((s) => s.value === status)?.color || "bg-slate-100 text-slate-800";
  };

  const getStatusLabel = (status) => {
    return cleaningStatuses.find((s) => s.value === status)?.label || status;
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xác nhận xóa?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/housekeeping/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Xóa thành công" });
        loadSchedule();
      } else {
        setMessage({ type: "error", text: "Lỗi khi xóa" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi kết nối: " + err.message });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Quản lý dọn dẹp</h1>

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
          <p className="text-sm text-slate-600">Tổng phòng chờ dọn: {cleaningSchedule.filter((s) => s.status === "pending").length}</p>
          <p className="text-sm text-slate-600">Đang dọn: {cleaningSchedule.filter((s) => s.status === "in_progress").length}</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setSelectedRoom(null);
            setForm({ room_id: "", status: "pending", notes: "", staff_assigned: "" });
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition"
        >
          {showForm ? "Hủy" : "+ Thêm lịch dọn"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {selectedRoom ? "Cập nhật lịch dọn" : "Thêm lịch dọn mới"}
          </h2>
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
                <label className="block text-sm font-medium text-slate-700">Trạng thái</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {cleaningStatuses.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Ngày dọn</label>
                <input
                  type="date"
                  value={form.scheduled_date}
                  onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Nhân viên (ID)</label>
                <input
                  type="number"
                  value={form.staff_id}
                  onChange={(e) => setForm({ ...form, staff_id: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="ID nhân viên"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Ghi chú</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows="3"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Ghi chú về dọn dẹp"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition disabled:opacity-60"
              >
                {loading ? "Đang lưu..." : selectedRoom ? "Cập nhật" : "Thêm"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedRoom(null);
                }}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 transition"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schedule Table */}
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Phòng</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Nhân viên</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Trạng thái</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Ghi chú</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {cleaningSchedule.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                  Không có lịch dọn nào
                </td>
              </tr>
            ) : (
              cleaningSchedule.map((item) => {
                const room = rooms.find((r) => r.id === item.room_id);
                return (
                  <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium">Phòng {room?.number}</td>
                    <td className="px-6 py-4">{item.staff_id || "Chưa giao"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.scheduled_date || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedRoom(item);
                            setForm(item);
                            setShowForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Sửa
                        </button>
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
