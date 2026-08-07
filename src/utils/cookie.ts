import { Response } from "express";

const isProduction = process.env.NODE_ENV === "production";

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
) => {
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction, // HTTPS required for sameSite: "none"
    sameSite: isProduction ? ("none" as const) : ("lax" as const), // Fixes cross-domain Render deployment
    path: "/",
  };

  // 15 Minutes Access Cookie
  res.cookie("access_token", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  // 7 Days Refresh Cookie
  res.cookie("refresh_token", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearAuthCookies = (res: Response) => {
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    path: "/",
  };

  res.clearCookie("access_token", cookieOptions);
  res.clearCookie("refresh_token", cookieOptions);
};