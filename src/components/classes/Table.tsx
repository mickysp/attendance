"use client";

import { useRouter } from "next/navigation";
import { useAlert } from "@/context/AlertContext";
import {
  PencilSquareIcon,
  TrashIcon,
  ChevronDownIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import { useState, useRef, useEffect } from "react";
import { useConfirm } from "@/context/ConfirmContext";

type Branch = {
  _id: string;
  name: string;
};

type Teacher = {
  _id: string;
  name: string;
};

type ClassCode = {
  code: string;
  section: number;
  branches: Branch[];
};

type ClassItem = {
  _id: string;
  className: string;
  academicYear?: number;
  classCodes: ClassCode[];
  description?: string;
  teacher?: Teacher;
  isOpen?: boolean;
  hasStudents?: boolean;
};

const BRANCH_COLOR_MAP: Record<string, string> = {
  เทคโนโลยีสารสนเทศและนวัตกรรมอัจฉริยะ:
    "bg-purple-50 text-purple-600 border-purple-200",
  วิทยาการคอมพิวเตอร์: "bg-blue-50 text-blue-600 border-blue-200",
  ภูมิสารสนเทศศาสตร์: "bg-green-50 text-green-600 border-green-200",
  ปัญญาประดิษฐ์: "bg-pink-50 text-pink-600 border-pink-200",
  ความมั่นคงปลอดภัยไซเบอร์: "bg-red-50 text-red-600 border-red-200",
};

export default function Table({
  data,
  onDeleteSuccess,
}: {
  data: ClassItem[];
  onDeleteSuccess: (id: string) => void;
}) {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [openPageSize, setOpenPageSize] = useState(false);
  const [page, setPage] = useState(1);

  const pageSizeRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));

  const paginatedData = data.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [data]);

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

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getVisiblePages = () => {
    const pages: number[] = [];

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

  const handleEdit = (id: string) => {
    router.push(`/classes/update/${id}`);
  };

  const handleDelete = (id: string) => {
    showConfirm(
      "ลบข้อมูลรายวิชา?",
      async () => {
        try {
          const res = await fetch(`/api/classes/delete?id=${id}`, {
            method: "DELETE",
          });

          const result = await res.json();

          if (!res.ok) {
            throw new Error(result.message || "ไม่สามารถลบรายวิชาได้");
          }

          showAlert(result.message || "ลบรายวิชาสำเร็จ", "success");

          onDeleteSuccess(id);
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : "เกิดข้อผิดพลาด";

          showAlert(message, "error");
        }
      },
      "delete",
      "คุณต้องการลบข้อมูลใช่หรือไม่",
    );
  };

  const handleCheckIn = (id: string) => {
    router.push(`/classes/form?classId=${id}`);
  };

  const renderClassCodes = (classCodes: ClassCode[]) => {
    if (!classCodes?.length) {
      return "-";
    }

    return (
      <div className="flex flex-col gap-1.5">
        {classCodes.map((classCode, index) => (
          <div
            key={`${classCode.code}-${classCode.section}-${index}`}
            className="flex items-center gap-2"
          >
            <span className="font-medium text-gray-700">
              {classCode.code || "-"}
            </span>

            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs border border-gray-200">
              Sec {classCode.section || "-"}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderBranches = (classCodes: ClassCode[]) => {
    if (!classCodes?.length) {
      return "-";
    }

    return (
      <div className="flex flex-col gap-2">
        {classCodes.map((classCode, index) => (
          <div
            key={`${classCode.code}-${classCode.section}-branch-${index}`}
            className="flex flex-wrap gap-1"
          >
            {classCode.branches?.length ? (
              classCode.branches.map((branch) => (
                <span
                  key={`${classCode.section}-${branch._id || branch.name}`}
                  className={`px-2 py-0.5 rounded-full text-[12px] border ${
                    BRANCH_COLOR_MAP[branch.name] ||
                    "bg-gray-100 text-gray-600 border-gray-200"
                  }`}
                >
                  {branch.name}
                </span>
              ))
            ) : (
              <span className="text-gray-400 text-xs">ไม่ระบุสาขา</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="mb-4 flex items-center justify-center w-28 h-28 rounded-full bg-gray-100">
          <img
            src="/not_exist_search.svg"
            alt="ไม่พบข้อมูล"
            className="w-28 h-28"
          />
        </div>

        <p className="text-sm text-gray-400">
          ไม่พบข้อมูลที่ค้นหา กรุณาลองใหม่อีกครั้ง
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-xl border border-gray-200 overflow-hidden max-h-[560px] flex flex-col">
        <div className="overflow-x-auto overflow-y-auto">
          <table className="w-full text-base table-fixed">
            <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold w-[180px]">
                  รหัสวิชา / Section
                </th>

                <th className="px-4 py-3 text-left font-semibold w-[240px]">
                  ชื่อวิชา
                </th>

                <th className="px-4 py-3 text-left font-semibold w-[300px]">
                  สาขา
                </th>

                <th className="px-4 py-3 text-left font-semibold w-[190px]">
                  อาจารย์ผู้สอน
                </th>

                <th className="px-4 py-3 text-center font-semibold w-[120px]">
                  สถานะ
                </th>

                <th className="px-4 py-3 text-center font-semibold w-[130px]">
                  นักศึกษา
                </th>

                <th className="px-4 py-3 text-left font-semibold w-[330px]">
                  จัดการ
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.map((item) => (
                <tr
                  key={item._id}
                  className="border-t border-gray-200 hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3 align-top text-sm">
                    {renderClassCodes(item.classCodes)}
                  </td>

                  <td className="px-4 py-3 align-top">
                    <div className="text-sm font-medium text-gray-800 whitespace-normal break-words">
                      {item.className || "-"}
                    </div>

                    {item.academicYear && (
                      <div className="mt-1 text-xs text-gray-400">
                        ปีการศึกษา {item.academicYear}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3 align-top">
                    {renderBranches(item.classCodes)}
                  </td>

                  <td className="px-4 py-3 align-top text-sm">
                    <span className="text-gray-700">
                      {item.teacher?.name || "-"}
                    </span>
                  </td>

                  <td className="px-4 py-3 align-top text-center">
                    {item.isOpen === true ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-200">
                        เปิด
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                        ปิด
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 align-top text-center">
                    {item.hasStudents === true ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200">
                        มีข้อมูล
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                        ยังไม่มี
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleCheckIn(item._id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50 text-sm cursor-pointer"
                      >
                        <ClipboardDocumentCheckIcon className="w-4 h-4" />

                        <span>เช็คชื่อ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEdit(item._id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-100 text-gray-700 text-sm cursor-pointer"
                      >
                        <PencilSquareIcon className="w-4 h-4" />

                        <span>แก้ไข</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(item._id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-red-200 text-red-500 hover:bg-red-50 text-sm cursor-pointer"
                      >
                        <TrashIcon className="w-4 h-4" />

                        <span>ลบ</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data.length > 10 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span>แสดง</span>

            <div ref={pageSizeRef} className="relative">
              <button
                type="button"
                onClick={() => setOpenPageSize(!openPageSize)}
                className="form-input-card flex items-center justify-between gap-2 px-3 py-1 text-xs min-w-[60px] cursor-pointer"
              >
                <span>{itemsPerPage}</span>

                <ChevronDownIcon className="w-3 h-3 text-gray-400" />
              </button>

              {openPageSize && (
                <div className="absolute bottom-full left-0 mb-1 z-20 w-full rounded-md bg-white shadow-lg border border-gray-200 overflow-hidden">
                  {[10, 15, 20].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setItemsPerPage(size);
                        setPage(1);
                        setOpenPageSize(false);
                      }}
                      className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 cursor-pointer ${
                        itemsPerPage === size
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : ""
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span>จากทั้งหมด {data.length} รายการ</span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-3 py-2 text-[13px] rounded-md border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              ก่อนหน้า
            </button>

            {getVisiblePages().map((p) => (
              <button
                type="button"
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
              type="button"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-4 py-2 text-[13px] rounded-md border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
