"use client";

import { useEffect, useState, useRef } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import {
  DocumentArrowUpIcon,
  ChevronDownIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import StudentFilter from "@/components/students/Select";
import { useRouter } from "next/navigation";
import StudentTable from "@/components/students/Table";
import { useAlert } from "@/context/AlertContext";

type StudentInput = {
  _id: string;
  studentId: string;
  fullName: string;
  email?: string;
  className?: string;
  major?: string;
  section?: string;
  academicYear?: number;
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

type ClassItem = {
  _id: string;
  name: string;
};

export default function StudentsPage() {
  const { showAlert } = useAlert();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);

  const [data, setData] = useState<StudentInput[]>([]);
  const [openImport, setOpenImport] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [selectedMajor, setSelectedMajor] = useState("");
  const [section, setSection] = useState("");

  const [openClass, setOpenClass] = useState(false);
  const [openMajor, setOpenMajor] = useState(false);
  const [openSection, setOpenSection] = useState(false);

  const classRef = useRef<HTMLDivElement>(null);
  const majorRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [majors, setMajors] = useState<string[]>([]);
  const [importLoading, setImportLoading] = useState(false);

  const [hasInitialData, setHasInitialData] = useState(false);

  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const [openYear, setOpenYear] = useState(false);
  const yearRef = useRef<HTMLDivElement>(null);

  const getClassName = (c: ClassDoc): string =>
    c.name || c.class_name || c.className || "";

  const isFormValid =
    !!file && !!selectedClass?._id && !!selectedMajor && !!section;

  const [filters, setFilters] = useState({
    keyword: "",
    className: "",
    branch: "",
    section: "",
  });

  const filteredData = data.filter((s) => {
    const keyword = filters.keyword.toLowerCase();

    const matchKeyword =
      (s.fullName || "").toLowerCase().includes(keyword) ||
      (s.studentId || "").toLowerCase().includes(keyword);

    const matchClass = filters.className
      ? (s.className || "").includes(filters.className)
      : true;

    const matchBranch = filters.branch
      ? (s.major || "").includes(filters.branch)
      : true;

    const matchSection = filters.section ? s.section === filters.section : true;

    const matchYear = true;

    return matchKeyword && matchClass && matchBranch && matchSection;
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (yearRef.current && !yearRef.current.contains(e.target as Node)) {
        setOpenYear(false);
      }

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
          setClasses(
            data.data.map((c) => ({
              _id: c._id,
              name: getClassName(c),
            })),
          );
        }
      } catch (err) {
        //console.error(err);
      } finally {
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
        //console.error(err);
      } finally {
      }
    };

    fetchClasses();
    fetchMajors();
  }, []);

  const fetchStudents = async (year?: number) => {
    try {
      setLoading(true);

      const query = year ? `?year=${year}` : "";

      const url = `/api/students${query}`;

      const res = await fetch(url);

      if (!res.ok) {
        const text = await res.text();
        throw new Error("API error");
      }

      const result = await res.json();

      if (!result.success) return;

      setData(result.students || []);
      setYears(result.years || []);
      setSelectedYear(year ?? result.currentYear);

      setHasInitialData(result.students.length > 0);
    } catch (err) {
      //console.error("FETCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDeleteSuccess = (id: string) => {
    setData((prev) => prev.filter((s) => s._id !== id));
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

        {!loading && (
          <div
            className={`flex flex-col bg-white rounded-2xl 
            ${!hasInitialData ? "min-h-[90vh]" : ""}`}
          >
            <div className="px-6 pt-6 flex items-start justify-between">
              <div>
                <h1 className="text-[26px] font-semibold text-gray-800">
                  Student
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  แสดงข้อมูลนักศึกษาในระบบ
                </p>
              </div>

              {hasInitialData && (
                <div className="flex items-center gap-3 mt-[2px]">
                  <div
                    ref={yearRef}
                    className="relative flex items-center gap-2"
                  >
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      ปีการศึกษา:
                    </span>

                    <button
                      type="button"
                      onClick={() => setOpenYear(!openYear)}
                      className="h-[40px] px-3 border border-gray-200 rounded-md bg-white flex items-center justify-between text-sm hover:bg-gray-50 w-[100px] focus:outline-none focus:ring-1 focus:ring-gray-200 cursor-pointer"
                    >
                      <span
                        className={
                          selectedYear ? "text-gray-800" : "text-gray-400"
                        }
                      >
                        {selectedYear || "เลือกปี"}
                      </span>

                      <ChevronDownIcon className="w-4 h-4 text-gray-400 ml-2" />
                    </button>

                    {openYear && (
                      <div className="absolute right-0 top-[40px] z-20 bg-white border border-gray-200 rounded-md shadow max-h-48 overflow-y-auto w-[100px] cursor-pointer">
                        {years.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-400">
                            ไม่มีข้อมูลปี
                          </div>
                        ) : (
                          years.map((y) => (
                            <button
                              key={y}
                              onClick={() => {
                                setSelectedYear(y);
                                setOpenYear(false);
                                fetchStudents(y);
                              }}
                              className={`block w-full px-3 py-2 text-left text-sm cursor-pointer
                              ${
                                selectedYear === y
                                  ? "bg-blue-50 text-blue-600 font-medium"
                                  : "hover:bg-gray-100"
                              }`}
                            >
                              {y}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setOpenImport(true)}
                    className="h-[40px] px-4 rounded-md border border-gray-300 text-base text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    Import
                  </button>

                  <button
                    onClick={() => router.push("/students/create")}
                    className="h-[40px] px-5 rounded-md text-base bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] cursor-pointer"
                  >
                    + เพิ่มนักศึกษา
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col px-6 pt-6">
              {hasInitialData && (
                <div className="mb-4 w-full">
                  <StudentFilter
                    data={classes.map((c) => ({
                      _id: c._id,
                      className: c.name,
                      branches: majors.map((m) => ({
                        _id: m,
                        name: m,
                      })),
                    }))}
                    onChange={(value) => {
                      setFilters(value);
                    }}
                  />
                </div>
              )}

              {!hasInitialData && (
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <div className="mb-4 flex items-center justify-center w-28 h-28 rounded-full bg-gray-100">
                    <img src="/not-exist.png" className="w-28 h-28" />
                  </div>

                  <p className="text-sm text-gray-400 mb-4">
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
              )}

              {hasInitialData && data.length === 0 && (
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <div className="mb-4 flex items-center justify-center w-28 h-28 rounded-full bg-gray-100">
                    <img src="/not-exist.png" className="w-28 h-28" />
                  </div>

                  <p className="text-sm text-gray-400">
                    ยังไม่มีข้อมูลรายนักศึกษาล่าสุด
                  </p>
                </div>
              )}

              {hasInitialData && data.length > 0 && (
                <>
                  <div className="text-base text-gray-600 font-semibold mt-2 mb-7">
                    Student ทั้งหมด {filteredData.length} รายการ
                  </div>

                  <div className="w-full pb-6.5">
                    <StudentTable
                      data={filteredData}
                      onDeleteSuccess={handleDeleteSuccess}
                      onUpdateSuccess={(updatedStudent) => {
                        setData((prev) =>
                          prev.map((s) =>
                            s._id === updatedStudent._id ? updatedStudent : s,
                          ),
                        );
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {openImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 font-noto">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm p-6">
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
                  {selectedClass?.name || "เลือกวิชา"}
                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                </button>

                {openClass && (
                  <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                    {classes.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-gray-400">
                        ไม่พบข้อมูลวิชา
                      </div>
                    ) : (
                      classes.map((c) => {
                        const isSelected = selectedClass?._id === c._id;

                        return (
                          <button
                            key={c._id}
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
                            {c.name}
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
                    {majors.length === 0 ? (
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
                    <p className="text-xs text-gray-400 mt-1">
                      รองรับไฟล์ .xlsx และชื่อไฟล์ภาษาไทย เท่านั้น
                    </p>

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
                    formData.append("classId", selectedClass?._id || "");
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

                    await fetchStudents(selectedYear || undefined);

                    setOpenImport(false);
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
