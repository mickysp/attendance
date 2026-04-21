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
  major?: string;
  students?: IncomingStudent[];
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
  student?: IncomingStudent;
  message: string;
};

const isValidStudentId = (id: string) => /^\d{9}-\d$/.test(id);

const isValidName = (name: string) =>
  /^(นาย|นาง|นางสาว)/.test(name);

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const getAcademicYear = () =>
  new Date().getFullYear() + 543;

export async function POST(req: Request) {
  try {
    const body: UploadPayload = await req.json();
    const { classId, section, major, students } = body;

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

    if (!major) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุสาขา" },
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
    const classesCol = db.collection("classes");
    const majorsCol = db.collection("majors");

    const classObjectId = new ObjectId(classId);

    const classData = await classesCol.findOne({ _id: classObjectId });

    if (!classData) {
      return NextResponse.json(
        { success: false, message: "ไม่พบวิชา" },
        { status: 404 }
      );
    }

    const className =
      classData.name ||
      classData.className ||
      classData.class_name ||
      classData.courseName ||
      "";

    const majorExists = await majorsCol.findOne({ name: major });

    if (!majorExists) {
      return NextResponse.json(
        { success: false, message: "ไม่พบสาขานี้" },
        { status: 404 }
      );
    }

    const academicYear = getAcademicYear();

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

      const normalizedName = fullNameRaw.replace(/\s+/g, " ").trim();

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
        fullName: normalizedName,
        email: email || undefined,
        classId: classObjectId,
        className,
        section,
        major,
        academicYear,
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

    const existing = await studentsCol
      .find({
        classId: classObjectId,
        section,
        major,
        academicYear,
        studentId: { $in: studentIds },
      })
      .toArray();

    const existingIds = new Set(existing.map((e) => e.studentId));

    const finalInsert = validStudents.filter(
      (s) => !existingIds.has(s.studentId)
    );

    if (finalInsert.length === 0) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลซ้ำทั้งหมด", errors },
        { status: 400 }
      );
    }

    const result = await studentsCol.insertMany(finalInsert);

    return NextResponse.json(
      {
        success: true,
        message: `เพิ่มสำเร็จ ${result.insertedCount} รายการ`,
        insertedCount: result.insertedCount,
        preview: finalInsert.slice(0, 5),
        skipped: validStudents.length - finalInsert.length,
        errors,
        className,
        major,
        academicYear,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
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