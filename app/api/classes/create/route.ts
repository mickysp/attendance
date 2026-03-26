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
    const majors = db.collection<Branch>("majors");       
    const teachersCol = db.collection<Teacher>("teachers");

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

      const normalizedBranches: Branch[] = [];

      for (const b of branches) {
        if (typeof b === "string") {
          const major = await majors.findOne({ name: b });

          if (!major) {
            return NextResponse.json(
              { success: false, message: `ไม่พบสาขา ${b}` },
              { status: 400 }
            );
          }

          normalizedBranches.push({
            _id: major._id.toString(),
            name: major.name,
          });
        } else {
          normalizedBranches.push({
            _id: b._id,
            name: b.name,
          });
        }
      }

      let normalizedTeacher: Teacher | undefined;

      if (teacher) {
        if (typeof teacher === "string") {
          const t = await teachersCol.findOne({ name: teacher });

          if (!t) {
            return NextResponse.json(
              { success: false, message: `ไม่พบอาจารย์ ${teacher}` },
              { status: 400 }
            );
          }

          normalizedTeacher = {
            _id: t._id.toString(),
            name: t.name,
          };
        } else {
          normalizedTeacher = {
            _id: teacher._id,
            name: teacher.name,
          };
        }
      }

      const newClass: ClassPayload = {
        className: className.trim(),
        branches: normalizedBranches,
        createdAt: new Date(),
      };

      if (classCode) newClass.classCode = classCode.trim();
      if (description) newClass.description = description.trim();
      if (normalizedTeacher) newClass.teacher = normalizedTeacher;

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