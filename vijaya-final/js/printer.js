// ═══════════════════════════════════════════════════════════
// VIJAYA MEDICALS — EPSON LQ-2090II DOT MATRIX PRINT MODULE
// Paper: 15" continuous feed, 136 columns, 10 CPI
// Font:  Courier New / monospace (dot-matrix style)
// ═══════════════════════════════════════════════════════════

const PRINTER = {
  name: 'EPSON LQ-2090II',
  cols: 136,           // max columns at 10 CPI
  pageWidth: '13.6in', // actual carriage width
  printWidth: '12.8in',// usable print area
  fontSize: '9.5pt',   // matches ~10 CPI on dot matrix
  lineHeight: '14pt',  // standard dot matrix line spacing
  font: "'Courier New', 'Courier', monospace"
};

// ── Pad/truncate string to exact width ──
function pad(str, len, align = 'L') {
  const s = String(str || '').replace(/\n/g, ' ');
  if (s.length >= len) return s.substring(0, len);
  const spaces = ' '.repeat(len - s.length);
  return align === 'R' ? spaces + s : s + spaces;
}

// ── Repeat character ──
function rep(char, n) { return char.repeat(n); }

// ── Format money for dot matrix (no ₹ symbol — use Rs.) ──
function dm(n) { return 'Rs.' + (+n || 0).toFixed(2); }

