import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

// Helper Function: Pincode -> Area
const getAreaFromPincode = async (pincode: string) => {
  try {
    const res = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
    if (res.data[0].Status === "Success") {
      return res.data[0].PostOffice[0].Name;
    }
    return "Unknown Area";
  } catch {
    return "Unknown Area";
  }
};

// 1. GUEST FEEDBACK (No Auth)
export const submitGuestFeedback = async (req: Request, res: Response) => {
  try {
    const { userName, pincode, rating, comment } = req.body;
    
    const area = await getAreaFromPincode(pincode);

    const feedback = await prisma.userFeedback.create({
      data: { userName, area, pincode, rating: Number(rating), comment }
    });
    
    return res.status(201).json({ success: true, message: "Feedback submitted!", feedback });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Feedback submission failed" });
  }
};

// 2. AUTH FEEDBACK (Logged In)
export const submitAuthFeedback = async (req: Request, res: Response) => {
  try {
    const { rating, comment } = req.body;
    const userId = (req as any).user.id; // Middleware se user id

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const feedback = await prisma.userFeedback.create({
      data: {
        userId: user.id,
        userName: user.name,
        area: user.area || "",
        pincode: user.pincode || "",
        rating: Number(rating),
        comment
      }
    });
    return res.status(201).json({ success: true, message: "Feedback submitted!", feedback });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Feedback submission failed" });
  }
};

export const getAllFeedbacks = async (req: Request, res: Response) => {
  try {
    const feedbacks = await prisma.userFeedback.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, feedbacks });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not fetch feedback" });
  }
};