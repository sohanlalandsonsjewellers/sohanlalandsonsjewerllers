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

// Security Headers
app.use(helmet());

// CORS Config
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : [];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static Asset Express Route Protection
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);
app.use("/static", express.static("public"));

// Rate Limiters
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

// Session Config
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use(Routes);

// Health check
app.get("/", (req, res) => {
  res.json({
    Ping: "Pong",
    Environment: env,
    Port: PORT,
  });
});

// Cron Jobs
cron.schedule("0 0 * * *", async () => {
  try {
    console.log("Running Zero Stock Cleanup...");
    await deleteZeroStockProducts();
    console.log("Cleanup Finished");
  } catch (err) {
    console.error("Cleanup Error", err);
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Process Level Handlers
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