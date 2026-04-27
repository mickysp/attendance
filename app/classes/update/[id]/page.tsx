"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import { TrashIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useAlert } from "@/context/AlertContext";
import { useConfirm } from "@/context/ConfirmContext";

type ClassItem = {
  className: string;
  classCode: string;
  description: string;
  teacher: string;
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

export default function EditClassPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [item, setItem] = useState<ClassItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [openTeacher, setOpenTeacher] = useState(false);
  const [openBranchIndex, setOpenBranchIndex] = useState<number | null>(null);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  const teacherRef = useRef<HTMLDivElement>(null);
  const branchRef = useRef<HTMLDivElement>(null);

  const [branchOptions, setBranchOptions] = useState<string[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  const [initialItem, setInitialItem] = useState<ClassItem | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/classes/${id}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        type RawBranch = string | { _id: string; name: string };

        setItem({
          className: data.data.className || "",
          classCode: data.data.classCode || "",
          description: data.data.description || "",
          teacher:
            typeof data.data.teacher === "object"
              ? data.data.teacher.name
              : data.data.teacher || "",
          branches: data.data.branches?.map((b: RawBranch) =>
            typeof b === "string" ? b : b.name,
          ) || [""],
        });

        const mapped = {
          className: data.data.className || "",
          classCode: data.data.classCode || "",
          description: data.data.description || "",
          teacher:
            typeof data.data.teacher === "object"
              ? data.data.teacher.name
              : data.data.teacher || "",
          branches: data.data.branches?.map((b: RawBranch) =>
            typeof b === "string" ? b : b.name,
          ) || [""],
        };

        setItem(mapped);
        setInitialItem(mapped);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
        showAlert(message, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, showAlert]);

  const isDirty = JSON.stringify(item) !== JSON.stringify(initialItem);

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

        if (data.success) {
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (teacherRef.current && !teacherRef.current.contains(target)) {
        setOpenTeacher(false);
      }

      if (branchRef.current && !branchRef.current.contains(target)) {
        setOpenBranchIndex(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (key: keyof ClassItem, value: string) => {
    if (!item) return;
    setItem({ ...item, [key]: value });
  };

  const handleBranchChange = (index: number, value: string) => {
    if (!item) return;
    const updated = [...item.branches];
    updated[index] = value;
    setItem({ ...item, branches: updated });
  };

  const handleAddBranch = () => {
    if (!item) return;
    setItem({ ...item, branches: [...item.branches, ""] });
  };

  const handleRemoveBranch = (index: number) => {
    if (!item) return;
    setItem({
      ...item,
      branches: item.branches.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async () => {
    if (!item) return;

    const cleanBranches = item.branches.filter((b) => b);

    if (!item.className) {
      return showAlert("กรุณากรอกชื่อวิชา", "error");
    }

    if (cleanBranches.length === 0) {
      return showAlert("ต้องมีอย่างน้อย 1 สาขา", "error");
    }

    showConfirm(
      "บันทึกแก้ไขข้อมูล?",
      async () => {
        try {
          const res = await fetch(`/api/classes/update?id=${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...item,
              branches: cleanBranches,
            }),
          });

          const data = await res.json();

          if (!res.ok) throw new Error(data.message);

          showAlert("อัปเดตสำเร็จ", "success");
          router.push("/classes");
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
          showAlert(message, "error");
        }
      },
      "edit",
      "คุณต้องการยืนยันการบันทึกแก้ไขข้อมูลใช่หรือไม่",
    );
  };

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

        {!loading && !item && <div className="p-6">ไม่พบข้อมูล</div>}

        {!loading && item && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => router.push("/classes")}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 transition cursor-pointer"
              >
                <ArrowLeftIcon className="w-3 h-3 text-gray-700" />
              </button>

              <h1 className="text-2xl font-semibold text-gray-800">
                แก้ไขรายวิชา
              </h1>
            </div>

            <div className="border border-gray-50 bg-[var(--card)] rounded-xl p-4 space-y-4">
              <div>
                <label className="text-sm text-gray-800">ชื่อวิชา</label>
                <input
                  value={item.className}
                  onChange={(e) => handleChange("className", e.target.value)}
                  className="form-input-card text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-800">รหัสวิชา</label>
                  <input
                    value={item.classCode}
                    onChange={(e) => handleChange("classCode", e.target.value)}
                    className="form-input-card text-sm"
                  />
                </div>

                <div ref={teacherRef} className="relative">
                  <label className="text-sm text-gray-800">อาจารย์ผู้สอน</label>

                  <button
                    type="button"
                    onClick={() => setOpenTeacher(!openTeacher)}
                    className="form-input-card text-sm flex justify-between w-full"
                  >
                    {item.teacher || "เลือกอาจารย์"}
                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                  </button>

                  {openTeacher && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {" "}
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
                          const isSelected = item.teacher === t.name;

                          return (
                            <button
                              key={t._id}
                              onClick={() => {
                                handleChange("teacher", t.name);
                                setOpenTeacher(false);
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

              <div ref={branchRef}>
                <label className="text-sm text-gray-800">สาขา</label>

                <div className="space-y-2 mt-2">
                  {item.branches.map((b, i) => (
                    <div key={i} className="flex gap-2 relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenBranchIndex(openBranchIndex === i ? null : i)
                        }
                        className="form-input-card text-sm flex justify-between w-full"
                      >
                        {b || "เลือกสาขา"}
                        <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                      </button>

                      {openBranchIndex === i && (
                        <div className="absolute z-10 mt-10 w-full bg-white border border-gray-200 rounded-md shadow-lg">
                          {loadingBranches ? (
                            <div className="px-4 py-2 text-sm text-gray-400">
                              กำลังโหลดสาขา...
                            </div>
                          ) : branchOptions.length === 0 ? (
                            <div className="px-4 py-2 text-sm text-gray-400">
                              ไม่พบข้อมูลสาขา
                            </div>
                          ) : (
                            branchOptions.map((opt) => {
                              const isSelected = item.branches.includes(opt);

                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  disabled={isSelected}
                                  onClick={() => {
                                    if (isSelected) return;

                                    handleBranchChange(i, opt);
                                    setOpenBranchIndex(null);
                                  }}
                                  className={`block w-full px-4 py-2 text-left text-sm
                                  ${
                                    isSelected
                                      ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                                      : "hover:bg-gray-100 cursor-pointer"
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}

                      {item.branches.length > 1 && (
                        <button onClick={() => handleRemoveBranch(i)}>
                          <TrashIcon className="w-5 h-5 text-red-500 cursor-pointer" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddBranch}
                  className="mt-2 text-sm text-blue-600 hover:underline cursor-pointer"
                >
                  + เพิ่มสาขา
                </button>
              </div>

              <div>
                <label className="text-sm text-gray-800">รายละเอียดวิชา</label>
                <textarea
                  value={item.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="form-input-card text-sm"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => router.push("/classes")}
                className="px-6 py-2.5 rounded-md border border-gray-300 text-gray-600 text-sm hover:bg-gray-100 cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                onClick={handleSubmit}
                disabled={!isDirty}
                className={`px-6 py-2.5 rounded-md text-white text-sm transition
                ${
                  !isDirty
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[var(--primary)] hover:bg-[var(--primary-hover)] cursor-pointer"
                }`}
              >
                บันทึก
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
