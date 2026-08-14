import { Response } from "express";

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
) => {
  // Render environment (Dev ya Prod) aur Production HTTPS ke liye dynamically True hoga
  const isHttps =
    process.env.NODE_ENV === "production" ||
    process.env.IS_RENDER === "true" ||
    process.env.RENDER === "true";

  const cookieOptions = {
    httpOnly: true,
    secure: isHttps, // Render HTTPS par mandatory true
    sameSite: isHttps ? ("none" as const) : ("lax" as const), // Fixes cross-domain Render deployment
    path: "/",
  };

  // 15 Minutes Access Cookie
  res.cookie("access_token", accessToken, {
    ...cookieOptions,
    maxAge: 60 * 60 * 1000,
  });

  // 7 Days Refresh Cookie
  res.cookie("refresh_token", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearAuthCookies = (res: Response) => {
  const isHttps =
    process.env.NODE_ENV === "production" ||
    process.env.IS_RENDER === "true" ||
    process.env.RENDER === "true";

  const cookieOptions = {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? ("none" as const) : ("lax" as const),
    path: "/",
  };

  res.clearCookie("access_token", cookieOptions);
  res.clearCookie("refresh_token", cookieOptions);
};