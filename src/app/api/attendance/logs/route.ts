import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type ThaiStatus = "มาเรียน" | "มาสาย" | "ลา" | "ขาด" | "ยังไม่เช็คชื่อ";

type CheckInLog = {
  date: string;
  time?: Date | string;
  timeText: string;
  status: ThaiStatus;
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

type SessionDoc = {
  _id?: ObjectId;
  classId: ObjectId | string;
  academicYear: number;
  date: string;
  startTime?: string;
  endTime?: string;
  lateAfter?: number;
  allowCheckIn?: boolean;
  isOpen?: boolean;
  className?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

const getNowTH = () =>
  new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Bangkok",
    }),
  );

const getAcademicYear = () => getNowTH().getFullYear() + 543;

function createSessionDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00+07:00`);
}

function isSessionEnded(session: SessionDoc) {
  if (!session.date || !session.endTime) {
    return false;
  }

  const now = getNowTH();

  const end = createSessionDateTime(session.date, session.endTime);

  return now > end;
}

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

    const sessionsCol = db.collection<SessionDoc>("sessions");

    const academicYear = searchParams.get("year")
      ? Number(searchParams.get("year"))
      : getAcademicYear();

    const classConditions: (string | ObjectId)[] = [classId];

    if (ObjectId.isValid(classId)) {
      classConditions.push(new ObjectId(classId));
    }

    const sessions = await sessionsCol
      .find({
        classId: {
          $in: classConditions,
        },

        academicYear,
      })
      .sort({
        date: -1,
        startTime: -1,
      })
      .toArray();

    const attendanceRecords = await attendanceCol
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

    const attendanceMap = new Map<string, AttendanceDoc>(
      attendanceRecords.map((record) => [String(record.sessionId), record]),
    );

    const logs: CheckInLog[] = sessions.map((session: SessionDoc) => {
      const attendance = attendanceMap.get(String(session._id));

      if (attendance) {
        return {
          date: attendance.date,

          time: attendance.createdAt,

          timeText: attendance.checkInHour || "-",

          status: attendance.status,

          score: attendance.score || 0,
        };
      }

      const ended = isSessionEnded(session);

      return {
        date: session.date,

        time: undefined,

        timeText: "-",

        status: ended ? "ขาด" : "ยังไม่เช็คชื่อ",

        score: 0,
      };
    });

    return NextResponse.json({
      success: true,

      studentId,

      academicYear,

      totalLogs: logs.length,

      logs,
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
