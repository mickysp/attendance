import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import nodemailer from "nodemailer";
import { ObjectId } from "mongodb";
import type { Attachment } from "nodemailer/lib/mailer";

const getNowTH = () =>
  new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Bangkok",
    }),
  );

const getAcademicYear = () => new Date().getFullYear() + 543;

function getStatus(now: Date, startTime: string, lateAfter: number) {
  const [h, m] = startTime.split(":").map(Number);

  const start = new Date(now);
  start.setHours(h, m, 0, 0);

  const late = new Date(start);
  late.setMinutes(late.getMinutes() + lateAfter);

  return now <= late ? "มาเรียน" : "มาสาย";
}

function getScore(status: "มาเรียน" | "มาสาย" | "ลา") {
  if (status === "มาเรียน") return 1;
  if (status === "มาสาย") return 0.5;
  if (status === "ลา") return 1;
  return 0;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { classId, sessionId, studentId, name, section, email } = body;

    if (!classId || !sessionId || !studentId) {
      return NextResponse.json({
        success: false,
        message: "missing data",
      });
    }

    const client = await clientPromise;
    const db = client.db("attendance");

    const sessionsCol = db.collection("sessions");
    const attendanceCol = db.collection("attendance");
    const studentsCol = db.collection("students");

    const sessionObjectId = new ObjectId(sessionId);

    const session = await sessionsCol.findOne({ _id: sessionObjectId });
    if (!session) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบ session",
      });
    }

    const student = await studentsCol.findOne({ studentId });
    if (!student) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบนักศึกษา",
      });
    }

    const nowTH = getNowTH();
    const today = session.date;
    const academicYear = getAcademicYear();

    const exist = await attendanceCol.findOne({
      sessionId: sessionObjectId,
      studentId,
      academicYear,
    });

    if (exist) {
      return NextResponse.json({
        success: false,
        message: "เช็คชื่อแล้ว",
      });
    }

    const status = getStatus(nowTH, session.startTime, session.lateAfter);
    const score = getScore(status);

    await attendanceCol.insertOne({
      sessionId: sessionObjectId,
      classId: session.classId,
      className: session.className,
      studentId,
      name,
      section,
      academicYear,
      date: today,
      checkInTime: nowTH,
      checkInHour: nowTH.toLocaleTimeString("th-TH"),
      status,
      score,
    });

    return NextResponse.json({
      success: true,
      message: "เช็คชื่อสำเร็จ",
      data: { studentId, status, score },
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "error",
    });
  }
}