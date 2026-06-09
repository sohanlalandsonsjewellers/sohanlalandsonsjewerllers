import { Request, Response } from "express";
import prisma from "../config/db.config";
import * as bcrypt from "bcrypt";

class UserController {
  // GET ALL USERS (ADMIN ONLY)
  static async getAllUsers(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          adminRole: true,
          created_at: true
        }
      });

      return res.json({ success: true, users });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Something went wrong." });
    }
  }

  // GET USER BY ID
  static async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          adminRole: true,
          created_at: true
        }
      });

      if (!user) return res.status(404).json({ success: false, message: "User not found" });

      return res.json({ success: true, user });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Something went wrong." });
    }
  }

  // UPDATE USER
  static async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = { ...req.body }; // ✅ Clone karo taaki original body safe rahe

      // ✅ FIX: 'id' ko updates object se delete kar do
      if (updates.id) {
        delete updates.id;
      }

      // Check if user wants to modify adminRole
      if (updates.adminRole !== undefined) {
        if (!req.user || req.user.adminRole !== true) {
          return res.status(403).json({
            success: false,
            message: "Only admin can change adminRole.",
          });
        }
      }

      // Hash password if updating
      if (updates.password) {
        const salt = bcrypt.genSaltSync(10);
        updates.password = bcrypt.hashSync(updates.password, salt);
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updates, // ✅ Ab yahan sirf safe fields hain
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          adminRole: true,
          created_at: true,
          updated_at: true,
          address: true, // ✅ Address aur pincode bhi return mein le lo
          pincode: true
        }
      });

      return res.json({
        success: true,
        message: "User updated successfully",
        user: updatedUser
      });
    } catch (error) {
      console.error("PRISMA UPDATE ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Something went wrong."
      });
    }
  }
  // ✅ YE HAI WO NEW API jo tumhare Frontend ko fresh data degi
  static async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id; // Ab ye error nahi dega kyunki tumne types fix kar liye hain
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          address: true, // ✅ Ab ye DB se fetch hoga
          pincode: true,  // ✅ Ab ye DB se fetch hoga
          area: true, // ✅ YAHAN AREA ADD KARO!
        }
      });
      return res.json({ success: true, user });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error fetching profile" });
    }
  }

  // DELETE USER
  static async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.user.delete({ where: { id } });

      return res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error(error);

      return res.status(500).json({ success: false, message: "Something went wrong." });
    }
  }
}

export default UserController;
