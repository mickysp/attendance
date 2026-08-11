"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { useAlert } from "@/context/AlertContext";
import { useAuthStore } from "@/stores/auth";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const { showAlert } = useAlert();

  const {
    username,
    password,
    remember,
    setUsername,
    setPassword,
    setRemember,
    clearPassword,
    loadRememberUser,
    saveRememberUser,
    clearRememberUser,
  } = useAuthStore();

  const router = useRouter();

  useEffect(() => {
    loadRememberUser();
  }, [loadRememberUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setUsernameError("");
    setPasswordError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username,
          password,
          remember,
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (remember) {
          saveRememberUser();
        } else {
          clearRememberUser();
        }

        clearPassword();

        const role = (data.role || "").toLowerCase();

        if (!role) {
          showAlert("ไม่พบ role จากระบบ", "error");
          return;
        }

        if (role === "admin") {
          router.push("/dashboard");
        } else if (role === "teacher") {
          router.push("/dashboard");
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
    <div
      className="
        box-border
        w-[calc(100vw-32px)]
        max-w-[448px]
        min-w-0
        shrink-0
        mx-auto

        rounded-xl
        bg-white
        shadow-xl

        p-5

        sm:w-[380px]
        sm:p-6

        md:w-[420px]
        md:p-8

        lg:w-[448px]
      "
    >
      <form
        onSubmit={handleLogin}
        className="
          flex
          w-full
          flex-col
          gap-4
          font-noto

          mt-2

          sm:mt-3

          md:mt-4
        "
      >
        <h1 className="text-lg font-medium leading-relaxed">
          เข้าสู่ระบบ Attendance
        </h1>

        <div className="w-full">
          <input
            type="text"
            autoComplete="username"
            className={`
              form-input
              mt-1
              block
              w-full
              min-w-0
              text-sm
              ${usernameError ? "border-red-500" : ""}
            `}
            placeholder="ชื่อผู้ใช้"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setUsernameError("");
            }}
          />

          {usernameError && (
            <p className="mt-1 text-xs text-red-500">{usernameError}</p>
          )}
        </div>

        <div className="relative w-full">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="รหัสผ่าน"
            className={`
              form-input
              block
              w-full
              min-w-0
              pr-10
              text-sm
              ${passwordError ? "border-red-500" : ""}
            `}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError("");
            }}
          />

          <button
            type="button"
            aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            onClick={() => setShowPassword((prev) => !prev)}
            className="
              absolute
              right-3
              top-1/2
              flex
              h-5
              w-5
              -translate-y-1/2
              items-center
              justify-center
              text-gray-400
              hover:text-gray-600
            "
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>

          {passwordError && (
            <p className="mt-1 text-xs text-red-500">{passwordError}</p>
          )}
        </div>

        <label
          className="
            flex
            w-full
            cursor-pointer
            items-center
            gap-2
            text-sm
          "
        >
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 shrink-0"
          />

          <span>จดจำฉันไว้ในระบบ</span>
        </label>

        <button
          type="submit"
          className="
            form-button
            w-full
            tracking-wide
          "
        >
          เข้าสู่ระบบ
        </button>

        <Link
          href="/forgot-password"
          className="
            text-sm
            text-zinc-500
            hover:underline
          "
        >
          ลืมรหัสผ่าน?
        </Link>

        <p className="text-sm leading-relaxed text-taupe-800">
          ยังไม่มีบัญชีใช่ไหม?{" "}
          <Link
            href="/register"
            className="
              text-blue-500
              hover:underline
            "
          >
            สมัครสมาชิก
          </Link>
        </p>
      </form>
    </div>
  );
}
