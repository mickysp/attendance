import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  req: Request,
  context: { params?: { id?: string } }
) {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const pathId = pathParts[pathParts.length - 1];

    const queryId = url.searchParams.get("id");

    const id =
      context?.params?.id ||
      pathId ||
      queryId;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "id ไม่ถูกต้อง", id },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("attendance");
    const classes = db.collection("classes");

    const data = await classes.findOne({
      _id: new ObjectId(id),
    });

    if (!data) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูล" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        className:
          data.className ||
          data.name ||
          data.title ||
          data.subjectName ||
          data.subject ||
          "",

        classCode:
          data.classCode ||
          data.code ||
          data.class_code ||
          data.subjectCode ||
          data.subject_code ||
          data.courseCode ||
          "",

        teacher:
          data.teacher ||
          data.instructor ||
          data.professor ||
          "",
      },
    });
  } catch (error) {
    console.error("ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "error",
      },
      { status: 500 }
    );
  }
}