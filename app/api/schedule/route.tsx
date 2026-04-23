import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type ScheduleDoc = {
  classId: ObjectId;
  className: string;
  startTime: string;
  lateAfter: number;
  isOpen: boolean;
  allowCheckIn: boolean;
  updatedAt: Date;
};

const isValidTime = (time: string) =>
  /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { classId, startTime, lateAfter, isOpen, allowCheckIn } = body;

    if (!classId || !startTime) {
      return NextResponse.json({ success: false, message: "missing data" });
    }

    if (!ObjectId.isValid(classId)) {
      return NextResponse.json({ success: false, message: "classId ไม่ถูกต้อง" });
    }

    if (!isValidTime(startTime)) {
      return NextResponse.json({ success: false, message: "เวลาไม่ถูกต้อง" });
    }

    const client = await clientPromise;
    const db = client.db("attendance");

    const classCol = db.collection("classes");
    const scheduleCol = db.collection<ScheduleDoc>("schedule");

    const classObjectId = new ObjectId(classId);

    const classData = await classCol.findOne({ _id: classObjectId });

    if (!classData) {
      return NextResponse.json({ success: false, message: "ไม่พบวิชา" });
    }

    const className =
      classData.name ||
      classData.className ||
      classData.title ||
      "ไม่พบชื่อวิชา";

    const data: ScheduleDoc = {
      classId: classObjectId,
      className,
      startTime,
      lateAfter: Number(lateAfter ?? 15),
      isOpen: isOpen ?? true,
      allowCheckIn: allowCheckIn ?? true,
      updatedAt: new Date(),
    };

    await scheduleCol.updateOne(
      { classId: classObjectId },
      { $set: data },
      { upsert: true }
    );

    return NextResponse.json({ success: true, schedule: data });

  } catch {
    return NextResponse.json({ success: false, message: "error" });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    if (!classId || !ObjectId.isValid(classId)) {
      return NextResponse.json({ success: false, message: "classId ไม่ถูกต้อง" });
    }

    const client = await clientPromise;
    const db = client.db("attendance");

    const scheduleCol = db.collection<ScheduleDoc>("schedule");

    const schedule = await scheduleCol.findOne({
      classId: new ObjectId(classId),
    });

    return NextResponse.json({
      success: true,
      schedule,
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: "error" });
  }
}