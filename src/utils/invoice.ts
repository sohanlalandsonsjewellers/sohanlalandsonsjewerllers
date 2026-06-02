// src/utils/invoice.ts
export function pad(num: number, size: number = 5) {
  let s = String(num);
  while (s.length < size) s = "0" + s;
  return s;
}

// src/utils/invoice.ts
// src/utils/invoice.ts
export function buildInvoiceNo(prefix = "SLSJ-INV-", seq = 1, padLen = 5) {
  const s = String(seq).padStart(padLen, "0");
  return `${prefix}${s}`;
}

