"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

type Subject = {
  id: string;
  name: string;
};

type Props = {
  subjects: Subject[];
  value: string | null;
  onChange: (id: string | null) => void;
  showClear?: boolean;
  onClearAll?: () => void;
};

export default function SubjectSelect({
  subjects,
  value,
  onChange,
  showClear = false,
  onClearAll,
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
    <div className="flex items-center gap-2">
      <div className="relative w-full md:w-[300px] min-w-0" ref={ref}>
        <div
          className="form-input-card text-sm flex items-center justify-between w-full min-w-0 overflow-hidden transition hover:bg-gray-50 cursor-pointer"
          onClick={() => setOpen(!open)}
        >
          <span
            className={`block truncate flex-1 ${
              selected ? "text-gray-800" : "text-gray-400"
            }`}
          >
            {selected ? selected.name : "เลือกวิชา"}
          </span>

          <ChevronDownIcon
            className={`w-4 h-4 text-blue-400 flex-shrink-0 transition ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>

        {open && (
          <div className="absolute z-20 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-50 overflow-y-auto">
            {subjects.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-400">ไม่พบข้อมูล</div>
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
                    className={`w-full px-4 py-2.5 text-left text-sm cursor-pointer ${
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
          className="text-sm text-blue-500 whitespace-nowrap cursor-pointer"
        >
          ล้างค่า
        </button>
      )}
    </div>
  );
}
