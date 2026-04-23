import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "id ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("attendance");

    const studentsCol = db.collection("students");
    const studentClassesCol = db.collection("student_classes");

    const objectId = new ObjectId(id);

    const student = await studentsCol.findOne({ _id: objectId });

    if (!student) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลนักศึกษา" },
        { status: 404 }
      );
    }

    await studentsCol.deleteOne({ _id: objectId });

    await studentClassesCol.deleteMany({
      studentId: student.studentId,
    });

    return NextResponse.json({
      success: true,
      message: "ลบข้อมูลเรียบร้อย",
    });
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