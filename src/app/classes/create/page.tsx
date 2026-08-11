"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import {
  TrashIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  XMarkIcon,
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
  teachers: Teacher[];
  description: string;
};

export default function CreateClassPage() {
  const router = useRouter();

  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [loading, setLoading] = useState(false);

  const [openTeacherIndex, setOpenTeacherIndex] = useState<number | null>(
    null,
  );

  const [openBranchIndex, setOpenBranchIndex] = useState<{
    classIndex: number;
    codeIndex: number;
    branchIndex: number;
  } | null>(null);

  const teacherRefs = useRef<(HTMLDivElement | null)[]>([]);
  const branchRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [branchOptions, setBranchOptions] = useState<Major[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  const [classes, setClasses] = useState<ClassItem[]>([
    {
      className: "",
      classCodes: [
        {
          code: "",
          section: "",
          branches: [""],
        },
      ],
      teachers: [],
      description: "",
    },
  ]);
  
  const completedCount = classes.filter((item) => {
    const hasClassName = item.className.trim() !== "";

    const hasTeachers = item.teachers.length > 0;

    const hasClassCodes =
      item.classCodes.length > 0 &&
      item.classCodes.every((classCode) => {
        const section = Number(classCode.section);

        return (
          classCode.code.trim() !== "" &&
          Number.isInteger(section) &&
          section > 0 &&
          classCode.branches.length > 0 &&
          classCode.branches.some((branch) => branch.trim() !== "")
        );
      });

    return hasClassName && hasTeachers && hasClassCodes;
  }).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (
        openTeacherIndex !== null &&
        teacherRefs.current[openTeacherIndex] &&
        !teacherRefs.current[openTeacherIndex]?.contains(target)
      ) {
        setOpenTeacherIndex(null);
      }

      if (
        openBranchIndex &&
        branchRefs.current[openBranchIndex.classIndex] &&
        !branchRefs.current[openBranchIndex.classIndex]?.contains(target)
      ) {
        setOpenBranchIndex(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openTeacherIndex, openBranchIndex]);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await fetch("/api/teachers");
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          setTeachers(data.data);
        }
      } catch (error) {
        console.error("FETCH TEACHERS ERROR:", error);

        showAlert("ไม่สามารถโหลดข้อมูลอาจารย์ได้", "error");
      } finally {
        setLoadingTeachers(false);
      }
    };

    fetchTeachers();
  }, [showAlert]);

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
        showAlert("ไม่สามารถโหลดข้อมูลสาขาได้", "error");
      } finally {
        setLoadingBranches(false);
      }
    };

    fetchMajors();
  }, [showAlert]);

  type ClassStringKey = "className" | "description";

  const handleClassChange = (
    classIndex: number,
    key: ClassStringKey,
    value: string,
  ) => {
    setClasses((prev) =>
      prev.map((item, index) =>
        index === classIndex
          ? {
              ...item,
              [key]: value,
            }
          : item,
      ),
    );
  };

  const handleAddClass = () => {
    setClasses((prev) => [
      ...prev,
      {
        className: "",
        classCodes: [
          {
            code: "",
            section: "",
            branches: [""],
          },
        ],
        teachers: [],
        description: "",
      },
    ]);
  };

  const handleRemoveClass = (classIndex: number) => {
    setClasses((prev) => prev.filter((_, index) => index !== classIndex));

    if (openTeacherIndex === classIndex) {
      setOpenTeacherIndex(null);
    }

    setOpenBranchIndex(null);
  };

  const handleAddClassCode = (classIndex: number) => {
    setClasses((prev) =>
      prev.map((item, index) =>
        index === classIndex
          ? {
              ...item,
              classCodes: [
                ...item.classCodes,
                {
                  code: "",
                  section: "",
                  branches: [""],
                },
              ],
            }
          : item,
      ),
    );
  };

  const handleRemoveClassCode = (
    classIndex: number,
    codeIndex: number,
  ) => {
    setClasses((prev) =>
      prev.map((item, index) => {
        if (index !== classIndex) {
          return item;
        }

        return {
          ...item,
          classCodes: item.classCodes.filter(
            (_, index) => index !== codeIndex,
          ),
        };
      }),
    );

    setOpenBranchIndex(null);
  };

  const handleClassCodeChange = (
    classIndex: number,
    codeIndex: number,
    key: "code" | "section",
    value: string,
  ) => {
    setClasses((prev) =>
      prev.map((item, index) => {
        if (index !== classIndex) {
          return item;
        }

        const updatedClassCodes = [...item.classCodes];

        updatedClassCodes[codeIndex] = {
          ...updatedClassCodes[codeIndex],
          [key]: value,
        };

        return {
          ...item,
          classCodes: updatedClassCodes,
        };
      }),
    );
  };

  const handleAddBranch = (
    classIndex: number,
    codeIndex: number,
  ) => {
    setClasses((prev) =>
      prev.map((item, index) => {
        if (index !== classIndex) {
          return item;
        }

        const updatedClassCodes = [...item.classCodes];

        updatedClassCodes[codeIndex] = {
          ...updatedClassCodes[codeIndex],
          branches: [
            ...updatedClassCodes[codeIndex].branches,
            "",
          ],
        };

        return {
          ...item,
          classCodes: updatedClassCodes,
        };
      }),
    );
  };

  const handleRemoveBranch = (
    classIndex: number,
    codeIndex: number,
    branchIndex: number,
  ) => {
    setClasses((prev) =>
      prev.map((item, index) => {
        if (index !== classIndex) {
          return item;
        }

        const updatedClassCodes = [...item.classCodes];

        updatedClassCodes[codeIndex] = {
          ...updatedClassCodes[codeIndex],
          branches: updatedClassCodes[codeIndex].branches.filter(
            (_, index) => index !== branchIndex,
          ),
        };

        return {
          ...item,
          classCodes: updatedClassCodes,
        };
      }),
    );

    setOpenBranchIndex(null);
  };

  const handleBranchChange = (
    classIndex: number,
    codeIndex: number,
    branchIndex: number,
    value: string,
  ) => {
    setClasses((prev) =>
      prev.map((item, index) => {
        if (index !== classIndex) {
          return item;
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

        return {
          ...item,
          classCodes: updatedClassCodes,
        };
      }),
    );
  };

  const handleToggleTeacher = (
    classIndex: number,
    teacher: Teacher,
  ) => {
    setClasses((prev) =>
      prev.map((item, index) => {
        if (index !== classIndex) {
          return item;
        }

        const alreadySelected = item.teachers.some(
          (selectedTeacher) =>
            selectedTeacher._id === teacher._id,
        );

        if (alreadySelected) {
          return {
            ...item,
            teachers: item.teachers.filter(
              (selectedTeacher) =>
                selectedTeacher._id !== teacher._id,
            ),
          };
        }

        return {
          ...item,
          teachers: [...item.teachers, teacher],
        };
      }),
    );
  };

  const handleRemoveTeacher = (
    classIndex: number,
    teacherId: string,
  ) => {
    setClasses((prev) =>
      prev.map((item, index) => {
        if (index !== classIndex) {
          return item;
        }

        return {
          ...item,
          teachers: item.teachers.filter(
            (teacher) => teacher._id !== teacherId,
          ),
        };
      }),
    );
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const invalidClassName = classes.some(
        (item) => !item.className.trim(),
      );

      if (invalidClassName) {
        showAlert(
          "กรุณากรอกชื่อวิชาให้ครบทุกวิชา",
          "error",
        );
        return;
      }

      const invalidTeacher = classes.some(
        (item) => item.teachers.length === 0,
      );

      if (invalidTeacher) {
        showAlert(
          "กรุณาเลือกอาจารย์ผู้สอนอย่างน้อย 1 คนให้ครบทุกวิชา",
          "error",
        );
        return;
      }

      const invalidClassCode = classes.some((item) =>
        item.classCodes.some((classCode) => {
          const section = Number(classCode.section);

          return (
            !classCode.code.trim() ||
            !Number.isInteger(section) ||
            section <= 0
          );
        }),
      );

      if (invalidClassCode) {
        showAlert(
          "กรุณากรอกรหัสวิชาและ Section ให้ถูกต้องทุกช่อง",
          "error",
        );
        return;
      }

      const invalidBranch = classes.some((item) =>
        item.classCodes.some(
          (classCode) =>
            classCode.branches.filter(
              (branch) => branch.trim() !== "",
            ).length === 0,
        ),
      );

      if (invalidBranch) {
        showAlert(
          "ทุก Section ต้องมีอย่างน้อย 1 สาขา",
          "error",
        );
        return;
      }

      for (const item of classes) {
        const combinations = item.classCodes.map(
          (classCode) =>
            `${classCode.code.trim()}-${Number(
              classCode.section,
            )}`,
        );

        const uniqueCombinations = new Set(combinations);

        if (
          combinations.length !==
          uniqueCombinations.size
        ) {
          showAlert(
            `วิชา ${item.className} มีรหัสวิชาและ Section ซ้ำกัน`,
            "error",
          );
          return;
        }
      }

      for (const item of classes) {
        for (const classCode of item.classCodes) {
          const branchIds = classCode.branches.filter(
            (branch) => branch.trim() !== "",
          );

          const uniqueBranchIds = new Set(branchIds);

          if (
            branchIds.length !==
            uniqueBranchIds.size
          ) {
            showAlert(
              `วิชา ${item.className} รหัส ${classCode.code} Section ${classCode.section} มีสาขาซ้ำกัน`,
              "error",
            );
            return;
          }
        }
      }

      const payload = classes.map((item) => ({
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

        teacherIds: [
          ...new Set(
            item.teachers.map(
              (teacher) => teacher._id,
            ),
          ),
        ],

        ...(item.description.trim()
          ? {
              description:
                item.description.trim(),
            }
          : {}),
      }));

      console.log(
        "CREATE CLASS PAYLOAD:",
        payload,
      );

      const res = await fetch(
        "/api/classes/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        showAlert(
          data.message ||
            "เกิดข้อผิดพลาดในการเพิ่มรายวิชา",
          "error",
        );
        return;
      }

      showAlert(
        data.message || "เพิ่มรายวิชาสำเร็จ",
        "success",
      );

      router.push("/classes");
    } catch (error) {
      console.error(
        "CREATE CLASS ERROR:",
        error,
      );

      showAlert(
        "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = classes.every((item) => {
    const hasClassName =
      item.className.trim() !== "";

    const hasTeachers =
      item.teachers.length > 0;

    const hasClassCodes =
      item.classCodes.length > 0 &&
      item.classCodes.every((classCode) => {
        const hasCode =
          classCode.code.trim() !== "";

        const section = Number(
          classCode.section,
        );

        const hasSection =
          Number.isInteger(section) &&
          section > 0;

        const hasBranch =
          classCode.branches.some(
            (branch) =>
              branch.trim() !== "",
          );

        return (
          hasCode &&
          hasSection &&
          hasBranch
        );
      });

    return (
      hasClassName &&
      hasTeachers &&
      hasClassCodes
    );
  });

  return (
    <div className="flex h-screen overflow-hidden bg-blue-50">
      <Sidebar />

      <div className="flex-1 overflow-y-auto p-6 font-noto">
        <div className="bg-white rounded-2xl pt-6 px-6 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  router.push("/classes")
                }
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 transition cursor-pointer"
              >
                <ArrowLeftIcon className="w-3 h-3 text-gray-700" />
              </button>

              <h1 className="text-[26px] font-semibold text-gray-800">
                เพิ่มรายวิชา
              </h1>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100">
              <span className="text-sm text-gray-500">
                จำนวนวิชาที่เพิ่ม
              </span>

              <span className="text-sm font-semibold text-blue-600">
                {completedCount}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {classes.map(
              (item, classIndex) => (
                <div
                  key={classIndex}
                  className="border border-gray-50 bg-[var(--card)] rounded-xl p-4"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-medium text-gray-800">
                      ข้อมูลวิชาที่{" "}
                      {classIndex + 1}
                    </h2>

                    {classes.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveClass(
                            classIndex,
                          )
                        }
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg cursor-pointer"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-800">
                        ชื่อวิชา
                      </label>

                      <input
                        type="text"
                        value={
                          item.className
                        }
                        onChange={(e) =>
                          handleClassChange(
                            classIndex,
                            "className",
                            e.target.value,
                          )
                        }
                        className="form-input-card text-sm"
                        placeholder="เช่น Web Programming"
                      />
                    </div>

                    <div
                      ref={(el) => {
                        teacherRefs.current[
                          classIndex
                        ] = el;
                      }}
                      className="relative"
                    >
                      <label className="text-sm text-gray-800">
                        อาจารย์ผู้สอน
                      </label>

                      <div
                        className="form-input-card min-h-[42px] text-sm flex items-center justify-between gap-2 cursor-pointer"
                        onClick={() =>
                          setOpenTeacherIndex(
                            openTeacherIndex ===
                              classIndex
                              ? null
                              : classIndex,
                          )
                        }
                      >
                        <div className="flex flex-wrap gap-2 flex-1">
                          {item.teachers.length ===
                          0 ? (
                            <span className="text-gray-400">
                              เลือกอาจารย์
                            </span>
                          ) : (
                            item.teachers.map(
                              (teacher) => (
                                <span
                                  key={
                                    teacher._id
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 border border-blue-100"
                                >
                                  <span>
                                    {
                                      teacher.name
                                    }
                                  </span>

                                  <button
                                    type="button"
                                    onClick={(
                                      e,
                                    ) => {
                                      e.stopPropagation();

                                      handleRemoveTeacher(
                                        classIndex,
                                        teacher._id,
                                      );
                                    }}
                                    className="hover:bg-blue-100 rounded-full p-0.5 cursor-pointer"
                                  >
                                    <XMarkIcon className="w-3.5 h-3.5" />
                                  </button>
                                </span>
                              ),
                            )
                          )}
                        </div>

                        <ChevronDownIcon className="w-4 h-4 text-gray-400 shrink-0" />
                      </div>
                      {openTeacherIndex ===
                        classIndex && (
                        <div className="absolute z-30 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                          {loadingTeachers ? (
                            <div className="px-4 py-2 text-sm text-gray-400">
                              กำลังโหลดอาจารย์...
                            </div>
                          ) : teachers.length ===
                            0 ? (
                            <div className="px-4 py-2 text-sm text-gray-400">
                              ไม่พบข้อมูลอาจารย์
                            </div>
                          ) : (
                            teachers.map(
                              (teacher) => {
                                const isSelected =
                                  item.teachers.some(
                                    (
                                      selectedTeacher,
                                    ) =>
                                      selectedTeacher._id ===
                                      teacher._id,
                                  );

                                return (
                                  <div
                                    key={
                                      teacher._id
                                    }
                                    role="button"
                                    tabIndex={0}
                                    onClick={() =>
                                      handleToggleTeacher(
                                        classIndex,
                                        teacher,
                                      )
                                    }
                                    onKeyDown={(
                                      e,
                                    ) => {
                                      if (
                                        e.key ===
                                          "Enter" ||
                                        e.key ===
                                          " "
                                      ) {
                                        e.preventDefault();

                                        handleToggleTeacher(
                                          classIndex,
                                          teacher,
                                        );
                                      }
                                    }}
                                    className={`px-4 py-2 text-left text-sm flex items-center justify-between cursor-pointer ${
                                      isSelected
                                        ? "bg-blue-50 text-blue-600 font-medium"
                                        : "hover:bg-gray-100"
                                    }`}
                                  >
                                    <span>
                                      {
                                        teacher.name
                                      }
                                    </span>

                                    {isSelected && (
                                      <span className="text-xs text-blue-600">
                                        ✓
                                      </span>
                                    )}
                                  </div>
                                );
                              },
                            )
                          )}
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
                          (
                            classCode,
                            codeIndex,
                          ) => (
                            <div
                              key={codeIndex}
                              className="border border-gray-200 rounded-xl p-4 bg-white"
                            >
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-medium text-gray-700">
                                  รายการที่{" "}
                                  {codeIndex +
                                    1}
                                </span>

                                {item
                                  .classCodes
                                  .length >
                                  1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveClassCode(
                                        classIndex,
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
                                    value={
                                      classCode.code
                                    }
                                    onChange={(
                                      e,
                                    ) =>
                                      handleClassCodeChange(
                                        classIndex,
                                        codeIndex,
                                        "code",
                                        e
                                          .target
                                          .value,
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
                                    value={
                                      classCode.section
                                    }
                                    onChange={(
                                      e,
                                    ) =>
                                      handleClassCodeChange(
                                        classIndex,
                                        codeIndex,
                                        "section",
                                        e
                                          .target
                                          .value,
                                      )
                                    }
                                    className="form-input-card text-sm"
                                    placeholder="เช่น 1"
                                  />
                                </div>
                              </div>

                              <div
                                ref={(el) => {
                                  branchRefs.current[
                                    classIndex
                                  ] = el;
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
                                          (
                                            branch,
                                          ) =>
                                            branch._id ===
                                            branchId,
                                        );

                                      return (
                                        <div
                                          key={
                                            branchIndex
                                          }
                                          className="flex gap-2 relative"
                                        >
                                          <div className="relative flex-1">
                                            <button
                                              type="button"
                                              onClick={(
                                                e,
                                              ) => {
                                                e.stopPropagation();

                                                const isOpen =
                                                  openBranchIndex?.classIndex ===
                                                    classIndex &&
                                                  openBranchIndex?.codeIndex ===
                                                    codeIndex &&
                                                  openBranchIndex?.branchIndex ===
                                                    branchIndex;

                                                setOpenBranchIndex(
                                                  isOpen
                                                    ? null
                                                    : {
                                                        classIndex,
                                                        codeIndex,
                                                        branchIndex,
                                                      },
                                                );
                                              }}
                                              className="form-input-card text-sm flex items-center justify-between w-full"
                                            >
                                              <span>
                                                {selectedBranch?.name ||
                                                  "เลือกสาขา"}
                                              </span>

                                              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                                            </button>

                                            {openBranchIndex?.classIndex ===
                                              classIndex &&
                                              openBranchIndex?.codeIndex ===
                                                codeIndex &&
                                              openBranchIndex?.branchIndex ===
                                                branchIndex && (
                                                <div className="absolute z-40 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
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
                                                          <div
                                                            key={
                                                              branch._id
                                                            }
                                                            role="button"
                                                            tabIndex={
                                                              0
                                                            }
                                                            onClick={() => {
                                                              if (
                                                                isSelected
                                                              ) {
                                                                return;
                                                              }

                                                              handleBranchChange(
                                                                classIndex,
                                                                codeIndex,
                                                                branchIndex,
                                                                branch._id,
                                                              );

                                                              setOpenBranchIndex(
                                                                null,
                                                              );
                                                            }}
                                                            onKeyDown={(
                                                              e,
                                                            ) => {
                                                              if (
                                                                e.key ===
                                                                  "Enter" ||
                                                                e.key ===
                                                                  " "
                                                              ) {
                                                                e.preventDefault();

                                                                if (
                                                                  isSelected
                                                                ) {
                                                                  return;
                                                                }

                                                                handleBranchChange(
                                                                  classIndex,
                                                                  codeIndex,
                                                                  branchIndex,
                                                                  branch._id,
                                                                );

                                                                setOpenBranchIndex(
                                                                  null,
                                                                );
                                                              }
                                                            }}
                                                            className={`block w-full px-4 py-2 text-left text-sm ${
                                                              isSelected
                                                                ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                                                                : "hover:bg-gray-100 cursor-pointer"
                                                            }`}
                                                          >
                                                            <div className="flex items-center justify-between">
                                                              <span>
                                                                {
                                                                  branch.name
                                                                }
                                                              </span>

                                                              {isSelected && (
                                                                <span className="text-xs">
                                                                  ✓
                                                                </span>
                                                              )}
                                                            </div>
                                                          </div>
                                                        );
                                                      },
                                                    )
                                                  )}
                                                </div>
                                              )}
                                          </div>

                                          {classCode
                                            .branches
                                            .length >
                                            1 && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleRemoveBranch(
                                                  classIndex,
                                                  codeIndex,
                                                  branchIndex,
                                                )
                                              }
                                              className="text-red-500 hover:bg-red-50 p-2 rounded-md cursor-pointer"
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
                                      classIndex,
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
                        onClick={() =>
                          handleAddClassCode(
                            classIndex,
                          )
                        }
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
                        value={
                          item.description
                        }
                        onChange={(e) =>
                          handleClassChange(
                            classIndex,
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
              ),
            )}
          </div>

          <div className="flex justify-between items-center mt-6">
            <button
              type="button"
              onClick={handleAddClass}
              className="px-4 py-2 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              + เพิ่มวิชา
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  router.push("/classes")
                }
                className="px-6 py-2.5 rounded-md border border-gray-300 text-gray-600 text-sm hover:bg-gray-100 cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={() =>
                  showConfirm(
                    "เพิ่มข้อมูลรายวิชา",
                    handleSubmit,
                  )
                }
                disabled={
                  loading || !isFormValid
                }
                className={`px-6 py-2.5 rounded-md text-white text-sm transition ${
                  loading || !isFormValid
                    ? "bg-gray-400"
                    : "bg-[var(--primary)] hover:bg-[var(--primary-hover)] cursor-pointer"
                }`}
              >
                {loading
                  ? "กำลังบันทึก..."
                  : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}