export const htmlToPdfBuffer = async (html: string) => {
  const isProduction = process.env.IS_RENDER === 'true';

  let browser;

  if (isProduction) {
    const chromium = await import('@sparticuz/chromium');
    const puppeteer = await import('puppeteer-core');

    browser = await puppeteer.default.launch({
      args: chromium.default.args,
      executablePath: await chromium.default.executablePath(),
      headless: true,
    });
  } else {
    const puppeteer = await import('puppeteer-core');

    browser = await puppeteer.default.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  const pdfBuffer = await page.pdf({ format: 'A4' });
  await browser.close();
  return pdfBuffer;
};