import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type ThaiStatus = "มาเรียน" | "มาสาย" | "ลา";

type AttendanceDoc = {
  classId: ObjectId;
  studentId: string;
  status: ThaiStatus;
  date: string;
  academicYear: number;
};

type WeeklyItem = {
  week: string;
  present: number;
  late: number;
  leave: number;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    if (!classId || !ObjectId.isValid(classId)) {
      return NextResponse.json({
        success: false,
        message: "classId ไม่ถูกต้อง",
      });
    }

    const academicYear =
      searchParams.get("year")
        ? Number(searchParams.get("year"))
        : new Date().getFullYear() + 543;

    const client = await clientPromise;
    const db = client.db("attendance");

    const attendanceCol = db.collection<AttendanceDoc>("attendance");

    const records = await attendanceCol
      .find({
        classId: new ObjectId(classId),
        academicYear,
      })
      .toArray();

    const weekMap = new Map<string, WeeklyItem>();

    records.forEach((r) => {
      const week = r.date.slice(0, 7);

      if (!weekMap.has(week)) {
        weekMap.set(week, {
          week,
          present: 0,
          late: 0,
          leave: 0,
        });
      }

      const w = weekMap.get(week);

      if (!w) return;

      if (r.status === "มาเรียน") w.present++;
      if (r.status === "มาสาย") w.late++;
      if (r.status === "ลา") w.leave++;
    });

    return NextResponse.json({
      success: true,
      data: Array.from(weekMap.values()),
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "error",
    });
  }
}