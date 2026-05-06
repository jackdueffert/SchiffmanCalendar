/**
 * Generates two sample documents for testing document analysis:
 *   samples/lease-abstract-123-commerce-dr.pdf
 *   samples/rent-roll-pacific-ventures.xlsx
 *
 * Run: node scripts/generate-samples.mjs
 */

import PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'samples');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// ─── PDF ──────────────────────────────────────────────────────────────────────

function generatePDF() {
  const filePath = path.join(OUT, 'lease-abstract-123-commerce-dr.pdf');
  const doc = new PDFDocument({ margin: 55, size: 'LETTER' });
  doc.pipe(fs.createWriteStream(filePath));

  const W = doc.page.width - 110; // usable width
  const accent = '#2C3E8C';
  const light = '#F0F4FF';

  function section(title) {
    doc.moveDown(0.8);
    doc.rect(55, doc.y, W, 18).fill(accent);
    const y = doc.y + 3;
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold').text(title.toUpperCase(), 60, y + 1);
    doc.fillColor('black');
    doc.y += 22;
  }

  function row(label, value, shade = false) {
    const rY = doc.y;
    if (shade) doc.rect(55, rY - 2, W, 14).fill(light).fillColor('black');
    doc.fontSize(9).font('Helvetica-Bold').text(label, 60, rY, { width: 180, continued: false });
    doc.fontSize(9).font('Helvetica').text(value, 245, rY, { width: W - 190 });
    doc.y = rY + 14;
  }

  function tableHeader(cols) {
    const rY = doc.y;
    doc.rect(55, rY - 2, W, 15).fill(accent);
    let x = 60;
    cols.forEach(([text, w]) => {
      doc.fillColor('white').fontSize(8).font('Helvetica-Bold').text(text, x, rY + 1, { width: w });
      x += w;
    });
    doc.fillColor('black');
    doc.y = rY + 17;
  }

  function tableRow(cols, values, shade) {
    const rY = doc.y;
    if (shade) doc.rect(55, rY - 1, W, 13).fill('#F8F9FC').fillColor('black');
    let x = 60;
    cols.forEach(([, w], i) => {
      doc.fontSize(8).font('Helvetica').text(values[i] ?? '', x, rY, { width: w - 4 });
      x += w;
    });
    doc.y = rY + 13;
  }

  // ── Cover ──
  doc.rect(0, 0, doc.page.width, 90).fill(accent);
  doc.fillColor('white')
    .fontSize(20).font('Helvetica-Bold')
    .text('LEASE ABSTRACT', 55, 22);
  doc.fontSize(11).font('Helvetica')
    .text('123 Commerce Drive, Suite 400  ·  Los Angeles, CA 90071', 55, 50);
  doc.fontSize(8).font('Helvetica')
    .text('CONFIDENTIAL — FOR INTERNAL USE ONLY', 55, 68);
  doc.fillColor('black');
  doc.y = 105;

  // ── Property & Parties ──
  section('Property & Parties');
  row('Property Address', '123 Commerce Drive, Suite 400, Los Angeles, CA 90071', false);
  row('Tenant', 'Pacific Ventures LLC, a California limited liability company', true);
  row('Landlord', 'Commerce Drive Holdings LP, a Delaware limited partnership', false);
  row('Rentable Square Footage', '8,500 RSF (Suite 400, Third Floor)', true);
  row('Permitted Use', 'General office and technology operations', false);

  // ── Term ──
  section('Lease Term');
  row('Commencement Date', 'March 1, 2022', false);
  row('Expiration Date', 'February 28, 2027', true);
  row('Initial Term', '5 years (60 months)', false);
  row('Rent Commencement', 'March 1, 2022 (no free-rent period)', true);

  // ── Rent Schedule ──
  section('Base Rent Schedule  (3% Annual Escalation)');
  const rentCols = [['Period', 120], ['Start Date', 90], ['End Date', 90], ['Monthly Rent', 95], ['Annual PSF', 90]];
  tableHeader(rentCols);
  const rentRows = [
    ['Year 1', 'March 1, 2022', 'February 28, 2023', '$21,250.00', '$30.00'],
    ['Year 2', 'March 1, 2023', 'February 29, 2024', '$21,887.50', '$30.90'],
    ['Year 3', 'March 1, 2024', 'February 28, 2025', '$22,543.13', '$31.83'],
    ['Year 4', 'March 1, 2025', 'February 28, 2026', '$23,219.42', '$32.79'],
    ['Year 5', 'March 1, 2026', 'February 28, 2027', '$23,916.00', '$33.78'],
  ];
  rentRows.forEach((r, i) => tableRow(rentCols, r, i % 2 === 0));

  // ── Renewal Options ──
  section('Renewal Options');
  row('Option 1', 'One (1) three-year renewal at 95% of then-current Fair Market Rent', false);
  row('Option 1 Exercise Deadline', 'August 31, 2026 (180 days prior to initial expiration)', true);
  row('Option 1 Term', 'March 1, 2027 – February 28, 2030', false);
  row('Option 2', 'One (1) additional three-year renewal (conditioned on Option 1 exercise)', true);
  row('Option 2 Exercise Deadline', 'August 31, 2029 (180 days prior to Option 1 expiration)', false);
  row('Option 2 Term', 'March 1, 2030 – February 28, 2033', true);

  // ── Purchase Option ──
  section('Purchase Option');
  row('Purchase Option', 'Tenant has right of first offer to purchase the Premises', false);
  row('Fixed Purchase Price', '$6,200,000', true);
  row('Exercise Deadline', 'September 30, 2025 — written notice required to Landlord', false);
  row('Closing', 'No later than 90 days following exercise', true);

  // ── Critical Dates ──
  section('Critical Dates & Notices');
  const cdCols = [['Description', 200], ['Deadline / Date', 120], ['Type', 90], ['Notes', 75]];
  tableHeader(cdCols);
  const critRows = [
    ['TI Allowance Draw Deadline', 'June 30, 2023', 'Critical', 'Forfeited thereafter'],
    ['CAM Audit Deadline (2025)', 'April 15, 2025', 'Critical', '90 days from stmt'],
    ['CAM Audit Deadline (2026)', 'April 15, 2026', 'Critical', '90 days from stmt'],
    ['Purchase Option Deadline', 'September 30, 2025', 'Option', 'Written notice req.'],
    ['Parking Rate Increase', 'January 1, 2026', 'Rent Increase', '$125/space/mo'],
    ['Co-Tenancy Trigger Review', 'December 31, 2025', 'Critical', 'Anchor lease expires'],
    ['HVAC Maintenance Report Due', 'March 1, 2026', 'Critical', 'Annual requirement'],
    ['Insurance Certificate Renewal', 'December 1, 2026', 'Critical', 'Certificate to Landlord'],
    ['Renewal Option 1 Deadline', 'August 31, 2026', 'Option', '180-day notice'],
    ['Lease Expiration', 'February 28, 2027', 'Expiration', 'Initial term ends'],
    ['Renewal Option 2 Deadline', 'August 31, 2029', 'Option', '180-day notice'],
  ];
  critRows.forEach((r, i) => tableRow(cdCols, r, i % 2 === 0));

  // ── Footer ──
  doc.moveDown(1.5);
  doc.fontSize(7).fillColor('#888888')
    .text('This lease abstract is a summary only. Refer to the original executed lease agreement for controlling terms.', 55, doc.y, { align: 'center', width: W });

  doc.end();
  console.log(`✓ PDF  → ${filePath}`);
}

