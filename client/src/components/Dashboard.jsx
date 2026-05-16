import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(7); // Mặc định 7 ngày
  const { token } = useSelector(s => s.hotel || {});

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/admin/stats?range=${range}`, {
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
    <div className="p-8 text-center text-slate-500 font-bold animate-pulse">
      Đang tải thống kê hệ thống...
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Thẻ thống kê nhanh */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Doanh thu ({range} ngày qua)</p>
          <p className="text-2xl font-black text-slate-800">
            {stats?.totalRevenue?.toLocaleString("vi-VN")} <span className="text-xs font-bold text-slate-400">VNĐ</span>
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Trạng thái phòng hiện tại</p>
          <p className="text-2xl font-black text-emerald-600">
            {stats?.occupiedRooms} <span className="text-xs font-bold text-slate-400">/ {stats?.occupiedRooms + stats?.availableRooms}</span>
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Lượt đặt phòng</p>
          <p className="text-2xl font-black text-sky-600">{stats?.bookingCount}</p>
        </div>
      </div>

      {/* Biểu đồ doanh thu */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-800">Biểu đồ doanh thu</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Dữ liệu tổng hợp theo ngày (Phòng + Dịch vụ)</p>
          </div>
          <select 
            value={range} 
            onChange={(e) => setRange(Number(e.target.value))}
            className="bg-slate-50 border-none rounded-2xl px-4 py-2 text-xs font-bold text-slate-600 focus:ring-2 ring-sky-500 outline-none transition cursor-pointer"
          >
            <option value={7}>7 ngày qua</option>
            <option value={30}>30 ngày qua</option>
            <option value={90}>3 tháng qua</option>
          </select>
        </div>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.revenueChart || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                tickFormatter={(value) => `${(value / 1000).toLocaleString()}k`}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                itemStyle={{ color: '#0284c7', fontWeight: 900, fontSize: '12px' }}
                labelStyle={{ color: '#64748b', fontWeight: 700, fontSize: '10px', marginBottom: '4px' }}
                formatter={(value) => [`${value.toLocaleString("vi-VN")} VNĐ`, "Doanh thu"]}
              />
              <Bar 
                dataKey="revenue" 
                fill="#0284c7" 
                radius={[6, 6, 0, 0]} 
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}