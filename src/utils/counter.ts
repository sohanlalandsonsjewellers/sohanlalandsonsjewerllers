// src/utils/counter.ts
import prisma from "../config/db.config.js";

/**
 * nextCounter - atomically increment named counter in Counter model
 * Counter model (prisma): model Counter { id String @id @map("_id") seq Int }
 */
export async function nextCounter(name = "invoice_seq"): Promise<number> {
  // upsert will create if missing, otherwise increment
  const counter = await prisma.counter.upsert({
    where: { id: name },
    create: { id: name, seq: 1 },
    update: { seq: { increment: 1 } },
  });
  return counter.seq;
}
