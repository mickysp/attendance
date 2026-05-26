"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronDownIcon,
  EyeIcon,
  ClockIcon,
  MapPinIcon,
  PhotoIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

type StudentAttendance = {
  studentId: string;
  name: string;
  email: string;
  attendanceDate?: string | null;
  section: string;
  major: string;
  status: string;
  score: number;
  checkInTime: string | null;
  totalScore: number;
  days: number;
  absentDays: number;
  lateDays: number;
  averageScore: number;
};

type AttendanceLog = {
  date?: string;
  timeText: string;
  status?: string;
  score?: number;
  photo?: string;
  location?: {
    lat: number;
    lng: number;
  };
};

type Props = {
  data: StudentAttendance[];
  classId: string | null;
};

export default function AttendanceTable({ data, classId }: Props) {
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const paginatedData = data.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  const pageSizeRef = useRef<HTMLDivElement>(null);
  const [openPageSize, setOpenPageSize] = useState(false);
  const [selectedStudent, setSelectedStudent] =
    useState<StudentAttendance | null>(null);

  const hasData = data.length > 0;
  const hasRowsOnPage = paginatedData.length > 0;

  const shouldScroll = paginatedData.length > 8;

  const [openModal, setOpenModal] = useState(false);

  const formatThaiDate = (date?: string | null) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatLogDate = (date?: string) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        pageSizeRef.current &&
        !pageSizeRef.current.contains(e.target as Node)
      ) {
        setOpenPageSize(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const statusMap = {
    มาเรียน: {
      text: "เข้าเรียน",
      wrapper:
        "border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50",
      icon: "bg-emerald-100",
      textColor: "text-emerald-700",
      dot: "bg-emerald-500",
    },

    มาสาย: {
      text: "มาสาย",
      wrapper: "border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50",
      icon: "bg-amber-100",
      textColor: "text-amber-700",
      dot: "bg-amber-500",
    },

    ลา: {
      text: "ลา",
      wrapper: "border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50",
      icon: "bg-sky-100",
      textColor: "text-sky-700",
      dot: "bg-sky-500",
    },

    ขาด: {
      text: "ขาดเรียน",
      wrapper: "border-red-200 bg-gradient-to-r from-red-50 to-rose-50",
      icon: "bg-red-100",
      textColor: "text-red-700",
      dot: "bg-red-500",
    },

    ยังไม่เช็คชื่อ: {
      text: "ยังไม่เช็คชื่อ",
      wrapper: "border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50",
      icon: "bg-gray-200",
      textColor: "text-gray-600",
      dot: "bg-gray-400",
    },
  } as const;

  const getScoreColor = (score: number) => {
    if (score < 50) return "text-red-500";
    if (score < 70) return "text-yellow-600";
    return "text-blue-600";
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="mb-4 flex items-center justify-center w-28 h-28 rounded-full bg-gray-100">
          <img src="/not-exist.png" className="w-28 h-28" />
        </div>
        <p className="text-sm text-gray-400">
          ไม่พบข้อมูลที่ค้นหา กรุณาลองใหม่อีกครั้ง
        </p>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`rounded-xl border border-gray-200 overflow-hidden ${
          paginatedData.length > 8 ? "max-h-[380px]" : ""
        }`}
      >
        <div
          className={`overflow-x-auto ${
            paginatedData.length > 8 ? "overflow-y-auto" : "overflow-y-visible"
          }`}
        >
          <table className="min-w-[1400px] w-full text-base table-fixed">
            <thead className="sticky top-0 z-50 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold w-[150px]">
                  รหัสนักศึกษา
                </th>
                <th className="px-4 py-3 text-left font-semibold w-[156px]">
                  ชื่อ-นามสกุล
                </th>
                <th className="px-4 py-3 text-center font-semibold w-[170px]">
                  วันที่เช็คชื่อ
                </th>
                <th className="px-4 py-3 text-center font-semibold w-[130px]">
                  ขาด
                </th>
                <th className="px-4 py-3 text-center font-semibold w-[130px]">
                  มาสาย
                </th>
                <th className="px-4 py-3 text-center font-semibold w-[150px]">
                  เข้าเรียน
                </th>
                <th className="px-4 py-3 text-center font-semibold w-[150px]">
                  คะแนน
                </th>
                <th className="px-4 py-3 text-left font-semibold w-[130px] sticky top-0 right-[200px] z-[60] bg-gray-50 border-l border-gray-200 shadow-[-6px_0_14px_rgba(0,0,0,0.08)]">
                  สถานะ
                </th>
                <th className="px-4 py-3 text-left font-semibold w-[200px] sticky top-0 right-0 z-[60] bg-gray-50">
                  จัดการ
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.map((s) => {
                const status = s.status as keyof typeof statusMap;

                return (
                  <tr
                    key={s.studentId}
                    className="border-t border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3.5 text-sm">{s.studentId}</td>

                    <td className="px-4 py-3.5 text-sm">{s.name}</td>

                    <td className="px-4 py-3.5 text-sm text-center">
                      <div className="flex items-center justify-center">
                        {s.attendanceDate ? (
                          <span className="mt-0.5 text-sm font-medium text-gray-700">
                            {formatThaiDate(s.attendanceDate)}
                          </span>
                        ) : (
                          <div className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1">
                            <span className="text-xs font-medium text-gray-400">
                              ไม่มีข้อมูล
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-sm text-center">
                      {s.absentDays} ครั้ง
                    </td>

                    <td className="px-4 py-3.5 text-sm text-center">
                      <div className="flex items-center justify-center">
                        {s.lateDays > 0 ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-medium">
                              {s.lateDays} ครั้ง
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1">
                            <span className="text-xs font-medium text-gray-400">
                              ไม่มีข้อมูล
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-sm text-center">
                      {s.checkInTime ?? "-"}
                    </td>

                    <td
                      className={`px-4 py-3.5 text-sm text-center font-medium`}
                    >
                      {s.score}
                    </td>

                    <td className="px-4 py-3.5 text-sm text-left sticky right-[100px] z-10 bg-white border-l border-gray-100">
                      <div className="flex items-left justify-centlefter">
                        {(() => {
                          const currentStatus =
                            statusMap[status] ?? statusMap["ยังไม่เช็คชื่อ"];

                          return (
                            <div
                              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 border ${currentStatus.textColor}
                              ${
                                status === "มาเรียน"
                                  ? "border-emerald-100 bg-emerald-50"
                                  : status === "มาสาย"
                                    ? "border-amber-100 bg-amber-50"
                                    : status === "ลา"
                                      ? "border-sky-100 bg-sky-50"
                                      : status === "ขาด"
                                        ? "border-red-100 bg-red-50"
                                        : "border-gray-200 bg-gray-50"
                              }
                              `}
                            >
                              <div
                                className={`h-2 w-2 rounded-full ${currentStatus.dot}`}
                              />

                              <span className="text-xs font-medium tracking-tight">
                                {currentStatus.text}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center sticky right-0 z-20 bg-white">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          title="ดูรายละเอียด"
                          onClick={async () => {
                            try {
                              setLoadingLogs(true);

                              setLogs([]);

                              if (!classId) {
                                alert("ไม่พบ classId");
                                return;
                              }

                              const res = await fetch(
                                `/api/attendance/logs?classId=${classId}&studentId=${s.studentId}`,
                              );

                              const text = await res.text();

                              console.log(text);

                              const json = text
                                ? JSON.parse(text)
                                : {
                                    success: false,
                                    logs: [],
                                  };

                              if (json.success) {
                                setLogs(json.logs || []);
                              } else {
                                setLogs([]);
                              }

                              setSelectedStudent(s);

                              setOpenModal(true);
                            } catch (error) {
                              console.error(error);

                              setLogs([]);
                            } finally {
                              setLoadingLogs(false);
                            }
                          }}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 p-2 hover:bg-gray-50 transition cursor-pointer"
                        >
                          <EyeIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-xs font-medium text-gray-700">
                            รายละเอียด
                          </span>
                        </button>

                        <button
                          title="แจ้งลา"
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 hover:bg-sky-100 transition cursor-pointer"
                        >
                          <DocumentTextIcon className="w-4 h-4 text-sky-600" />

                          <span className="text-xs font-medium text-sky-700">
                            แจ้งลา
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {data.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span>แสดง</span>

            <div ref={pageSizeRef} className="relative">
              <button
                onClick={() => setOpenPageSize(!openPageSize)}
                className="form-input-card flex items-center justify-between gap-2 px-3 py-1 text-xs min-w-[60px] cursor-pointer"
              >
                {itemsPerPage}
                <ChevronDownIcon className="w-3 h-3 text-gray-400" />
              </button>

              {openPageSize && (
                <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200">
                  {[10, 15, 20].map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setItemsPerPage(size);
                        setPage(1);
                        setOpenPageSize(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 cursor-pointer"
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span>จากทั้งหมด {data.length} รายการ</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-3 py-2 text-[13px] rounded-md border border-gray-200 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
            >
              ก่อนหน้า
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, page - 2), page + 1)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3.5 py-2 rounded-md border text-[13px] ${
                    page === p
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-4 py-2 text-[13px] rounded-md border border-gray-200 hover:bg-gray-100 disabled:opacity-40"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}

      {openModal && selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setOpenModal(false)}
        >
          <div
            className="w-full max-w-3xl bg-white rounded-2xl shadow-sm max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-gray-100 p-6 pb-4">
              <div className="p-2 rounded-lg bg-blue-50">
                <EyeIcon className="w-5 h-5 text-blue-600" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  รายละเอียดการเข้าเรียน
                </h2>

                <p className="text-sm text-gray-400 mt-0.5">
                  {selectedStudent.name}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="grid grid-cols-3 gap-4 text-sm mb-6">
                <div>
                  <p className="text-gray-500">รหัสนักศึกษา</p>

                  <p className="font-medium text-gray-800">
                    {selectedStudent.studentId}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">ชื่อ-นามสกุล</p>

                  <p className="font-medium text-gray-800">
                    {selectedStudent.name}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">อีเมล</p>

                  <p className="font-medium text-gray-800">
                    {selectedStudent.email || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">สาขา</p>

                  <p className="font-medium text-gray-800">
                    {selectedStudent.major}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Section</p>

                  <p className="font-medium text-gray-800">
                    {selectedStudent.section}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">คะแนนรวม</p>

                  <p className="font-semibold text-blue-600">
                    {selectedStudent.totalScore}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 px-3 rounded-full bg-blue-50 border border-blue-100 flex items-center">
                    <span className="text-sm font-semibold text-blue-700">
                      ประวัติการเช็คชื่อ
                    </span>
                  </div>

                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                <div className="space-y-4">
                  {loadingLogs && (
                    <div className="flex items-center justify-center py-10">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />

                        <p className="text-sm text-gray-400">
                          กำลังโหลดข้อมูล...
                        </p>
                      </div>
                    </div>
                  )}

                  {!loadingLogs && logs.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="mb-3 flex items-center justify-center w-16 h-16 rounded-full bg-gray-100">
                        <PhotoIcon className="w-7 h-7 text-gray-400" />
                      </div>

                      <p className="text-sm text-gray-500 font-medium">
                        ไม่มีประวัติการเช็คชื่อ
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        ยังไม่มีข้อมูลการเข้าเรียนของนักศึกษาคนนี้
                      </p>
                    </div>
                  )}

                  {!loadingLogs &&
                    logs.length > 0 &&
                    logs.map((log, index) => {
                      const statusStyle =
                        log.status === "มาเรียน"
                          ? {
                              badge:
                                "bg-emerald-50 text-emerald-700 border-emerald-100",
                              score: "text-emerald-600",
                            }
                          : log.status === "มาสาย"
                            ? {
                                badge:
                                  "bg-amber-50 text-amber-700 border-amber-100",
                                score: "text-amber-600",
                              }
                            : log.status === "ลา"
                              ? {
                                  badge:
                                    "bg-sky-50 text-sky-700 border-sky-100",
                                  score: "text-sky-600",
                                }
                              : {
                                  badge:
                                    "bg-red-50 text-red-700 border-red-100",
                                  score: "text-red-600",
                                };

                      return (
                        <div
                          key={index}
                          className="rounded-2xl border border-gray-200 bg-white p-5 transition"
                        >
                          <div className="flex items-stretch gap-5">
                            <div className="flex flex-1 flex-col justify-between min-h-[96px]">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div
                                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusStyle.badge}`}
                                  >
                                    {log.status}
                                  </div>

                                  {typeof log.score === "number" && (
                                    <span
                                      className={`text-sm font-semibold ${statusStyle.score}`}
                                    >
                                      +{log.score} คะแนน
                                    </span>
                                  )}
                                </div>

                                <div className="mt-4 flex items-start gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                                    <ClockIcon className="h-5 w-5 text-gray-500" />
                                  </div>

                                  <div>
                                    <p className="text-base font-semibold text-gray-800">
                                      {log.timeText}
                                    </p>

                                    <p className="mt-0.5 text-sm text-gray-400">
                                      {formatLogDate(log.date)}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {log.location && (
                                <a
                                  href={`https://maps.google.com/?q=${log.location.lat},${log.location.lng}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-4 inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-100"
                                >
                                  <MapPinIcon className="h-4 w-4 text-gray-500" />
                                  ดูตำแหน่งที่เช็คชื่อ
                                </a>
                              )}
                            </div>

                            <div className="w-24 shrink-0">
                              {log.photo ? (
                                <img
                                  src={log.photo}
                                  alt="attendance"
                                  className="h-full min-h-[96px] w-24 rounded-2xl border border-gray-200 object-cover"
                                />
                              ) : (
                                <div className="flex h-full min-h-[96px] w-24 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50">
                                  <PhotoIcon className="h-6 w-6 text-gray-300" />

                                  <span className="mt-1 text-[11px] text-gray-400">
                                    ไม่มีรูป
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-100 p-6 pt-4">
              <button
                onClick={() => setOpenModal(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-600 text-sm hover:bg-gray-100 cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
