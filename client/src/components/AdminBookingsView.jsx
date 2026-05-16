import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";

export default function AdminBookingsView() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useSelector((s) => s.hotel || {});

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/admin/bookings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setBookings(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Fetch bookings failed:", error);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchBookings();
  }, [token]);

  const updateBookingStatus = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      }
    } catch (error) {
      console.error("Update status failed:", error);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold animate-pulse">Đang tải danh sách đặt phòng...</div>;

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 animate-in fade-in duration-500">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400">ID</th>
              <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400">Mã Phòng</th>
              <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400">Khách hàng</th>
              <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400">Thời gian</th>
              <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400">Tổng tiền</th>
              <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400">Trạng thái</th>
              <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50 transition duration-200">
                <td className="py-4 px-4 text-sm font-bold text-slate-400">#{b.id}</td>
                <td className="py-4 px-4 text-sm font-black text-sky-600">P.{b.roomId}</td>
                <td className="py-4 px-4">
                  <p className="text-sm font-bold text-slate-800">{b.customerName}</p>
                  <p className="text-[10px] text-slate-400">{b.phone}</p>
                </td>
                <td className="py-4 px-4">
                  <p className="text-xs font-medium text-slate-600">{b.checkIn} → {b.checkOut}</p>
                </td>
                <td className="py-4 px-4 text-sm font-black text-slate-800">
                  {b.totalAmount?.toLocaleString("vi-VN")} VNĐ
                </td>
                <td className="py-4 px-4">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                    b.status === "Cancelled" ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                  }`}>
                    {b.status || "Confirmed"}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex justify-end gap-2">
                    {b.status !== "Cancelled" ? (
                      <button 
                        onClick={() => updateBookingStatus(b.id, "Cancelled")}
                        className="text-[10px] font-black text-rose-600 hover:text-rose-800 transition"
                      >
                        HỦY ĐƠN
                      </button>
                    ) : (
                      <button 
                        onClick={() => updateBookingStatus(b.id, "Confirmed")}
                        className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 transition"
                      >
                        KHÔI PHỤC
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bookings.length === 0 && (
          <div className="p-12 text-center text-slate-400 italic">Chưa có dữ liệu đặt phòng.</div>
        )}
      </div>
    </div>
  );
}