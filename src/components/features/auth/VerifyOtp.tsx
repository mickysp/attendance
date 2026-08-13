"use client";

import { useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

type Props = {
  email: string;
  onNext: (otp: string) => void;
  onBack: () => void;
};

export default function VerifyOtp({ email, onNext, onBack }: Props) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = otp.length === 6;

  const handleVerify = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: email,
          otp,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        return;
      }

      onNext(otp);
    } catch {
      setError("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl min-h-[280px] rounded-xl bg-white p-8 shadow-xl font-noto flex flex-col justify-center">
      <div className="flex items-center gap-3 mt-4">
        <button onClick={onBack}>
          <ArrowLeftIcon className="h-5 w-5" />
        </button>

        <h1 className="text-xl font-semibold">ยืนยัน OTP</h1>
      </div>

      <p className="mt-4 text-sm text-zinc-500">
        เราได้ส่งรหัส OTP ไปยัง <span className="font-semibold">{email}</span>
      </p>

      <div className="mt-6 flex flex-col gap-4 text-sm">
        <input
          value={otp}
          onChange={(e) =>
            setOtp(e.target.value.replace(/\D/g, ""))
          }
          maxLength={6}
          className="form-input"
          placeholder="ระบุรหัส OTP"
        />

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <div className="flex justify-end">
          <button
            disabled={!isValid || loading}
            onClick={handleVerify}
            className={`px-8 py-2.5 rounded-lg transition cursor-pointer mt-2 ${
              isValid
                ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {loading ? "กำลังตรวจ..." : "ต่อไป"}
          </button>
        </div>
      </div>
    </div>
  );
}