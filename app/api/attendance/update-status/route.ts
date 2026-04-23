import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type ThaiStatus = "มาเรียน" | "มาสาย" | "ลา";

function getScore(status: ThaiStatus) {
  if (status === "มาเรียน") return 1;
  if (status === "มาสาย") return 0.5;
  if (status === "ลา") return 1;
  return 0;
}

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

    const {
      classId,
      studentId,
      status,
      date,
    } = body;
    
    if (!classId || !studentId || !status) {
      return NextResponse.json({
        success: false,
        message: "missing data",
      });
    }

    if (!ObjectId.isValid(classId)) {
      return NextResponse.json({
        success: false,
        message: "classId ไม่ถูกต้อง",
      });
    }

    const allowedStatus: ThaiStatus[] = ["มาเรียน", "มาสาย", "ลา"];

    if (!allowedStatus.includes(status)) {
      return NextResponse.json({
        success: false,
        message: "status ไม่ถูกต้อง",
      });
    }

    const client = await clientPromise;
    const db = client.db("attendance");

    const attendanceCol = db.collection("attendance");

    const classObjectId = new ObjectId(classId);
    const academicYear = getAcademicYear();

    const nowTH = getNowTH();

    const targetDate =
      date || nowTH.toLocaleDateString("en-CA");

    const score = getScore(status);

    const exist = await attendanceCol.findOne({
      classId: classObjectId,
      studentId,
      academicYear,
      date: targetDate,
    });

    if (exist) {
      await attendanceCol.updateOne(
        { _id: exist._id },
        {
          $set: {
            status,
            score,
            updatedBy: "teacher",
            updatedAt: nowTH,
          },
        }
      );

      return NextResponse.json({
        success: true,
        message: "อัปเดตสถานะเรียบร้อย",
        data: {
          studentId,
          status,
          score,
          date: targetDate,
        },
      });
    }

    await attendanceCol.insertOne({
      classId: classObjectId,
      studentId,
      academicYear,
      date: targetDate,
      status,
      score,
      createdBy: "teacher",
      createdAt: nowTH,
    });

    return NextResponse.json({
      success: true,
      message: "สร้างสถานะใหม่เรียบร้อย",
      data: {
        studentId,
        status,
        score,
        date: targetDate,
      },
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "error",
    });
  }
}