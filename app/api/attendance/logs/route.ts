import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type ThaiStatus = "มาเรียน" | "มาสาย" | "ลา";

type CheckInLog = {
  time: Date;
  timeText: string;
  photo?: string;
  location?: {
    lat: number;
    lng: number;
  };
};

type AttendanceDoc = {
  classId: ObjectId;
  studentId: string;
  status: ThaiStatus;
  score?: number;
  academicYear: number;
  date: string;
  checkInHour?: string;
  logs?: CheckInLog[];
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const classId = searchParams.get("classId");
    const studentId = searchParams.get("studentId");

    if (!classId || !ObjectId.isValid(classId) || !studentId) {
      return NextResponse.json({
        success: false,
        message: "missing params",
      });
    }

    const client = await clientPromise;
    const db = client.db("attendance");

    const attendanceCol = db.collection<AttendanceDoc>("attendance");

    const nowTH = new Date(
      new Date().toLocaleString("en-US", {
        timeZone: "Asia/Bangkok",
      })
    );

    const date =
      searchParams.get("date") ||
      nowTH.toISOString().split("T")[0];

    const academicYear =
      searchParams.get("year")
        ? Number(searchParams.get("year"))
        : new Date().getFullYear() + 543;

    const record = await attendanceCol.findOne({
      classId: new ObjectId(classId),
      studentId,
      academicYear,
      date,
    });

    if (!record) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบข้อมูล",
      });
    }

    const logs = [...(record.logs ?? [])].sort(
      (a, b) => a.time.getTime() - b.time.getTime()
    );

    return NextResponse.json({
      success: true,
      studentId: record.studentId,
      status: record.status,
      score: record.score ?? 0,
      checkInTime: record.checkInHour ?? null,
      academicYear,
      totalLogs: logs.length,
      logs,
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "error",
    });
  }
}