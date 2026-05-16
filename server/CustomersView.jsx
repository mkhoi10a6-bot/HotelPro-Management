import React from "react";
import { useSelector } from "react-redux";

export default function CustomersView() {
  const { customers } = useSelector((state) => state.hotel);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
            <tr>
              <th className="px-4 py-4">Tên khách hàng</th>
              <th className="px-4 py-4">Số điện thoại</th>
              <th className="px-4 py-4">Email</th>
              <th className="px-4 py-4">Ngày đăng ký</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-4 py-10 text-center text-slate-400">
                  Chưa có dữ liệu khách hàng
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 font-semibold text-slate-800">{c.name}</td>
                  <td className="px-4 py-4 text-slate-600">{c.phone || "—"}</td>
                  <td className="px-4 py-4 text-slate-600">{c.email || "—"}</td>
                  <td className="px-4 py-4 text-slate-500">
                    {new Date(c.created_at).toLocaleDateString("vi-VN")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}