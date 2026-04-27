"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CameraIcon,
  MapPinIcon,
  CheckCircleIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useRef } from "react";
import { useConfirm } from "@/context/ConfirmContext";
import { useAlert } from "@/context/AlertContext";

type FormConfig = {
  name: boolean;
  studentId: boolean;
  section: boolean;
  email: boolean;
  photo: boolean;
  location: boolean;
};

type FormData = {
  name?: string;
  studentId?: string;
  section?: string;
  email?: string;
  photo?: string;
  location?: {
    lat: number;
    lng: number;
  };
};

const DEFAULT_CONFIG: FormConfig = {
  name: true,
  studentId: true,
  section: false,
  email: false,
  photo: false,
  location: false,
};

export default function CheckInStudentPage() {
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId");

  const [config, setConfig] = useState<FormConfig | null>(null);
  const [form, setForm] = useState<FormData>({});
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { showConfirm } = useConfirm();
  const { showAlert } = useAlert();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const isFormValid = () => {
    if (!config) return false;

    if (config.name && !form.name) return false;
    if (config.studentId && !form.studentId) return false;
    if (config.section && !form.section) return false;
    if (config.email && !form.email) return false;
    if (config.photo && !form.photo) return false;
    if (config.location && !form.location) return false;

    return true;
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
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
    const fetchConfig = async () => {
      try {
        const res = await fetch(`/api/check-in?classId=${classId}`);
        const data = await res.json();

        if (data.success && data.config) {
          setConfig(data.config);
        } else {
          setConfig(DEFAULT_CONFIG);
        }
      } catch {
        setConfig(DEFAULT_CONFIG);
      } finally {
        setLoading(false);
      }
    };

    if (classId) {
      fetchConfig();
    } else {
      setLoading(false);
    }
  }, [classId]);

  const handlePhoto = (file: File) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const base64 = reader.result as string;

      setPreview(base64);
      setForm((prev) => ({
        ...prev,
        photo: base64,
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showAlert("อุปกรณ์ไม่รองรับการระบุตำแหน่ง", "error");
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        setForm((prev) => ({
          ...prev,
          location: coords,
        }));

        setGettingLocation(false);
        showAlert("ดึงตำแหน่งสำเร็จ", "success");
      },
      () => {
        setGettingLocation(false);
        showAlert(
          "ไม่สามารถดึงตำแหน่งได้ กรุณาอนุญาตการเข้าถึงตำแหน่ง",
          "error",
        );
      },
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      showConfirm("กรุณากรอกข้อมูลให้ครบ", () => {});
      return;
    }

    showConfirm("ยืนยันการเช็คชื่อ?", async () => {
      try {
        setSubmitting(true);

        const cleanedName = form.name
          ?.trim()
          .replace(/^(นาย|นางสาว|นาง)\s*/, "");

        const payload = {
          ...form,
          name: cleanedName,
        };

        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            classId,
            ...payload,
          }),
        });

        const data = await res.json();

        if (!data.success) {
          if (data.message === "คุณเช็คชื่อแล้ว") {
            showAlert("คุณเช็คชื่อไปแล้ว", "error");
          } else {
            showAlert(data.message || "เกิดข้อผิดพลาด", "error");
          }

          setSubmitting(false);
          return;
        }

        setTimeout(() => {
          setSubmitting(false);
          setShowSuccess(true);
        }, 300);
      } catch (error) {
        console.error(error);
        showAlert("เกิดข้อผิดพลาด", "error");
        setSubmitting(false);
      }
    });
  };

  if (!classId) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>ไม่พบวิชา</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-500 border-t-transparent"></div>
          <p className="text-gray-600 text-sm font-noto">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-noto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center max-w-md w-full">
          <CheckCircleIcon className="w-14 h-14 text-green-500 mx-auto mb-3" />

          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            เช็คชื่อสำเร็จ
          </h2>

          <p className="text-sm text-gray-500">
            คุณได้ทำการเช็คชื่อเรียบร้อยแล้ว
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 font-noto">
      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-500 border-t-transparent"></div>
            <p className="text-gray-600 text-sm font-noto">กำลังโหลด...</p>
          </div>
        </div>
      )}

      <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">
          เช็คชื่อเข้าเรียน
        </h1>
        <p className="text-sm text-gray-500 mb-5">กรุณากรอกข้อมูลของคุณ</p>
        <div className="space-y-5">
          {config?.name && (
            <div>
              <label className="text-sm text-gray-700 mb-1 block">
                ชื่อ-นามสกุล
              </label>

              <p className="text-xs text-gray-500 mb-1">
                ไม่ต้องกรอกคำนำหน้า (นาย / นาง / นางสาว)
              </p>

              <input
                placeholder="เช่น สมชาย ใจดี"
                className="form-input-card w-full text-sm"
                onChange={(e) => {
                  const value = e.target.value;

                  const cleaned = value
                    .trim()
                    .replace(/^(นาย|นางสาว|นาง)\s*/, "");

                  setForm((prev) => ({
                    ...prev,
                    name: cleaned,
                  }));
                }}
              />
            </div>
          )}

          {config?.studentId && (
            <div>
              <label className="text-sm text-gray-700 mb-1 block">
                รหัสนักศึกษา
              </label>

              <p className="text-xs text-gray-500 mb-1">
                ตัวอย่าง เช่น 64XXXXXXX-X
              </p>

              <input
                placeholder="กรอกรหัสนักศึกษา"
                className="form-input-card w-full text-sm"
                value={form.studentId || ""}
                onChange={(e) => {
                  let value = e.target.value;

                  value = value.replace(/\D/g, "");

                  value = value.slice(0, 10);

                  if (value.length > 9) {
                    value = value.slice(0, 9) + "-" + value.slice(9);
                  }

                  setForm((prev) => ({
                    ...prev,
                    studentId: value,
                  }));
                }}
                onKeyDown={(e) => {
                  const allowed =
                    /[0-9]/.test(e.key) ||
                    [
                      "Backspace",
                      "Delete",
                      "ArrowLeft",
                      "ArrowRight",
                      "Tab",
                    ].includes(e.key);

                  if (!allowed) {
                    e.preventDefault();
                  }
                }}
              />
            </div>
          )}

          {config?.section && (
            <div ref={sectionRef}>
              <label className="text-sm text-gray-700 mb-1 block">
                Section
              </label>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenSection((prev) => !prev)}
                  className="form-input-card text-sm flex items-center justify-between w-full"
                >
                  {form.section || "เลือก section"}
                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                </button>

                {openSection && (
                  <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                    {[
                      { label: "Section 1", value: "1" },
                      { label: "Section 2", value: "2" },
                      { label: "Section 3", value: "3" },
                    ].map((sec) => {
                      const isSelected = form.section === sec.value;

                      return (
                        <button
                          key={sec.value}
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              section: sec.value,
                            }));
                            setOpenSection(false);
                          }}
                          className={`block w-full px-4 py-2 text-left text-sm cursor-pointer
                          ${
                            isSelected
                              ? "bg-blue-50 text-blue-600"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          {sec.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {config?.email && (
            <div>
              <label className="text-sm text-gray-700 mb-1 block">อีเมล</label>
              <input
                placeholder="กรอกอีเมล"
                className="form-input-card w-full text-sm"
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
              />
            </div>
          )}

          {config?.photo && (
            <div>
              <label className="text-sm text-gray-700 mb-1 block">
                ถ่ายรูปยืนยันตัวตน
              </label>

              {!preview && (
                <div className="relative">
                  <CameraIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />

                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm cursor-pointer bg-white"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handlePhoto(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              )}

              {preview && (
                <div className="mt-2">
                  <label className="block cursor-pointer">
                    <img
                      src={preview}
                      alt="preview"
                      className="w-full max-h-60 object-contain rounded-lg border bg-gray-50 hover:opacity-90 transition"
                    />

                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handlePhoto(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          )}
          {config?.location && (
            <div>
              <label className="text-sm text-gray-700 mb-1 block">
                ตำแหน่งที่ตั้ง
              </label>

              <div
                onClick={handleGetLocation}
                className="relative cursor-pointer"
              >
                {gettingLocation ? (
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin absolute left-3 top-1/2 -translate-y-1/2" />
                ) : form.location ? (
                  <CheckCircleIcon className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                ) : (
                  <MapPinIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                )}

                <input
                  readOnly
                  value={
                    gettingLocation
                      ? "กำลังดึงตำแหน่ง..."
                      : form.location
                        ? `Lat: ${form.location.lat.toFixed(4)}, Lng: ${form.location.lng.toFixed(4)}`
                        : "กดเพื่อดึงตำแหน่งปัจจุบัน"
                  }
                  className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm cursor-pointer bg-white"
                />
              </div>

              <p className="text-xs text-gray-500 mt-1">
                ระบบจะใช้ตำแหน่งของคุณเพื่อตรวจสอบการเข้าเรียน
              </p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!isFormValid() || submitting}
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition ${
              isFormValid()
                ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                : "bg-gray-300 text-gray-500"
            }`}
          >
            เช็คชื่อ
          </button>
        </div>
      </div>
    </div>
  );
}
