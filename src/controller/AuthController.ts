import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

import {
    generateAccessToken
} from "../utils/jwt";

import {
    setAccessCookie
} from "../utils/cookie";

const prisma = new PrismaClient();

class AuthController {

    static async register(
        req: Request,
        res: Response
    ) {

        try {

            const {

                name,
                email,
                password,
                phoneNumber,
                address,
                pincode,
                area,
                alternatePhone

            } = req.body;

            const existingUser =
                await prisma.user.findUnique({

                    where: {
                        email
                    }

                });

            if (existingUser) {

                return res.status(409).json({

                    success: false,

                    message: "Email already exists."

                });

            }

            const salt =
                await bcrypt.genSalt(10);

            const hashedPassword =
                await bcrypt.hash(
                    password,
                    salt
                );

            const user =
                await prisma.user.create({

                    data: {

                        name,

                        email,

                        password: hashedPassword,

                        phoneNumber,

                        address,

                        pincode,

                        area,

                        alternatePhone

                    }

                });

            return res.status(201).json({

                success: true,

                message: "Registration successful.",

                user: {

                    id: user.id,

                    name: user.name,

                    email: user.email

                }

            });

        }

        catch (error) {

            console.error(error);

            return res.status(500).json({

                success: false,

                message: "Registration failed."

            });

        }

    }

    static async login(
        req: Request,
        res: Response
    ) {

        try {

            const {

                email,
                password

            } = req.body;

            const user =
                await prisma.user.findUnique({

                    where: {
                        email
                    }

                });

            if (!user) {

                return res.status(401).json({

                    success: false,

                    message: "Invalid credentials."

                });

            }

            const isMatch =
                await bcrypt.compare(

                    password,

                    user.password

                );

            if (!isMatch) {

                return res.status(401).json({

                    success: false,

                    message: "Invalid credentials."

                });

            }

            /**
             * Keep payload minimal
             */

            const payload = {

                id: user.id,

                email: user.email,

                adminRole: user.adminRole

            };

            /**
             * 15 Minutes Access Token
             */

            const accessToken =
                generateAccessToken(
                    payload
                );

            /**
             * HttpOnly Cookie
             */

            setAccessCookie(

                res,

                accessToken

            );

            /**
             * Temporary backward compatibility
             *
             * TODO:
             * Remove token after frontend migration.
             */

            return res.status(200).json({

                success: true,

                message: "Logged in successfully!",

                user: {

                    id: user.id,

                    name: user.name,

                    email: user.email,

                    phoneNumber: user.phoneNumber,

                    address: user.address,

                    pincode: user.pincode,

                    area: user.area,

                    alternatePhone: user.alternatePhone,

                    adminRole: user.adminRole

                },

                token: accessToken

            });

        }

        catch (error) {

            console.error(error);

            return res.status(500).json({

                success: false,

                message: "Something went wrong."

            });

        }

    }

}

export default AuthController;