import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import type { User, VerifyOtpBody } from "@/types/auth";

type UserDocument = Omit<User, "_id"> & {
  _id: ObjectId;
};

export async function POST(req: Request) {
  try {
    const { identifier, otp }: VerifyOtpBody = await req.json();

    const normalizedIdentifier = identifier.trim().toLowerCase();

    if (!normalizedIdentifier || !otp) {
      return NextResponse.json(
        { success: false, message: "กรอกข้อมูลไม่ครบ" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("attendance");

    const users = db.collection<UserDocument>("users");
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
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!token) {
      return NextResponse.json({
        success: false,
        message: "OTP ไม่ถูกต้องหรือหมดอายุ",
      });
    }

    await resets.updateOne({ _id: token._id }, { $set: { verified: true } });

    return NextResponse.json({
      success: true,
      message: "ยืนยันสำเร็จ",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
