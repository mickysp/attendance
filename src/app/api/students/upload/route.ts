import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

import type {
  UploadStudentsBody,
  StudentDocument,
  StudentClassDocument,
  StudentResultItem,
  StudentErrorItem,
  MajorDocument,
} from "@/types/students";

import type { ClassDocument } from "@/types/classes";

type ClassDocumentWithId = ClassDocument & {
  _id: ObjectId;
};

const isValidStudentId = (id: string) => /^\d{9}-\d$/.test(id);

const isValidName = (name: string) => /^(นาย|นาง|นางสาว)/.test(name);

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const getAcademicYear = () => new Date().getFullYear() + 543;

export async function POST(req: Request) {
  try {
    const body: UploadStudentsBody = await req.json();

    const { classId, section, major, students } = body;

    if (!classId || !ObjectId.isValid(classId)) {
      return NextResponse.json(
        {
          success: false,
          message: "classId ไม่ถูกต้อง",
        },
        { status: 400 },
      );
    }

    if (!section) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาเลือก Section",
        },
        { status: 400 },
      );
    }

    if (!major) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาระบุสาขา",
        },
        { status: 400 },
      );
    }

    if (!students || students.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่มีข้อมูลนักศึกษา",
        },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("attendance");

    const studentsCol = db.collection<StudentDocument>("students");

    const studentClassesCol =
      db.collection<StudentClassDocument>("student_classes");

    const classesCol = db.collection<ClassDocumentWithId>("classes");

    const majorsCol = db.collection<MajorDocument>("majors");

    const classObjectId = new ObjectId(classId);

    const classData = await classesCol.findOne({
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

    const className = classData.className;

    const majorExists = await majorsCol.findOne({
      name: major,
    });

    if (!majorExists) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบสาขา",
        },
        { status: 404 },
      );
    }

    const academicYear = getAcademicYear();


    const parsed: StudentDocument[] = [];

    const errors: StudentErrorItem[] = [];

    for (const student of students) {
      const studentId = student.studentId?.trim();

      const fullName = student.fullName?.trim();

      const email = student.email?.trim();

      if (!studentId || !fullName) {
        errors.push({
          student,
          message: "ข้อมูลไม่ครบ",
        });

        continue;
      }

      if (!isValidStudentId(studentId)) {
        errors.push({
          student,
          message: "studentId ไม่ถูกต้อง",
        });

        continue;
      }

      if (!isValidName(fullName)) {
        errors.push({
          student,
          message: "ชื่อไม่ถูกต้อง",
        });

        continue;
      }

      if (email && !isValidEmail(email)) {
        errors.push({
          student,
          message: "email ไม่ถูกต้อง",
        });

        continue;
      }

      const studentData: StudentDocument = {
        studentId,
        fullName,
        section,
        major,
        academicYear,
        createdAt: new Date(),
      };

      if (email) {
        studentData.email = email;
      }

      parsed.push(studentData);
    }

    await Promise.all(
      parsed.map((student) =>
        studentsCol.updateOne(
          {
            studentId: student.studentId,
            academicYear,
          },
          {
            $setOnInsert: student,
          },
          {
            upsert: true,
          },
        ),
      ),
    );

    const ids = parsed.map((student) => student.studentId);

    const allStudents = await studentsCol
      .find({
        studentId: {
          $in: ids,
        },
        academicYear,
      })
      .toArray();

    const idMap = new Map<string, ObjectId>(
      allStudents.map((student) => [student.studentId, student._id!]),
    );

    const details: StudentResultItem[] = [];

    for (const student of parsed) {
      const studentObjectId = idMap.get(student.studentId);

      if (!studentObjectId) {
        continue;
      }

      const exists = await studentClassesCol.findOne({
        studentId: studentObjectId,

        $or: [
          {
            classId: classObjectId,
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
          studentId: student.studentId,
          fullName: student.fullName,
          email: student.email,
          section: student.section,
          major: student.major,
          className,
          status: "duplicate",
          relation: "exists",
        });

        continue;
      }

      await studentClassesCol.insertOne({
        studentId: studentObjectId,
        classId: classObjectId,
        className,
        section,
        academicYear,
        createdAt: new Date(),
      });

      details.push({
        studentId: student.studentId,
        fullName: student.fullName,
        email: student.email,
        section: student.section,
        major: student.major,
        className,
        status: "created",
        relation: "added",
      });

      const duplicateName = await studentsCol.findOne({
        fullName: student.fullName,

        academicYear,
      });

      if (duplicateName) {
        const hasSameClass = await studentClassesCol.findOne({
          studentId: duplicateName._id!,

          $or: [
            {
              classId: classObjectId,
              section,
            },
            {
              className,
              section,
            },
          ],
        });

        if (hasSameClass) {
          details.push({
            studentId: student.studentId,
            fullName: student.fullName,
            email: student.email,
            section: student.section,
            major: student.major,
            className,
            status: "duplicate",
            relation: "exists",
          });
        }
      }
    }

    return NextResponse.json(
      {
        success: true,

        summary: {
          total: parsed.length,

          added: details.filter((item) => item.relation === "added").length,

          exists: details.filter((item) => item.relation === "exists").length,
        },

        details,

        errors,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("UPLOAD STUDENTS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
      },
      { status: 500 },
    );
  }
}
