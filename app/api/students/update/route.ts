import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const isValidStudentId = (id: string) => /^\d{9}-\d$/.test(id);
const isValidName = (name: string) =>
  /^(นาย|นาง|นางสาว)[^\s]+(\s[^\s]+)+$/.test(name);
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidSection = (section: string) => /^[0-9]+$/.test(section);

type UpdatePayload = {
  _id: string;
  studentId: string;
  fullName: string;
  email?: string;
  section?: string;
  className?: string;
  academicYear?: number;
};

export async function PUT(req: Request) {
  try {
    const body: UpdatePayload = await req.json();

    const {
      _id,
      studentId,
      fullName,
      email,
      section,
      className,
      academicYear,
    } = body;

    if (!_id || !ObjectId.isValid(_id)) {
      return NextResponse.json(
        { success: false, message: "id ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (!studentId || !fullName) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลไม่ครบ" },
        { status: 400 }
      );
    }

    if (!isValidStudentId(studentId)) {
      return NextResponse.json(
        { success: false, message: "รูปแบบรหัสนักศึกษาไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (!isValidName(fullName)) {
      return NextResponse.json(
        { success: false, message: "ชื่อไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: "email ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (section && !isValidSection(section)) {
      return NextResponse.json(
        { success: false, message: "section ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (!className) {
      return NextResponse.json(
        { success: false, message: "ต้องระบุวิชา" },
        { status: 400 }
      );
    }

    const currentYear = new Date().getFullYear() + 543;
    const year = academicYear || currentYear;

    const client = await clientPromise;
    const db = client.db("attendance");

    const studentsCol = db.collection("students");
    const studentClassesCol = db.collection("student_classes");

    await studentsCol.updateOne(
      { _id: new ObjectId(_id) },
      {
        $set: {
          studentId,
          fullName,
          ...(email !== undefined && { email }),
          updatedAt: new Date(),
        },
      }
    );

    const result = await studentClassesCol.updateOne(
      {
        studentId: new ObjectId(_id),
        className: className,
        academicYear: year,
      },
      {
        $set: {
          section,
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลวิชาสำหรับปีนี้" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "อัปเดตสำเร็จ",
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "error",
      },
      { status: 500 }
    );
  }
}