import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type ClassDoc = {
  _id: ObjectId;
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

type StudentClassDoc = {
  studentId: ObjectId;
  className: string;
  section?: string;
};

type SafeClassDoc = Omit<ClassDoc, "_id"> & {
  _id: string;
  hasStudents?: boolean;
};

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("attendance");

    const classesCol = db.collection<ClassDoc>("classes");
    const scheduleCol = db.collection<ScheduleDoc>("schedule");

    const studentClassesCol =
      db.collection<StudentClassDoc>("student_classes");

    const data = await classesCol
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const safeData: SafeClassDoc[] = data.map((c) => ({
      ...c,
      _id: c._id.toString(),
    }));

    const totalClasses = safeData.length;

    let openClasses = 0;
    let closedClasses = 0;

    safeData.forEach((c) => {
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

    const classNamesWithStudents =
      await studentClassesCol.distinct("className");

    const enrichedData: SafeClassDoc[] = safeData.map((c) => {
      const name = c.className || c.name || "";

      return {
        ...c,
        hasStudents: classNamesWithStudents.includes(name),
      };
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
        data: enrichedData,
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