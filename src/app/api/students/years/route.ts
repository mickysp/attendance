import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("attendance");

    const studentsCol = db.collection("students");

    const years: number[] = await studentsCol.distinct("academicYear");

    const sortedYears = years
      .filter(Boolean)
      .sort((a, b) => b - a);

    return NextResponse.json({
      success: true,
      years: sortedYears,
    });
  } catch (error) {
    console.error("years api error:", error);

    return NextResponse.json(
      {
        success: false,
        years: [],
        message:
          error instanceof Error ? error.message : "error",
      },
      { status: 500 }
    );
  }
}