import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "./db.js";

const jwtSecret = process.env.JWT_SECRET || "dev-only-secret-change-me";

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
    const decoded = jwt.verify(token, jwtSecret) as { id: string };
    const admin = await prisma.adminUser.findUnique({ where: { id: decoded.id } });

    if (!admin) {
      return res.status(401).json({ message: "Admin account no longer exists." });
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
