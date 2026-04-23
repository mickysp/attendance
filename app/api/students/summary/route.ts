import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Filter } from "mongodb";

type StudentDoc = {
  _id: ObjectId;
  studentId: string;
  fullName: string;
  email?: string;
  section: string;
  major?: string;
  academicYear?: number;
  createdAt: Date;
};

type StudentClassDoc = {
  studentId: ObjectId;
  className: string;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const className = searchParams.get("class");
    const major = searchParams.get("major");
    const section = searchParams.get("section");
    const keyword = searchParams.get("keyword");
    const academicYearParam = searchParams.get("academicYear");

    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db("attendance");

    const studentsCol = db.collection<StudentDoc>("students");
    const studentClassesCol =
      db.collection<StudentClassDoc>("student_classes");

    const query: Filter<StudentDoc> = {};

    query.academicYear = academicYearParam
      ? Number(academicYearParam)
      : new Date().getFullYear() + 543;

    if (section) {
      query.section = section;
    }

    if (major) {
      query.major = { $regex: major, $options: "i" };
    }

    if (keyword) {
      query.$or = [
        { studentId: { $regex: keyword, $options: "i" } },
        { fullName: { $regex: keyword, $options: "i" } },
      ];
    }

    if (className) {
      const relations = await studentClassesCol
        .find({
          className: { $regex: className, $options: "i" },
        })
        .toArray();

      const studentIds = relations.map((r) => r.studentId);

      if (studentIds.length === 0) {
        return NextResponse.json({
          success: true,
          students: [],
          count: 0,
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        });
      }

      query._id = { $in: studentIds };
    }

    const students = await studentsCol
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await studentsCol.countDocuments(query);

    const studentIds = students.map((s) => s._id);

    const relations = await studentClassesCol
      .find({ studentId: { $in: studentIds } })
      .toArray();

    const classMap = new Map<string, string[]>();

    relations.forEach((r) => {
      const key = r.studentId.toString();

      if (!classMap.has(key)) {
        classMap.set(key, []);
      }

      classMap.get(key)!.push(r.className);
    });

    const data = students.map((s) => ({
      studentId: s.studentId,
      fullName: s.fullName,
      email: s.email,
      classNames: classMap.get(s._id.toString()) || [],
      section: s.section,
      major: s.major || "",
      academicYear: s.academicYear || null,
      createdAt: s.createdAt,
    }));

    return NextResponse.json({
      success: true,
      filters: {
        className,
        major,
        section,
        keyword,
        academicYear: query.academicYear,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      count: data.length,
      students: data,
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