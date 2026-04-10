"use client";

import { Dispatch, SetStateAction, MutableRefObject } from "react";
import {
  ChevronDownIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

type Major = {
  _id: string;
  name: string;
};

type Class = {
  _id: string;
  className: string;
  classCode: string;
};

type StudentInput = {
  studentId: string;
  fullName: string;
  email?: string;
};

type Props = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;

  mode: "file" | "manual";
  setMode: Dispatch<SetStateAction<"file" | "manual">>;

  majors: Major[];
  classes: Class[];

  selectedMajor: string;
  setSelectedMajor: Dispatch<SetStateAction<string>>;

  selectedClass: string;
  setSelectedClass: Dispatch<SetStateAction<string>>;

  students: StudentInput[];
  setStudents: Dispatch<SetStateAction<StudentInput[]>>;

  sectionManual: string;
  setSectionManual: Dispatch<SetStateAction<string>>;

  sectionFile: string;
  setSectionFile: Dispatch<SetStateAction<string>>;

  openMajor: boolean;
  setOpenMajor: Dispatch<SetStateAction<boolean>>;

  openClass: boolean;
  setOpenClass: Dispatch<SetStateAction<boolean>>;

  openSection: boolean;
  setOpenSection: Dispatch<SetStateAction<boolean>>;

  majorRef: MutableRefObject<HTMLDivElement | null>;
  classRef: MutableRefObject<HTMLDivElement | null>;
  sectionRef: MutableRefObject<HTMLDivElement | null>;

  sectionOptions: string[];

  file: File | null;
  setFile: Dispatch<SetStateAction<File | null>>;

  handleChangeStudent: (
    index: number,
    field: keyof StudentInput,
    value: string,
  ) => void;

  handleAddRow: () => void;
  handleRemoveRow: (index: number) => void;

  handleSave: () => void;
  resetForm: () => void;

  isValidStudentId: (id: string) => boolean;
  isValidName: (name: string) => boolean;
};

