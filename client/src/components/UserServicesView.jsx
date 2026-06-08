import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadData } from "../features/hotelSlice";
import { API_URL } from "../services/config";

const bankAccount = {
  bankId: "AGRIBANK",
  accountNumber: "1805205139140",
  accountName: "PHAM MINH KHOI",
  branch: "Agribank - Chi nhánh H. Vĩnh Thạnh - Cần Thơ II",
};

const serviceCategories = {
  food: "Ăn uống",
  drinks: "Đồ uống",
  laundry: "Giặt ủi",
  minibar: "Minibar",
  spa: "Spa",
  transport: "Vận chuyển",
  other: "Khác",
};

function buildVietQrUrl() {
  const accountName = encodeURIComponent(bankAccount.accountName);
  return `https://img.vietqr.io/image/${bankAccount.bankId}-${bankAccount.accountNumber}-compact2.png?accountName=${accountName}`;
}

export default function UserServicesView() {
  const dispatch = useDispatch();
  const { bookings, customers, rooms, user } = useSelector((state) => state.hotel);
  const [services, setServices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentView, setPaymentView] = useState("closed");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const currentCustomer = useMemo(
    () => customers.find((customer) => customer.email === user?.email || customer.phone === user?.phone),
    [customers, user]
  );

  const activeBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.customer_id === currentCustomer?.id &&
          ["confirmed", "checked-in"].includes(booking.status)
      ),
    [bookings, currentCustomer]
  );

  const selectedBooking = activeBookings.find((booking) => booking.id === Number(selectedBookingId));
  const selectedRoom = selectedBooking ? rooms.find((room) => room.id === selectedBooking.room_id) : null;
  const orderTotal = selectedService ? Number(selectedService.price || 0) * quantity : 0;
  const qrUrl = buildVietQrUrl({
    amount: orderTotal,
    serviceName: selectedService?.name,
    roomNumber: selectedRoom?.number,
  });

  useEffect(() => {
    if (!selectedBookingId && activeBookings.length > 0) {
      setSelectedBookingId(String(activeBookings[0].id));
    }
  }, [activeBookings, selectedBookingId]);

  useEffect(() => {
    loadServices();
    loadOrders();
  }, []);

  async function loadServices() {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/services`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setServices(Array.isArray(data) ? data.filter((service) => service.status === "active") : []);
    } catch {
      setMessage({ type: "error", text: "Không tải được danh sách dịch vụ." });
    }
  }

  async function loadOrders() {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/service-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    }
  }

  function openPayment(service) {
    if (!selectedBooking) {
      setMessage({ type: "error", text: "Bạn cần có phòng đã đặt/đã nhận để gọi dịch vụ." });
      return;
    }
    setSelectedService(service);
    setQuantity(1);
    setMessage("");
    setPaymentView("methods");
  }

  async function confirmPayment() {
    if (!selectedBooking || !selectedService) return;
    setLoading(true);
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/service-orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          booking_id: selectedBooking.id,
          service_id: selectedService.id,
          quantity,
          payment_method: "bank_transfer",
          payment_status: "paid",
          delivery_notes: `Mang lên phòng ${selectedRoom?.number || ""}`,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage({ type: "error", text: data.error || "Không thể đặt dịch vụ." });
        return;
      }

      setPaymentView("closed");
      setSelectedService(null);
      setQuantity(1);
      setMessage({
        type: "success",
        text: "Cảm ơn quý khách. Dịch vụ đã thanh toán thành công, nhân viên sẽ mang lên phòng.",
      });
      await Promise.all([loadOrders(), dispatch(loadData())]);
    } catch (error) {
      setMessage({ type: "error", text: "Lỗi kết nối: " + error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dịch vụ khách sạn</h1>
        <p className="mt-2 text-sm text-slate-600">
          Chọn dịch vụ, thanh toán QR và nhân viên sẽ mang lên phòng của bạn.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 ${
            message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <label className="block text-sm font-medium text-slate-700">Phòng nhận dịch vụ</label>
        {activeBookings.length === 0 ? (
          <p className="mt-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Bạn cần đặt phòng và được xác nhận trước khi gọi dịch vụ.
          </p>
        ) : (
          <select
            value={selectedBookingId}
            onChange={(e) => setSelectedBookingId(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {activeBookings.map((booking) => {
              const room = rooms.find((item) => item.id === booking.room_id);
              return (
                <option key={booking.id} value={booking.id}>
                  Phòng {room?.number || booking.room_id} - {booking.check_in} đến {booking.check_out}
                </option>
              );
            })}
          </select>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <div key={service.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{service.name}</h2>
                <p className="mt-1 text-xs font-medium text-blue-700">
                  {serviceCategories[service.category] || service.category}
                </p>
              </div>
              <p className="whitespace-nowrap font-bold text-slate-900">
                {Number(service.price || 0).toLocaleString("vi-VN")} ₫
              </p>
            </div>
            {service.description && (
              <p className="mt-3 min-h-[40px] text-sm text-slate-600">{service.description}</p>
            )}
            <button
              type="button"
              disabled={!selectedBooking}
              onClick={() => openPayment(service)}
              className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Đặt dịch vụ
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Dịch vụ đã gọi</h2>
        <div className="mt-4 space-y-3">
          {orders.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có dịch vụ nào.</p>
          ) : (
            orders.slice(0, 6).map((order) => (
              <div key={order.id} className="flex flex-col gap-2 rounded-lg bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-slate-900">
                    {order.service?.name || `Dịch vụ #${order.service_id}`} x {order.quantity}
                  </p>
                  <p className="text-sm text-slate-600">
                    Phòng {order.room?.number || "—"} · {Number(order.total_price || 0).toLocaleString("vi-VN")} ₫
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    order.status === "delivered"
                      ? "bg-green-100 text-green-800"
                      : order.status === "delivering"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {order.status === "delivered"
                    ? "Đã phục vụ"
                    : order.status === "delivering"
                    ? "Đang mang lên"
                    : "Chờ phục vụ"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {paymentView === "methods" && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-slate-100 shadow-2xl">
            <div className="bg-sky-900 px-6 py-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-sky-100">Phòng {selectedRoom?.number}</p>
                  <h2 className="mt-1 text-2xl font-semibold">Chọn phương thức thanh toán</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentView("closed")}
                  className="rounded-full bg-white/10 px-3 py-1 text-sm text-white transition hover:bg-white/20"
                >
                  Đóng
                </button>
              </div>
            </div>
            <div className="border-b border-slate-200 bg-white px-6 py-4">
              <p className="font-semibold text-slate-900">{selectedService.name}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <label className="text-sm text-slate-600">Số lượng</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-center text-sm"
                />
              </div>
              <p className="mt-3 text-right text-lg font-bold text-slate-900">
                {orderTotal.toLocaleString("vi-VN")} ₫
              </p>
            </div>
            <div className="space-y-3 p-4">
              <button
                type="button"
                onClick={() => setPaymentView("qr")}
                className="w-full rounded-lg border border-blue-300 bg-white px-5 py-4 text-left shadow-sm transition hover:border-blue-500 hover:bg-blue-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-lg font-medium text-slate-900">Chuyển khoản ngân hàng</span>
                  <span className="text-sm font-semibold text-blue-600">Chọn</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Agribank · VietQR · NAPAS 24/7
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentView === "qr" && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-4 text-left">
              <div>
                <p className="text-sm text-slate-500">Thông báo thanh toán</p>
                <h2 className="text-xl font-semibold text-slate-900">Chuyển khoản ngân hàng</h2>
              </div>
              <button
                type="button"
                onClick={() => setPaymentView("methods")}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                Quay lại
              </button>
            </div>
            <img
              src={qrUrl}
              alt="Mã QR Agribank để thanh toán dịch vụ"
              className="mx-auto aspect-square w-full max-w-[320px] rounded-xl border border-slate-200 bg-white object-contain"
            />
            <div className="mt-4 space-y-1 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">{bankAccount.accountName}</p>
              <p className="text-xl font-bold text-red-600">{bankAccount.accountNumber}</p>
              <p>{bankAccount.branch}</p>
              <p className="font-semibold text-blue-700">
                Số tiền: {orderTotal.toLocaleString("vi-VN")} ₫
              </p>
              <p className="text-slate-500">
                Nội dung: MAYANNHIEN DV {selectedService.name} PHONG {selectedRoom?.number}
              </p>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={confirmPayment}
              className="mt-5 w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
            >
              {loading ? "Đang xác nhận..." : "Tôi đã thanh toán thành công"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
