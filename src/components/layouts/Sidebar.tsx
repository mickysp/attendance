"use client";

import {
  HomeIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  IdentificationIcon,
  BookOpenIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  ClipboardDocumentCheckIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({
    fullname: "",
    role: "",
  });

  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);

  const SWIPE_DISTANCE = 60;

  const handleTouchStart = (
    e: React.TouchEvent<HTMLDivElement>
  ) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (
    e: React.TouchEvent<HTMLDivElement>
  ) => {
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const distance =
      touchCurrentX.current - touchStartX.current;
    if (
      touchStartX.current < 30 &&
      distance > SWIPE_DISTANCE
    ) {
      setMobileOpen(true);
    }
    if (
      mobileOpen &&
      distance < -SWIPE_DISTANCE
    ) {
      setMobileOpen(false);
    }
  };

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
        console.error("Fetch user error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleNavigate = (path: string) => {
    router.push(path);
    setMobileOpen(false);
  };

  const userInitial = user.fullname
    ? user.fullname.charAt(0).toUpperCase()
    : "?";

  return (
    <>
      <div
        className="lg:hidden fixed left-0 top-0 z-[45] w-[25px] h-screen"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[50] bg-black/40"
          onClick={() => setMobileOpen(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      )}

      <aside
        className={`
          lg:hidden
          fixed
          top-0
          left-0
          z-[60]
          h-screen
          w-[280px]
          max-w-[85vw]
          bg-white
          border-r
          border-gray-200
          shadow-xl
          flex
          flex-col
          justify-between
          p-4
          font-noto
          transition-transform
          duration-300
          ease-out
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div>
          <div className="mb-6 flex items-center justify-between pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-sm">
                <CalendarDaysIcon className="h-5 w-5 text-white" />
              </div>

              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Attendy
                </h1>

                <p className="text-xs text-gray-500">
                  Management System
                </p>
              </div>
            </div>
          </div>

          <SidebarMenu
            pathname={pathname}
            collapsed={false}
            onNavigate={handleNavigate}
          />
        </div>

        <UserSection
          user={user}
          loading={loading}
          userInitial={userInitial}
          collapsed={false}
          onLogout={handleLogout}
        />
      </aside>

      <aside
        className={`
          hidden
          lg:flex
          flex-col
          h-screen
          shrink-0
          overflow-y-auto
          bg-white
          border-r
          border-gray-200
          p-4
          justify-between
          font-noto
          transition-all
          duration-300
          ${
            desktopCollapsed
              ? "w-[70px]"
              : "w-[280px]"
          }
        `}
      >
        <div>
          <div
            className={`
              mb-6
              flex
              items-center
              pb-4
              border-b
              border-gray-200
              ${
                desktopCollapsed
                  ? "justify-center"
                  : "justify-between"
              }
            `}
          >
            {!desktopCollapsed && (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-sm">
                  <CalendarDaysIcon className="h-5 w-5 text-white" />
                </div>

                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Attendy
                  </h1>

                  <p className="text-xs text-gray-500">
                    Management System
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                setDesktopCollapsed(!desktopCollapsed)
              }
              className="p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              aria-label="Toggle sidebar"
            >
              <Bars3Icon className="h-5 w-5 text-gray-700" />
            </button>
          </div>

          <SidebarMenu
            pathname={pathname}
            collapsed={desktopCollapsed}
            onNavigate={handleNavigate}
          />
        </div>

        <UserSection
          user={user}
          loading={loading}
          userInitial={userInitial}
          collapsed={desktopCollapsed}
          onLogout={handleLogout}
        />
      </aside>
    </>
  );
}

type SidebarMenuProps = {
  pathname: string;
  collapsed: boolean;
  onNavigate: (path: string) => void;
};

function SidebarMenu({
  pathname,
  collapsed,
  onNavigate,
}: SidebarMenuProps) {
  return (
    <nav className="flex flex-col gap-6 text-sm font-medium">
      {!collapsed && (
        <p className="text-xs text-gray-400 uppercase px-3">
          Menu
        </p>
      )}

      <div className="flex flex-col gap-2">
        <SidebarItem
          icon={<HomeIcon />}
          label="Dashboard"
          collapsed={collapsed}
          active={pathname === "/dashboard"}
          onClick={() => onNavigate("/dashboard")}
        />

        <SidebarItem
          icon={<BookOpenIcon />}
          label="Classes"
          collapsed={collapsed}
          active={pathname.startsWith("/classes")}
          onClick={() => onNavigate("/classes")}
        />

        <SidebarItem
          icon={<UserGroupIcon />}
          label="Students"
          collapsed={collapsed}
          active={pathname.startsWith("/students")}
          onClick={() => onNavigate("/students")}
        />

        <SidebarItem
          icon={<IdentificationIcon />}
          label="Attendance"
          collapsed={collapsed}
          active={pathname.startsWith("/attendance")}
          onClick={() => onNavigate("/attendance")}
        />

        <SidebarItem
          icon={<ClipboardDocumentCheckIcon />}
          label="Form Attendance"
          collapsed={collapsed}
          active={pathname.startsWith(
            "/check-in/configform"
          )}
          onClick={() =>
            onNavigate("/check-in/configform")
          }
        />
      </div>

      {!collapsed && (
        <p className="text-xs text-gray-400 uppercase px-3 mt-2">
          Other
        </p>
      )}

      <div className="flex flex-col gap-2">
        <SidebarItem
          icon={<Cog6ToothIcon />}
          label="Setting"
          collapsed={collapsed}
          active={pathname.startsWith("/setting")}
          onClick={() => onNavigate("/setting")}
        />
      </div>
    </nav>
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
  collapsed = false,
  active = false,
  onClick,
}: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`
        w-full
        flex
        items-center
        ${
          collapsed
            ? "justify-center px-2"
            : "gap-3 px-3"
        }
        py-3
        rounded-lg
        cursor-pointer
        transition-all
        duration-200
        text-left
        ${
          active
            ? "bg-blue-100 text-blue-600 font-medium"
            : "hover:bg-gray-100 text-gray-700"
        }
      `}
    >
      <span
        className={`
          shrink-0
          ${
            collapsed
              ? "h-6 w-6"
              : "h-5 w-5"
          }
        `}
      >
        {icon}
      </span>

      {!collapsed && (
        <span className="truncate">
          {label}
        </span>
      )}
    </button>
  );
}

type UserSectionProps = {
  user: {
    fullname: string;
    role: string;
  };
  loading: boolean;
  userInitial: string;
  collapsed: boolean;
  onLogout: () => void;
};

function UserSection({
  user,
  loading,
  userInitial,
  collapsed,
  onLogout,
}: UserSectionProps) {
  return (
    <div className="pt-4 border-t border-gray-200">
      <div
        className={`
          flex
          items-center
          ${
            collapsed
              ? "justify-center"
              : "justify-between"
          }
          px-3
          py-2
          rounded-lg
          bg-gray-50
        `}
      >
        <div
          className={`
            flex
            items-center
            ${
              collapsed
                ? "justify-center"
                : "gap-3"
            }
          `}
        >
          <div className="h-9 w-9 shrink-0 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold text-gray-700">
            {userInitial}
          </div>

          {!collapsed && (
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-sm font-medium truncate max-w-[150px]">
                {loading
                  ? "กำลังโหลด..."
                  : user.fullname || "ไม่ระบุชื่อ"}
              </span>

              <span className="text-xs text-gray-500 truncate max-w-[150px]">
                {loading
                  ? ""
                  : user.role || "ไม่ระบุ Role"}
              </span>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            type="button"
            onClick={onLogout}
            className="
              shrink-0
              p-2
              rounded-md
              hover:bg-red-100
              hover:text-red-600
              transition
              cursor-pointer
            "
            title="Logout"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}