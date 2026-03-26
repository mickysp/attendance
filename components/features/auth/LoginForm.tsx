"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { useAlert } from "@/context/AlertContext";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const { showAlert } = useAlert();

  const [form, setForm] = useState(() => {
    if (typeof window === "undefined") return { username: "", password: "" };

    const saved = localStorage.getItem("rememberUser");
    if (!saved) return { username: "", password: "" };

    try {
      const parsed = JSON.parse(saved);
      return { username: parsed?.username ?? "", password: "" };
    } catch {
      return { username: "", password: "" };
    }
  });

  const [remember, setRemember] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("rememberUser");
  });

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setUsernameError("");
    setPasswordError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          remember,
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (remember) {
          localStorage.setItem(
            "rememberUser",
            JSON.stringify({ username: form.username })
          );
        } else {
          localStorage.removeItem("rememberUser");
        }

        const role = (data.role || "").toLowerCase();

        if (!role) {
          showAlert("ไม่พบ role จากระบบ", "error");
          return;
        }

        if (role === "admin") {
          router.push("/dashboard");
        } else if (role === "teacher") {
          router.push("/attendance");
        } else {
          showAlert("role ไม่ถูกต้อง", "error");
        }
      } else {
        showAlert(data.message || "เข้าสู่ระบบไม่สำเร็จ", "error");
      }
    } catch (error) {
      showAlert("เกิดข้อผิดพลาด", "error");
    }
  };

  return (
    <div className="w-full max-w-lg max-h-[80vh] min-h-[400px] rounded-xl bg-white p-8 shadow-xl overflow-y-auto">
      <form
        onSubmit={handleLogin}
        className="mt-6 flex flex-col gap-4 font-noto"
      >
        <h1 className="text-lg font-medium">เข้าสู่ระบบ Attendance</h1>

        <div>
          <input
            className={`form-input mt-1 text-sm ${
              usernameError ? "border-red-500" : ""
            }`}
            placeholder="ชื่อผู้ใช้"
            value={form.username}
            onChange={(e) => {
              setForm({ ...form, username: e.target.value });
              setUsernameError("");
            }}
          />
          {usernameError && (
            <p className="text-xs text-red-500 mt-1">{usernameError}</p>
          )}
        </div>

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="รหัสผ่าน"
            className={`form-input text-sm pr-10 ${
              passwordError ? "border-red-500" : ""
            }`}
            value={form.password}
            onChange={(e) => {
              setForm({ ...form, password: e.target.value });
              setPasswordError("");
            }}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>

          {passwordError && (
            <p className="text-xs text-red-500 mt-1">{passwordError}</p>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          จดจำฉันไว้ในระบบ
        </label>

        <button className="form-button tracking-wide">เข้าสู่ระบบ</button>

        <Link
          href="/forgot-password"
          className="text-sm text-zinc-500 hover:underline"
        >
          ลืมรหัสผ่าน?
        </Link>

        <p className="text-sm text-taupe-800">
          ยังไม่มีบัญชีใช่ไหม?{" "}
          <Link href="/register" className="text-blue-500 hover:underline">
            สมัครสมาชิก
          </Link>
        </p>
      </form>
    </div>
  );
}