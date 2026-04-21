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
  branches?: Branch[];
};

type Props = {
  data: ClassItem[];
  onChange: (value: {
    keyword: string;
    className: string;
    branch: string;
    section: string;
  }) => void;
};

export default function StudentFilter({ data, onChange }: Props) {
  const [keyword, setKeyword] = useState("");
  const [className, setClassName] = useState("");
  const [branch, setBranch] = useState("");
  const [section, setSection] = useState("");

  const [openClass, setOpenClass] = useState(false);
  const [openBranch, setOpenBranch] = useState(false);
  const [openSection, setOpenSection] = useState(false);

  const classRef = useRef<HTMLDivElement>(null);
  const branchRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (classRef.current && !classRef.current.contains(e.target as Node))
        setOpenClass(false);

      if (branchRef.current && !branchRef.current.contains(e.target as Node))
        setOpenBranch(false);

      if (sectionRef.current && !sectionRef.current.contains(e.target as Node))
        setOpenSection(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const classOptions = useMemo(() => data.map((c) => c.className), [data]);

  const branchOptions = useMemo(() => {
    const all = data.flatMap((c) => (c.branches || []).map((b) => b.name));
    return [...new Set(all)];
  }, [data]);

  const sectionOptions = ["1", "2", "3"];

  const handleChange = (k: string, c: string, b: string, s: string) => {
    onChange({
      keyword: k,
      className: c,
      branch: b,
      section: s,
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 w-full">
      <div className="relative w-full md:w-[300px]">
        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />

        <input
          type="text"
          placeholder="ค้นหานักศึกษา / รหัส"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            handleChange(e.target.value, className, branch, section);
          }}
          className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--primary)] text-xs"
        />
      </div>

      <div ref={classRef} className="relative w-full md:w-[240px]">
        <button
          onClick={() => setOpenClass(!openClass)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-md bg-white flex justify-between items-center text-xs hover:bg-gray-50"
        >
          <span className={className ? "text-gray-800" : "text-gray-400"}>
            {className || "เลือกวิชา"}
          </span>

          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
        </button>

        {openClass && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow max-h-48 overflow-y-auto">
            <button
              onClick={() => {
                setClassName("");
                handleChange(keyword, "", branch, section);
                setOpenClass(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 cursor-pointer"
            >
              ทั้งหมด
            </button>

            {classOptions.map((c) => {
              const isSelected = className === c;

              return (
                <button
                  key={c}
                  onClick={() => {
                    setClassName(c);
                    handleChange(keyword, c, branch, section);
                    setOpenClass(false);
                  }}
                  className={`block w-full px-3 py-2 text-left text-sm
                  ${
                    isSelected
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div ref={branchRef} className="relative w-full md:w-[240px]">
        <button
          onClick={() => setOpenBranch(!openBranch)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-md bg-white flex justify-between items-center text-xs hover:bg-gray-50"
        >
          <span className={branch ? "text-gray-800" : "text-gray-400"}>
            {branch || "เลือกสาขา"}
          </span>

          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
        </button>

        {openBranch && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow max-h-48 overflow-y-auto">
            <button
              onClick={() => {
                setBranch("");
                handleChange(keyword, className, "", section);
                setOpenBranch(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 cursor-pointer"
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
                    handleChange(keyword, className, b, section);
                    setOpenBranch(false);
                  }}
                  className={`block w-full px-3 py-2 text-left text-sm
                  ${
                    isSelected
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {b}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div ref={sectionRef} className="relative w-full md:w-[180px]">
        <button
          onClick={() => setOpenSection(!openSection)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-md bg-white flex justify-between items-center text-xs hover:bg-gray-50"
        >
          <span className={section ? "text-gray-800" : "text-gray-400"}>
            {section ? `Section ${section}` : "Section"}
          </span>

          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
        </button>

        {openSection && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow">
            <button
              onClick={() => {
                setSection("");
                handleChange(keyword, className, branch, "");
                setOpenSection(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
            >
              ทั้งหมด
            </button>

            {sectionOptions.map((s) => {
              const isSelected = section === s;

              return (
                <button
                  key={s}
                  onClick={() => {
                    setSection(s);
                    handleChange(keyword, className, branch, s);
                    setOpenSection(false);
                  }}
                  className={`block w-full px-3 py-2 text-left text-sm
                  ${
                    isSelected
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "hover:bg-gray-100"
                  }`}
                >
                  Section {s}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <button
        onClick={() => {
          setKeyword("");
          setClassName("");
          setBranch("");
          setSection("");
          handleChange("", "", "", "");
        }}
        className="text-xs text-blue-500 hover:underline whitespace-nowrap"
      >
        ล้างค่า
      </button>
    </div>
  );
}
