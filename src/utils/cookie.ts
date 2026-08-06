import { Response } from "express";

export const setAccessCookie = (

    res: Response,

    token: string

) => {

    res.cookie(

        "access_token",

        token,

        {

            httpOnly: true,

            secure:
                process.env.NODE_ENV === "production",

            sameSite: "lax",

            maxAge: 15 * 60 * 1000,

            path: "/"

        }

    );

};

export const clearAccessCookie = (

    res: Response

) => {

    res.clearCookie(

        "access_token",

        {

            path: "/"

        }

    );

};