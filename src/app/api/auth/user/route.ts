import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { JwtPayload, User } from "@/types/auth";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

type UserDocument = Omit<User, "_id"> & {
  _id: ObjectId;
};

export async function GET() {
  try {
    const cookieStore = await cookies();

    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่ได้เข้าสู่ระบบ",
        },
        { status: 401 },
      );
    }

    const { payload } = await jwtVerify<JwtPayload>(accessToken, secret);

    if (!payload.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Token ไม่ถูกต้อง",
        },
        { status: 401 },
      );
    }

    const client = await clientPromise;
    const db = client.db("attendance");

    const user = await db.collection<UserDocument>("users").findOne({
      _id: new ObjectId(payload.userId),
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบข้อมูลผู้ใช้งาน",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        fullname: user.fullname,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("AUTH ME ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Access Token ไม่ถูกต้องหรือหมดอายุ",
      },
      { status: 401 },
    );
  }
}
