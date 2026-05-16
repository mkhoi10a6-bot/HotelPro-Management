import { useState, useEffect } from "react";

const departments = ["Tiếp tân", "Dọn phòng", "Bảo trì", "Kế toán", "Nhân sự", "Quản lý"];
const positions = ["Giám đốc", "Trưởng phòng", "Nhân viên", "Thực tập sinh"];

export default function EmployeeView() {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("employees");
  const [form, setForm] = useState({
    employee_id: "",
    name: "",
    email: "",
    phone: "",
    position: "Nhân viên",
    department: "Tiếp tân",
    salary: "",
    hire_date: new Date().toISOString().split("T")[0],
    status: "active",
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:4000/api/employees", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setEmployees(data || []);
    } catch (err) {
      console.error("Error loading employees:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) {
      setMessage({ type: "error", text: "Vui lòng điền đầy đủ thông tin" });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:4000/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Thêm nhân viên thành công" });
        setForm({
          employee_id: "",
          name: "",
          email: "",
          phone: "",
          position: "Nhân viên",
          department: "Tiếp tân",
          salary: "",
          hire_date: new Date().toISOString().split("T")[0],
          status: "active",
        });
        setShowForm(false);
        loadEmployees();
      } else {
        setMessage({ type: "error", text: "Lỗi khi lưu" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi kết nối: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xác nhận xóa?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:4000/api/employees/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Xóa thành công" });
        loadEmployees();
      } else {
        setMessage({ type: "error", text: "Lỗi khi xóa" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi kết nối: " + err.message });
    }
  };

  const getStatusBadge = (status) => {
    if (status === "active") return "bg-green-100 text-green-800";
    if (status === "leave") return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getStatusLabel = (status) => {
    if (status === "active") return "Đang làm";
    if (status === "leave") return "Nghỉ phép";
    return "Thôi việc";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Quản lý nhân sự</h1>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("employees")}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === "employees"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Nhân viên ({employees.filter((e) => e.status === "active").length})
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === "stats"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Thống kê
        </button>
      </div>

      {activeTab === "employees" && (
        <>
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-slate-600">Tổng nhân viên: {employees.length}</p>
              <p className="text-sm text-slate-600">Đang làm: {employees.filter((e) => e.status === "active").length}</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition"
            >
              {showForm ? "Hủy" : "+ Thêm nhân viên"}
            </button>
          </div>

          {showForm && (
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold">Thêm nhân viên mới</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Mã nhân viên</label>
                    <input
                      type="text"
                      required
                      value={form.employee_id}
                      onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="NV001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Họ tên</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Email</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Điện thoại</label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Chức vụ</label>
                    <select
                      value={form.position}
                      onChange={(e) => setForm({ ...form, position: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      {positions.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Phòng ban</label>
                    <select
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      {departments.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Lương (₫/tháng)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.salary}
                      onChange={(e) => setForm({ ...form, salary: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Ngày vào làm</label>
                    <input
                      type="date"
                      value={form.hire_date}
                      onChange={(e) => setForm({ ...form, hire_date: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Trạng thái</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="active">Đang làm</option>
                    <option value="leave">Nghỉ phép</option>
                    <option value="inactive">Thôi việc</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition disabled:opacity-60"
                  >
                    {loading ? "Đang lưu..." : "Thêm"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 transition"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="rounded-lg border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Họ tên</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Email</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Chức vụ</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Phòng ban</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Lương</th>
                  <th className="px-6 py-3 text-center font-semibold text-slate-900">Trạng thái</th>
                  <th className="px-6 py-3 text-center font-semibold text-slate-900">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                      Không có nhân viên nào
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium">{emp.name}</td>
                      <td className="px-6 py-4 text-slate-600">{emp.email}</td>
                      <td className="px-6 py-4">{emp.position}</td>
                      <td className="px-6 py-4">{emp.department}</td>
                      <td className="px-6 py-4 font-medium">
                        {emp.salary ? Number(emp.salary).toLocaleString("vi-VN") + " ₫" : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(emp.status)}`}>
                          {getStatusLabel(emp.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "stats" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-6">
            <p className="text-sm text-blue-600 font-medium">Tổng nhân viên</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">{employees.length}</p>
          </div>
          <div className="rounded-lg bg-green-50 border border-green-200 p-6">
            <p className="text-sm text-green-600 font-medium">Đang làm</p>
            <p className="text-3xl font-bold text-green-900 mt-2">
              {employees.filter((e) => e.status === "active").length}
            </p>
          </div>
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-6">
            <p className="text-sm text-yellow-600 font-medium">Nghỉ phép</p>
            <p className="text-3xl font-bold text-yellow-900 mt-2">
              {employees.filter((e) => e.status === "leave").length}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 lg:col-span-2">
            <h3 className="font-semibold mb-4">Nhân viên theo phòng ban</h3>
            <div className="space-y-2">
              {departments.map((dept) => {
                const count = employees.filter((e) => e.department === dept).length;
                return (
                  <div key={dept} className="flex items-center justify-between">
                    <span className="text-slate-700">{dept}</span>
                    <span className="font-medium text-slate-900">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h3 className="font-semibold mb-4">Tổng lương</h3>
            <p className="text-2xl font-bold text-blue-600">
              {employees
                .reduce((sum, e) => sum + (Number(e.salary) || 0), 0)
                .toLocaleString("vi-VN")} ₫
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
