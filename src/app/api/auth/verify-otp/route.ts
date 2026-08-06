import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identifier = (body.identifier || "").toLowerCase().trim();
    const otp = body.otp;

    if (!identifier || !otp) {
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

    if (!user) {
      return NextResponse.json(
        { success: false, message: "ไม่พบบัญชี" },
        { status: 400 }
      );
    }

    const token = await resets.findOne({
      userId: user._id,
      otp,
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!token) {
      return NextResponse.json({
        success: false,
        message: "OTP ไม่ถูกต้องหรือหมดอายุ",
      });
    }

    await resets.updateOne(
      { _id: token._id },
      { $set: { verified: true } }
    );

    return NextResponse.json({
      success: true,
      message: "ยืนยันสำเร็จ",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}