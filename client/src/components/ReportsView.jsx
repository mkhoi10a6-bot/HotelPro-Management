import { useSelector } from "react-redux";

export default function ReportsView() {
  const { rooms, bookings, invoices } = useSelector((state) => state.hotel);

  // Calculate metrics
  const totalRooms = rooms.length;
  const occupancyRate = bookings.length > 0 ? ((bookings.filter((b) => b.status === "checked-in").length / totalRooms) * 100).toFixed(1) : 0;
  const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + (i.total_amount || 0), 0);
  const paidInvoices = invoices.filter((i) => i.status === "paid").length;
  const pendingInvoices = invoices.filter((i) => i.status === "pending").length;
  const unpaidRevenue = invoices
    .filter((i) => i.status !== "paid")
    .reduce((sum, i) => sum + (i.total_amount || 0), 0);
  const potentialRevenue = totalRevenue + unpaidRevenue;
  const lossRate = potentialRevenue > 0 ? ((unpaidRevenue / potentialRevenue) * 100).toFixed(1) : 0;

  // Revenue by room type
  const revenueByType = rooms.reduce((acc, room) => {
    const roomRevenue = invoices
      .filter((i) => i.status === "paid" && bookings.find((b) => b.id === i.booking_id && b.room_id === room.id))
      .reduce((sum, i) => sum + (i.total_amount || 0), 0);
    return { ...acc, [room.type]: (acc[room.type] || 0) + roomRevenue };
  }, {});

  // Recent transactions
  const recentTransactions = invoices
    .filter((i) => i.status === "paid")
    .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
    .slice(0, 10);

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Báo cáo & Phân tích</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-6">
          <p className="text-sm text-blue-600 font-medium">Tổng doanh thu</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">
            {totalRevenue.toLocaleString("vi-VN")} ₫
          </p>
        </div>
        <div className="rounded-lg bg-green-50 border border-green-200 p-6">
          <p className="text-sm text-green-600 font-medium">Tỷ lệ chiếm phòng</p>
          <p className="text-3xl font-bold text-green-900 mt-2">{occupancyRate}%</p>
        </div>
        <div className="rounded-lg bg-purple-50 border border-purple-200 p-6">
          <p className="text-sm text-purple-600 font-medium">Hoá đơn đã thanh toán</p>
          <p className="text-3xl font-bold text-purple-900 mt-2">{paidInvoices}</p>
        </div>
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-6">
          <p className="text-sm text-yellow-600 font-medium">Hoá đơn chưa thanh toán</p>
          <p className="text-3xl font-bold text-yellow-900 mt-2">{pendingInvoices}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-6">
          <p className="text-sm text-rose-600 font-medium">Doanh thu chưa thu</p>
          <p className="text-3xl font-bold text-rose-900 mt-2">
            {unpaidRevenue.toLocaleString("vi-VN")} ₫
          </p>
        </div>
        <div className="rounded-lg bg-red-50 border border-red-200 p-6">
          <p className="text-sm text-red-600 font-medium">Lợi nhuận thất thoát</p>
          <p className="text-3xl font-bold text-red-900 mt-2">
            {unpaidRevenue.toLocaleString("vi-VN")} ₫
          </p>
        </div>
        <div className="rounded-lg bg-red-50 border border-red-200 p-6">
          <p className="text-sm text-red-600 font-medium">Tỷ lệ thất thoát</p>
          <p className="text-3xl font-bold text-red-900 mt-2">{lossRate}%</p>
        </div>
      </div>

      {/* Revenue by Room Type */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Doanh thu theo loại phòng</h2>
        <div className="space-y-3">
          {Object.entries(revenueByType).length === 0 ? (
            <p className="text-slate-500 py-4">Chưa có doanh thu</p>
          ) : (
            Object.entries(revenueByType).map(([type, revenue]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="font-medium text-slate-700">{type}</span>
                <div className="flex-1 mx-4 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{
                      width: `${Math.min((revenue / (totalRevenue || 1)) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
                <span className="font-semibold text-slate-900 text-right min-w-[120px]">
                  {revenue.toLocaleString("vi-VN")} ₫
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Giao dịch gần đây</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Mã HĐ</th>
                <th className="px-4 py-2 text-left font-semibold">Số tiền</th>
                <th className="px-4 py-2 text-left font-semibold">Phương thức</th>
                <th className="px-4 py-2 text-left font-semibold">Ngày thanh toán</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
                    Chưa có giao dịch
                  </td>
                </tr>
              ) : (
                recentTransactions.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">#{invoice.id}</td>
                    <td className="px-4 py-3 font-semibold text-green-600">
                      +{invoice.total_amount.toLocaleString("vi-VN")} ₫
                    </td>
                    <td className="px-4 py-3 capitalize">{invoice.payment_method || "N/A"}</td>
                    <td className="px-4 py-3">{formatDate(invoice.payment_date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Thống kê tóm tắt</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-600 font-medium">TỔNG PHÒNG</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalRooms}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 font-medium">PHÒNG ĐẶT</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {bookings.filter((b) => b.status === "confirmed").length}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600 font-medium">PHÒNG ĐANG Ở</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {bookings.filter((b) => b.status === "checked-in").length}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600 font-medium">TỔNG HĐ</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{invoices.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 font-medium">HĐ ĐÃ THANH</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{paidInvoices}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 font-medium">HĐ CHỜ THANH</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{pendingInvoices}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 font-medium">Doanh thu chưa thu</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{unpaidRevenue.toLocaleString("vi-VN")} ₫</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 font-medium">Tỷ lệ thất thoát</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{lossRate}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
