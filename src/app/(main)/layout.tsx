import DefalutLayout from "@/components/layouts/DefalutLayout";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DefalutLayout>
      {children}
    </DefalutLayout>
  );
}