import { useState } from "react";
import { useSelector } from "react-redux";

export default function RoomsView() {
  const { rooms, user } = useSelector((state) => state.hotel);
  const isAdmin = user?.role === "admin";
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (roomId, newStatus) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:4000/api/rooms/${roomId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error("Error updating room:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "occupied":
        return "bg-red-100 text-red-800";
      case "reserved":
        return "bg-yellow-100 text-yellow-800";
      case "maintenance":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">{isAdmin ? "Quản lý phòng" : "Danh sách phòng"}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-lg transition"
            onClick={() => setSelectedRoom(room)}
          >
            <div className="mb-3">
              <h3 className="text-lg font-bold text-slate-900">Phòng {room.number}</h3>
              <p className="text-sm text-slate-600">{room.type}</p>
            </div>
            <div className="mb-3 space-y-1">
              <p className="text-sm">
                <span className="font-medium text-slate-700">Giá:</span>
                <span className="ml-2 text-slate-900">{room.price.toLocaleString("vi-VN")} ₫</span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-slate-700">Sức chứa:</span>
                <span className="ml-2 text-slate-900">{room.capacity || 1} khách</span>
              </p>
              {room.floor && (
                <p className="text-sm">
                  <span className="font-medium text-slate-700">Tầng:</span>
                  <span className="ml-2 text-slate-900">{room.floor}</span>
                </p>
              )}
            </div>
            <div className="flex items-center justify-between">
              {isAdmin ? (
                <select
                  value={room.status}
                  onChange={(e) => handleStatusChange(room.id, e.target.value)}
                  className={`px-3 py-1 rounded text-xs font-medium border-0 ${getStatusColor(room.status)}`}
                >
                  <option value="available">Trống</option>
                  <option value="occupied">Đã đặt</option>
                  <option value="reserved">Đã đặt trước</option>
                  <option value="maintenance">Bảo trì</option>
                </select>
              ) : (
                <span className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(room.status)}`}>
                  {room.status === "available"
                    ? "Trống"
                    : room.status === "occupied"
                    ? "Đã đặt"
                    : room.status === "reserved"
                    ? "Đã đặt trước"
                    : "Bảo trì"}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Chi tiết phòng {selectedRoom.number}</h2>
            <div className="space-y-3 mb-6">
              <p><span className="font-medium">Loại:</span> {selectedRoom.type}</p>
              <p><span className="font-medium">Giá:</span> {selectedRoom.price.toLocaleString("vi-VN")} ₫</p>
              <p><span className="font-medium">Sức chứa:</span> {selectedRoom.capacity || 1} khách</p>
              <p><span className="font-medium">Tầng:</span> {selectedRoom.floor || "N/A"}</p>
              <p><span className="font-medium">Tiện nghi:</span> {selectedRoom.amenities || "N/A"}</p>
            </div>
            <button
              onClick={() => setSelectedRoom(null)}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
