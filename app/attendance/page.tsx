"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import SubjectSelect from "@/components/attendance/Select";
import AttendanceTable from "@/components/attendance/Table";

type ClassItem = {
  _id: string;
  className?: string;
  classCode?: string;
  name?: string;
  title?: string;
  isOpen?: boolean;
  hasStudents?: boolean;
};

type Major = {
  _id: string;
  name: string;
};

type StudentAttendance = {
  id: string;
  name: string;
  present: number;
  absent: number;
  percent: number;
  score: number;
};

export default function AttendancePage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentAttendance[]>([]);

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const [majors, setMajors] = useState<{ id: string; name: string }[]>([]);
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);

  const currentYearBE = new Date().getFullYear() + 543;

  const [selectedYear, setSelectedYear] = useState<number>(currentYearBE);

  const [yearOptions, setYearOptions] = useState<number[]>([]);

  const handleClearAll = () => {
    setSelectedClass(null);
    setSelectedMajor(null);
    setStudents([]);
    setMajors([]);
  };

  useEffect(() => {
    const loadYears = async () => {
      try {
        const res = await fetch("/api/students");
        const json = await res.json();

        const years: number[] = json.years || [];

        setYearOptions(years);

        if (years.length > 0 && !years.includes(currentYearBE)) {
          setSelectedYear(years[0]);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadYears();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const res = await fetch("/api/classes");
        if (!res.ok) throw new Error("Failed to fetch classes");

        const json = await res.json();
        setClasses(json?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      setMajors([]);
      setSelectedMajor(null);
      setStudents([]);
      return;
    }

    const loadStudentsAndMajors = async () => {
      try {
        const res = await fetch(
          `/api/students?class=${selectedClass}&year=${selectedYear}`,
        );
        const json = await res.json();

        setStudents(json.students || []);

        setMajors(
          (json.majorsByClass || []).map((m: string) => ({
            id: m,
            name: m,
          })),
        );

        setSelectedMajor(null);
      } catch (err) {
        console.error(err);
      }
    };

    loadStudentsAndMajors();
  }, [selectedClass]);

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
            <div className="px-6 pt-6 shrink-0 flex items-start justify-between">
              <div>
                <h1 className="text-[26px] font-semibold text-gray-800">
                  Attendance
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  รายงานการเข้าเรียนและคะแนนนักศึกษา
                </p>
              </div>

              <div className="w-[140px]">
                <SubjectSelect
                  subjects={yearOptions.map((y) => ({
                    id: String(y),
                    name: `ปี ${y}`,
                  }))}
                  value={String(selectedYear)}
                  onChange={(val) => setSelectedYear(Number(val))}
                  showClear={false}
                />
              </div>
            </div>

            <div className="px-6 mt-4 shrink-0 flex items-center gap-3 flex-wrap">
              <SubjectSelect
                subjects={classes
                  .filter((c) => c.hasStudents)
                  .map((c) => ({
                    id: c.className || c.name || "",
                    name: `${c.className || c.name} (${c.classCode || ""})`,
                  }))}
                value={selectedClass}
                onChange={setSelectedClass}
                showClear={false}
              />

              {selectedClass && majors.length > 0 && (
                <SubjectSelect
                  subjects={majors}
                  value={selectedMajor}
                  onChange={setSelectedMajor}
                  showClear={true}
                  onClearAll={handleClearAll}
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
                <div className="h-full flex items-center justify-center text-gray-400">
                  <p>เลือกครบแล้ว (ยังไม่แสดงตาราง)</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
