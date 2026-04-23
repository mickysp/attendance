"use client";

import { useState, useEffect, useRef } from "react";
import {
  DocumentTextIcon,
  ChevronDownIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useConfirm } from "@/context/ConfirmContext";
import { useAlert } from "@/context/AlertContext";

type Student = {
  _id: string;
  studentId: string;
  fullName: string;
  email?: string;
};

export default function StudentTable({
  data,
  onDeleteSuccess,
}: {
  data: Student[];
  onDeleteSuccess: (id: string) => void;
}) {
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
    showConfirm(
      "คุณต้องการลบข้อมูลใช่หรือไม่?",
      async () => {
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
      },
    );
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="mb-4 flex items-center justify-center w-20 h-20 rounded-full bg-gray-100">
          <DocumentTextIcon className="w-10 h-10 text-gray-400" />
        </div>
        <p className="text-sm text-gray-400">ไม่พบรายการที่ค้นหา</p>
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
                      <button className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-100 text-gray-700 text-sm cursor-pointer">
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
