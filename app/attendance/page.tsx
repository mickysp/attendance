"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import SubjectSelect from "@/components/attendance/Select";
import AttendanceTable from "@/components/attendance/Table";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import StudentSummaryCard from "@/components/attendance/Card";

type ClassItem = {
  _id: string;
  className?: string;
  classCode?: string;
  name?: string;
  title?: string;
  isOpen?: boolean;
  hasStudents?: boolean;
  academicYear?: number;
};

type Major = {
  _id: string;
  name: string;
};

type StudentAttendance = {
  studentId: string;
  name: string;
  section: string;
  major: string;
  status: "มาเรียน" | "มาสาย" | "ลา" | "ขาด";
  score: number;
  checkInTime: string | null;
  totalScore: number;
  days: number;
  lateDays: number;
  averageScore: number;
};

export default function AttendancePage() {
  const [loading, setLoading] = useState(true);
  const yearRef = useRef<HTMLDivElement | null>(null);
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [openYear, setOpenYear] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const [majors, setMajors] = useState<{ id: string; name: string }[]>([]);
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [yearOptions, setYearOptions] = useState<number[]>([]);
  const [loadingMajors, setLoadingMajors] = useState(false);

  const [keyword, setKeyword] = useState("");

  const handleClearAll = () => {
    setSelectedClass(null);
    setSelectedMajor(null);
    setStudents([]);
    setMajors([]);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (yearRef.current && !yearRef.current.contains(event.target as Node)) {
        setOpenYear(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const url = selectedYear
          ? `/api/classes?year=${selectedYear}`
          : "/api/classes";

        const res = await fetch(url);

        if (!res.ok) {
          throw new Error("Failed to fetch classes");
        }

        const json = await res.json();

        console.log("classes api:", json);

        const allClasses: ClassItem[] = json?.data || [];

        const years: number[] = json?.years || [];

        setYearOptions(years);

        let activeYear = selectedYear;

        if (
          years.length > 0 &&
          (!selectedYear || !years.includes(selectedYear))
        ) {
          activeYear = years[0];

          setSelectedYear(years[0]);
        }

        setClasses(allClasses);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedYear]);

  useEffect(() => {
    if (!selectedClass) return;

    const load = async () => {
      try {
        setLoadingMajors(true);

        const res = await fetch(
          `/api/attendance/summary?classId=${selectedClass}&year=${selectedYear}`,
        );

        const json = await res.json();

        const list: StudentAttendance[] = json.data ?? [];
        setStudents(list);

        const majorsByClass: string[] = json.majorsByClass ?? [];

        setMajors(
          majorsByClass.map((m) => ({
            id: m,
            name: m,
          })),
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMajors(false);
      }
    };

    load();
  }, [selectedClass, selectedYear]);

  return (
    <div className="flex h-screen overflow-hidden bg-blue-50 font-noto">
      <Sidebar />

      <div className="flex-1 overflow-y-auto p-6 relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-300">
            <div className="flex flex-col items-center gap-4">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
              <p className="text-gray-600 text-base text-white">กำลังโหลด...</p>
            </div>
          </div>
        )}

        {!loading && (
          <div className="flex flex-col h-[90vh] bg-white rounded-2xl min-h-0 overflow-hidden">
            <div className="px-6 pt-6 shrink-0 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-[26px] font-semibold text-gray-800">
                  Attendance
                </h1>

                <p className="text-sm text-gray-400 mt-1">
                  รายงานการเข้าเรียนและคะแนนนักศึกษา
                </p>
              </div>

              <div className="flex justify-end items-center gap-2 w-full sm:w-auto">
                <div ref={yearRef} className="relative flex items-center gap-2">
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    ปีการศึกษา:
                  </span>

                  <button
                    type="button"
                    onClick={() => setOpenYear(!openYear)}
                    className="h-[40px] px-3 border border-gray-200 rounded-md bg-white flex items-center justify-between text-sm hover:bg-gray-50 w-[140px] focus:outline-none focus:ring-1 focus:ring-gray-200 cursor-pointer"
                  >
                    <span
                      className={
                        selectedYear ? "text-gray-800" : "text-gray-400"
                      }
                    >
                      {selectedYear || "เลือกปี"}
                    </span>

                    <ChevronDownIcon className="w-4 h-4 text-blue-500 ml-2" />
                  </button>

                  {openYear && (
                    <div className="absolute right-0 top-[44px] z-20 bg-white border border-gray-200 rounded-md shadow max-h-48 overflow-y-auto w-[140px]">
                      {yearOptions.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-400">
                          ไม่มีข้อมูลปี
                        </div>
                      ) : (
                        yearOptions.map((year) => (
                          <button
                            key={year}
                            onClick={() => {
                              setSelectedYear(year);

                              setSelectedClass(null);
                              setSelectedMajor(null);
                              setStudents([]);
                              setMajors([]);

                              setOpenYear(false);
                            }}
                            className={`block w-full px-3 py-2 text-left text-sm cursor-pointer
                            ${
                              selectedYear === year
                                ? "bg-blue-50 text-blue-600 font-medium"
                                : "hover:bg-gray-100 text-gray-700"
                            }`}
                          >
                            {year}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedClass && selectedMajor && students.length > 0 && (
              <div className="px-6 pt-4">
                <StudentSummaryCard students={students} />
              </div>
            )}
            <div className="px-6 mt-4 flex items-start gap-4">
              <SubjectSelect
                subjects={classes.map((c) => ({
                  id: c._id,
                  name: `${c.className || c.name} (${c.classCode || ""})`,
                }))}
                value={selectedClass}
                onChange={(value) => {
                  setSelectedClass(value);
                  setSelectedMajor(null);
                  setStudents([]);
                  setMajors([]);
                }}
                keyword={keyword}
                onKeywordChange={setKeyword}
                showSearch={true}
                showClear={false}
                placeholder="เลือกวิชา"
              />

              {selectedClass && majors.length > 0 && (
                <SubjectSelect
                  subjects={
                    loadingMajors
                      ? [{ id: "loading", name: "กำลังโหลด..." }]
                      : selectedClass
                        ? majors
                        : []
                  }
                  value={selectedMajor}
                  onChange={setSelectedMajor}
                  showClear={true}
                  onClearAll={handleClearAll}
                  placeholder="เลือกสาขา"
                />
              )}
            </div>

            <div className="flex-1 min-h-0 p-6 overflow-y-auto">
              {!selectedClass ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                  <div className="mb-4 flex items-center justify-center w-28 h-28 rounded-full bg-gray-100">
                    <img src="/not-exist.png" className="w-28 h-28" />
                  </div>

                  <p className="text-base font-medium text-gray-500">
                    ยังไม่ได้เลือกวิชา
                  </p>

                  <p className="text-sm text-gray-400 mt-1">
                    กรุณาเลือกวิชาจากด้านบนเพื่อดูข้อมูลการเข้าเรียน
                  </p>
                </div>
              ) : majors.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                  <div className="mb-4 flex items-center justify-center w-28 h-28 rounded-full bg-gray-100">
                    <img src="/not-exist.png" className="w-28 h-28" />
                  </div>

                  <p className="text-base font-medium text-gray-500">
                    ยังไม่มีข้อมูลนักศึกษา
                  </p>

                  <p className="text-sm text-gray-400 mt-1">
                    วิชานี้ยังไม่มีนักศึกษาลงทะเบียน
                  </p>
                </div>
              ) : !selectedMajor ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <div className="mb-4 w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center">
                    <img src="/not-exist.png" className="w-28 h-28" />
                  </div>

                  <p className="text-base font-medium text-gray-500">
                    ยังไม่ได้เลือกสาขา
                  </p>

                  <p className="text-sm text-gray-400 mt-1">
                    กรุณาเลือกสาขาเพื่อดูข้อมูลนักศึกษา
                  </p>
                </div>
              ) : students.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <div className="mb-4 w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center">
                    <img src="/not-exist.png" className="w-28 h-28" />
                  </div>

                  <p className="text-base font-medium text-gray-500">
                    ไม่มีข้อมูลการเข้าเรียน
                  </p>

                  <p className="text-sm text-gray-400 mt-1">
                    วิชานี้ยังไม่มีการเช็คชื่อในระบบ
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-base text-gray-600 font-semibold mb-6">
                    Student ทั้งหมด {students.length} รายการ
                  </div>

                  <AttendanceTable data={students} classId={selectedClass} />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
