import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const jwtSecret = process.env.JWT_SECRET;

export async function proxy(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const pathname = req.nextUrl.pathname;

  const publicPaths = [
    "/login",
    "/register",
    "/forgot-password",
  ];

  if (!jwtSecret) {
    console.error("JWT_SECRET is not configured");
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (!token) {
    if (publicPaths.includes(pathname)) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);

    const role = payload.role as string | undefined;

    if (pathname === "/login") {
      if (role === "Teacher") {
        return NextResponse.redirect(
          new URL("/dashboard", req.url),
        );
      }

      if (role === "Teaching Assistant") {
        return NextResponse.redirect(
          new URL("/attendance", req.url),
        );
      }

      return NextResponse.redirect(new URL("/", req.url));
    }

    if (
      pathname.startsWith("/dashboard") &&
      role === "Teaching Assistant"
    ) {
      return NextResponse.redirect(
        new URL("/attendance", req.url),
      );
    }

    if (
      pathname.startsWith("/attendance") &&
      role !== "Teacher" &&
      role !== "Teaching Assistant"
    ) {
      return NextResponse.redirect(
        new URL("/dashboard", req.url),
      );
    }

    return NextResponse.next();
  } catch (error) {
    console.error("JWT VERIFY ERROR:", error);

    const response = NextResponse.redirect(
      new URL("/login", req.url),
    );

    response.cookies.delete("token");

    return response;
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};