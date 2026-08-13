"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import {
  TrashIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useAlert } from "@/context/AlertContext";
import { useConfirm } from "@/context/ConfirmContext";

type Major = {
  _id: string;
  name: string;
};

type Teacher = {
  _id: string;
  name: string;
};

type ClassCodeItem = {
  code: string;
  section: string;
  branches: string[];
};

type ClassItem = {
  className: string;
  classCodes: ClassCodeItem[];
  description: string;
  teachers: Teacher[];
};

type ApiBranch = {
  _id: string;
  name: string;
};

type ApiClassCode = {
  code?: string;
  section?: number;
  branches?: ApiBranch[];
};

type ApiClassData = {
  className?: string;
  classCodes?: ApiClassCode[];
  description?: string;
  teacher?: Teacher | Teacher[] | null;
};

export default function EditClassPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [item, setItem] = useState<ClassItem | null>(null);
  const [initialItem, setInitialItem] = useState<ClassItem | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  const [branchOptions, setBranchOptions] = useState<Major[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  const [openTeacher, setOpenTeacher] = useState(false);

  const [openBranch, setOpenBranch] = useState<{
    codeIndex: number;
    branchIndex: number;
  } | null>(null);

  const teacherRef = useRef<HTMLDivElement | null>(null);
  const branchRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!id) {
      return;
    }

    const fetchClass = async () => {
      try {
        setLoading(true);

        const res = await fetch(`/api/classes/${id}`);

        const data: {
          success: boolean;
          data?: ApiClassData;
          message?: string;
        } = await res.json();

        if (!res.ok || !data.success || !data.data) {
          throw new Error(data.message || "ไม่พบข้อมูลรายวิชา");
        }

        const rawTeacher = data.data.teacher;

        let normalizedTeachers: Teacher[] = [];

        if (Array.isArray(rawTeacher)) {
          normalizedTeachers = rawTeacher
            .filter(
              (teacher): teacher is Teacher =>
                Boolean(teacher?._id) && typeof teacher.name === "string",
            )
            .map((teacher) => ({
              _id: teacher._id.toString(),
              name: teacher.name,
            }));
        } else if (
          rawTeacher &&
          typeof rawTeacher === "object" &&
          rawTeacher._id
        ) {
          normalizedTeachers = [
            {
              _id: rawTeacher._id.toString(),
              name: rawTeacher.name || "",
            },
          ];
        }

        const normalizedClassCodes: ClassCodeItem[] =
          Array.isArray(data.data.classCodes) &&
          data.data.classCodes.length > 0
            ? data.data.classCodes.map((classCode) => ({
                code: classCode.code || "",
                section:
                  typeof classCode.section === "number"
                    ? String(classCode.section)
                    : "",
                branches: Array.isArray(classCode.branches)
                  ? classCode.branches.map((branch) =>
                      branch?._id ? branch._id.toString() : "",
                    )
                  : [""],
              }))
            : [
                {
                  code: "",
                  section: "",
                  branches: [""],
                },
              ];

        const mapped: ClassItem = {
          className: data.data.className || "",
          classCodes: normalizedClassCodes,
          description: data.data.description || "",
          teachers: normalizedTeachers,
        };

        setItem(mapped);
        setInitialItem(JSON.parse(JSON.stringify(mapped)));
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "เกิดข้อผิดพลาด";

        showAlert(message, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchClass();
  }, [id, showAlert]);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await fetch("/api/teachers");

        const data: {
          success: boolean;
          data: Teacher[];
        } = await res.json();

        if (data.success && Array.isArray(data.data)) {
          setTeachers(data.data);
        }
      } catch (error) {
        console.error("FETCH TEACHERS ERROR:", error);
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

        const data: {
          success: boolean;
          data: Major[];
        } = await res.json();

        if (data.success && Array.isArray(data.data)) {
          setBranchOptions(data.data);
        }
      } catch (error) {
        console.error("FETCH MAJORS ERROR:", error);
      } finally {
        setLoadingBranches(false);
      }
    };

    fetchMajors();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (teacherRef.current && !teacherRef.current.contains(target)) {
        setOpenTeacher(false);
      }

      if (openBranch) {
        const currentRef = branchRefs.current[openBranch.codeIndex];

        if (currentRef && !currentRef.contains(target)) {
          setOpenBranch(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openBranch]);

  const isDirty =
    item !== null &&
    initialItem !== null &&
    JSON.stringify(item) !== JSON.stringify(initialItem);

  const handleClassChange = (
    key: "className" | "description",
    value: string,
  ) => {
    if (!item) {
      return;
    }

    setItem({
      ...item,
      [key]: value,
    });
  };

  const handleToggleTeacher = (teacher: Teacher) => {
    if (!item) {
      return;
    }

    const exists = item.teachers.some(
      (selectedTeacher) => selectedTeacher._id === teacher._id,
    );

    if (exists) {
      setItem({
        ...item,
        teachers: item.teachers.filter(
          (selectedTeacher) => selectedTeacher._id !== teacher._id,
        ),
      });

      return;
    }

    setItem({
      ...item,
      teachers: [...item.teachers, teacher],
    });
  };

  const handleRemoveTeacher = (teacherId: string) => {
    if (!item) {
      return;
    }

    setItem({
      ...item,
      teachers: item.teachers.filter(
        (teacher) => teacher._id !== teacherId,
      ),
    });
  };

  const handleClassCodeChange = (
    codeIndex: number,
    key: "code" | "section",
    value: string,
  ) => {
    if (!item) {
      return;
    }

    const updatedClassCodes = [...item.classCodes];

    updatedClassCodes[codeIndex] = {
      ...updatedClassCodes[codeIndex],
      [key]: value,
    };

    setItem({
      ...item,
      classCodes: updatedClassCodes,
    });
  };

  const handleAddClassCode = () => {
    if (!item) {
      return;
    }

    setItem({
      ...item,
      classCodes: [
        ...item.classCodes,
        {
          code: "",
          section: "",
          branches: [""],
        },
      ],
    });
  };

  const handleRemoveClassCode = (codeIndex: number) => {
    if (!item) {
      return;
    }

    setItem({
      ...item,
      classCodes: item.classCodes.filter(
        (_, index) => index !== codeIndex,
      ),
    });

    setOpenBranch(null);
  };

  const handleBranchChange = (
    codeIndex: number,
    branchIndex: number,
    value: string,
  ) => {
    if (!item) {
      return;
    }

    const updatedClassCodes = [...item.classCodes];

    const updatedBranches = [
      ...updatedClassCodes[codeIndex].branches,
    ];

    updatedBranches[branchIndex] = value;

    updatedClassCodes[codeIndex] = {
      ...updatedClassCodes[codeIndex],
      branches: updatedBranches,
    };

    setItem({
      ...item,
      classCodes: updatedClassCodes,
    });
  };

  const handleAddBranch = (codeIndex: number) => {
    if (!item) {
      return;
    }

    const updatedClassCodes = [...item.classCodes];

    updatedClassCodes[codeIndex] = {
      ...updatedClassCodes[codeIndex],
      branches: [
        ...updatedClassCodes[codeIndex].branches,
        "",
      ],
    };

    setItem({
      ...item,
      classCodes: updatedClassCodes,
    });
  };

  const handleRemoveBranch = (
    codeIndex: number,
    branchIndex: number,
  ) => {
    if (!item) {
      return;
    }

    const updatedClassCodes = [...item.classCodes];

    updatedClassCodes[codeIndex] = {
      ...updatedClassCodes[codeIndex],
      branches: updatedClassCodes[codeIndex].branches.filter(
        (_, index) => index !== branchIndex,
      ),
    };

    setItem({
      ...item,
      classCodes: updatedClassCodes,
    });

    setOpenBranch(null);
  };

  const validateForm = (): boolean => {
    if (!item) {
      return false;
    }

    if (!item.className.trim()) {
      showAlert("กรุณากรอกชื่อวิชา", "error");
      return false;
    }

    if (item.teachers.length === 0) {
      showAlert("กรุณาเลือกอาจารย์ผู้สอนอย่างน้อย 1 คน", "error");
      return false;
    }

    if (item.classCodes.length === 0) {
      showAlert("ต้องมีอย่างน้อย 1 รหัสวิชา", "error");
      return false;
    }

    for (const classCode of item.classCodes) {
      if (!classCode.code.trim()) {
        showAlert("กรุณากรอกรหัสวิชาให้ครบทุกช่อง", "error");
        return false;
      }

      const section = Number(classCode.section);

      if (!Number.isInteger(section) || section <= 0) {
        showAlert(
          `Section ของรหัสวิชา ${classCode.code} ไม่ถูกต้อง`,
          "error",
        );

        return false;
      }

      const validBranches = classCode.branches.filter(
        (branch) => branch.trim() !== "",
      );

      if (validBranches.length === 0) {
        showAlert(
          `รหัสวิชา ${classCode.code} Section ${section} ต้องมีอย่างน้อย 1 สาขา`,
          "error",
        );

        return false;
      }

      const uniqueBranches = new Set(validBranches);

      if (uniqueBranches.size !== validBranches.length) {
        showAlert(
          `รหัสวิชา ${classCode.code} Section ${section} มีสาขาซ้ำกัน`,
          "error",
        );

        return false;
      }
    }

    const combinations = item.classCodes.map(
      (classCode) =>
        `${classCode.code.trim()}-${Number(classCode.section)}`,
    );

    const uniqueCombinations = new Set(combinations);

    if (combinations.length !== uniqueCombinations.size) {
      showAlert(
        "มีรหัสวิชาและ Section ซ้ำกัน กรุณาตรวจสอบอีกครั้ง",
        "error",
      );

      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!item) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    showConfirm(
      "บันทึกแก้ไขข้อมูล?",
      async () => {
        try {
          setSaving(true);

          const payload = {
            className: item.className.trim(),

            classCodes: item.classCodes.map((classCode) => ({
              code: classCode.code.trim(),

              section: Number(classCode.section),

              branchIds: [
                ...new Set(
                  classCode.branches.filter(
                    (branch) => branch.trim() !== "",
                  ),
                ),
              ],
            })),

            teacherIds: item.teachers.map(
              (teacher) => teacher._id,
            ),

            ...(item.description.trim()
              ? {
                  description: item.description.trim(),
                }
              : {}),
          };

          const res = await fetch(
            `/api/classes/update?id=${id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            },
          );

          const data = await res.json();

          if (!res.ok) {
            throw new Error(
              data.message || "ไม่สามารถแก้ไขรายวิชาได้",
            );
          }

          showAlert(
            data.message || "อัปเดตรายวิชาสำเร็จ",
            "success",
          );

          router.push("/classes");
        } catch (error: unknown) {
          const message =
            error instanceof Error
              ? error.message
              : "เกิดข้อผิดพลาด";

          showAlert(message, "error");
        } finally {
          setSaving(false);
        }
      },
      "edit",
      "คุณต้องการยืนยันการบันทึกแก้ไขข้อมูลใช่หรือไม่",
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-blue-50">
        <Sidebar />

        <div className="flex-1 flex items-center justify-center font-noto">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--primary)]" />

            <p className="text-gray-500">
              กำลังโหลดข้อมูล...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex h-screen overflow-hidden bg-blue-50">
        <Sidebar />

        <div className="flex-1 p-6 font-noto">
          <div className="bg-white rounded-2xl p-6">
            <p className="text-gray-600">
              ไม่พบข้อมูลรายวิชา
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-blue-50">
      <Sidebar />

      <div className="flex-1 overflow-y-auto p-6 font-noto">
        <div className="bg-white rounded-2xl pt-6 px-6 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => router.push("/classes")}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 transition cursor-pointer"
            >
              <ArrowLeftIcon className="w-3 h-3 text-gray-700" />
            </button>

            <h1 className="text-[26px] font-semibold text-gray-800">
              แก้ไขรายวิชา
            </h1>
          </div>

          <div className="border border-gray-50 bg-[var(--card)] rounded-xl p-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-800">
                  ชื่อวิชา
                </label>

                <input
                  type="text"
                  value={item.className}
                  onChange={(e) =>
                    handleClassChange(
                      "className",
                      e.target.value,
                    )
                  }
                  className="form-input-card text-sm"
                  placeholder="เช่น Web Programming"
                />
              </div>

              <div
                ref={teacherRef}
                className="relative"
              >
                <label className="text-sm text-gray-800">
                  อาจารย์ผู้สอน
                </label>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenTeacher(!openTeacher);
                  }}
                  className="form-input-card text-sm flex items-center justify-between w-full"
                >
                  <span className="truncate text-left">
                    {item.teachers.length > 0
                      ? item.teachers
                          .map(
                            (teacher) =>
                              teacher.name,
                          )
                          .join(", ")
                      : "เลือกอาจารย์ผู้สอน"}
                  </span>

                  <ChevronDownIcon className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                </button>

                {openTeacher && (
                  <div className="absolute z-30 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-56 overflow-y-auto">
                    {loadingTeachers ? (
                      <div className="px-4 py-3 text-sm text-gray-400">
                        กำลังโหลดอาจารย์...
                      </div>
                    ) : teachers.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-400">
                        ไม่พบข้อมูลอาจารย์
                      </div>
                    ) : (
                      teachers.map((teacher) => {
                        const isSelected =
                          item.teachers.some(
                            (selectedTeacher) =>
                              selectedTeacher._id ===
                              teacher._id,
                          );

                        return (
                          <button
                            key={teacher._id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();

                              handleToggleTeacher(
                                teacher,
                              );
                            }}
                            className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? "bg-blue-50 text-blue-600 font-medium"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            <span>
                              {teacher.name}
                            </span>

                            {isSelected && (
                              <span className="text-blue-600">
                                ✓
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}

                {item.teachers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.teachers.map((teacher) => (
                      <div
                        key={teacher._id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg"
                      >
                        <span className="text-sm text-blue-700">
                          {teacher.name}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveTeacher(
                              teacher._id,
                            )
                          }
                          className="text-blue-400 hover:text-red-500 cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-800">
                    รหัสวิชา / Section
                  </label>

                  <span className="text-xs text-gray-400">
                    สามารถเพิ่มได้หลาย Section
                  </span>
                </div>

                <div className="space-y-4 mt-2">
                  {item.classCodes.map(
                    (classCode, codeIndex) => (
                      <div
                        key={codeIndex}
                        className="border border-gray-200 rounded-xl p-4 bg-white"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-medium text-gray-700">
                            รายการที่{" "}
                            {codeIndex + 1}
                          </span>

                          {item.classCodes.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveClassCode(
                                  codeIndex,
                                )
                              }
                              className="text-red-500 hover:bg-red-50 p-1.5 rounded-md cursor-pointer"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-gray-800">
                              รหัสวิชา
                            </label>

                            <input
                              type="text"
                              value={classCode.code}
                              onChange={(e) =>
                                handleClassCodeChange(
                                  codeIndex,
                                  "code",
                                  e.target.value,
                                )
                              }
                              className="form-input-card text-sm"
                              placeholder="เช่น CS101"
                            />
                          </div>

                          <div>
                            <label className="text-sm text-gray-800">
                              Section
                            </label>

                            <input
                              type="number"
                              min="1"
                              value={classCode.section}
                              onChange={(e) =>
                                handleClassCodeChange(
                                  codeIndex,
                                  "section",
                                  e.target.value,
                                )
                              }
                              className="form-input-card text-sm"
                              placeholder="เช่น 1"
                            />
                          </div>
                        </div>

                        <div
                          ref={(element) => {
                            branchRefs.current[
                              codeIndex
                            ] = element;
                          }}
                          className="mt-4"
                        >
                          <label className="text-sm text-gray-800">
                            สาขา
                          </label>

                          <div className="space-y-2 mt-2">
                            {classCode.branches.map(
                              (
                                branchId,
                                branchIndex,
                              ) => {
                                const selectedBranch =
                                  branchOptions.find(
                                    (branch) =>
                                      branch._id ===
                                      branchId,
                                  );

                                const branchDropdownOpen =
                                  openBranch?.codeIndex ===
                                    codeIndex &&
                                  openBranch?.branchIndex ===
                                    branchIndex;

                                return (
                                  <div
                                    key={branchIndex}
                                    className="flex gap-2 relative"
                                  >
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();

                                        setOpenBranch(
                                          branchDropdownOpen
                                            ? null
                                            : {
                                                codeIndex,
                                                branchIndex,
                                              },
                                        );
                                      }}
                                      className="form-input-card text-sm flex items-center justify-between w-full"
                                    >
                                      <span>
                                        {selectedBranch
                                          ?.name ||
                                          "เลือกสาขา"}
                                      </span>

                                      <ChevronDownIcon className="w-4 h-4 text-gray-400 shrink-0" />
                                    </button>

                                    {branchDropdownOpen && (
                                      <div className="absolute z-30 top-full left-0 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                                        {loadingBranches ? (
                                          <div className="px-4 py-2 text-sm text-gray-400">
                                            กำลังโหลดสาขา...
                                          </div>
                                        ) : branchOptions.length ===
                                          0 ? (
                                          <div className="px-4 py-2 text-sm text-gray-400">
                                            ไม่พบข้อมูลสาขา
                                          </div>
                                        ) : (
                                          branchOptions.map(
                                            (
                                              branch,
                                            ) => {
                                              const isSelected =
                                                classCode.branches.includes(
                                                  branch._id,
                                                );

                                              return (
                                                <button
                                                  key={
                                                    branch._id
                                                  }
                                                  type="button"
                                                  disabled={
                                                    isSelected
                                                  }
                                                  onClick={() => {
                                                    if (
                                                      isSelected
                                                    ) {
                                                      return;
                                                    }

                                                    handleBranchChange(
                                                      codeIndex,
                                                      branchIndex,
                                                      branch._id,
                                                    );

                                                    setOpenBranch(
                                                      null,
                                                    );
                                                  }}
                                                  className={`w-full px-4 py-2 text-left text-sm ${
                                                    isSelected
                                                      ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                                                      : "hover:bg-gray-100 cursor-pointer"
                                                  }`}
                                                >
                                                  {
                                                    branch.name
                                                  }
                                                </button>
                                              );
                                            },
                                          )
                                        )}
                                      </div>
                                    )}

                                    {classCode.branches
                                      .length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleRemoveBranch(
                                            codeIndex,
                                            branchIndex,
                                          )
                                        }
                                        className="text-red-500 hover:bg-red-50 p-2 rounded-md cursor-pointer shrink-0"
                                      >
                                        <TrashIcon className="w-5 h-5" />
                                      </button>
                                    )}
                                  </div>
                                );
                              },
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleAddBranch(
                                codeIndex,
                              )
                            }
                            className="mt-2 text-sm text-blue-600 hover:underline cursor-pointer"
                          >
                            + เพิ่มสาขา
                          </button>
                        </div>
                      </div>
                    ),
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddClassCode}
                  className="mt-3 text-sm text-blue-600 hover:underline cursor-pointer"
                >
                  + เพิ่มรหัสวิชา / Section
                </button>
              </div>

              <div>
                <label className="text-sm text-gray-800">
                  รายละเอียดวิชา
                </label>

                <textarea
                  value={item.description}
                  onChange={(e) =>
                    handleClassChange(
                      "description",
                      e.target.value,
                    )
                  }
                  className="form-input-card text-sm"
                  rows={4}
                  placeholder="กรอกรายละเอียดเพิ่มเติม"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={() => router.push("/classes")}
              className="px-6 py-2.5 rounded-md border border-gray-300 text-gray-600 text-sm hover:bg-gray-100 cursor-pointer"
            >
              ยกเลิก
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isDirty || saving}
              className={`px-6 py-2.5 rounded-md text-white text-sm transition ${
                !isDirty || saving
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[var(--primary)] hover:bg-[var(--primary-hover)] cursor-pointer"
              }`}
            >
              {saving
                ? "กำลังบันทึก..."
                : "บันทึก"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}