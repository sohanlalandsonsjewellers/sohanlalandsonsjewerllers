import { Response } from "express";

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
) => {
  // Localhost (http) par false rahega, Render Dev / Main (https) par automatically true hoga
  const isHttps = process.env.NODE_ENV === "production" || process.env.IS_RENDER === "true" || process.env.RENDER === "true";

  const cookieOptions = {
    httpOnly: true,
    secure: isHttps, // HTTPS domains (Render Dev & Prod) ke liye mandatory true
    sameSite: isHttps ? ("none" as const) : ("lax" as const), // Cross-domain Render Deployment fix
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
  const isHttps = process.env.NODE_ENV === "production" || process.env.IS_RENDER === "true" || process.env.RENDER === "true";

  const cookieOptions = {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? ("none" as const) : ("lax" as const),
    path: "/",
  };

  res.clearCookie("access_token", cookieOptions);
  res.clearCookie("refresh_token", cookieOptions);
};