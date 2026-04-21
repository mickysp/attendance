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

type ClassDoc = {
  _id: ObjectId;
  name?: string;
  className?: string;
  class_name?: string;
};

const getClassName = (c: ClassDoc): string =>
  c.name || c.className || c.class_name || "";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const keyword = searchParams.get("keyword") || "";
    const classNameFilter = searchParams.get("class") || "";
    const majorFilter = searchParams.get("major") || "";
    const sectionFilter = searchParams.get("section") || "";
    const yearFilter = searchParams.get("year") || "";

    const client = await clientPromise;
    const db = client.db("attendance");

    const studentsCol = db.collection<StudentDoc>("students");
    const classesCol = db.collection<ClassDoc>("classes");

    const allClasses = await classesCol.find().toArray();

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
      query.major = majorFilter;
    }

    if (yearFilter) {
      query.academicYear = Number(yearFilter);
    }

    const raw = await studentsCol
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    const data = raw.map((s) => {
      let className = s.className || "";

      if (!className && s.classId) {
        const found = allClasses.find(
          (c) => c._id.toString() === s.classId?.toString()
        );
        className = found ? getClassName(found) : "";
      }

      return {
        studentId: s.studentId,
        fullName: s.fullName,
        email: s.email,
        className,
        section: s.section,
        major: s.major || "",
        academicYear: s.academicYear || null,
        createdAt: s.createdAt,
      };
    });

    const filtered =
      classNameFilter
        ? data.filter((d) =>
            d.className
              .toLowerCase()
              .includes(classNameFilter.toLowerCase())
          )
        : data;

    return NextResponse.json(
      {
        success: true,
        count: filtered.length,
        data: filtered,
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