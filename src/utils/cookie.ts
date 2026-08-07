import { Response } from "express";

const isProduction = process.env.NODE_ENV === "production";

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
) => {
  // 15 Minutes Access Cookie
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 15 * 60 * 1000,
    path: "/",
  });

  // 7 Days Refresh Cookie
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth/refresh",
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/api/auth/refresh" });
};


// import { Response } from "express";

// const isProduction = process.env.NODE_ENV === "production";

// export const setAuthCookies = (
//   res: Response,
//   accessToken: string,
//   refreshToken: string
// ) => {
//   // Access Token Cookie (15 Mins)
//   res.cookie("access_token", accessToken, {
//     httpOnly: true,
//     secure: isProduction,
//     sameSite: isProduction ? "strict" : "lax",
//     maxAge: 15 * 60 * 1000,
//     path: "/",
//   });

//   // Refresh Token Cookie (7 Days)
//   res.cookie("refresh_token", refreshToken, {
//     httpOnly: true,
//     secure: isProduction,
//     sameSite: isProduction ? "strict" : "lax",
//     maxAge: 7 * 24 * 60 * 60 * 1000,
//     path: "/", // Changed from '/api/auth/refresh' to '/' for browser visibility
//   });
// };

// export const clearAuthCookies = (res: Response) => {
//   res.clearCookie("access_token", { path: "/" });
//   res.clearCookie("refresh_token", { path: "/" });
// };