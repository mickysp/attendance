"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import { ChevronDownIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

type ClassItem = {
  _id: string;
  displayName: string;
};

type RawClass = {
  _id: string;
  name?: string;
  className?: string;
  title?: string;
};

type MajorItem = {
  _id: string;
  name: string;
};

export default function StudentsPage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [selectedClass, setSelectedClass] = useState<string>("");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  const [openClass, setOpenClass] = useState(false);
  const classRef = useRef<HTMLDivElement>(null);

  const hasData = false;

  const [majors, setMajors] = useState<MajorItem[]>([]);
  const [selectedMajor, setSelectedMajor] = useState("");
  const [openMajor, setOpenMajor] = useState(false);
  const majorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch("/api/classes");
        const data: { success: boolean; data: RawClass[] } = await res.json();

        if (data.success && Array.isArray(data.data)) {
          const normalized: ClassItem[] = data.data.map((c) => ({
            _id: c._id,
            displayName: c.name || c.className || c.title || "ไม่มีชื่อวิชา",
          }));

          setClasses(normalized);
        }
      } catch (error) {
        console.error("Fetch classes error:", error);
      } finally {
        setLoading(false);
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, []);

  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const res = await fetch("/api/majors");
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          setMajors(data.data);
        }
      } catch (error) {
        console.error("Fetch majors error:", error);
      }
    };

    fetchMajors();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (classRef.current && !classRef.current.contains(e.target as Node)) {
        setOpenClass(false);
      }

      if (majorRef.current && !majorRef.current.contains(e.target as Node)) {
        setOpenMajor(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUpload = async () => {
    if (!file) {
      setMessage("กรุณาเลือกไฟล์");
      return;
    }

    if (!selectedClass) {
      setMessage("กรุณาเลือกวิชา");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("classId", selectedClass);

      const res = await fetch("/api/students/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setMessage(data.message);
        setFile(null);
      } else {
        setMessage(data.message || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error(error);
      setMessage("อัปโหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

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
              <h1 className="text-2xl font-semibold text-gray-800">Students</h1>
              <p className="text-sm text-gray-400 mt-1">
                จัดการรายชื่อนักศึกษาในระบบ
              </p>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="mb-4 flex items-center justify-center w-24 h-24 rounded-full bg-gray-100">
                <DocumentTextIcon className="w-12 h-12 text-gray-400" />
              </div>

              <p className="text-sm text-gray-400">ยังไม่มีข้อมูลนักศึกษา</p>

              <button
                onClick={() => {
                  document
                    .getElementById("import-section")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="mt-3 px-6 py-2 rounded-md bg-blue-500 text-white text-sm hover:bg-blue-600"
              >
                + นำเข้ารายชื่อ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
