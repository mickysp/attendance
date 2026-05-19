import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document } from "mongodb";

const getAcademicYear = () =>
  new Date().getFullYear() + 543;

type SessionQuery = {
  classId: ObjectId | string;
  academicYear: number;
  date?: string;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const classId = searchParams.get("classId");
    const date = searchParams.get("date");
    const yearParam = searchParams.get("year");

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
      db.collection<Document>("sessions");

    const classFilter = ObjectId.isValid(classId)
      ? new ObjectId(classId)
      : classId;

    const query: SessionQuery = {
      classId: classFilter,
      academicYear,
    };

    if (date) {
      query.date = date;
    }

    const sessions = await sessionsCol
      .find(query)
      .sort({ date: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      academicYear,
      data: sessions,
    });
  } catch (error: unknown) {
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

    const client = await clientPromise;

    const db = client.db("attendance");

    const sessionsCol =
      db.collection<Document>("sessions");

    const academicYear = getAcademicYear();

    const result = await sessionsCol.insertOne({
      classId: ObjectId.isValid(classId)
        ? new ObjectId(classId)
        : classId,

      className,

      date,

      startTime,
      endTime,

      lateAfter: lateAfter || 15,

      academicYear,

      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "สร้าง session สำเร็จ",
      data: {
        insertedId: result.insertedId,
      },
    });
  } catch (error: unknown) {
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