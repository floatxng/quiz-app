import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  clearSessionCookie();
  const url = new URL("/", req.url);
  return NextResponse.redirect(url, { status: 303 });
}
