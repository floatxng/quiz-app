import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./db";

const SECRET = process.env.JWT_SECRET || "dev-secret-please-change";
const COOKIE = "qa_token";
const TTL = 60 * 60 * 24 * 7; // 7 days

export type SessionUser = {
  id: string;
  username: string;
  email: string;
  role: "PARTICIPANT" | "ORGANIZER";
};

export type JwtPayload = {
  uid: string;
  role: "PARTICIPANT" | "ORGANIZER";
};

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: JwtPayload) {
  return jwt.sign(payload, SECRET, { expiresIn: TTL });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function setSessionCookie(token: string) {
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: TTL,
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE);
}

export function readToken(): string | null {
  return cookies().get(COOKIE)?.value ?? null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = readToken();
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.uid } });
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role as SessionUser["role"],
  };
}

export async function requireUser() {
  const u = await getSessionUser();
  if (!u) throw new Response("Unauthorized", { status: 401 });
  return u;
}
