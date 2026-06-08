import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { parseISO } from "date-fns";
import { loadData } from "../features/hotelSlice";

function getRoomLabel(room) {
  return `${room.number} - ${room.type} (${room.price.toLocaleString("vi-VN")} ₫)`;
}

function hasConflict(bookings, room_id, check_in, check_out) {
  return bookings.some((booking) => {
    if (booking.room_id !== room_id) return false;
    const start = parseISO(booking.check_in);
    const end = parseISO(booking.check_out);
    const newStart = parseISO(check_in);
    const newEnd = parseISO(check_out);
    return !(newEnd <= start || newStart >= end);
  });
}

const bankAccount = {
  bankId: "AGRIBANK",
  accountNumber: "1805205139140",
  accountName: "PHAM MINH KHOI",
  branch: "Agribank - Chi nhánh H. Vĩnh Thạnh - Cần Thơ II",
};

function getBookingNights(checkIn, checkOut) {
  if (!checkIn || !checkOut || checkIn >= checkOut) return 0;
  const start = parseISO(checkIn);
  const end = parseISO(checkOut);
  const dayMs = 24 * 60 * 60 * 1000;
  const nights = Math.round((end - start) / dayMs);
  return Number.isFinite(nights) && nights > 0 ? nights : 0;
}

function buildVietQrUrl({ amount, roomNumber, checkIn }) {
  const addInfo = encodeURIComponent(`HOTELPRO PHONG ${roomNumber || ""} ${checkIn || ""}`.trim());
  const accountName = encodeURIComponent(bankAccount.accountName);
  return `https://img.vietqr.io/image/${bankAccount.bankId}-${bankAccount.accountNumber}-compact2.png?amount=${amount}&addInfo=${addInfo}&accountName=${accountName}`;
}

