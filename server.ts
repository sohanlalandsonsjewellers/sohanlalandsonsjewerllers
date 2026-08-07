import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import passport from "passport";
import rateLimit from "express-rate-limit";
import path from "path";
import cron from "node-cron";
import cookieParser from "cookie-parser";

import { deleteZeroStockProducts } from "./src/utils/deleteZeroStockProducts.js";
import Routes from "./src/routes/index.js";

const env = process.env.NODE_ENV || "local";

dotenv.config({
  path: `.env.${env}`,
});

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Dynamic & Cleaned CORS Config (Auto-strips trailing slashes)
const rawOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://sohanlalandsonsjeweller-fe.onrender.com",
      "https://sohanlalandsonsjewerller-tg8k.vercel.app",
    ];

const allowedOrigins = rawOrigins.map((item) => item.trim().replace(/\/$/, ""));

app.use(
  cors({
    origin: function (origin, callback) {
      const cleanOrigin = origin ? origin.replace(/\/$/, "") : origin;
      if (!cleanOrigin || allowedOrigins.includes(cleanOrigin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS Blocked for Origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/static", express.static("public"));

const globalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

app.use(globalLimiter);

const isHttps =
  process.env.NODE_ENV === "production" ||
  process.env.IS_RENDER === "true" ||
  process.env.RENDER === "true";

app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? "none" : "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(Routes);

app.get("/", (req, res) => {
  res.json({
    Ping: "Pong",
    Environment: env,
    Port: PORT,
  });
});

cron.schedule("0 0 * * *", async () => {
  try {
    console.log("Running Zero Stock Cleanup...");
    await deleteZeroStockProducts();
    console.log("Cleanup Finished");
  } catch (err) {
    console.error("Cleanup Error", err);
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

process.on("unhandledRejection", (err: any) => {
  console.error("Unhandled Rejection:", err?.message ?? err);
});

process.on("uncaughtException", (err: any) => {
  console.error("Uncaught Exception:", err?.message ?? err);
  process.exit(1);
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${env} mode`);
});

server.on("error", (err: any) => {
  console.error("Server failed to start:", err);
});

export default app;