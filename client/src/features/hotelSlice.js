import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../services/api";

export const loadData = createAsyncThunk("hotel/loadData", async () => {
  const [rooms, customers, bookings, invoices] = await Promise.all([
    api.getRooms(),
    api.getCustomers(),
    api.getBookings(),
    api.getInvoices(),
  ]);
  return { rooms, customers, bookings, invoices };
});

const initialState = {
  rooms: [],
  customers: [],
  bookings: [],
  invoices: [],
  activeSection: "dashboard",
  selectedRoom: null,
  selectedCustomer: null,
  loading: false,
  error: null,
  // Authentication state
  user: null,
  token: null,
  isAuthenticated: false,
};

const hotelSlice = createSlice({
  name: "hotel",
  initialState,
  reducers: {
    setActiveSection(state, action) {
      state.activeSection = action.payload;
      state.selectedRoom = null;
      state.selectedCustomer = null;
    },
    setSelectedRoom(state, action) {
      state.selectedRoom = action.payload;
    },
    setSelectedCustomer(state, action) {
      state.selectedCustomer = action.payload;
    },
    setAuth(state, action) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loadData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadData.fulfilled, (state, action) => {
        state.loading = false;
        state.rooms = action.payload.rooms;
        state.customers = action.payload.customers;
        state.bookings = action.payload.bookings;
        state.invoices = action.payload.invoices;
      })
      .addCase(loadData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setActiveSection, setSelectedRoom, setSelectedCustomer, setAuth, logout } = hotelSlice.actions;
export default hotelSlice.reducer;
