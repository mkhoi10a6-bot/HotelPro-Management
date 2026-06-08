import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { API_URL } from "../services/config";

const statusOptions = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

const statusMeta = {
  pending: { label: "Chờ xác nhận", className: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Đã xác nhận", className: "bg-sky-100 text-sky-700" },
  completed: { label: "Hoàn thành", className: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Đã hủy", className: "bg-rose-100 text-rose-700" },
};

function normalizeStatus(status) {
  return String(status || "pending").toLowerCase();
}

function formatMoney(value) {
  return (Number(value) || 0).toLocaleString("vi-VN");
}

function BookingActions({ booking, onUpdate, disabled }) {
  const status = normalizeStatus(booking.status);
  const actions = [];

  if (status === "pending") actions.push(["confirmed", "Xác nhận"]);
  if (status === "pending" || status === "confirmed") actions.push(["cancelled", "Hủy"]);
  if (status === "confirmed") actions.push(["completed", "Hoàn thành"]);
  if (status === "cancelled") actions.push(["pending", "Khôi phục"]);

  if (actions.length === 0) return <span className="text-xs font-semibold text-slate-400">Không còn thao tác</span>;

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {actions.map(([nextStatus, label]) => (
        <button
          key={nextStatus}
          type="button"
          disabled={disabled}
          onClick={() => onUpdate(booking.id, nextStatus)}
          className={`rounded-2xl px-3 py-2 text-[10px] font-black uppercase transition disabled:cursor-not-allowed disabled:opacity-60 ${
            nextStatus === "cancelled"
              ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
              : nextStatus === "completed"
              ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
              : "bg-sky-50 text-sky-600 hover:bg-sky-100"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function AdminBookingsView() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [filters, setFilters] = useState({ status: "all", dateFrom: "", dateTo: "" });
  const { token: reduxToken } = useSelector((s) => s.hotel || {});
  const token = reduxToken || localStorage.getItem("token");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    const text = params.toString();
    return text ? `?${text}` : "";
  }, [filters]);

  const fetchBookings = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/admin/bookings${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Không tải được danh sách đơn đặt phòng." });
        setBookings([]);
        return;
      }
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch bookings failed:", error);
      setMessage({ type: "error", text: "Lỗi kết nối server." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchBookings();
  }, [token, query]);

  const updateBookingStatus = async (id, status) => {
    setUpdatingId(id);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/admin/bookings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Không thể cập nhật đơn." });
        return;
      }
      setBookings((prev) => prev.map((b) => (b.id === id ? data : b)));
      setMessage({ type: "success", text: "Đã cập nhật trạng thái đơn đặt phòng." });
    } catch (error) {
      console.error("Update status failed:", error);
      setMessage({ type: "error", text: "Lỗi kết nối server." });
    } finally {
      setUpdatingId(null);
    }
  };

  const renderStatus = (booking) => {
    const status = normalizeStatus(booking.status);
    const meta = statusMeta[status] || statusMeta.pending;
    return (
      <span className={`rounded-2xl px-3 py-1.5 text-[10px] font-black uppercase ${meta.className}`}>
        {meta.label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-sm shadow-slate-200/70">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="text-sm font-semibold text-slate-700">
            Trạng thái
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Từ ngày nhận
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Đến ngày trả
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </label>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={fetchBookings}
              className="rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700"
            >
              Lọc
            </button>
            <button
              type="button"
              onClick={() => setFilters({ status: "all", dateFrom: "", dateTo: "" })}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            >
              Xóa lọc
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
          message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
        }`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="rounded-[28px] border border-white/80 bg-white/80 p-8 text-center font-bold text-slate-500 shadow-sm animate-pulse">Đang tải danh sách đặt phòng...</div>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {bookings.map((b) => (
              <div key={b.id} className="rounded-[28px] border border-white/80 bg-white p-4 shadow-sm shadow-slate-200/70">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-400">#{b.id}</p>
                    <p className="text-lg font-black text-sky-600">Phòng {b.roomNumber || b.roomId}</p>
                  </div>
                  {renderStatus(b)}
                </div>
                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  <p><span className="font-bold text-slate-800">{b.customerName}</span> · {b.phone || "Chưa có SĐT"}</p>
                  <p>{b.checkIn} → {b.checkOut}</p>
                  <p className="font-black text-slate-900">{formatMoney(b.totalAmount)} VNĐ</p>
                </div>
                <div className="mt-4">
                  <BookingActions booking={b} onUpdate={updateBookingStatus} disabled={updatingId === b.id} />
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-[32px] border border-white/80 bg-white shadow-sm shadow-slate-200/70 md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left border-collapse">
                <thead className="bg-slate-50/80">
                  <tr className="border-b border-slate-100">
                    <th className="py-5 px-5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">ID</th>
                    <th className="py-5 px-5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Phòng</th>
                    <th className="py-5 px-5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Khách hàng</th>
                    <th className="py-5 px-5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Thời gian</th>
                    <th className="py-5 px-5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Tổng tiền</th>
                    <th className="py-5 px-5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Trạng thái</th>
                    <th className="py-5 px-5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-b border-slate-50 transition hover:bg-slate-50">
                      <td className="py-5 px-5 text-sm font-bold text-slate-400">#{b.id}</td>
                      <td className="py-5 px-5 text-sm font-black text-sky-600">P.{b.roomNumber || b.roomId}</td>
                      <td className="py-5 px-5">
                        <p className="text-sm font-bold text-slate-800">{b.customerName}</p>
                        <p className="text-[10px] text-slate-400">{b.phone || b.email || "—"}</p>
                      </td>
                      <td className="py-5 px-5 text-xs font-medium text-slate-600">{b.checkIn} → {b.checkOut}</td>
                      <td className="py-5 px-5 text-sm font-black text-slate-800">{formatMoney(b.totalAmount)} VNĐ</td>
                      <td className="py-5 px-5">{renderStatus(b)}</td>
                      <td className="py-5 px-5 text-right">
                        <BookingActions booking={b} onUpdate={updateBookingStatus} disabled={updatingId === b.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {bookings.length === 0 && (
            <div className="rounded-[28px] bg-white p-12 text-center text-slate-400 italic shadow-sm">Chưa có dữ liệu đặt phòng.</div>
          )}
        </>
      )}
    </div>
  );
}
