// src/controller/BillController.ts
import { Request, Response } from "express";
import prisma from "../config/db.config.js";
import invoiceHTML from "../utils/invoiceTemplate.js";
import { htmlToPdfBuffer } from "../utils/pdfBuffer.js";
import { buildInvoiceNo } from "../utils/invoice.js";
import { nextCounter } from "../utils/counter.js";
import { sendInvoiceEmail } from "../utils/email.js";
import { sendWhatsApp } from "../utils/whatsapp.js";
import zlib from "zlib";
import { Buffer } from "buffer";
import ExcelJS from "exceljs";


export default class BillController {
  // ===========================================================
  // CREATE BILL
  // ===========================================================
  static async create(req: Request, res: Response) {
    try {
      const payload = req.body;

      if (!payload.items?.length) {
        return res.status(400).json({ success: false, message: "Items required" });
      }

      // ---------- CALCULATIONS ----------
      const totalAmount = payload.items.reduce(
        (sum: number, it: any) => sum + Number(it.price) * Number(it.qty || 1),
        0
      );

      const discount = Number(payload.discount || 0);
      const afterDiscount = totalAmount - discount;

      const gstPercent = Number(payload.gstPercent ?? 3);
      const gstAmount = +(afterDiscount * gstPercent) / 100;

      const cgstPercent = gstPercent / 2;
      const sgstPercent = gstPercent / 2;
      const cgstAmount = gstAmount / 2;
      const sgstAmount = gstAmount / 2;

      const netAmount = +(afterDiscount + gstAmount);

      // ---------- INVOICE / BILL ----------
      const seq = await nextCounter("invoice_seq");
      const invoiceNo = buildInvoiceNo(process.env.INVOICE_PREFIX || "SLSJ-INV-", seq);
      const billNo = "BILL-" + Date.now().toString().slice(-6);

      // ---------- SAVE IN DB ----------
      const bill = await prisma.bill.create({
        data: {
          billNo,
          invoiceNo,
          customerName: payload.customerName || "Walk-in",
          customerPhone: payload.customerPhone || "",
          customerAddress: payload.customerAddress || "",
          customerPincode: payload.customerPincode || "",
          customerEmail: payload.customerEmail || null,
          items: payload.items,
          totalAmount,
          discount,
          gstPercent,
          cgstPercent,
          sgstPercent,
          cgstAmount,
          sgstAmount,
          gstAmount,
          netAmount,
          paymentStatus: payload.paymentStatus || "pending",
          invoicePdfUrl: null,         // ALWAYS NULL because no upload
        },
      });

      // ---------- PDF GENERATION ----------
      const shop = {
        name: "Sohan Lal And Son's Jewellers",
        address: "Durga Mandir Road\nSiswa Bazar\nMaharajganj -273163",
        gst: "09BHCPV5374A1Z8",
        phone: "+91 9682296756",
        email: "sohanlalandsonsjewellers@gmail.com",
        bankName: "Central Bank of India",
        bankBranch: "Siswa Bazar",
        bankAccount: "5896809162",
        ifsc: "CBIN0284670",
      };
      const html = invoiceHTML({ shop, bill });

      const pdfBuffer = await htmlToPdfBuffer(html);

      const pdfBase64 = Buffer.from(pdfBuffer).toString("base64"); // full size
      const pdfBase64Gz = zlib.gzipSync(Buffer.from(pdfBuffer)).toString("base64"); // smaller
      // const pdfBase64Gz = zlib.gzipSync(pdfBuffer).toString("base64"); // smaller

      // ---------- EMAIL ----------
      if (bill.customerEmail) {
        try {
          await sendInvoiceEmail({
            to: bill.customerEmail,
            subject: `Invoice ${invoiceNo}`,
            text: `Your invoice ${invoiceNo}`,
            attachments: [{ filename: `${invoiceNo}.pdf`, content: pdfBuffer }],
          });
        } catch (e) {
          console.error("Email error:", e);
        }
      }

      // ---------- WHATSAPP ----------
      if (bill.customerPhone) {
        try {
          const to = bill.customerPhone.startsWith("+")
            ? `whatsapp:${bill.customerPhone}`
            : `whatsapp:+91${bill.customerPhone}`;

          await sendWhatsApp({
            to,
            body: `Invoice ${invoiceNo} generated. Net Total: ₹${netAmount}`,
          });
        } catch (e) {
          console.error("WhatsApp error:", e);
        }
      }

      return res.json({
        success: true,
        bill,
        invoicePdfUrl: null, // always null (no saving)
        pdfBase64,           // large
        pdfBase64Gz,         // small recommended
        message: "Invoice created successfully",
      });
    } catch (err) {
      console.error("Bill Create Error:", err);
      return res.status(500).json({ success: false, message: "Something went wrong" });
    }
  }

  // ===========================================================
  // GET ALL BILLS
  // ===========================================================
  static async getAll(req: Request, res: Response) {
    try {
      const bills = await prisma.bill.findMany({ orderBy: { created_at: "desc" } });
      return res.json({ success: true, bills });
    } catch (err) {
      return res.status(500).json({ success: false });
    }
  }

