"use client";

export default function Footer() {
  return (
    <footer className="w-full text-center text-xs text-gray-400 py-6">
      <div className="flex flex-col items-center gap-1">

        <p>© {new Date().getFullYear()} Attendance System. All rights reserved.</p>  

      </div>
    </footer>
  );
}