import React from "react";
import { useSelector } from "react-redux";

export default function AdminBookingsView() {
  const { bookings } = useSelector((state) => state.hotel);

  return (
    <div className="space-y-4">
      {bookings.map((b) => (
        <div key={b.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
          <div>
            <p className="font-bold text-slate-800">Booking #{b.id} - Phòng {b.roomId}</p>
            <p className="text-xs text-slate-500">{b.customerName} ({b.checkIn} - {b.checkOut})</p>
          </div>
          <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase">{b.status}</span>
        </div>
      ))}
    </div>
  );
}