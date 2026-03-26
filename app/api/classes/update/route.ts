import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

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

type UpdateClassPayload = {
  className?: string;
  classCode?: string;
  description?: string;
  teacher?: Teacher;
  branches?: Branch[];
  updatedAt?: Date;
};

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุ id" },
        { status: 400 },
      );
    }

    const body: IncomingClass = await req.json();

    const client = await clientPromise;
    const db = client.db("attendance");
    const classes = db.collection<UpdateClassPayload>("classes");

    const existing = await classes.findOne({
      _id: new ObjectId(id),
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลที่ต้องการแก้ไข" },
        { status: 404 },
      );
    }

    const { className, classCode, description, teacher, branches } = body;

    if (className !== undefined && !className.trim()) {
      return NextResponse.json(
        { success: false, message: "กรุณากรอกชื่อวิชา" },
        { status: 400 },
      );
    }

    if (branches !== undefined && branches.length === 0) {
      return NextResponse.json(
        { success: false, message: "ต้องมีอย่างน้อย 1 สาขา" },
        { status: 400 },
      );
    }

    if (classCode) {
      const duplicate = await classes.findOne({
        classCode: classCode.trim(),
        _id: { $ne: new ObjectId(id) },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            message: `รหัสวิชา ${classCode} มีอยู่แล้ว`,
          },
          { status: 400 },
        );
      }
    }

    const updateData: Partial<UpdateClassPayload> = {};

    if (className !== undefined) {
      updateData.className = className.trim();
    }

    if (classCode !== undefined) {
      updateData.classCode = classCode.trim();
    }

    if (description !== undefined) {
      updateData.description = description.trim();
    }

    if (teacher !== undefined) {
      const teachersCol = db.collection<Teacher>("teachers");

      if (typeof teacher === "string") {
        const t = await teachersCol.findOne({ name: teacher });

        if (!t) {
          return NextResponse.json(
            { success: false, message: `ไม่พบอาจารย์ ${teacher}` },
            { status: 400 },
          );
        }

        updateData.teacher = {
          _id: t._id.toString(),
          name: t.name,
        };
      } else {
        updateData.teacher = {
          _id: teacher._id,
          name: teacher.name,
        };
      }
    }

    if (branches !== undefined) {
      const majors = db.collection<Branch>("majors");

      const normalizedBranches: Branch[] = [];

      for (const b of branches) {
        if (typeof b === "string") {
          const major = await majors.findOne({ name: b });

          if (!major) {
            return NextResponse.json(
              { success: false, message: `ไม่พบสาขา ${b}` },
              { status: 400 },
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

      updateData.branches = normalizedBranches;
    }

    updateData.updatedAt = new Date();

    await classes.updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    return NextResponse.json({
      success: true,
      message: "อัปเดตรายวิชาสำเร็จ",
    });
  } catch (error: unknown) {
    console.error("UPDATE CLASS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
