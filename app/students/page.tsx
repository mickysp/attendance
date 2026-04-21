"use client";

import { useEffect, useState, useRef } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import { useRouter } from "next/navigation";
import {
  DocumentArrowUpIcon,
  ChevronDownIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { useAlert } from "@/context/AlertContext";
import StudentFilter from "@/components/students/Select";

type StudentInput = {
  studentId: string;
  fullName: string;
  email?: string;
};

type ClassDoc = {
  _id: string;
  name?: string;
  class_name?: string;
  className?: string;
};

type MajorDoc = {
  _id: string;
  name: string;
};

export default function StudentsPage() {
  const router = useRouter();

  const { showAlert } = useAlert();

  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<StudentInput[]>([]);

  const [openImport, setOpenImport] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
  const [section, setSection] = useState("");

  const [openClass, setOpenClass] = useState(false);
  const [openMajor, setOpenMajor] = useState(false);
  const [openSection, setOpenSection] = useState(false);

  const classRef = useRef<HTMLDivElement>(null);
  const majorRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  const [classes, setClasses] = useState<string[]>([]);
  const [majors, setMajors] = useState<string[]>([]);

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingMajors, setLoadingMajors] = useState(true);

  const [importLoading, setImportLoading] = useState(false);

  const getClassName = (c: ClassDoc): string =>
    c.name || c.class_name || c.className || "";

  const isFormValid = !!file && !!selectedClass && !!selectedMajor && !!section;

  const [filters, setFilters] = useState({
    keyword: "",
    className: "",
    branch: "",
    section: "",
  });

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (classRef.current && !classRef.current.contains(e.target as Node)) {
        setOpenClass(false);
      }
      if (majorRef.current && !majorRef.current.contains(e.target as Node)) {
        setOpenMajor(false);
      }
      if (
        sectionRef.current &&
        !sectionRef.current.contains(e.target as Node)
      ) {
        setOpenSection(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch("/api/classes");
        const data: { success: boolean; data: ClassDoc[] } = await res.json();

        if (data.success) {
          setClasses(data.data.map(getClassName));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingClasses(false);
      }
    };

    const fetchMajors = async () => {
      try {
        const res = await fetch("/api/majors");
        const data: { success: boolean; data: MajorDoc[] } = await res.json();

        if (data.success) {
          setMajors(data.data.map((m) => m.name));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMajors(false);
      }
    };

    fetchClasses();
    fetchMajors();
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
              {data.length > 0 && (
                <div className="mb-4">
                  <StudentFilter
                    data={[]}
                    onChange={(value) => {
                      setFilters(value);
                      console.log("FILTER:", value);
                    }}
                  />
                </div>
              )}

              {data.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <div className="mb-4 flex items-center justify-center w-24 h-24 rounded-full bg-gray-100">
                    <DocumentTextIcon className="w-12 h-12 text-gray-400" />
                  </div>

                  <p className="text-sm text-gray-400 mb-6">
                    ยังไม่มีข้อมูลนักศึกษา
                  </p>

                  <button
                    onClick={() => setOpenImport(true)}
                    className="px-5 py-2.5 rounded-md text-sm bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <DocumentArrowUpIcon className="w-5 h-5" />
                    Import
                  </button>
                </div>
              ) : (
                <div className="w-full">
                  <p className="text-gray-500 text-sm">
                    มีข้อมูลนักศึกษาแล้ว (ใส่ table ตรงนี้)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {openImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 font-noto">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-[var(--card)]">
                <DocumentArrowUpIcon className="w-5 h-5 text-gray-700" />
              </div>

              <h2 className="text-lg font-semibold text-gray-800">
                นำเข้ารายชื่อนักศึกษา
              </h2>
            </div>

            <div className="border border-gray-50 bg-[var(--card)] rounded-xl p-4 space-y-4">
              <div ref={classRef} className="relative">
                <label className="text-sm text-gray-800">วิชา</label>

                <button
                  type="button"
                  onClick={() => setOpenClass(!openClass)}
                  className="form-input-card text-sm flex items-center justify-between w-full"
                >
                  {selectedClass || "เลือกวิชา"}
                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                </button>

                {openClass && (
                  <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                    {loadingClasses ? (
                      <div className="px-4 py-2 text-sm text-gray-400">
                        กำลังโหลดวิชา...
                      </div>
                    ) : classes.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-gray-400">
                        ไม่พบข้อมูลวิชา
                      </div>
                    ) : (
                      classes.map((c) => {
                        const isSelected = selectedClass === c;

                        return (
                          <button
                            key={c}
                            onClick={() => {
                              setSelectedClass(c);
                              setOpenClass(false);
                            }}
                            className={`block w-full px-4 py-2 text-left text-sm cursor-pointer
                            ${
                              isSelected
                                ? "bg-blue-50 text-blue-600 font-medium"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            {c}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <div ref={majorRef} className="relative">
                <label className="text-sm text-gray-800">สาขา</label>

                <button
                  type="button"
                  onClick={() => setOpenMajor(!openMajor)}
                  className="form-input-card text-sm flex items-center justify-between w-full"
                >
                  {selectedMajor || "เลือกสาขา"}
                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                </button>

                {openMajor && (
                  <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                    {loadingMajors ? (
                      <div className="px-4 py-2 text-sm text-gray-400">
                        กำลังโหลดสาขา...
                      </div>
                    ) : majors.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-gray-400">
                        ไม่พบข้อมูลสาขา
                      </div>
                    ) : (
                      majors.map((m) => {
                        const isSelected = selectedMajor === m;

                        return (
                          <button
                            key={m}
                            onClick={() => {
                              setSelectedMajor(m);
                              setOpenMajor(false);
                            }}
                            className={`block w-full px-4 py-2 text-left text-sm cursor-pointer
                            ${
                              isSelected
                                ? "bg-blue-50 text-blue-600 font-medium"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            {m}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <div ref={sectionRef} className="relative">
                <label className="text-sm text-gray-800">Section</label>

                <button
                  type="button"
                  onClick={() => setOpenSection(!openSection)}
                  className="form-input-card text-sm flex items-center justify-between w-full"
                >
                  {section ? `Section ${section}` : "เลือก Section"}
                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                </button>

                {openSection && (
                  <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200">
                    {[1, 2, 3].map((s) => {
                      const isSelected = section === String(s);

                      return (
                        <button
                          key={s}
                          onClick={() => {
                            setSection(String(s));
                            setOpenSection(false);
                          }}
                          className={`block w-full px-4 py-2 text-left text-sm cursor-pointer
                          ${
                            isSelected
                              ? "bg-blue-50 text-blue-600 font-medium"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          Section {s}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-800">ไฟล์ (.xlsx)</label>

                <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition cursor-pointer">
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="upload"
                  />

                  <label htmlFor="upload" className="cursor-pointer">
                    <DocumentArrowUpIcon className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">เลือกไฟล์ Excel</p>

                    {file && (
                      <p className="text-xs text-blue-600 mt-1">{file.name}</p>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setOpenImport(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-600 text-sm hover:bg-gray-100 cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                disabled={!isFormValid || importLoading}
                onClick={async () => {
                  if (!isFormValid) return;

                  try {
                    setImportLoading(true);

                    const formData = new FormData();
                    formData.append("file", file as File);
                    formData.append("class", selectedClass);
                    formData.append("major", selectedMajor);
                    formData.append("section", section);

                    const res = await fetch("/api/students/upload-file", {
                      method: "POST",
                      body: formData,
                    });

                    const result = await res.json();

                    if (!res.ok) {
                      showAlert(result.message || "เกิดข้อผิดพลาด", "error");
                      return;
                    }

                    showAlert(result.message, "success");

                    setOpenImport(false);

                    setTimeout(() => {
                      window.location.reload();
                    }, 500);
                  } catch (error) {
                    showAlert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้", "error");
                  } finally {
                    setImportLoading(false);
                  }
                }}
                className={`px-5 py-2.5 rounded-md text-white text-sm transition
                ${
                  isFormValid && !importLoading
                    ? "bg-[var(--primary)] hover:bg-[var(--primary-hover)] cursor-pointer"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                {importLoading ? "กำลัง import..." : "Import"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
