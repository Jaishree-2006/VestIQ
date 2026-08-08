import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const DEFAULT_PDF_FILENAME = 'vestiq_dpdp_export.pdf';
const LEGAL_BASIS = 'India Digital Personal Data Protection (DPDP) Act 2023, Section 12 — Right to access personal data';

function downloadBlob(blob: Blob, filename: string): void {
  const safeFilename = typeof filename === 'string' && filename.trim() ? filename : DEFAULT_PDF_FILENAME;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeFilename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function maskPan(pan?: string | null): string {
  if (!pan) return 'N/A';
  const cleaned = pan.trim();
  if (cleaned.length <= 4) return cleaned;
  return `${cleaned.slice(0, 2)}${'*'.repeat(Math.max(0, cleaned.length - 4))}${cleaned.slice(-2)}`;
}

function formatCurrency(value: number | undefined | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(value);
  return `INR ${formatted}`;
}

function formatPercent(value: number | undefined | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
  return `${value.toFixed(1)}%`;
}

function formatDate(isoDate?: string | null): string {
  if (!isoDate) return 'N/A';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function sanitizeWinAnsiText(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/₹/g, 'INR ')
    .replace(/•/g, '*')
    .replace(/“/g, '"')
    .replace(/”/g, '"')
    .replace(/‘/g, "'")
    .replace(/’/g, "'")
    .replace(/[^\x00-\x7F]/g, '');
}

function wrapText(text: string, maxWidth: number, font: any, size: number): string[] {
  const cleanText = sanitizeWinAnsiText(text);
  const words = cleanText.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function downloadJsonFile(data: object, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  downloadBlob(blob, filename);
}

async function createPortfolioExportPdfBlob(exportData: any): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595, 842]);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const margin = 40;
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();
  const usableWidth = pageWidth - margin * 2;
  const lineHeight = 14;
  const sectionGap = 20;
  let y = pageHeight - margin;

  const drawText = (
    text: string,
    x: number,
    size: number,
    font: any,
    color = rgb(0.09, 0.11, 0.16),
    options: { maxWidth?: number; } = {}
  ) => {
    const cleanText = sanitizeWinAnsiText(text);
    page.drawText(cleanText, {
      x,
      y,
      size,
      font,
      color,
      ...options,
    });
  };

  const ensureSpace = (requiredSpace: number) => {
    if (y - requiredSpace < margin) {
      page = pdfDoc.addPage([595, 842]);
      y = page.getHeight() - margin;
    }
  };

  const drawSectionTitle = (title: string) => {
    ensureSpace(sectionGap + lineHeight * 2);
    drawText(title, margin, 14, helveticaBold, rgb(0.09, 0.11, 0.16));
    y -= lineHeight + 6;
  };

  const drawParagraph = (text: string, maxWidth = usableWidth, size = 10, font = helvetica) => {
    const lines = wrapText(text, maxWidth, font, size);
    for (const line of lines) {
      ensureSpace(lineHeight);
      drawText(line, margin, size, font, rgb(0.13, 0.16, 0.24));
      y -= lineHeight;
    }
  };

  const title = 'VestIQ Portfolio Data Export';
  const dateLine = `Export date: ${formatDate(exportData.exportedAt || new Date().toISOString())}`;
  const legalLine = exportData.legalBasis || LEGAL_BASIS;

  drawText(title, margin, 20, helveticaBold);
  y -= lineHeight * 2;
  drawText(dateLine, margin, 10, helvetica, rgb(0.4, 0.45, 0.53));
  y -= lineHeight;
  drawText(legalLine, margin, 10, helvetica, rgb(0.4, 0.45, 0.53), { maxWidth: usableWidth });
  y -= lineHeight * 2;

  drawSectionTitle('Profile Summary');
  const profile = exportData.userProfile || {};
  drawParagraph(`Full name: ${profile.fullName || 'N/A'}`);
  drawParagraph(`Email: ${profile.email || 'N/A'}`);
  drawParagraph(`PAN (masked): ${maskPan(profile.panMasked || profile.pan || null)}`);
  drawParagraph(`Account created: ${formatDate(profile.accountCreatedAt || profile.createdAt)}`);
  y -= sectionGap;

  const holdings = exportData.portfolio?.holdings || [];
  drawSectionTitle(`Holdings (${holdings.length})`);
  if (holdings.length === 0) {
    drawParagraph('No holdings available in this export.');
  } else {
    const columns = [120, 70, 70, 60, 80, 70];
    const headers = ['Name', 'Category', 'Broker', 'Units', 'Value', 'Weight'];
    let x = margin;
    ensureSpace(lineHeight * 2);
    for (let i = 0; i < headers.length; i += 1) {
      drawText(headers[i], x, 10, helveticaBold, rgb(0.13, 0.16, 0.24));
      x += columns[i];
    }
    y -= lineHeight + 4;

    for (const holding of holdings) {
      ensureSpace(lineHeight * 2);
      let rowX = margin;
      const rowValues = [
        String(holding.name || 'N/A'),
        String(holding.category || 'N/A'),
        String(holding.broker || 'N/A'),
        String(holding.units ?? 'N/A'),
        formatCurrency(holding.currentValue),
        formatPercent(holding.portfolioWeight),
      ];
      for (let i = 0; i < rowValues.length; i += 1) {
        const maxWidth = columns[i] - 6;
        const line = rowValues[i];
        const wrapped = wrapText(line, maxWidth, helvetica, 10);
        drawText(wrapped[0], rowX, 10, helvetica, rgb(0.13, 0.16, 0.24));
        rowX += columns[i];
      }
      y -= lineHeight;
    }
  }
  y -= sectionGap;

  const redFlags = exportData.portfolio?.activeRedFlags || [];
  drawSectionTitle(`Active Red Flags (${redFlags.length})`);
  if (redFlags.length === 0) {
    drawParagraph('No active red flags were present for this portfolio export.');
  } else {
    for (const flag of redFlags) {
      ensureSpace(lineHeight * 3);
      drawText(flag.title || 'Untitled flag', margin, 11, helveticaBold, rgb(0.13, 0.16, 0.24));
      y -= lineHeight;
      drawParagraph(flag.description || 'No description available.', usableWidth, 10, helvetica);
      y -= 4;
    }
  }
  y -= sectionGap;

  const timeline = exportData.portfolio?.healthScoreTimeline || [];
  drawSectionTitle(`Health Score History (${timeline.length})`);
  if (timeline.length === 0) {
    drawParagraph('No health score events were included in this export.');
  } else {
    for (const event of timeline) {
      ensureSpace(lineHeight * 3);
      const eventDate = formatDate(event.timestamp || event.createdAt);
      const reason = event.reasonObject?.reason || event.reason || event.triggerType || 'No reason provided';
      drawParagraph(`Date: ${eventDate}`);
      drawParagraph(`Change: ${event.previousScore ?? 'N/A'} -> ${event.newScore ?? 'N/A'} (${(event.delta ?? 0) >= 0 ? `+${event.delta ?? 0}` : event.delta ?? 0})`, usableWidth);
      drawParagraph(`Reason: ${reason}`, usableWidth);
      y -= 4;
    }
  }

  const pdfBytes = await pdfDoc.save();
  const buffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
  return new Blob([buffer], { type: 'application/pdf' });
}

export async function downloadPortfolioExportPdf(exportData: any, filename: string): Promise<void> {
  const blob = await createPortfolioExportPdfBlob(exportData);
  downloadBlob(blob, filename);
}
