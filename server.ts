import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import rateLimit from "express-rate-limit";
import path from "path";

const env = process.env.NODE_ENV || "local";
dotenv.config({ path: `.env.${env}` });

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;


// ===========================
// Middleware
// ===========================
// 1. .env se string lo aur comma se split karke array banao
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : [];

// 2. CORS middleware ko update karo
app.use(cors({
  origin: function (origin, callback) {
    // Agar request server-to-server hai (!origin) ya origin allowed list mein hai
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/static", express.static("public"));



// Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests, try again later." },
});
app.use(globalLimiter);

// Sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production" },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Test Route
app.get("/", (req, res) => {
  res.json({ Ping: "Pong", Environment: env, Port: PORT });
});

// Main Routes
import Routes from "./src/routes/index.js";
app.use(Routes);

// 404 Handler
app.use((req, res) => {
  res
    .status(404)
    .json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Error Handlers
process.on("unhandledRejection", (err: any) => {
  console.error("Unhandled Rejection:", err?.message ?? err);
});
process.on("uncaughtException", (err: any) => {
  console.error("Uncaught Exception:", err?.message ?? err);
  process.exit(1);
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${env} mode`);
});

server.on("error", (err: any) => {
  console.error("Server failed to start:", err);
});

export default app;
