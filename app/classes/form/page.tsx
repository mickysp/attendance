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
import CheckInFormConfig from "@/components/check-in/CheckInFormConfig";
import { useConfirm } from "@/context/ConfirmContext";

export default function QRPage() {
  const searchParams = useSearchParams();

  const classId = searchParams.get("classId");
  const className = searchParams.get("className");
  const classCode = searchParams.get("classCode");
  const teacher = searchParams.get("teacher");

  const [loading, setLoading] = useState(true);
  const [openQR, setOpenQR] = useState(false);
  const [tab, setTab] = useState<"qr" | "form">("qr");
  const [saving, setSaving] = useState(false);

  const { showConfirm } = useConfirm();
  const { showAlert } = useAlert();
  const router = useRouter();

  const [formConfig, setFormConfig] = useState({
    name: true,
    studentId: true,
    section: false,
    email: false,
    photo: false,
    location: false,
  });

  const link =
    typeof window !== "undefined" && classId
      ? `${window.location.origin}/check-in?classId=${classId}`
      : "";

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchConfig = async () => {
      if (!classId) return;

      try {
        const res = await fetch(`/api/check-in?classId=${classId}`);
        const data = await res.json();

        if (data.success && data.config) {
          setFormConfig(data.config);
        }
      } catch {
        showAlert("โหลด config ไม่สำเร็จ", "error");
      }
    };

    fetchConfig();
  }, [classId]);

  const handleCopy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    showAlert("คัดลอกลิงก์แล้ว", "success");
  };

  const handleSave = async () => {
    if (!classId) return;

    try {
      setSaving(true);

      const res = await fetch("/api/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId,
          config: formConfig,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        showAlert(data.message || "เกิดข้อผิดพลาด", "error");
        return;
      }

      showAlert("บันทึกการตั้งค่าเรียบร้อย", "success");
    } catch {
      showAlert("เกิดข้อผิดพลาด", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadQR = () => {
    const svg = document.querySelector(".qr-code svg");
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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

      const link = document.createElement("a");
      link.download = `เช็คชื่อวิชา ${className || "ไม่ทราบชื่อวิชา"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    img.src = url;
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

        {!loading && (
          <div className="flex flex-col h-[85vh] bg-white rounded-2xl shadow-sm px-6 pt-6">
            <div className="mb-6 flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 transition cursor-pointer"
              >
                <ArrowLeftIcon className="w-4 h-4 text-gray-700" />
              </button>

              <h1 className="text-2xl font-semibold text-gray-800">
                ข้อมูลแบบฟอร์มเช็คชื่อ
              </h1>

              <p className="text-sm text-gray-500">
                สำหรับให้นักศึกษาสแกนเข้าเรียน
              </p>
            </div>

            {!classId ? (
              <p className="text-gray-500 text-sm">ไม่พบรายวิชา</p>
            ) : (
              <>
                <div className="bg-blue-50 border border-gray-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-500 mb-1">วิชา</p>
                  <h2 className="text-base font-semibold text-gray-800">
                    {className || "-"}
                  </h2>

                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                    <span>รหัสวิชา: {classCode || "-"}</span>
                    <span>อาจารย์ประจำวิชา: {teacher || "-"}</span>
                  </div>
                </div>

                <div className="flex gap-6 mb-6 mt-2 border-b border-gray-200">
                  <button
                    onClick={() => setTab("qr")}
                    className={`relative pb-3 text-sm font-medium transition-all duration-200 cursor-pointer ${
                      tab === "qr"
                        ? "text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    ลิงก์เช็คชื่อ
                    <span
                      className={`absolute left-0 -bottom-[1px] h-[2px] rounded-full bg-blue-500 transition-all duration-300 ${
                        tab === "qr" ? "w-full opacity-100" : "w-0 opacity-0"
                      }`}
                    />
                  </button>

                  <button
                    onClick={() => setTab("form")}
                    className={`relative pb-3 text-sm font-medium transition-all duration-200 cursor-pointer ${
                      tab === "form"
                        ? "text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    ตัวอย่างแบบฟอร์มเช็คชื่อ
                    <span
                      className={`absolute left-0 -bottom-[1px] h-[2px] rounded-full bg-blue-500 transition-all duration-300 ${
                        tab === "form" ? "w-full opacity-100" : "w-0 opacity-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex flex-col h-full">
                  {tab === "qr" && (
                    <>
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
                            onClick={handleCopy}
                            className="px-3 border rounded-md hover:bg-gray-100 cursor-pointer"
                          >
                            <ClipboardIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col items-center justify-center gap-3">
                        {" "}
                        <div className="qr-code relative p-5 border border-gray-300 rounded-2xl bg-white">
                          {" "}
                          <QRCode value={link || "loading"} size={300} />
                          <button
                            onClick={() => setOpenQR(true)}
                            className="absolute top-2 right-2 bg-white border border-gray-300 rounded-md p-1 hover:bg-gray-100 cursor-pointer"
                          >
                            <ArrowsPointingOutIcon className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-500 text-center">
                          QR Code เช็คชื่อ
                        </p>
                      </div>
                    </>
                  )}

                  {tab === "form" && (
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                      <CheckInFormConfig
                        value={formConfig}
                        onChange={setFormConfig}
                      />

                      <div className="p-5 pt-0 flex justify-end">
                        <button
                          disabled={saving}
                          onClick={() =>
                            showConfirm(
                              "คุณต้องการบันทึกการตั้งค่าแบบฟอร์มใช่หรือไม่",
                              handleSave,
                            )
                          }
                          className={`px-7 py-2.5 rounded-md text-sm text-white cursor-pointer ${
                            saving
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-[var(--primary)] hover:bg-blue-700"
                          }`}
                        >
                          {saving ? "กำลังบันทึก..." : "บันทึก"}
                        </button>
                      </div>
                    </div>
                  )}
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
                onClick={() => setOpenQR(false)}
                className="p-1 rounded-md hover:bg-gray-100 transition cursor-pointer"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-8 flex flex-col items-center gap-6">
              <div className="border border-gray-300 p-4 rounded-xl">
                <QRCode value={link || "loading"} size={480} />
              </div>
              <button
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
