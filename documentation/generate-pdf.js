'use strict';
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  const htmlPath = path.join(__dirname, 'wekili-documentation.html');
  const pdfPath  = path.join(__dirname, 'wekili-documentation.pdf');

  if (!fs.existsSync(htmlPath)) {
    console.error('HTML file not found:', htmlPath);
    process.exit(1);
  }

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage();

  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60000 });

  console.log('Generating PDF...');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size:8px;color:#999;width:100%;text-align:center;padding:5px 0;">Documentation Technique — Wekili</div>`,
    footerTemplate: `<div style="font-size:8px;color:#999;width:100%;text-align:center;padding:5px 0;">Page <span class="pageNumber"></span> sur <span class="totalPages"></span></div>`,
  });

  await browser.close();
  console.log('PDF generated:', pdfPath);
})();
