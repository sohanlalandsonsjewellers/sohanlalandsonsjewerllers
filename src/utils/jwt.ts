import jwt, { JwtPayload } from "jsonwebtoken";

export interface UserPayload {
  id: string | number;
  email: string;
  adminRole?: boolean | string | null;
}

export const generateAccessToken = (payload: UserPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: "15m",
  });
};

export const generateRefreshToken = (payload: UserPayload): string => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET as string, {
    expiresIn: "7d",
  });
};

export const verifyAccessToken = (token: string): JwtPayload | string => {
  return jwt.verify(token, process.env.JWT_SECRET as string);
};

export const verifyRefreshToken = (token: string): JwtPayload | string => {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string);
};