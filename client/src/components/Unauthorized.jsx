import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 text-slate-700 p-4">
      <h2 className="text-5xl font-black mb-4 text-rose-600">403</h2>
      <p className="text-xl font-bold mb-6 text-center">Bạn không có quyền truy cập trang này.</p>
      <p className="text-sm text-center max-w-md">
        Vui lòng liên hệ quản trị viên nếu bạn tin rằng đây là một lỗi.
      </p>
      <button
        onClick={() => navigate('/')}
        className="mt-8 px-6 py-3 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 transition"
      >
        Quay về trang chủ
      </button>
    </div>
  );
}