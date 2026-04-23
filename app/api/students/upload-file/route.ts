import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document } from "mongodb";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

type ExcelRow = Record<string, string | number | undefined>;

type ClassDoc = Document & {
  _id: ObjectId;
  name?: string;
  class_name?: string;
  className?: string;
  courseName?: string;
};

type MajorDoc = Document & {
  _id: ObjectId;
  name: string;
};

type StudentDoc = {
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
  section?: string;
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

const normalize = (text: unknown): string =>
  String(text || "").trim().toLowerCase().replace(/\s+/g, " ");

const getClassName = (c: ClassDoc): string =>
  c.name || c.class_name || c.className || c.courseName || "";

const getString = (v: unknown): string =>
  typeof v === "string" || typeof v === "number"
    ? String(v).trim()
    : "";

const getAcademicYear = () => new Date().getFullYear() + 543;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File;
    const classId = String(formData.get("classId"));
    const section = String(formData.get("section"));
    const majorInput = String(formData.get("major")).trim();

    const client = await clientPromise;
    const db = client.db("attendance");

    const studentsCol = db.collection<StudentDoc>("students");
    const studentClassesCol =
      db.collection<StudentClassDoc>("student_classes");
    const classesCol = db.collection<ClassDoc>("classes");
    const majorsCol = db.collection<MajorDoc>("majors");

    const classObjectId = new ObjectId(classId);

    const classData = await classesCol.findOne({
      _id: classObjectId,
    });

    if (!classData) {
      return NextResponse.json({ success: false, message: "ไม่พบวิชา" });
    }

    const className = getClassName(classData);

    const majors = await majorsCol.find().toArray();

    const major = majors.find((m) =>
      normalize(m.name).includes(normalize(majorInput))
    );

    if (!major) {
      return NextResponse.json({ success: false, message: "ไม่พบสาขา" });
    }

    const workbook = XLSX.read(Buffer.from(await file.arrayBuffer()));
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet);

    const academicYear = getAcademicYear();

    const parsed: StudentDoc[] = [];

    rows.forEach((row) => {
      const studentId = getString(row["รหัสนักศึกษา"]);
      const fullName = getString(row["ชื่อ-นามสกุล"]);
      const email =
        getString(row["email"]) || getString(row["อีเมล"]) || "";

      if (!studentId || !fullName) return;

      parsed.push({
        studentId,
        fullName,
        email: email || undefined,
        section,
        major: major.name,
        academicYear,
        createdAt: new Date(),
      });
    });

    const ids = parsed.map((s) => s.studentId);

    await Promise.all(
      parsed.map((s) =>
        studentsCol.updateOne(
          { studentId: s.studentId, academicYear },
          { $setOnInsert: s },
          { upsert: true }
        )
      )
    );

    const allStudents = await studentsCol
      .find({ studentId: { $in: ids }, academicYear })
      .toArray();

    const idMap = new Map(
      allStudents.map((s) => [s.studentId, s._id!])
    );

    const details: ResultItem[] = [];

    for (const s of parsed) {
      const sid = idMap.get(s.studentId)!;

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
        section,
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
    }

    return NextResponse.json({
      success: true,
      message: "นำเข้าข้อมูลสำเร็จ",
      summary: {
        total: parsed.length,
        added: details.filter((d) => d.relation === "added").length,
        exists: details.filter((d) => d.relation === "exists").length,
      },
      details,
    });

  } catch (err) {
    return NextResponse.json({
      success: false,
      message: err instanceof Error ? err.message : "error",
    });
  }
}