import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

class AuthController {
  // ------------------ REGISTER ------------------
  static async register(req: Request, res: Response) {
    try {
      const payload = req.body;

      // Always force adminRole to false on public registrations
      payload.adminRole = false;

      // Check duplicate email validation checks
      const existingEmail = await prisma.user.findUnique({
        where: { email: payload.email },
      });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists!" });
      }

      // Check duplicate phone number validation leaks
      const existingPhone = await prisma.user.findUnique({
        where: { phoneNumber: payload.phoneNumber },
      });
      if (existingPhone) {
        return res.status(400).json({ message: "Phone number already exists!" });
      }

      // Hash password
      const salt = bcrypt.genSaltSync(10);
      payload.password = bcrypt.hashSync(payload.password, salt);

      // Create user with explicit Prisma mappings safely unpacking items layer payload properties
      const user = await prisma.user.create({
        data: {
          name: payload.name,
          email: payload.email,
          password: payload.password,
          phoneNumber: payload.phoneNumber,
          address: payload.address || "",         // 🚀 RESTORES ADDRESS FROM REQUEST TO MONGO
          pincode: payload.pincode || "",         // 🚀 RESTORES PINCODE
          alternatePhone: payload.alternatePhone || "", // 🚀 RESTORES BACKUP PHONE
          adminRole: payload.adminRole,
        },
      });

      return res.json({
        message: "Account created successfully!",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          address: user.address,
          pincode: user.pincode,
          alternatePhone: user.alternatePhone,
          adminRole: user.adminRole,
          created_at: user.created_at,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  }

  // ------------------ LOGIN ------------------
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Compare passwords encryption signatures
      const isMatch = bcrypt.compareSync(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // 🚀 🔥 FIXED JWT PAYLOAD: Injected complete data rows to ensure local caching works seamlessly!
      const payload = {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber, // database native phone field mapping link
        address: user.address || "",    // Passes default string buffer fallback if profile hasn't loaded it
        pincode: user.pincode || "",
        alternatePhone: user.alternatePhone || "",
        adminRole: user.adminRole,
      };

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error("JWT_SECRET missing in environment variables");
      }

      // Create token validity lifespan signature
      const token = jwt.sign(payload, jwtSecret, { expiresIn: "365d" });

      return res.json({
        message: "Logged in successfully!",
        user: payload, // Passes payload mapping model directly to AuthProvider context buffers
        token, 
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Something went wrong." });
    }
  }
}

export default AuthController;