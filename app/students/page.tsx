"use client";

import { useEffect, useState, useRef } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import StudentsDialog from "@/components/students/StudentsDialog";

type Major = {
  _id: string;
  name: string;
};

type Class = {
  _id: string;
  className: string;
  classCode: string;
};

type StudentInput = {
  studentId: string;
  fullName: string;
  email?: string;
};

export default function StudentsPage() {
  const [loading, setLoading] = useState<boolean>(false);

  const [file, setFile] = useState<File | null>(null);

  const [open, setOpen] = useState<boolean>(false);
  const [mode, setMode] = useState<"file" | "manual">("file");

  const [majors, setMajors] = useState<Major[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);

  const [selectedMajor, setSelectedMajor] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");

  const [students, setStudents] = useState<StudentInput[]>([
    { studentId: "", fullName: "", email: "" },
  ]);

  const [data, setData] = useState<StudentInput[]>([]);

  const [openMajor, setOpenMajor] = useState(false);
  const [openClass, setOpenClass] = useState(false);
  const [openSection, setOpenSection] = useState(false);

  const [sectionManual, setSectionManual] = useState<string>("");
  const [sectionFile, setSectionFile] = useState<string>("");

  const majorRef = useRef<HTMLDivElement>(null);
  const classRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  const sectionOptions = ["1", "2", "3"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [majRes, classRes] = await Promise.all([
          fetch("/api/majors"),
          fetch("/api/classes"),
        ]);

        const majData = await majRes.json();
        const classData = await classRes.json();

        if (majData.success) setMajors(majData.data);

        if (classData.success) {
          const sorted = classData.data.sort((a: Class, b: Class) =>
            a.classCode.localeCompare(b.classCode),
          );
          setClasses(sorted);
        }

        setData([]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (majorRef.current && !majorRef.current.contains(e.target as Node)) {
        setOpenMajor(false);
      }
      if (classRef.current && !classRef.current.contains(e.target as Node)) {
        setOpenClass(false);
      }
      if (
        sectionRef.current &&
        !sectionRef.current.contains(e.target as Node)
      ) {
        setOpenSection(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleAddRow = () => {
    setStudents([
      ...students,
      { studentId: "", fullName: "", email: "" },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    const updated = students.filter((_, i) => i !== index);
    setStudents(updated.length ? updated : [{ studentId: "", fullName: "", email: "" }]);
  };

  const handleChangeStudent = (
    index: number,
    field: keyof StudentInput,
    value: string,
  ) => {
    const updated = [...students];
    updated[index][field] = value;
    setStudents(updated);
  };

  const handleSave = () => {
    console.log({
      selectedMajor,
      selectedClass,
      mode,
      students,
    });

    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedMajor("");
    setSelectedClass("");
    setStudents([{ studentId: "", fullName: "", email: "" }]);
    setFile(null);
    setSectionManual("");
    setSectionFile("");
    setMode("file");
    setOpenMajor(false);
    setOpenClass(false);
    setOpenSection(false);
  };

  const isValidStudentId = (id: string) => /^\d{9}-\d$/.test(id);

  const isValidName = (name: string) =>
    /^(นาย|นาง|นางสาว)\s.+/.test(name);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <div className="flex-1 overflow-y-auto p-6 font-noto relative">
        {loading && <div>Loading...</div>}

        {!loading && data.length === 0 && (
          <div className="flex flex-col h-[85vh] bg-white rounded-2xl shadow-sm items-center justify-center">
            <p className="text-gray-400">ยังไม่มีข้อมูลนักศึกษา</p>

            <button
              onClick={() => setOpen(true)}
              className="mt-3 px-6 py-2 rounded-md bg-blue-500 text-white"
            >
              + เพิ่มรายชื่อนักศึกษา
            </button>
          </div>
        )}

        <StudentsDialog
          open={open}
          setOpen={setOpen}
          mode={mode}
          setMode={setMode}
          majors={majors}
          classes={classes}
          selectedMajor={selectedMajor}
          setSelectedMajor={setSelectedMajor}
          selectedClass={selectedClass}
          setSelectedClass={setSelectedClass}
          students={students}
          setStudents={setStudents}
          sectionManual={sectionManual}
          setSectionManual={setSectionManual}
          sectionFile={sectionFile}
          setSectionFile={setSectionFile}
          openMajor={openMajor}
          setOpenMajor={setOpenMajor}
          openClass={openClass}
          setOpenClass={setOpenClass}
          openSection={openSection}
          setOpenSection={setOpenSection}
          majorRef={majorRef}
          classRef={classRef}
          sectionRef={sectionRef}
          sectionOptions={sectionOptions}
          file={file}
          setFile={setFile}
          handleChangeStudent={handleChangeStudent}
          handleAddRow={handleAddRow}
          handleRemoveRow={handleRemoveRow}
          handleSave={handleSave}
          resetForm={resetForm}
          isValidStudentId={isValidStudentId}
          isValidName={isValidName}
        />
      </div>
    </div>
  );
}