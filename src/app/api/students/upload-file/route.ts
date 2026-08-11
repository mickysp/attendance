import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import * as XLSX from "xlsx";

import type {
  ExcelRow,
  StudentDocument,
  StudentClassDocument,
  StudentResultItem,
  StudentImportErrorItem,
  MajorDocument,
  IncomingStudent
} from "@/types/students";

import type { ClassDocument } from "@/types/classes";

export const runtime = "nodejs";

const normalize = (text: unknown): string =>
  String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const getClassName = (c: ClassDocument): string => {
  return c.className || "";
};

const getString = (value: unknown): string => {
  return typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";
};

const getAcademicYear = (): number => {
  return new Date().getFullYear() + 543;
};

const isValidStudentId = (id: string): boolean => {
  return /^\d{9}-\d$/.test(id);
};

const isValidName = (name: string): boolean => {
  return /^(นาย|นาง|นางสาว)/.test(name);
};

const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file");

    const classId = String(formData.get("classId") ?? "");

    const section = String(formData.get("section") ?? "");

    const majorInput = String(formData.get("major") ?? "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาอัปโหลดไฟล์",
        },
        { status: 400 },
      );
    }

    if (!classId || !ObjectId.isValid(classId)) {
      return NextResponse.json(
        {
          success: false,
          message: "classId ไม่ถูกต้อง",
        },
        { status: 400 },
      );
    }

    if (!section) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาเลือก Section",
        },
        { status: 400 },
      );
    }

    if (!majorInput) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาระบุสาขา",
        },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("attendance");

    const studentsCol = db.collection<StudentDocument>("students");

    const studentClassesCol =
      db.collection<StudentClassDocument>("student_classes");

    const classesCol = db.collection<ClassDocument>("classes");

    const majorsCol = db.collection<MajorDocument>("majors");

    const classObjectId = new ObjectId(classId);

    const classData = await classesCol.findOne({
      _id: classObjectId,
    });

    if (!classData) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบวิชา",
        },
        { status: 404 },
      );
    }

    const className = getClassName(classData);

    if (!className) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบชื่อวิชา",
        },
        { status: 400 },
      );
    }

    const majors = await majorsCol.find({}).toArray();

    const major = majors.find((item) =>
      normalize(item.name).includes(normalize(majorInput)),
    );

    if (!major) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบสาขา",
        },
        { status: 404 },
      );
    }

    const workbook = XLSX.read(Buffer.from(await file.arrayBuffer()));

    if (workbook.SheetNames.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบ Sheet ในไฟล์ Excel",
        },
        { status: 400 },
      );
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    if (!sheet) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่สามารถอ่าน Sheet ได้",
        },
        { status: 400 },
      );
    }

    const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet);

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบข้อมูลในไฟล์ Excel",
        },
        { status: 400 },
      );
    }

    const academicYear = getAcademicYear();

    const parsed: StudentDocument[] = [];

    const errors: StudentImportErrorItem[] = [];

    rows.forEach((row) => {
      const studentId = getString(row["รหัสนักศึกษา"]);

      const fullName = getString(row["ชื่อ-นามสกุล"]);

      const email = getString(row["email"]) || getString(row["อีเมล"]) || "";

      const student: IncomingStudent = {
        studentId,
        fullName,
        email: email || undefined,
      };

      if (!studentId || !fullName) {
        errors.push({
          student,
          message: "ข้อมูลไม่ครบ",
        });

        return;
      }

      if (!isValidStudentId(studentId)) {
        errors.push({
          student,
          message: "studentId ไม่ถูกต้อง",
        });

        return;
      }

      if (!isValidName(fullName)) {
        errors.push({
          student,
          message: "ชื่อไม่ถูกต้อง",
        });

        return;
      }

      if (email && !isValidEmail(email)) {
        errors.push({
          student,
          message: "email ไม่ถูกต้อง",
        });

        return;
      }

      parsed.push({
        studentId,
        fullName,
        email: email || undefined,
        section,
        major: major.name,
        academicYear,
        createdAt: new Date(),
      });
    });

    if (parsed.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบข้อมูลนักศึกษาที่ถูกต้อง",
          summary: {
            total: 0,
            added: 0,
            exists: 0,
            errors: errors.length,
          },
          details: [],
          errors,
        },
        { status: 400 },
      );
    }

    await Promise.all(
      parsed.map((student) =>
        studentsCol.updateOne(
          {
            studentId: student.studentId,
            academicYear,
          },
          {
            $setOnInsert: student,
          },
          {
            upsert: true,
          },
        ),
      ),
    );

    const ids = parsed.map((student) => student.studentId);

    const allStudents = await studentsCol
      .find({
        studentId: {
          $in: ids,
        },
        academicYear,
      })
      .toArray();

    const idMap = new Map<string, ObjectId>(
      allStudents.map((student) => [student.studentId, student._id!]),
    );

    const details: StudentResultItem[] = [];

    for (const student of parsed) {
      const studentObjectId = idMap.get(student.studentId);

      if (!studentObjectId) {
        continue;
      }

      const exists = await studentClassesCol.findOne({
        studentId: studentObjectId,

        $or: [
          {
            classId: classObjectId,
            section,
          },
          {
            className,
            section,
          },
        ],
      });

      if (exists) {
        details.push({
          studentId: student.studentId,
          fullName: student.fullName,
          email: student.email,
          section: student.section,
          major: student.major,
          className,
          status: "duplicate",
          relation: "exists",
        });

        continue;
      }

      await studentClassesCol.insertOne({
        studentId: studentObjectId,
        classId: classObjectId,
        className,
        section,
        academicYear,
        createdAt: new Date(),
      });

      details.push({
        studentId: student.studentId,
        fullName: student.fullName,
        email: student.email,
        section: student.section,
        major: student.major,
        className,
        status: "created",
        relation: "added",
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "นำเข้าข้อมูลสำเร็จ",

        summary: {
          total: parsed.length,
          added: details.filter((item) => item.relation === "added").length,
          exists: details.filter((item) => item.relation === "exists").length,
          errors: errors.length,
        },

        details,

        errors,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("IMPORT STUDENTS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
      },
      { status: 500 },
    );
  }
}
