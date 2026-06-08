import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loadData } from "../features/hotelSlice"; // Giả định slice đã có các action nhỏ lẻ hơn
import { API_URL } from "../services/config";

const ROOMS = [
  { id: 101, type: "Standard", price: 550000, summary: "Phòng Standard tiện nghi, view phố thoáng đãng.", image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=400", status: "available" },
  { id: 102, type: "Standard", price: 550000, summary: "Không gian yên tĩnh, phù hợp cho khách công tác.", image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=400", status: "available" },
  { id: 103, type: "Standard", price: 550000, summary: "Đầy đủ trang thiết bị cơ bản, sạch sẽ.", image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=400", status: "available" },
  { id: 104, type: "Standard", price: 550000, summary: "Phòng tiêu chuẩn với mức giá cực kỳ hợp lý.", image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=400", status: "available" },
  { id: 105, type: "Standard", price: 550000, summary: "Lựa chọn tốt nhất cho kỳ nghỉ ngắn ngày.", image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=400", status: "available" },
  { id: 201, type: "VIP", price: 950000, summary: "Hạng VIP sang trọng với nội thất gỗ cao cấp.", image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=400", status: "available" },
  { id: 202, type: "VIP", price: 950000, summary: "Tầm nhìn tuyệt đẹp, không gian rộng rãi.", image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=400", status: "available" },
  { id: 203, type: "VIP", price: 950000, summary: "Trải nghiệm nghỉ dưỡng đẳng cấp thượng lưu.", image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=400", status: "available" },
  { id: 301, type: "Suite", price: 1800000, summary: "Căn hộ Suite Premium với dịch vụ đặc quyền.", image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=400", status: "available" },
  { id: 302, type: "Suite", price: 1800000, summary: "Không gian sống thượng lưu, view toàn cảnh.", image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=400", status: "available" },
];

const AMENITIES_BY_TYPE = {
  Standard: ["Wifi tốc độ cao", "Điều hòa nhiệt độ", "Smart TV", "Nước suối miễn phí"],
  VIP: ["Tiện ích Standard", "Ban công riêng", "Mini bar", "Áo choàng tắm", "Bao gồm ăn sáng"],
  Suite: ["Tiện ích VIP", "Bồn tắm nằm", "View thành phố", "Nhận phòng ưu tiên", "Voucher Massage miễn phí"],
};

const ROOM_IMAGE_FALLBACKS = {
  Standard: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=800",
  VIP: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800",
  Suite: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800",
  "Royal Suite": "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=800",
};

function getRoomImage(room) {
  return room?.imageUrl || room?.image_url || room?.image || ROOM_IMAGE_FALLBACKS[room?.type] || ROOM_IMAGE_FALLBACKS.Standard;
}

export default function BookingPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const formRef = useRef(null);
  
  // Defensive Selection: Prevents crashes if Redux state is null or undefined
  const hotelState = useSelector((state) => state?.hotel || {});
  const user = hotelState?.user || null;
  const roomsFromStore = hotelState?.rooms || [];
  const bookingsFromStore = hotelState?.bookings || [];
  const initialFormState = {
    name: user?.name || "",
    phone: user?.phone || "",
    checkIn: "",
    checkOut: "",
    roomType: "Standard",
    roomNumber: ""
  };

  // Hàm tính toán trạng thái phòng động dựa trên lịch sử đặt phòng
  const isRoomAvailable = (room, bookings) => {
    // Nếu admin đánh dấu bảo trì, ưu tiên hiển thị bảo trì
    if (room?.status === "maintenance") return false;

    const now = new Date();
    now.setHours(0, 0, 0, 0); // So sánh theo ngày

    // Tìm các đơn đặt phòng của phòng này mà chưa bị hủy
    const roomBookings = bookings.filter(b =>
      Number(b.room_id || b.roomId) === Number(room.id || room.number) &&
      !["Cancelled", "cancelled"].includes(b.status)
    );

    // Kiểm tra xem có booking nào đang chiếm dụng phòng ở thời điểm hiện tại không
    const isOccupiedNow = roomBookings.some(b => {
      const checkIn = new Date(b.check_in || b.checkIn);
      const checkOut = new Date(b.check_out || b.checkOut);
      return now >= checkIn && now < checkOut;
    });

    return !isOccupiedNow;
  };

  // 1. Group all useState hooks at the top
  const [form, setForm] = useState(initialFormState);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRoomForPayment, setSelectedRoomForPayment] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [detailRoom, setDetailRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 2. Define displayRooms within scope but before any logic using it
  const actualStoreRooms = Array.isArray(roomsFromStore) ? roomsFromStore : (roomsFromStore?.rooms || []);
  const sourceRooms = actualStoreRooms.length > 0 ? actualStoreRooms : ROOMS;
  const displayRooms = sourceRooms.map(sourceRoom => {
    const localRoom = ROOMS.find(r => Number(r?.id) === Number(sourceRoom?.id || sourceRoom?.number)) || {};
    const roomId = Number(sourceRoom?.id || sourceRoom?.number || localRoom?.id);

    // Tính toán trạng thái động thay vì dùng thuộc tính status tĩnh
    const available = isRoomAvailable(sourceRoom || localRoom, bookingsFromStore);
    let status = available ? "available" : (sourceRoom?.status || "occupied");

    // Giữ nguyên logic đặc biệt cũ cho phòng 302 như yêu cầu
    if (roomId === 302) status = "available";

    return {
      ...localRoom,
      ...sourceRoom,
      id: roomId,
      number: sourceRoom?.number || String(roomId),
      summary: localRoom.summary || `${sourceRoom?.type || "Standard"} tiện nghi, sạch sẽ và phù hợp cho kỳ nghỉ của bạn.`,
      image: getRoomImage({ ...localRoom, ...sourceRoom }),
      status: status
    };
  });

  useEffect(() => {
    dispatch(loadData()).unwrap().catch(() => {});
  }, [dispatch]);

  // 3. Auto-scroll logic (Corrected hook dependency)
  useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showForm]);

  useEffect(() => {
    let timer;
    if (isSuccess) {
      timer = setTimeout(() => {
        setIsSuccess(false);
        setShowPaymentModal(false);
        setShowForm(false);
        navigate("/");
      }, 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isSuccess, navigate]);

  // Tính toán số đêm và tổng tiền
  const calculateStay = () => {
    if (!form?.checkIn || !form?.checkOut) return { nights: 0, total: 0, isValid: false };

    const start = new Date(form.checkIn);
    const end = new Date(form.checkOut);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return { nights: 0, total: 0, isValid: false };

    const priceMap = { Standard: 550000, VIP: 950000, Suite: 1800000 };
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const validNights = nights > 0 ? nights : 0;
    const pricePerNight = priceMap[form.roomType] || 0;
    return { nights: validNights, total: validNights * pricePerNight, isValid: true };
  };

  // Bước 2: Hàm xử lý khi bấm "Đặt phòng" (Thanh toán)
  const handleBookingClick = () => {
    const { isValid } = calculateStay();
    if (!isValid) return;

    setSelectedRoomForPayment(displayRooms.find(r => Number(r.id) === Number(form.roomNumber)));
    setShowPaymentModal(true);
  };

  const triggerBooking = (room) => {
    if (room?.status !== 'available') return;
    setForm({ ...form, roomType: room?.type, roomNumber: room?.id });
    setShowForm(true);
  };

  // Hàm xác nhận thanh toán và gọi API đặt phòng
  const handlePaymentConfirm = async () => {
    const { total, nights } = calculateStay();
    const token = localStorage.getItem("token");

    if (!form?.roomNumber || nights <= 0) return;

    setLoading(true);
    setErrorMsg("");

    try {
      // Simulated 2-second delay for transaction processing as requested
      await new Promise(resolve => setTimeout(resolve, 2000));

      const res = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          roomId: Number(form?.roomNumber),
          room_id: Number(form?.roomNumber), 
          customer_id: user?.id || null,     
          customerName: form?.name || user?.name || "Guest",
          phone: form?.phone ?? "",
          checkIn: form?.checkIn,
          checkOut: form?.checkOut,
          totalAmount: Number(total),
          paymentMethod: 'qr'
        })
      });

      if (res.ok) {
        setIsSuccess(true);
        
        // State Reset after success
        setShowPaymentModal(false);
        setShowForm(false);
        setForm(initialFormState); // Reset form về trạng thái trống hoặc thông tin user

        // Silent Sync: Refresh room statuses
        dispatch(loadData()).unwrap().catch((err) => console.error("Sync failed:", err));
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error(`[Booking API] 400 Bad Request:`, errorData);
        setErrorMsg(errorData?.error || "Dữ liệu đặt phòng không hợp lệ. Vui lòng kiểm tra lại.");
      }
    } catch (e) {
      console.error("[Booking API] Critical Error:", e);
      setErrorMsg("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const { nights, total, isValid } = calculateStay() || { nights: 0, total: 0, isValid: false };
  const isAdmin = user?.role === 'admin';

  // Phòng thủ lỗi White Screen: Hiển thị Loading nếu dữ liệu cực kỳ quan trọng bị thiếu
  if (!user && (!roomsFromStore || roomsFromStore.length === 0)) {
    return (
      <div className="flex items-center justify-center h-screen font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold">Đang tải dữ liệu hệ thống...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Thanh công cụ dành riêng cho Admin để không bị "tinh giảm chức năng" */}
      {isAdmin && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex justify-between items-center animate-in fade-in slide-in-from-top-4">
          <p className="text-amber-800 text-sm font-medium">Bạn đang đăng nhập với quyền <strong>Quản trị viên</strong></p>
          <button onClick={() => navigate('/admin/dashboard')} className="bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-700 transition">
            ĐI ĐẾN TRANG QUẢN LÝ
          </button>
        </div>
      )}

      {/* Section 1: Room Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayRooms.map((room) => (
          <div key={room.id} className="group relative flex flex-col bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="p-5 flex-1 pr-24">
              <div className="flex items-center gap-2 mb-2">
                {/* Vòng tròn trạng thái: Đỏ (Available) / Xanh (Occupied) */}
                <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${
                  room?.status === 'available' ? 'bg-rose-500' : 'bg-emerald-500'
                }`} />
                <h3 className="text-lg font-bold text-slate-800">Phòng {room.number || room.id}</h3>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                  room?.type === 'Royal Suite' ? 'bg-yellow-100 text-yellow-700' :
                  room?.type === 'Suite' ? 'bg-purple-100 text-purple-600' :
                  room?.type === 'VIP' ? 'bg-amber-100 text-amber-600' :
                  'bg-sky-100 text-sky-600'
                }`}>
                  {room?.type || "Standard"}
                </span>
              </div>
              <p className="text-sky-600 font-black text-sm">{(room?.price ?? 0).toLocaleString("vi-VN")} VNĐ</p>
              <p className="mt-3 text-[11px] text-slate-500 leading-relaxed line-clamp-3">{room?.summary}</p>
              
              <div className="mt-5 flex gap-2">
                <button 
                  onClick={() => setDetailRoom({ ...room, amenities: AMENITIES_BY_TYPE[room?.type] || [] })}
                  className="px-3 py-2 text-[10px] font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
                >
                  Chi tiết
                </button>
                <button 
                  onClick={() => triggerBooking(room)}
                  disabled={room?.status !== 'available'}
                  className={`px-3 py-2 text-[10px] font-bold text-white bg-sky-600 rounded-xl hover:bg-sky-700 shadow-md shadow-sky-600/20 transition ${
                    room?.status !== 'available' ? 'opacity-50 cursor-not-allowed grayscale' : ''
                  }`}
                >
                  {room?.status === 'available' ? 'Đặt phòng' : 'Hết phòng'}
                </button>
              </div>
            </div>
            
            {/* Bottom Right Image */}
            <div className="absolute bottom-0 right-0 w-24 h-24 overflow-hidden rounded-tl-3xl border-t-4 border-l-4 border-white shadow-2xl">
              <img 
                src={getRoomImage(room)}
                alt={`Phòng ${room.number || room.id}`}
                className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700" 
                onError={(e) => {
                  e.currentTarget.src = ROOM_IMAGE_FALLBACKS.Standard;
                }}
              />
              {room.status !== 'available' && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Hết phòng</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Section 2: Customer Info Form (Trình diễn khi trigger) */}
      {showForm && (
        <div ref={formRef} className="max-w-2xl mx-auto bg-white rounded-3xl p-8 shadow-2xl border border-sky-100 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">Đặt phòng {form.roomNumber}</h2>
            <span className="bg-sky-100 text-sky-700 px-4 py-1 rounded-full text-xs font-bold">Hạng {form.roomType}</span>
          </div>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-2 uppercase">Họ và tên</label>
                <input className="w-full border border-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-sky-500 outline-none" placeholder="Nhập tên khách hàng" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-2 uppercase">Số điện thoại</label>
                <input className="w-full border border-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-sky-500 outline-none" placeholder="Nhập số điện thoại" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-2 uppercase">Ngày nhận phòng</label>
                <input type="date" value={form.checkIn} className="w-full border border-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-sky-500 outline-none" onChange={e => setForm({...form, checkIn: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-2 uppercase">Ngày trả phòng</label>
                <input type="date" value={form.checkOut} className="w-full border border-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-sky-500 outline-none" onChange={e => setForm({...form, checkOut: e.target.value})} />
              </div>
            </div>

            {isValid && (
              <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100">
                <div className="flex justify-between items-center text-sky-800">
                  <span className="text-sm font-medium">Thời gian lưu trú: <strong>{nights} đêm</strong></span>
                  <span className="text-lg font-black">{total.toLocaleString("vi-VN")} VNĐ</span>
                </div>
              </div>
            )}

            <button onClick={handleBookingClick} disabled={!isValid} className="w-full bg-sky-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-sky-600/30 hover:bg-sky-700 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale">
              {isValid ? `THANH TOÁN ${total.toLocaleString("vi-VN")} VNĐ` : "VUI LÒNG CHỌN NGÀY HỢP LỆ"}
            </button>
          </div>
        </div>
      )}

      {/* Amenities Popup (Modal Chi tiết) */}
      {detailRoom && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-[110] animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] p-10 max-w-lg w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-bl-full -z-10" />
            <h3 className="text-2xl font-black text-slate-800 mb-2">Phòng {detailRoom.id}</h3>
            <p className="text-sky-600 font-bold mb-8">Danh sách tiện ích hạng {detailRoom.type}</p>
            
            <div className="grid grid-cols-1 gap-4 mb-10">
              {detailRoom?.amenities?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-sky-500" />
                  <span className="text-slate-700 font-medium">{item}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setDetailRoom(null)} 
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Bước 3: Giao diện Modal QR */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] backdrop-blur-sm">
          {isSuccess ? (
            <div className="bg-white p-12 rounded-[40px] max-w-md w-full shadow-2xl text-center animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3">Cảm ơn quý khách!</h3>
              <p className="text-slate-600 font-medium leading-relaxed">Đặt phòng thành công.<br />Đang quay lại trang chủ...</p>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-3xl shadow-xl max-w-sm w-full text-center border border-slate-100">
              <h3 className="text-xl font-bold mb-4 text-slate-800">Thanh toán đặt phòng</h3>
              <p className="mb-1 text-slate-600 font-medium">Phòng: {selectedRoomForPayment?.id}</p>
              <p className="mb-4 text-sky-600 font-black text-lg">{total.toLocaleString("vi-VN")} VNĐ</p>

              <div className="flex justify-center mb-6">
                <img
                  src="https://img.vietqr.io/image/AGRIBANK-1805205139140-compact2.png?accountName=PHAM%20MINH%20KHOI"
                  alt="QR Code thanh toán"
                  className="w-64 h-64 border-2 border-slate-50 p-2 rounded-2xl"
                />
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-medium">
                  ⚠️ {errorMsg}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handlePaymentConfirm}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-4 rounded-2xl hover:bg-green-700 font-bold shadow-lg shadow-green-600/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? "Đang xác thực..." : "Xác nhận đã chuyển khoản"}
                </button>

                <button
                  onClick={() => { setShowPaymentModal(false); setErrorMsg(""); }}
                  className="w-full bg-slate-100 text-slate-500 py-3 rounded-2xl hover:bg-slate-200 font-semibold transition"
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
