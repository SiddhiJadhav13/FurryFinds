import { updateSession } from "./src/utils/supabase/middleware";
import { NextResponse } from "next/server";

export async function middleware(request) {
  if (request.nextUrl.pathname.startsWith("/auth")) {
    return NextResponse.next();
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
