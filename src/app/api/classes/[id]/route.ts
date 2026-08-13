import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { ClassDocument } from "@/types/classes";

export async function GET(req: Request, context: { params?: { id?: string } }) {
  try {
    const url = new URL(req.url);

    const pathParts = url.pathname.split("/");

    const pathId = pathParts[pathParts.length - 1];

    const queryId = url.searchParams.get("id");

    const id = context?.params?.id || pathId || queryId;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "id ไม่ถูกต้อง",
          id,
        },
        { status: 400 },
      );
    }

    const client = await clientPromise;

    const db = client.db("attendance");

    const classes = db.collection<ClassDocument>("classes");

    const data = await classes.findOne({
      _id: new ObjectId(id),
    });

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบข้อมูล",
        },
        { status: 404 },
      );
    }

    const teachers = Array.isArray(data.teachers)
      ? data.teachers.map((teacher) => ({
          _id: teacher._id.toString(),

          name: typeof teacher.name === "string" ? teacher.name : "",
        }))
      : [];

    const classCodes = Array.isArray(data.classCodes)
      ? data.classCodes.map((classCode) => ({
          code: typeof classCode.code === "string" ? classCode.code : "",

          section:
            typeof classCode.section === "number" ? classCode.section : 1,

          branches: Array.isArray(classCode.branches)
            ? classCode.branches.map((branch) => ({
                _id: branch?._id ? branch._id.toString() : "",

                name: typeof branch?.name === "string" ? branch.name : "",
              }))
            : [],
        }))
      : [];

    return NextResponse.json({
      success: true,

      data: {
        _id: data._id ? data._id.toString() : id,
        className: data.className,
        classCodes,
        description: data.description,
        teachers,
        academicYear: data.academicYear,
        isOpen: data.isOpen,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "error",
      },
      { status: 500 },
    );
  }
}
