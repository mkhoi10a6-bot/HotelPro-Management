import { API_URL } from "./config";

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { "Content-Type": "application/json" };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    headers,
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || response.statusText);
  }
  return response.json();
}

export const api = {
  getRooms: () => request("/rooms"),
  getCustomers: () => request("/customers"),
  getBookings: () => request("/bookings"),
  getInvoices: () => request("/invoices"),
  getUsers: () => request("/users"),
  createUser: (payload) => request(`/users`, { method: "POST", body: JSON.stringify(payload) }),
  create: (collection, payload) => request(`/${collection}`, { method: "POST", body: JSON.stringify(payload) }),
  update: (collection, id, payload) => request(`/${collection}/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (collection, id) => request(`/${collection}/${id}`, { method: "DELETE" }),
};
