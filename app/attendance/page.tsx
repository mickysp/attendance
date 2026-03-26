"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

export default function AttendancePage() {
  const [loading, setLoading] = useState(true);
  const hasData = false;

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <div className="flex-1 overflow-y-auto p-6 font-noto relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-500 border-t-transparent"></div>
              <p className="text-gray-600 text-sm">กำลังโหลด...</p>
            </div>
          </div>
        )}

        {!loading && !hasData && (
          <div className="flex flex-col h-[85vh] bg-white rounded-2xl shadow-sm">
            <div className="px-6 py-4">
              <h1 className="text-2xl font-semibold text-gray-800">
                Attendance
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                แสดงรายชื่อการเข้าเรียนของนักศึกษาในแต่ละวิชา
              </p>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="mb-4 flex items-center justify-center w-24 h-24 rounded-full bg-gray-100">
                <DocumentTextIcon className="w-12 h-12 text-gray-400" />
              </div>

              <p className="text-sm text-gray-400">ยังไม่มีข้อมูลนักศึกษา</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}