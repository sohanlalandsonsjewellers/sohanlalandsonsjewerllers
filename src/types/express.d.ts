import { Request } from "express";

declare module "express-serve-static-core" {
  interface Request {
    user: {
      id: string;
      name: string;
      email: string;
      adminRole?: boolean;   // ✅ Yeh add karo
      address?: string;      // ✅ Yeh add karo
      pincode?: string;      // ✅ Yeh add karo
    };
  }
}