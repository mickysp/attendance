"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import {
  TrashIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useAlert } from "@/context/AlertContext";
import { useConfirm } from "@/context/ConfirmContext";

type StudentItem = {
  studentId: string;
  fullName: string;
  email: string;
  section: string;
};

type Class = {
  _id: string;
  className: string;
  classCode: string;
};

type Major = {
  _id: string;
  name: string;
};

export default function CreateStudentPage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [loading, setLoading] = useState(false);

  const [classes, setClasses] = useState<Class[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");

  const sectionOptions = ["1", "2", "3"];

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [students, setStudents] = useState<StudentItem[]>([
    { studentId: "", fullName: "", email: "", section: "" },
  ]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classRes, majorRes] = await Promise.all([
          fetch("/api/classes"),
          fetch("/api/majors"),
        ]);

        const classData = await classRes.json();
        const majorData = await majorRes.json();

        if (classData.success) setClasses(classData.data);
        if (majorData.success) setMajors(majorData.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  const handleChange = (
    index: number,
    key: keyof StudentItem,
    value: string,
  ) => {
    const updated = [...students];
    updated[index][key] = value;
    setStudents(updated);
  };

  const handleAddStudent = () => {
    setStudents((prev) => [
      ...prev,
      { studentId: "", fullName: "", email: "", section: "" },
    ]);
  };
  const handleRemoveStudent = (index: number) => {
    const updated = students.filter((_, i) => i !== index);
    setStudents(
      updated.length
        ? updated
        : [{ studentId: "", fullName: "", email: "", section: "" }],
    );
  };

  const isValidStudentId = (id: string) => /^\d{9}-\d$/.test(id);
  const isValidName = (name: string) =>
    /^(นาย|นาง|นางสาว)[^\s]+(\s[^\s]+)+$/.test(name);
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isFormValid =
    selectedClass &&
    selectedMajor &&
    students.every(
      (s) =>
        s.studentId.trim() &&
        s.fullName.trim() &&
        s.section &&
        isValidStudentId(s.studentId) &&
        isValidName(s.fullName),
    );

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const majorName = majors.find((m) => m._id === selectedMajor)?.name || "";

      const validStudents = students.filter(
        (s) => s.studentId.trim() && s.fullName.trim() && s.section,
      );

      if (!validStudents.length) {
        showAlert("กรุณากรอกข้อมูลนักศึกษาให้ครบ", "error");
        return;
      }

      const payload = {
        classId: selectedClass,
        major: majorName,
        section: validStudents[0].section,
        students: validStudents.map((s) => ({
          studentId: s.studentId,
          fullName: s.fullName,
          email: s.email,
        })),
      };

      const res = await fetch("/api/students/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        showAlert(data.message || "เกิดข้อผิดพลาด", "error");
        return;
      }

      showAlert("เพิ่มนักศึกษาสำเร็จ", "success");
      router.push("/students");
    } catch (error) {
      showAlert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้", "error");
    } finally {
      setLoading(false);
    }
  };

  const total = students.length;
  const valid = students.filter(
    (s) => s.studentId && s.fullName && s.section,
  ).length;

  return (
    <div className="flex h-screen overflow-hidden bg-blue-50">
      <Sidebar />

      <div className="flex-1 overflow-y-auto p-6 font-noto relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-300">
            <div className="flex flex-col items-center gap-4">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
              <p className="text-gray-600 text-base text-white">กำลังโหลด...</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-6" ref={dropdownRef}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/students")}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 transition cursor-pointer"
              >
                <ArrowLeftIcon className="w-3 h-3 text-gray-700" />
              </button>

              <h1 className="text-[26px] font-semibold text-gray-800">
                เพิ่มนักศึกษา
              </h1>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100">
              <span className="text-sm text-gray-500">
                จำนวนนักศึกษาที่เพิ่ม
              </span>
              <span className="text-sm font-semibold text-blue-600">
                {students.filter((s) => s.studentId || s.fullName).length}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="relative">
              <label className="text-sm text-gray-800">วิชา</label>
              <button
                type="button"
                onClick={() =>
                  setOpenDropdown(openDropdown === "class" ? null : "class")
                }
                className="form-input-card text-sm flex items-center justify-between w-full"
              >
                {classes.find((c) => c._id === selectedClass)?.className ||
                  "เลือกวิชา"}
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              </button>

              {openDropdown === "class" && (
                <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                  {classes.map((c) => {
                    const isSelected = selectedClass === c._id;
                    return (
                      <button
                        key={c._id}
                        onClick={() => {
                          setSelectedClass(c._id);
                          setOpenDropdown(null);
                        }}
                        className={`block w-full px-4 py-2 text-left text-sm cursor-pointer
                        ${
                          isSelected
                            ? "bg-blue-50 text-blue-600 font-medium"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        {c.className}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="relative">
              <label className="text-sm text-gray-800">สาขา</label>
              <button
                type="button"
                onClick={() =>
                  setOpenDropdown(openDropdown === "major" ? null : "major")
                }
                className="form-input-card text-sm flex items-center justify-between w-full"
              >
                {majors.find((m) => m._id === selectedMajor)?.name ||
                  "เลือกสาขา"}
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              </button>

              {openDropdown === "major" && (
                <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                  {majors.map((m) => {
                    const isSelected = selectedMajor === m._id;
                    return (
                      <button
                        key={m._id}
                        onClick={() => {
                          setSelectedMajor(m._id);
                          setOpenDropdown(null);
                        }}
                        className={`block w-full px-4 py-2 text-left text-sm cursor-pointer
                        ${
                          isSelected
                            ? "bg-blue-50 text-blue-600 font-medium"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        {m.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {students.map((item, index) => (
              <div
                key={index}
                className="border border-gray-50 bg-[var(--card)] rounded-xl p-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-medium text-gray-800">
                    ข้อมูลนักศึกษาที่ {index + 1}
                  </h2>

                  {students.length > 1 && (
                    <button
                      onClick={() => handleRemoveStudent(index)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg cursor-pointer"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-800">
                        รหัสนักศึกษา
                      </label>
                      <input
                        maxLength={11}
                        value={item.studentId}
                        onChange={(e) => {
                          let value = e.target.value;

                          value = value.replace(/\D/g, "");

                          value = value.slice(0, 10);

                          if (value.length > 9) {
                            value = value.slice(0, 9) + "-" + value.slice(9);
                          }

                          handleChange(index, "studentId", value);
                        }}
                        className="form-input-card text-sm"
                        placeholder="เช่น 650123456-7"
                      />
                      {item.studentId && !isValidStudentId(item.studentId) && (
                        <p className="text-xs text-red-500 mt-1">
                          รูปแบบต้องเป็น 123456789-0
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm text-gray-800">
                        ชื่อ-นามสกุล
                      </label>

                      <input
                        value={item.fullName}
                        onChange={(e) =>
                          handleChange(index, "fullName", e.target.value)
                        }
                        className={`form-input-card text-sm ${
                          item.fullName && !isValidName(item.fullName)
                            ? "border-red-500"
                            : ""
                        }`}
                        placeholder="เช่น นายสมชาย ใจดี"
                      />

                      {item.fullName && !isValidName(item.fullName) && (
                        <p className="text-xs text-red-500 mt-1">
                          ต้องขึ้นต้นด้วย นาย / นาง / นางสาว และอยู่ในรูปแบบ
                          เช่น นายสมชาย ใจดี
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-800">อีเมล</label>

                      <input
                        value={item.email}
                        onChange={(e) =>
                          handleChange(index, "email", e.target.value)
                        }
                        className={`form-input-card text-sm ${
                          item.email && !isValidEmail(item.email)
                            ? "border-red-500"
                            : ""
                        }`}
                        placeholder="example@email.com"
                      />

                      {item.email && !isValidEmail(item.email) && (
                        <p className="text-xs text-red-500 mt-1">
                          รูปแบบอีเมลไม่ถูกต้อง เช่น example@email.com
                        </p>
                      )}
                    </div>

                    <div className="relative">
                      <label className="text-sm text-gray-800">Section</label>

                      <button
                        onClick={() =>
                          setOpenDropdown(
                            openDropdown === `section-${index}`
                              ? null
                              : `section-${index}`,
                          )
                        }
                        className="form-input-card text-sm flex items-center justify-between w-full"
                      >
                        {item.section
                          ? `Section ${item.section}`
                          : "เลือก Section"}{" "}
                        <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                      </button>

                      {openDropdown === `section-${index}` && (
                        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                          {sectionOptions.map((s) => {
                            const isSelected = item.section === s;

                            return (
                              <button
                                key={s}
                                onClick={() => {
                                  handleChange(index, "section", s);
                                  setOpenDropdown(null);
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
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-6">
            <button
              onClick={handleAddStudent}
              className="px-4 py-2 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              + เพิ่มนักศึกษา
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => router.push("/students")}
                className="px-6 py-2.5 rounded-md border border-gray-300 text-gray-600 text-sm hover:bg-gray-100 cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                onClick={() =>
                  showConfirm("เพิ่มข้อมูลนักศึกษา?", handleSubmit)
                }
                disabled={loading || !isFormValid}
                className={`px-6 py-2.5 rounded-md text-white text-sm transition
                ${
                  loading || !isFormValid
                    ? "bg-gray-400"
                    : "bg-[var(--primary)] hover:bg-[var(--primary-hover)] cursor-pointer"
                }`}
              >
                {loading ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
