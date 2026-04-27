"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import Table from "@/components/classes/Table";
import Select from "@/components/classes/Select";

type Branch = {
  _id: string;
  name: string;
};

type Teacher = {
  _id: string;
  name: string;
};

type ClassItem = {
  _id: string;
  className: string;
  classCode?: string;
  description?: string;
  teacher?: Teacher;
  branches?: Branch[];
};

type RawBranch = string | Branch;
type RawTeacher = string | Teacher;

type RawClass = {
  _id: string;
  className: string;
  classCode?: string;
  description?: string;
  teacher?: RawTeacher;
  branches?: RawBranch[];
};

const normalizeClass = (c: RawClass): ClassItem => ({
  ...c,
  teacher:
    typeof c.teacher === "string" ? { _id: "", name: c.teacher } : c.teacher,
  branches: (c.branches ?? []).map((b) =>
    typeof b === "string" ? { _id: b, name: b } : b,
  ),
});

export default function ClassesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassItem[]>([]);

  const [filter, setFilter] = useState({
    keyword: "",
    branch: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const res = await fetch("/api/classes");

        const data: { success: boolean; data: RawClass[] } = await res.json();

        if (data.success) {
          const safeData = data.data.map(normalizeClass);
          setClasses(safeData);
        }
      } catch (error) {
        //console.error("Fetch classes error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredClasses = classes.filter((c) => {
    const keyword = filter.keyword.toLowerCase();

    const matchKeyword =
      c.className.toLowerCase().includes(keyword) ||
      (c.classCode ?? "").toLowerCase().includes(keyword);

    const matchBranch = filter.branch
      ? (c.branches ?? []).some((b) => b.name === filter.branch)
      : true;

    return matchKeyword && matchBranch;
  });

  const hasData = classes.length > 0;

  const handleDeleteSuccess = (id: string) => {
    setClasses((prev) => prev.filter((item) => item._id !== id));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-blue-50">
      <Sidebar />

      <div className="flex-1 p-6 font-noto relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-300">
            <div className="flex flex-col items-center gap-4">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
              <p className="text-gray-600 text-base text-white">กำลังโหลด...</p>
            </div>
          </div>
        )}
        
        {!loading && hasData && (
          <div className="flex flex-col bg-white rounded-2xl">
            <div className="px-6 pt-6 flex items-center justify-between">
              <div>
                <h1 className="text-[26px] font-semibold text-gray-800">
                  Classes
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  จัดการข้อมูลรายวิชาที่มีอยู่ในระบบ
                </p>
              </div>

              <button
                onClick={() => router.push("/classes/create")}
                className="h-[40px] px-6 py-2 rounded-md bg-[var(--primary)] text-white text-base hover:bg-[var(--primary-hover)] cursor-pointer"
              >
                + เพิ่มวิชา
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between">
                <Select data={classes} onChange={setFilter} />
              </div>

              <div className="text-base text-gray-600 font-semibold mt-6">
                Classes ทั้งหมด {filteredClasses.length} รายการ
              </div>
            </div>

            <div className="px-6 pb-6">
              <Table
                data={filteredClasses}
                onDeleteSuccess={handleDeleteSuccess}
              />
            </div>
          </div>
        )}

        {!loading && !hasData && (
          <div className="flex flex-col h-[90vh] bg-white rounded-2xl">
            <div className="px-6 py-4">
              <h1 className="text-[26px] font-semibold text-gray-800">
                Classes
              </h1>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="mb-3 flex items-center justify-center w-28 h-28 rounded-full bg-gray-100">
                <img src="/not-exist.png" className="w-28 h-28" />
              </div>

              <p className="text-sm text-gray-400 mb-4">
                ยังไม่มีข้อมูลรายวิชาล่าสุด
              </p>

              <button
                onClick={() => router.push("/classes/create")}
                className="px-5 py-2.5 rounded-md text-sm bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] flex items-center gap-2 shadow-sm cursor-pointer"
              >
                + เพิ่มวิชา
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
