"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type Subject = {
  id: string;
  name: string;
};

type Props = {
  subjects: Subject[];
  value: string | null;
  onChange: (id: string | null) => void;

  keyword?: string;
  onKeywordChange?: (value: string) => void;

  showSearch?: boolean;

  showClear?: boolean;
  onClearAll?: () => void;

  placeholder?: string;
};

export default function SubjectSelect({
  subjects,
  value,
  onChange,
  keyword = "",
  onKeywordChange,
  showSearch = false,
  showClear = false,
  onClearAll,

  placeholder = "เลือกวิชา",
}: Props) {
  const [open, setOpen] = useState(false);

  const ref = useRef<HTMLDivElement | null>(null);

  const selected = subjects.find((s) => s.id === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="inline-flex items-center gap-4 flex-shrink-0">
      {showSearch && (
        <div className="relative w-[380px] flex-shrink-0">
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />

          <input
            type="text"
            placeholder="ค้นหาชื่อ หรือรหัสนักศึกษา"
            value={keyword}
            onChange={(e) => onKeywordChange?.(e.target.value)}
            className="
              w-full
              pl-9
              pr-9
              py-[10px]
              text-sm
              border-gray-200
              border
              rounded-md
              bg-white
              focus:outline-none
              focus:ring-1
              focus:ring-blue-200
              focus:border-blue-300
            "
          />

          {keyword && (
            <button
              type="button"
              onClick={() => onKeywordChange?.("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-blue-500 cursor-pointer" />
            </button>
          )}
        </div>
      )}

      <div className="relative w-[260px] flex-shrink-0" ref={ref}>
        <div
          className="
            px-3
            py-[10px]
            border
            border-gray-200
            rounded-md
            bg-white
            text-sm
            flex
            items-center
            justify-between
            w-full
            overflow-hidden
            transition
            hover:bg-gray-50
            cursor-pointer
          "
          onClick={() => setOpen(!open)}
        >
          <span
            className={`block truncate flex-1 ${
              selected ? "text-gray-800" : "text-gray-400"
            }`}
          >
            {selected ? selected.name : placeholder}
          </span>

          <ChevronDownIcon
            className={`w-4 h-4 text-blue-500 flex-shrink-0 transition ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>

        {open && (
          <div className="absolute z-20 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 overflow-hidden">
            <div className="max-h-60 overflow-y-auto">
              {subjects.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400">
                  ไม่พบข้อมูล
                </div>
              ) : (
                subjects.map((sub) => {
                  const isSelected = sub.id === value;

                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        onChange(sub.id);

                        setOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm cursor-pointer transition ${
                        isSelected
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      {sub.name}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {showClear && (
        <button
          type="button"
          onClick={() => {
            if (onClearAll) {
              onClearAll();
            } else {
              onChange(null);
            }
          }}
          className="text-sm text-blue-500 whitespace-nowrap cursor-pointer hover:underline flex-shrink-0"
        >
          ล้างค่า
        </button>
      )}
    </div>
  );
}
