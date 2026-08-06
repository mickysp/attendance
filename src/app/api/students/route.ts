import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Filter, Document } from "mongodb";

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
  studentId: ObjectId | string;
  classId?: ObjectId | string;
  className?: string;
  section?: string;
  academicYear?: number;
};

type ClassDoc = {
  _id: ObjectId;
  className?: string;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const className = searchParams.get("class");
    const major = searchParams.get("major");
    const section = searchParams.get("section");
    const keyword = searchParams.get("keyword");

    const yearParam = searchParams.get("year");

    const currentYear =
      new Date().getFullYear() + 543;

    const selectedYear = yearParam
      ? Number(yearParam)
      : currentYear;

    const page = Number(
      searchParams.get("page") || 1,
    );

    const limit = Number(
      searchParams.get("limit") || 20,
    );

    const skip = (page - 1) * limit;

    const client = await clientPromise;

    const db = client.db("attendance");

    const studentsCol =
      db.collection<StudentDoc>("students");

    const studentClassesCol =
      db.collection<StudentClassDoc>(
        "student_classes",
      );

    const classesCol =
      db.collection<ClassDoc>("classes");

    const query: Filter<StudentDoc> = {};

    query.academicYear = selectedYear;

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
      const matchedClasses =
        await classesCol
          .find({
            className: {
              $regex: className,
              $options: "i",
            },
          })
          .toArray();

      const classObjectIds =
        matchedClasses.map((c) => c._id);

      const relations =
        await studentClassesCol
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
                  $in: classObjectIds.map((id) =>
                    id.toString(),
                  ),
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
            studentObjectIds.push(
              new ObjectId(r.studentId),
            );
          } else {
            studentCodes.push(r.studentId);
          }
        } else {
          studentObjectIds.push(r.studentId);
        }
      });

      if (
        studentObjectIds.length === 0 &&
        studentCodes.length === 0
      ) {
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

          years: [currentYear],

          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },

          count: 0,

          students: [],
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
          $match: {
            academicYear: {
              $exists: true,
              $ne: null,
            },
          },
        },
        {
          $group: {
            _id: "$academicYear",
          },
        },
      ])
      .toArray();

    const years: number[] = yearDocs
      .map((y) => Number(y._id))
      .filter(
        (y): y is number =>
          !isNaN(y),
      );

    if (!years.includes(currentYear)) {
      years.push(currentYear);
    }

    years.sort((a, b) => {
      if (a === currentYear) return -1;
      if (b === currentYear) return 1;

      return b - a;
    });

    const students = await studentsCol
      .find(query)
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total =
      await studentsCol.countDocuments(query);

    const studentObjectIds = students.map(
      (s) => s._id,
    );

    const studentObjectIdStrings =
      studentObjectIds.map((id) =>
        id.toString(),
      );

    const studentCodes = students.map(
      (s) => s.studentId,
    );

    const relations =
      await studentClassesCol
        .find({
          $or: [
            {
              studentId: {
                $in: studentObjectIds,
              },
            },
            {
              studentId: {
                $in: studentObjectIdStrings,
              },
            },
            {
              studentId: {
                $in: studentCodes,
              },
            },
          ],
        })
        .toArray();

    const relationClassIds = relations
      .map((r) => r.classId)
      .filter(Boolean)
      .map((id) => id!.toString());

    const validClassIds = relationClassIds
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    const classDocs = await classesCol
      .find({
        _id: {
          $in: validClassIds,
        },
      })
      .toArray();

    const classNameMap = new Map<
      string,
      string
    >();

    classDocs.forEach((c) => {
      classNameMap.set(
        c._id.toString(),
        c.className || "",
      );
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
      let matchedStudent:
        | StudentDoc
        | undefined;

      matchedStudent = students.find((s) => {
        return (
          s._id.toString() ===
          r.studentId?.toString()
        );
      });

      if (!matchedStudent) {
        matchedStudent = students.find((s) => {
          return (
            s.studentId ===
            r.studentId?.toString()
          );
        });
      }

      if (!matchedStudent) return;

      const key =
        matchedStudent._id.toString();

      if (!classMap.has(key)) {
        classMap.set(key, []);
      }

      let finalClassName = "";

      if (
        r.className &&
        r.className.trim() !== ""
      ) {
        finalClassName =
          r.className.trim();
      } else if (r.classId) {
        finalClassName =
          classNameMap.get(
            r.classId.toString(),
          ) || "";
      }

      if (!finalClassName) {
        finalClassName =
          "ไม่ทราบชื่อวิชา";
      }

      const existingClasses =
        classMap.get(key) || [];

      const isDuplicate =
        existingClasses.some(
          (c) =>
            c.className ===
              finalClassName &&
            c.section ===
              (r.section || "") &&
            c.academicYear ===
              (r.academicYear ||
                matchedStudent?.academicYear),
        );

      if (!isDuplicate) {
        classMap.get(key)!.push({
          className: finalClassName,

          section: r.section || "-",

          academicYear:
            r.academicYear ||
            matchedStudent.academicYear ||
            currentYear,
        });
      }
    });

    const data = students.map((s) => ({
      _id: s._id.toString(),
      studentId: s.studentId,
      fullName: s.fullName,
      email: s.email || "",
      section: s.section,
      major: s.major || "",
      academicYear:
        s.academicYear || null,
      createdAt: s.createdAt,
      classes:
        classMap.get(
          s._id.toString(),
        ) || [],

      classNames:
        classMap
          .get(s._id.toString())
          ?.map((c) => c.className) ||
        [],
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
        totalPages: Math.ceil(
          total / limit,
        ),
      },

      count: data.length,

      students: data,
    });
  } catch (error: unknown) {
    console.error(
      "GET STUDENTS ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      },
    );
  }
}