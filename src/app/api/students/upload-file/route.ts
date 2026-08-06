import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document } from "mongodb";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

type ExcelRow = Record<
  string,
  string | number | undefined
>;

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
  classId?: ObjectId;
  className: string;
  section?: string;
  academicYear?: number;
  createdAt?: Date;
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
  student?: {
    studentId?: string;
    fullName?: string;
    email?: string;
  };
  message: string;
};

const normalize = (
  text: unknown,
): string =>
  String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const getClassName = (
  c: ClassDoc,
): string =>
  c.name ||
  c.class_name ||
  c.className ||
  c.courseName ||
  "";

const getString = (
  v: unknown,
): string =>
  typeof v === "string" ||
  typeof v === "number"
    ? String(v).trim()
    : "";

const getAcademicYear = () =>
  new Date().getFullYear() + 543;

const isValidStudentId = (
  id: string,
) => /^\d{9}-\d$/.test(id);

const isValidName = (
  name: string,
) => /^(นาย|นาง|นางสาว)/.test(name);

const isValidEmail = (
  email: string,
) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email,
  );

export async function POST(
  req: Request,
) {
  try {
    const formData =
      await req.formData();

    const file = formData.get(
      "file",
    ) as File;

    const classId = String(
      formData.get("classId"),
    );

    const section = String(
      formData.get("section"),
    );

    const majorInput = String(
      formData.get("major"),
    ).trim();

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message:
            "กรุณาอัปโหลดไฟล์",
        },
        { status: 400 },
      );
    }

    if (
      !classId ||
      !ObjectId.isValid(classId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "classId ไม่ถูกต้อง",
        },
        { status: 400 },
      );
    }

    if (!section) {
      return NextResponse.json(
        {
          success: false,
          message:
            "กรุณาเลือก Section",
        },
        { status: 400 },
      );
    }

    if (!majorInput) {
      return NextResponse.json(
        {
          success: false,
          message:
            "กรุณาระบุสาขา",
        },
        { status: 400 },
      );
    }
    const client =
      await clientPromise;

    const db =
      client.db("attendance");

    const studentsCol =
      db.collection<StudentDoc>(
        "students",
      );

    const studentClassesCol =
      db.collection<StudentClassDoc>(
        "student_classes",
      );

    const classesCol =
      db.collection<ClassDoc>(
        "classes",
      );

    const majorsCol =
      db.collection<MajorDoc>(
        "majors",
      );

    const classObjectId =
      new ObjectId(classId);

    const classData =
      await classesCol.findOne({
        _id: classObjectId,
      });

    if (!classData) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบวิชา",
        },
        { status: 404 },
      );
    }

    const className =
      getClassName(classData);

    const majors =
      await majorsCol.find().toArray();

    const major = majors.find((m) =>
      normalize(m.name).includes(
        normalize(majorInput),
      ),
    );

    if (!major) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบสาขา",
        },
        { status: 404 },
      );
    }

    const workbook = XLSX.read(
      Buffer.from(
        await file.arrayBuffer(),
      ),
    );

    const sheet =
      workbook.Sheets[
        workbook.SheetNames[0]
      ];

    const rows =
      XLSX.utils.sheet_to_json<ExcelRow>(
        sheet,
      );

    const academicYear =
      getAcademicYear();


    const parsed: StudentDoc[] = [];

    const errors: ErrorItem[] = [];

    rows.forEach((row) => {
      const studentId = getString(
        row["รหัสนักศึกษา"],
      );

      const fullName = getString(
        row["ชื่อ-นามสกุล"],
      );

      const email =
        getString(row["email"]) ||
        getString(row["อีเมล"]) ||
        "";

      if (!studentId || !fullName) {
        errors.push({
          student: {
            studentId,
            fullName,
            email,
          },
          message: "ข้อมูลไม่ครบ",
        });

        return;
      }

      if (
        !isValidStudentId(studentId)
      ) {
        errors.push({
          student: {
            studentId,
            fullName,
            email,
          },
          message:
            "studentId ไม่ถูกต้อง",
        });

        return;
      }

      if (!isValidName(fullName)) {
        errors.push({
          student: {
            studentId,
            fullName,
            email,
          },
          message: "ชื่อไม่ถูกต้อง",
        });

        return;
      }

      if (
        email &&
        !isValidEmail(email)
      ) {
        errors.push({
          student: {
            studentId,
            fullName,
            email,
          },
          message:
            "email ไม่ถูกต้อง",
        });

        return;
      }

      parsed.push({
        studentId,
        fullName,
        email:
          email || undefined,
        section,
        major: major.name,
        academicYear,
        createdAt: new Date(),
      });
    });

    await Promise.all(
      parsed.map((s) =>
        studentsCol.updateOne(
          {
            studentId:
              s.studentId,
            academicYear,
          },
          {
            $setOnInsert: s,
          },
          {
            upsert: true,
          },
        ),
      ),
    );

    const ids = parsed.map(
      (s) => s.studentId,
    );

    const allStudents =
      await studentsCol
        .find({
          studentId: {
            $in: ids,
          },
          academicYear,
        })
        .toArray();

    const idMap = new Map<
      string,
      ObjectId
    >(
      allStudents.map((s) => [
        s.studentId,
        s._id!,
      ]),
    );

    const details: ResultItem[] = [];

    for (const s of parsed) {
      const sid = idMap.get(
        s.studentId,
      );

      if (!sid) continue;

      const exists =
        await studentClassesCol.findOne({
          studentId: sid,

          $or: [
            {
              classId:
                classObjectId,
              section,
            },
            {
              className,
              section,
            },
          ],
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
        classId: classObjectId,
        className,
        section,
        academicYear,
        createdAt: new Date(),
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
      message:
        "นำเข้าข้อมูลสำเร็จ",

      summary: {
        total: parsed.length,

        added: details.filter(
          (d) =>
            d.relation === "added",
        ).length,

        exists: details.filter(
          (d) =>
            d.relation === "exists",
        ).length,

        errors: errors.length,
      },

      details,

      errors,
    });
  } catch (err) {
    console.error(
      "IMPORT STUDENTS ERROR:",
      err,
    );

    return NextResponse.json({
      success: false,
      message:
        err instanceof Error
          ? err.message
          : "error",
    });
  }
}