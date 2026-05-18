import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const getAcademicYear = () => new Date().getFullYear() + 543;

type Session = {
  _id: ObjectId;
  classId: ObjectId;
  academicYear: number;
  date: string;
};

type Student = {
  studentId: string;
  fullName: string;
  section?: string;
  major?: string;
};

type Attendance = {
  studentId: string;
  sessionId: ObjectId;
  score?: number;
};

type SessionQuery = {
  classId: ObjectId;
  academicYear: number;
  _id?: ObjectId;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const classId = searchParams.get("classId");
    const sessionId = searchParams.get("sessionId");

    if (!classId) {
      return NextResponse.json({
        success: false,
        message: "missing classId",
      });
    }

    const client = await clientPromise;
    const db = client.db("attendance");

    const sessionsCol = db.collection<Session>("sessions");
    const attendanceCol = db.collection<Attendance>("attendance");
    const studentsCol = db.collection<Student>("students");

    const classObjectId = new ObjectId(classId);

    const sessionsQuery: SessionQuery = {
      classId: classObjectId,
      academicYear: getAcademicYear(),
    };

    if (sessionId) {
      sessionsQuery._id = new ObjectId(sessionId);
    }

    const sessions = await sessionsCol.find(sessionsQuery).toArray();

    const students = await studentsCol
      .find({ academicYear: getAcademicYear() })
      .toArray();

    const attendanceList = await attendanceCol
      .find({ classId: classObjectId })
      .toArray();

    const map = new Map<string, Attendance>();

    attendanceList.forEach((a) => {
      map.set(`${a.studentId}_${a.sessionId}`, a);
    });

    const result = students.map((s) => {
      let total = 0;
      let days = 0;

      sessions.forEach((session) => {
        const key = `${s.studentId}_${session._id}`;
        const att = map.get(key);

        if (att?.score !== undefined) {
          total += att.score;
          days++;
        }
      });

      return {
        studentId: s.studentId,
        name: s.fullName,
        section: s.section ?? "-",
        major: s.major ?? "-",

        totalScore: total,
        days,
        average: days > 0 ? total / days : 0,
      };
    });

    return NextResponse.json({
      success: true,
      sessions,
      data: result,
    });

  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "unknown error",
    });
  }
}