import { useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { loadData } from "../features/hotelSlice";
import { API_URL } from "../services/config";

const emptyRoomForm = {
  number: "",
  type: "Standard",
  price: "",
  capacity: 1,
  floor: "",
  imageUrl: "",
  status: "available",
};

const ROOM_IMAGE_FALLBACKS = {
  Standard: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=800",
  VIP: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800",
  Suite: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800",
  "Royal Suite": "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=800",
};

export default function RoomsView() {
  const dispatch = useDispatch();
  const { rooms: roomsData, bookings, user } = useSelector((state) => state.hotel);
  const isAdmin = user?.role === "admin";
  const [roomForm, setRoomForm] = useState(emptyRoomForm);
  const [editingRoomNumber, setEditingRoomNumber] = useState(null);
  const [formError, setFormError] = useState("");
  const roomEditorRef = useRef(null);

  // Backend trả về object { rooms: [...] }, chúng ta cần lấy mảng rooms đó ra
  const roomsList = Array.isArray(roomsData) ? roomsData : (roomsData?.rooms || []);

  // Hàm tính toán trạng thái động cho view quản lý
  const getDynamicStatus = (room) => {
    if (room.status === "maintenance") return "maintenance";

    const today = new Date().toLocaleDateString("en-CA");
    const inactiveBookingStatuses = new Set(["cancelled", "canceled", "completed"]);
    const belongsToRoom = (booking) =>
      String(booking.room_id || booking.roomId) === String(room.id) ||
      String(booking.room_id || booking.roomId) === String(room.number);

    const activeBooking = (bookings || []).find(b =>
      belongsToRoom(b) &&
      !inactiveBookingStatuses.has(String(b.status || "").toLowerCase()) &&
      today >= (b.check_in || b.checkIn) &&
      today < (b.check_out || b.checkOut)
    );

    if (activeBooking) return room.status === "reserved" ? "reserved" : "occupied";

    // Không để booking cũ ghi đè trạng thái admin vừa chỉnh thủ công.
    if (room.status === "occupied" || room.status === "reserved") return room.status;

    return "available";
  };

  const [loading, setLoading] = useState(false);

  const resetRoomForm = () => {
    setRoomForm(emptyRoomForm);
    setEditingRoomNumber(null);
    setFormError("");
  };

  const handleRoomFormChange = (field, value) => {
    setRoomForm((prev) => ({ ...prev, [field]: value }));
    setFormError("");
  };

  const getRoomImage = (room) => {
    return room.imageUrl || room.image_url || ROOM_IMAGE_FALLBACKS[room.type] || ROOM_IMAGE_FALLBACKS.Standard;
  };

  const handleEditRoom = (room) => {
    setEditingRoomNumber(room.number);
    setRoomForm({
      number: room.number || "",
      type: room.type || "Standard",
      price: room.price || "",
      capacity: room.capacity || 1,
      floor: room.floor || "",
      imageUrl: room.imageUrl || room.image_url || "",
      status: getDynamicStatus(room),
    });
    setFormError("");
    requestAnimationFrame(() => {
      roomEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleRoomSubmit = async (event) => {
    event?.preventDefault?.();
    setFormError("");

    if (!roomForm.number.trim()) {
      setFormError("Vui lòng nhập số phòng.");
      return;
    }

    if (!roomForm.type.trim()) {
      setFormError("Vui lòng nhập loại phòng.");
      return;
    }

    if (Number(roomForm.price) <= 0) {
      setFormError("Giá phòng phải lớn hơn 0.");
      return;
    }

    if (Number(roomForm.capacity) <= 0) {
      setFormError("Sức chứa phải lớn hơn 0.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        editingRoomNumber ? `${API_URL}/rooms/${editingRoomNumber}` : `${API_URL}/rooms`,
        {
          method: editingRoomNumber ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...roomForm,
            number: roomForm.number.trim(),
            type: roomForm.type.trim(),
            price: Number(roomForm.price),
            capacity: Number(roomForm.capacity),
            floor: roomForm.floor === "" ? null : Number(roomForm.floor),
            imageUrl: roomForm.imageUrl.trim(),
          }),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data.error || "Không thể lưu thông tin phòng.");
        return;
      }

      resetRoomForm();
      dispatch(loadData());
      alert(editingRoomNumber ? "Đã cập nhật phòng thành công!" : "Đã thêm phòng thành công!");
    } catch (err) {
      console.error("Error saving room:", err);
      setFormError("Không thể kết nối đến server.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (room) => {
    const ok = window.confirm(`Bạn có chắc muốn xóa phòng ${room.number}?`);
    if (!ok) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/rooms/${room.number}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Không thể xóa phòng.");
        return;
      }

      if (editingRoomNumber === room.number) resetRoomForm();
      dispatch(loadData());
      alert("Đã xóa phòng thành công!");
    } catch (err) {
      console.error("Error deleting room:", err);
      alert("Không thể kết nối đến server.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (roomId, newStatus) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Tạo dữ liệu cập nhật, kèm metadata cho trường hợp "Đã đặt"
      const payload = {
        status: newStatus,
        ...( (newStatus === "occupied" || newStatus === "reserved") && {
          customer: "Admin_WalkIn",
          checkIn: new Date().toISOString(),
          notes: "Cập nhật thủ công bởi quản trị viên"
        })
      };

      const res = await fetch(`${API_URL}/rooms/${roomId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await dispatch(loadData()).unwrap(); // Làm mới dữ liệu toàn hệ thống (Dashboard, List)
        alert(`Đã cập nhật trạng thái phòng thành công!`);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Không thể cập nhật trạng thái phòng.");
      }
    } catch (err) {
      console.error("Error updating room:", err);
      alert("Không thể kết nối đến server.");
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
      {isAdmin && (
        <form
          ref={roomEditorRef}
          onSubmit={handleRoomSubmit}
          noValidate
          className="scroll-mt-6 rounded-[28px] border border-white/80 bg-white p-5 shadow-sm shadow-slate-200/70"
        >
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-600">Room editor</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                {editingRoomNumber ? `Sửa phòng ${editingRoomNumber}` : "Thêm phòng mới"}
              </h2>
            </div>
            {editingRoomNumber && (
              <button
                type="button"
                onClick={resetRoomForm}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Hủy sửa
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-7">
            <label className="text-sm font-semibold text-slate-700">
              Số phòng
              <input
                type="text"
                value={roomForm.number}
                onChange={(e) => handleRoomFormChange("number", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm font-medium outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Loại phòng
              <select
                value={roomForm.type}
                onChange={(e) => handleRoomFormChange("type", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm font-medium outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                <option value="Standard">Standard</option>
                <option value="VIP">VIP</option>
                <option value="Suite">Suite</option>
                <option value="Royal Suite">Royal Suite</option>
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Giá
              <input
                type="number"
                min="1"
                value={roomForm.price}
                onChange={(e) => handleRoomFormChange("price", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm font-medium outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Sức chứa
              <input
                type="number"
                min="1"
                value={roomForm.capacity}
                onChange={(e) => handleRoomFormChange("capacity", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm font-medium outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Tầng
              <input
                type="number"
                value={roomForm.floor}
                onChange={(e) => handleRoomFormChange("floor", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm font-medium outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <label className="text-sm font-semibold text-slate-700 md:col-span-3 lg:col-span-2">
              Địa chỉ hình ảnh
              <input
                type="text"
                value={roomForm.imageUrl}
                onChange={(e) => handleRoomFormChange("imageUrl", e.target.value)}
                placeholder="https://..."
                className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm font-medium outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>
          </div>

          {formError && (
            <div className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">{formError}</div>
          )}

          <button
            type="button"
            onClick={handleRoomSubmit}
            disabled={loading}
            className="mt-5 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {editingRoomNumber ? "Cập nhật phòng" : "Thêm phòng"}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.isArray(roomsList) && roomsList.map((room) => {
          const currentStatus = getDynamicStatus(room);
          return (
          <div
            key={room.id}
            className="group overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-sm shadow-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/80"
          >
            <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100">
              <img
                src={getRoomImage(room)}
                alt={`Phòng ${room.number}`}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                onError={(e) => {
                  e.currentTarget.src = ROOM_IMAGE_FALLBACKS.Standard;
                }}
              />
            </div>
            <div className="p-5">
            <div className="mb-3">
              <h3 className="text-xl font-black tracking-tight text-slate-950">Phòng {room.number}</h3>
              <p className="text-sm font-semibold text-slate-500">{room.type}</p>
            </div>
            <div className="mb-4 space-y-1.5">
              <p className="text-sm">
                <span className="font-semibold text-slate-500">Giá:</span>
                <span className="ml-2 font-black text-slate-950">{room.price.toLocaleString("vi-VN")} ₫</span>
              </p>
              <p className="text-sm">
                <span className="font-semibold text-slate-500">Sức chứa:</span>
                <span className="ml-2 text-slate-900">{room.capacity || 1} khách</span>
              </p>
              <p className="text-sm">
                <span className="font-semibold text-slate-500">Doanh thu:</span>
                <span className="ml-2 font-black text-emerald-600">{(room.revenue || 0).toLocaleString("vi-VN")} ₫</span>
              </p>
              {room.floor && (
                <p className="text-sm">
                  <span className="font-semibold text-slate-500">Tầng:</span>
                  <span className="ml-2 text-slate-900">{room.floor}</span>
                </p>
              )}
            </div>
            <div className="flex items-center justify-between">
              {isAdmin ? (
                <select
                  value={currentStatus}
                  onChange={(e) => handleStatusChange(room.number, e.target.value)}
                  className={`rounded-2xl border-0 px-3 py-2 text-xs font-bold outline-none ${getStatusColor(currentStatus)}`}
                >
                  <option value="available">Trống</option>
                  <option value="reserved" disabled>Đã đặt trước (Tự động từ khách)</option>
                  <option value="occupied">Đã đặt (Tại chỗ)</option>
                  <option value="maintenance">Bảo trì</option>
                </select>
              ) : (
                <span className={`rounded-2xl px-3 py-2 text-xs font-bold ${getStatusColor(currentStatus)}`}>
                  {currentStatus === "available"
                    ? "Trống"
                    : currentStatus === "occupied"
                    ? "Đã đặt (Tại chỗ)"
                    : currentStatus === "reserved"
                    ? "Đã đặt trước (Online)"
                    : "Bảo trì"}
                </span>
              )}
            </div>
            {isAdmin && (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleEditRoom(room)}
                  disabled={loading}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteRoom(room)}
                  disabled={loading}
                  className="rounded-2xl bg-rose-50 px-4 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Xóa
                </button>
              </div>
            )}
            </div>
          </div>
        )})}
      </div>
    </div>
  );
}
