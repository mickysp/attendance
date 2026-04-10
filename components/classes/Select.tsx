"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

type Branch = {
  _id: string;
  name: string;
};

type ClassItem = {
  _id: string;
  className: string;
  classCode?: string;
  branches?: Branch[];
};

type Props = {
  data: ClassItem[];
  onChange: (value: { keyword: string; branch: string }) => void;
};

export default function ClassFilter({ data, onChange }: Props) {
  const [keyword, setKeyword] = useState("");
  const [branch, setBranch] = useState("");
  const [open, setOpen] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const branchOptions = useMemo(() => {
    const all = data.flatMap((c) => (c.branches || []).map((b) => b.name));
    return [...new Set(all)];
  }, [data]);

  const handleChange = (k: string, b: string) => {
    onChange({ keyword: k, branch: b });
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 w-full">
      <div className="relative w-full md:w-[390px]">
        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />

        <input
          type="text"
          placeholder="ค้นหารายวิชา และ รหัสวิชา"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            handleChange(e.target.value, branch);
          }}
          className="w-full pl-9 pr-3 py-2.5 text-[14px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--primary)] text-xs"
        />
      </div>

      <div ref={ref} className="relative w-full md:w-[280px]">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full px-3 py-2.5 text-[14px] border border-gray-200 rounded-md bg-white flex items-center justify-between hover:bg-gray-50 text-xs"
        >
          <span className={branch ? "text-gray-800" : "text-gray-400"}>
            {branch || "เลือกสาขา"}
          </span>

          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
        </button>

        {open && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow max-h-48 overflow-y-auto">
            <button
              onClick={() => {
                setBranch("");
                handleChange(keyword, "");
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-sm cursor-pointer"
            >
              ทั้งหมด
            </button>

            {branchOptions.map((b) => {
              const isSelected = branch === b;

              return (
                <button
                  key={b}
                  onClick={() => {
                    setBranch(b);
                    handleChange(keyword, b);
                    setOpen(false);
                  }}
                  className={`block w-full px-3 py-2 text-left text-sm flex items-center justify-between
                  ${
                    isSelected
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "hover:bg-gray-100"
                  } cursor-pointer`}
                >
                  <span>{b}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <button
        onClick={() => {
          setKeyword("");
          setBranch("");
          handleChange("", "");
        }}
        className="text-[13px] text-blue-500 hover:underline whitespace-nowrap text-xs cursor-pointer"
      >
        ล้างค่า
      </button>
    </div>
  );
}
