import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type ThaiStatus = "มาเรียน" | "มาสาย" | "ลา";

type CheckInLog = {
  time: Date | string;
  timeText: string;
  photo?: string;
  location?: {
    lat: number;
    lng: number;
  };
};

type AttendanceDoc = {
  _id: ObjectId;
  classId: ObjectId;
  studentId: string;
  name?: string;
  status: ThaiStatus;
  score?: number;
  date: string;
  academicYear: number;
  logs?: CheckInLog[];
};

type OverviewLogItem = {
  studentId: string;
  name?: string;
  status: ThaiStatus;
  score: number;
  time: string;
  timeObj: Date;
  photo?: string;
  location?: {
    lat: number;
    lng: number;
  };
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

    const client = await clientPromise;
    const db = client.db("attendance");

    const attendanceCol = db.collection<AttendanceDoc>("attendance");

    const nowTH = new Date(
      new Date().toLocaleString("en-US", {
        timeZone: "Asia/Bangkok",
      })
    );

    const today = nowTH.toLocaleDateString("en-CA");

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateFilter: string | { $gte: string; $lte: string } =
      startDate && endDate
        ? { $gte: startDate, $lte: endDate }
        : today;

    const academicYear =
      searchParams.get("year")
        ? Number(searchParams.get("year"))
        : new Date().getFullYear() + 543;

    const records = await attendanceCol
      .find({
        classId: new ObjectId(classId),
        academicYear,
        date: dateFilter,
      })
      .toArray();

    const allLogs: OverviewLogItem[] = records.flatMap((r) =>
      (r.logs ?? []).map((log) => {
        const timeObj =
          log.time instanceof Date
            ? log.time
            : new Date(log.time);

        return {
          studentId: r.studentId,
          name: r.name,
          status: r.status,
          score: r.score ?? 0,
          time: log.timeText,
          timeObj,
          photo: log.photo,
          location: log.location,
        };
      })
    );

    const sortedLogs = [...allLogs].sort(
      (a, b) => a.timeObj.getTime() - b.timeObj.getTime()
    );

    const cleanedLogs = sortedLogs.map(({ timeObj, ...rest }) => rest);

    return NextResponse.json({
      success: true,
      academicYear,
      totalStudents: records.length,
      totalLogs: cleanedLogs.length,
      logs: cleanedLogs,
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "error",
    });
  }
}