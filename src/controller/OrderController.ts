import path from "path";
import fs from "fs";
import { Request, Response } from "express";
import prisma from "../config/db.config.js";
import { htmlToPdfBuffer } from "../utils/pdfBuffer.js";
import invoiceHTML from "../utils/invoiceTemplate.js";
import { shopData } from "../utils/shopConfig.js";
import { Prisma } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

export default class OrderController {

  static async placeOrder(req: Request, res: Response) {
    try {
      const { items, adminPrice, discount, customerName, customerPhone, address, pincode } = req.body;

      if (adminPrice === undefined || adminPrice === null) {
        return res.status(400).json({ success: false, message: "Admin Price is missing from frontend!" });
      }

      const userAuth = (req as any).user;
      const priceNum = Number(adminPrice);
      const discNum = Number(discount || 0);
      const gst = priceNum * 0.03;
      const shipping = (pincode === "273164") ? 50 : 100;
      const total = (priceNum - discNum) + gst + shipping;

      const newOrder = await prisma.order.create({
        data: {
          userId: userAuth.id,
          customerName: customerName,
          customerPhone: customerPhone,
          address: address,
          pincode: pincode,
          items: items,
          adminPrice: priceNum,
          gstAmount: gst,
          shippingCharge: shipping,
          discount: discNum,
          totalAmount: total,
          status: "PENDING"
        }
      });

      return res.status(200).json({ success: true, order: newOrder });
    } catch (err) {
      console.error("ORDER ERROR:", err);
      return res.status(500).json({ success: false, message: "Calculation failed" });
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
    const userId = (req as any).user.id;
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, orders });
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

      return res.json({

        success: true,

        billLink

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
    const userId = (req as any).user.id;
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