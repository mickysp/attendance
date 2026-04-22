import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type AttendanceDoc = {
  classId: ObjectId;
  studentId: string;
  name?: string;
  score?: number;
  date: string;
  academicYear: number;
};

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

    const attendanceCol = db.collection<AttendanceDoc>("attendance");

    const academicYear =
      searchParams.get("year")
        ? Number(searchParams.get("year"))
        : new Date().getFullYear() + 543;

    const dateFilter =
      startDate && endDate
        ? { $gte: startDate, $lte: endDate }
        : { $exists: true };

    const records = await attendanceCol
      .find({
        classId: new ObjectId(classId),
        academicYear,
        date: dateFilter,
      })
      .toArray();

    const scoreMap = new Map<
      string,
      { studentId: string; name?: string; totalScore: number; days: number }
    >();

    records.forEach((r) => {
      const current = scoreMap.get(r.studentId);

      if (!current) {
        scoreMap.set(r.studentId, {
          studentId: r.studentId,
          name: r.name,
          totalScore: r.score ?? 0,
          days: 1,
        });
      } else {
        current.totalScore += r.score ?? 0;
        current.days += 1;
      }
    });

    const result = Array.from(scoreMap.values()).map((s) => ({
      ...s,
      averageScore: s.totalScore / s.days,
    }));

    return NextResponse.json({
      success: true,
      academicYear,
      totalStudents: result.length,
      data: result,
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "error",
    });
  }
}