export default function StudentsDialog({
  open,
  setOpen,
  mode,
  setMode,
  majors,
  classes,
  selectedMajor,
  setSelectedMajor,
  selectedClass,
  setSelectedClass,
  students,
  setStudents,
  sectionManual,
  setSectionManual,
  sectionFile,
  setSectionFile,
  openMajor,
  setOpenMajor,
  openClass,
  setOpenClass,
  openSection,
  setOpenSection,
  majorRef,
  classRef,
  sectionRef,
  sectionOptions,
  file,
  setFile,
  handleChangeStudent,
  handleAddRow,
  handleRemoveRow,
  handleSave,
  resetForm,
  isValidStudentId,
  isValidName,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={() => {
        setOpen(false);
        resetForm();
      }}
    >
      {" "}
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-3xl rounded-2xl p-8 shadow-xl max-h-[70vh] overflow-y-auto"
      >
        {" "}
        <h2 className="text-lg font-semibold mb-4">เพิ่มรายชื่อนักศึกษา</h2>
        <div className="flex gap-2 mb-4 text-sm">
          <button
            onClick={() => {
              setMode("file");
              setSelectedMajor("");
              setSelectedClass("");
              setStudents([{ studentId: "", fullName: "", email: "" }]);
              setSectionFile("");
            }}
            className={`px-4 py-2 rounded-md ${
              mode === "file"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 cursor-pointer"
            }`}
          >
            อัปโหลดรายชื่อ
          </button>

          <button
            onClick={() => {
              setMode("manual");
              setSelectedMajor("");
              setSelectedClass("");
              setStudents([{ studentId: "", fullName: "", email: "" }]);
              setSectionManual("");
              setSectionFile("");
            }}
            className={`px-4 py-2 rounded-md ${
              mode === "manual"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 cursor-pointer"
            }`}
          >
            เพิ่มรายชื่อทีละคน
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div ref={majorRef} className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMajor(true);
              }}
              className="form-input-card text-sm flex items-center justify-between w-full"
            >
              <span className="truncate whitespace-nowrap">
                {majors.find((m) => m._id === selectedMajor)?.name ||
                  "เลือกสาขา"}
              </span>
              <ChevronDownIcon className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
            </button>

            {openMajor && (
              <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-38 overflow-y-auto">
                {majors.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-gray-400">
                    ไม่พบข้อมูลสาขา
                  </div>
                ) : (
                  majors.map((m) => {
                    const isSelected = selectedMajor === m._id;

                    return (
                      <button
                        key={m._id}
                        onClick={() => {
                          setSelectedMajor(m._id);
                          setOpenMajor(false);
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
                  })
                )}
              </div>
            )}
          </div>

          <div ref={classRef} className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenClass(true);
              }}
              className="form-input-card text-sm flex items-center justify-between w-full h-[42px]"
            >
              <span className="truncate whitespace-nowrap">
                {(() => {
                  const selected = classes.find((c) => c._id === selectedClass);
                  return selected
                    ? `${selected.classCode} - ${selected.className}`
                    : "เลือกวิชา";
                })()}
              </span>
              <ChevronDownIcon className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
            </button>

            {openClass && (
              <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-38 overflow-y-auto">
                {classes.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-gray-400">
                    ไม่พบข้อมูลวิชา
                  </div>
                ) : (
                  classes.map((c) => {
                    const isSelected = selectedClass === c._id;

                    return (
                      <button
                        key={c._id}
                        onClick={() => {
                          setSelectedClass(c._id);
                          setOpenClass(false);
                        }}
                        className={`block w-full px-4 py-2 text-left text-sm cursor-pointer
                        ${
                          isSelected
                            ? "bg-blue-50 text-blue-600 font-medium"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{c.classCode}</span>
                          <span className="text-xs text-gray-500">
                            {c.className}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
        {mode === "file" && (
          <div className="flex flex-col gap-3">
            <div ref={sectionRef} className="relative mb-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenSection(true);
                }}
                className="form-input-card text-sm flex items-center justify-between w-full h-[42px]"
              >
                <span>{sectionFile || "เลือก Section"}</span>
                <ChevronDownIcon className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
              </button>

              {openSection && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow max-h-48 overflow-y-auto">
                  {sectionOptions.map((sec) => {
                    const isSelected = sectionFile === sec;

                    return (
                      <button
                        key={sec}
                        onClick={() => {
                          setSectionFile(sec);
                          setOpenSection(false);
                        }}
                        className={`block w-full px-4 py-2 text-left text-sm cursor-pointer
                        ${
                          isSelected
                            ? "bg-blue-50 text-blue-600 font-medium"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        {sec}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <label className="group border border-gray-300 hover:border-blue-400 border-dashed rounded-xl p-6 text-center cursor-pointer text-gray-500 hover:text-blue-400 transition block">
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setFile(f);
                }}
              />

              <div className="flex items-center justify-center gap-2 text-sm">
                <ArrowDownTrayIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition" />{" "}
                <span>อัปโหลดไฟล์ (.csv / .xlsx)</span>
              </div>

              {file && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  {file.name}
                </p>
              )}
            </label>
          </div>
        )}
        {mode === "manual" && (
          <div className="flex flex-col gap-3">
            <div ref={sectionRef} className="relative mb-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenSection(true);
                }}
                className="form-input-card text-sm flex items-center justify-between w-full h-[42px]"
              >
                <span>{sectionManual || "เลือก Section"}</span>
                <ChevronDownIcon className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
              </button>

              {openSection && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow max-h-48 overflow-y-auto">
                  {sectionOptions.map((sec) => {
                    const isSelected = sectionManual === sec;

                    return (
                      <button
                        key={sec}
                        onClick={() => {
                          setSectionManual(sec);
                          setOpenSection(false);
                        }}
                        className={`block w-full px-4 py-2 text-left text-sm flex justify-between cursor-pointer
                ${
                  isSelected
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "hover:bg-gray-100"
                }`}
                      >
                        <span>{sec}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {students.map((s, i) => (
              <div key={i} className="flex flex-col gap-2">
                {students.length > 1 && (
                  <p className="text-sm font-medium text-gray-700">
                    ข้อมูลนักศึกษาคนที่ {i + 1}
                  </p>
                )}

                <div className="flex items-start gap-2">
                  <div className="grid grid-cols-3 gap-3 w-full">
                    <div>
                      <input
                        value={s.studentId}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^\d]/g, "");

                          if (value.length > 9) {
                            value =
                              value.slice(0, 9) + "-" + value.slice(9, 10);
                          }

                          handleChangeStudent(i, "studentId", value);
                        }}
                        className="form-input-card text-sm"
                        placeholder="รหัสนักศึกษา เช่น 64XXXXXXX-X"
                      />

                      {!isValidStudentId(s.studentId) && s.studentId && (
                        <p className="text-xs text-red-500 mt-1">
                          รหัสต้องเป็นตัวเลข 10 หลัก
                        </p>
                      )}
                    </div>

                    <div>
                      <input
                        value={s.fullName}
                        onChange={(e) =>
                          handleChangeStudent(i, "fullName", e.target.value)
                        }
                        className="form-input-card text-sm"
                        placeholder="ชื่อ-นามสกุล (เช่น นายสมชาย ใจดี)"
                      />

                      {!isValidName(s.fullName) && s.fullName && (
                        <p className="text-xs text-red-500 mt-1">
                          กรุณาใส่คำนำหน้า (นาย/นาง/นางสาว)
                        </p>
                      )}
                    </div>

                    <div>
                      <input
                        value={s.email || ""}
                        onChange={(e) =>
                          handleChangeStudent(i, "email", e.target.value)
                        }
                        className="form-input-card text-sm"
                        placeholder="อีเมล (ไม่บังคับ)"
                      />
                    </div>
                  </div>

                  {students.length > 1 && (
                    <button
                      onClick={() => handleRemoveRow(i)}
                      className="p-2 rounded-md hover:bg-red-50 text-red-500 hover:text-red-600 transition cursor-pointer"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={handleAddRow}
              className="text-blue-500 text-sm text-left cursor-pointer"
            >
              + เพิ่มนักศึกษา
            </button>
          </div>
        )}
        <div className="flex justify-end gap-2 mt-6 text-sm">
          <button
            onClick={() => {
              setOpen(false);
              resetForm();
            }}
            className="px-6 py-2.5 bg-gray-100 rounded-md cursor-pointer"
          >
            ยกเลิก
          </button>

          <button
            onClick={handleSave}
            disabled={
              !selectedMajor ||
              !selectedClass ||
              (mode === "file" && (!file || !sectionFile)) ||
              (mode === "manual" &&
                (!sectionManual ||
                  !students.some(
                    (s) =>
                      isValidStudentId(s.studentId) && isValidName(s.fullName),
                  )))
            }
            className="px-6 py-2.5 bg-blue-500 text-white rounded-md disabled:bg-gray-300 cursor-pointer"
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}
