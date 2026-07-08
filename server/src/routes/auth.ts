import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db.js";
import { AuthRequest, requireAdmin, signAdminToken } from "../auth.js";
import { adminProfileLimiter, authLimiter } from "../security.js";
import { adminProfileSchema } from "../validators.js";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

authRouter.post("/login", authLimiter, async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const admin = await prisma.adminUser.findUnique({
      where: { email: payload.email.toLowerCase() }
    });

    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const valid = await bcrypt.compare(payload.password, admin.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const adminProfile = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    };

    res.json({
      token: signAdminToken(adminProfile),
      admin: adminProfile
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAdmin, (req: AuthRequest, res) => {
  res.json({ admin: req.admin });
});

authRouter.patch("/me", requireAdmin, adminProfileLimiter, async (req: AuthRequest, res, next) => {
  try {
    if (!req.admin) return res.status(401).json({ message: "Admin authentication is required." });

    const payload = adminProfileSchema.parse(req.body);
    const admin = await prisma.adminUser.findUnique({ where: { id: req.admin.id } });
    if (!admin) return res.status(401).json({ message: "Admin account no longer exists." });

    const email = payload.email.toLowerCase();
    if (email !== admin.email) {
      const duplicate = await prisma.adminUser.findUnique({ where: { email } });
      if (duplicate && duplicate.id !== admin.id) {
        return res.status(409).json({ message: "That email is already used by another admin." });
      }
    }

    const nextData: { name: string; email: string; passwordHash?: string } = {
      name: payload.name,
      email
    };

    if (payload.newPassword) {
      if (!payload.currentPassword) {
        return res.status(400).json({ message: "Current password is required to set a new password." });
      }

      const validCurrentPassword = await bcrypt.compare(payload.currentPassword, admin.passwordHash);
      if (!validCurrentPassword) {
        return res.status(401).json({ message: "Current password is incorrect." });
      }

      nextData.passwordHash = await bcrypt.hash(payload.newPassword, 12);
    }

    const updated = await prisma.adminUser.update({
      where: { id: admin.id },
      data: nextData
    });

    const adminProfile = {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role
    };

    res.json({
      token: signAdminToken(adminProfile),
      admin: adminProfile
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", (_req, res) => {
  res.json({ ok: true });
});
