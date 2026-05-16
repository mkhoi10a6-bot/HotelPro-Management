const CHATBOT_BASE = "http://localhost:4000/api";

export async function chatbotRespond(payload) {
  const res = await fetch(`${CHATBOT_BASE}/chatbot/respond`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Chatbot error");
  }
  return data;
}

