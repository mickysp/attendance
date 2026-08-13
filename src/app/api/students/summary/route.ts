import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Filter } from "mongodb";

import type { StudentDocument, StudentClassDocument } from "@/types/students";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const className = searchParams.get("class");
    const major = searchParams.get("major");
    const section = searchParams.get("section");
    const keyword = searchParams.get("keyword");

    const academicYearParam = searchParams.get("academicYear");

    const currentYear = new Date().getFullYear() + 543;

    const academicYear = academicYearParam
      ? Number(academicYearParam)
      : currentYear;

    const page = Number(searchParams.get("page") || 1);

    const limit = Number(searchParams.get("limit") || 20);

    const skip = (page - 1) * limit;

    const client = await clientPromise;

    const db = client.db("attendance");

    const studentsCol = db.collection<StudentDocument>("students");

    const studentClassesCol =
      db.collection<StudentClassDocument>("student_classes");

    const query: Filter<StudentDocument> = {
      academicYear,
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
      const relations = await studentClassesCol
        .find({
          className: {
            $regex: className,
            $options: "i",
          },
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
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        });
      }

      query.$and = [
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

    const students = await studentsCol
      .find(query)
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await studentsCol.countDocuments(query);

    const studentIds = students.map((s) => s._id!);

    const relations = await studentClassesCol
      .find({
        $or: [
          {
            studentId: {
              $in: studentIds,
            },
          },

          {
            studentId: {
              $in: studentIds.map((id) => id.toString()),
            },
          },
        ],
      })
      .toArray();

    const classMap = new Map<
      string,
      {
        className: string;
        section: string;
        academicYear: number;
      }[]
    >();

    relations.forEach((r) => {
      let studentKey = "";

      if (typeof r.studentId === "string") {
        const student = students.find((s) => s._id?.toString() === r.studentId);

        if (student) {
          studentKey = student._id!.toString();
        }
      } else {
        studentKey = r.studentId.toString();
      }

      if (!studentKey) return;

      if (!classMap.has(studentKey)) {
        classMap.set(studentKey, []);
      }

      const list = classMap.get(studentKey)!;

      const exists = list.some(
        (c) =>
          c.className === (r.className || "") &&
          c.section === (r.section || ""),
      );

      if (!exists) {
        list.push({
          className: r.className || "ไม่ทราบชื่อวิชา",

          section: r.section || "-",

          academicYear: r.academicYear || academicYear,
        });
      }
    });

    const data = students.map((s) => ({
      _id: s._id?.toString(),
      studentId: s.studentId,
      fullName: s.fullName,
      email: s.email || "",
      section: s.section,
      major: s.major,
      academicYear: s.academicYear,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      classes: classMap.get(s._id!.toString()) || [],
      classNames: (classMap.get(s._id!.toString()) || []).map(
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
        academicYear,
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
