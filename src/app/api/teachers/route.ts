import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

import type { TeacherDocument, CreateTeacherBody } from "@/types/teachers";

export async function GET() {
  try {
    const client = await clientPromise;

    const db = client.db("attendance");

    const teachers = db.collection<TeacherDocument>("teachers");

    const data = await teachers
      .find({})
      .sort({
        createdAt: -1,
      })
      .toArray();

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("GET TEACHERS ERROR:", error);

    return NextResponse.json(
      {
        success: false,

        message: error instanceof Error ? error.message : "Unknown error",
      },

      {
        status: 500,
      },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const teacherList: CreateTeacherBody[] = Array.isArray(body)
      ? body
      : [body];

    const client = await clientPromise;

    const db = client.db("attendance");

    const teachers = db.collection<TeacherDocument>("teachers");

    const insertData: TeacherDocument[] = [];

    for (const item of teacherList) {
      const name = item.name?.trim();

      if (!name) {
        continue;
      }

      const exists = await teachers.findOne({
        name,
      });

      if (exists) {
        continue;
      }

      insertData.push({
        name,
        createdAt: new Date(),
      });
    }

    if (insertData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่มีข้อมูลใหม่ให้เพิ่ม",
        },
        {
          status: 400,
        },
      );
    }

    const result = await teachers.insertMany(insertData);

    return NextResponse.json({
      success: true,

      message: `เพิ่มอาจารย์ ${result.insertedCount} รายการ`,

      data: insertData,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,

        message: error instanceof Error ? error.message : "Unknown error",
      },

      {
        status: 500,
      },
    );
  }
}
