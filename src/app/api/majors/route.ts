import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { CreateMajorBody, Major } from "@/types/majors";

interface MajorDocument {
  _id?: ObjectId;
  name: string;
  createdAt: Date;
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("attendance");

    const majors = db.collection<MajorDocument>("majors");

    const data = await majors.find({}).sort({ createdAt: -1 }).toArray();

    const safeData: Major[] = data.map((major) => ({
      _id: major._id?.toString(),
      name: major.name,
      createdAt: major.createdAt,
    }));

    return NextResponse.json(
      {
        success: true,
        data: safeData,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body: CreateMajorBody = await req.json();

    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณากรอกชื่อสาขา",
        },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("attendance");

    const majors = db.collection<MajorDocument>("majors");

    const exist = await majors.findOne({
      name,
    });

    if (exist) {
      return NextResponse.json(
        {
          success: false,
          message: "มีสาขานี้อยู่แล้ว",
        },
        { status: 400 },
      );
    }

    const newMajor: MajorDocument = {
      name,
      createdAt: new Date(),
    };

    const result = await majors.insertOne(newMajor);

    const data: Major = {
      _id: result.insertedId.toString(),
      name: newMajor.name,
      createdAt: newMajor.createdAt,
    };

    return NextResponse.json(
      {
        success: true,
        message: "เพิ่มสาขาสำเร็จ",
        data,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
      },
      { status: 500 },
    );
  }
}
