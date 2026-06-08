import { API_URL } from "./config";

export async function chatbotRespond(payload) {
  const res = await fetch(`${API_URL}/chatbot/respond`, {
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
