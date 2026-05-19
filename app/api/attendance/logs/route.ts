import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type ThaiStatus = "มาเรียน" | "มาสาย" | "ลา" | "ขาด";

type CheckInLog = {
  time?: Date | string;
  timeText: string;
  status?: string;
  score?: number;
  photo?: string;
  location?: {
    lat: number;
    lng: number;
  };
};

type AttendanceDoc = {
  _id?: ObjectId;
  sessionId?: ObjectId | string;
  classId: ObjectId | string;
  studentId: string;
  status: ThaiStatus;
  score?: number;
  academicYear: number;

  date: string;
  checkInHour?: string;
  createdAt?: Date;
  logs?: CheckInLog[];
};

const getAcademicYear = () => new Date().getFullYear() + 543;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const classId = searchParams.get("classId");

    const studentId = searchParams.get("studentId");

    if (!classId || !studentId) {
      return NextResponse.json({
        success: false,
        message: "missing params",
        logs: [],
      });
    }

    const client = await clientPromise;

    const db = client.db("attendance");

    const attendanceCol = db.collection<AttendanceDoc>("attendance");

    const academicYear = searchParams.get("year")
      ? Number(searchParams.get("year"))
      : getAcademicYear();

    const classConditions: (string | ObjectId)[] = [classId];

    if (ObjectId.isValid(classId)) {
      classConditions.push(new ObjectId(classId));
    }

    const records = await attendanceCol
      .find({
        classId: {
          $in: classConditions,
        },

        studentId: {
          $in: [studentId, studentId.toString()],
        },

        academicYear,
      })
      .toArray();

    console.log("FOUND RECORDS:", records.length);

    if (!records.length) {
      return NextResponse.json({
        success: true,
        logs: [],
        totalLogs: 0,
      });
    }

    const logs = records.flatMap((record) => {
      if (Array.isArray(record.logs) && record.logs.length > 0) {
        return record.logs.map((log) => ({
          date: record.date,

          time: log.time || record.createdAt,

          timeText: log.timeText || record.checkInHour || "-",

          status: log.status || record.status,

          score: typeof log.score === "number" ? log.score : record.score || 0,

          photo: log.photo || undefined,

          location: log.location || undefined,
        }));
      }

      return [
        {
          date: record.date,
          time: record.createdAt,

          timeText: record.checkInHour || "-",

          status: record.status,

          score: record.score || 0,

          photo: undefined,

          location: undefined,
        },
      ];
    });

    const sortedLogs = logs.sort((a, b) => {
      const timeA = a.time ? new Date(a.time).getTime() : 0;

      const timeB = b.time ? new Date(b.time).getTime() : 0;

      return timeB - timeA;
    });

    return NextResponse.json({
      success: true,

      studentId,

      academicYear,

      totalLogs: sortedLogs.length,

      logs: sortedLogs,
    });
  } catch (error) {
    console.error("attendance logs error:", error);

    return NextResponse.json(
      {
        success: false,

        logs: [],

        message: error instanceof Error ? error.message : "error",
      },
      { status: 500 },
    );
  }
}
