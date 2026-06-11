import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { chatbotRespond } from "../services/chatbot";

export default function ChatPageView() {
  const { user } = useSelector((s) => s.hotel);

  const aiAvatar = "https://api.dicebear.com/7.x/bottts/svg?seed=MayAnNhien&backgroundColor=d1d4f9";

  const getUserAvatar = () => {
    const name = user?.name || "Guest";
    const gender = user?.gender?.toLowerCase();
    const lowerName = name.toLowerCase();
    
    // Logic nhận diện giới tính dựa trên thuộc tính profile hoặc tên (Hỗ trợ tiếng Việt)
    if (gender === 'female' || lowerName.includes("thị") || lowerName.includes("thuy") || lowerName.includes("ngoc")) {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=b6e3f4`;
    }
    if (gender === 'male' || lowerName.includes("văn") || lowerName.includes("hung") || lowerName.includes("anh")) {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=c0aede`;
    }
    // Default avatar trung tính sử dụng tên làm seed
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}&backgroundColor=ffdfbf`;
  };

  const userAvatar = getUserAvatar();

  const [messages, setMessages] = useState([
    { text: "Chào mừng bạn đến với Mây An Nhiên! Tôi là trợ lý AI, tôi có thể giúp gì cho bạn hôm nay?", isUser: false }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { text: input, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      const data = await chatbotRespond({ message: currentInput });

      setMessages(prev => [...prev, { 
        text: data?.reply || "Mây An Nhiên chưa có phản hồi, bạn thử hỏi lại giúp tôi nhé.",
        isUser: false,
        actions: data?.suggestedActions || [],
      }]);
    } catch (e) {
      console.error("Gemini API Error:", e);
      setMessages(prev => [...prev, { 
        text: "Xin lỗi, tôi đang bận một chút, bạn cần hỗ trợ gì về phòng hay ăn uống không?", 
        isUser: false 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
      {/* Chat History Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50/30"
      >
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 items-end ${msg.isUser ? "flex-row-reverse" : "flex-row"}`}>
            <div className="flex-shrink-0">
              <img 
                src={msg.isUser ? userAvatar : aiAvatar} 
                alt={msg.isUser ? "User" : "AI"}
                className="w-10 h-10 rounded-full shadow-sm bg-white object-cover border border-slate-100"
              />
              {msg.isUser && (
                <p className="text-[10px] text-slate-400 text-center mt-1">
                  {user?.name || "Bạn"}
                </p>
              )}
            </div>
            <div className={`max-w-[85%] md:max-w-[70%] p-5 rounded-3xl text-sm leading-relaxed ${
              msg.isUser 
                ? "bg-sky-600 text-white rounded-tr-none shadow-lg shadow-sky-600/20" 
                : "bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none"
            }`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
              
              {!msg.isUser && msg.actions && msg.actions.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {msg.actions.map(action => (
                    <button
                      key={action}
                      onClick={() => { setInput(action); }}
                      className="text-[10px] font-bold bg-sky-50 text-sky-600 px-4 py-2 rounded-full hover:bg-sky-100 transition-colors border border-sky-100"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <img src={aiAvatar} alt="AI" className="w-10 h-10 rounded-full shadow-sm bg-white border border-slate-100" />
            </div>
            <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Input Bar */}
      <div className="p-6 bg-white border-t border-slate-100">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            className="flex-1 bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-sm outline-none focus:border-sky-500 focus:bg-white transition-all"
            placeholder="Hỏi trợ lý AI về phòng, dịch vụ hoặc giá cả..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || loading}
            className="bg-sky-600 text-white px-10 rounded-2xl font-black text-sm hover:bg-sky-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-sky-600/20"
          >
            GỬI
          </button>
        </div>
      </div>
    </div>
  );
}
