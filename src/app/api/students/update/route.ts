import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type {
  StudentDocument,
  StudentClassDocument,
  UpdateStudentBody,
} from "@/types/students";

const isValidStudentId = (id: string) => /^\d{9}-\d$/.test(id);

const isValidName = (name: string) =>
  /^(นาย|นาง|นางสาว)[^\s]+(\s[^\s]+)+$/.test(name);

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidSection = (section: string) => /^[0-9]+$/.test(section);

export async function PUT(req: Request) {
  try {
    const body: UpdateStudentBody = await req.json();

    const { _id, studentId, fullName, email, classes } = body;

    if (!_id || !ObjectId.isValid(_id)) {
      return NextResponse.json(
        {
          success: false,
          message: "id ไม่ถูกต้อง",
        },
        {
          status: 400,
        },
      );
    }

    if (!studentId || !fullName) {
      return NextResponse.json(
        {
          success: false,
          message: "ข้อมูลไม่ครบ",
        },
        {
          status: 400,
        },
      );
    }

    if (!isValidStudentId(studentId)) {
      return NextResponse.json(
        {
          success: false,
          message: "รูปแบบรหัสนักศึกษาไม่ถูกต้อง",
        },
        {
          status: 400,
        },
      );
    }

    if (!isValidName(fullName)) {
      return NextResponse.json(
        {
          success: false,
          message: "ชื่อไม่ถูกต้อง",
        },
        {
          status: 400,
        },
      );
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "email ไม่ถูกต้อง",
        },
        {
          status: 400,
        },
      );
    }

    if (!classes || classes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "ต้องมีรายวิชาอย่างน้อย 1 รายการ",
        },
        {
          status: 400,
        },
      );
    }

    for (const c of classes) {
      if (!c.className?.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "ต้องระบุวิชา",
          },
          {
            status: 400,
          },
        );
      }

      if (!isValidSection(c.section)) {
        return NextResponse.json(
          {
            success: false,
            message: "section ไม่ถูกต้อง",
          },
          {
            status: 400,
          },
        );
      }

      if (!Number.isInteger(c.academicYear)) {
        return NextResponse.json(
          {
            success: false,
            message: "academicYear ไม่ถูกต้อง",
          },
          {
            status: 400,
          },
        );
      }
    }

    const client = await clientPromise;
    const db = client.db("attendance");

    const studentsCol = db.collection<StudentDocument>("students");

    const studentClassesCol =
      db.collection<StudentClassDocument>("student_classes");

    const objectId = new ObjectId(_id);

    const existingStudent = await studentsCol.findOne({
      _id: objectId,
    });

    if (!existingStudent) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบข้อมูลนักศึกษา",
        },
        {
          status: 404,
        },
      );
    }

    const duplicateStudent = await studentsCol.findOne({
      studentId,
      _id: {
        $ne: objectId,
      },
    });

    if (duplicateStudent) {
      return NextResponse.json(
        {
          success: false,
          message: "รหัสนักศึกษานี้มีอยู่แล้ว",
        },
        {
          status: 400,
        },
      );
    }

    await studentsCol.updateOne(
      {
        _id: objectId,
      },
      {
        $set: {
          studentId,
          fullName,
          ...(email !== undefined ? { email } : {}),
          updatedAt: new Date(),
        },
      },
    );

    for (const c of classes) {
      const result = await studentClassesCol.updateOne(
        {
          studentId: objectId,
          className: c.className,
          academicYear: c.academicYear,
        },
        {
          $set: {
            section: c.section,
            updatedAt: new Date(),
          },
        },
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          {
            success: false,
            message: `ไม่พบข้อมูลวิชา ${c.className}`,
          },
          {
            status: 404,
          },
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "อัปเดตสำเร็จ",
      },
      {
        status: 200,
      },
    );
  } catch (error: unknown) {
    console.error("UPDATE STUDENT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
      },
      {
        status: 500,
      },
    );
  }
}
