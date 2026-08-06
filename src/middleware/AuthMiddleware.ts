import {

    Request,

    Response,

    NextFunction

} from "express";

import {

    verifyAccessToken

} from "../utils/jwt";

const authMiddleware = (

    req: Request,

    res: Response,

    next: NextFunction

) => {

    try {

        let token: string | undefined;

        /**
         * Bearer Token
         */

        const authHeader =
            req.headers.authorization;

        if (

            authHeader &&

            authHeader.startsWith("Bearer ")

        ) {

            token =
                authHeader.split(" ")[1];

        }

        /**
         * HttpOnly Cookie
         */

        if (

            !token &&

            (req as any).cookies?.access_token

        ) {

            token =
                (req as any).cookies.access_token;

        }

        if (!token) {

            return res.status(401).json({

                success: false,

                message: "Unauthorized"

            });

        }

        const payload =
            verifyAccessToken(token);

        (req as any).user = payload;

        next();

    }

    catch (err) {

        console.error(err);

        return res.status(401).json({

            success: false,

            message: "Token expired or invalid."

        });

    }

};

export default authMiddleware;