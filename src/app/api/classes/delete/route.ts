import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุ id" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "รูปแบบ id ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("attendance");
    const classes = db.collection("classes");

    const objectId = new ObjectId(id);

    const existing = await classes.findOne({
      _id: objectId,
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลที่ต้องการลบ" },
        { status: 404 }
      );
    }

    await classes.deleteOne({
      _id: objectId,
    });

    return NextResponse.json({
      success: true,
      message: "ลบรายวิชาสำเร็จ",
    });
  } catch (error: unknown) {
    console.error("DELETE CLASS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}