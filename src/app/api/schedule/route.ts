import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

import type {
  ScheduleDocument,
  ScheduleQuery,
  CreateScheduleBody,
} from "@/types/schedule";

const getAcademicYear = (): number => {
  return new Date().getFullYear() + 543;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const classId = searchParams.get("classId");
    const date = searchParams.get("date");
    const yearParam = searchParams.get("year");

    if (!classId) {
      return NextResponse.json(
        {
          success: false,
          message: "missing classId",
          data: [],
        },
        {
          status: 400,
        },
      );
    }

    const parsedYear = yearParam ? Number(yearParam) : getAcademicYear();

    const academicYear = Number.isFinite(parsedYear)
      ? parsedYear
      : getAcademicYear();

    const client = await clientPromise;

    const db = client.db("attendance");

    const sessionsCol = db.collection<ScheduleDocument>("sessions");

    const classFilter = ObjectId.isValid(classId)
      ? new ObjectId(classId)
      : classId;

    const query: ScheduleQuery = {
      classId: classFilter,
      academicYear,
    };

    if (date) {
      query.date = date;
    }

    const sessions = await sessionsCol
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
    console.error("GET SCHEDULE ERROR:", error);

    const message = error instanceof Error ? error.message : "unknown error";

    return NextResponse.json(
      {
        success: false,
        message,
        data: [],
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body: CreateScheduleBody = await req.json();

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

    if (!classId || !date || !startTime || !endTime) {
      return NextResponse.json(
        {
          success: false,
          message: "missing data",
        },
        {
          status: 400,
        },
      );
    }

    if (startTime >= endTime) {
      return NextResponse.json(
        {
          success: false,
          message: "เวลาเริ่มเรียนต้องน้อยกว่าเวลาเลิกเรียน",
        },
        {
          status: 400,
        },
      );
    }

    if (
      lateAfter !== undefined &&
      (!Number.isFinite(lateAfter) || lateAfter < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "lateAfter ไม่ถูกต้อง",
        },
        {
          status: 400,
        },
      );
    }

    const client = await clientPromise;

    const db = client.db("attendance");

    const sessionsCol = db.collection<ScheduleDocument>("sessions");

    const academicYear = getAcademicYear();

    const classFilter = ObjectId.isValid(classId)
      ? new ObjectId(classId)
      : classId;

    const now = new Date();

    const result = await sessionsCol.updateOne(
      {
        classId: classFilter,
        date,
        academicYear,
      },
      {
        $set: {
          classId: classFilter,
          className: className?.trim() || "",
          date,
          startTime,
          endTime,
          lateAfter: lateAfter ?? 15,
          allowCheckIn: allowCheckIn ?? true,
          isOpen: isOpen ?? true,
          academicYear,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      {
        upsert: true,
      },
    );

    const savedSession = await sessionsCol.findOne({
      classId: classFilter,
      date,
      academicYear,
    });

    return NextResponse.json(
      {
        success: true,

        message: "บันทึกเวลาเช็คชื่อสำเร็จ",

        data: {
          sessionId: savedSession?._id,
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
          upsertedId: result.upsertedId,
          session: savedSession,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error: unknown) {
    console.error("POST SCHEDULE ERROR:", error);

    const message = error instanceof Error ? error.message : "unknown error";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status: 500,
      },
    );
  }
}
