import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const studentId = searchParams.get("studentId");
    const className = searchParams.get("className");
    const section = searchParams.get("section");

    if (!studentId || !ObjectId.isValid(studentId)) {
      return NextResponse.json(
        { success: false, message: "studentId ไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    if (!className || !section) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลไม่ครบถ้วน" },
        { status: 400 },
      );
    }

    const client = await clientPromise;

    const db = client.db("attendance");

    const studentClassesCol = db.collection("student_classes");

    const result = await studentClassesCol.deleteOne({
      studentId: new ObjectId(studentId),
      className,
      section,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบข้อมูลรายวิชาที่ต้องการถอน",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "ถอนวิชาสำเร็จ",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}