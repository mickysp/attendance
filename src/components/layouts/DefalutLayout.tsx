"use client";

import { ReactNode } from "react";
import Sidebar from "./Sidebar";

type DefalutLayoutProps = {
  children: ReactNode;
};

export default function DefalutLayout({
  children,
}: DefalutLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f5f8fc]">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}