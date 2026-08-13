"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

type Props = {
  onNext: (email: string) => void;
};

export default function ForgotPassword({ onNext }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const isValid = emailRegex.test(email);

  const handleSubmit = async () => {
    if (!isValid) {
      setError("รูปแบบอีเมลไม่ถูกต้อง");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier: email }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        return;
      }

      onNext(email);
    } catch {
      setError("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl min-h-[280px] rounded-xl bg-white p-8 shadow-xl font-noto flex flex-col justify-center">
      {" "}
      <div className="flex items-center gap-3 mt-4">
        <Link href="/login">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-semibold">ค้นหาบัญชีของคุณ</h1>
      </div>
      <p className="mt-4 text-sm text-zinc-500">
        โปรดป้อนอีเมลของคุณเพื่อค้นหาบัญชีของคุณ
      </p>
      <div className="mt-6 flex flex-col gap-4 text-sm">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          className={`form-input ${error ? "border-red-500" : ""}`}
          placeholder="ระบุอีเมล"
        />

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <div className="flex justify-end">
          <button
            disabled={!isValid || loading}
            onClick={handleSubmit}
            className={`px-8 py-2.5 rounded-lg transition cursor-pointer mt-2 ${
              isValid
                ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {loading ? "กำลังส่ง..." : "ต่อไป"}
          </button>
        </div>
      </div>
    </div>
  );
}
