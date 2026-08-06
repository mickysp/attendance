import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("attendance");
    const majors = db.collection("majors");

    const data = await majors
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: "กรุณากรอกชื่อสาขา" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("attendance");
    const majors = db.collection("majors");

    const exist = await majors.findOne({ name });

    if (exist) {
      return NextResponse.json(
        { success: false, message: "มีสาขานี้อยู่แล้ว" },
        { status: 400 }
      );
    }

    const newMajor = {
      name: name.trim(),
      createdAt: new Date(),
    };

    await majors.insertOne(newMajor);

    return NextResponse.json(
      {
        success: true,
        message: "เพิ่มสาขาสำเร็จ",
        data: newMajor,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}