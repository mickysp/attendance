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

  classes?: {
    className: string;
    section: string;
    academicYear: number;
  }[];
};

export async function PUT(req: Request) {
  try {
    const body: UpdatePayload = await req.json();

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
      if (!c.className) {
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
    }

    const client = await clientPromise;

    const db = client.db("attendance");

    const studentsCol = db.collection("students");

    const studentClassesCol = db.collection("student_classes");

    await studentsCol.updateOne(
      {
        _id: new ObjectId(_id),
      },
      {
        $set: {
          studentId,
          fullName,

          ...(email !== undefined && {
            email,
          }),

          updatedAt: new Date(),
        },
      },
    );

    for (const c of classes) {
      const result = await studentClassesCol.updateOne(
        {
          studentId: new ObjectId(_id),
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
      {
        status: 500,
      },
    );
  }
}