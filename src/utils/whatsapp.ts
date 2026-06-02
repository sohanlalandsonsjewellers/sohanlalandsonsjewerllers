// src/utils/whatsapp.ts
import twilio from "twilio";

const sid = process.env.TWILIO_ACCOUNT_SID || "";
const token = process.env.TWILIO_AUTH_TOKEN || "";
const from = process.env.TWILIO_WHATSAPP_FROM || ""; // e.g. whatsapp:+14155238886 (Twilio sandbox)

let client: ReturnType<typeof twilio> | null = null;
if (sid && token) {
  try {
    client = twilio(sid, token);
  } catch (e) {
    console.warn("Twilio init failed:", e);
    client = null;
  }
} else {
  client = null;
  console.warn("Twilio not configured. WhatsApp will be skipped.");
}

export async function sendWhatsApp(opts: { to: string; body?: string }) {
  if (!client) {
    console.warn("sendWhatsApp skipped: Twilio not configured.");
    return null;
  }
  // opts.to should be like "whatsapp:+919876543210"
  try {
    const msg = await client.messages.create({
      from,
      to: opts.to,
      body: opts.body,
    });
    return msg;
  } catch (err) {
    console.error("Twilio send error:", err);
    throw err;
  }
}
