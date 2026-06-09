import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();


// ================================
// PINCODE -> AREA HELPER
// ================================

const getAreaFromPincode = async (
  pincode: string
) => {
  try {
    const res = await axios.get(
      `https://api.postalpincode.in/pincode/${pincode}`
    );

    if (
      res.data[0].Status === "Success"
    ) {
      return res.data[0]
        .PostOffice[0].Name;
    }

    return "Unknown Area";
  } catch {
    return "Unknown Area";
  }
};


// ================================
// GUEST FEEDBACK
// ================================

export const submitGuestFeedback =
  async (
    req: Request,
    res: Response
  ) => {
    try {

      const {
        userName,
        pincode,
        rating,
        comment,
      } = req.body;

      const area =
        await getAreaFromPincode(
          pincode
        );

      const feedback =
        await prisma.userFeedback.create({
          data: {
            userName,
            area,
            pincode,
            rating:
              Number(rating),
            comment,
          },
        });

      return res.status(201).json({
        success: true,
        message:
          "Feedback submitted!",
        feedback,
      });

    } catch {

      return res.status(500).json({
        success: false,
        message:
          "Feedback submission failed",
      });

    }
  };


// ================================
// AUTH USER FEEDBACK
// ================================

export const submitAuthFeedback =
  async (
    req: Request,
    res: Response
  ) => {
    try {

      const {
        rating,
        comment,
      } = req.body;

      const userId =
        (req as any).user.id;

      const user =
        await prisma.user.findUnique({
          where: {
            id: userId,
          },
        });

      if (!user) {

        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });

      }

      const feedback =
        await prisma.userFeedback.create({
          data: {
            userId:
              user.id,

            userName:
              user.name,

            area:
              user.area || "",

            pincode:
              user.pincode || "",

            rating:
              Number(rating),

            comment,
          },
        });

      return res.status(201).json({
        success: true,
        message:
          "Feedback submitted!",
        feedback,
      });

    } catch {

      return res.status(500).json({
        success: false,
        message:
          "Feedback submission failed",
      });

    }
  };


// ================================
// GET ALL FEEDBACKS
// ================================

export const getAllFeedbacks =
  async (
    req: Request,
    res: Response
  ) => {
    try {

      const feedbacks =
        await prisma.userFeedback.findMany({

          orderBy: {
            createdAt:
              "desc",
          },

        });

      return res.json({

        success: true,

        feedbacks,

      });

    } catch {

      return res.status(500).json({

        success: false,

        message:
          "Could not fetch feedback",

      });

    }
  };


// ================================
// DELETE FEEDBACK
// ================================

export const deleteFeedback =
  async (
    req: Request,
    res: Response
  ) => {
    try {

      const { id } =
        req.params;

      await prisma.userFeedback.delete({

        where: {
            id: id,
        }

      });

      return res.json({

        success: true,

        message:
          "Feedback Deleted Successfully",

      });

    } catch {

      return res.status(500).json({

        success: false,

        message:
          "Unable to delete feedback",

      });

    }
  };