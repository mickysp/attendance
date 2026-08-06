import AuthLayout from "@/components/layouts/AuthLayout";
import LoginForm from "@/components/features/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}