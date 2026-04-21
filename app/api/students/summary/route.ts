import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Filter } from "mongodb";

type StudentDoc = {
  studentId: string;
  fullName: string;
  email?: string;
  classId?: ObjectId;
  className?: string;
  section: string;
  major?: string;
  academicYear?: number;
  createdAt: Date;
};

const normalize = (text: string) =>
  text.trim().toLowerCase().replace(/\s+/g, " ");

const getCurrentAcademicYear = (): number =>
  new Date().getFullYear() + 543;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const classId = searchParams.get("classId");
    const className = searchParams.get("class");
    const major = searchParams.get("major");
    const section = searchParams.get("section");
    const academicYearParam = searchParams.get("academicYear");

    const client = await clientPromise;
    const db = client.db("attendance");
    const studentsCol = db.collection<StudentDoc>("students");

    const query: Filter<StudentDoc> = {};

    const academicYear = academicYearParam
      ? Number(academicYearParam)
      : getCurrentAcademicYear();

    query.academicYear = academicYear;

    if (classId) {
      if (!ObjectId.isValid(classId)) {
        return NextResponse.json(
          { success: false, message: "classId ไม่ถูกต้อง" },
          { status: 400 }
        );
      }

      query.classId = new ObjectId(classId);
    }

    else if (className) {
      query.className = {
        $regex: normalize(className),
        $options: "i",
      };
    }

    if (major) {
      query.major = {
        $regex: normalize(major),
        $options: "i",
      };
    }

    if (section) {
      query.section = section;
    }

    const students = await studentsCol
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      filters: {
        classId,
        className,
        major,
        section,
        academicYear,
      },
      count: students.length,
      students,
    });

  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}