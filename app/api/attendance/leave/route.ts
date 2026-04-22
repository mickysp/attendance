import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type AttendanceDoc = {
  classId: ObjectId;
  studentId: string;
  academicYear: number;
  date: string;
  status: "มาเรียน" | "มาสาย" | "ลา";
};

const getNowTH = () =>
  new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Bangkok",
    })
  );

const getAcademicYear = () => new Date().getFullYear() + 543;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { classId, studentId } = body;

    if (!classId || !ObjectId.isValid(classId) || !studentId) {
      return NextResponse.json({
        success: false,
        message: "missing data",
      });
    }

    const client = await clientPromise;
    const db = client.db("attendance");

    const attendanceCol = db.collection<AttendanceDoc>("attendance");

    const nowTH = getNowTH();
    const today = nowTH.toISOString().split("T")[0];
    const academicYear = getAcademicYear();

    const classObjectId = new ObjectId(classId);

    const exist = await attendanceCol.findOne({
      classId: classObjectId,
      studentId,
      academicYear,
      date: today,
    });

    if (exist) {
      await attendanceCol.updateOne(
        { _id: exist._id },
        {
          $set: {
            status: "ลา",
            score: 1,
          },
        }
      );

      return NextResponse.json({
        success: true,
        message: "อัปเดตสถานะเป็นลาแล้ว",
      });
    }

    await attendanceCol.insertOne({
      classId: classObjectId,
      studentId,
      academicYear,
      date: today,
      status: "ลา",
    });

    return NextResponse.json({
      success: true,
      message: "บันทึกการลาเรียบร้อย",
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "error",
    });
  }
}