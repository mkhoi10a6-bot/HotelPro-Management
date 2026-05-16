import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadData } from "../features/hotelSlice";

export default function PaymentView() {
  const dispatch = useDispatch();
  const { invoices, bookings, rooms } = useSelector((state) => state.hotel);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const pendingInvoices = invoices.filter((i) => i.status === "pending");

  const handlePayment = async (invoiceId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:4000/api/invoices/${invoiceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "paid",
          payment_method: paymentMethod,
          payment_date: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Thanh toán thành công" });
        setSelectedInvoice(null);
        await dispatch(loadData());
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage({ type: "error", text: "Lỗi khi thanh toán" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi kết nối: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Quản lý thanh toán</h1>

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-600 font-medium">Chưa thanh toán</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">{pendingInvoices.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-600 font-medium">Đã thanh toán</p>
          <p className="text-3xl font-bold text-green-900 mt-2">
            {invoices.filter((i) => i.status === "paid").length}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <p className="text-sm text-yellow-600 font-medium">Tổng doanh thu</p>
          <p className="text-2xl font-bold text-yellow-900 mt-2">
            {invoices
              .reduce((sum, i) => sum + (i.total_amount || 0), 0)
              .toLocaleString("vi-VN")} ₫
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Hoá đơn chưa thanh toán</h2>
        <div className="space-y-2">
          {pendingInvoices.length === 0 ? (
            <p className="py-8 text-center text-slate-500">Không có hoá đơn chưa thanh toán</p>
          ) : (
            pendingInvoices.map((invoice) => {
              const booking = bookings.find((b) => b.id === invoice.booking_id);
              const room = booking ? rooms.find((r) => r.id === booking.room_id) : null;
              return (
                <div
                  key={invoice.id}
                  onClick={() => setSelectedInvoice(invoice)}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-4 cursor-pointer hover:bg-slate-50 transition"
                >
                  <div>
                    <p className="font-medium text-slate-900">HĐ #{invoice.id}</p>
                    <p className="text-xs text-slate-600">
                      Booking #{booking?.id} - Phòng {room?.number}
                    </p>
                  </div>
                  <p className="font-bold text-slate-900">
                    {invoice.total_amount.toLocaleString("vi-VN")} ₫
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Chi tiết thanh toán</h2>

            <div className="mb-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Mã hoá đơn:</span>
                <span className="font-medium">#{selectedInvoice.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Giá phòng:</span>
                <span className="font-medium">{selectedInvoice.amount.toLocaleString("vi-VN")} ₫</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Giảm giá:</span>
                <span className="font-medium">-{(selectedInvoice.discount || 0).toLocaleString("vi-VN")} ₫</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between">
                <span className="font-semibold">Tổng cộng:</span>
                <span className="font-bold text-lg text-blue-600">
                  {selectedInvoice.total_amount.toLocaleString("vi-VN")} ₫
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Phương thức thanh toán</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="cash">Tiền mặt</option>
                <option value="bank_transfer">Chuyển khoản</option>
                <option value="card">Thẻ tín dụng</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handlePayment(selectedInvoice.id)}
                disabled={loading}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition disabled:opacity-60"
              >
                {loading ? "Đang xử lý..." : "Thanh toán"}
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 transition"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
