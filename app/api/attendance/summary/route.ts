import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import {
  ObjectId,
  Document,
} from "mongodb";

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

type SessionDoc = {
  _id?: ObjectId;
  classId: ObjectId | string;
  academicYear: number;
  date: string;
  startTime?: string;
  endTime?: string;
  lateAfter?: number;
  allowCheckIn?: boolean;
  isOpen?: boolean;
  className?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type AttendanceDoc = {
  _id?: ObjectId;
  sessionId?: ObjectId | string;
  classId: ObjectId | string;
  studentId: string;
  status: ThaiStatus;
  score?: number;
  academicYear: number;
  date: string;
  checkInHour?: string;
  checkInTime?: Date;
  createdAt?: Date;
};

type AttendanceAggregate = {
  _id: string;
  totalScore: number;
  days: number;
  lateDays: number;
  lastStatus?: ThaiStatus;
  lastAttendanceDate?: string;
  lastCheckInTime?: Date;
  lastCheckInHour?: string;
};

const getNowTH = () =>
  new Date(
    new Date().toLocaleString(
      "en-US",
      {
        timeZone:
          "Asia/Bangkok",
      },
    ),
  );

const getAcademicYear = () =>
  getNowTH().getFullYear() +
  543;

function createSessionDateTime(
  date: string,
  time: string,
) {
  return new Date(
    `${date}T${time}:00+07:00`,
  );
}

function isSessionEnded(
  session: SessionDoc,
) {
  if (
    !session.date ||
    !session.endTime
  ) {
    return false;
  }

  const now = getNowTH();

  const end =
    createSessionDateTime(
      session.date,
      session.endTime,
    );

  return now > end;
}

export async function GET(
  req: Request,
) {
  try {
    const { searchParams } =
      new URL(req.url);

    const classId =
      searchParams.get(
        "classId",
      );

    const yearParam =
      searchParams.get("year");

    if (!classId) {
      return NextResponse.json({
        success: false,
        message:
          "missing classId",
        data: [],
        majorsByClass: [],
      });
    }

    const academicYear =
      yearParam &&
      yearParam !== ""
        ? Number(yearParam)
        : getAcademicYear();

    const client =
      await clientPromise;

    const db =
      client.db("attendance");

    const attendanceCol =
      db.collection<AttendanceDoc>(
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
      db.collection<SessionDoc>(
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
        .map(
          (s) => s.studentId,
        )
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
        .sort({
          date: 1,
          startTime: 1,
        })
        .toArray();

    const totalSessions =
      sessions.length;

    const latestSession =
      sessions[
        sessions.length - 1
      ];

    const latestDate =
      latestSession?.date ||
      null;

    const endedSessions =
      sessions.filter(
        isSessionEnded,
      );

    const totalEndedSessions =
      endedSessions.length;

    const attendanceRecords =
      await attendanceCol
        .find({
          classId: {
            $in: classConditions,
          },

          academicYear,
        })
        .toArray();

    const attendanceSummary =
      await attendanceCol
        .aggregate<AttendanceAggregate>(
          [
            {
              $match: {
                classId: {
                  $in:
                    classConditions,
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

                lastStatus: {
                  $last:
                    "$status",
                },

                lastAttendanceDate:
                  {
                    $last:
                      "$date",
                  },

                lastCheckInTime:
                  {
                    $last:
                      "$checkInTime",
                  },

                lastCheckInHour:
                  {
                    $last:
                      "$checkInHour",
                  },
              },
            },
          ],
        )
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
      students.map(
        (student) => {
          const studentId =
            String(
              student.studentId ||
                "",
            );

          const summary =
            attendanceMap.get(
              studentId,
            );

          const attendedDays =
            summary?.days || 0;

          /**
           * นับขาดแบบราย session จริง
           * ถ้า session จบแล้ว
           * แต่ไม่มี attendance
           * = ขาด
           */
          const absentDays =
            endedSessions.filter(
              (session) => {
                return !attendanceRecords.find(
                  (
                    record,
                  ) =>
                    String(
                      record.studentId,
                    ) ===
                      studentId &&
                    String(
                      record.sessionId,
                    ) ===
                      String(
                        session._id,
                      ),
                );
              },
            ).length;

          let status: ThaiStatus =
            "ยังไม่เช็คชื่อ";

          if (
            summary?.lastStatus
          ) {
            status =
              summary.lastStatus;
          } else if (
            absentDays > 0
          ) {
            status = "ขาด";
          }

          return {
            studentId,

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
                      hour:
                        "2-digit",

                      minute:
                        "2-digit",
                    },
                  )
                : null),

            totalScore:
              summary?.totalScore ||
              0,

            days:
              attendedDays,

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
                    ).toFixed(
                      2,
                    ),
                  )
                : 0,
          };
        },
      );

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
                m &&
                  m !== "-",
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

      totalEndedSessions,

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