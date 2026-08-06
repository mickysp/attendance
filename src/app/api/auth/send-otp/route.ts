import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { sendOtpEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identifier = (body.identifier || "").toLowerCase().trim();

    if (!identifier) {
      return NextResponse.json(
        { success: false, message: "กรอกข้อมูลไม่ครบ" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("attendance");

    const users = db.collection("users");
    const resets = db.collection("password_resets");

    const user = await users.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (user) {
      const existing = await resets.findOne({
        userId: user._id,
        expiresAt: { $gt: new Date() },
      });

      if (existing) {
        return NextResponse.json({
          success: false,
          message: "กรุณารอ OTP ก่อนหน้า (ภายใน 10 นาที)",
        });
      }

      await resets.deleteMany({ userId: user._id });

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      await resets.insertOne({
        userId: user._id,
        otp,
        verified: false,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        createdAt: new Date(),
      });

      try {
        await sendOtpEmail(user.email, otp);
        console.log("SEND OTP TO:", user.email);
      } catch (err) {
        console.error("EMAIL ERROR:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: "หากบัญชีมีอยู่ เราได้ส่ง OTP แล้ว",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}