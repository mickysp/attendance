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

    let present = 0;
    let late = 0;
    let leave = 0;

    records.forEach((r) => {
      if (r.status === "มาเรียน") present++;
      if (r.status === "มาสาย") late++;
      if (r.status === "ลา") leave++;
    });

    const total = records.length;

    const studentMap = new Map<
      string,
      { name?: string; total: number; present: number; score: number }
    >();

    records.forEach((r) => {
      if (!studentMap.has(r.studentId)) {
        studentMap.set(r.studentId, {
          name: r.name,
          total: 0,
          present: 0,
          score: 0,
        });
      }

      const s = studentMap.get(r.studentId)!;

      s.total++;
      if (r.status === "มาเรียน") s.present++;
      s.score += r.score ?? 0;
    });

    const students = Array.from(studentMap.entries()).map(
      ([studentId, s]) => {
        const percent = (s.present / s.total) * 100;

        return {
          studentId,
          name: s.name,
          percent,
          score: s.score,
        };
      }
    );

    const riskStudents = students.filter((s) => s.percent < 60);

    const avgScore =
      students.reduce((sum, s) => sum + s.score, 0) /
      (students.length || 1);

    const avgPercent =
      students.reduce((sum, s) => sum + s.percent, 0) /
      (students.length || 1);

    return NextResponse.json({
      success: true,
      academicYear,
      totalRecords: total,

      summary: {
        present,
        late,
        leave,
      },

      average: {
        score: avgScore,
        percent: avgPercent,
      },

      riskStudents,

      students,
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "error",
    });
  }
}