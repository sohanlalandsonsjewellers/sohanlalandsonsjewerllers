import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { setAuthCookies, clearAuthCookies } from "../utils/cookie";

const prisma = new PrismaClient();

class AuthController {
  /**
   * User Registration
   */
  static async register(req: Request, res: Response) {
    try {
      const {
        name,
        email,
        password,
        phoneNumber,
        address,
        pincode,
        area,
        alternatePhone,
      } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          message: "Name, email, and password are required.",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email already exists.",
        });
      }

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          phoneNumber,
          address,
          pincode,
          area,
          alternatePhone,
        },
      });

      return res.status(201).json({
        success: true,
        message: "Registration successful.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Register Error:", error);
      return res.status(500).json({
        success: false,
        message: "Registration failed due to a server error.",
      });
    }
  }

  /**
   * User Login
   */
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required.",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials.",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials.",
        });
      }

      const payload = {
        id: user.id,
        email: user.email,
        adminRole: user.adminRole,
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      // Set HttpOnly Cross-Site Safe Cookies
      setAuthCookies(res, accessToken, refreshToken);

      return res.status(200).json({
        success: true,
        message: "Logged in successfully!",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          address: user.address,
          pincode: user.pincode,
          area: user.area,
          alternatePhone: user.alternatePhone,
          adminRole: user.adminRole,
        },
        token: accessToken, // Compatibility for legacy localStorage fallbacks
      });
    } catch (error) {
      console.error("Login Error:", error);
      return res.status(500).json({
        success: false,
        message: "Login failed due to a server error.",
      });
    }
  }

  /**
   * Refresh Access Token via Refresh Token Cookie
   */
  static async refreshToken(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.refresh_token;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: "Refresh Token missing.",
        });
      }

      const decoded = verifyRefreshToken(refreshToken) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        clearAuthCookies(res);
        return res.status(401).json({
          success: false,
          message: "User no longer exists.",
        });
      }

      const payload = {
        id: user.id,
        email: user.email,
        adminRole: user.adminRole,
      };

      const newAccessToken = generateAccessToken(payload);
      const newRefreshToken = generateRefreshToken(payload);

      setAuthCookies(res, newAccessToken, newRefreshToken);

      return res.status(200).json({
        success: true,
        message: "Token refreshed successfully.",
        token: newAccessToken,
      });
    } catch (error) {
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired Refresh Token.",
      });
    }
  }

  /**
   * Get Current Authenticated User Data
   */
  static async getMe(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized.",
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          address: true,
          pincode: true,
          area: true,
          alternatePhone: true,
          adminRole: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      return res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      console.error("GetMe Error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch user profile.",
      });
    }
  }

  /**
   * Logout User and Clear Cookies
   */
  static async logout(req: Request, res: Response) {
    clearAuthCookies(res);
    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  }
}

export default AuthController;