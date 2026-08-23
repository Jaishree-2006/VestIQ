import type { SuitabilityReportRecord } from '../types';

/**
 * Triggers a client-side print/save window configured specifically for PDF export
 * of the Internal Investor Suitability Report.
 */
export function exportSuitabilityReportPdf(report: SuitabilityReportRecord): void {
  const printWindow = window.open('', '_blank', 'width=900,height=1000');
  if (!printWindow) {
    alert('Please allow popups to export the PDF report.');
    return;
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>VestIQ_Suitability_Report_${report.clientName.replace(/[^a-zA-Z0-9]/g, '_')}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0B1220;
      background: #ffffff;
      font-size: 13px;
      line-height: 1.5;
      margin: 0;
      padding: 0;
    }
    .disclaimer-banner {
      background: #FFF8EE;
      border: 2px solid #C57D25;
      color: #63451B;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 11px;
      text-align: center;
      padding: 10px 14px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0B1220;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .logo {
      font-size: 22px;
      font-weight: 900;
      color: #0B1220;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .logo-badge {
      background: #C57D25;
      color: #fff;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 14px;
    }
    .report-meta {
      text-align: right;
      font-size: 11px;
      color: #64748B;
    }
    .report-meta strong {
      color: #0B1220;
    }
    .section-title {
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #C57D25;
      border-bottom: 1px solid #EDE9DF;
      padding-bottom: 4px;
      margin-top: 22px;
      margin-bottom: 12px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .info-box {
      background: #FAF8F5;
      border: 1px solid #EDE9DF;
      border-radius: 8px;
      padding: 12px;
    }
    .info-label {
      font-size: 10px;
      text-transform: uppercase;
      color: #64748B;
      font-weight: 700;
    }
    .info-value {
      font-size: 13px;
      font-weight: 700;
      color: #0B1220;
      margin-top: 2px;
    }
    .score-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-weight: 800;
      font-size: 16px;
      background: ${report.healthScore >= 70 ? '#E6F4EA' : '#FFF8EE'};
      color: ${report.healthScore >= 70 ? '#2BB673' : '#C57D25'};
      border: 1px solid ${report.healthScore >= 70 ? '#A7F3D0' : '#F7E5C8'};
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    th, td {
      border: 1px solid #EDE9DF;
      padding: 8px 10px;
      text-align: left;
    }
    th {
      background: #FAF8F5;
      font-size: 11px;
      text-transform: uppercase;
      color: #64748B;
    }
    .flag-card {
      background: #FDF2F2;
      border: 1px solid #FCA5A5;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 10px;
    }
    .flag-title {
      font-weight: 800;
      color: #991B1B;
      font-size: 13px;
    }
    .flag-desc {
      font-size: 12px;
      color: #7F1D1D;
      margin-top: 4px;
    }
    .flag-action {
      font-size: 11px;
      font-weight: 600;
      color: #0B1220;
      margin-top: 6px;
      background: #ffffff;
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid #FECACA;
    }
    .ack-box {
      margin-top: 24px;
      background: ${report.status === 'acknowledged' ? '#F0FDF4' : '#FFF8EE'};
      border: 2px dashed ${report.status === 'acknowledged' ? '#2BB673' : '#C57D25'};
      border-radius: 8px;
      padding: 14px;
    }
    .ack-status {
      font-weight: 800;
      font-size: 14px;
      color: ${report.status === 'acknowledged' ? '#15803D' : '#92400E'};
      text-transform: uppercase;
    }
    .footer-disclaimer {
      margin-top: 30px;
      padding-top: 12px;
      border-top: 1px solid #EDE9DF;
      font-size: 10px;
      color: #64748B;
      text-align: center;
      line-height: 1.4;
    }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>

  <!-- Top Banner Disclaimer (Prompt Requirement 3) -->
  <div class="disclaimer-banner">
    ⚠️ INTERNAL COMPLIANCE REFERENCE DOCUMENT — FOR INTERNAL BROKER/RM REVIEW ONLY.<br>
    NOT AN OFFICIAL REGULATORY FILING OR EXTERNAL SUBMISSION.
  </div>

  <div class="header">
    <div>
      <div class="logo">
        <span class="logo-badge">V</span> VestIQ Intelligence Engine
      </div>
      <div style="font-size: 12px; color: #64748B; font-weight: 600; margin-top: 4px;">
        Investor Portfolio Suitability Audit Report
      </div>
    </div>
    <div class="report-meta">
      <div>Report ID: <strong>${report.id}</strong></div>
      <div>Generated Date: <strong>${report.generatedAt}</strong></div>
      <div>Generated By: <strong>${report.generatedBy}</strong></div>
    </div>
  </div>

  <!-- Client Demographics & Profile -->
  <div class="section-title">1. Client Profile & Investment Horizon</div>
  <div class="grid-2">
    <div class="info-box">
      <div class="info-label">Client Name & Identifier</div>
      <div class="info-value">${report.clientName}</div>
      <div style="font-size: 11px; color: #64748B; margin-top: 2px;">PAN Token: ${report.casPan}</div>
    </div>
    <div class="info-box">
      <div class="info-label">Stated Risk Profile & Timeline</div>
      <div class="info-value">${report.riskProfile} Profile</div>
      <div style="font-size: 11px; color: #64748B; margin-top: 2px;">Horizon: ${report.investmentTimeline}</div>
    </div>
  </div>

  <!-- Health Score Summary -->
  <div class="section-title">2. Portfolio Health & Suitability Score Breakdown</div>
  <div class="info-box" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
    <div>
      <div class="info-label">Overall Suitability Score</div>
      <div style="font-size: 12px; color: #64748B; margin-top: 2px;">Computed against SEBI asset allocation & liquidity horizon benchmarks</div>
    </div>
    <div class="score-badge">${report.healthScore} / 100</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Factor & Impact Category</th>
        <th>Penalty / Bonus</th>
        <th>Audit Reason & Explanation</th>
      </tr>
    </thead>
    <tbody>
      ${report.healthScoreFactors.map(f => `
        <tr>
          <td style="font-weight: 700;">${f.factor}</td>
          <td style="font-weight: 800; color: ${f.penaltyOrBonus >= 0 ? '#2BB673' : '#EF4444'};">
            ${f.penaltyOrBonus >= 0 ? `+${f.penaltyOrBonus}` : f.penaltyOrBonus} pts
          </td>
          <td style="color: #475569;">${f.reason}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- Asset Allocation Summary -->
  <div class="section-title">3. Portfolio Asset Allocation Breakdown</div>
  <table>
    <thead>
      <tr>
        <th>Asset Category</th>
        <th>Allocation %</th>
        <th>Total Value (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Equities</td>
        <td>${report.allocationSummary.equitiesPct}%</td>
        <td>₹${((report.totalValue * report.allocationSummary.equitiesPct) / 100).toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td>Mutual Funds</td>
        <td>${report.allocationSummary.mfsPct}%</td>
        <td>₹${((report.totalValue * report.allocationSummary.mfsPct) / 100).toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td>Bonds & Debt Securities</td>
        <td>${report.allocationSummary.bondsPct}%</td>
        <td>₹${((report.totalValue * report.allocationSummary.bondsPct) / 100).toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td>REITs & InvITs</td>
        <td>${report.allocationSummary.reitsPct}%</td>
        <td>₹${((report.totalValue * report.allocationSummary.reitsPct) / 100).toLocaleString('en-IN')}</td>
      </tr>
    </tbody>
  </table>

  <!-- Active Red Flags -->
  <div class="section-title">4. Active Suitability & Mis-Selling Flags (${report.redFlagsList.length})</div>
  ${report.redFlagsList.length === 0 ? `
    <div style="padding: 12px; background: #E6F4EA; border: 1px solid #A7F3D0; color: #15803D; border-radius: 8px; font-weight: 600;">
      ✓ Zero active mis-selling or suitability flags detected for this client portfolio.
    </div>
  ` : report.redFlagsList.map(rf => `
    <div class="flag-card">
      <div class="flag-title">🚩 ${rf.title}</div>
      <div class="flag-desc">${rf.description}</div>
      ${rf.sebiRuleRef ? `<div style="font-size: 10px; color: #64748B; margin-top: 4px;">Ref: ${rf.sebiRuleRef}</div>` : ''}
      <div class="flag-action">💡 Suggested Remediation: ${rf.suggestedAction}</div>
    </div>
  `).join('')}

  <!-- Internal Acknowledgment Audit Status (Prompt Requirement 4 & 5) -->
  <div class="ack-box">
    <div class="ack-status">
      Internal Audit Status: ${report.status === 'acknowledged' ? '✓ ACKNOWLEDGED & REVIEWED' : '⏳ PENDING INTERNAL ACKNOWLEDGMENT'}
    </div>
    <div style="font-size: 11px; margin-top: 4px; color: #475569;">
      ${report.status === 'acknowledged' 
        ? `Acknowledged by <strong>${report.reviewedBy}</strong> on <strong>${report.reviewedAt}</strong>. Verified internal review sign-off.` 
        : 'This report has been generated and is awaiting explicit internal sign-off by an assigned RM or Compliance Officer.'}
    </div>
  </div>

  <!-- Footer Disclaimer (Prompt Requirement 3) -->
  <div class="footer-disclaimer">
    INTERNAL COMPLIANCE REFERENCE DOCUMENT — FOR INTERNAL BROKER/RM REVIEW ONLY.<br>
    THIS DOCUMENT IS GENERATED AUTOMATICALLY BY THE VESTIQ ANALYTICS ENGINE FOR INTERNAL COMPLIANCE AUDITING.<br>
    IT IS NOT AN OFFICIAL REGULATORY FILING, EXTERNAL SUBMISSION, OR LEGAL OFFER TO ANY EXTERNAL AUTHORITY OR GOVT BODY.
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    }
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
