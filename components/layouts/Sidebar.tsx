"use client";

import {
  HomeIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  IdentificationIcon,
  BookOpenIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  ClipboardDocumentCheckIcon
} from "@heroicons/react/24/outline";
import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState({
    fullname: "",
    role: "",
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/user", {
          credentials: "include",
        });

        const data = await res.json();

        if (data.success) {
          setUser(data.user);
        } else {
          router.replace("/login");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/login");
  };

  return (
    <aside
      className={`${
        collapsed ? "w-[70px]" : "w-[280px]"
      } h-screen overflow-y-auto bg-white border-gray-200 p-4 flex flex-col justify-between transition-all duration-300 font-noto`}
    >
      <div>
        <div className="mb-6 flex items-center justify-between pb-4 border-b border-gray-200">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-sm">
                <CalendarDaysIcon className="h-5 w-5 text-white" />
              </div>

              <div>
                <h1 className="text-lg font-semibold">Attendy</h1>
                <p className="text-xs text-gray-500">Management System</p>
              </div>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-md hover:bg-gray-100 cursor-pointer"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-6 text-sm font-medium">
          {!collapsed && (
            <p className="text-xs text-gray-400 uppercase px-3">Menu</p>
          )}

          <div className="flex flex-col gap-2">
            <SidebarItem
              icon={<HomeIcon />}
              label="Dashboard"
              collapsed={collapsed}
              active={pathname === "/dashboard"}
              onClick={() => router.push("/dashboard")}
            />

            <SidebarItem
              icon={<BookOpenIcon />}
              label="Classes"
              collapsed={collapsed}
              active={pathname.startsWith("/classes")}
              onClick={() => router.push("/classes")}
            />

            <SidebarItem
              icon={<UserGroupIcon />}
              label="Students"
              collapsed={collapsed}
              active={pathname.startsWith("/students")}
              onClick={() => router.push("/students")}
            />

            <SidebarItem
              icon={<IdentificationIcon />}
              label="Attendance"
              collapsed={collapsed}
              active={pathname === "/attendance"}
              onClick={() => router.push("/attendance")}
            />
          </div>

          {!collapsed && (
            <p className="text-xs text-gray-400 uppercase px-3 mt-2">Other</p>
          )}

          <div className="flex flex-col gap-2">
            <SidebarItem
              icon={<ClipboardDocumentCheckIcon />}
              label="ตัวอย่างแบบฟอร์มเช็คชื่อ"
              collapsed={collapsed}
              active={pathname.startsWith("/check-in/configform")}
              onClick={() => router.push("/check-in/configform")}
            />
          </div>
        </nav>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <div
          className={`flex items-center ${
            collapsed ? "justify-center" : "justify-between"
          } px-3 py-2 rounded-lg bg-gray-50`}
        >
          <div
            className={`flex items-center ${
              collapsed ? "justify-center" : "gap-3"
            }`}
          >
            <div className="h-9 w-9 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold">
              {user.fullname ? user.fullname.charAt(0) : "?"}
            </div>

            {!collapsed && (
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-medium">
                  {loading ? "กำลังโหลด..." : user.fullname}
                </span>
                <span className="text-xs text-gray-500">
                  {loading ? "" : user.role}
                </span>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-md hover:bg-red-100 hover:text-red-600 transition cursor-pointer"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

type SidebarItemProps = {
  icon: ReactNode;
  label: string;
  collapsed?: boolean;
  active?: boolean;
  onClick?: () => void;
};

function SidebarItem({
  icon,
  label,
  collapsed,
  active,
  onClick,
}: SidebarItemProps) {
  return (
    <div
      onClick={onClick}
      title={collapsed ? label : ""}
      className={`flex items-center ${
        collapsed ? "justify-center px-2" : "gap-3 px-3"
      } py-3 rounded-lg cursor-pointer transition-all duration-200
      ${
        active
          ? "bg-blue-100 text-blue-600 font-medium"
          : "hover:bg-gray-100 text-gray-700"
      }`}
    >
      <span className={`${collapsed ? "h-6 w-6" : "h-5 w-5"}`}>{icon}</span>

      {!collapsed && label}
    </div>
  );
}
