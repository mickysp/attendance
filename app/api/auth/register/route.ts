import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { prefix, fullname, username, email, password, role } = body;

    if (!prefix || !fullname || !username || !email || !password || !role) {
      return NextResponse.json(
        { success: false, message: "กรอกข้อมูลไม่ครบ" },
        { status: 400 },
      );
    }

    if (!["Teaching Assistant", "Teacher"].includes(role)) {
      return NextResponse.json(
        { success: false, message: "role ไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("attendance");
    const users = db.collection("users");

    const existingUser = await users.findOne({ username });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "username นี้มีอยู่แล้ว" },
        { status: 400 },
      );
    }

    const existingEmail = await users.findOne({ email });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, message: "email นี้มีอยู่แล้ว" },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new NextResponse(null, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      prefix,
      fullname,
      username,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date(),
    };

    await users.insertOne(newUser);

    return NextResponse.json({
      success: true,
      message: "สมัครสมาชิกสำเร็จ",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 },
    );
  }
}
