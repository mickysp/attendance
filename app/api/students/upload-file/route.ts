import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import * as XLSX from "xlsx";

type ExcelRow = Record<string, unknown>;

type StudentDoc = {
  studentId: string;
  fullName: string;
  email?: string;
  classId: ObjectId;
  section: string;
  createdAt: Date;
};

type ImportError = {
  row: ExcelRow;
  message: string;
};

const normalizeKey = (key: string): string =>
  key.trim().toLowerCase();

const getValue = (row: ExcelRow, keys: string[]): string => {
  for (const key of Object.keys(row)) {
    const normalized = normalizeKey(key);

    if (keys.includes(normalized)) {
      const value = row[key];

      if (typeof value === "string" || typeof value === "number") {
        return String(value).trim();
      }

      return "";
    }
  }
  return "";
};

const isValidStudentId = (id: string): boolean =>
  /^\d{9}-\d$/.test(id);

const isValidName = (name: string): boolean =>
  /^(นาย|นาง|นางสาว)\s?.+/.test(name);

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File;
    const classId = formData.get("classId") as string;
    const section = formData.get("section") as string;

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

    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes);

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(sheet);

    if (jsonData.length === 0) {
      return NextResponse.json(
        { success: false, message: "ไฟล์ไม่มีข้อมูล" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("attendance");

    const studentsCol = db.collection<StudentDoc>("students");
    const classes = db.collection("classes");

    const classObjectId = new ObjectId(classId);

    const classData = await classes.findOne({ _id: classObjectId });

    if (!classData) {
      return NextResponse.json(
        { success: false, message: "ไม่พบวิชา" },
        { status: 404 }
      );
    }

    const insertData: StudentDoc[] = [];
    const errors: ImportError[] = [];
    let skipped = 0;

    for (const row of jsonData) {
      const studentId = getValue(row, [
        "studentid",
        "student id",
        "รหัสนักศึกษา",
      ]);

      const fullNameRaw = getValue(row, [
        "fullname",
        "full name",
        "ชื่อ-นามสกุล",
        "ชื่อ",
      ]);

      const email = getValue(row, [
        "email",
        "e-mail",
        "อีเมล",
      ]);

      const normalizedName = fullNameRaw.replace(
        /^(นาย|นาง|นางสาว)(\S)/,
        "$1 $2"
      );

      if (!studentId || !normalizedName) {
        errors.push({
          row,
          message: "ไม่พบ column ที่รองรับ (ชื่อ / รหัส)",
        });
        continue;
      }

      if (!isValidStudentId(studentId)) {
        errors.push({
          row,
          message: `รหัส ${studentId} ไม่ถูกต้อง`,
        });
        continue;
      }

      if (!isValidName(normalizedName)) {
        errors.push({
          row,
          message: `ชื่อ ${normalizedName} ไม่ถูกต้อง`,
        });
        continue;
      }

      if (email && !isValidEmail(email)) {
        errors.push({
          row,
          message: `email ${email} ไม่ถูกต้อง`,
        });
        continue;
      }

      const cleanName = normalizedName.replace(/\s+/g, " ");

      const exists = await studentsCol.findOne({
        $or: [
          {
            studentId,
            classId: classObjectId,
          },
          ...(email
            ? [
                {
                  email,
                  classId: classObjectId,
                },
              ]
            : []),
        ],
      });

      if (exists) {
        skipped++;
        continue;
      }

      insertData.push({
        studentId,
        fullName: cleanName,
        email: email || undefined,
        classId: classObjectId,
        section,
        createdAt: new Date(),
      });
    }

    if (insertData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่มีข้อมูลที่ถูกต้อง",
          errors,
        },
        { status: 400 }
      );
    }

    const result = await studentsCol.insertMany(insertData);

    return NextResponse.json(
      {
        success: true,
        message: `เพิ่มสำเร็จ ${result.insertedCount} รายการ`,
        skipped,
        errors,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("UPLOAD FILE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}