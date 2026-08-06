"use client";

import { useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { useAlert } from "@/context/AlertContext";
import { useRouter } from "next/navigation";

type Props = {
  email: string;
  otp: string;
  onBack: () => void;
};

export default function ResetPassword({ email, otp, onBack }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();
  const router = useRouter();

  const isValid = password.length >= 8 && password === confirm;

  const handleReset = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: email,
          otp,
          newPassword: password,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        showAlert(data.message);
        return;
      }

      showAlert("เปลี่ยนรหัสผ่านสำเร็จ", "success");
      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch {
      showAlert("เกิดข้อผิดพลาด", "error");
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

        <h1 className="text-xl font-semibold">ตั้งรหัสผ่านใหม่</h1>
      </div>

      <p className="mt-4 text-sm text-zinc-500">
        กรุณากรอกรหัสผ่านใหม่เพื่อเข้าใช้งานระบบอีกครั้ง
      </p>

      <div className="mt-6 flex flex-col gap-4 text-sm">
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="รหัสผ่านใหม่"
            onChange={(e) => setPassword(e.target.value)}
            className="form-input pr-10"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="ยืนยันรหัสผ่าน"
            onChange={(e) => setConfirm(e.target.value)}
            className="form-input pr-10"
          />

          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
          >
            {showConfirm ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <div className="flex justify-end">
          <button
            disabled={!isValid || loading}
            onClick={handleReset}
            className={`px-8 py-2.5 rounded-lg transition cursor-pointer mt-2 ${
              isValid
                ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {loading ? "กำลังบันทึก..." : "ยืนยัน"}
          </button>
        </div>
      </div>
    </div>
  );
}
