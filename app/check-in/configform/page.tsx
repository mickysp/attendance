"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import { Upload } from "lucide-react";
import { useConfirm } from "@/context/ConfirmContext";
import { useAlert } from "@/context/AlertContext";

type FormConfig = {
  prefix: boolean;
  firstname: boolean;
  lastname: boolean;
  studentId: boolean;
  email: boolean;
  section: boolean;
  photo: boolean;
  note: boolean;
  location: boolean;
};

const defaultConfig: FormConfig = {
  prefix: true,
  firstname: true,
  lastname: true,
  studentId: true,
  email: true,
  section: true,
  photo: true,
  note: true,
  location: true,
};

const fieldLabels: Record<keyof FormConfig, string> = {
  prefix: "คำนำหน้า / Prefix",
  firstname: "ชื่อ / First name",
  lastname: "นามสกุล / Last name",
  studentId: "รหัสนักศึกษา / Student ID",
  email: "อีเมล / Email",
  section: "เซคชั่น / Section",
  photo: "รูปภาพ / Photo",
  note: "หมายเหตุ / Note",
  location: "สถานที่ / Location",
};

const fieldPlaceholders: Record<keyof FormConfig, string> = {
  prefix: "นาย / นางสาว",
  firstname: "กรอกชื่อ",
  lastname: "กรอกนามสกุล",
  studentId: "กรอกรหัสนักศึกษา",
  email: "example@email.com",
  section: "เช่น 1",
  photo: "อัปโหลดรูปภาพ",
  note: "กรอกหมายเหตุเพิ่มเติม",
  location: "กรอกสถานที่",
};

export default function CheckInFormPage() {
  const [config, setConfig] = useState<FormConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [initialConfig, setInitialConfig] = useState<FormConfig>(defaultConfig);
  const isDirty = JSON.stringify(config) !== JSON.stringify(initialConfig);
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const toggleField = (key: keyof FormConfig) => {
    setConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderField = (key: keyof FormConfig) => {
    if (key === "note") {
      return (
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <label className="text-base text-gray-800">
              {fieldLabels[key]}
            </label>

            <button
              onClick={() => toggleField(key)}
              className={`w-10 h-5 flex items-center rounded-full px-1 transition cursor-pointer ${
                config[key] ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`h-3.5 w-3.5 bg-white rounded-full shadow-sm transform transition duration-200 ${
                  config[key] ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <textarea
            disabled
            placeholder={fieldPlaceholders[key]}
            rows={3}
            className="w-full border border-gray-200 bg-gray-100 text-gray-400 rounded-lg px-3 py-2 placeholder:text-sm resize-none"
          />
        </div>
      );
    }
    if (key === "photo") {
      return (
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <label className="text-base text-gray-800">
              {fieldLabels[key]}
            </label>

            <button
              onClick={() => toggleField(key)}
              className={`w-10 h-5 flex items-center rounded-full px-1 transition cursor-pointer ${
                config[key] ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`h-3.5 w-3.5 bg-white rounded-full shadow-sm transform transition duration-200 ${
                  config[key] ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="w-full border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 py-10 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-500 flex items-center justify-center rounded-lg mb-3 text-xl">
              <Upload className="w-6 h-6 text-blue-500" />
            </div>

            <p className="text-sm text-gray-600 mb-1">
              เลือกรูปภาพ หรือ ลากและวางรูปภาพที่นี่
            </p>
            <p className="text-xs text-gray-400 mb-4">
              ไฟล์ต้องมีขนาดไม่เกิน 10 MB
            </p>

            <button
              disabled
              className="px-4 py-1.5 text-sm border border-gray-300 rounded-md text-gray-500 bg-white flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              อัปโหลดรูปภาพ
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <label className="text-base text-gray-800">{fieldLabels[key]}</label>

          <button
            onClick={() => toggleField(key)}
            className={`w-10 h-5 flex items-center rounded-full px-1 transition cursor-pointer ${
              config[key] ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <div
              className={`h-3.5 w-3.5 bg-white rounded-full shadow-sm transform transition duration-200 ${
                config[key] ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <input
          type="text"
          disabled
          placeholder={fieldPlaceholders[key]}
          className="w-full border border-gray-200 bg-gray-100 text-gray-400 rounded-lg px-3 py-2 placeholder:text-sm"
        />
      </div>
    );
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/check-in");

        if (!res.ok) throw new Error("โหลดไม่สำเร็จ");

        const data = await res.json();

        if (data.success) {
          setConfig(data.config);
          setInitialConfig(data.config);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchConfig();
  }, []);

  const handleSaveConfig = async () => {
    try {
      setSaving(true);

      const res = await fetch("/api/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ config }),
      });

      const data = await res.json();

      if (!data.success) throw new Error();

      setInitialConfig(config);

      showAlert("บันทึกข้อมูลสำเร็จ", "success");
    } catch (err) {
      showAlert("เกิดข้อผิดพลาดในการบันทึก", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-blue-50">
      <Sidebar />

      <div className="flex-1 overflow-y-auto p-6 font-noto">
        <div className="bg-white rounded-2xl p-8 w-full">
          <h1 className="text-[26px] font-semibold text-gray-800">
            ตั้งค่าแบบฟอร์มเช็คชื่อ
          </h1>

          <p className="text-sm text-gray-500 mb-9">
            เลือกเปิด–ปิดช่องข้อมูลที่ต้องการให้ผู้ใช้งานกรอก
          </p>

          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {renderField("prefix")}
              {renderField("firstname")}
              {renderField("lastname")}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {renderField("studentId")}
              {renderField("section")}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {renderField("email")}
              {renderField("location")}
            </div>

            <div className="grid grid-cols-1">{renderField("note")}</div>

            {renderField("photo")}

            <div className="flex justify-end gap-3 mt-6 text-sm">
              <button
                className="px-6 py-2.5 rounded-md border border-gray-300 text-gray-600 text-sm hover:bg-gray-100 cursor-pointer"
                onClick={() =>
                  showConfirm(
                    "ยกเลิกการแก้ไขข้อมูล",
                    () => setConfig(initialConfig),
                    "edit",
                    "คุณต้องการยกเลิกการแก้ไขข้อมูลใช่หรือไม่",
                  )
                }
              >
                ยกเลิก
              </button>

              <button
                onClick={() =>
                  showConfirm(
                    "บันทึกแก้ไขข้อมูล",
                    handleSaveConfig,
                    "info",
                    "คุณต้องการยืนยันการบันทึกแก้ไขข้อมูลใช่หรือไม่",
                  )
                }
                disabled={saving || !isDirty}
                className={`px-6 py-2.5 rounded-lg text-white ${
                  saving || !isDirty
                    ? "bg-gray-300"
                    : "bg-blue-500 hover:bg-blue-600 cursor-pointer"
                }`}
              >
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
