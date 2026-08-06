"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full bg-white border-b border-gray-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-6">

        <Link
          href="/"
          className="text-2xl font-semibold tracking-tight text-gray-900"
        >
          Attendy
          <span className="text-blue-600">.</span>
        </Link>

      </div>
    </nav>
  );
}