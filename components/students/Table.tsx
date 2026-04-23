"use client";

import { useState, useEffect, useRef } from "react";
import {
  UserCircleIcon,
  ChevronDownIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { useConfirm } from "@/context/ConfirmContext";
import { useAlert } from "@/context/AlertContext";

type Student = {
  _id: string;
  studentId: string;
  fullName: string;
  email?: string;
  section?: string;
  classes?: {
    className: string;
    section: string;
    academicYear: number;
  }[];
};

export default function StudentTable({
  data,
  onDeleteSuccess,
  onUpdateSuccess,
}: {
  data: Student[];
  onDeleteSuccess: (id: string) => void;
  onUpdateSuccess: (student: Student) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [openPageSize, setOpenPageSize] = useState(false);
  const pageSizeRef = useRef<HTMLDivElement>(null);

  const { showConfirm } = useConfirm();
  const { showAlert } = useAlert();

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const paginatedData = data.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  const isValidSection = (section: string) => /^[0-9]+$/.test(section);

  const [openEdit, setOpenEdit] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const isValidStudentId = (id: string) => /^\d{9}-\d$/.test(id);
  const isValidName = (name: string) => /^(นาย|นาง|นางสาว)/.test(name);
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isFormValid =
    selectedStudent &&
    selectedStudent.studentId.trim() &&
    selectedStudent.fullName.trim() &&
    selectedStudent.section?.trim() &&
    isValidStudentId(selectedStudent.studentId) &&
    isValidName(selectedStudent.fullName) &&
    isValidSection(selectedStudent.section || "") &&
    (!selectedStudent.email || isValidEmail(selectedStudent.email));

  const [editingClasses, setEditingClasses] = useState<
    { className: string; section: string }[]
  >([]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        pageSizeRef.current &&
        !pageSizeRef.current.contains(e.target as Node)
      ) {
        setOpenPageSize(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getVisiblePages = () => {
    const pages = [];

    let start = Math.max(1, page - 1);
    let end = Math.min(totalPages, page + 1);

    if (page === 1) {
      end = Math.min(3, totalPages);
    }

    if (page === totalPages) {
      start = Math.max(1, totalPages - 2);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const handleDelete = (id: string) => {
    showConfirm("คุณต้องการลบข้อมูลใช่หรือไม่?", async () => {
      try {
        const res = await fetch(`/api/students/delete?id=${id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text);
        }

        const data = await res.json();

        showAlert(data.message || "ลบข้อมูลสำเร็จ", "success");

        onDeleteSuccess(id);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
        showAlert(message, "error");
      }
    });
  };

  const handleUpdateStudent = async () => {
    if (!selectedStudent) return;

    try {
      setLoading(true);

      const res = await fetch("/api/students/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedStudent),
      });

      const data = await res.json();

      if (!res.ok) {
        showAlert(data.message, "error");
        return;
      }

      showAlert("อัปเดตสำเร็จ", "success");
      onUpdateSuccess(selectedStudent);
      setOpenEdit(false);
    } catch {
      showAlert("เกิดข้อผิดพลาด", "error");
    } finally {
      setLoading(false);
    }
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="mb-4 flex items-center justify-center w-28 h-28 rounded-full bg-gray-100">
          <img src="/not_exist_search.svg" className="w-28 h-28" />
        </div>
        <p className="text-sm text-gray-400">
          ไม่พบข้อมูลที่ค้นหา กรุณาลองใหม่อีกครั้ง
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-xl border border-gray-200 overflow-hidden mt-6">
        <div className="max-h-[520px] overflow-y-auto">
          <table className="w-full text-sm table-fixed">
            <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold w-[160px]">
                  รหัสนักศึกษา
                </th>
                <th className="px-4 py-3 text-left font-semibold w-[260px]">
                  ชื่อ-นามสกุล
                </th>
                <th className="px-4 py-3 text-left font-semibold w-[260px]">
                  อีเมล
                </th>
                <th className="px-4 py-3 text-left font-semibold w-[240px]">
                  จัดการ
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.map((s, i) => (
                <tr
                  key={i}
                  className="border-t border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 truncate">{s.studentId}</td>

                  <td className="px-4 py-3 truncate">{s.fullName}</td>

                  <td className="px-4 py-3 truncate">{s.email || "-"}</td>

                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setSelectedStudent(s);
                          setOpenView(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50 text-sm cursor-pointer"
                      >
                        <EyeIcon className="w-4 h-4" />
                        รายละเอียด
                      </button>

                      <button
                        onClick={() => {
                          setSelectedStudent(s);

                          setEditingClasses(
                            (s.classes || []).map((c) => ({
                              className: c.className,
                              section: c.section || "",
                            })),
                          );

                          setOpenEdit(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-100 text-gray-700 text-sm cursor-pointer"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                        แก้ไข
                      </button>

                      <button
                        onClick={() => handleDelete(s._id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-red-200 text-red-500 hover:bg-red-50 text-sm cursor-pointer"
                      >
                        <TrashIcon className="w-4 h-4" />
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {openEdit && selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 font-noto"
          onClick={() => setOpenEdit(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-sm p-6 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
              <div className="p-2 rounded-lg bg-[var(--card)]">
                <PencilSquareIcon className="w-5 h-5 text-gray-700" />
              </div>

              <h2 className="text-lg font-semibold text-gray-800">
                แก้ไขข้อมูลนักศึกษา
              </h2>
            </div>

            <div className="space-y-4 overflow-y-auto pr-2 flex-1">
              <div>
                <label className="text-sm text-gray-800 mb-0.5 block">
                  รหัสนักศึกษา
                </label>

                <input
                  value={selectedStudent.studentId}
                  onChange={(e) =>
                    setSelectedStudent({
                      ...selectedStudent,
                      studentId: e.target.value,
                    })
                  }
                  className={`form-input-card w-full text-sm ${
                    selectedStudent.studentId &&
                    !isValidStudentId(selectedStudent.studentId)
                      ? "border-red-400 focus:ring-red-300"
                      : ""
                  }`}
                  placeholder="เช่น 650123456-7"
                />

                {selectedStudent.studentId &&
                  !isValidStudentId(selectedStudent.studentId) && (
                    <p className="text-xs text-red-500 mt-1">
                      รูปแบบต้องเป็น 123456789-0
                    </p>
                  )}
              </div>

              <div>
                <label className="text-sm text-gray-800 mb-0.5 block">
                  ชื่อ-นามสกุล
                </label>

                <input
                  value={selectedStudent.fullName}
                  onChange={(e) =>
                    setSelectedStudent({
                      ...selectedStudent,
                      fullName: e.target.value,
                    })
                  }
                  className={`form-input-card w-full text-sm ${
                    selectedStudent.fullName &&
                    !isValidName(selectedStudent.fullName)
                      ? "border-red-400 focus:ring-red-300"
                      : ""
                  }`}
                  placeholder="เช่น นายสมชาย ใจดี"
                />

                {selectedStudent.fullName &&
                  !isValidName(selectedStudent.fullName) && (
                    <p className="text-xs text-red-500 mt-1">
                      ต้องขึ้นต้นด้วย นาย / นาง / นางสาว และมีชื่อ-นามสกุล
                    </p>
                  )}
              </div>

              <div>
                <label className="text-sm text-gray-800 mb-0.5 block">
                  อีเมล
                </label>

                <input
                  value={selectedStudent.email || ""}
                  onChange={(e) =>
                    setSelectedStudent({
                      ...selectedStudent,
                      email: e.target.value,
                    })
                  }
                  className={`form-input-card w-full text-sm ${
                    selectedStudent.email &&
                    !isValidEmail(selectedStudent.email)
                      ? "border-red-400 focus:ring-red-300"
                      : ""
                  }`}
                  placeholder="example@email.com"
                />

                {selectedStudent.email &&
                  !isValidEmail(selectedStudent.email) && (
                    <p className="text-xs text-red-500 mt-1">
                      รูปแบบอีเมลไม่ถูกต้อง เช่น example@email.com
                    </p>
                  )}
              </div>

              <div>
                <p className="text-sm text-gray-800 mb-2">รายวิชา</p>

                {editingClasses.length === 0 ? (
                  <p className="text-sm text-gray-400">ไม่มีข้อมูลรายวิชา</p>
                ) : (
                  <div className="space-y-2">
                    {editingClasses.map((c, i) => (
                      <div
                        key={i}
                        className="border border-gray-200 rounded-lg px-3 py-2 flex justify-between items-center"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {c.className}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Section</span>

                          <input
                            value={c.section}
                            onChange={(e) => {
                              const updated = [...editingClasses];
                              updated[i].section = e.target.value;
                              setEditingClasses(updated);
                            }}
                            className="w-[70px] px-2 py-1 text-sm border border-gray-200 rounded-md"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setOpenEdit(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-600 text-sm hover:bg-gray-100 cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                onClick={handleUpdateStudent}
                disabled={loading || !isFormValid}
                className={`px-5 py-2.5 rounded-md text-white text-sm transition
                ${
                  loading || !isFormValid
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[var(--primary)] hover:bg-[var(--primary-hover)] cursor-pointer"
                }`}
              >
                {loading ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {openView && selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setOpenView(false)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-2xl shadow-sm p-6 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
              <div className="p-2 rounded-lg bg-blue-50">
                <UserCircleIcon className="w-5 h-5 text-blue-600" />
              </div>

              <h2 className="text-lg font-semibold text-gray-800">
                รายละเอียดนักศึกษา
              </h2>
            </div>

            <div className="overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-gray-500">รหัสนักศึกษา</p>
                  <p className="font-medium text-gray-800">
                    {selectedStudent.studentId}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">ชื่อ-นามสกุล</p>
                  <p className="font-medium text-gray-800">
                    {selectedStudent.fullName}
                  </p>
                </div>

                <div className="col-span-2">
                  <p className="text-gray-500">อีเมล</p>
                  <p className="font-medium text-gray-800">
                    {selectedStudent.email || "-"}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-gray-500 mb-2">รายวิชา</p>

              {selectedStudent.classes && selectedStudent.classes.length > 0 ? (
                <div className="space-y-2">
                  {selectedStudent.classes.map((c, i) => (
                    <div
                      key={i}
                      className="border border-gray-200 rounded-lg px-3 py-2 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium text-gray-800">
                          {c.className}
                        </p>

                        <p className="text-xs text-gray-500">
                          Section {c.section}
                        </p>
                      </div>

                      <span className="text-xs text-gray-400">
                        ปี {c.academicYear}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">ไม่มีข้อมูลรายวิชา</p>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setOpenView(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-600 text-sm hover:bg-gray-100 cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {data.length > 10 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span>แสดง</span>

            <div ref={pageSizeRef} className="relative">
              <button
                onClick={() => setOpenPageSize(!openPageSize)}
                className="form-input-card flex items-center justify-between gap-2 px-3 py-1 text-xs min-w-[60px]"
              >
                {itemsPerPage}
                <ChevronDownIcon className="w-3 h-3 text-gray-400" />
              </button>

              {openPageSize && (
                <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200">
                  {[5, 10, 15].map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setItemsPerPage(size);
                        setPage(1);
                        setOpenPageSize(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span>จากทั้งหมด {data.length} รายการ</span>
          </div>

          <div className="flex items-center gap-1 mt-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-3 py-2 text-[13px] rounded-md border border-gray-200 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
            >
              ก่อนหน้า
            </button>

            {getVisiblePages().map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3.5 py-2 rounded-md border text-[13px] cursor-pointer ${
                  page === p
                    ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                    : "border-gray-200 hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-4 py-2 text-[13px] rounded-md border border-gray-200 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
