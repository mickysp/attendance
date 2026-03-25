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

type IncomingClass = {
  className?: string;
  classCode?: string;
  teacher?: Teacher;
  description?: string;
  branches?: Branch[];
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
        { status: 400 }
      );
    }

    const body: IncomingClass = await req.json();

    const client = await clientPromise;
    const db = client.db("attendance");
    const classes = db.collection("classes");

    const existing = await classes.findOne({ _id: new ObjectId(id) });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลที่ต้องการแก้ไข" },
        { status: 404 }
      );
    }

    const { className, classCode, description, teacher, branches } = body;

    if (className !== undefined && !className.trim()) {
      return NextResponse.json(
        { success: false, message: "กรุณากรอกชื่อวิชา" },
        { status: 400 }
      );
    }

    if (branches !== undefined && branches.length === 0) {
      return NextResponse.json(
        { success: false, message: "ต้องมีอย่างน้อย 1 สาขา" },
        { status: 400 }
      );
    }

    if (classCode) {
      const duplicate = await classes.findOne({
        classCode,
        _id: { $ne: new ObjectId(id) },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            message: `รหัสวิชา ${classCode} มีอยู่แล้ว`,
          },
          { status: 400 }
        );
      }
    }

    const updateData: Partial<UpdateClassPayload> = {};

    if (className !== undefined) updateData.className = className.trim();
    if (classCode !== undefined) updateData.classCode = classCode.trim();
    if (description !== undefined)
      updateData.description = description.trim();

    if (teacher !== undefined) {
      updateData.teacher = {
        _id: teacher._id,
        name: teacher.name,
      };
    }

    if (branches !== undefined) {
      const uniqueBranches: Branch[] = Array.from(
        new Map(
          branches.map((b) => [b._id, { _id: b._id, name: b.name }])
        ).values()
      );

      updateData.branches = uniqueBranches;
    }

    updateData.updatedAt = new Date();

    await classes.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    return NextResponse.json({
      success: true,
      message: "อัปเดตรายวิชาสำเร็จ",
    });
  } catch (error) {
    console.error("UPDATE CLASS ERROR:", error);

    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}