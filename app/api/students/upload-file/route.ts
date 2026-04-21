import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document } from "mongodb";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

type ExcelRow = Record<string, string | number | undefined>;

type ClassDoc = Document & {
  _id: ObjectId;
  name?: string;
  class_name?: string;
  className?: string;
  courseName?: string;
};

type MajorDoc = Document & {
  _id: ObjectId;
  name: string;
};

type StudentDoc = {
  studentId: string;
  fullName: string;
  email?: string;
  classId: ObjectId;
  className: string;
  section: string;
  major: string;
  academicYear: number;
  createdAt: Date;
};

type ErrorItem = {
  row: ExcelRow;
  message: string;
};

const normalize = (text: unknown): string =>
  String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const getClassName = (c: ClassDoc): string =>
  c.name || c.class_name || c.className || c.courseName || "";

const getString = (value: unknown): string => {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  return "";
};

const getAcademicYear = (): number => {
  return new Date().getFullYear() + 543;
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const classId = String(formData.get("classId") || "");
    const section = String(formData.get("section") || "");
    const majorNameInput = String(formData.get("major") || "").trim();

    if (!file) {
      return NextResponse.json(
        { success: false, message: "กรุณาอัปโหลดไฟล์" },
        { status: 400 }
      );
    }

    if (!classId || !ObjectId.isValid(classId)) {
      return NextResponse.json(
        { success: false, message: "classId ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (!section) {
      return NextResponse.json(
        { success: false, message: "กรุณาเลือก Section" },
        { status: 400 }
      );
    }

    if (!majorNameInput) {
      return NextResponse.json(
        { success: false, message: "กรุณาเลือกสาขา" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const fileBuffer = Buffer.from(bytes);

    let workbook;
    try {
      workbook = XLSX.read(fileBuffer);
    } catch {
      return NextResponse.json(
        { success: false, message: "ไฟล์ Excel ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet);

    if (!rows.length) {
      return NextResponse.json(
        { success: false, message: "ไฟล์ไม่มีข้อมูล" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("attendance");

    const studentsCol = db.collection<StudentDoc>("students");
    const majorsCol = db.collection<MajorDoc>("majors");
    const classesCol = db.collection<ClassDoc>("classes");

    const classObjectId = new ObjectId(classId);

    const classExists = await classesCol.findOne({
      _id: classObjectId,
    });

    if (!classExists) {
      return NextResponse.json(
        { success: false, message: "ไม่พบวิชา" },
        { status: 404 }
      );
    }

    const classDisplayName = getClassName(classExists);

    const allMajors = await majorsCol.find().toArray();

    const majorExists = allMajors.find(
      (m) =>
        normalize(m.name) === normalize(majorNameInput) ||
        normalize(m.name).includes(normalize(majorNameInput))
    );

    if (!majorExists) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบสาขานี้",
          debug: allMajors.map((m) => m.name),
        },
        { status: 404 }
      );
    }

    const academicYear = getAcademicYear();

    const errors: ErrorItem[] = [];
    const validStudents: StudentDoc[] = [];

    for (const row of rows) {
      const studentId = getString(row["รหัสนักศึกษา"]);
      const fullName = getString(row["ชื่อ-นามสกุล"]);
      let email = getString(row["email"]);

      if (
        !email ||
        ["null", "undefined", "-", ""].includes(email.toLowerCase())
      ) {
        email = "";
      }

      if (!studentId && !fullName) continue;

      if (!studentId || !fullName) {
        errors.push({ row, message: "ข้อมูลไม่ครบ" });
        continue;
      }

      validStudents.push({
        studentId,
        fullName,
        email: email || undefined,
        classId: classObjectId,
        className: classDisplayName,
        section,
        major: majorExists.name,
        academicYear,
        createdAt: new Date(),
      });
    }

    if (!validStudents.length) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่มีข้อมูลที่ถูกต้อง",
          errors,
        },
        { status: 400 }
      );
    }

    const studentIds = validStudents.map((s) => s.studentId);

    const existing = await studentsCol
      .find({
        classId: classObjectId,
        section,
        academicYear,
        studentId: { $in: studentIds },
      })
      .toArray();

    const existingIds = new Set(existing.map((e) => e.studentId));

    const finalInsert = validStudents.filter(
      (s) => !existingIds.has(s.studentId)
    );

    if (!finalInsert.length) {
      return NextResponse.json(
        {
          success: false,
          message: "ข้อมูลซ้ำทั้งหมด",
          errors,
        },
        { status: 400 }
      );
    }

    const result = await studentsCol.insertMany(finalInsert);

    return NextResponse.json({
      success: true,
      message: `เพิ่มสำเร็จ ${result.insertedCount} รายการ`,
      skipped: validStudents.length - finalInsert.length,
      errors,
      preview: finalInsert.slice(0, 5),
      class: classDisplayName,
      major: majorExists.name,
      academicYear,
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 }
    );
  }
}