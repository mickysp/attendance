import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document } from "mongodb";

type IncomingStudent = {
  studentId?: string;
  fullName?: string;
  email?: string;
};

type UploadPayload = {
  classId?: string;
  section?: string;
  major?: string;
  students?: IncomingStudent[];
};

type StudentDoc = {
  _id?: ObjectId;
  studentId: string;
  fullName: string;
  email?: string;
  section: string;
  major: string;
  academicYear: number;
  createdAt: Date;
};

type StudentClassDoc = {
  studentId: ObjectId;
  className: string;
};

type ResultItem = {
  studentId: string;
  fullName: string;
  email?: string;
  section: string;
  major: string;
  className: string;
  status: "created" | "duplicate";
  relation: "added" | "exists";
};

type ErrorItem = {
  student?: IncomingStudent;
  message: string;
};

type ClassDoc = Document & {
  name?: string;
  className?: string;
  class_name?: string;
  courseName?: string;
};

type MajorDoc = Document & {
  name: string;
};

const isValidStudentId = (id: string) => /^\d{9}-\d$/.test(id);
const isValidName = (name: string) => /^(นาย|นาง|นางสาว)/.test(name);
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const getAcademicYear = () => new Date().getFullYear() + 543;

export async function POST(req: Request) {
  try {
    const body: UploadPayload = await req.json();
    const { classId, section, major, students } = body;

    if (!classId || !ObjectId.isValid(classId)) {
      return NextResponse.json(
        { success: false, message: "classId ไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    if (!section) {
      return NextResponse.json(
        { success: false, message: "กรุณาเลือก Section" },
        { status: 400 },
      );
    }

    if (!major) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุสาขา" },
        { status: 400 },
      );
    }

    if (!students || students.length === 0) {
      return NextResponse.json(
        { success: false, message: "ไม่มีข้อมูลนักศึกษา" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("attendance");

    const studentsCol = db.collection<StudentDoc>("students");
    const studentClassesCol = db.collection<StudentClassDoc>("student_classes");
    const classesCol = db.collection<ClassDoc>("classes");
    const majorsCol = db.collection<MajorDoc>("majors");

    const classObjectId = new ObjectId(classId);

    const classData = await classesCol.findOne({ _id: classObjectId });

    if (!classData) {
      return NextResponse.json(
        { success: false, message: "ไม่พบวิชา" },
        { status: 404 },
      );
    }

    const className =
      classData.name ||
      classData.className ||
      classData.class_name ||
      classData.courseName ||
      "";

    const majorExists = await majorsCol.findOne({ name: major });

    if (!majorExists) {
      return NextResponse.json(
        { success: false, message: "ไม่พบสาขา" },
        { status: 404 },
      );
    }

    const academicYear = getAcademicYear();

    const parsed: StudentDoc[] = [];
    const errors: ErrorItem[] = [];

    for (const s of students) {
      const studentId = s.studentId?.trim();
      const fullName = s.fullName?.trim();
      const email = s.email?.trim();

      if (!studentId || !fullName) {
        errors.push({ student: s, message: "ข้อมูลไม่ครบ" });
        continue;
      }

      if (!isValidStudentId(studentId)) {
        errors.push({ student: s, message: "studentId ไม่ถูกต้อง" });
        continue;
      }

      if (!isValidName(fullName)) {
        errors.push({ student: s, message: "ชื่อไม่ถูกต้อง" });
        continue;
      }

      if (email && !isValidEmail(email)) {
        errors.push({ student: s, message: "email ไม่ถูกต้อง" });
        continue;
      }

      parsed.push({
        studentId,
        fullName,
        email,
        section,
        major,
        academicYear,
        createdAt: new Date(),
      });
    }

    const ids = parsed.map((s) => s.studentId);

    await Promise.all(
      parsed.map((s) =>
        studentsCol.updateOne(
          { studentId: s.studentId, academicYear },
          { $setOnInsert: s },
          { upsert: true },
        ),
      ),
    );

    const allStudents = await studentsCol
      .find({ studentId: { $in: ids }, academicYear })
      .toArray();

    const idMap = new Map<string, ObjectId>(
      allStudents.map((s) => [s.studentId, s._id!]),
    );

    const details: ResultItem[] = [];

    for (const s of parsed) {
      const sid = idMap.get(s.studentId);

      if (!sid) continue;

      const exists = await studentClassesCol.findOne({
        studentId: sid,
        className,
      });

      if (exists) {
        details.push({
          studentId: s.studentId,
          fullName: s.fullName,
          email: s.email,
          section: s.section,
          major: s.major,
          className,
          status: "duplicate",
          relation: "exists",
        });
        continue;
      }

      await studentClassesCol.insertOne({
        studentId: sid,
        className,
      });

      details.push({
        studentId: s.studentId,
        fullName: s.fullName,
        email: s.email,
        section: s.section,
        major: s.major,
        className,
        status: "created",
        relation: "added",
      });

      const duplicateName = await studentsCol.findOne({
        fullName: s.fullName,
        academicYear,
      });

      if (duplicateName) {
        const hasSameClass = await studentClassesCol.findOne({
          studentId: duplicateName._id,
          className,
        });

        if (hasSameClass) {
          details.push({
            studentId: s.studentId,
            fullName: s.fullName,
            email: s.email,
            section: s.section,
            major: s.major,
            className,
            status: "duplicate",
            relation: "exists",
          });
          continue;
        }
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: parsed.length,
        added: details.filter((d) => d.relation === "added").length,
        exists: details.filter((d) => d.relation === "exists").length,
      },
      details,
      errors,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "error",
    });
  }
}
