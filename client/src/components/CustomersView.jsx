import React from "react";
import { useSelector } from "react-redux";

export default function CustomersView() {
  // Get customers directly from Redux state
  const { customers, loading, error } = useSelector((state) => state.hotel);

  if (loading) return <div className="p-12 text-center text-sky-600 font-bold animate-pulse">Đang tải danh sách khách hàng...</div>;
  if (error) return <div className="p-12 text-center text-rose-500 font-bold">Lỗi: {error}</div>;

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 animate-in fade-in duration-500">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400">ID</th>
              <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400">Họ và tên</th>
              <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400">Email</th>
              <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400">Số điện thoại</th>
            </tr>
          </thead>
          <tbody>
            {(customers || []).map((c) => (
              <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition duration-200">
                <td className="py-4 px-4 text-sm font-bold text-slate-400">#{c.id}</td>
                <td className="py-4 px-4 text-sm font-bold text-slate-800">{c.name}</td>
                <td className="py-4 px-4 text-sm text-slate-600">{c.email}</td>
                <td className="py-4 px-4 text-sm text-slate-600">{c.phone || "---"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!customers || customers.length === 0) && (
          <div className="p-12 text-center text-slate-400 italic">Chưa có khách hàng nào đăng ký.</div>
        )}
      </div>
    </div>
  );
}