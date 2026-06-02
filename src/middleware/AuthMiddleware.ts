import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from "express";

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log("❌ Auth Header missing or invalid format!");
        return res.status(401).json({ message: "UnAuthorized" });
    }

    const token = authHeader.split(" ")[1];
    
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET as string);
        (req as any).user = payload; 
        console.log("✅ Auth Success!");
        next(); 
    } catch (err) {
        console.log("❌ Token Verification Failed:", err);
        return res.status(401).json({ message: "UnAuthorized: Token expired or invalid" });
    }
};

export default authMiddleware;