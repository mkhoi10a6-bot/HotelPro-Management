import { useState, useMemo } from "react";
import { useSelector } from "react-redux";

export default function CustomerView() {
  const { customers, bookings, rooms } = useSelector((state) => state.hotel);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    const term = searchTerm.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.phone && c.phone.includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term))
    );
  }, [customers, searchTerm]);

  const getCustomerBookings = (customerId) => {
    return bookings.filter((b) => b.customer_id === customerId);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Quản lý khách hàng</h1>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, điện thoại hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          {filteredCustomers.length === 0 ? (
            <p className="py-8 text-center text-slate-500">Không tìm thấy khách hàng nào</p>
          ) : (
            filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-4 cursor-pointer hover:bg-slate-50 transition"
              >
                <div>
                  <p className="font-medium text-slate-900">{customer.name}</p>
                  <p className="text-xs text-slate-600">{customer.phone || "N/A"}</p>
                </div>
                <span className="text-sm font-semibold text-blue-600">
                  {getCustomerBookings(customer.id).length} booking
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">{selectedCustomer.name}</h2>

            <div className="mb-6 space-y-2">
              <p className="text-sm">
                <span className="font-medium">Điện thoại:</span>
                <span className="ml-2">{selectedCustomer.phone || "N/A"}</span>
              </p>
              <p className="text-sm">
                <span className="font-medium">Email:</span>
                <span className="ml-2">{selectedCustomer.email || "N/A"}</span>
              </p>
              <p className="text-sm">
                <span className="font-medium">CMND/Passport:</span>
                <span className="ml-2">{selectedCustomer.identity_number || "N/A"}</span>
              </p>
              <p className="text-sm">
                <span className="font-medium">Địa chỉ:</span>
                <span className="ml-2">{selectedCustomer.address || "N/A"}</span>
              </p>
            </div>

            <h3 className="font-semibold text-slate-900 mb-3">Lịch sử booking</h3>
            <div className="space-y-2">
              {getCustomerBookings(selectedCustomer.id).length === 0 ? (
                <p className="py-4 text-center text-slate-500 text-sm">Chưa có booking nào</p>
              ) : (
                getCustomerBookings(selectedCustomer.id).map((booking) => {
                  const room = rooms.find((r) => r.id === booking.room_id);
                  return (
                    <div key={booking.id} className="rounded-lg bg-slate-50 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">Phòng {room?.number}</p>
                          <p className="text-xs text-slate-600">
                            {booking.check_in} đến {booking.check_out}
                          </p>
                        </div>
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
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => setSelectedCustomer(null)}
              className="w-full mt-6 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
