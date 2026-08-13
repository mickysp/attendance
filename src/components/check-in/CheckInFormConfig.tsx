"use client";

import { useState, useEffect } from "react";
import { MapPinIcon, CameraIcon } from "@heroicons/react/24/outline";
import { useRef } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

type FormConfig = {
  name: boolean;
  studentId: boolean;
  section: boolean;
  email: boolean;
  photo: boolean;
  location: boolean;
};

type Props = {
  value?: FormConfig;
  onChange?: (val: FormConfig) => void;
};

const DEFAULT_CONFIG: FormConfig = {
  name: true,
  studentId: true,
  section: true,
  email: true,
  photo: true,
  location: true,
};

export default function CheckInFormConfig({ value, onChange }: Props) {
  const [config, setConfig] = useState<FormConfig>(value || DEFAULT_CONFIG);
  const [openSection, setOpenSection] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [selectedSection, setSelectedSection] = useState("");

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
    onChange?.(config);
  }, [config]);

  const toggleField = (key: keyof FormConfig) => {
    setConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderField = (
    key: keyof FormConfig,
    label: string,
    placeholder: string,
    type: "input" | "select" = "input",
  ) => (
    <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>

        <button
          onClick={() => toggleField(key)}
          className={`w-10 h-5 flex items-center rounded-full p-1 transition cursor-pointer ${
            config[key] ? "bg-blue-600" : "bg-gray-300"
          }`}
        >
          <div
            className={`w-3.5 h-3.5 bg-white rounded-full shadow transform transition ${
              config[key] ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {config[key] &&
        (type === "select" ? (
          <div ref={sectionRef} className="relative">
            <button
              type="button"
              onClick={() => setOpenSection((prev) => !prev)}
              className="form-input-card text-sm flex items-center justify-between w-full"
            >
              {selectedSection || "เลือก section"}
              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            </button>

            {openSection && (
              <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                {["Section 1", "Section 2", "Section 3"].map((sec) => {
                  const isSelected = selectedSection === sec;

                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        setSelectedSection(sec);
                        setOpenSection(false);
                      }}
                      className={`block w-full px-4 py-2 text-left text-sm cursor-pointer
                ${
                  isSelected ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100"
                }`}
                    >
                      {sec}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <input
            className="form-input-card w-full text-sm"
            placeholder={placeholder}
          />
        ))}
    </div>
  );

  return (
    <div>
      <div className="px-5 pt-5 pb-3 border-b border-gray-100">
        <h2 className="text-base font-semibold text-blue-700">
          ตัวอย่างแบบฟอร์มเช็คชื่อ
        </h2>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {renderField("name", "ชื่อ-นามสกุล", "กรอกชื่อ-นามสกุล")}
          {renderField("studentId", "รหัสนักศึกษา", "กรอกรหัสนักศึกษา")}
          {renderField("section", "Section", "เลือก section", "select")}{" "}
          {renderField("email", "อีเมล", "กรอกอีเมล")}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                ถ่ายรูป
              </label>

              <button
                onClick={() => toggleField("photo")}
                className={`w-10 h-5 flex items-center rounded-full p-1 transition cursor-pointer ${
                  config.photo ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 bg-white rounded-full shadow transform transition ${
                    config.photo ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {config.photo && (
              <div className="border border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-gray-500">
                <CameraIcon className="w-6 h-6 mb-1" />
                <span className="text-xs">อัปโหลดรูปภาพ</span>
              </div>
            )}
          </div>

          <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                ตำแหน่ง (GPS)
              </label>

              <button
                onClick={() => toggleField("location")}
                className={`w-10 h-5 flex items-center rounded-full p-1 transition cursor-pointer ${
                  config.location ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 bg-white rounded-full shadow transform transition ${
                    config.location ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {config.location && (
              <div className="border border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-gray-500">
                <MapPinIcon className="w-6 h-6 mb-1" />
                <span className="text-xs">ตรวจสอบตำแหน่ง</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