// ── Build the text-based bill (136 columns wide) ──
function buildBillText(b) {
  const W = 136;
  const lines = [];

  const add = (line) => lines.push(line);
  const hr  = (c = '-') => add(rep(c, W));
  const dhr = (c = '=') => add(rep(c, W));
  const blank = () => add('');

  // ── HEADER ──
  dhr('=');
  add(pad('VIJAYA MEDICALS', W, 'C').replace(/^ +| +$/, s => s)); // centre
  const title = 'VIJAYA MEDICALS';
  const spacesL = Math.floor((W - title.length) / 2);
  lines[lines.length - 1] = rep(' ', spacesL) + title + rep(' ', W - spacesL - title.length);

  const sub = 'Pharmacy & Medical Store';
  add(rep(' ', Math.floor((W - sub.length) / 2)) + sub);

  const addr = 'FPQX+8M8, Thiruvalluvar Salai, Oddanchatram, Tamil Nadu - 624619';
  add(rep(' ', Math.floor((W - addr.length) / 2)) + addr);

  const contact = 'Ph: 8973389393  |  Drug Lic: TN-OD-1234/2023  |  GSTIN: 33XXXXXVM01Z5';
  add(rep(' ', Math.floor((W - contact.length) / 2)) + contact);

  dhr('=');

  // ── BILL META ──
  const leftCol  = `Bill No : ${b.billNo}`;
  const midCol   = `Date    : ${fmtDateDM(b.date)}`;
  const rightCol = `Time    : ${b.time || '--:--'}`;
  add(pad(leftCol, 44) + pad(midCol, 46) + pad(rightCol, 46));

  const l2 = `Terminal: 001`;
  const m2 = `Payment : ${b.payMode || 'Cash'}`;
  const r2 = `DL#     : TN-OD-1234/2023`;
  add(pad(l2, 44) + pad(m2, 46) + pad(r2, 46));
  hr('-');

  // ── PATIENT / DOCTOR ──
  add(pad(`Patient : ${b.customerName || 'Walk-in Customer'}`, 68) + pad(`Doctor  : ${b.doctorName || 'N/A'}`, 68));
  add(pad(`Phone   : ${b.customerPhone || 'N/A'}`, 68) + pad(`Reg No  : ${b.regNo || 'N/A'}`, 68));
  add(pad(`Cust. GSTIN : `, 68) + pad(`Ref#    : VM-REF-${b.id || '000'}`, 68));
  hr('-');

  // ── ITEMS HEADER ──
  // Columns: Sno(3) Name(28) Batch(10) BoxNo(9) Expiry(8) Qty(4) MRP(8) Disc%(5) DiscAmt(8) GST%(5) CGST(8) SGST(8) TotAmt(9) = 122 + gaps
  add(
    pad('#',   3)  + ' ' +
    pad('Item Name',          28) + ' ' +
    pad('Batch',              10) + ' ' +
    pad('Box No',              9) + ' ' +
    pad('Expiry',              8) + ' ' +
    pad('Qty',  4, 'R') + ' ' +
    pad('MRP',  8, 'R') + ' ' +
    pad('D%',   4, 'R') + ' ' +
    pad('DAmt',  8, 'R') + ' ' +
    pad('G%',   4, 'R') + ' ' +
    pad('CGST',  8, 'R') + ' ' +
    pad('SGST',  8, 'R') + ' ' +
    pad('Tot Amt', 9, 'R')
  );
  hr('-');

  // ── ITEMS ROWS ──
  (b.items || []).forEach((it, i) => {
    const row =
      pad(String(i + 1), 3) + ' ' +
      pad(it.name, 28)      + ' ' +
      pad(it.batch || '-', 10) + ' ' +
      pad(it.boxno || '-',  9) + ' ' +
      pad(it.expiry || '-', 8) + ' ' +
      pad(String(it.qty || 0), 4, 'R') + ' ' +
      pad((+it.mrp).toFixed(2), 8, 'R') + ' ' +
      pad(String(it.disc || 0), 4, 'R') + ' ' +
      pad((+it.discAmt || 0).toFixed(2), 8, 'R') + ' ' +
      pad(String(it.gst || 0), 4, 'R') + ' ' +
      pad((+it.cgst || 0).toFixed(2), 8, 'R') + ' ' +
      pad((+it.sgst || 0).toFixed(2), 8, 'R') + ' ' +
      pad((+it.total || 0).toFixed(2), 9, 'R');
    add(row);
  });
  hr('-');

  // ── TOTALS (right-aligned block) ──
  blank();
  const totW = 50;
  const totX = W - totW;
  const tline = (label, val) => {
    const l = pad(label, 32, 'R');
    const v = pad(val,   17, 'R');
    add(rep(' ', totX) + l + ' ' + v);
  };

  tline('Gross Amount         :', dm(b.gross));
  tline('Item Discount        :', '-' + dm(b.disc));
  tline(`CGST                 :`, dm(b.cgst));
  tline(`SGST                 :`, dm(b.sgst));
  tline(`Total GST            :`, dm(b.gst));
  if ((+b.exDiscAmt) > 0) tline('Extra Discount       :', '-' + dm(b.exDiscAmt));
  add(rep(' ', totX) + rep('-', totW));
  tline('NET TOTAL            :', dm(b.grandTotal));
  add(rep(' ', totX) + rep('=', totW));

  blank();
  hr('-');

  // ── DPCO / SIGNATURE ──
  add(
    pad('* DPCO Items                         No Exchange OR Returns', 68) +
    pad('For Vijaya Medicals', 68)
  );
  add(
    pad('Customer Care: 8973389393', 68) +
    pad('', 68)
  );
  add(
    pad('WISH U SPEEDY RECOVERY', 68) +
    pad('________________________', 68)
  );
  add(
    pad('', 68) +
    pad('Pharmacist Signature', 68)
  );
  blank();
  add(rep('-', W));

  // ── FOOTER ──
  const f1 = 'No tax is payable on reverse charge basis';
  add(rep(' ', Math.floor((W - f1.length) / 2)) + f1);
  const f2 = 'care.vijayamedicals@gmail.com  |  vijayamedicals.in  |  Toll Free: 8973389393';
  add(rep(' ', Math.floor((W - f2.length) / 2)) + f2);
  const f3 = '-- Computer generated invoice. This is a valid Tax Invoice. --';
  add(rep(' ', Math.floor((W - f3.length) / 2)) + f3);

  dhr('=');
  blank();
  blank(); // feed for tear-off

  return lines.join('\n');
}

