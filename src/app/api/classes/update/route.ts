import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type Branch = {
  _id: string;
  name: string;
};

type Teacher = {
  _id: string;
  name: string;
};

type IncomingClassCode = {
  code?: string;
  section?: number;
  branchIds?: string[];
};

type ClassCodePayload = {
  code: string;
  section: number;
  branches: Branch[];
};

type IncomingClass = {
  className?: string;
  classCodes?: IncomingClassCode[];
  teacherIds?: string[];
  description?: string;
};

type UpdateClassPayload = {
  className?: string;
  classCodes?: ClassCodePayload[];
  description?: string;
  teachers?: Teacher[];
  updatedAt?: Date;
};

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาระบุ id",
        },
        { status: 400 },
      );
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "รูปแบบ id ไม่ถูกต้อง",
        },
        { status: 400 },
      );
    }

    const body: IncomingClass = await req.json();

    const client = await clientPromise;
    const db = client.db("attendance");

    const classes = db.collection<UpdateClassPayload>("classes");

    const majors = db.collection("majors");

    const teachersCol = db.collection("teachers");

    const objectId = new ObjectId(id);

    const existing = await classes.findOne({
      _id: objectId,
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบข้อมูลที่ต้องการแก้ไข",
        },
        { status: 404 },
      );
    }

    const { className, classCodes, teacherIds, description } = body;

    if (className !== undefined && !className.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณากรอกชื่อวิชา",
        },
        { status: 400 },
      );
    }

    if (classCodes !== undefined && classCodes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "ต้องมีอย่างน้อย 1 รหัสวิชา",
        },
        { status: 400 },
      );
    }

    const updateData: Partial<UpdateClassPayload> = {};

    if (className !== undefined) {
      updateData.className = className.trim();
    }

    if (description !== undefined) {
      updateData.description = description.trim();
    }


    if (teacherIds !== undefined) {
      if (teacherIds.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "วิชาต้องมีอาจารย์ผู้สอนอย่างน้อย 1 คน",
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
            message: "พบข้อมูลอาจารย์ไม่ครบ",
          },
          { status: 400 },
        );
      }

      const normalizedTeachers: Teacher[] = foundTeachers.map((teacher) => ({
        _id: teacher._id.toString(),
        name: teacher.name,
      }));

      updateData.teachers = normalizedTeachers;
    }

    if (classCodes !== undefined) {
      const normalizedClassCodes: ClassCodePayload[] = [];

      for (const classCodeItem of classCodes) {
        const code = classCodeItem.code?.trim();

        const section = Number(classCodeItem.section);

        if (!code) {
          return NextResponse.json(
            {
              success: false,
              message: "มีบางรายการไม่ได้กรอกรหัสวิชา",
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
              message: `รหัสวิชา ${code} Section ${section} ต้องมีอย่างน้อย 1 สาขา`,
            },
            { status: 400 },
          );
        }

        const uniqueBranchIds = Array.from(new Set(classCodeItem.branchIds));

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

        const duplicate = await classes.findOne({
          _id: {
            $ne: objectId,
          },

          classCodes: {
            $elemMatch: {
              code,
              section,
            },
          },
        });

        if (duplicate) {
          return NextResponse.json(
            {
              success: false,
              message: `รหัสวิชา ${code} Section ${section} มีอยู่แล้ว`,
            },
            { status: 400 },
          );
        }

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

      updateData.classCodes = normalizedClassCodes;
    }

    updateData.updatedAt = new Date();

    await classes.updateOne(
      {
        _id: objectId,
      },
      {
        $set: updateData,
      },
    );

    return NextResponse.json({
      success: true,
      message: "อัปเดตรายวิชาสำเร็จ",
    });
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
