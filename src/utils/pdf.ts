import fs from "fs";
import path from "path";

export async function ensureFolder(folder: string) {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
}

export async function htmlToPdf(html: string, outPath: string) {
  const { default: puppeteer } = await import('puppeteer');
  ensureFolder(path.dirname(outPath));
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" as any });
    await page.pdf({ path: outPath, format: "A4", printBackground: true });
  } finally {
    await browser.close();
  }
}