import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const getAcademicYear = () =>
  new Date().getFullYear() + 543;

type ScheduleQuery = {
  classId: ObjectId | string;
  academicYear: number;
  date?: string;
};

type SessionDoc = {
  _id?: ObjectId;
  classId: ObjectId | string;
  className?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  lateAfter?: number;
  allowCheckIn?: boolean;
  isOpen?: boolean;
  academicYear?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const classId =
      searchParams.get("classId");

    const date =
      searchParams.get("date");

    const yearParam =
      searchParams.get("year");

    if (!classId) {
      return NextResponse.json({
        success: false,
        message: "missing classId",
        data: [],
      });
    }

    const academicYear = yearParam
      ? Number(yearParam)
      : getAcademicYear();

    const client = await clientPromise;

    const db = client.db("attendance");

    const sessionsCol =
      db.collection<SessionDoc>(
        "sessions",
      );

    const classFilter =
      ObjectId.isValid(classId)
        ? new ObjectId(classId)
        : classId;

    const query: ScheduleQuery = {
      classId: classFilter,
      academicYear,
    };

    if (date) {
      query.date = date;
    }

    const sessions =
      await sessionsCol
        .find(query)
        .sort({
          date: 1,
          startTime: 1,
        })
        .toArray();

    return NextResponse.json({
      success: true,
      academicYear,
      data: sessions,
    });
  } catch (error: unknown) {
    console.error(
      "GET SCHEDULE ERROR:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "unknown error";

    return NextResponse.json({
      success: false,
      message,
      data: [],
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      classId,
      className,

      date,

      startTime,
      endTime,

      lateAfter,

      allowCheckIn,
      isOpen,
    } = body;

    if (
      !classId ||
      !date ||
      !startTime ||
      !endTime
    ) {
      return NextResponse.json({
        success: false,
        message: "missing data",
      });
    }

    if (startTime >= endTime) {
      return NextResponse.json({
        success: false,
        message:
          "เวลาเริ่มเรียนต้องน้อยกว่าเวลาเลิกเรียน",
      });
    }

    const client = await clientPromise;

    const db = client.db("attendance");

    const sessionsCol =
      db.collection<SessionDoc>(
        "sessions",
      );

    const academicYear =
      getAcademicYear();

    const classFilter =
      ObjectId.isValid(classId)
        ? new ObjectId(classId)
        : classId;

    const result =
      await sessionsCol.updateOne(
        {
          classId: classFilter,
          date,
          academicYear,
        },
        {
          $set: {
            classId: classFilter,

            className:
              className || "",

            date,

            startTime,
            endTime,

            lateAfter:
              lateAfter ?? 15,

            allowCheckIn:
              allowCheckIn ?? true,

            isOpen:
              isOpen ?? true,

            academicYear,

            updatedAt: new Date(),
          },

          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        {
          upsert: true,
        },
      );

    const savedSession =
      await sessionsCol.findOne({
        classId: classFilter,
        date,
        academicYear,
      });

    return NextResponse.json({
      success: true,

      message:
        "บันทึกเวลาเช็คชื่อสำเร็จ",

      data: {
        sessionId:
          savedSession?._id,

        matchedCount:
          result.matchedCount,

        modifiedCount:
          result.modifiedCount,

        upsertedId:
          result.upsertedId,

        session: savedSession,
      },
    });
  } catch (error: unknown) {
    console.error(
      "POST SCHEDULE ERROR:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "unknown error";

    return NextResponse.json({
      success: false,
      message,
    });
  }
}