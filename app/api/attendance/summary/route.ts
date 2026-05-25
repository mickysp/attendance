import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document } from "mongodb";

type ThaiStatus =
  | "มาเรียน"
  | "มาสาย"
  | "ลา"
  | "ขาด"
  | "ยังไม่เช็คชื่อ";

type AttendanceSummary = {
  studentId: string;
  name: string;
  email: string;
  section: string;
  major: string;
  status: ThaiStatus;
  score: number;
  attendanceDate: string | null;
  checkInTime: string | null;
  totalScore: number;
  days: number;
  absentDays: number;
  lateDays: number;
  averageScore: number;
};

const getAcademicYear = () =>
  new Date().getFullYear() + 543;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const classId =
      searchParams.get("classId");

    const yearParam =
      searchParams.get("year");

    if (!classId) {
      return NextResponse.json({
        success: false,
        message: "missing classId",
        data: [],
        majorsByClass: [],
      });
    }

    const academicYear =
      yearParam && yearParam !== ""
        ? Number(yearParam)
        : getAcademicYear();

    const client =
      await clientPromise;

    const db =
      client.db("attendance");

    const attendanceCol =
      db.collection<Document>(
        "attendance",
      );

    const studentClassesCol =
      db.collection<Document>(
        "student_classes",
      );

    const studentsCol =
      db.collection<Document>(
        "students",
      );

    const sessionsCol =
      db.collection<Document>(
        "sessions",
      );

    const classFilter =
      ObjectId.isValid(classId)
        ? new ObjectId(classId)
        : classId;

    const classConditions = [
      classFilter,
      classId,
    ];

    const studentClasses =
      await studentClassesCol
        .find({
          classId: {
            $in: classConditions,
          },

          academicYear,
        })
        .toArray();

    const studentObjectIds =
      studentClasses
        .map((s) => s.studentId)
        .filter(Boolean);

    const students =
      await studentsCol
        .find({
          _id: {
            $in: studentObjectIds,
          },
        })
        .toArray();

    const sessions =
      await sessionsCol
        .find({
          classId: {
            $in: classConditions,
          },

          academicYear,
        })
        .sort({ date: 1 })
        .toArray();

    const totalSessions =
      sessions.length;

    const latestSession =
      sessions[
        sessions.length - 1
      ];

    const latestDate =
      latestSession?.date || null;

    const attendanceSummary =
      await attendanceCol
        .aggregate([
          {
            $match: {
              classId: {
                $in: classConditions,
              },

              academicYear,
            },
          },

          {
            $sort: {
              date: 1,
              createdAt: 1,
            },
          },

          {
            $group: {
              _id: "$studentId",

              totalScore: {
                $sum: {
                  $ifNull: [
                    "$score",
                    0,
                  ],
                },
              },

              days: {
                $sum: 1,
              },

              lateDays: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$status",
                        "มาสาย",
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },

              absentRecords: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$status",
                        "ขาด",
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },

              lastStatus: {
                $last: "$status",
              },

              lastAttendanceDate:
                {
                  $last: "$date",
                },

              lastCheckInTime: {
                $last:
                  "$checkInTime",
              },

              lastCheckInHour: {
                $last:
                  "$checkInHour",
              },
            },
          },
        ])
        .toArray();

    const attendanceMap =
      new Map(
        attendanceSummary.map(
          (a) => [
            String(a._id),
            a,
          ],
        ),
      );

    const result: AttendanceSummary[] =
      students.map((student) => {
        const summary =
          attendanceMap.get(
            String(
              student.studentId,
            ),
          );

        const attendedDays =
          summary?.days || 0;

        const absentDays =
          Math.max(
            totalSessions -
              attendedDays,
            0,
          );

        let status: ThaiStatus =
          "ยังไม่เช็คชื่อ";

        if (
          summary?.lastStatus
        ) {
          status =
            summary.lastStatus;
        }

        else if (
          totalSessions > 0
        ) {
          status = "ขาด";
        }

        return {
          studentId:
            student.studentId ||
            "",

          name:
            student.fullName ||
            student.name ||
            "",

          email:
            student.email ||
            student.studentEmail ||
            "-",

          section:
            student.section ||
            "-",

          major:
            student.major ||
            student.branch ||
            "-",

          status,

          score:
            summary?.totalScore ||
            0,

          attendanceDate:
            summary?.lastAttendanceDate ||
            null,

          checkInTime:
            summary?.lastCheckInHour ||
            (summary?.lastCheckInTime
              ? new Date(
                  summary.lastCheckInTime,
                ).toLocaleTimeString(
                  "th-TH",
                  {
                    hour: "2-digit",
                    minute:
                      "2-digit",
                  },
                )
              : null),

          totalScore:
            summary?.totalScore ||
            0,

          days: attendedDays,

          absentDays,

          lateDays:
            summary?.lateDays ||
            0,

          averageScore:
            attendedDays > 0
              ? Number(
                  (
                    (summary?.totalScore ||
                      0) /
                    attendedDays
                  ).toFixed(2),
                )
              : 0,
        };
      });

    const majorsByClass = [
      ...new Set(
        result
          .map((r) =>
            r.major?.trim(),
          )
          .filter(
            (
              m,
            ): m is string =>
              Boolean(
                m && m !== "-",
              ),
          ),
      ),
    ].sort();

    return NextResponse.json({
      success: true,

      academicYear,

      latestSessionDate:
        latestDate,

      totalSessions,

      data: result,

      majorsByClass,
    });
  } catch (error) {
    console.error(
      "attendance summary error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        data: [],
        majorsByClass: [],
        message:
          error instanceof Error
            ? error.message
            : "error",
      },
      { status: 500 },
    );
  }
}