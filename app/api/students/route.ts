import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Filter, ObjectId } from "mongodb";

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
  section?: string;
};

type ClassItem = {
  className: string;
  section?: string;
};

const getCurrentAcademicYear = (): number =>
  new Date().getFullYear() + 543;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const keyword = searchParams.get("keyword") || "";
    const classFilter = searchParams.get("class") || "";
    const majorFilter = searchParams.get("major") || "";
    const sectionFilter = searchParams.get("section") || "";
    const yearFilter = searchParams.get("year") || "";

    const client = await clientPromise;
    const db = client.db("attendance");

    const studentsCol = db.collection<StudentDoc>("students");
    const studentClassesCol =
      db.collection<StudentClassDoc>("student_classes");

    const query: Filter<StudentDoc> = {};

    if (keyword) {
      query.$or = [
        { fullName: { $regex: keyword, $options: "i" } },
        { studentId: { $regex: keyword, $options: "i" } },
      ];
    }

    if (sectionFilter) {
      query.section = sectionFilter;
    }

    if (majorFilter) {
      query.major = { $regex: majorFilter, $options: "i" };
    }

    const academicYear = yearFilter
      ? Number(yearFilter)
      : getCurrentAcademicYear();

    query.academicYear = academicYear;

    const students = await studentsCol
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    const studentIds = students.map((s) => s._id);

    const relations = await studentClassesCol
      .find({
        studentId: { $in: studentIds },
      })
      .toArray();

    const classMap = new Map<string, ClassItem[]>();

    relations.forEach((r) => {
      const key = r.studentId.toString();

      if (!classMap.has(key)) {
        classMap.set(key, []);
      }

      classMap.get(key)!.push({
        className: r.className,
        section: r.section,
      });
    });

    let data = students.map((s) => {
      const classes = classMap.get(s._id.toString()) || [];

      return {
        _id: s._id.toString(),
        studentId: s.studentId,
        fullName: s.fullName,
        email: s.email,
        classNames: classes.map((c) => c.className),
        classes: classes.map((c) => ({
          className: c.className,
          section: c.section,
          academicYear: s.academicYear,
        })),

        section: s.section,
        major: s.major || "",
        academicYear: s.academicYear || null,
        createdAt: s.createdAt,
      };
    });

    if (classFilter) {
      data = data.filter((d) =>
        d.classNames.some((c) =>
          c.toLowerCase().includes(classFilter.toLowerCase())
        )
      );
    }

    const yearsRaw = await studentsCol.distinct("academicYear");

    const years = (yearsRaw as number[])
      .filter(Boolean)
      .sort((a, b) => b - a);

    return NextResponse.json(
      {
        success: true,
        count: data.length,
        students: data,
        years,
        currentYear: getCurrentAcademicYear(),
      },
      { status: 200 }
    );

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