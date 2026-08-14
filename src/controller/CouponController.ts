import { Request, Response } from "express";
import {
    PrismaClient,
    CouponEligibility,
} from "@prisma/client";

const prisma = new PrismaClient();

interface CouponSlabInput {
    minAmount: number;
    discountPercent: number;
}

interface CouponSlabRow {
    id: string;
    couponId: string;
    minAmount: number;
    discountPercent: number;
    createdAt: Date;
    updatedAt: Date;
}

interface ProductRow {
    id: string;
    name: string;
    price: number;
    stock: number;
    sku: string | null;
}

interface CartItemInput {
    productId: string;
    qty: number;
}

class CouponController {

    // ==============================================================
    // CREATE COUPON
    // ==============================================================

    static async create(
        req: Request,
        res: Response
    ) {
        try {
            const {
                code,
                description,
                startAt,
                expiresAt,
                usageLimit,
                eligibility,
                slabs,
            } = req.body;

            // --------------------------------------------------------
            // BASIC VALIDATION
            // --------------------------------------------------------

            if (
                !code ||
                typeof code !== "string" ||
                code.trim() === ""
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Coupon code is required",
                });
            }

            if (
                !Array.isArray(slabs) ||
                slabs.length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "At least one coupon slab is required",
                });
            }

            // --------------------------------------------------------
            // NORMALIZE CODE
            // --------------------------------------------------------

            const normalizedCode =
                code.trim().toUpperCase();

            // --------------------------------------------------------
            // NORMALIZE ELIGIBILITY
            // --------------------------------------------------------

            const normalizedEligibility =
                eligibility === undefined ||
                    eligibility === null ||
                    eligibility === ""
                    ? CouponEligibility.ALL
                    : String(eligibility)
                        .trim()
                        .toUpperCase();

            if (
                normalizedEligibility !==
                CouponEligibility.ALL &&
                normalizedEligibility !==
                CouponEligibility.FIRST_ORDER
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Eligibility must be ALL or FIRST_ORDER",
                });
            }

            // --------------------------------------------------------
            // CHECK DUPLICATE COUPON
            // --------------------------------------------------------

            const existingCoupon =
                await prisma.coupon.findUnique({
                    where: {
                        code: normalizedCode,
                    },
                });

            if (existingCoupon) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Coupon code already exists",
                });
            }

            // --------------------------------------------------------
            // NORMALIZE SLABS
            // --------------------------------------------------------

            const normalizedSlabs: CouponSlabInput[] =
                slabs.map(
                    (
                        slab: any
                    ): CouponSlabInput => ({
                        minAmount:
                            Number(
                                slab.minAmount
                            ),

                        discountPercent:
                            Number(
                                slab.discountPercent
                            ),
                    })
                );

            // --------------------------------------------------------
            // VALIDATE SLABS
            // --------------------------------------------------------

            for (
                const slab of normalizedSlabs
            ) {
                // Minimum amount

                if (
                    !Number.isFinite(
                        slab.minAmount
                    ) ||
                    slab.minAmount < 0
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Each slab must have a valid minimum amount",
                    });
                }

                // Discount percentage

                if (
                    !Number.isFinite(
                        slab.discountPercent
                    ) ||
                    slab.discountPercent <= 0 ||
                    slab.discountPercent > 100
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Discount percentage must be greater than 0 and up to 100",
                    });
                }
            }

            // --------------------------------------------------------
            // CHECK DUPLICATE MINIMUM AMOUNTS
            // --------------------------------------------------------

            const minAmounts: number[] =
                normalizedSlabs.map(
                    (
                        slab: CouponSlabInput
                    ) =>
                        slab.minAmount
                );

            const uniqueMinAmounts =
                new Set<number>(
                    minAmounts
                );

            if (
                uniqueMinAmounts.size !==
                minAmounts.length
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Duplicate slab minimum amounts are not allowed",
                });
            }

            // --------------------------------------------------------
            // SORT SLABS
            // --------------------------------------------------------

            normalizedSlabs.sort(
                (
                    a: CouponSlabInput,
                    b: CouponSlabInput
                ) =>
                    a.minAmount -
                    b.minAmount
            );

            // --------------------------------------------------------
            // CREATE COUPON
            // --------------------------------------------------------

            const coupon =
                await prisma.coupon.create({
                    data: {
                        code:
                            normalizedCode,

                        description:
                            typeof description ===
                                "string" &&
                                description.trim() !== ""
                                ? description.trim()
                                : null,

                        isActive: true,

                        eligibility:
                            normalizedEligibility,

                        startAt:
                            startAt
                                ? new Date(startAt)
                                : null,

                        expiresAt:
                            expiresAt
                                ? new Date(expiresAt)
                                : null,

                        usageLimit:
                            usageLimit !==
                                undefined &&
                                usageLimit !== null
                                ? Number(
                                    usageLimit
                                )
                                : null,

                        slabs: {
                            create:
                                normalizedSlabs,
                        },
                    },

                    include: {
                        slabs: true,
                    },
                });

            return res.status(201).json({
                success: true,
                message:
                    "Coupon created successfully",
                coupon,
            });

        } catch (error: any) {
            console.error(
                "Create Coupon Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to create coupon",
                error:
                    error?.message,
            });
        }
    }

    // ==============================================================
    // VALIDATE COUPON
    // ==============================================================

    static async validate(req: Request, res: Response) {
        try {
            const { code, items } = req.body;

            if (!code || typeof code !== "string" || code.trim() === "") {
                return res.status(400).json({ success: false, message: "Coupon code is required" });
            }

            if (!Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ success: false, message: "Cart items are required" });
            }

            const normalizedCode = code.trim().toUpperCase();

            const coupon = await prisma.coupon.findUnique({
                where: { code: normalizedCode },
                include: { slabs: true },
            });

            if (!coupon) {
                return res.status(404).json({ success: false, message: "Invalid coupon code" });
            }

            // ========================================================
            // FIRST ORDER ELIGIBILITY CHECK (FIXED)
            // ========================================================
            if (coupon.eligibility === CouponEligibility.FIRST_ORDER) {
                const userId = (req as any).user?.id;

                if (!userId) {
                    return res.status(401).json({
                        success: false,
                        message: "Please login to use this first-order coupon.",
                    });
                }

                // Agar user ka koi bhi order jo CANCELLED ya REJECTED nahi hai exist karta hai, 
                // toh woh purana customer hai aur use FIRST_ORDER coupon nahi milega.
                const previousOrder = await prisma.order.findFirst({
                    where: {
                        userId: String(userId),
                        status: {
                            notIn: ["CANCELLED", "REJECTED"],
                        },
                    },
                    select: { id: true },
                });

                if (previousOrder) {
                    return res.status(400).json({
                        success: false,
                        message: "This coupon is valid only for your first order.",
                    });
                }
            }

            if (!coupon.isActive) {
                return res.status(400).json({ success: false, message: "This coupon is inactive" });
            }

            const now = new Date();
            if (coupon.startAt && now < coupon.startAt) {
                return res.status(400).json({ success: false, message: "This coupon is not active yet" });
            }

            if (coupon.expiresAt && now > coupon.expiresAt) {
                return res.status(400).json({ success: false, message: "This coupon has expired" });
            }

            if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
                return res.status(400).json({ success: false, message: "This coupon usage limit has been reached" });
            }

            // Calculate Subtotal from database products
            const productIds = items.map((item: any) => String(item.productId));
            const products = await prisma.product.findMany({
                where: { id: { in: productIds }, deletedAt: null },
            });

            if (products.length !== productIds.length) {
                return res.status(400).json({ success: false, message: "One or more cart products are no longer available" });
            }

            let subtotal = 0;
            const validatedItems = items.map((item: any) => {
                const product = products.find((p) => p.id === item.productId);
                if (!product) throw new Error("Product not found");
                const qty = Number(item.qty);
                if (qty > product.stock) {
                    throw new Error(`${product.name} does not have enough stock`);
                }
                const unitPrice = Number(product.price);
                const lineTotal = unitPrice * qty;
                subtotal += lineTotal;
                return {
                    productId: product.id,
                    name: product.name,
                    sku: product.sku,
                    quantity: qty,
                    unitPrice,
                    lineTotal: Number(lineTotal.toFixed(2)),
                };
            });

            subtotal = Number(subtotal.toFixed(2));

            // Find eligible slabs
            const eligibleSlabs = coupon.slabs
                .filter((slab) => subtotal >= Number(slab.minAmount))
                .sort((a, b) => Number(b.minAmount) - Number(a.minAmount));

            if (eligibleSlabs.length === 0) {
                const minimumRequired = Math.min(...coupon.slabs.map((slab) => Number(slab.minAmount)));
                return res.status(400).json({
                    success: false,
                    message: `Minimum cart value of ₹${minimumRequired} is required for this coupon`,
                    subtotal,
                    minimumRequired,
                });
            }

            const selectedSlab = eligibleSlabs[0];
            const discountPercent = Number(selectedSlab.discountPercent);
            const discountAmount = Number(((subtotal * discountPercent) / 100).toFixed(2));
            const taxableAmount = Number((subtotal - discountAmount).toFixed(2));

            return res.status(200).json({
                success: true,
                message: "Coupon applied successfully",
                coupon: {
                    code: coupon.code,
                    slab: {
                        minAmount: Number(selectedSlab.minAmount),
                        discountPercent,
                    },
                },
                pricing: {
                    subtotal,
                    discountPercent,
                    discountAmount,
                    taxableAmount,
                },
                items: validatedItems,
            });
        } catch (error: any) {
            console.error("Validate Coupon Error:", error);
            return res.status(500).json({
                success: false,
                message: error?.message || "Failed to validate coupon",
            });
        }
    }

    // ==============================================================
    // GET ALL COUPONS
    // ==============================================================

    static async getAll(
        req: Request,
        res: Response
    ) {
        try {
            const coupons =
                await prisma.coupon.findMany({
                    include: {
                        slabs: {
                            orderBy: {
                                minAmount:
                                    "asc",
                            },
                        },
                    },

                    orderBy: {
                        createdAt:
                            "desc",
                    },
                });

            return res.status(200).json({
                success: true,
                count:
                    coupons.length,
                coupons,
            });

        } catch (error: any) {
            console.error(
                "Get All Coupons Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to fetch coupons",
                error:
                    error?.message,
            });
        }
    }

    // ==============================================================
    // UPDATE COUPON
    // ==============================================================

    static async update(
        req: Request,
        res: Response
    ) {
        try {
            const { id } =
                req.params;

            const {
                code,
                description,
                startAt,
                expiresAt,
                usageLimit,
                isActive,
                eligibility,
                slabs,
            } = req.body;

            // --------------------------------------------------------
            // CHECK ID
            // --------------------------------------------------------

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Coupon ID is required",
                });
            }

            // --------------------------------------------------------
            // FIND EXISTING COUPON
            // --------------------------------------------------------

            const existingCoupon =
                await prisma.coupon.findUnique({
                    where: {
                        id,
                    },

                    include: {
                        slabs: true,
                    },
                });

            if (!existingCoupon) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Coupon not found",
                });
            }

            // --------------------------------------------------------
            // NORMALIZE CODE
            // --------------------------------------------------------

            let normalizedCode:
                string | undefined;

            if (
                code !== undefined
            ) {
                if (
                    typeof code !== "string" ||
                    code.trim() === ""
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Coupon code cannot be empty",
                    });
                }

                normalizedCode =
                    code.trim().toUpperCase();
            }

            // --------------------------------------------------------
            // CHECK DUPLICATE CODE
            // --------------------------------------------------------

            if (
                normalizedCode &&
                normalizedCode !==
                existingCoupon.code
            ) {
                const duplicateCoupon =
                    await prisma.coupon.findUnique({
                        where: {
                            code:
                                normalizedCode,
                        },
                    });

                if (duplicateCoupon) {
                    return res.status(409).json({
                        success: false,
                        message:
                            "Another coupon already uses this code",
                    });
                }
            }

            // --------------------------------------------------------
            // NORMALIZE / VALIDATE ELIGIBILITY
            // --------------------------------------------------------

            let normalizedEligibility:
                CouponEligibility |
                undefined;

            if (
                eligibility !== undefined
            ) {
                const value =
                    String(
                        eligibility
                    )
                        .trim()
                        .toUpperCase();

                if (
                    value !==
                    CouponEligibility.ALL &&
                    value !==
                    CouponEligibility.FIRST_ORDER
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Eligibility must be ALL or FIRST_ORDER",
                    });
                }

                normalizedEligibility =
                    value as CouponEligibility;
            }

            // --------------------------------------------------------
            // VALIDATE SLABS
            // --------------------------------------------------------

            let normalizedSlabs:
                CouponSlabInput[] |
                undefined;

            if (
                slabs !== undefined
            ) {
                if (
                    !Array.isArray(slabs) ||
                    slabs.length === 0
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "At least one coupon slab is required",
                    });
                }

                normalizedSlabs =
                    slabs.map(
                        (
                            slab: any
                        ): CouponSlabInput => ({
                            minAmount:
                                Number(
                                    slab.minAmount
                                ),

                            discountPercent:
                                Number(
                                    slab.discountPercent
                                ),
                        })
                    );

                // ----------------------------------------------------
                // VALIDATE EACH SLAB
                // ----------------------------------------------------

                for (
                    const slab
                    of normalizedSlabs
                ) {
                    if (
                        !Number.isFinite(
                            slab.minAmount
                        ) ||
                        slab.minAmount < 0
                    ) {
                        return res.status(400).json({
                            success: false,
                            message:
                                "Each slab must have a valid minimum amount",
                        });
                    }

                    if (
                        !Number.isFinite(
                            slab.discountPercent
                        ) ||
                        slab.discountPercent <= 0 ||
                        slab.discountPercent > 100
                    ) {
                        return res.status(400).json({
                            success: false,
                            message:
                                "Discount percentage must be between 0 and 100%.",
                        });
                    }
                }

                // ----------------------------------------------------
                // DUPLICATE MINIMUM AMOUNT
                // ----------------------------------------------------

                const minAmounts =
                    normalizedSlabs.map(
                        (
                            slab: CouponSlabInput
                        ) =>
                            slab.minAmount
                    );

                const uniqueMinAmounts =
                    new Set<number>(
                        minAmounts
                    );

                if (
                    uniqueMinAmounts.size !==
                    minAmounts.length
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Duplicate slab minimum amounts are not allowed",
                    });
                }

                // ----------------------------------------------------
                // SORT SLABS
                // ----------------------------------------------------

                normalizedSlabs.sort(
                    (
                        a: CouponSlabInput,
                        b: CouponSlabInput
                    ) =>
                        a.minAmount -
                        b.minAmount
                );
            }

            // --------------------------------------------------------
            // UPDATE DATA
            // --------------------------------------------------------

            const updateData: any = {};

            if (
                normalizedCode !==
                undefined
            ) {
                updateData.code =
                    normalizedCode;
            }

            if (
                description !==
                undefined
            ) {
                updateData.description =
                    typeof description ===
                        "string" &&
                        description.trim() !== ""
                        ? description.trim()
                        : null;
            }

            if (
                startAt !==
                undefined
            ) {
                updateData.startAt =
                    startAt
                        ? new Date(startAt)
                        : null;
            }

            if (
                expiresAt !==
                undefined
            ) {
                updateData.expiresAt =
                    expiresAt
                        ? new Date(expiresAt)
                        : null;
            }

            if (
                usageLimit !==
                undefined
            ) {
                updateData.usageLimit =
                    usageLimit === null ||
                        usageLimit === ""
                        ? null
                        : Number(
                            usageLimit
                        );
            }

            if (
                isActive !==
                undefined
            ) {
                updateData.isActive =
                    Boolean(isActive);
            }

            if (
                normalizedEligibility !==
                undefined
            ) {
                updateData.eligibility =
                    normalizedEligibility;
            }

            // --------------------------------------------------------
            // UPDATE COUPON
            // --------------------------------------------------------

            const updatedCoupon =
                await prisma.$transaction(
                    async (tx) => {

                        // --------------------------------------------
                        // UPDATE MAIN COUPON
                        // --------------------------------------------

                        const coupon =
                            await tx.coupon.update({
                                where: {
                                    id,
                                },

                                data:
                                    updateData,
                            });

                        // --------------------------------------------
                        // REPLACE SLABS
                        // --------------------------------------------

                        if (
                            normalizedSlabs !==
                            undefined
                        ) {
                            await tx.couponSlab.deleteMany({
                                where: {
                                    couponId:
                                        id,
                                },
                            });

                            await tx.couponSlab.createMany({
                                data:
                                    normalizedSlabs.map(
                                        (
                                            slab: CouponSlabInput
                                        ) => ({
                                            couponId:
                                                id,

                                            minAmount:
                                                slab.minAmount,

                                            discountPercent:
                                                slab.discountPercent,
                                        })
                                    ),
                            });
                        }

                        // --------------------------------------------
                        // RETURN UPDATED COUPON
                        // --------------------------------------------

                        return tx.coupon.findUnique({
                            where: {
                                id,
                            },

                            include: {
                                slabs: {
                                    orderBy: {
                                        minAmount:
                                            "asc",
                                    },
                                },
                            },
                        });
                    }
                );

            // --------------------------------------------------------
            // RESPONSE
            // --------------------------------------------------------

            return res.status(200).json({
                success: true,
                message:
                    "Coupon updated successfully",
                coupon:
                    updatedCoupon,
            });

        } catch (error: any) {
            console.error(
                "Update Coupon Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to update coupon",
                error:
                    error?.message,
            });
        }
    }

    // ==============================================================
    // TOGGLE COUPON ACTIVE / INACTIVE
    // ==============================================================

    static async toggleStatus(
        req: Request,
        res: Response
    ) {
        try {
            const { id } =
                req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Coupon ID is required",
                });
            }

            const existingCoupon =
                await prisma.coupon.findUnique({
                    where: {
                        id,
                    },
                });

            if (!existingCoupon) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Coupon not found",
                });
            }

            const updatedCoupon =
                await prisma.coupon.update({
                    where: {
                        id,
                    },

                    data: {
                        isActive:
                            !existingCoupon.isActive,
                    },
                });

            return res.status(200).json({
                success: true,

                message:
                    updatedCoupon.isActive
                        ? "Coupon activated successfully"
                        : "Coupon deactivated successfully",

                coupon:
                    updatedCoupon,
            });

        } catch (error: any) {
            console.error(
                "Toggle Coupon Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to update coupon status",
                error:
                    error?.message,
            });
        }
    }


    // ==============================================================
    // DELETE COUPON
    // Admin-only route. Slabs are removed before the coupon.
    // ==============================================================

    static async delete(
        req: Request,
        res: Response
    ) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: "Coupon ID is required",
                });
            }

            const existingCoupon =
                await prisma.coupon.findUnique({
                    where: { id },
                    select: { id: true, code: true },
                });

            if (!existingCoupon) {
                return res.status(404).json({
                    success: false,
                    message: "Coupon not found",
                });
            }

            await prisma.$transaction(async (tx) => {
                await tx.couponSlab.deleteMany({
                    where: { couponId: id },
                });

                await tx.coupon.delete({
                    where: { id },
                });
            });

            return res.status(200).json({
                success: true,
                message: `Coupon ${existingCoupon.code} deleted successfully`,
            });
        } catch (error: any) {
            console.error("Delete Coupon Error:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to delete coupon",
                error: error?.message,
            });
        }
    }
}

export default CouponController;
