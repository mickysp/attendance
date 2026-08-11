import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Filter, Document } from "mongodb";

import type { StudentDocument, StudentClassDocument } from "@/types/students";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const className = searchParams.get("class");
    const major = searchParams.get("major");
    const section = searchParams.get("section");
    const keyword = searchParams.get("keyword");

    const yearParam = searchParams.get("year");

    const currentYear = new Date().getFullYear() + 543;

    const selectedYear = yearParam ? Number(yearParam) : currentYear;

    const page = Number(searchParams.get("page") || 1);

    const limit = Number(searchParams.get("limit") || 20);

    const skip = (page - 1) * limit;

    const client = await clientPromise;

    const db = client.db("attendance");

    const studentsCol = db.collection<StudentDocument>("students");

    const studentClassesCol =
      db.collection<StudentClassDocument>("student_classes");

    const classesCol = db.collection<{
      _id: ObjectId;
      className?: string;
    }>("classes");

    const query: Filter<StudentDocument> = {
      academicYear: selectedYear,
    };

    if (section) {
      query.section = section;
    }

    if (major) {
      query.major = {
        $regex: major,
        $options: "i",
      };
    }

    if (keyword) {
      query.$or = [
        {
          studentId: {
            $regex: keyword,
            $options: "i",
          },
        },
        {
          fullName: {
            $regex: keyword,
            $options: "i",
          },
        },
      ];
    }

    if (className) {
      const matchedClasses = await classesCol
        .find({
          className: {
            $regex: className,
            $options: "i",
          },
        })
        .toArray();

      const classObjectIds = matchedClasses.map((c) => c._id);

      const relations = await studentClassesCol
        .find({
          $or: [
            {
              className: {
                $regex: className,
                $options: "i",
              },
            },
            {
              classId: {
                $in: classObjectIds,
              },
            },
            {
              classId: {
                $in: classObjectIds.map((id) => id.toString()),
              },
            },
          ],
        })
        .toArray();

      const studentObjectIds: ObjectId[] = [];

      const studentCodes: string[] = [];

      relations.forEach((r) => {
        if (typeof r.studentId === "string") {
          if (ObjectId.isValid(r.studentId)) {
            studentObjectIds.push(new ObjectId(r.studentId));
          } else {
            studentCodes.push(r.studentId);
          }
        } else {
          studentObjectIds.push(r.studentId);
        }
      });

      if (studentObjectIds.length === 0 && studentCodes.length === 0) {
        return NextResponse.json({
          success: true,
          students: [],
          count: 0,
        });
      }

      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            {
              _id: {
                $in: studentObjectIds,
              },
            },
            {
              studentId: {
                $in: studentCodes,
              },
            },
          ],
        },
      ];
    }

    const yearDocs = await studentsCol
      .aggregate<Document>([
        {
          $group: {
            _id: "$academicYear",
          },
        },
      ])
      .toArray();

    const years = yearDocs
      .map((y) => Number(y._id))
      .filter((y) => !Number.isNaN(y));

    if (!years.includes(currentYear)) {
      years.push(currentYear);
    }

    years.sort((a, b) => b - a);

    const students = await studentsCol
      .find(query)
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await studentsCol.countDocuments(query);

    const studentIds = students
      .map((s) => s._id)
      .filter((id): id is ObjectId => id instanceof ObjectId);

    const relations = await studentClassesCol
      .find({
        studentId: {
          $in: studentIds,
        },
      })
      .toArray();

    const classIds = relations
      .map((r) => r.classId)
      .filter(Boolean)
      .map((id) => id!.toString())
      .filter(ObjectId.isValid)
      .map((id) => new ObjectId(id));

    const classDocs = await classesCol
      .find({
        _id: {
          $in: classIds,
        },
      })
      .toArray();

    const classNameMap = new Map<string, string>();

    classDocs.forEach((c) => {
      classNameMap.set(c._id.toString(), c.className || "");
    });

    const classMap = new Map<
      string,
      {
        className: string;
        section: string;
        academicYear: number;
      }[]
    >();

    relations.forEach((r) => {
      const student = students.find(
        (s) => s._id?.toString() === r.studentId.toString(),
      );

      if (!student || !student._id) {
        return;
      }

      const key = student._id.toString();

      if (!classMap.has(key)) {
        classMap.set(key, []);
      }

      let finalClassName = r.className || "";

      if (!finalClassName && r.classId) {
        finalClassName = classNameMap.get(r.classId.toString()) || "";
      }

      if (!finalClassName) {
        finalClassName = "ไม่ทราบชื่อวิชา";
      }

      classMap.get(key)!.push({
        className: finalClassName,

        section: r.section || "-",

        academicYear: r.academicYear || student.academicYear || currentYear,
      });
    });

    const data = students.map((s) => ({
      _id: s._id?.toString() || "",
      studentId: s.studentId,
      fullName: s.fullName,
      email: s.email || "",
      section: s.section,
      major: s.major,
      academicYear: s.academicYear,
      createdAt: s.createdAt,
      classes: classMap.get(s._id?.toString() || "") || [],
      classNames: (classMap.get(s._id?.toString() || "") || []).map(
        (c) => c.className,
      ),
    }));

    return NextResponse.json({
      success: true,

      filters: {
        className,
        major,
        section,
        keyword,
        academicYear: selectedYear,
      },
      currentYear,
      years,
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
    console.error("GET STUDENTS ERROR:", error);

    return NextResponse.json(
      {
        success: false,

        message: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
      },
    );
  }
}
