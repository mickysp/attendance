import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import type { StudentDocument } from "@/types/students";

export async function GET() {
  try {
    const client = await clientPromise;

    const db = client.db("attendance");

    const studentsCol = db.collection<StudentDocument>("students");

    const years = await studentsCol.distinct("academicYear");

    const sortedYears = years
      .filter((year): year is number => typeof year === "number")
      .sort((a, b) => b - a);

    return NextResponse.json(
      {
        success: true,
        years: sortedYears,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("years api error:", error);

    return NextResponse.json(
      {
        success: false,
        years: [],
        message: error instanceof Error ? error.message : "error",
      },
      {
        status: 500,
      },
    );
  }
}
