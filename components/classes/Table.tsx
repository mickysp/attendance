"use client";

import { useRouter } from "next/navigation";
import { useAlert } from "@/context/AlertContext";
import {
  PencilSquareIcon,
  TrashIcon,
  DocumentTextIcon,
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

type ClassItem = {
  _id: string;
  className: string;
  classCode?: string;
  description?: string;
  teacher?: Teacher;
  branches?: Branch[];
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

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const paginatedData = data.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

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

  const handleView = (id: string) => {
    router.push(`/classes/update/${id}`);
  };

  const handleDelete = (id: string) => {
    showConfirm("คุณต้องการลบข้อมูลใช่หรือไม่?", async () => {
      try {
        const res = await fetch(`/api/classes/delete?id=${id}`, {
          method: "DELETE",
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        showAlert(data.message, "success");
        onDeleteSuccess(id);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
        showAlert(message, "error");
      }
    });
  };

  return (
    <div>
      <div className="rounded-xl border border-gray-200 overflow-hidden mt-6">
        <div className="max-h-[520px] overflow-y-auto">
          <table className="w-full text-sm table-fixed">
            <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold w-[100px]">
                  รหัสวิชา
                </th>
                <th className="px-4 py-3 text-left font-semibold w-[280px]">
                  ชื่อวิชา
                </th>
                <th className="px-4 py-3 text-left font-semibold w-[220px]">
                  สาขา
                </th>
                <th className="px-4 py-3 text-left font-semibold w-[200px]">
                  อาจารย์ผู้สอน
                </th>
                <th className="px-4 py-3 text-left font-semibold w-[240px]">
                  จัดการ
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.map((item) => (
                <tr
                  key={item._id}
                  className="border-t border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-4 py-2 text-sm truncate">
                    {item.classCode || "-"}
                  </td>

                  <td className="px-4 py-2 text-sm truncate">
                    {item.className}
                  </td>

                  <td className="px-4 py-2">
                    {item.branches?.length ? (
                      <div className="flex flex-wrap gap-1 max-w-[240px]">
                        {item.branches?.map((b) => (
                          <span
                            key={b._id || b.name}
                            className={`px-2 py-0.5 rounded-full text-[13px] border ${
                              BRANCH_COLOR_MAP[b.name] ||
                              "bg-gray-100 text-gray-600 border-gray-200"
                            }`}
                          >
                            {b.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="px-4 py-2 text-sm truncate">
                    {item.teacher?.name || "-"}
                  </td>

                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          router.push(
                            `/classes/form?classId=${item._id}&className=${item.className}&classCode=${item.classCode}&teacher=${item.teacher?.name}`,
                          )
                        }
                        className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50 text-sm cursor-pointer"
                      >
                        <ClipboardDocumentCheckIcon className="w-4 h-4" />
                        เช็คชื่อ
                      </button>

                      <button
                        onClick={() => handleView(item._id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-100 text-gray-700 text-sm cursor-pointer"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                        แก้ไข
                      </button>

                      <button
                        onClick={() => handleDelete(item._id)}
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
