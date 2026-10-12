import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import path from "path";
import { authRouter } from "./routes/auth.js";
import { rolesRouter } from "./routes/roles.js";
import { usersRouter } from "./routes/users.js";
import { franchisesRouter } from "./routes/franchises.js";
import { bannerTemplatesRouter } from "./routes/banner-templates.js";
import { canvasRouter } from "./routes/canvas-api.js";
import { UPLOADS_DIR, ensureUploadDirs } from "./lib/canvas/watermark.js";

function getAllowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS;
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

export function createApp() {
  const app = express();
  const allowedOrigins = getAllowedOrigins();

  // JSON APIs: skip ETag (Express still runs the full handler to build body; ETag adds no real win here)
  app.set("etag", false);

  void ensureUploadDirs();

  app.use(
    cors({
      origin(origin, callback) {
        const cleanOrigin = origin ? origin.replace(/\/+$/, "") : null;
        if (!cleanOrigin || allowedOrigins.includes(cleanOrigin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`Origin ${origin} is not allowed by CORS.`));
      },
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Static uploads serving
  app.use("/uploads", express.static(UPLOADS_DIR));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "fbs-backend" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/roles", rolesRouter);
  app.use("/api", franchisesRouter);
  app.use("/api", bannerTemplatesRouter);
  app.use("/api", canvasRouter);

  app.use((_req, res) => {
    res.status(404).json({ message: "Not found." });
  });

  return app;
}
