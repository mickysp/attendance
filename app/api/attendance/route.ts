import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import nodemailer from "nodemailer";
import { ObjectId } from "mongodb";
import type { Attachment } from "nodemailer/lib/mailer";

type CheckInLog = {
  time: Date;
  timeText: string;
  photo?: string;
  location?: { lat: number; lng: number };
};

type AttendanceDoc = {
  classId: ObjectId;
  className: string;
  name?: string;
  studentId: string;
  section?: string;
  email?: string;
  photo?: string;
  location?: { lat: number; lng: number };
  academicYear: number;
  checkInTime: Date;
  checkInHour?: string;
  status: "มาเรียน" | "มาสาย" | "ลา";
  score?: number;
  date: string;
  logs?: CheckInLog[];
  createdBy?: "student" | "teacher";
  createdAt?: Date;
  updatedBy?: "student" | "teacher";
  updatedAt?: Date;
};

type ScheduleDoc = {
  classId: ObjectId;
  className: string;
  startTime: string;
  lateAfter: number;
  isOpen: boolean;
  allowCheckIn: boolean;
};

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

const getNowTH = () =>
  new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Bangkok",
    }),
  );

const getAcademicYear = () => new Date().getFullYear() + 543;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { classId, name, studentId, section, email, location, photo } = body;

    if (!classId || !studentId) {
      return NextResponse.json({ success: false, message: "missing data" });
    }

    const client = await clientPromise;
    const db = client.db("attendance");

    const attendanceCol = db.collection<AttendanceDoc>("attendance");
    const scheduleCol = db.collection<ScheduleDoc>("schedule");
    const studentsCol = db.collection("students");
    const studentClassesCol = db.collection("student_classes");

    const classObjectId = new ObjectId(classId);

    const student = await studentsCol.findOne({ studentId });
    if (!student) {
      return NextResponse.json({
        success: false,
        message: "ไม่พบข้อมูลนักศึกษา",
      });
    }

    const schedule = await scheduleCol.findOne({ classId: classObjectId });
    if (!schedule) {
      return NextResponse.json({
        success: false,
        message: "ยังไม่ได้ตั้งเวลาเรียน",
      });
    }

    const relation = await studentClassesCol.findOne({
      studentId: student._id,
      className: schedule.className,
    });

    if (!relation) {
      return NextResponse.json({
        success: false,
        message: "นักศึกษาไม่ได้อยู่ในวิชานี้",
      });
    }

    if (!schedule.isOpen) {
      return NextResponse.json({ success: false, message: "ระบบปิด" });
    }

    if (!schedule.allowCheckIn) {
      return NextResponse.json({ success: false, message: "ปิดรับเช็คชื่อ" });
    }

    const nowTH = getNowTH();
    const today = nowTH.toISOString().split("T")[0];
    const academicYear = getAcademicYear();

    const exist = await attendanceCol.findOne({
      classId: classObjectId,
      studentId,
      academicYear,
      date: today,
    });

    if (exist && exist.status === "ลา") {
      return NextResponse.json({
        success: false,
        message: "สถานะเป็นลาแล้ว ไม่สามารถเช็คชื่อได้",
      });
    }

    if (exist) {
      const updatedScore = getScore(exist.status);

      await attendanceCol.updateOne({ _id: exist._id, academicYear }, [
        {
          $set: {
            score: updatedScore,
            updatedBy: "student",
            updatedAt: nowTH,
            logs: {
              $slice: [
                {
                  $concatArrays: [
                    { $ifNull: ["$logs", []] },
                    [
                      {
                        time: nowTH,
                        timeText: nowTH.toLocaleTimeString("th-TH"),
                        photo,
                        location,
                      },
                    ],
                  ],
                },
                -10,
              ],
            },
          },
        },
      ]);

      const updated = await attendanceCol.findOne({ _id: exist._id });

      return NextResponse.json({
        success: true,
        message: "บันทึกการกดซ้ำ (log)",
        data: {
          studentId,
          name,
          className: exist.className,
          status: exist.status,
          score: updated?.score ?? updatedScore,
          checkInTime: exist.checkInTime,
          checkInHour: exist.checkInHour,
          academicYear,
          totalLogs: updated?.logs?.length || 0,
          logs: updated?.logs || [],
        },
      });
    }

    const status = getStatus(nowTH, schedule.startTime, schedule.lateAfter);
    const score = getScore(status);

    await attendanceCol.insertOne({
      classId: classObjectId,
      className: schedule.className,
      name,
      studentId,
      section,
      email,
      photo,
      location,
      academicYear,
      checkInTime: nowTH,
      checkInHour: nowTH.toLocaleTimeString("th-TH"),
      status,
      score,
      date: today,
      logs: [
        {
          time: nowTH,
          timeText: nowTH.toLocaleTimeString("th-TH"),
          photo,
          location,
        },
      ],

      createdBy: "student",
      createdAt: nowTH,
    });

    const inserted = await attendanceCol.findOne({
      classId: classObjectId,
      studentId,
      academicYear,
      date: today,
    });

    if (email) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const statusColor = status === "มาเรียน" ? "#16a34a" : "#dc2626";

      const attachments: Attachment[] = [];

      if (photo) {
        const base64Data = photo.split(";base64,").pop() || "";
        attachments.push({
          filename: "photo.jpg",
          content: base64Data,
          encoding: "base64",
          cid: "userphoto",
        });
      }

      await transporter.sendMail({
        from: `"Attendance" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `เช็คชื่อสำเร็จ (${schedule.className})`,
        attachments,

        html: `
<div style="font-family: 'Noto Sans Thai', sans-serif; max-width: 520px; margin:auto; border:1px solid #eee; border-radius:12px; overflow:hidden">
  
  <div style="background:#2563eb; color:white; padding:16px; text-align:center;">
    <h2 style="margin:0;">เช็คชื่อสำเร็จ</h2>
    <p style="margin:4px 0 0;">${schedule.className}</p>
  </div>

  <div style="padding:16px; color:#333; font-size:14px;">
    
    <p>คุณได้ทำการเช็คชื่อเรียบร้อยแล้ว</p>

    <div style="background:#f9fafb; padding:12px; border-radius:8px; margin-top:10px;">
      
      <p>
        <b>สถานะ:</b>
        <span style="color:${statusColor}; font-weight:bold;">
          ${status}
        </span>
      </p>

      <p><b>ชื่อ:</b> ${name || "-"}</p>
      <p><b>รหัสนักศึกษา:</b> ${studentId}</p>
      <p><b>Section:</b> ${section || "-"}</p>
      <p><b>เวลา:</b> ${nowTH.toLocaleString("th-TH")}</p>

      ${
        location
          ? `<p><b>ตำแหน่ง:</b> ${location.lat}, ${location.lng}</p>`
          : ""
      }

    </div>

    ${
      photo
        ? `
        <div style="margin-top:16px; text-align:center;">
          <p style="margin-bottom:8px;"><b>รูปภาพที่บันทึก</b></p>
          <img src="cid:userphoto" style="width:200px; border-radius:8px;" />
        </div>
      `
        : ""
    }

  </div>

  <div style="background:#f3f4f6; text-align:center; padding:10px; font-size:12px; color:#666;">
    ระบบเช็คชื่ออัตโนมัติ
  </div>

</div>
`,
      });
    }

    return NextResponse.json({
      success: true,
      message: "เช็คชื่อสำเร็จ",
      data: {
        studentId,
        name,
        className: schedule.className,
        status,
        score,
        checkInTime: inserted?.checkInTime,
        checkInHour: inserted?.checkInHour,
        academicYear,
        totalLogs: inserted?.logs?.length || 1,
        logs: inserted?.logs || [],
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "error",
    });
  }
}
