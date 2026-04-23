import type { Metadata } from "next";
import { Prompt, Sarabun, Noto_Sans_Thai } from "next/font/google";
import { AlertProvider } from "@/context/AlertContext";
import { ConfirmProvider } from "@/context/ConfirmContext";
import "./globals.css";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-prompt",
});

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sarabun",
});

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto",
});

export const metadata: Metadata = {
  title: "Attendy",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="th"
      className={`${prompt.variable} ${sarabun.variable} ${notoSansThai.variable}`}
    >
      <body className="antialiased">
        <AlertProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </AlertProvider>
      </body>
    </html>
  );
}