export default function BookingView() {
  const dispatch = useDispatch();
  const { rooms, customers, bookings, user } = useSelector((state) => state.hotel);
  const [form, setForm] = useState({
    room_id: "",
    customer_id: "",
    check_in: "",
    check_out: "",
  });

  const currentCustomer = user
    ? customers.find((cust) => cust.email === user.email || cust.phone === user.phone)
    : null;
  const isCustomerRole = user?.role === "customer";
  const [customerPhone, setCustomerPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentView, setPaymentView] = useState("choices");

  const selectedRoom = rooms.find((room) => room.id === Number(form.room_id));
  const nights = getBookingNights(form.check_in, form.check_out);
  const bookingTotal = selectedRoom ? Number(selectedRoom.price || 0) * nights : 0;
  const canShowPayment = Boolean(selectedRoom && nights > 0);
  const qrUrl = buildVietQrUrl({
    amount: bookingTotal,
    roomNumber: selectedRoom?.number,
    checkIn: form.check_in,
  });
  const reservationCode = selectedRoom
    ? `${selectedRoom.number}${form.check_in.replaceAll("-", "").slice(4)}`
    : "";

  function validateBookingForm(paymentType = "qr") {
    const customerId = isCustomerRole ? currentCustomer?.id : Number(form.customer_id);
    const needsNewCustomer = isCustomerRole && !currentCustomer;
    const needsAdminPick = !isCustomerRole && !form.customer_id;

    if (isCustomerRole && paymentType !== "qr") {
      setMessage({ type: "error", text: "Khách hàng cần thanh toán qua QR trước khi đặt phòng." });
      return null;
    }

    if (!form.room_id || !form.check_in || !form.check_out) {
      setMessage({ type: "error", text: "Vui lòng điền đầy đủ thông tin" });
      return null;
    }
    if (needsAdminPick) {
      setMessage({ type: "error", text: "Vui lòng chọn khách hàng" });
      return null;
    }
    if (needsNewCustomer && !customerPhone.trim()) {
      setMessage({ type: "error", text: "Vui lòng nhập số điện thoại" });
      return null;
    }
    if (form.check_in >= form.check_out) {
      setMessage({ type: "error", text: "Ngày trả phải sau ngày nhận" });
      return null;
    }
    const roomId = Number(form.room_id);
    if (hasConflict(bookings, roomId, form.check_in, form.check_out)) {
      setMessage({ type: "error", text: "Lịch đặt trùng phòng. Vui lòng chọn phòng hoặc ngày khác." });
      return null;
    }

    return { customerId, roomId };
  }

  function handleCreateBookingClick() {
    if (!validateBookingForm("qr")) return;
    setMessage("");
    setPaymentView("methods");
  }

  async function handleSubmit(paymentType) {
    const validation = validateBookingForm(paymentType);
    if (!validation) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      let bookingCustomerId = validation.customerId;

      if (user?.role === "customer" && !bookingCustomerId) {
        const customerResponse = await fetch("/api/customers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: user.name,
            phone: customerPhone.trim(),
            email: user.email,
          }),
        });

        if (!customerResponse.ok) {
          throw new Error("Không thể tạo thông tin khách hàng");
        }

        const customerData = await customerResponse.json();
        bookingCustomerId = customerData.id;
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          room_id: validation.roomId,
          customer_id: Number(bookingCustomerId),
          check_in: form.check_in,
          check_out: form.check_out,
          status: "confirmed",
          payment_method: paymentType === "qr" ? "bank_transfer" : "pay_at_hotel",
          payment_status: paymentType === "qr" ? "paid" : "pending",
          notes: paymentType === "qr" ? "Khách xác nhận đã chuyển khoản QR" : "Khách chọn thanh toán trực tiếp tại khách sạn",
        }),
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: paymentType === "qr"
            ? "Cảm ơn quý khách. Thanh toán thành công và phòng đã được đặt."
            : "Đặt phòng thành công. Khách sẽ thanh toán trực tiếp tại khách sạn.",
        });
        setForm({ room_id: "", customer_id: "", check_in: "", check_out: "" });
        setCustomerPhone("");
        setPaymentView("choices");
        await dispatch(loadData());
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage({ type: "error", text: errorData.error || "Lỗi tạo booking" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi kết nối: " + err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Quản lý đặt phòng</h1>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Đặt phòng mới</h2>
          <form translate="no" className="notranslate space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Chọn phòng</label>
              <select
                required
                value={form.room_id}
                onChange={(e) => {
                  setForm({ ...form, room_id: e.target.value });
                  setPaymentView("choices");
                }}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Chọn phòng</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {getRoomLabel(room)}
                  </option>
                ))}
              </select>
            </div>

            {user?.role === "customer" ? (
              <div>
                <label className="block text-sm font-medium text-slate-700" htmlFor="booking-customer-phone">
                  Số điện thoại
                </label>
                <input
                  id="booking-customer-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="off"
                  required={!currentCustomer}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Nhập số điện thoại của bạn"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                {!currentCustomer && (
                  <p className="mt-2 text-xs text-slate-500">
                    Vui lòng nhập số bạn dùng để liên hệ đặt phòng. Hồ sơ khách sẽ được tạo khi đặt lần đầu (tên lấy theo tài khoản).
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700">Chọn khách hàng</label>
                <select
                  required
                  value={form.customer_id}
                  onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Chọn khách hàng</option>
                  {customers.map((cust) => (
                    <option key={cust.id} value={cust.id}>
                      {cust.name} ({cust.phone})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">Ngày nhận phòng</label>
              <input
                type="date"
                required
                value={form.check_in}
                onChange={(e) => {
                  setForm({ ...form, check_in: e.target.value });
                  setPaymentView("choices");
                }}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Ngày trả phòng</label>
              <input
                type="date"
                required
                value={form.check_out}
                onChange={(e) => {
                  setForm({ ...form, check_out: e.target.value });
                  setPaymentView("choices");
                }}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {canShowPayment && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Tổng thanh toán</p>
                    <p className="text-xs text-slate-600">
                      {nights} đêm x {selectedRoom.price.toLocaleString("vi-VN")} ₫
                    </p>
                  </div>
                  <p className="text-lg font-bold text-blue-700">
                    {bookingTotal.toLocaleString("vi-VN")} ₫
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {isCustomerRole ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCreateBookingClick}
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  Đặt phòng
                </button>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-700">Phương thức thanh toán</p>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleSubmit("hotel")}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-left transition hover:border-blue-400 hover:bg-blue-50 disabled:opacity-60"
                  >
                    <span className="block font-semibold text-slate-900">Thanh toán trực tiếp tại khách sạn</span>
                    <span className="mt-1 block text-xs text-slate-600">
                      Chỉ dùng cho lễ tân/admin tạo booking tại quầy.
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={loading || !canShowPayment}
                    onClick={() => setPaymentView((current) => (current === "qr" ? "choices" : "qr"))}
                    className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-left transition hover:border-blue-500 disabled:opacity-60"
                  >
                    <span className="block font-semibold text-blue-900">Thanh toán qua QR ngân hàng</span>
                    <span className="mt-1 block text-xs text-blue-700">
                      Quét mã, chuyển đúng số tiền, rồi xác nhận để ghi nhận doanh thu.
                    </span>
                  </button>
                </>
              )}
            </div>

          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Lịch đặt phòng</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-slate-900">Phòng</th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-900">Khách</th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-900">Ngày nhận</th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-900">Ngày trả</th>
                  <th className="px-4 py-2 text-center font-semibold text-slate-900">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {bookings.slice(0, 10).map((booking) => {
                  const room = rooms.find((r) => r.id === booking.room_id);
                  const cust = customers.find((c) => c.id === booking.customer_id);
                  return (
                    <tr key={booking.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{room?.number}</td>
                      <td className="px-4 py-3">{cust?.name}</td>
                      <td className="px-4 py-3">{booking.check_in}</td>
                      <td className="px-4 py-3">{booking.check_out}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            booking.status === "confirmed"
                              ? "bg-blue-100 text-blue-800"
                              : booking.status === "checked-in"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {booking.status === "confirmed"
                            ? "Xác nhận"
                            : booking.status === "checked-in"
                            ? "Đã nhận"
                            : "Đã trả"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {paymentView === "methods" && canShowPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-slate-100 shadow-2xl">
            <div className="bg-sky-900 px-6 py-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-sky-100">Mã đặt chỗ {reservationCode}</p>
                  <h2 className="mt-1 text-2xl font-semibold">Chọn phương thức thanh toán</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentView("choices")}
                  className="rounded-full bg-white/10 px-3 py-1 text-sm text-white transition hover:bg-white/20"
                >
                  Đóng
                </button>
              </div>
            </div>

            <div className="border-b border-slate-200 bg-white px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">
                    Phòng {selectedRoom.number} - {selectedRoom.type}
                  </p>
                  <p className="text-sm text-slate-600">
                    {form.check_in} đến {form.check_out} · {nights} đêm
                  </p>
                </div>
                <p className="text-lg font-bold text-slate-900">
                  {bookingTotal.toLocaleString("vi-VN")} ₫
                </p>
              </div>
            </div>

            <div className="space-y-3 p-4">
              <button
                type="button"
                disabled
                className="w-full rounded-lg border border-slate-200 bg-white px-5 py-4 text-left opacity-60"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-lg font-medium text-slate-900">Thẻ tín dụng</span>
                  <span className="text-sm font-semibold text-slate-500">Tạm khóa</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-500">VISA · Mastercard · JCB</p>
              </button>

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

              <button
                type="button"
                disabled
                className="w-full rounded-lg border border-slate-200 bg-white px-5 py-4 text-left opacity-60"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-lg font-medium text-slate-900">Tại cửa hàng</span>
                  <span className="text-sm font-semibold text-slate-500">Không áp dụng</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-500">FPT · Circle K · FamilyMart</p>
              </button>

              <button
                type="button"
                disabled
                className="w-full rounded-lg border border-slate-200 bg-white px-5 py-4 text-left opacity-60"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-lg font-medium text-slate-900">Thẻ ATM nội địa</span>
                  <span className="text-sm font-semibold text-slate-500">Tạm khóa</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-500">OnePAY</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentView === "qr" && canShowPayment && (
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
              alt="Mã QR Agribank để thanh toán đặt phòng"
              className="mx-auto aspect-square w-full max-w-[320px] rounded-xl border border-slate-200 bg-white object-contain"
            />
            <div className="mt-4 space-y-1 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">{bankAccount.accountName}</p>
              <p className="text-xl font-bold text-red-600">{bankAccount.accountNumber}</p>
              <p>{bankAccount.branch}</p>
              <p className="font-semibold text-blue-700">
                Số tiền: {bookingTotal.toLocaleString("vi-VN")} ₫
              </p>
              <p className="text-slate-500">
                Nội dung: HOTELPRO PHONG {selectedRoom.number} {form.check_in}
              </p>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit("qr")}
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
