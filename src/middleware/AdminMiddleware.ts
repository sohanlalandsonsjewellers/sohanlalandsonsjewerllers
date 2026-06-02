import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface User {
      adminRole?: boolean;
    }
  }
}

export const verifyAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.adminRole) {
    return res.status(403).json({
      success: false,
      message: "Admin access only!"
    });
  }
  next();
};
