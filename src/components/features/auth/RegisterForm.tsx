"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAlert } from "@/context/AlertContext";
import {
  ChevronDownIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/solid";

export default function RegisterPage() {
  const [open, setOpen] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { showAlert } = useAlert();

  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const [form, setForm] = useState({
    prefix: "",
    fullname: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Teacher",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      showAlert("รหัสผ่านไม่ตรงกัน", "error");
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prefix: form.prefix,
          fullname: form.fullname,
          username: form.username,
          email: form.email,
          password: form.password,
          role: form.role,
        }),
      });

      const data = await res.json();

      if (data.success) {
        showAlert("สมัครสมาชิกสำเร็จ", "success");

        setTimeout(() => {
          router.push("/login");
        }, 1200);
      } else {
        showAlert(data.message || "เกิดข้อผิดพลาด", "error");
      }
    } catch (error) {
      showAlert("เกิดข้อผิดพลาด", "error");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F0F4FB] font-noto">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h1 className="text-center text-2xl font-semibold mt-4 tracking-normal">
          สมัครสมาชิก
        </h1>

        <p className="mt-2 text-center text-sm text-zinc-500">
          สร้างบัญชีเพื่อเริ่มใช้งานระบบบันทึกการเข้าเรียน
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-8 p-1">
          <div className="flex gap-4 text-sm">
            <label className="flex flex-1 items-center gap-2 rounded border p-3">
              <input
                type="radio"
                name="role"
                value="Teacher"
                checked={form.role === "Teacher"}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
              คุณครู / อาจารย์
            </label>

            <label className="flex flex-1 items-center gap-2 rounded border p-3">
              <input
                type="radio"
                name="role"
                value="Admin"
                checked={form.role === "Admin"}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
              ผู้ดูแลระบบ
            </label>
          </div>

          <div className="grid grid-cols-3 gap-2 text-sm">
            <div ref={ref} className="relative col-span-1">
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="inline-flex w-full items-center justify-between rounded-md bg-white px-3 py-2.5 text-sm ring-1 ring-gray-300"
              >
                {form.prefix || "คำนำหน้า"}
                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
              </button>

              {open && (
                <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg">
                  {["นาย", "นาง", "นางสาว"].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setForm({ ...form, prefix: item });
                        setOpen(false);
                      }}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 cursor-pointer"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <input
              type="text"
              placeholder="ชื่อ - นามสกุล"
              className="form-input col-span-2"
              value={form.fullname}
              onChange={(e) => setForm({ ...form, fullname: e.target.value })}
            />
          </div>

          <input
            type="text"
            placeholder="ชื่อผู้ใช้"
            className="form-input text-sm"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />

          <div>
            <input
              type="email"
              placeholder="อีเมล"
              className={`form-input text-sm ${
                emailError ? "border-red-500" : ""
              }`}
              value={form.email}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                setEmailError("");
              }}
              onBlur={() => {
                if (!emailRegex.test(form.email)) {
                  setEmailError(
                    "กรุณากรอกอีเมลให้ถูกต้อง เช่น example@gmail.com",
                  );
                }
              }}
            />

            {emailError && (
              <p className="text-xs text-red-500 mt-1">{emailError}</p>
            )}
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="รหัสผ่าน"
              className="form-input text-sm pr-10"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
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
              type={showConfirmPassword ? "text" : "password"}
              placeholder="ยืนยันรหัสผ่าน"
              className="form-input text-sm pr-10"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({
                  ...form,
                  confirmPassword: e.target.value,
                })
              }
            />

            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          <button type="submit" className="form-button">
            ลงทะเบียน
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-700 mb-4">
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/login" className="text-blue-500">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}
