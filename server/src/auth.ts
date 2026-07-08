import type { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "./db.js";

const rawJwtSecret = process.env.JWT_SECRET || "";

if (process.env.NODE_ENV === "production" && rawJwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be set to at least 32 characters in production.");
}

const jwtSecret = rawJwtSecret || "dev-only-secret-change-me";

export type AuthRequest = Request & {
  admin?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
};

export function signAdminToken(admin: { id: string; email: string; name: string; role: string }) {
  return jwt.sign(admin, jwtSecret, { expiresIn: "8h" });
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Admin authentication is required." });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] }) as JwtPayload & { id?: string };
    if (!decoded.id) {
      return res.status(401).json({ message: "Invalid or expired admin session." });
    }

    const admin = await prisma.adminUser.findUnique({ where: { id: decoded.id } });

    if (!admin) {
      return res.status(401).json({ message: "Admin account no longer exists." });
    }

    if (decoded.iat && decoded.iat * 1000 + 5000 < admin.updatedAt.getTime()) {
      return res.status(401).json({ message: "Admin session has expired. Please log in again." });
    }

    req.admin = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired admin session." });
  }
}
