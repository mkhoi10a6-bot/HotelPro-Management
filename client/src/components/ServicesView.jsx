import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { loadData } from "../features/hotelSlice";

const MENU_DATA = [
  {
    category: "Thức ăn (Food)",
    items: [
      { id: "f1", name: "Bánh mì", price: 35000, desc: "Bánh mì đặc biệt đầy đủ topping", image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=200" },
      { id: "f2", name: "Phở Bò", price: 65000, desc: "Phở bò truyền thống hương vị đậm đà", image: "https://images.unsplash.com/photo-1582878826629-29b7ad1ccd63?auto=format&fit=crop&q=80&w=200" },
      { id: "f3", name: "Bún Chả Hà Nội", price: 65000, desc: "Bún chả Hà Nội chuẩn vị, thơm ngon", image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=200" },
      { id: "f4", name: "Gỏi Cuốn Tôm Thịt", price: 45000, desc: "Gỏi cuốn tươi mát (3 cuốn)", image: "https://images.unsplash.com/photo-1539136788836-5699e7863572?auto=format&fit=crop&q=80&w=200" },
      { id: "f5", name: "Cơm Tấm Sườn Bì Chả", price: 60000, desc: "Cơm tấm sườn bì chả đặc trưng Sài Gòn", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200" },
      { id: "f6", name: "Bánh Mì Chảo Đặc Biệt", price: 50000, desc: "Bánh mì chảo nóng hổi với trứng và pate", image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&q=80&w=200" },
    ],
  },
  {
    category: "Đồ uống (Drinks)",
    items: [
      { id: "d1", name: "Cafe muối", price: 40000, desc: "Cà phê muối đặc sản thơm béo", image: "https://images.unsplash.com/photo-1541167760496-162955ed8a9f?auto=format&fit=crop&q=80&w=200" },
      { id: "d2", name: "Nước suối", price: 15000, desc: "Nước khoáng đóng chai tinh khiết", image: "https://images.unsplash.com/photo-1523362628742-0c26015ebbc6?auto=format&fit=crop&q=80&w=200" },
      { id: "d3", name: "Trà đào", price: 30000, desc: "Trà đào miếng thơm mát giải nhiệt", image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=200" },
      { id: "d4", name: "Trà Mãng Cầu Xiêm", price: 40000, desc: "Trà mãng cầu xiêm thanh mát (Hot trend)", image: "https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?auto=format&fit=crop&q=80&w=200" },
      { id: "d5", name: "Cà Phê Trứng Hà Nội", price: 50000, desc: "Cà phê trứng béo ngậy chuẩn vị Hà Nội", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=200" },
      { id: "d6", name: "Nước Ép Trái Cây Tươi", price: 30000, desc: "Nước ép tươi theo mùa (Thơm/Dưa hấu)", image: "https://images.unsplash.com/photo-1621506289937-e8e498c0b67a?auto=format&fit=crop&q=80&w=200" },
      { id: "d7", name: "Sinh Tố Bơ Sáp", price: 40000, desc: "Sinh tố bơ sáp thơm ngon, bổ dưỡng", image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=200" },
    ],
  },
  {
    category: "Dịch vụ khác (Other Services)",
    items: [
      { id: "o1", name: "Giặt ủi (Laundry)", price: 50000, desc: "Dịch vụ giặt sấy trong ngày", image: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&q=80&w=200" },
      { id: "o2", name: "Thuê xe máy (Motorbike rental)", price: 150000, desc: "Xe máy đời mới, đầy đủ xăng", image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=200" },
    ],
  },
];

function AdminServiceView() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/service-orders", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Lỗi tải đơn hàng:", e);
    } finally {
      setLoading(false);
    }
  };

  const markAsServed = async (id) => {
    try {
      const res = await fetch(`http://localhost:4000/api/service-orders/${id}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        setOrders(orders.map(o => o.id === id ? { ...o, status: "Completed" } : o));
      }
    } catch (e) {
      alert("Lỗi khi cập nhật trạng thái");
    }
  };

  if (loading) return <div className="text-center py-10">Đang tải danh sách đơn hàng...</div>;

  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-lg font-bold text-slate-800">Quản lý Đơn hàng Dịch vụ</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50">
            <tr>
              <th className="px-6 py-4">Số Phòng</th>
              <th className="px-6 py-4">Khách hàng</th>
              <th className="px-6 py-4">Dịch vụ yêu cầu</th>
              <th className="px-6 py-4">Tổng cộng</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-slate-400 italic">Chưa có đơn hàng nào cần phục vụ</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-sky-600">{order.roomNumber}</td>
                  <td className="px-6 py-4 text-slate-700">{order.customerName}</td>
                  <td className="px-6 py-4">
                    {order.items.map(i => `${i.name} (x${i.quantity})`).join(", ")}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">{order.totalAmount.toLocaleString("vi-VN")}đ</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${order.status === 'Completed' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${order.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {order.status === 'Completed' ? 'Đã phục vụ' : 'Đang phục vụ'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {order.status === "Pending" && (
                      <button 
                        onClick={() => markAsServed(order.id)}
                        className="bg-sky-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-sky-700 transition"
                      >
                        Đã phục vụ (Served)
                      </button>
                    )}
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

function ServiceItemCard({ item, onAdd }) {
  const [note, setNote] = useState("");

  return (
    <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all group h-full">
      {/* Top Content Row */}
      <div className="flex justify-between gap-4 mb-4">
        <div className="flex-1">
          <h4 className="font-bold text-slate-800 text-lg">{item.name}</h4>
          <p className="text-sky-600 font-black text-md mt-1">{item.price.toLocaleString("vi-VN")}đ</p>
          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{item.desc}</p>
        </div>
        <div className="w-28 h-28 shrink-0 rounded-xl overflow-hidden shadow-sm bg-slate-50">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      </div>

      {/* Bottom Action Section */}
      <div className="mt-auto pt-4 border-t border-slate-50 space-y-3">
        <input 
          type="text" 
          placeholder="Ghi chú (Ví dụ: không cay, nhiều đá...)"
          className="w-full text-xs bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 focus:ring-1 focus:ring-sky-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button
          onClick={() => { onAdd(item, note); setNote(""); }}
          className="w-full bg-slate-900 text-white hover:bg-sky-600 py-3 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm vào giỏ hàng
        </button>
      </div>
    </div>
  );
}

function CustomerServiceView() {
  const { user } = useSelector((s) => s.hotel);
  const dispatch = useDispatch();

  const [selectedItems, setSelectedItems] = useState([]);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [roomNumber, setRoomNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const addItem = (item, note) => {
    setSelectedItems((prev) => [...prev, { ...item, note, quantity: 1, cartId: Date.now() }]);
    setPaymentSuccess(false);
  };

  const removeItem = (cartId) => {
    setSelectedItems((prev) => prev.filter((i) => i.cartId !== cartId));
  };

  const totalAmount = selectedItems.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = () => {
    /* --- Pre-flight Validation --- */
    if (!roomNumber || selectedItems.length === 0 || !user?.name) { // Ensure user name is available for payload
      return alert("Vui lòng nhập số phòng và chọn ít nhất một dịch vụ.");
    }
    setIsCartOpen(false);
    setShowSuccessModal(true);
  };


  const handleConfirmPayment = async () => {
    const originContext = 'SERVICE';
    /* --- Anti-Race Condition --- */
    setLoading(true);

    try {
      const postOrder = async (retries = 3) => {
        const response = await fetch("http://localhost:4000/api/service-orders", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          roomNumber,
          customerName: user.name,
          items: selectedItems,
          totalAmount,
          paymentMethod: 'qr' // Defaulting to QR for service view as per previous logic
          })
        });
        if (!response.ok && retries > 0) {
          console.warn(`[RETRY] Service order attempt ${4 - retries} failed. Retrying...`);
          return postOrder(retries - 1);
        }
        return response;
      };

      const res = await postOrder();

      if (res.status === 200 || res.status === 201) {
        /* --- Success Handler: Silent UI wipe --- */
        setSelectedItems([]);
        setShowSuccessModal(false);
        setRoomNumber("");
        // Trigger silent re-fetch for admin stats
        dispatch(loadData()).unwrap().catch(() => {});
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error(`[${originContext}] ERR_API_RESPONSE ${res.status}:`, errorData);
      }
    } catch (e) {
      console.error(`[${originContext}] System Exception:`, e.message);
      // Silent Fallback
      const queue = JSON.parse(localStorage.getItem("offline_services") || "[]");
      localStorage.setItem("offline_services", JSON.stringify([...queue, { roomNumber, items: selectedItems, ts: Date.now() }]));
    } finally {
      setLoading(false);
      /* --- Context-Aware Redirect to My Services --- */
      window.history.pushState({}, "", "/services");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-500 relative">
      {paymentSuccess && (
        <div className="mb-8 bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-3xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <div className="bg-emerald-500 text-white rounded-full p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="font-semibold">Thanh toán hoàn tất! Cảm ơn quý khách.</span>
        </div>
      )}

      <div className="space-y-10">
        {MENU_DATA.map((group) => (
          <div key={group.category}>
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
              <span className="w-1 h-6 bg-sky-600 rounded-full"></span>
              {group.category}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {group.items.map((item) => (
                <ServiceItemCard key={item.id} item={item} onAdd={addItem} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Cart Button */}
      {selectedItems.length > 0 && !showSuccessModal && (
        <button 
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-10 right-10 bg-sky-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 hover:bg-sky-700 transition-all scale-100 active:scale-95 z-[90]"
        >
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="absolute -top-2 -right-2 bg-rose-500 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-sky-600 animate-bounce">
              {selectedItems.length}
            </span>
          </div>
          <span className="font-bold">Xem giỏ hàng</span>
          <span className="border-l border-sky-500 pl-4 font-black">{totalAmount.toLocaleString("vi-VN")}đ</span>
        </button>
      )}

      {/* Cart Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800">Giỏ hàng của bạn</h3>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-8 max-h-[50vh] overflow-y-auto space-y-4">
              {selectedItems.map((item) => (
                <div key={item.cartId} className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
                  <div className="flex-1">
                    <p className="font-bold text-slate-700">{item.name}</p>
                    {item.note && <p className="text-[10px] text-sky-600 font-medium italic mt-0.5">Note: {item.note}</p>}
                    <p className="text-xs font-black text-slate-400 mt-1">{item.price.toLocaleString("vi-VN")}đ</p>
                  </div>
                  <button onClick={() => removeItem(item.cartId)} className="text-rose-400 hover:text-rose-600 p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="p-8 bg-white border-t space-y-6">
              <div className="flex justify-between items-center px-2">
                <span className="text-slate-400 font-bold uppercase text-xs tracking-widest">Tổng cộng</span>
                <span className="text-2xl font-black text-sky-600">{totalAmount.toLocaleString("vi-VN")}đ</span>
              </div>
              <input 
                type="text" 
                placeholder="Nhập số phòng để phục vụ..."
                className="w-full border-2 border-slate-100 rounded-2xl p-4 text-sm outline-none focus:border-sky-500 transition"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
              />
              <button 
                onClick={handleCheckout}
                className="w-full bg-sky-600 text-white font-black py-5 rounded-2xl hover:bg-sky-700 shadow-xl shadow-sky-600/30 transition active:scale-[0.98]"
              >
                ĐẶT TẤT CẢ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Success & Payment Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[48px] w-full max-w-md p-10 text-center shadow-2xl animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Đặt hàng thành công</h3>
            <p className="text-slate-400 text-sm mb-8">Vui lòng quét mã QR để hoàn tất thanh toán {totalAmount.toLocaleString("vi-VN")}đ</p>
            
            <div className="bg-slate-50 p-6 rounded-[32px] border-2 border-slate-100 mb-8 inline-block">
              <img 
                src="/image_cf3bf8.jpg" 
                alt="QR Payment" 
                className="w-48 h-48 object-cover rounded-xl"
                onError={(e) => (e.target.src = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=HotelService")}
              />
            </div>

            <p className="text-emerald-600 font-bold mb-8">Cảm ơn quý khách đã sử dụng dịch vụ!</p>

            <button 
              onClick={handleConfirmPayment}
              disabled={loading}
              className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl hover:bg-black transition active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Đang xử lý..." : "Xác nhận đã chuyển khoản"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ServicesView() {
  const { user } = useSelector((s) => s.hotel);
  return user?.role === "admin" ? <AdminServiceView /> : <CustomerServiceView />;
}
