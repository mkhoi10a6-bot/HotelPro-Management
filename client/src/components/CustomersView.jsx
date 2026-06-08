import React from "react";
import { useSelector } from "react-redux";

export default function CustomersView() {
  // Get customers directly from Redux state
  const { customers, loading, error } = useSelector((state) => state.hotel);

  const formatDate = (value) => {
    if (!value) return "---";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "---";
    return date.toLocaleDateString("vi-VN");
  };

  if (loading) return <div className="rounded-[28px] border border-white/80 bg-white/80 p-12 text-center font-bold text-sky-600 shadow-sm animate-pulse">Đang tải danh sách khách hàng...</div>;
  if (error) return <div className="rounded-[28px] border border-rose-100 bg-rose-50 p-12 text-center font-bold text-rose-600">Lỗi: {error}</div>;

  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      <div className="grid gap-3 md:hidden">
        {(customers || []).map((c) => (
          <div key={c.id} className="rounded-[28px] border border-white/80 bg-white p-4 shadow-sm shadow-slate-200/70">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-400">#{c.id}</p>
                <p className="text-base font-black text-slate-900">{c.name}</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase text-emerald-600">
                {c.status || "active"}
              </span>
            </div>
            <div className="mt-3 space-y-1 text-sm text-slate-600">
              <p>{c.email}</p>
              <p>{c.phone || "---"}</p>
              <p>Ngày đăng ký: {formatDate(c.created_at)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-[32px] border border-white/80 bg-white shadow-sm shadow-slate-200/70 md:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left border-collapse">
          <thead className="bg-slate-50/80">
            <tr className="border-b border-slate-100">
              <th className="py-5 px-5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">ID</th>
              <th className="py-5 px-5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Họ và tên</th>
              <th className="py-5 px-5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Email</th>
              <th className="py-5 px-5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Số điện thoại</th>
              <th className="py-5 px-5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Ngày đăng ký</th>
              <th className="py-5 px-5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {(customers || []).map((c) => (
              <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition duration-200">
                <td className="py-5 px-5 text-sm font-bold text-slate-400">#{c.id}</td>
                <td className="py-5 px-5 text-sm font-black text-slate-900">{c.name}</td>
                <td className="py-5 px-5 text-sm font-medium text-slate-600">{c.email}</td>
                <td className="py-5 px-5 text-sm font-medium text-slate-600">{c.phone || "---"}</td>
                <td className="py-5 px-5 text-sm font-medium text-slate-600">{formatDate(c.created_at)}</td>
                <td className="py-5 px-5">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase text-emerald-600">
                    {c.status || "active"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!customers || customers.length === 0) && (
          <div className="p-12 text-center text-slate-400 italic">Chưa có khách hàng nào đăng ký.</div>
        )}
      </div>
      </div>
      {(!customers || customers.length === 0) && (
        <div className="rounded-[28px] bg-white p-12 text-center text-slate-400 italic shadow-sm md:hidden">Chưa có khách hàng nào đăng ký.</div>
      )}
    </div>
  );
}
