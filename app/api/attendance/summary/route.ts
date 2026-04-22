import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type ThaiStatus =
  | "มาเรียน"
  | "มาสาย"
  | "ลา"
  | "ขาด"
  | "ยังไม่เช็คชื่อ";

type AttendanceDoc = {
  classId: ObjectId;
  studentId: string;
  status: ThaiStatus;
  score?: number;
  checkInHour?: string;
  checkInTime?: Date;
  date: string;
  academicYear: number;
};

type StudentDoc = {
  studentId: string;
  fullName?: string;
  section?: string;
};

const getNowTH = () =>
  new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Bangkok",
    })
  );

const getAcademicYear = () => new Date().getFullYear() + 543;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const classId = searchParams.get("classId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!classId || !ObjectId.isValid(classId)) {
      return NextResponse.json({
        success: false,
        message: "classId ไม่ถูกต้อง",
      });
    }

    const client = await clientPromise;
    const db = client.db("attendance");

    const studentsCol = db.collection<StudentDoc>("students");
    const attendanceCol = db.collection<AttendanceDoc>("attendance");
    const scheduleCol = db.collection("schedule");

    const classObjectId = new ObjectId(classId);

    const nowTH = getNowTH();

    const today = nowTH.toLocaleDateString("en-CA");

    const academicYear = getAcademicYear();

    const dateFilter: string | { $gte: string; $lte: string } =
      startDate && endDate
        ? { $gte: startDate, $lte: endDate }
        : today;

    const attendance = await attendanceCol
      .find({
        classId: classObjectId,
        academicYear,
        date: dateFilter,
      })
      .toArray();

    const schedule = await scheduleCol.findOne({
      classId: classObjectId,
    });

    const students = await studentsCol.find().toArray();

    const attendanceMap = new Map<string, AttendanceDoc[]>();

    attendance.forEach((a) => {
      if (!attendanceMap.has(a.studentId)) {
        attendanceMap.set(a.studentId, []);
      }
      attendanceMap.get(a.studentId)!.push(a);
    });

    const result = students.map((s) => {
      const records = attendanceMap.get(s.studentId) || [];

      if (startDate && endDate) {
        const sortedRecords = [...records].sort((a, b) =>
          a.date.localeCompare(b.date)
        );

        return {
          ...s,
          history: sortedRecords.map((r) => ({
            date: r.date,
            status: r.status,
            score: r.score ?? 0,
            checkInTime:
              r.checkInHour ||
              (r.checkInTime
                ? new Date(r.checkInTime).toLocaleTimeString("th-TH", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : null),
          })),
        };
      }

      const record = records[0];

      let status: ThaiStatus;
      let checkInTime: string | null = null;
      let score: number = 0;

      if (record) {
        status = record.status;
        score = record.score ?? 0;

        checkInTime =
          record.checkInHour ||
          (record.checkInTime
            ? new Date(record.checkInTime).toLocaleTimeString("th-TH", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : null);
      } else if (schedule && !schedule.allowCheckIn) {
        status = "ขาด";
        score = 0;
      } else {
        status = "ยังไม่เช็คชื่อ";
        score = 0;
      }

      return {
        ...s,
        status,
        score,
        checkInTime,
      };
    });

    return NextResponse.json({
      success: true,
      mode: startDate && endDate ? "history" : "today",
      count: result.length,
      data: result,
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "error",
    });
  }
}