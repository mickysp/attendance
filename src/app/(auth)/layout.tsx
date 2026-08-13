import type { ReactNode } from "react";
import AuthLayout from "@/components/layouts/AuthLayout";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: AuthLayoutProps) {
  return <AuthLayout>{children}</AuthLayout>;
}