// ─── XLSX ─────────────────────────────────────────────────────────────────────

function generateXLSX() {
  const filePath = path.join(OUT, 'rent-roll-pacific-ventures.xlsx');
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Lease Summary ──
  const summary = [
    ['LEASE SUMMARY — PACIFIC VENTURES LLC'],
    [''],
    ['Field', 'Detail'],
    ['Property', '123 Commerce Drive, Suite 400, Los Angeles, CA 90071'],
    ['Tenant', 'Pacific Ventures LLC'],
    ['Landlord', 'Commerce Drive Holdings LP'],
    ['Suite', '400 (Third Floor)'],
    ['RSF', '8,500'],
    ['Lease Commencement', '2022-03-01'],
    ['Lease Expiration', '2027-02-28'],
    ['Initial Term (months)', '60'],
    ['Renewal Option 1 Expiry', '2030-02-28'],
    ['Renewal Option 2 Expiry', '2033-02-28'],
    ['Purchase Option Price', '$6,200,000'],
    ['Purchase Option Deadline', '2025-09-30'],
    ['Notice Address (Tenant)', 'Pacific Ventures LLC, 123 Commerce Dr Suite 400, LA CA 90071'],
    ['Notice Address (Landlord)', 'Commerce Drive Holdings LP, c/o CRE Management, LA CA 90025'],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(summary);
  ws1['!cols'] = [{ wch: 30 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Lease Summary');

  // ── Sheet 2: Rent Schedule ──
  const rent = [
    ['RENT SCHEDULE — 3% ANNUAL ESCALATION'],
    [''],
    ['Year', 'Period Start', 'Period End', 'Monthly Rent ($)', 'Annual Rent ($)', 'PSF/Year ($)', 'Escalation'],
    ['Year 1', '2022-03-01', '2023-02-28', 21250.00, 255000.00, 30.00, 'Base'],
    ['Year 2', '2023-03-01', '2024-02-29', 21887.50, 262650.00, 30.90, '3%'],
    ['Year 3', '2024-03-01', '2025-02-28', 22543.13, 270517.50, 31.83, '3%'],
    ['Year 4', '2025-03-01', '2026-02-28', 23219.42, 278633.00, 32.79, '3%'],
    ['Year 5', '2026-03-01', '2027-02-28', 23916.00, 286992.00, 33.78, '3%'],
    [''],
    ['PARKING'],
    ['Item', 'Rate (per space/mo)', 'Effective Date', 'Spaces', 'Monthly Total'],
    ['Parking — Year 1–3', 110, '2022-03-01', 25, 2750],
    ['Parking — Rate Increase', 125, '2026-01-01', 25, 3125],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(rent);
  ws2['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Rent Schedule');

  // ── Sheet 3: Key Dates ──
  const dates = [
    ['KEY DATES & CRITICAL DEADLINES'],
    [''],
    ['Event', 'Date', 'Type', 'Description / Action Required'],
    ['TI Allowance Draw Deadline', '2023-06-30', 'Critical', 'Tenant must draw full TI allowance ($127,500) by this date or it is forfeited per Section 6.4'],
    ['Year 2 Rent Commencement', '2023-03-01', 'Rent Increase', 'Base rent increases 3% to $21,887.50/month per rent schedule'],
    ['CAM Reconciliation Statement', '2024-01-15', 'Critical', 'Landlord must deliver CAM reconciliation for prior calendar year by January 15 per Section 9.2'],
    ['Year 3 Rent Commencement', '2024-03-01', 'Rent Increase', 'Base rent increases 3% to $22,543.13/month per rent schedule'],
    ['CAM Audit Deadline (2024 stmts)', '2024-04-15', 'Critical', 'Tenant audit right expires 90 days after receipt of CAM statement per Section 9.3'],
    ['Year 4 Rent Commencement', '2025-03-01', 'Rent Increase', 'Base rent increases 3% to $23,219.42/month per rent schedule'],
    ['CAM Audit Deadline (2025 stmts)', '2025-04-15', 'Critical', 'Tenant audit right expires 90 days after receipt of CAM statement per Section 9.3'],
    ['Purchase Option Deadline', '2025-09-30', 'Option', 'Tenant must deliver written notice to purchase Premises at $6,200,000 by this date per Section 38; closing within 90 days of exercise'],
    ['Co-Tenancy Trigger Review', '2025-12-31', 'Critical', 'Anchor tenant (Floor & Decor) lease expires; if anchor vacates and replacement not found within 90 days, Tenant rent reduces 25% per Section 14'],
    ['Parking Rate Increase', '2026-01-01', 'Rent Increase', 'Parking rate increases from $110 to $125 per unreserved space/month effective January 1, 2026'],
    ['HVAC Maintenance Report', '2026-03-01', 'Critical', 'Tenant must deliver annual HVAC maintenance report from licensed contractor to Landlord per Section 11.1'],
    ['Year 5 Rent Commencement', '2026-03-01', 'Rent Increase', 'Base rent increases 3% to $23,916.00/month per rent schedule'],
    ['CAM Audit Deadline (2026 stmts)', '2026-04-15', 'Critical', 'Tenant audit right expires 90 days after receipt of CAM statement per Section 9.3'],
    ['Renewal Option 1 Exercise Deadline', '2026-08-31', 'Option', 'Tenant must deliver written notice of Option 1 exercise (one 3-year renewal at 95% FMR) no later than 180 days prior to lease expiration per Section 36'],
    ['Insurance Certificate Renewal', '2026-12-01', 'Critical', 'Tenant must deliver updated certificate of insurance to Landlord by December 1 each year per Section 15.1; minimum $2M CGL'],
    ['Lease Expiration', '2027-02-28', 'Expiration', 'Initial 5-year lease term expires. Tenant must vacate by midnight or Option 1 must have been exercised per Section 2.1'],
    ['Renewal Option 2 Exercise Deadline', '2029-08-31', 'Option', 'Tenant must deliver written notice of Option 2 exercise (second 3-year renewal) no later than 180 days prior to Option 1 expiration per Section 36'],
    ['Option 1 Term Expiration', '2030-02-28', 'Expiration', 'Three-year renewal Option 1 term expires if exercised'],
    ['Option 2 Term Expiration', '2033-02-28', 'Expiration', 'Three-year renewal Option 2 term expires if exercised'],
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(dates);
  ws3['!cols'] = [{ wch: 38 }, { wch: 14 }, { wch: 15 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'Key Dates');

  XLSX.writeFile(wb, filePath);
  console.log(`✓ XLSX → ${filePath}`);
}

generatePDF();
generateXLSX();
console.log('\nSample documents written to ./samples/');
