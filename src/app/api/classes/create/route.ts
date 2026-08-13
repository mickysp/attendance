import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type {
  Branch,
  Teacher,
  IncomingClass,
  ClassCodePayload,
  ClassDocument,
} from "@/types/classes";

export async function POST(req: Request) {
  try {
    const body: IncomingClass | IncomingClass[] = await req.json();

    const classList: IncomingClass[] = Array.isArray(body) ? body : [body];

    const client = await clientPromise;
    const db = client.db("attendance");

    const classes = db.collection<ClassDocument>("classes");
    const majors = db.collection("majors");
    const teachersCol = db.collection("teachers");

    const insertData: ClassDocument[] = [];

    for (const item of classList) {
      const { className, classCodes, teacherIds, description } = item;

      if (!className?.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "มีบางรายการไม่ได้กรอกชื่อวิชา",
          },
          { status: 400 },
        );
      }

      if (!classCodes || classCodes.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: `วิชา ${className} ต้องมีอย่างน้อย 1 รหัสวิชา`,
          },
          { status: 400 },
        );
      }

      if (!teacherIds || teacherIds.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: `วิชา ${className} ต้องมีอาจารย์ผู้สอนอย่างน้อย 1 คน`,
          },
          { status: 400 },
        );
      }

      const uniqueTeacherIds = Array.from(new Set(teacherIds));

      const invalidTeacherId = uniqueTeacherIds.find(
        (teacherId) => !ObjectId.isValid(teacherId),
      );

      if (invalidTeacherId) {
        return NextResponse.json(
          {
            success: false,
            message: `รูปแบบรหัสอาจารย์ไม่ถูกต้อง: ${invalidTeacherId}`,
          },
          { status: 400 },
        );
      }

      const teacherObjectIds = uniqueTeacherIds.map(
        (teacherId) => new ObjectId(teacherId),
      );

      const foundTeachers = await teachersCol
        .find({
          _id: {
            $in: teacherObjectIds,
          },
        })
        .toArray();

      if (foundTeachers.length !== uniqueTeacherIds.length) {
        return NextResponse.json(
          {
            success: false,
            message: `พบข้อมูลอาจารย์ไม่ครบสำหรับวิชา ${className}`,
          },
          { status: 400 },
        );
      }

      const normalizedTeachers: Teacher[] = foundTeachers.map((teacher) => ({
        _id: teacher._id.toString(),
        name: teacher.name,
      }));

      const normalizedClassCodes: ClassCodePayload[] = [];

      for (const classCodeItem of classCodes) {
        const code = classCodeItem.code?.trim();
        const section = Number(classCodeItem.section);

        if (!code) {
          return NextResponse.json(
            {
              success: false,
              message: `วิชา ${className} มีบางรายการไม่ได้กรอกรหัสวิชา`,
            },
            { status: 400 },
          );
        }

        if (!Number.isInteger(section) || section <= 0) {
          return NextResponse.json(
            {
              success: false,
              message: `Section ของรหัสวิชา ${code} ไม่ถูกต้อง`,
            },
            { status: 400 },
          );
        }

        if (!classCodeItem.branchIds || classCodeItem.branchIds.length === 0) {
          return NextResponse.json(
            {
              success: false,
              message: `รหัสวิชา ${code} ต้องมีอย่างน้อย 1 สาขา`,
            },
            { status: 400 },
          );
        }

        const duplicateInRequest = normalizedClassCodes.some(
          (item) => item.code === code && item.section === section,
        );

        if (duplicateInRequest) {
          return NextResponse.json(
            {
              success: false,
              message: `รหัสวิชา ${code} Section ${section} ซ้ำกันในรายการที่ส่งมา`,
            },
            { status: 400 },
          );
        }

        const existing = await classes.findOne({
          classCodes: {
            $elemMatch: {
              code,
              section,
            },
          },
        });

        if (existing) {
          return NextResponse.json(
            {
              success: false,
              message: `รหัสวิชา ${code} Section ${section} มีอยู่แล้ว`,
            },
            { status: 400 },
          );
        }

        const uniqueBranchIds = Array.from(new Set(classCodeItem.branchIds));

        const invalidBranchId = uniqueBranchIds.find(
          (branchId) => !ObjectId.isValid(branchId),
        );

        if (invalidBranchId) {
          return NextResponse.json(
            {
              success: false,
              message: `รูปแบบรหัสสาขาไม่ถูกต้อง: ${invalidBranchId}`,
            },
            { status: 400 },
          );
        }

        const branchObjectIds = uniqueBranchIds.map(
          (branchId) => new ObjectId(branchId),
        );

        const foundMajors = await majors
          .find({
            _id: {
              $in: branchObjectIds,
            },
          })
          .toArray();

        if (foundMajors.length !== uniqueBranchIds.length) {
          return NextResponse.json(
            {
              success: false,
              message: `พบสาขาไม่ครบสำหรับรหัสวิชา ${code} Section ${section}`,
            },
            { status: 400 },
          );
        }

        const normalizedBranches: Branch[] = foundMajors.map((major) => ({
          _id: major._id.toString(),
          name: major.name,
        }));

        normalizedClassCodes.push({
          code,
          section,
          branches: normalizedBranches,
        });
      }

      const newClass: ClassDocument = {
        className: className.trim(),
        classCodes: normalizedClassCodes,
        teachers: normalizedTeachers,
        createdAt: new Date(),
      };

      if (description?.trim()) {
        newClass.description = description.trim();
      }

      insertData.push(newClass);
    }

    const result = await classes.insertMany(insertData);

    return NextResponse.json(
      {
        success: true,
        message: `สร้างรายวิชาสำเร็จ ${result.insertedCount} รายการ`,
        data: insertData,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
