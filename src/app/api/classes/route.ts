import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type {
  ClassResponse,
  MongoClassDocument,
  ScheduleDocument,
  StudentClassAggregate,
} from "@/types/classes";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const yearParam = searchParams.get("year");

    const academicYear =
      yearParam && yearParam.trim() !== "" && !Number.isNaN(Number(yearParam))
        ? Number(yearParam)
        : null;

    const client = await clientPromise;

    const db = client.db("attendance");

    const classesCol = db.collection<MongoClassDocument>("classes");

    const scheduleCol = db.collection<ScheduleDocument>("sessions");

    const studentClassesCol = db.collection("student_classes");

    const yearDocs = await studentClassesCol.distinct("academicYear");

    const years = yearDocs
      .filter(
        (year): year is number =>
          typeof year === "number" && Number.isFinite(year),
      )
      .sort((a, b) => b - a);

    const allClasses = await classesCol
      .find({})
      .project<MongoClassDocument>({
        className: 1,
        classCodes: 1,
        teacher: 1,
        description: 1,
        isOpen: 1,
        createdAt: 1,
        updatedAt: 1,
        academicYear: 1,
      })
      .sort({
        createdAt: -1,
      })
      .toArray();

    let filteredClasses = allClasses;

    if (academicYear !== null) {
      const classIdsInYear = await studentClassesCol.distinct("classId", {
        academicYear,
      });

      const classIdSet = new Set<string>();

      classIdsInYear.forEach((id: unknown) => {
        if (id instanceof ObjectId) {
          classIdSet.add(id.toString());

          return;
        }

        if (typeof id === "string" && id.trim() !== "") {
          classIdSet.add(id.toString());
        }
      });

      filteredClasses = allClasses.filter((item) =>
        classIdSet.has(item._id.toString()),
      );
    }

    const safeData: ClassResponse[] = filteredClasses.map((item) => {
      let teacher:
        | {
            _id: string;
            name: string;
          }
        | undefined;

      if (
        item.teacher &&
        typeof item.teacher === "object" &&
        item.teacher._id
      ) {
        teacher = {
          _id: item.teacher._id.toString(),

          name: typeof item.teacher.name === "string" ? item.teacher.name : "",
        };
      }

      const classCodes = Array.isArray(item.classCodes)
        ? item.classCodes.map((classCode) => ({
            code: typeof classCode.code === "string" ? classCode.code : "",

            section:
              typeof classCode.section === "number" ? classCode.section : 1,

            branches: Array.isArray(classCode.branches)
              ? classCode.branches.map((branch) => ({
                  _id: branch?._id ? branch._id.toString() : "",

                  name: typeof branch?.name === "string" ? branch.name : "",
                }))
              : [],
          }))
        : [];

      return {
        _id: item._id.toString(),

        className: typeof item.className === "string" ? item.className : "",

        academicYear:
          typeof item.academicYear === "number" ? item.academicYear : undefined,

        teacher,

        classCodes,

        isOpen: typeof item.isOpen === "boolean" ? item.isOpen : undefined,

        createdAt: item.createdAt,
      };
    });

    let openClasses = 0;

    let closedClasses = 0;

    safeData.forEach((item) => {
      if (item.isOpen === true) {
        openClasses++;
      } else {
        closedClasses++;
      }
    });

    const scheduleQuery =
      academicYear !== null
        ? {
            academicYear,
          }
        : {};

    const schedules = await scheduleCol.find(scheduleQuery).toArray();

    let allowCheckIn = 0;

    let notAllowCheckIn = 0;

    schedules.forEach((schedule) => {
      if (schedule.allowCheckIn === true) {
        allowCheckIn++;
      } else {
        notAllowCheckIn++;
      }
    });

    const studentClassDocs = await studentClassesCol
      .aggregate<StudentClassAggregate>([
        {
          $match:
            academicYear !== null
              ? {
                  academicYear,
                }
              : {},
        },
        {
          $project: {
            classId: {
              $cond: [
                {
                  $ifNull: ["$classId", false],
                },

                {
                  $toString: "$classId",
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

    const hasStudentClassIdSet = new Set<string>();

    studentClassDocs.forEach((item) => {
      if (typeof item._id === "string" && item._id.trim() !== "") {
        hasStudentClassIdSet.add(item._id);
      }
    });

    const enrichedData: ClassResponse[] = safeData.map((item) => ({
      ...item,

      hasStudents: hasStudentClassIdSet.has(item._id),
    }));

    return NextResponse.json(
      {
        success: true,
        years,
        summary: {
          totalClasses: enrichedData.length,
          openClasses,
          closedClasses,
          allowCheckIn,
          notAllowCheckIn,
        },

        data: enrichedData,
      },
      {
        status: 200,
      },
    );
  } catch (error: unknown) {
    console.error("GET CLASSES ERROR:", error);

    const message = error instanceof Error ? error.message : "error";

    return NextResponse.json(
      {
        success: false,
        data: [],
        years: [],
        summary: {
          totalClasses: 0,
          openClasses: 0,
          closedClasses: 0,
          allowCheckIn: 0,
          notAllowCheckIn: 0,
        },

        message,
      },
      {
        status: 500,
      },
    );
  }
}
