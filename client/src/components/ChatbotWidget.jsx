import { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "../services/config";

const BOT_ID = "may-an-nhien-ai-assistant";

const styles = {
  widget: "fixed bottom-4 right-4 z-[200] w-[92%] max-w-[360px]",
  panel: "rounded-2xl border border-slate-200 bg-white shadow-2xl",
  header: "flex items-start justify-between gap-3 rounded-t-2xl bg-slate-900 px-4 py-3 text-white",
  body: "max-h-[60vh] overflow-y-auto p-3",
  footer: "border-t border-slate-200 p-3",
  bubbleBot: "rounded-2xl bg-slate-200 px-3 py-2 text-sm text-slate-900",
  bubbleUser: "rounded-2xl bg-blue-600 px-3 py-2 text-sm text-white",
};

function detectLanguage(text) {
  const t = (text || "").toLowerCase();
  if (!t) return "vi";
  const koSignals = ["안녕", "감사", "예약", "취소"];
  if (koSignals.some((s) => t.includes(s.toLowerCase()))) return "ko";
  const enSignals = ["booking", "room", "available", "check-in", "check out", "wifi", "pool", "gym", "address", "cancel", "menu", "drink", "drinks"];
  if (enSignals.some((s) => t.includes(s))) return "en";
  return "vi";
}

function MessageText({ text }) {
  return <div className="whitespace-pre-line leading-7">{String(text || "")}</div>;
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [hasError, setHasError] = useState(false);

  const [input, setInput] = useState("");
  const [lang, setLang] = useState("vi");
  const [messages, setMessages] = useState(() => {
    const hello = {
      id: crypto.randomUUID(),
      role: "bot",
      text: "Xin chào! Bạn có thể hỏi 'Thực đơn' để xem đồ uống.",
      ts: Date.now(),
    };
    return [hello];
  });

  const listRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => {
      listRef.current?.scrollTo({ top: 999999, behavior: "smooth" });
    }, 0);
  }, [messages, open]);

  async function callBackendRespond(payload) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/chatbot/respond`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Chatbot error");
    return data;
  }

  function pushUserMessage(text) {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text, ts: Date.now() }]);
  }

  function pushBotMessage(text) {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "bot", text, ts: Date.now() }]);
  }

  async function onSend(text) {
    const trimmed = (text || "").trim();
    if (!trimmed || loading) return;

    setHasError(false);
    const detected = detectLanguage(trimmed);
    setLang(detected);

    pushUserMessage(trimmed);
    setInput("");

    setLoading(true);
    setTyping(true);

    try {
      const payload = { botId: BOT_ID, message: trimmed, language: detected, userContext: {} };
      const data = await callBackendRespond(payload);

      const reply = data?.reply || (detected === "en" ? "No reply." : "Không có phản hồi.");
      pushBotMessage(reply);
    } catch (e) {
      setHasError(true);
      pushBotMessage(detected === "en" ? "Sorry—something went wrong." : "Xin lỗi—có lỗi xảy ra.");
    } finally {
      setTyping(false);
      setLoading(false);
    }
  }

  const quickReplies = useMemo(() => {
    const vi = [
      { key: "menu", text: "Thực đơn" },
      { key: "exit", text: "Xin chào" },
    ];
    const en = [
      { key: "menu", text: "Menu" },
      { key: "exit", text: "Hi" },
    ];
    return lang === "en" ? en : vi;
  }, [lang]);

  return (
    <div className={styles.widget}>
      {!open && (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setMessages((prev) => (prev.length <= 1 ? prev : prev.slice(0, 1)));
          }}
          className="flex items-center gap-3 rounded-full bg-slate-900 px-4 py-3 text-white shadow-2xl"
          aria-label="Open chatbot"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10">AI</span>
          <span className="hidden text-sm font-semibold sm:inline">Chat với Mây An Nhiên</span>
        </button>
      )}

      {open && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <div>
              <div className="text-sm font-semibold">Mây An Nhiên Assistant</div>
              <div className="text-xs text-slate-300">Trả lời nhanh • Thực đơn • FAQ</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20"
            >
              Đóng
            </button>
          </div>

          <div ref={listRef} className={styles.body}>
            {messages.map((m) => (
              <div key={m.id} className={`mb-2 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={m.role === "user" ? styles.bubbleUser : styles.bubbleBot}>
                  <MessageText text={m.text} />
                </div>
              </div>
            ))}

            {typing && (
              <div className="mb-2 flex justify-start">
                <div className={styles.bubbleBot}>
                  <span className="text-xs text-slate-600">AI đang soạn tin nhắn...</span>
                </div>
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={1}
                placeholder={lang === "en" ? "Type a message..." : "Nhập câu hỏi..."}
                className="min-h-[40px] max-h-[120px] w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSend(input);
                  }
                }}
              />
              <button
                type="button"
                disabled={loading || !input.trim()}
                onClick={() => onSend(input)}
                className="h-[40px] rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                Gửi
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {hasError && lang !== "en" ? (
                <div className="text-xs text-slate-600">Thử lại giúp mình nhé.</div>
              ) : null}

              {quickReplies.map((q) => (
                <button
                  key={q.key}
                  type="button"
                  onClick={() => onSend(q.text)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  {q.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
