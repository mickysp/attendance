"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import { TrashIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useAlert } from "@/context/AlertContext";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useConfirm } from "@/context/ConfirmContext";

type ClassItem = {
  className: string;
  classCode: string;
  description: string;
  teacher: Teacher | null;
  branches: string[];
};

type Major = {
  _id: string;
  name: string;
};

type Teacher = {
  _id: string;
  name: string;
};

export default function CreateClassPage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { showConfirm } = useConfirm();
  const teacherRefs = useRef<(HTMLDivElement | null)[]>([]);
  const branchRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [branchOptions, setBranchOptions] = useState<string[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  const [openBranchIndex, setOpenBranchIndex] = useState<{
    classIndex: number;
    branchIndex: number;
  } | null>(null);

  const [classes, setClasses] = useState<ClassItem[]>([
    {
      className: "",
      classCode: "",
      teacher: null,
      description: "",
      branches: [""],
    },
  ]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        openIndex !== null &&
        teacherRefs.current[openIndex] &&
        !teacherRefs.current[openIndex]?.contains(e.target as Node)
      ) {
        setOpenIndex(null);
      }

      if (
        openBranchIndex &&
        branchRefs.current[openBranchIndex.classIndex] &&
        !branchRefs.current[openBranchIndex.classIndex]?.contains(
          e.target as Node,
        )
      ) {
        setOpenBranchIndex(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await fetch("/api/teachers");
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          setTeachers(data.data);
        }
      } catch (error) {
      } finally {
        setLoadingTeachers(false);
      }
    };

    fetchTeachers();
  }, []);

  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const res = await fetch("/api/majors");

        const data: { success: boolean; data: Major[] } = await res.json();

        if (data.success && Array.isArray(data.data)) {
          const names = data.data.map((m) => m.name);
          setBranchOptions(names);
        }
      } catch (error) {
      } finally {
        setLoadingBranches(false);
      }
    };

    fetchMajors();
  }, []);

  type StringKeys = "className" | "classCode" | "description";

  const handleChange = (index: number, key: StringKeys, value: string) => {
    const updated = [...classes];
    updated[index][key] = value;
    setClasses(updated);
  };

  const handleAddClass = () => {
    setClasses((prev) => [
      ...prev,
      {
        className: "",
        classCode: "",
        teacher: null,
        description: "",
        branches: [""],
      },
    ]);
  };

  const handleRemoveClass = (index: number) => {
    const updated = classes.filter((_, i) => i !== index);
    setClasses(updated);
  };

  const handleBranchChange = (
    classIndex: number,
    branchIndex: number,
    value: string,
  ) => {
    const updated = [...classes];
    updated[classIndex].branches[branchIndex] = value;
    setClasses(updated);
  };

  const handleAddBranch = (classIndex: number) => {
    const updated = [...classes];
    updated[classIndex].branches.push("");
    setClasses(updated);
  };

  const handleRemoveBranch = (classIndex: number, branchIndex: number) => {
    const updated = [...classes];
    updated[classIndex].branches = updated[classIndex].branches.filter(
      (_, i) => i !== branchIndex,
    );
    setClasses(updated);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const payload = classes
        .filter((item) => item.className.trim() !== "")
        .map((item) => ({
          ...item,
          branches: [...new Set(item.branches.filter((b) => b.trim() !== ""))],
        }));

      if (payload.length === 0) {
        showAlert("กรุณากรอกอย่างน้อย 1 วิชา", "error");
        return;
      }

      if (payload.some((item) => item.branches.length === 0)) {
        showAlert("ทุกวิชาต้องมีอย่างน้อย 1 สาขา", "error");
        return;
      }

      const res = await fetch("/api/classes/create", {
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

      showAlert(data.message, "success");
      router.push("/classes");
    } catch (error) {
      showAlert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้", "error");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = classes.every((item) => {
    return (
      item.className.trim() !== "" &&
      item.classCode.trim() !== "" &&
      item.teacher !== null &&
      item.branches.some((b) => b.trim() !== "")
    );
  });

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <div className="flex-1 overflow-y-auto p-6 font-noto">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.push("/classes")}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 transition cursor-pointer"
            >
              <ArrowLeftIcon className="w-3 h-3 text-gray-700" />
            </button>

            <h1 className="text-2xl font-semibold text-gray-800">
              เพิ่มรายวิชา
            </h1>
          </div>

          <div className="space-y-4">
            {classes.map((item, index) => (
              <div
                key={index}
                className="border border-gray-50 bg-[var(--card)] rounded-xl p-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-medium text-gray-800">
                    ข้อมูลวิชาที่ {index + 1}
                  </h2>

                  {classes.length > 1 && (
                    <button
                      onClick={() => handleRemoveClass(index)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg cursor-pointer"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm text-gray-800">ชื่อวิชา</label>
                    <input
                      type="text"
                      value={item.className}
                      onChange={(e) =>
                        handleChange(index, "className", e.target.value)
                      }
                      className="form-input-card text-sm"
                      placeholder="เช่น Web Programming"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-800">รหัสวิชา</label>
                      <input
                        type="text"
                        value={item.classCode}
                        onChange={(e) =>
                          handleChange(index, "classCode", e.target.value)
                        }
                        className="form-input-card text-sm"
                        placeholder="เช่น CS101"
                      />
                    </div>

                    <div
                      ref={(el) => {
                        teacherRefs.current[index] = el;
                      }}
                      className="relative"
                    >
                      <label className="text-sm text-gray-800">
                        อาจารย์ผู้สอน
                      </label>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenIndex(openIndex === index ? null : index);
                        }}
                        className="form-input-card text-sm flex items-center justify-between w-full"
                      >
                        {item.teacher?.name || "เลือกอาจารย์"}{" "}
                        <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                      </button>

                      {openIndex === index && (
                        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                          {loadingTeachers ? (
                            <div className="px-4 py-2 text-sm text-gray-400">
                              กำลังโหลดอาจารย์...
                            </div>
                          ) : teachers.length === 0 ? (
                            <div className="px-4 py-2 text-sm text-gray-400">
                              ไม่พบข้อมูลอาจารย์
                            </div>
                          ) : (
                            teachers.map((t) => {
                              const isSelected =
                                classes[index].teacher?._id === t._id;

                              return (
                                <button
                                  key={t._id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const updated = [...classes];
                                    updated[index].teacher = t;
                                    setClasses(updated);
                                    setOpenIndex(null);
                                  }}
                                  className={`block w-full px-4 py-2 text-left text-sm flex items-center justify-between cursor-pointer
                                  ${
                                    isSelected
                                      ? "bg-blue-50 text-blue-600 font-medium"
                                      : "hover:bg-gray-100"
                                  }`}
                                >
                                  <span>{t.name}</span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    ref={(el) => {
                      branchRefs.current[index] = el;
                    }}
                  >
                    <label className="text-sm text-gray-800">สาขา</label>

                    <div className="space-y-2 mt-2">
                      {item.branches.map((branch, bIndex) => (
                        <div key={bIndex} className="flex gap-2 relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenBranchIndex(
                                openBranchIndex?.classIndex === index &&
                                  openBranchIndex?.branchIndex === bIndex
                                  ? null
                                  : { classIndex: index, branchIndex: bIndex },
                              );
                            }}
                            className="form-input-card text-sm flex items-center justify-between w-full"
                          >
                            {branch || "เลือกสาขา"}
                            <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                          </button>

                          {openBranchIndex?.classIndex === index &&
                            openBranchIndex?.branchIndex === bIndex && (
                              <div className="absolute z-10 mt-10 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                                {loadingBranches ? (
                                  <div className="px-4 py-2 text-sm text-gray-400">
                                    กำลังโหลดสาขา...
                                  </div>
                                ) : branchOptions.length === 0 ? (
                                  <div className="px-4 py-2 text-sm text-gray-400">
                                    ไม่พบข้อมูลสาขา
                                  </div>
                                ) : (
                                  branchOptions.map((b) => {
                                    const isSelected =
                                      item.branches.includes(b);

                                    return (
                                      <button
                                        key={b}
                                        type="button"
                                        disabled={isSelected}
                                        onClick={() => {
                                          if (isSelected) return;

                                          handleBranchChange(index, bIndex, b);
                                          setOpenBranchIndex(null);
                                        }}
                                        className={`block w-full px-4 py-2 text-left text-sm
                                            ${
                                              isSelected
                                                ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                                                : "hover:bg-gray-100 cursor-pointer"
                                            }`}
                                      >
                                        {b}
                                      </button>
                                    );
                                  })
                                )}
                              </div>
                            )}

                          {item.branches.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveBranch(index, bIndex)}
                              className="text-red-500 hover:bg-red-50 p-2 rounded-md cursor-pointer"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddBranch(index)}
                      className="mt-2 text-sm text-blue-600 hover:underline cursor-pointer"
                    >
                      + เพิ่มสาขา
                    </button>
                  </div>

                  <div>
                    <label className="text-sm text-gray-800">
                      รายละเอียดวิชา
                    </label>
                    <textarea
                      value={item.description}
                      onChange={(e) =>
                        handleChange(index, "description", e.target.value)
                      }
                      className="form-input-card text-sm"
                      rows={4}
                      placeholder="กรอกรายละเอียดเพิ่มเติม"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-6">
            <button
              onClick={handleAddClass}
              className="px-4 py-2 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              + เพิ่มวิชา
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => router.push("/classes")}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-600 text-sm hover:bg-gray-100 cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                onClick={() =>
                  showConfirm("คุณต้องการบันทึกข้อมูลใช่หรือไม่", handleSubmit)
                }
                disabled={loading || !isFormValid}
                className={`px-5 py-2.5 rounded-md text-white text-sm transition
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
