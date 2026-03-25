import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

type Branch = {
  _id: string;
  name: string;
};

type Teacher = {
  _id: string;
  name: string;
};

type IncomingBranch = Branch | string;
type IncomingTeacher = Teacher | string;

type IncomingClass = {
  className?: string;
  classCode?: string;
  teacher?: IncomingTeacher;
  description?: string;
  branches?: IncomingBranch[];
};

type ClassPayload = {
  className: string;
  classCode?: string;
  description?: string;
  teacher?: Teacher;
  branches: Branch[];
  createdAt: Date;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const classList: IncomingClass[] = Array.isArray(body)
      ? body
      : [body];

    const client = await clientPromise;
    const db = client.db("attendance");
    const classes = db.collection<ClassPayload>("classes");

    const insertData: ClassPayload[] = [];

    for (const item of classList) {
      const { className, classCode, description, teacher, branches } = item;

      if (!className?.trim()) {
        return NextResponse.json(
          { success: false, message: "มีบางรายการไม่ได้กรอกชื่อวิชา" },
          { status: 400 }
        );
      }

      if (!branches || branches.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: `วิชา ${className} ต้องมีอย่างน้อย 1 สาขา`,
          },
          { status: 400 }
        );
      }

      if (classCode) {
        const existing = await classes.findOne({
          classCode: classCode.trim(),
        });

        if (existing) {
          return NextResponse.json(
            {
              success: false,
              message: `รหัสวิชา ${classCode} มีอยู่แล้ว`,
            },
            { status: 400 }
          );
        }
      }

      const normalizedBranches: Branch[] = branches.map((b) =>
        typeof b === "string"
          ? { _id: "", name: b }
          : { _id: b._id || "", name: b.name }
      );

      const uniqueBranches = Array.from(
        new Map(
          normalizedBranches.map((b) => [b._id || b.name, b])
        ).values()
      );

      const newClass: ClassPayload = {
        className: className.trim(),
        branches: uniqueBranches,
        createdAt: new Date(),
      };

      if (classCode) newClass.classCode = classCode.trim();
      if (description) newClass.description = description.trim();

      if (teacher) {
        newClass.teacher =
          typeof teacher === "string"
            ? { _id: "", name: teacher }
            : { _id: teacher._id, name: teacher.name };
      }

      insertData.push(newClass);
    }

    const result = await classes.insertMany(insertData);

    return NextResponse.json(
      {
        success: true,
        message: `สร้างรายวิชาสำเร็จ ${result.insertedCount} รายการ`,
        data: insertData,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: number }).code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "รหัสวิชานี้มีอยู่แล้ว (duplicate)",
        },
        { status: 400 }
      );
    }

    console.error("CREATE CLASS ERROR:", error);

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