function fmtDateDM(s) {
  if (!s) return '--/--/----';
  const d = new Date(s);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ── MAIN PRINT FUNCTION FOR EPSON LQ-2090II ──
function doPrint(b) {
  const billText = buildBillText(b);

  const w = window.open('', '_blank', 'width=1100,height=820');
  w.document.write(`<!DOCTYPE html>
<html>
<head>
<title>Bill — ${b.billNo} | Vijaya Medicals</title>
<style>
  /* ── SCREEN PREVIEW (dark background like dot matrix paper) ── */
  @media screen {
    body {
      background: #1a1a1a;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .page-wrap {
      background: #fffff0;
      box-shadow: 0 4px 32px rgba(0,0,0,0.6);
      border: 2px solid #c8c096;
      border-radius: 2px;
    }
    .controls {
      background: #2c2c2c;
      padding: 10px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-radius: 4px 4px 0 0;
      margin-bottom: 0;
    }
    .btn-print {
      background: #1565C0;
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 5px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      font-family: Arial, sans-serif;
    }
    .btn-print:hover { background: #0D47A1; }
    .printer-info {
      color: #90A4AE;
      font-size: 11px;
      font-family: Arial, sans-serif;
    }
    .paper-holes {
      position: absolute;
      left: 0; right: 0; top: 0; bottom: 0;
      pointer-events: none;
    }
  }

  /* ── ACTUAL PRINT STYLES (Epson LQ-2090II) ── */
  @media print {
    body { margin: 0; padding: 0; background: white; }
    .controls { display: none !important; }
    .page-wrap { box-shadow: none; border: none; background: white; }

    /* ESC/P compatible settings */
    @page {
      size: 13.6in auto;       /* LQ-2090II max paper width */
      margin: 0.2in 0.3in;     /* minimal margins for dot matrix */
    }
  }

  /* ── BILL TEXT STYLING (both screen & print) ── */
  .bill-text {
    font-family: 'Courier New', 'Courier', monospace;
    font-size: 9.5pt;
    line-height: 14pt;
    color: #000;
    white-space: pre;
    padding: 0.25in 0.35in;
    width: ${PRINTER.printWidth};
    min-width: ${PRINTER.printWidth};
    letter-spacing: 0;
    word-spacing: 0;
    background: transparent;
    overflow: visible;
  }
</style>
</head>
<body>

<div class="controls" id="ctrl">
  <button class="btn-print" onclick="window.print()">&#128424; Print (Epson LQ-2090II)</button>
  <span class="printer-info">&#9679; Paper: 15" Continuous Feed &nbsp;|&nbsp; Printer: Epson LQ-2090II &nbsp;|&nbsp; Mode: 10 CPI &nbsp;|&nbsp; 136 cols</span>
</div>

<div class="page-wrap">
  <pre class="bill-text">${billText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</div>

<script>
  // Auto-trigger print dialog after a brief delay
  setTimeout(() => window.print(), 800);
<\/script>
</body>
</html>`);
  w.document.close();
}

// ── SETTINGS: How to configure Epson LQ-2090II in Windows ──
const PRINTER_SETUP_GUIDE = `
EPSON LQ-2090II SETUP FOR VIJAYA MEDICALS
==========================================

1. INSTALL DRIVER
   Download from: https://epson.com/Support/Printers/Dot-Matrix-Printers/LQ-Series/Epson-LQ-2090II/s/SPT_C11CF40201
   Install "EPSON LQ-2090II ESC/P" driver

2. WINDOWS PRINTER SETTINGS
   Control Panel → Devices & Printers → Right-click LQ-2090II → Printing Preferences
   - Paper Size   : Custom — 13.6in × 11in (continuous feed)
   - Orientation  : Portrait
   - Print Quality: Draft (fastest) or NLQ (better quality)
   - Font         : Courier 10 CPI
   - Color        : Black only

3. PAPER SETTINGS
   - Load continuous-feed paper (tractor feed)
   - Paper width  : 15 inch (with margins)
   - Print width  : 13.6 inch max
   - Use 9.5"×11" continuous paper for standard pharmacy bills

4. BROWSER PRINT SETTINGS (Chrome)
   File → Print → More Settings
   - Destination  : EPSON LQ-2090II
   - Paper size   : Custom (13.6" × 11")
   - Margins      : Minimum / None
   - Scale        : 100% (do NOT scale)
   - Background graphics: OFF
   - Headers/footers: OFF

5. TEST PRINT
   Open the bill → Click Print button
   First test with Draft quality to check alignment
`;
