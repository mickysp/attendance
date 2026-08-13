import nodemailer from "nodemailer";

export async function sendOtpEmail(to: string, otp: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Attendance System" <${process.env.EMAIL_USER}>`,
    to,
    subject: "รหัส OTP สำหรับรีเซ็ตรหัสผ่าน",
    html: `
      <div style="font-family: sans-serif; text-align: center;">
        <h2>รหัส OTP ของคุณ</h2>
        <p>กรุณาใช้รหัสด้านล่างเพื่อรีเซ็ตรหัสผ่าน</p>
        <h1 style="letter-spacing: 6px;">${otp}</h1>
        <p>รหัสนี้จะหมดอายุใน 10 นาที</p>
      </div>
    `,
  });
}