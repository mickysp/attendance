import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);

    const client = await clientPromise;
    const db = client.db("attendance");

    const user = await db.collection("users").findOne({
      _id: new ObjectId(payload.userId as string),
    });

    if (!user) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        fullname: user.fullname,
        role: user.role,
      },
    });
  } catch {
    return NextResponse.json({ success: false }, { status: 401 });
  }
}