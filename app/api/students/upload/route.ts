import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type IncomingStudent = {
  studentId?: string;
  fullName?: string;
  email?: string;
};

type UploadPayload = {
  classId?: string;
  section?: string;
  students?: IncomingStudent[];
};

type StudentDoc = {
  studentId: string;
  fullName: string;
  email?: string;
  classId: ObjectId;
  section: string;
  createdAt: Date;
};

type ErrorItem = {
  student?: IncomingStudent;
  message: string;
};

const isValidStudentId = (id: string) =>
  /^\d{9}-\d$/.test(id);

const isValidName = (name: string) =>
  /^(นาย|นาง|นางสาว)\s?.+/.test(name);

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export async function POST(req: Request) {
  try {
    const body: UploadPayload = await req.json();
    const { classId, section, students } = body;

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

    if (!students || students.length === 0) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลนักศึกษา" },
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

    const errors: ErrorItem[] = [];
    const validStudents: StudentDoc[] = [];

    for (const s of students) {
      const studentId = s.studentId?.trim();
      const fullNameRaw = s.fullName?.trim();
      const email = s.email?.trim();

      if (!studentId || !fullNameRaw) {
        errors.push({ student: s, message: "ข้อมูลไม่ครบ" });
        continue;
      }

      if (!isValidStudentId(studentId)) {
        errors.push({
          student: s,
          message: `รหัส ${studentId} ไม่ถูกต้อง`,
        });
        continue;
      }

      const normalizedName = fullNameRaw.replace(
        /^(นาย|นาง|นางสาว)(\S)/,
        "$1 $2"
      );

      if (!isValidName(normalizedName)) {
        errors.push({
          student: s,
          message: `ชื่อ ${normalizedName} ไม่ถูกต้อง`,
        });
        continue;
      }

      if (email && !isValidEmail(email)) {
        errors.push({
          student: s,
          message: `email ${email} ไม่ถูกต้อง`,
        });
        continue;
      }

      validStudents.push({
        studentId,
        fullName: normalizedName.replace(/\s+/g, " "),
        email: email || undefined,
        classId: classObjectId,
        section,
        createdAt: new Date(),
      });
    }

    if (validStudents.length === 0) {
      return NextResponse.json(
        { success: false, message: "ไม่มีข้อมูลที่ถูกต้อง", errors },
        { status: 400 }
      );
    }

    const studentIds = validStudents.map((s) => s.studentId);
    const emails = validStudents
      .map((s) => s.email)
      .filter((e): e is string => !!e);

    const existing = await studentsCol
      .find({
        classId: classObjectId,
        $or: [
          { studentId: { $in: studentIds } },
          ...(emails.length ? [{ email: { $in: emails } }] : []),
        ],
      })
      .toArray();

    const existingStudentIds = new Set(
      existing.map((e) => e.studentId)
    );
    const existingEmails = new Set(
      existing.map((e) => e.email).filter(Boolean)
    );

    const finalInsert: StudentDoc[] = [];
    let skipped = 0;

    for (const s of validStudents) {
      if (
        existingStudentIds.has(s.studentId) ||
        (s.email && existingEmails.has(s.email))
      ) {
        skipped++;
        continue;
      }

      finalInsert.push(s);
    }

    if (finalInsert.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "ข้อมูลซ้ำทั้งหมด",
          skipped,
          errors,
        },
        { status: 400 }
      );
    }

    const result = await studentsCol.insertMany(finalInsert);

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
    console.error("UPLOAD STUDENTS ERROR:", error);

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