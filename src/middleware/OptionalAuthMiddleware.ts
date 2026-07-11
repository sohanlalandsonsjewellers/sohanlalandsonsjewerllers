import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/db.config.js";

export default async function OptionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      (req as any).user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];

    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    );

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id
      }
    });

    (req as any).user = user ?? null;

    next();

  } catch {

    (req as any).user = null;

    next();

  }
}