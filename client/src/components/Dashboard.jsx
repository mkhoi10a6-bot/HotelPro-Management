import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { API_URL } from "../services/config";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30); // Mặc định 30 ngày để dễ thấy doanh thu khi báo cáo
  const { token } = useSelector(s => s.hotel || {});

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/stats?range=${range}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Fetch stats failed:", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchStats();
  }, [token, range]);

  if (loading) return (
    <div className="rounded-[28px] border border-white/80 bg-white/80 p-8 text-center font-bold text-slate-500 shadow-sm animate-pulse">
      Đang tải thống kê hệ thống...
    </div>
  );

  const summaryCards = [
    {
      label: `Doanh thu (${range} ngày qua)`,
      value: stats?.totalRevenue?.toLocaleString("vi-VN") || "0",
      suffix: "VNĐ",
      accent: "from-cyan-500 to-sky-600",
      soft: "bg-cyan-50 text-cyan-700",
      note: "Tổng phòng và dịch vụ"
    },
    {
      label: "Trạng thái phòng hiện tại",
      value: stats?.occupiedRooms || 0,
      suffix: `/ ${stats?.occupiedRooms + stats?.availableRooms || 0}`,
      accent: "from-emerald-500 to-teal-600",
      soft: "bg-emerald-50 text-emerald-700",
      note: "Phòng đang có khách"
    },
    {
      label: "Lượt đặt phòng",
      value: stats?.bookingCount || 0,
      suffix: "",
      accent: "from-amber-400 to-orange-500",
      soft: "bg-amber-50 text-amber-700",
      note: "Đơn trong khoảng lọc"
    }
  ];

  return (
    <div className="space-y-7 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-[28px] border border-white/80 bg-white p-6 shadow-sm shadow-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/80"
          >
            <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${card.accent}`} />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
                <p className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                  {card.value} <span className="text-sm font-black text-slate-400">{card.suffix}</span>
                </p>
              </div>
              <span className={`rounded-2xl px-3 py-2 text-[10px] font-black uppercase ${card.soft}`}>
                Live
              </span>
            </div>
            <p className="mt-5 text-sm font-semibold text-slate-500">{card.note}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-[32px] border border-white/80 bg-white shadow-sm shadow-slate-200/70">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-white via-sky-50/45 to-emerald-50/45 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-2xl font-black tracking-tight text-slate-950">Biểu đồ doanh thu</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">Dữ liệu tổng hợp theo ngày (Phòng + Dịch vụ)</p>
          </div>
          <select 
            value={range} 
            onChange={(e) => setRange(Number(e.target.value))}
            className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          >
            <option value={7}>7 ngày qua</option>
            <option value={30}>30 ngày qua</option>
            <option value={90}>3 tháng qua</option>
          </select>
        </div>
        
        <div className="h-[380px] w-full p-4 md:h-[460px] md:p-7">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.revenueChart || []} margin={{ top: 10, right: 10, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="4 8" vertical={false} stroke="#e5edf7" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#8a9ab0', fontSize: 11, fontWeight: 800 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#8a9ab0', fontSize: 11, fontWeight: 800 }}
                tickFormatter={(value) => `${(value / 1000).toLocaleString()}k`}
              />
              <Tooltip 
                cursor={{ fill: '#f1f7fb' }}
                contentStyle={{ borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 24px 40px -18px rgb(15 23 42 / 0.25)', padding: '14px' }}
                itemStyle={{ color: '#0891b2', fontWeight: 900, fontSize: '12px' }}
                labelStyle={{ color: '#475569', fontWeight: 800, fontSize: '11px', marginBottom: '4px' }}
                formatter={(value) => [`${value.toLocaleString("vi-VN")} VNĐ`, "Doanh thu"]}
              />
              <Bar 
                dataKey="revenue" 
                fill="#0891b2"
                radius={[10, 10, 0, 0]}
                barSize={44}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
