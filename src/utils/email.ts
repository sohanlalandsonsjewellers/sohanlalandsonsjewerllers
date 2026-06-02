// src/utils/email.ts
import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST || "";
const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const user = process.env.SMTP_USER || "";
const pass = process.env.SMTP_PASS || "";

let transporter: nodemailer.Transporter | null = null;
if (host && port && user && pass) {
  transporter = nodemailer.createTransport({
    host,
    port,
    auth: { user, pass },
  });
} else {
  transporter = null;
  console.warn("SMTP not configured. Emails will be skipped.");
}

export async function sendInvoiceEmail(opts: {
  to: string;
  subject: string;
  text?: string;
  attachments?: any[];
}) {
  if (!transporter) {
    console.warn("sendInvoiceEmail skipped: transporter not configured.");
    return null;
  }
  const info = await transporter.sendMail({
    from: process.env.FROM_EMAIL || user,
    to: opts.to,
    subject: opts.subject,
    text: opts.text || "",
    attachments: opts.attachments || [],
  });
  return info;
}
