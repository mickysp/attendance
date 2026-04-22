import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

type ClassDoc = {
  _id: string;
  name?: string;
  className?: string;
  title?: string;
  isOpen?: boolean;
  createdAt?: Date;
};

type ScheduleDoc = {
  classId?: string;
  allowCheckIn?: boolean;
};

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("attendance");

    const classesCol = db.collection<ClassDoc>("classes");
    const scheduleCol = db.collection<ScheduleDoc>("schedule");

    const data = await classesCol
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const totalClasses = data.length;

    let openClasses = 0;
    let closedClasses = 0;

    data.forEach((c) => {
      if (c.isOpen) openClasses++;
      else closedClasses++;
    });

    const schedules = await scheduleCol.find({}).toArray();

    let allowCheckIn = 0;
    let notAllowCheckIn = 0;

    schedules.forEach((s) => {
      if (s.allowCheckIn) allowCheckIn++;
      else notAllowCheckIn++;
    });

    return NextResponse.json(
      {
        success: true,
        summary: {
          totalClasses,
          openClasses,
          closedClasses,
          allowCheckIn,
          notAllowCheckIn,
        },
        data,
      },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "error",
      },
      { status: 500 }
    );
  }
}