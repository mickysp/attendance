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

const getAcademicYear = () => {
  const nowTH = getNowTH();

  return nowTH.getFullYear() + 543;
};

const getDateTH = (date: Date) => {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Bangkok",
  }).format(date);
};

function createSessionDateTime(
  date: string,
  time: string,
) {
  return new Date(
    `${date}T${time}:00+07:00`,
  );
}

function getAttendanceStatus(session: {
  date: string;
  startTime: string;
  endTime: string;
  lateAfter: number;
}) {
  const now = getNowTH();

  const start =
    createSessionDateTime(
      session.date,
      session.startTime,
    );

  const end =
    createSessionDateTime(
      session.date,
      session.endTime,
    );

  const late = new Date(start);

  late.setMinutes(
    late.getMinutes() +
      session.lateAfter,
  );

  if (now < start) {
    return {
      success: false,
      message: "ยังไม่เปิดเช็คชื่อ",
    };
  }

  if (now > end) {
    return {
      success: false,
      message: "หมดเวลาเช็คชื่อแล้ว",
    };
  }

  if (now <= late) {
    return {
      success: true,
      status: "มาเรียน",
      score: 1,
    };
  }

  return {
    success: true,
    status: "มาสาย",
    score: 0.5,
  };
}

export async function POST(
  req: Request,
) {
  try {
    const body = await req.json();

    const {
      classId,
      sessionId,
      studentId,
      name,
      section,
      email,
    } = body;

    if (
      !classId ||
      !sessionId ||
      !studentId
    ) {
      return NextResponse.json({
        success: false,
        message: "missing data",
      });
    }

    if (
      !ObjectId.isValid(sessionId)
    ) {
      return NextResponse.json({
        success: false,
        message:
          "sessionId ไม่ถูกต้อง",
      });
    }

    const client =
      await clientPromise;

    const db =
      client.db("attendance");

    const sessionsCol =
      db.collection("sessions");

    const attendanceCol =
      db.collection("attendance");

    const studentsCol =
      db.collection("students");

    const studentClassesCol =
      db.collection(
        "student_classes",
      );

    const sessionObjectId =
      new ObjectId(sessionId);

    const session =
      await sessionsCol.findOne({
        _id: sessionObjectId,
      });

    if (!session) {
      return NextResponse.json({
        success: false,
        message:
          "ไม่พบข้อมูล session",
      });
    }

    console.log(
      JSON.stringify(
        session,
        null,
        2,
      ),
    );

    const nowTH = getNowTH();

    const todayTH =
      getDateTH(nowTH);

    console.log({
      todayTH,
      sessionDate:
        session.date,
      sessionId,
    });


    const sessionDate =
      new Date(
        `${session.date}T00:00:00+07:00`,
      );

    const todayDate =
      new Date(
        `${todayTH}T00:00:00+07:00`,
      );

    if (todayDate < sessionDate) {
      return NextResponse.json({
        success: false,
        message:
          "ยังไม่ถึงวันเรียน",
      });
    }

    if (todayDate > sessionDate) {
      return NextResponse.json({
        success: false,
        message:
          "หมดเวลาเช็คชื่อแล้ว กรุณาใช้ session ล่าสุด",
      });
    }

    if (
      !session.startTime ||
      !session.endTime
    ) {
      return NextResponse.json({
        success: false,
        message:
          "session ไม่มีเวลาเริ่มหรือเวลาสิ้นสุด",
      });
    }

    if (
      session.allowCheckIn ===
      false
    ) {
      return NextResponse.json({
        success: false,
        message:
          "อาจารย์ปิดการเช็คชื่อ",
      });
    }

    if (
      session.isOpen === false
    ) {
      return NextResponse.json({
        success: false,
        message:
          "session ยังไม่เปิดใช้งาน",
      });
    }

    const student =
      await studentsCol.findOne({
        studentId,
      });

    if (!student) {
      return NextResponse.json({
        success: false,
        message:
          "ไม่พบนักศึกษาในระบบ",
      });
    }

    const studentRelation =
      await studentClassesCol.findOne(
        {
          $and: [
            {
              $or: [
                {
                  studentId,
                },

                {
                  studentId:
                    student._id?.toString(),
                },

                {
                  studentId:
                    student._id,
                },
              ],
            },

            {
              $or: [
                {
                  classId,
                },

                {
                  classId:
                    session.classId?.toString(),
                },

                {
                  classId:
                    session.classId,
                },
              ],
            },
          ],
        },
      );

    if (!studentRelation) {
      return NextResponse.json({
        success: false,
        message:
          "นักศึกษาไม่ได้อยู่ในรายวิชานี้",
      });
    }

    const academicYear =
      getAcademicYear();

    const exist =
      await attendanceCol.findOne({
        sessionId:
          sessionObjectId,

        studentId,

        academicYear,
      });

    if (exist) {
      return NextResponse.json({
        success: false,
        message:
          "เช็คชื่อแล้ว",
      });
    }

    const attendanceResult =
      getAttendanceStatus({
        date: session.date,

        startTime:
          session.startTime,

        endTime:
          session.endTime,

        lateAfter:
          session.lateAfter ||
          15,
      });

    if (
      !attendanceResult.success
    ) {
      return NextResponse.json({
        success: false,
        message:
          attendanceResult.message,
      });
    }

    const insertData = {
      sessionId:
        sessionObjectId,

      classId:
        session.classId,

      className:
        session.className ||
        "",

      studentId,

      name:
        name ||
        student.fullName ||
        "",

      section:
        section ||
        student.section ||
        "",

      email:
        email ||
        student.email ||
        "",

      academicYear,

      date: session.date,

      checkInTime: nowTH,

      checkInHour:
        nowTH.toLocaleTimeString(
          "th-TH",
        ),

      status:
        attendanceResult.status,

      score:
        attendanceResult.score,

      createdAt: nowTH,

      updatedAt: nowTH,
    };

    console.log(insertData);

    await attendanceCol.insertOne(
      insertData,
    );

    return NextResponse.json({
      success: true,

      message:
        "เช็คชื่อสำเร็จ",

      data: {
        studentId,

        sessionId,

        sessionDate:
          session.date,

        checkInTime:
          nowTH,

        status:
          attendanceResult.status,

        score:
          attendanceResult.score,
      },
    });
  } catch (error) {
    console.error(
      "ATTENDANCE ERROR:",
      error,
    );

    return NextResponse.json({
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "error",
    });
  }
}