  // ===========================================================
  // GET BILL BY ID (GENERATE PDF ON DEMAND)
  // ===========================================================
  static async getById(req: Request, res: Response) {
    try {
      const bill = await prisma.bill.findUnique({ where: { id: req.params.id } });
      if (!bill)
        return res.status(404).json({ success: false, message: "Bill not found" });

      // ---------- SHOP STATIC DATA ----------
      const shop = {
        name: "Sohan Lal And Son's Jewellers",
        address: "Durga Mandir Road\nSiswa Bazar\nMaharajganj -273163",
        gst: "09BHCPV5374A1Z8",
        phone: "+91 9682296756",
        email: "sohanlalandsonsjewellers@gmail.com",
        bankName: "Central Bank of India",
        bankBranch: "Siswa Bazar",
        bankAccount: "5896809162",
        ifsc: "CBIN0284670",
      };

      // ---------- GENERATE HTML -> PDF ----------
      const html = invoiceHTML({ shop, bill });
      const pdfBuffer = await htmlToPdfBuffer(html);

      // RETURN BASE64 PDF
      const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

      return res.json({
        success: true,
        bill,
        pdfBase64, // ALWAYS return PDF for viewing + printing
      });

    } catch (err: any) {
      console.error(err);

      return res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }

  // ===========================================================
  // UPDATE BILL
  // ===========================================================
  static async update(req: Request, res: Response) {
    try {
      const updates: any = req.body;

      // If items updated → recalc totals
      if (updates.items) {
        const totalAmount = updates.items.reduce(
          (sum: number, it: any) => sum + Number(it.price) * Number(it.qty || 1),
          0
        );

        const discount = Number(updates.discount || 0);
        const afterDiscount = totalAmount - discount;

        const gstPercent = Number(updates.gstPercent ?? 3);
        const gstAmount = +(afterDiscount * gstPercent) / 100;

        const cgstPercent = gstPercent / 2;
        const sgstPercent = gstPercent / 2;
        const cgstAmount = gstAmount / 2;
        const sgstAmount = gstAmount / 2;

        const netAmount = +(afterDiscount + gstAmount);

        // Assign computed fields back to updates object
        updates.totalAmount = totalAmount;
        updates.discount = discount;
        updates.gstPercent = gstPercent;
        updates.cgstPercent = cgstPercent;
        updates.sgstPercent = sgstPercent;
        updates.cgstAmount = cgstAmount;
        updates.sgstAmount = sgstAmount;
        updates.gstAmount = gstAmount;
        updates.netAmount = netAmount;
      }

      const updated = await prisma.bill.update({
        where: { id: req.params.id },
        data: updates,
      });

      return res.json({ success: true, bill: updated });
    } catch (err) {
      console.error("update bill error:", err);
      return res.status(500).json({ success: false, message: "Something went wrong." });
    }
  }

  // ===========================================================
  // EXPORT BILL EXCEL (BASE64 ONLY - NO FILE SAVING)
  // ===========================================================
  static async exportExcel(req: Request, res: Response) {
    try {
      console.log("📤 EXPORT EXCEL STARTED");

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Bills");

      sheet.columns = [
        { header: "Invoice No", key: "invoiceNo", width: 20 },
        { header: "Bill No", key: "billNo", width: 20 },
        { header: "Customer Name", key: "customerName", width: 25 },
        { header: "Phone", key: "customerPhone", width: 20 },
        { header: "Total Amount", key: "totalAmount", width: 15 },
        { header: "Discount", key: "discount", width: 15 },
        { header: "CGST", key: "cgstAmount", width: 10 },
        { header: "SGST", key: "sgstAmount", width: 10 },
        { header: "GST Total", key: "gstAmount", width: 12 },
        { header: "Net Amount", key: "netAmount", width: 15 },
        { header: "Created At", key: "created_at", width: 25 },
      ];

      const bills = await prisma.bill.findMany({
        orderBy: { created_at: "desc" },
      });

      bills.forEach((b) => {
        sheet.addRow({
          invoiceNo: b.invoiceNo || "",
          billNo: b.billNo || "",
          customerName: b.customerName || "",
          customerPhone: b.customerPhone || "",
          totalAmount: Number(b.totalAmount || 0),
          discount: Number(b.discount || 0),
          cgstAmount: Number(b.cgstAmount || 0),
          sgstAmount: Number(b.sgstAmount || 0),
          gstAmount: Number(b.gstAmount || 0),
          netAmount: Number(b.netAmount || 0),
          created_at: b.created_at
            ? new Date(b.created_at).toLocaleString()
            : "",
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const excelBase64 = Buffer.from(buffer).toString("base64");

      console.log("✅ EXPORT SUCCESS");

      return res.json({
        success: true,
        fileName: "Bills.xlsx",
        excelBase64,
      });
    } catch (err) {
      console.error("❌ EXPORT ERROR:", err);

      return res.status(500).json({
        success: false,
        message: "Export failed",
        // error: err.message,
      });
    }
  }



  // ===========================================================
  // DELETE BILL
  // ===========================================================
  static async remove(req: Request, res: Response) {
    try {
      await prisma.bill.delete({ where: { id: req.params.id } });
      return res.json({ success: true, message: "Bill deleted" });
    } catch (err) {
      return res.status(500).json({ success: false });
    }
  }
}
