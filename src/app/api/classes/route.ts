import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document } from "mongodb";

type MongoBranch = {
  _id?: ObjectId;
  name?: string;
};

type MongoTeacher = {
  _id?: ObjectId;
  name?: string;
};

type MongoClass = {
  _id: ObjectId;
  className?: string;
  classCode?: string;
  branches?: MongoBranch[];
  teacher?: MongoTeacher;
  isOpen?: boolean;
  createdAt?: Date;
  academicYear?: number;
};

type ScheduleDoc = {
  classId?: string;
  allowCheckIn?: boolean;
};

type Branch = {
  _id: string;
  name: string;
};

type Teacher = {
  _id: string;
  name: string;
};

type ClassResponse = {
  _id: string;
  className: string;
  classCode: string;
  academicYear?: number;
  teacher?: Teacher;
  branches: Branch[];
  isOpen?: boolean;
  createdAt?: Date;
  hasStudents?: boolean;
};

type StudentClassAgg = {
  _id: string;
};

export async function GET(req: Request) {
  try {
    const { searchParams } =
      new URL(req.url);

    const yearParam =
      searchParams.get("year");

    const academicYear =
      yearParam &&
      yearParam !== "" &&
      !Number.isNaN(
        Number(yearParam),
      )
        ? Number(yearParam)
        : null;

    const client =
      await clientPromise;

    const db =
      client.db("attendance");

    const classesCol =
      db.collection<MongoClass>(
        "classes",
      );

    const scheduleCol =
      db.collection<ScheduleDoc>(
        "schedule",
      );

    const studentClassesCol =
      db.collection<Document>(
        "student_classes",
      );

    const yearDocs =
      await studentClassesCol.distinct(
        "academicYear",
      );

    const years = yearDocs
      .filter(
        (y): y is number =>
          typeof y === "number",
      )
      .sort((a, b) => b - a);

    const allClasses =
      await classesCol
        .find({})
        .project({
          className: 1,
          classCode: 1,
          branches: 1,
          teacher: 1,
          isOpen: 1,
          createdAt: 1,
          academicYear: 1,
        })
        .sort({
          createdAt: -1,
        })
        .toArray();

    let filteredClasses =
      allClasses;

    if (academicYear) {
      const classIdsInYear =
        await studentClassesCol.distinct(
          "classId",
          {
            academicYear,
          },
        );

      const classIdSet =
        new Set(
          classIdsInYear.map(
            (id) =>
              String(id),
          ),
        );

      filteredClasses =
        allClasses.filter((c) =>
          classIdSet.has(
            c._id.toString(),
          ),
        );
    }

    const safeData: ClassResponse[] =
      filteredClasses.map((c) => ({
        _id:
          c._id?.toString() ?? "",

        className:
          c.className ?? "",

        classCode:
          c.classCode ?? "",

        academicYear:
          c.academicYear,

        teacher:
          c.teacher?._id
            ? {
                _id:
                  c.teacher._id.toString(),

                name:
                  c.teacher.name ??
                  "",
              }
            : undefined,

        branches:
          Array.isArray(
            c.branches,
          )
            ? c.branches.map(
                (b) => ({
                  _id:
                    b?._id
                      ? b._id.toString()
                      : "",

                  name:
                    b?.name ??
                    "",
                }),
              )
            : [],

        isOpen: c.isOpen,

        createdAt:
          c.createdAt,
      }));

    let openClasses = 0;
    let closedClasses = 0;

    safeData.forEach((c) => {
      if (c.isOpen) {
        openClasses++;
      } else {
        closedClasses++;
      }
    });

    const schedules =
      await scheduleCol
        .find({})
        .toArray();

    let allowCheckIn = 0;
    let notAllowCheckIn = 0;

    schedules.forEach((s) => {
      if (s.allowCheckIn) {
        allowCheckIn++;
      } else {
        notAllowCheckIn++;
      }
    });

    const studentClassDocs =
      await studentClassesCol
        .aggregate<StudentClassAgg>([
          {
            $match: {
              ...(academicYear
                ? {
                    academicYear,
                  }
                : {}),
            },
          },

          {
            $project: {
              classId: {
                $cond: [
                  {
                    $ifNull: [
                      "$classId",
                      false,
                    ],
                  },
                  {
                    $toString:
                      "$classId",
                  },
                  null,
                ],
              },
            },
          },

          {
            $match: {
              classId: {
                $ne: null,
              },
            },
          },

          {
            $group: {
              _id: "$classId",
            },
          },
        ])
        .toArray();

    const hasStudentClassIdSet =
      new Set<string>(
        studentClassDocs
          .map((a) => a._id)
          .filter(Boolean),
      );

    const enrichedData: ClassResponse[] =
      safeData.map((c) => ({
        ...c,

        hasStudents:
          hasStudentClassIdSet.has(
            c._id,
          ),
      }));

    return NextResponse.json(
      {
        success: true,

        years,

        summary: {
          totalClasses:
            safeData.length,

          openClasses,

          closedClasses,

          allowCheckIn,

          notAllowCheckIn,
        },

        data: enrichedData,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "API ERROR FULL:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        data: [],
        years: [],
        message:
          error instanceof Error
            ? error.message
            : "error",
      },
      { status: 500 },
    );
  }
}