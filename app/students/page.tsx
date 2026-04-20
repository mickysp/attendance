"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

type StudentInput = {
  studentId: string;
  fullName: string;
  email?: string;
};

export default function StudentsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<StudentInput[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        setTimeout(() => {
          setData([]);
          setLoading(false);
        }, 300);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchData();
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

        {!loading && (
          <div className="flex flex-col h-[85vh] bg-white rounded-2xl shadow-sm">
            <div className="px-6 pt-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">
                  Student
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  แสดงข้อมูลนักศึกษาในระบบ
                </p>
              </div>

              {data.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push("/students/import")}
                    className="px-4 py-2 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    Import
                  </button>
                  <button
                    onClick={() => router.push("/students/create")}
                    className="px-5 py-2.5 rounded-md text-sm bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] cursor-pointer"
                  >
                    + เพิ่มนักศึกษา
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col items-center justify-center text-center px-6">
              {data.length === 0 ? (
                <>
                  <div className="mb-4 flex items-center justify-center w-24 h-24 rounded-full bg-gray-100">
                    <DocumentTextIcon className="w-12 h-12 text-gray-400" />
                  </div>

                  <p className="text-sm text-gray-400 mb-6">
                    ยังไม่มีข้อมูลนักศึกษา
                  </p>

                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => router.push("/students/import")}
                      className="px-4 py-2 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      Import
                    </button>
                    <button
                      onClick={() => router.push("/students/create")}
                      className="px-5 py-2.5 rounded-md text-sm bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] cursor-pointer"
                    >
                      + เพิ่มนักศึกษา
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-full">
                    <p className="text-gray-500 text-sm">
                      มีข้อมูลนักศึกษาแล้ว (ใส่ table ตรงนี้)
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
