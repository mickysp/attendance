import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type ThaiStatus = "มาเรียน" | "มาสาย" | "ลา";

type AttendanceDoc = {
  classId: ObjectId;
  studentId: string;
  name?: string;
  status: ThaiStatus;
  score?: number;
  date: string;
  academicYear: number;
};

type StudentStat = {
  studentId: string;
  name?: string;
  total: number;
  present: number;
  score: number;
  percent: number;
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

    const map = new Map<string, StudentStat>();

    records.forEach((r) => {
      if (!map.has(r.studentId)) {
        map.set(r.studentId, {
          studentId: r.studentId,
          name: r.name,
          total: 0,
          present: 0,
          score: 0,
          percent: 0,
        });
      }

      const s = map.get(r.studentId)!;

      s.total++;
      if (r.status === "มาเรียน") s.present++;
      s.score += r.score ?? 0;
    });

    const students: StudentStat[] = Array.from(map.values()).map((s) => {
      const percent = s.total > 0 ? (s.present / s.total) * 100 : 0;

      return {
        ...s,
        percent,
      };
    });

    const sortedByScore = [...students].sort(
      (a, b) => b.score - a.score
    );

    const topScore = sortedByScore.slice(0, 5);
    const bottomScore = sortedByScore.slice(-5).reverse();

    const sortedByPercent = [...students].sort(
      (a, b) => b.percent - a.percent
    );

    const topPercent = sortedByPercent.slice(0, 5);
    const bottomPercent = sortedByPercent.slice(-5).reverse();

    return NextResponse.json({
      success: true,
      totalStudents: students.length,

      ranking: {
        score: {
          top: topScore,
          bottom: bottomScore,
        },
        percent: {
          top: topPercent,
          bottom: bottomPercent,
        },
      },
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "error",
    });
  }
}