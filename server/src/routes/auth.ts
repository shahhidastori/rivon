import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db.js";
import { AuthRequest, requireAdmin, signAdminToken } from "../auth.js";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

authRouter.post("/login", async (req, res, next) => {
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

authRouter.post("/logout", (_req, res) => {
  res.json({ ok: true });
});
