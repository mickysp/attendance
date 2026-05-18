import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(req: Request) {
  try {
    const { username, password, remember } = await req.json();

    if (!username?.trim()) {
      return NextResponse.json(
        { success: false, message: "กรุณากรอกชื่อผู้ใช้" },
        { status: 400 },
      );
    }

    if (!password?.trim()) {
      return NextResponse.json(
        { success: false, message: "กรุณากรอกรหัสผ่าน" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("attendance");
    const users = db.collection("users");

    const user = await users.findOne({ username });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "ไม่พบผู้ใช้งาน" },
        { status: 400 },
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "รหัสผ่านไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: remember ? "7d" : "1d",
      },
    );

    const response = NextResponse.json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      role: user.role,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: remember ? 60 * 60 * 24 * 7 : 60 * 60 * 24,
      expires: new Date(
        Date.now() + (remember ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000),
      ),
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
