import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { loadData } from "../features/hotelSlice";

export default function BookingHistory() {
  const dispatch = useDispatch();
  const { bookings, user } = useSelector((state) => state.hotel);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    // Luôn tải lại dữ liệu mới nhất khi truy cập trang lịch sử
    dispatch(loadData()).unwrap().catch(() => {});
  }, [dispatch]);

  // Admin thấy toàn bộ, Khách hàng chỉ thấy đơn của mình
  const historyData = isAdmin ? (bookings || []) : (bookings || []).filter(b => b.customerId === user?.id || b.customer_id === user?.id);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Confirmed":
      case "confirmed":
        return "bg-sky-100 text-sky-700";
      case "Cancelled":
      case "cancelled":
        return "bg-rose-100 text-rose-700";
      case "Completed":
      case "checked-out":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 animate-in fade-in duration-500">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400">Mã Phòng</th>
              {isAdmin && <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400">Khách hàng</th>}
              {isAdmin && <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400">Số điện thoại</th>}
              <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400">Ngày nhận</th>
              <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400">Ngày trả</th>
              <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400">Tổng tiền</th>
              <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {historyData.map((item) => (
              <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="py-4 px-4 font-bold text-sky-600">P. {item.roomId || item.room_id}</td>
                {isAdmin && <td className="py-4 px-4 text-sm text-slate-800 font-medium">{item.customerName || "Khách vãng lai"}</td>}
                {isAdmin && <td className="py-4 px-4 text-sm text-slate-600">{item.phone || "N/A"}</td>}
                <td className="py-4 px-4 text-sm text-slate-600">
                  <div className="font-black text-slate-800">14:00</div>
                  <div className="text-[11px] text-slate-400">{item.checkIn || item.check_in}</div>
                </td>
                <td className="py-4 px-4 text-sm text-slate-600">
                  <div className="font-black text-slate-800">12:00</div>
                  <div className="text-[11px] text-slate-400">{item.checkOut || item.check_out}</div>
                </td>
                <td className="py-4 px-4 font-black text-slate-800">
                  {(item.totalAmount || item.total_amount || 0).toLocaleString("vi-VN")}đ
                </td>
                <td className="py-4 px-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusStyle(item.status)}`}>
                    {item.status || "Chờ xác nhận"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {historyData.length === 0 && (
          <div className="p-12 text-center text-slate-400 italic">Bạn chưa có lịch sử đặt phòng nào.</div>
        )}
      </div>
    </div>
  );
}