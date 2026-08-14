import axios from "axios";
import { Request, Response } from "express";
import prisma from "../config/db.config.js";
import NimbusService from "../services/NimbusService";
import { htmlToPdfBuffer } from "../utils/pdfBuffer.js";
import invoiceHTML from "../utils/invoiceTemplate.js";
import { shopData } from "../utils/shopConfig.js";
import { Prisma } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

export default class OrderController {
  private static async getLocationFromPincode(
    pincode: string
  ) {

    try {

      const { data } = await axios.get(
        `https://api.postalpincode.in/pincode/${pincode}`
      );

      if (
        data[0]?.Status === "Success" &&
        data[0]?.PostOffice?.length
      ) {

        const office =
          data[0].PostOffice[0];

        return {

          city:
            office.District,

          state:
            office.State

        };

      }

    } catch (err) {

      console.error(
        "Pincode lookup failed:",
        err
      );

    }

    return {

      city: "",

      state: ""

    };

  }

  static async placeOrder(req: Request, res: Response) {
    try {
      const {
        items,
        customerName,
        customerPhone,
        address,
        pincode,
        shippingCharge,
        courierId,
        courierName,
        couponCode,
      } = req.body;

      // ============================================================
      // BASIC VALIDATION
      // ============================================================

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Cart items are required.",
        });
      }

      const userAuth = (req as any).user;

      if (!userAuth?.id) {
        return res.status(401).json({
          success: false,
          message: "User authentication required.",
        });
      }

      // ============================================================
      // NORMALIZED USER ID
      // IMPORTANT:
      // Har jagah userId ko String() se consistently use karo,
      // taaki FIRST_ORDER coupon check / order history match
      // kabhi type-mismatch ki wajah se galat na ho.
      // ============================================================

      const normalizedUserId = String(userAuth.id);
      console.log("LoggedIn User ID:", normalizedUserId, typeof normalizedUserId);

      // ============================================================
      // GET CURRENT PRODUCT PRICES FROM DATABASE
      // IMPORTANT:
      // NEVER TRUST FRONTEND PRICE
      // ============================================================

      const productIds = items.map((item: any) => item.productId);

      const products = await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
          deletedAt: null,
        },
      });

      if (products.length !== productIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more products are no longer available.",
        });
      }

      // ============================================================
      // BUILD SERVER-SIDE ORDER ITEMS
      // ============================================================

      const serverItems = items.map((item: any) => {
        const product = products.find(
          (p) => p.id === item.productId
        );

        if (!product) {
          throw new Error(
            `Product not found: ${item.productId}`
          );
        }

        const quantity = Number(item.qty);

        if (!Number.isInteger(quantity) || quantity <= 0) {
          throw new Error(
            `Invalid quantity for product: ${product.name}`
          );
        }

        // Stock validation
        if (quantity > product.stock) {
          throw new Error(
            `${product.name} has only ${product.stock} item(s) in stock.`
          );
        }

        const unitPrice = Number(product.price);

        const lineTotal =
          unitPrice * quantity;

        return {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          quantity,
          qty: quantity,
          unitPrice,
          price: unitPrice,
          lineTotal,
          image:
            Array.isArray(product.images)
              ? product.images[0]
              : undefined,
        };
      });

      // ============================================================
      // ACTUAL SERVER-SIDE SUBTOTAL
      // ============================================================

      const subtotal = serverItems.reduce(
        (sum: number, item: any) =>
          sum + Number(item.lineTotal),
        0
      );

      // ============================================================
      // COUPON VALIDATION
      // ============================================================

      // ============================================================
      // COUPON VALIDATION
      // ============================================================

      let couponDiscount = 0;
      let appliedCouponCode: string | null = null;
      let appliedDiscountPercent = 0;
      let appliedSlabMinAmount = 0;

      if (
        couponCode &&
        String(couponCode).trim() !== ""
      ) {
        const normalizedCouponCode =
          String(couponCode)
            .trim()
            .toUpperCase();

        const coupon =
          await prisma.coupon.findUnique({
            where: {
              code: normalizedCouponCode,
            },
            include: {
              slabs: true,
            },
          });

        if (!coupon) {
          return res.status(400).json({
            success: false,
            message: "Invalid coupon code.",
          });
        }

        // ========================================================
        // FIRST ORDER COUPON ELIGIBILITY
        // ========================================================



        // Inside placeOrder method:
        if (String(coupon.eligibility) === "FIRST_ORDER") {
          const previousOrder = await prisma.order.findFirst({
            where: {
              userId: normalizedUserId,
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

        // Active check
        if (!coupon.isActive) {
          return res.status(400).json({
            success: false,
            message: "This coupon is inactive.",
          });
        }

        // Start date check
        if (
          coupon.startAt &&
          new Date() < coupon.startAt
        ) {
          return res.status(400).json({
            success: false,
            message: "This coupon is not active yet.",
          });
        }

        // Expiry date check
        if (
          coupon.expiresAt &&
          new Date() > coupon.expiresAt
        ) {
          return res.status(400).json({
            success: false,
            message: "This coupon has expired.",
          });
        }

        // Usage limit check
        if (
          coupon.usageLimit !== null &&
          coupon.usedCount >= coupon.usageLimit
        ) {
          return res.status(400).json({
            success: false,
            message: "Coupon usage limit has been reached.",
          });
        }

        // ========================================================
        // SELECT BEST SLAB BASED ON ACTUAL DATABASE SUBTOTAL
        // ========================================================

        const eligibleSlabs =
          coupon.slabs
            .filter(
              (slab) =>
                Number(slab.minAmount) <= subtotal
            )
            .sort(
              (a, b) =>
                Number(b.minAmount) -
                Number(a.minAmount)
            );

        if (eligibleSlabs.length === 0) {
          return res.status(400).json({
            success: false,
            message:
              "Coupon is not applicable for this order amount.",
          });
        }

        const selectedSlab =
          eligibleSlabs[0];

        appliedDiscountPercent =
          Number(
            selectedSlab.discountPercent
          );

        appliedSlabMinAmount =
          Number(
            selectedSlab.minAmount
          );

        couponDiscount =
          Number(
            (
              subtotal *
              appliedDiscountPercent /
              100
            ).toFixed(2)
          );

        appliedCouponCode =
          coupon.code;
      }

      // ============================================================
      // TAXABLE AMOUNT AFTER COUPON
      // ============================================================

      const taxableAmount = Number(
        Math.max(
          0,
          subtotal - couponDiscount
        ).toFixed(2)
      );

      // ============================================================
      // GST AFTER DISCOUNT
      // GST = 3% OF TAXABLE AMOUNT
      // ============================================================

      const gst = Number(
        (taxableAmount * 0.03).toFixed(2)
      );

      // ============================================================
      // SHIPPING
      // ============================================================

      const shipping =
        Number(shippingCharge || 0);

      // ============================================================
      // FINAL PAYABLE
      // ============================================================

      const total = Number(
        (
          taxableAmount +
          gst +
          shipping
        ).toFixed(2)
      );

      // ============================================================
      // FINAL ORDER ITEMS
      // Remove undefined image values
      // ============================================================

      const finalItems = serverItems.map(
        (item: any) => {
          const cleanItem: any = {
            productId: item.productId,
            name: item.name,
            sku: item.sku,
            qty: item.qty,
            quantity: item.quantity,
            price: item.price,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
          };

          if (item.image) {
            cleanItem.image = item.image;
          }

          return cleanItem;
        }
      );

      // ============================================================
      // CREATE ORDER
      // ============================================================

      const newOrder =
        await prisma.order.create({
          data: {
            userId: normalizedUserId,

            customerName,
            customerPhone,
            address,
            pincode,

            items: finalItems,

            // Original product subtotal
            adminPrice: Number(
              subtotal.toFixed(2)
            ),

            // GST AFTER COUPON
            gstAmount: gst,

            shippingCharge: shipping,

            // Coupon discount amount
            discount: couponDiscount,

            // Final payable amount
            totalAmount: total,

            courierId: courierId
              ? Number(courierId)
              : null,

            courierName:
              courierName || null,

            status: "PENDING",
          },
        });

      // ============================================================
      // INCREMENT COUPON USAGE
      // ============================================================

      if (appliedCouponCode) {
        await prisma.coupon.update({
          where: {
            code: appliedCouponCode,
          },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });
      }

      // ============================================================
      // RESPONSE
      // ============================================================

      return res.status(200).json({
        success: true,

        message: "Order placed successfully.",

        order: newOrder,

        pricing: {
          subtotal: Number(
            subtotal.toFixed(2)
          ),

          couponCode:
            appliedCouponCode,

          discountPercent:
            appliedDiscountPercent,

          slabMinAmount:
            appliedSlabMinAmount,

          discountAmount:
            couponDiscount,

          taxableAmount,

          gstPercent: 3,

          gstAmount: gst,

          shippingCharge:
            shipping,

          finalAmount:
            total,
        },
      });

    } catch (err: any) {
      console.error(
        "ORDER ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          err?.message ||
          "Order calculation failed.",
      });
    }
  }

  static async getAllOrders(req: Request, res: Response) {
    try {
      const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });
      return res.json({ success: true, orders });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  static async editOrderDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { items, totalAmount, address, pincode } = req.body;
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: { items, totalAmount, address, pincode }
      });
      return res.json({ success: true, order: updatedOrder });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Edit failed" });
    }
  }

  static async deleteOrder(req: Request, res: Response) {
    try {
      await prisma.order.delete({ where: { id: req.params.id } });
      return res.json({ success: true, message: "Order deleted" });
    } catch (err) {
      return res.status(500).json({ success: false });
    }
  }

  static async getMyOrders(req: Request, res: Response) {
    // IMPORTANT: userId ko String() se normalize kiya, taaki
    // is query ka result kabhi bhi type-mismatch ki wajah se
    // khaali na aaye — warna frontend "hasPreviousOrder" galat
    // false maan leta hai aur FIRST_ORDER coupon galat apply
    // ho jaata hai purane customer ke liye bhi.
    const userId = String((req as any).user.id);
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, orders });
  }

  // =============================
  // Refresh Shipment Tracking
  // =============================

  static async refreshTracking(
    req: Request,
    res: Response
  ) {

    try {

      const userId = String((req as any).user.id);

      const orders = await prisma.order.findMany({

        where: {

          userId,

          awbNumber: {

            not: null

          }

        }

      });

      for (const order of orders) {

        try {

          const tracking =
            await NimbusService.trackShipment(
              order.awbNumber!
            );

          const shipment =
            tracking.data;

          await prisma.order.update({

            where: {

              id: order.id

            },

            data: {

              shipmentStatus:

                shipment.current_status_name ||

                shipment.current_status ||

                order.shipmentStatus

            }

          });

        }

        catch (err) {

          console.error(

            `Tracking failed for ${order.awbNumber}`,

            err

          );

        }

      }

      return res.json({

        success: true,

        message: "Tracking refreshed."

      });

    }

    catch (error) {

      console.error(error);

      return res.status(500).json({

        success: false,

        message: "Unable to refresh tracking."

      });

    }

  }

  // OrderController.ts - updateOrderStatus update karo
  static async updateOrderStatus(
    req: Request,
    res: Response
  ) {

    try {

      const { id } = req.params;
      const { status } = req.body;

      const order =
        await prisma.order.update({

          where: {
            id
          },

          data: {
            status
          }

        });

      let billLink = "";
      /*
====================
CREATE SHIPMENT
====================
*/

      const location =
        await OrderController.getLocationFromPincode(
          order.pincode
        );

      if (!order.awbNumber) {

        const shipment =
          await NimbusService.createShipment({

            order_number:
              `SLAS-${order.id.slice(-6).toUpperCase()}`,

            payment_type: "prepaid",

            order_amount: order.totalAmount,

            shipping_charges: order.shippingCharge,

            discount: order.discount || 0,

            cod_charges: 0,

            package_weight: 200,

            package_length: 10,

            package_breadth: 10,

            package_height: 10,

            request_auto_pickup: "yes",

            consignee: {

              name: order.customerName,

              address: order.address,

              city: location.city,

              state: location.state,

              pincode: order.pincode,

              phone: order.customerPhone

            },

            pickup: {

              warehouse_name: process.env.NIMBUS_WAREHOUSE_NAME,

              name: process.env.NIMBUS_PICKUP_NAME,

              address: process.env.NIMBUS_PICKUP_ADDRESS,

              address_2: process.env.NIMBUS_PICKUP_ADDRESS2,

              city: process.env.NIMBUS_PICKUP_CITY,

              state: process.env.NIMBUS_PICKUP_STATE,

              pincode: process.env.NIMBUS_PICKUP_PINCODE,

              phone: process.env.NIMBUS_PICKUP_PHONE

            },

            order_items: (order.items as any[]).map(item => ({

              name: item.name,

              qty: String(item.qty),

              price: String(item.price),

              sku: item.sku

            })),

            courier_id: order.courierId,

            is_insurance: 0

          });

        await prisma.order.update({

          where: {
            id: order.id
          },

          data: {

            shipmentId:
              String(shipment.data.shipment_id),

            awbNumber:
              shipment.data.awb_number,

            courierName:
              shipment.data.courier_name,

            shipmentStatus:
              shipment.data.status,

            labelUrl:
              shipment.data.label,

            trackingUrl:
              `https://ship.nimbuspost.com/tracking/${shipment.data.awb_number}`

          }

        });

      }

      if (
        status === "ACCEPTED"
      ) {

        /*
        ====================
        STOCK REDUCE
        ====================
        */

        for (
          const item of order.items as any[]
        ) {

          const product =
            await prisma.product.findFirst({

              where: {
                sku: item.sku
              }

            });

          if (!product)
            continue;

          const updatedStock =
            Math.max(

              0,

              product.stock -

              Number(
                item.qty
              )

            );

          await prisma.product.update({

            where: {

              id:
                product.id

            },

            data: {

              stock:
                updatedStock,

              deletedAt:

                updatedStock === 0

                  ?

                  new Date()

                  :

                  null

            }

          });

        }

        /*
====================
AUTO SAVE BILL
====================
*/

        // duplicate bill save avoid
        const existingBill =
          await prisma.bill.findFirst({
            where: {
              billNo: `BILL-${order.id.slice(-6)}`
            }
          });
        if (!existingBill) {

          await prisma.bill.create({

            data: {
              billNo:
                `BILL-${order.id.slice(-6)}`,

              invoiceNo:
                `SLAS-${order.id.slice(-4).toUpperCase()}`,

              customerName:
                order.customerName || "Walk-in",

              customerPhone:
                order.customerPhone || "",

              customerAddress:
                order.address || "",

              customerPincode:
                order.pincode || "",

              items:
                order.items as Prisma.InputJsonValue,

              totalAmount:
                order.adminPrice || 0,

              discount:
                order.discount || 0,

              gstPercent: 3,

              cgstPercent: 1.5,

              sgstPercent: 1.5,

              cgstAmount:
                (order.gstAmount || 0) / 2,

              sgstAmount:
                (order.gstAmount || 0) / 2,

              gstAmount:
                order.gstAmount || 0,

              netAmount:
                order.totalAmount || 0,

              paymentStatus: "pending",

              invoicePdfUrl: null

            }

          });

        }


        /*
        ====================
        BILL LINK RETURN
        ====================
        */

        const backendUrl =
          process.env.BASE_URL ||
          `${req.headers["x-forwarded-proto"] || "https"}://${req.get("host")}`;

        billLink =
          `${backendUrl}/api/order/bill-pdf/${order.id}`;

      }

      const updatedOrder = await prisma.order.findUnique({
        where: {
          id: order.id
        }
      });
      return res.json({

        success: true,

        billLink,

        shipment: updatedOrder
          ? {
            awbNumber: updatedOrder.awbNumber,
            courierName: updatedOrder.courierName,
            trackingUrl: updatedOrder.trackingUrl,
            shipmentStatus: updatedOrder.shipmentStatus,
            labelUrl: updatedOrder.labelUrl
          }
          : null

      });

    }

    catch (error) {

      console.error(
        "Order Update Error:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Server Error"

        });

    }

  }

  static async getOrderBillPdf(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const order = await prisma.order.findUnique({ where: { id } });
      const savedBill =
        await prisma.bill.findFirst({

          where: {
            billNo: `BILL-${id.slice(-6)}`
          }

        });

      if (!order) return res.status(404).json({ success: false, message: "Order not found" });

      // ✅ Yahan hum data ko normalize kar rahe hain taki template ko sahi mile
      const billData = {

        ...order,

        created_at:
          order.createdAt || new Date(),

        invoiceNo:
          savedBill?.invoiceNo ||
          `SLSJ-INV-${id.slice(-5).toUpperCase()}`,

        billNo:
          savedBill?.billNo ||
          `BILL-${id.slice(-6)}`,

        customerAddress:
          order.address || "",

        customerPincode:
          order.pincode || "",

        netAmount:
          order.totalAmount || 0,

        gstAmount:
          order.gstAmount || 0

      };

      const html = invoiceHTML({ shop: shopData, bill: billData });
      const pdfBuffer = await htmlToPdfBuffer(html);

      // OrderController.ts mein yahan change karo
      res.setHeader("Content-Type", "application/pdf");
      // "Invoice_SLAS_XXXX.pdf" ek luxury aur professional naam hai
      res.setHeader("Content-Disposition", `inline; filename="Invoice_SLAS_${id.slice(-4).toUpperCase()}.pdf"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      return res.end(pdfBuffer);

    } catch (err) {
      console.error("PDF Error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }
  static async getMyNotifications(req: Request, res: Response) {
    const userId = String((req as any).user.id);
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, notifications });
  }

  // static async getOrderBillPdf(req: Request, res: Response) {
  //   try {
  //     const { id } = req.params;
  //     const order = await prisma.order.findUnique({ where: { id } });

  //     if (!order) return res.status(404).json({ success: false, message: "Order not found" });

  //     // HTML generate karo
  //     const html = invoiceHTML({ shop: shopData, bill: order });

  //     // PDF Buffer banao
  //     const pdfBuffer = await htmlToPdfBuffer(html);

  //     // ✅ FIX: Buffer ko check karo ki wo empty toh nahi hai
  //     if (!pdfBuffer || pdfBuffer.length === 0) {
  //       return res.status(500).send("PDF generation failed (empty buffer)");
  //     }

  //     // PDF ko response mein bhejo
  //     res.setHeader("Content-Type", "application/pdf");
  //     res.setHeader("Content-Disposition", `inline; filename=bill-${id}.pdf`);
  //     res.setHeader("Content-Length", pdfBuffer.length); // Buffer size batana zaruri hai
  //     res.setHeader("Content-Transfer-Encoding", "binary"); // Ye add karo
  //     return res.end(pdfBuffer); // .send() ki jagah .end() try karo
  //   } catch (err) {
  //     console.error("PDF Error:", err);
  //     return res.status(500).json({ success: false, message: "Server error" });
  //   }
  // }
}
