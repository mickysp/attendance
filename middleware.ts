import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const url = req.nextUrl.pathname;

  if (url.startsWith("/_next") || url.startsWith("/api") || url.includes(".")) {
    return NextResponse.next();
  }

  const publicPaths = ["/login", "/register", "/forgot-password"];

  if (!token) {
    if (publicPaths.includes(url)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    const role = payload.role as string;

    if (url === "/login") {
      if (role === "Admin") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      if (role === "Teacher") {
        return NextResponse.redirect(new URL("/attendance", req.url));
      }
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (url.startsWith("/dashboard") && role !== "Admin") {
      return NextResponse.redirect(new URL("/attendance", req.url));
    }

    if (url.startsWith("/attendance") && role !== "Teacher") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}