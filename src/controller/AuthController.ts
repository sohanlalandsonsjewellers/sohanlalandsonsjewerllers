import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { name, email, password, phoneNumber, address, pincode, area, alternatePhone } = req.body;

      // ✅ PASSWORD HASHING (This was missing, causing Login Failed issue)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await prisma.user.create({
        data: { 
          name, 
          email, 
          password: hashedPassword, // ✅ Store hashed password
          phoneNumber, 
          address, 
          pincode, 
          area, // ✅ Area stored
          alternatePhone 
        }
      });

      return res.status(201).json({ success: true, user });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Registration failed" });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) return res.status(401).json({ message: "Invalid credentials" });

      // ✅ Compare hashed password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

      const payload = {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address || "",
        pincode: user.pincode || "",
        area: user.area || "", // ✅ Added area in token
        alternatePhone: user.alternatePhone || "",
        adminRole: user.adminRole,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: "365d" });

      return res.json({ message: "Logged in successfully!", user: payload, token });
    } catch (error) {
      return res.status(500).json({ message: "Something went wrong." });
    }
  }
}

export default AuthController;