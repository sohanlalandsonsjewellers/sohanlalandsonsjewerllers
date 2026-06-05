import prisma from "../config/db.config.js"

import ProductController
    from "../controller/ProductController.js"

export async function deleteZeroStockProducts() {

    const yesterday =

        new Date(
            Date.now()
            -
            24 * 60 * 60 * 1000
        )

    const products =

        await prisma.product.findMany({

            where: {

                stock: 0,

                deletedAt: {

                    lte: yesterday

                }

            }

        })

    for (
        const product of products
    ) {

        await ProductController.removeInternal(
            product.id
        )

    }

    console.log(
        "Auto Delete Completed"
    )

}