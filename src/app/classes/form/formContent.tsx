"use client";

import { useSearchParams, useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import {
  ClipboardIcon,
  ArrowLeftIcon,
  ArrowsPointingOutIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useAlert } from "@/context/AlertContext";
import { useEffect, useState } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";

type Teacher = {
  _id: string;
  name: string;
};

type Branch = {
  _id: string;
  name: string;
};

type ClassCode = {
  code: string;
  section: number;
  branches: Branch[];
};

type ClassInfo = {
  _id: string;
  className: string;
  classCodes: ClassCode[];
  description?: string;
  teacher?: Teacher;
  isOpen?: boolean;
};

export default function QRPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const classId = searchParams.get("classId");

  const { showAlert } = useAlert();

  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);

  const [loading, setLoading] = useState(true);
  const [openQR, setOpenQR] = useState(false);
  const [saving, setSaving] = useState(false);

  const [schedule, setSchedule] = useState<{
    date: Date;
    startTime: string;
    endTime: string;
    lateAfter: number;
    allowCheckIn: boolean;
    isOpen: boolean;
  }>({
    date: new Date(),
    startTime: "",
    endTime: "",
    lateAfter: 15,
    allowCheckIn: true,
    isOpen: true,
  });

  const link =
    typeof window !== "undefined" && classId
      ? `${window.location.origin}/check-in?classId=${classId}`
      : "";

  useEffect(() => {
    const fetchClass = async () => {
      if (!classId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const res = await fetch(`/api/classes/${classId}`);

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "โหลดข้อมูลวิชาไม่สำเร็จ");
        }

        const rawClass = data.data;

        const teacher: Teacher | undefined =
          rawClass.teacher &&
          typeof rawClass.teacher === "object" &&
          rawClass.teacher._id
            ? {
                _id: String(rawClass.teacher._id),
                name:
                  typeof rawClass.teacher.name === "string"
                    ? rawClass.teacher.name
                    : "",
              }
            : undefined;

        const classCodes: ClassCode[] = Array.isArray(rawClass.classCodes)
          ? rawClass.classCodes.map(
              (classCode: {
                code?: unknown;
                section?: unknown;
                branches?: Array<{
                  _id?: unknown;
                  name?: unknown;
                }>;
              }) => ({
                code:
                  typeof classCode.code === "string" ? classCode.code : "",

                section:
                  typeof classCode.section === "number"
                    ? classCode.section
                    : Number(classCode.section) || 1,

                branches: Array.isArray(classCode.branches)
                  ? classCode.branches.map((branch) => ({
                      _id: branch?._id ? String(branch._id) : "",
                      name:
                        typeof branch?.name === "string"
                          ? branch.name
                          : "",
                    }))
                  : [],
              }),
            )
          : [];

        setClassInfo({
          _id: rawClass._id ? String(rawClass._id) : classId,
          className:
            typeof rawClass.className === "string"
              ? rawClass.className
              : "",
          classCodes,
          description:
            typeof rawClass.description === "string"
              ? rawClass.description
              : "",
          teacher,
          isOpen:
            typeof rawClass.isOpen === "boolean"
              ? rawClass.isOpen
              : undefined,
        });
      } catch (error) {
        showAlert(
          error instanceof Error
            ? error.message
            : "โหลดข้อมูลวิชาไม่สำเร็จ",
          "error",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchClass();
  }, [classId, showAlert]);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!classId) {
        return;
      }

      try {
        const res = await fetch(`/api/schedule?classId=${classId}`);

        const data = await res.json();

        if (!res.ok || !data.success) {
          return;
        }

        if (Array.isArray(data.data) && data.data.length > 0) {
          const latest = data.data[data.data.length - 1];

          setSchedule({
            date: latest.date
              ? new Date(latest.date)
              : new Date(),

            startTime:
              typeof latest.startTime === "string"
                ? latest.startTime
                : "",

            endTime:
              typeof latest.endTime === "string"
                ? latest.endTime
                : latest.startTime || "",

            lateAfter:
              typeof latest.lateAfter === "number"
                ? latest.lateAfter
                : 15,

            allowCheckIn:
              typeof latest.allowCheckIn === "boolean"
                ? latest.allowCheckIn
                : true,

            isOpen:
              typeof latest.isOpen === "boolean"
                ? latest.isOpen
                : true,
          });
        }
      } catch (error) {
        console.error("FETCH SCHEDULE ERROR:", error);
      }
    };

    fetchSchedule();
  }, [classId]);

  const handleSaveSchedule = async () => {
    if (!classId) {
      showAlert("ไม่พบรายวิชา", "error");
      return;
    }

    if (!schedule.date) {
      showAlert("กรุณาเลือกวันที่", "error");
      return;
    }

    if (!schedule.startTime) {
      showAlert("กรุณาเลือกเวลาเริ่มเรียน", "error");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId,
          className: classInfo?.className || "",
          date: schedule.date.toISOString().split("T")[0],
          startTime: schedule.startTime,
          endTime:
            schedule.endTime || schedule.startTime,
          lateAfter: schedule.lateAfter,
          allowCheckIn: schedule.allowCheckIn,
          isOpen: schedule.isOpen,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showAlert(
          data.message || "บันทึกเวลาไม่สำเร็จ",
          "error",
        );
        return;
      }

      showAlert("บันทึกเวลาเรียบร้อย", "success");
    } catch (error) {
      console.error("SAVE SCHEDULE ERROR:", error);

      showAlert("เกิดข้อผิดพลาดในการบันทึกเวลา", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!link) {
      showAlert("ไม่พบลิงก์เช็คชื่อ", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(link);

      showAlert("คัดลอกลิงก์แล้ว", "success");
    } catch (error) {
      console.error("COPY LINK ERROR:", error);

      showAlert("ไม่สามารถคัดลอกลิงก์ได้", "error");
    }
  };

  const handleDownloadQR = () => {
    const svg = document.querySelector(".qr-code svg");

    if (!svg) {
      showAlert("ไม่พบ QR Code", "error");
      return;
    }

    const serializer = new XMLSerializer();

    const svgString = serializer.serializeToString(svg);

    const canvas = document.createElement("canvas");

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      showAlert("ไม่สามารถสร้างรูป QR Code ได้", "error");
      return;
    }

    const img = new Image();

    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });

    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const size = 500;
      const padding = 30;

      canvas.width = size;
      canvas.height = size;

      ctx.fillStyle = "#ffffff";

      ctx.fillRect(0, 0, size, size);

      ctx.drawImage(
        img,
        padding,
        padding,
        size - padding * 2,
        size - padding * 2,
      );

      URL.revokeObjectURL(url);

      const downloadLink = document.createElement("a");

      downloadLink.download = `เช็คชื่อวิชา ${
        classInfo?.className || "ไม่ทราบชื่อวิชา"
      }.png`;

      downloadLink.href = canvas.toDataURL("image/png");

      downloadLink.click();
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);

      showAlert("ไม่สามารถสร้าง QR Code ได้", "error");
    };

    img.src = url;
  };


  const getLateTime = () => {
    if (!schedule.startTime) {
      return "";
    }

    const [hours, minutes] = schedule.startTime
      .split(":")
      .map(Number);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      return "";
    }

    const date = new Date();

    date.setHours(hours);

    date.setMinutes(
      minutes + schedule.lateAfter,
    );

    return date.toTimeString().slice(0, 5);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-blue-50">
      <Sidebar />

      <div className="flex-1 overflow-y-auto p-6 font-noto relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-500 border-t-transparent" />

              <p className="text-gray-600 text-sm">
                กำลังโหลด...
              </p>
            </div>
          </div>
        )}

        {!loading && (
          <div className="flex flex-col bg-white rounded-2xl px-6 pt-6 pb-8">
            <div className="mb-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 transition cursor-pointer"
              >
                <ArrowLeftIcon className="w-3 h-3 text-gray-700" />
              </button>

              <div>
                <h1 className="text-[26px] font-semibold text-gray-800">
                  ข้อมูลแบบฟอร์มเช็คชื่อ
                </h1>

                <p className="text-sm text-gray-500">
                  สำหรับให้นักศึกษาสแกนเข้าเรียน
                </p>
              </div>
            </div>

            {!classId ? (
              <p className="text-gray-500 text-sm">
                ไม่พบรายวิชา
              </p>
            ) : !classInfo ? (
              <p className="text-gray-500 text-sm">
                ไม่พบข้อมูลรายวิชา
              </p>
            ) : (
              <>
                <div className="bg-blue-50 border border-gray-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-500 mb-1">
                    วิชา
                  </p>

                  <h2 className="text-base font-semibold text-gray-800">
                    {classInfo.className || "-"}
                  </h2>

                  <div className="flex flex-col gap-3 mt-3 text-sm text-gray-600">
                    <div>
                      <span className="text-gray-500">
                        อาจารย์ประจำวิชา:
                      </span>{" "}
                      <span className="font-medium text-gray-700">
                        {classInfo.teacher?.name || "-"}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500">
                        รหัสวิชา / Section:
                      </span>

                      {classInfo.classCodes.length === 0 ? (
                        <span className="ml-2">
                          -
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {classInfo.classCodes.map(
                            (classCode, index) => (
                              <div
                                key={`${classCode.code}-${classCode.section}-${index}`}
                                className="bg-white border border-blue-100 rounded-lg px-3 py-2"
                              >
                                <div className="font-medium text-gray-700">
                                  {classCode.code || "-"}
                                  {" / "}
                                  Section{" "}
                                  {classCode.section}
                                </div>

                                {classCode.branches.length >
                                  0 && (
                                  <div className="mt-1 text-xs text-gray-500">
                                    สาขา:{" "}
                                    {classCode.branches
                                      .map(
                                        (branch) =>
                                          branch.name,
                                      )
                                      .filter(Boolean)
                                      .join(", ") ||
                                      "-"}
                                  </div>
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-5 mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm text-gray-800">
                      ตั้งเวลาเช็คชื่อ
                    </h3>
                  </div>

                  <div className="flex items-end gap-4 flex-wrap">
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-500 mb-1">
                        วันที่
                      </label>

                      <DatePicker
                        selected={schedule.date}
                        onChange={(date: Date | null) =>
                          setSchedule((prev) => ({
                            ...prev,
                            date:
                              date || new Date(),
                          }))
                        }
                        dateFormat="dd/MM/yyyy"
                        className="w-full h-[46px] rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-700 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                        calendarClassName="rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
                        popperClassName="z-50"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs text-gray-500 mb-1">
                        เวลาเริ่มเรียน
                      </label>

                      <input
                        type="time"
                        value={schedule.startTime}
                        onChange={(e) =>
                          setSchedule((prev) => ({
                            ...prev,
                            startTime:
                              e.target.value,
                          }))
                        }
                        className="border border-gray-200 rounded-lg px-3 py-2 w-[250px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs text-gray-500 mb-1">
                        เวลาเลิกเรียน
                      </label>

                      <input
                        type="time"
                        value={schedule.endTime}
                        onChange={(e) =>
                          setSchedule((prev) => ({
                            ...prev,
                            endTime:
                              e.target.value,
                          }))
                        }
                        className="border border-gray-200 rounded-lg px-3 py-2 w-[250px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs text-gray-500 mb-1">
                        มาสายได้ภายใน
                      </label>

                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={120}
                          value={schedule.lateAfter}
                          onChange={(e) =>
                            setSchedule((prev) => ({
                              ...prev,
                              lateAfter: Math.max(
                                0,
                                Math.min(
                                  120,
                                  Number(
                                    e.target.value,
                                  ),
                                ),
                              ),
                            }))
                          }
                          className="border border-gray-200 rounded-lg px-3 py-2 pr-10 w-[250px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />

                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                          นาที
                        </span>
                      </div>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={handleSaveSchedule}
                        className="px-6 py-2.5 bg-blue-500 text-white rounded-lg text-sm shadow hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {saving
                          ? "กำลังบันทึก..."
                          : "บันทึก"}
                      </button>
                    </div>
                  </div>

                  {schedule.startTime && (
                    <div className="mt-4 text-xs text-gray-500">
                      เริ่ม:{" "}
                      <b>
                        {schedule.startTime}
                      </b>{" "}
                      | มาสายถึง:{" "}
                      <b className="text-yellow-600">
                        {getLateTime()}
                      </b>
                    </div>
                  )}
                </div>

                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <label className="text-sm text-gray-700">
                      ลิงก์เช็คชื่อ
                    </label>

                    <div className="flex gap-2 mt-1">
                      <input
                        value={link}
                        readOnly
                        className="form-input-card flex-1 text-sm"
                      />

                      <button
                        type="button"
                        onClick={handleCopy}
                        className="px-3 border rounded-md hover:bg-gray-100 cursor-pointer"
                      >
                        <ClipboardIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center gap-3">
                    <div className="qr-code relative p-5 border border-gray-300 rounded-2xl bg-white">
                      <QRCode
                        value={link || "loading"}
                        size={350}
                      />

                      <button
                        type="button"
                        aria-label="ขยาย QR Code"
                        onClick={() => setOpenQR(true)}
                        className="absolute top-2 right-2 bg-white border border-gray-300 rounded-md p-1 hover:bg-gray-100 cursor-pointer"
                      >
                        <ArrowsPointingOutIcon className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>

                    <p className="text-sm text-gray-500 text-center">
                      QR Code เช็คชื่อ
                    </p>

                    <button
                      type="button"
                      onClick={() => setOpenQR(true)}
                      className="text-sm text-blue-500 hover:underline cursor-pointer"
                    >
                      คลิกเพื่อขยาย QR Code
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {openQR && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 font-noto"
          onClick={() => setOpenQR(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-xl w-full max-w-[800px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-4">
              <h2 className="text-lg font-semibold text-gray-800">
                QR Code เช็คชื่อ
              </h2>

              <button
                type="button"
                onClick={() => setOpenQR(false)}
                className="p-1 rounded-md hover:bg-gray-100 transition cursor-pointer"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-8 flex flex-col items-center gap-6">
              <div className="border border-gray-300 p-4 rounded-xl">
                <QRCode
                  value={link || "loading"}
                  size={480}
                />
              </div>

              <button
                type="button"
                onClick={handleDownloadQR}
                className="px-6 py-2 rounded-xl border border-blue-400 text-blue-400 font-semibold hover:bg-blue-50 transition cursor-pointer"
              >
                บันทึก QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}