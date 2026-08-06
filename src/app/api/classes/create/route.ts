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
  branchIds?: string[];
};

type ClassCodePayload = {
  code: string;
  branches: Branch[];
};

type IncomingClass = {
  className?: string;
  classCodes?: IncomingClassCode[];
  teacherId?: string;
  description?: string;
};

type ClassPayload = {
  className: string;
  classCodes: ClassCodePayload[];
  description?: string;
  teacher?: Teacher;
  createdAt: Date;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const classList: IncomingClass[] = Array.isArray(body)
      ? body
      : [body];

    const client = await clientPromise;
    const db = client.db("attendance");

    const classes = db.collection<ClassPayload>("classes");
    const majors = db.collection("majors");
    const teachersCol = db.collection("teachers");

    const insertData: ClassPayload[] = [];

    for (const item of classList) {
      const { className, classCodes, teacherId, description } = item;

      if (!className?.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "มีบางรายการไม่ได้กรอกชื่อวิชา",
          },
          { status: 400 }
        );
      }

      if (!classCodes || classCodes.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: `วิชา ${className} ต้องมีอย่างน้อย 1 รหัสวิชา`,
          },
          { status: 400 }
        );
      }

      const normalizedClassCodes: ClassCodePayload[] = [];

      for (const classCodeItem of classCodes) {
        const code = classCodeItem.code?.trim();

        if (!code) {
          return NextResponse.json(
            {
              success: false,
              message: `วิชา ${className} มีบางรายการไม่ได้กรอกรหัสวิชา`,
            },
            { status: 400 }
          );
        }

        if (!classCodeItem.branchIds || classCodeItem.branchIds.length === 0) {
          return NextResponse.json(
            {
              success: false,
              message: `รหัสวิชา ${code} ต้องมีอย่างน้อย 1 สาขา`,
            },
            { status: 400 }
          );
        }

        const duplicateInRequest = normalizedClassCodes.some(
          (item) => item.code === code
        );

        if (duplicateInRequest) {
          return NextResponse.json(
            {
              success: false,
              message: `รหัสวิชา ${code} ซ้ำกันในรายการที่ส่งมา`,
            },
            { status: 400 }
          );
        }

        const existing = await classes.findOne({
          "classCodes.code": code,
        });

        if (existing) {
          return NextResponse.json(
            {
              success: false,
              message: `รหัสวิชา ${code} มีอยู่แล้ว`,
            },
            { status: 400 }
          );
        }

        const uniqueBranchIds = Array.from(
          new Set(classCodeItem.branchIds)
        );

        const invalidBranchId = uniqueBranchIds.find(
          (branchId) => !ObjectId.isValid(branchId)
        );

        if (invalidBranchId) {
          return NextResponse.json(
            {
              success: false,
              message: `รูปแบบรหัสสาขาไม่ถูกต้อง: ${invalidBranchId}`,
            },
            { status: 400 }
          );
        }

        const branchObjectIds = uniqueBranchIds.map(
          (branchId) => new ObjectId(branchId)
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
              message: `พบสาขาไม่ครบสำหรับรหัสวิชา ${code}`,
            },
            { status: 400 }
          );
        }

        const normalizedBranches: Branch[] = foundMajors.map((major) => ({
          _id: major._id.toString(),
          name: major.name,
        }));

        normalizedClassCodes.push({
          code,
          branches: normalizedBranches,
        });
      }

      let normalizedTeacher: Teacher | undefined;

      if (teacherId) {
        if (!ObjectId.isValid(teacherId)) {
          return NextResponse.json(
            {
              success: false,
              message: "รูปแบบรหัสอาจารย์ไม่ถูกต้อง",
            },
            { status: 400 }
          );
        }

        const teacher = await teachersCol.findOne({
          _id: new ObjectId(teacherId),
        });

        if (!teacher) {
          return NextResponse.json(
            {
              success: false,
              message: "ไม่พบอาจารย์",
            },
            { status: 400 }
          );
        }

        normalizedTeacher = {
          _id: teacher._id.toString(),
          name: teacher.name,
        };
      }

      const newClass: ClassPayload = {
        className: className.trim(),
        classCodes: normalizedClassCodes,
        createdAt: new Date(),
      };

      if (description?.trim()) {
        newClass.description = description.trim();
      }

      if (normalizedTeacher) {
        newClass.teacher = normalizedTeacher;
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
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("CREATE CLASS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}