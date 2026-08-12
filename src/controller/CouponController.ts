import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

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

    // CREATE COUPON
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
                    (slab: any): CouponSlabInput => ({
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
                    (slab: CouponSlabInput) =>
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

    // VALIDATE COUPON
    static async validate(
        req: Request,
        res: Response
    ) {
        try {

            const {
                code,
                items,
            } = req.body;

            // --------------------------------------------------------
            // VALIDATE COUPON CODE
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

            // --------------------------------------------------------
            // VALIDATE CART ITEMS
            // --------------------------------------------------------

            if (
                !Array.isArray(items) ||
                items.length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Cart items are required",
                });
            }

            // --------------------------------------------------------
            // NORMALIZE COUPON CODE
            // --------------------------------------------------------

            const normalizedCode =
                code.trim().toUpperCase();

            // --------------------------------------------------------
            // FIND COUPON
            // --------------------------------------------------------

            const coupon =
                await prisma.coupon.findUnique({
                    where: {
                        code:
                            normalizedCode,
                    },

                    include: {
                        slabs: true,
                    },
                });

            // --------------------------------------------------------
            // COUPON NOT FOUND
            // --------------------------------------------------------

            if (!coupon) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Invalid coupon code",
                });
            }

            // --------------------------------------------------------
            // ACTIVE CHECK
            // --------------------------------------------------------

            if (!coupon.isActive) {
                return res.status(400).json({
                    success: false,
                    message:
                        "This coupon is inactive",
                });
            }

            // --------------------------------------------------------
            // DATE CHECK
            // --------------------------------------------------------

            const now =
                new Date();

            if (
                coupon.startAt &&
                now < coupon.startAt
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "This coupon is not active yet",
                });
            }

            if (
                coupon.expiresAt &&
                now > coupon.expiresAt
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "This coupon has expired",
                });
            }

            // --------------------------------------------------------
            // USAGE LIMIT CHECK
            // --------------------------------------------------------

            if (
                coupon.usageLimit !==
                null &&
                coupon.usedCount >=
                coupon.usageLimit
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "This coupon usage limit has been reached",
                });
            }

            // --------------------------------------------------------
            // NORMALIZE CART ITEMS
            // --------------------------------------------------------

            const cartItems:
                CartItemInput[] =
                items.map(
                    (item: any): CartItemInput => ({
                        productId:
                            String(
                                item.productId
                            ),

                        qty:
                            Number(
                                item.qty
                            ),
                    })
                );

            // --------------------------------------------------------
            // VALIDATE CART ITEMS
            // --------------------------------------------------------

            for (
                const item of cartItems
            ) {

                if (
                    !item.productId ||
                    item.productId ===
                    "undefined" ||
                    item.productId ===
                    "null"
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid product ID in cart",
                    });
                }

                if (
                    !Number.isInteger(
                        item.qty
                    ) ||
                    item.qty <= 0
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid product quantity",
                    });
                }
            }

            // --------------------------------------------------------
            // UNIQUE PRODUCT IDS
            // --------------------------------------------------------

            const productIds:
                string[] =
                Array.from(
                    new Set<string>(
                        cartItems.map(
                            (
                                item: CartItemInput
                            ) =>
                                item.productId
                        )
                    )
                );

            // --------------------------------------------------------
            // FETCH CURRENT DATABASE PRICES
            // --------------------------------------------------------

            const productsRaw =
                await prisma.product.findMany({
                    where: {

                        id: {
                            in:
                                productIds,
                        },

                        deletedAt:
                            null,
                    },

                    select: {

                        id: true,

                        name: true,

                        price: true,

                        stock: true,

                        sku: true,
                    },
                });

            // --------------------------------------------------------
            // EXPLICIT PRODUCT TYPE
            // --------------------------------------------------------

            const products:
                ProductRow[] =
                productsRaw.map(
                    (
                        product
                    ): ProductRow => ({
                        id:
                            product.id,

                        name:
                            product.name,

                        price:
                            Number(
                                product.price
                            ),

                        stock:
                            Number(
                                product.stock
                            ),

                        sku:
                            product.sku,
                    })
                );

            // --------------------------------------------------------
            // CHECK ALL PRODUCTS EXIST
            // --------------------------------------------------------

            if (
                products.length !==
                productIds.length
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "One or more cart products are no longer available",
                });
            }

            // --------------------------------------------------------
            // PRODUCT MAP
            // --------------------------------------------------------

            const productMap:
                Map<string, ProductRow> =
                new Map<
                    string,
                    ProductRow
                >();

            products.forEach(
                (
                    product: ProductRow
                ) => {

                    productMap.set(
                        product.id,
                        product
                    );
                }
            );

            // --------------------------------------------------------
            // CALCULATE REAL SUBTOTAL
            // --------------------------------------------------------

            let subtotal = 0;

            const validatedItems =
                cartItems.map(
                    (
                        item: CartItemInput
                    ) => {

                        const product:
                            ProductRow |
                            undefined =
                            productMap.get(
                                item.productId
                            );

                        // ------------------------------------------------
                        // PRODUCT NOT FOUND
                        // ------------------------------------------------

                        if (!product) {
                            throw new Error(
                                "Product not found"
                            );
                        }

                        // ------------------------------------------------
                        // STOCK CHECK
                        // ------------------------------------------------

                        if (
                            item.qty >
                            product.stock
                        ) {
                            throw new Error(
                                `${product.name} does not have enough stock`
                            );
                        }

                        // ------------------------------------------------
                        // CURRENT DATABASE PRICE
                        // ------------------------------------------------

                        const unitPrice:
                            number =
                            Number(
                                product.price
                            );

                        // ------------------------------------------------
                        // LINE TOTAL
                        // ------------------------------------------------

                        const lineTotal:
                            number =
                            unitPrice *
                            item.qty;

                        subtotal +=
                            lineTotal;

                        return {

                            productId:
                                product.id,

                            name:
                                product.name,

                            sku:
                                product.sku,

                            quantity:
                                item.qty,

                            unitPrice,

                            lineTotal:
                                Number(
                                    lineTotal.toFixed(
                                        2
                                    )
                                ),
                        };
                    }
                );

            // --------------------------------------------------------
            // ROUND SUBTOTAL
            // --------------------------------------------------------

            subtotal =
                Number(
                    subtotal.toFixed(
                        2
                    )
                );

            // --------------------------------------------------------
            // TYPE COUPON SLABS
            // --------------------------------------------------------

            const couponSlabs:
                CouponSlabRow[] =
                coupon.slabs.map(
                    (
                        slab
                    ): CouponSlabRow => ({
                        id:
                            slab.id,

                        couponId:
                            slab.couponId,

                        minAmount:
                            Number(
                                slab.minAmount
                            ),

                        discountPercent:
                            Number(
                                slab.discountPercent
                            ),

                        createdAt:
                            slab.createdAt,

                        updatedAt:
                            slab.updatedAt,
                    })
                );

            // --------------------------------------------------------
            // FIND ELIGIBLE SLABS
            // --------------------------------------------------------

            const eligibleSlabs:
                CouponSlabRow[] =
                couponSlabs
                    .filter(
                        (
                            slab: CouponSlabRow
                        ) =>
                            subtotal >=
                            slab.minAmount
                    )
                    .sort(
                        (
                            a: CouponSlabRow,
                            b: CouponSlabRow
                        ) =>
                            b.minAmount -
                            a.minAmount
                    );

            // --------------------------------------------------------
            // NO ELIGIBLE SLAB
            // --------------------------------------------------------

            if (
                eligibleSlabs.length ===
                0
            ) {

                const minimumRequired:
                    number =
                    Math.min(
                        ...couponSlabs.map(
                            (
                                slab: CouponSlabRow
                            ) =>
                                slab.minAmount
                        )
                    );

                return res.status(400).json({

                    success: false,

                    message:
                        `Minimum cart value of ₹${minimumRequired} is required for this coupon`,

                    subtotal,

                    minimumRequired,
                });
            }

            // --------------------------------------------------------
            // SELECT BEST SLAB
            // --------------------------------------------------------

            const selectedSlab:
                CouponSlabRow =
                eligibleSlabs[0];

            // --------------------------------------------------------
            // DISCOUNT PERCENTAGE
            // --------------------------------------------------------

            const discountPercent:
                number =
                selectedSlab.discountPercent;

            // --------------------------------------------------------
            // DISCOUNT AMOUNT
            // --------------------------------------------------------

            const discountAmount:
                number =
                Number(
                    (
                        subtotal *
                        discountPercent /
                        100
                    ).toFixed(2)
                );

            // --------------------------------------------------------
            // TAXABLE AMOUNT
            // --------------------------------------------------------

            const taxableAmount:
                number =
                Number(
                    (
                        subtotal -
                        discountAmount
                    ).toFixed(2)
                );

            // --------------------------------------------------------
            // SUCCESS RESPONSE
            // --------------------------------------------------------

            return res.status(200).json({

                success: true,

                message:
                    "Coupon applied successfully",

                coupon: {

                    code:
                        coupon.code,

                    slab: {

                        minAmount:
                            selectedSlab.minAmount,

                        discountPercent,
                    },
                },

                pricing: {

                    subtotal,

                    discountPercent,

                    discountAmount,

                    taxableAmount,
                },

                items:
                    validatedItems,
            });

        } catch (
        error: any
        ) {

            console.error(
                "Validate Coupon Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error?.message ||
                    "Failed to validate coupon",
            });
        }
    }


    // GET ALL COUPONS
    static async getAll(
        req: Request,
        res: Response
    ) {
        try {
            const coupons = await prisma.coupon.findMany({
                include: {
                    slabs: {
                        orderBy: {
                            minAmount: "asc",
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

            return res.status(200).json({
                success: true,
                count: coupons.length,
                coupons,
            });

        } catch (error: any) {

            console.error(
                "Get All Coupons Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to fetch coupons",
                error: error?.message,
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
            const { id } = req.params;

            const {
                code,
                description,
                startAt,
                expiresAt,
                usageLimit,
                isActive,
                slabs,
            } = req.body;

            // --------------------------------------------------------
            // CHECK ID
            // --------------------------------------------------------

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: "Coupon ID is required",
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
                    message: "Coupon not found",
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
                                "Discount percentage must be greater than 0 and up to 100",
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
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: "Coupon ID is required",
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
                    message: "Coupon not found",
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
                message: updatedCoupon.isActive
                    ? "Coupon activated successfully"
                    : "Coupon deactivated successfully",

                coupon: updatedCoupon,
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
}

export default CouponController;