import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import type { ResetPasswordBody } from "@/types/auth";
import type { User } from "@/types/auth";

export async function POST(req: Request) {
  try {
    const { identifier, otp, newPassword }: ResetPasswordBody =
      await req.json();

    const normalizedIdentifier = identifier.trim().toLowerCase();

    if (!identifier || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, message: "กรอกข้อมูลไม่ครบ" },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json({
        success: false,
        message: "รหัสผ่านต้องอย่างน้อย 8 ตัว",
      });
    }

    const client = await clientPromise;
    const db = client.db("attendance");

    const users = db.collection<User>("users");
    const resets = db.collection("password_resets");

    const user = await users.findOne({
      $or: [
        { email: normalizedIdentifier },
        { username: normalizedIdentifier },
      ],
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "ไม่พบบัญชี" },
        { status: 400 },
      );
    }

    const token = await resets.findOne({
      userId: user._id,
      otp,
      verified: true,
      expiresAt: { $gt: new Date() },
    });

    if (!token) {
      return NextResponse.json({
        success: false,
        message: "OTP ยังไม่ถูกยืนยันหรือหมดอายุ",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await users.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } },
    );

    await resets.deleteMany({ userId: user._id });

    return NextResponse.json({
      success: true,
      message: "เปลี่ยนรหัสผ่านสำเร็จ",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
