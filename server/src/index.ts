import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "./auth.js";
import { authRouter } from "./routes/auth.js";
import { publicRouter } from "./routes/public.js";
import { adminRouter } from "./routes/admin.js";
import { ensureBaselineContent } from "./bootstrap.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 4000);
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const uploadsDir = path.resolve(__dirname, "../uploads");

app.use(
  cors({
    origin: clientOrigin,
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(
  "/uploads",
  express.static(uploadsDir, {
    etag: true,
    immutable: true,
    maxAge: "30d"
  })
);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "hotel-booking-platform" });
});

app.use("/api/auth", authRouter);
app.use("/api/public", publicRouter);
app.use("/api/admin", requireAdmin, adminRouter);

if (process.env.NODE_ENV === "production") {
  const clientDist = path.resolve(__dirname, "../client");
  app.use(
    express.static(clientDist, {
      etag: true,
      setHeaders(res, filePath) {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          return;
        }

        res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
      }
    })
  );
  app.get("*", (_req, res) => {
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed.",
      issues: error.flatten()
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return res.status(400).json({
      message: "Database request failed.",
      code: error.code
    });
  }

  if (error instanceof Error) {
    const status = error.message.includes("not available") ? 409 : 400;
    return res.status(status).json({ message: error.message });
  }

  return res.status(500).json({ message: "Unexpected server error." });
});

ensureBaselineContent()
  .then(() => {
    app.listen(port, () => {
      console.log(`Hotel booking API running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize hotel booking API.", error);
    process.exit(1);
  });
