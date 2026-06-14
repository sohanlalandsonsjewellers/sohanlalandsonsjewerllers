import prisma from "../config/db.config.js";

import ProductController
    from "../controller/ProductController.js";

export async function
    deleteZeroStockProducts() {

    try {

        const products =

            await prisma.product.findMany({

                where: {

                    stock: 0,

                    deletedAt: {
                        not: null
                    }

                }

            });

        const now =
            Date.now();

        for (
            const product
            of products
        ) {

            const deletedTime =

                new Date(
                    product.deletedAt!
                ).getTime();

            const hoursPassed =

                (
                    now -
                    deletedTime
                )
                / (
                    1000 *
                    60 *
                    60
                );

            if (
                hoursPassed >= 24
            ) {

                console.log(
                    "Deleting:",
                    product.name,
                    "| deletedAt:",
                    product.deletedAt,
                    "| hoursPassed:",
                    hoursPassed.toFixed(2)
                );

                try {

                    await ProductController
                        .removeInternal(
                            product.id
                        );

                } catch (innerErr) {

                    // Ek product ki failure se baaki products process hone se na ruke
                    console.error(
                        "Failed to delete product:",
                        product.id,
                        product.name,
                        innerErr
                    );

                }

            }

        }

        console.log(
            "Auto Delete Completed"
        );

    } catch (err) {

        console.log(
            "Auto Delete Error",
            err
        );

    }

}
