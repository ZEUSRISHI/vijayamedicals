// ══════════════════════════════════════════════
// VIJAYA MEDICALS — Reports, PDF & Email Module
// ══════════════════════════════════════════════

const SHOP = {
  name: 'Vijaya Medicals',
  address: 'FPQX+8M8, Thiruvalluvar Salai, Oddanchatram, Tamil Nadu 624619',
  phone: '8973389393',
  email: 'care.vijayamedicals@gmail.com',
  gst: '33XXXXXVM01Z5',
  dlNo: 'TN-OD-1234/2023',
  website: 'vijayamedicals.in'
};

const fmtRs = n => 'Rs.' + (+n || 0).toFixed(2);
const fmtD  = s => { if (!s) return '—'; const d = new Date(s); return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); };

// ══════════════════════════════════════
// SALES & PROFIT REPORT PDF
// ══════════════════════════════════════
async function generateSalesProfitPDF(fromDate, toDate) {
  const allBills = await dbAll('bills');
  const allMeds  = await dbAll('medicines');
  const medMap   = {};
  allMeds.forEach(m => { medMap[m.id] = m; });

  const bills = allBills.filter(b => b.date >= fromDate && b.date <= toDate);

  if (!bills.length) { toast('No bills found for this date range', 'warn'); return null; }

  let totalSales = 0, totalDiscount = 0, totalGST = 0, totalProfit = 0, totalPurchaseCost = 0;

  const itemRows = [];
  bills.forEach(b => {
    (b.items || []).forEach(it => {
      const ptr = it.ptr || (medMap[it.medId] ? medMap[it.medId].ptr : 0) || 0;
      const { actual, gross, pct } = calcProfit(it.mrp, ptr, it.qty, it.disc);
      totalSales       += it.total || 0;
      totalDiscount    += it.discAmt || 0;
      totalGST         += it.gstAmt || 0;
      totalProfit      += gross;
      totalPurchaseCost += ptr * it.qty;
      itemRows.push({ billNo: b.billNo, date: b.date, name: it.name, batch: it.batch, qty: it.qty, mrp: it.mrp, ptr, disc: it.disc || 0, discAmt: it.discAmt || 0, actual, gst: it.gst, gstAmt: it.gstAmt || 0, total: it.total || 0, profit: gross, profitPct: pct });
    });
  });

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Sales & Profit Report | ${SHOP.name}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;font-size:10px;color:#000;padding:15px}
  .header{text-align:center;border-bottom:3px double #1565C0;padding-bottom:8px;margin-bottom:10px}
  .header h1{font-size:18px;color:#1565C0;font-weight:900;letter-spacing:1px}
  .header p{font-size:9px;color:#555;margin-top:2px}
  .report-title{background:#1565C0;color:#fff;padding:7px 14px;font-size:13px;font-weight:700;border-radius:4px;margin-bottom:12px;display:flex;justify-content:space-between}
  .summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}
  .sum-card{background:#F0F4F8;border:1px solid #D0D9E4;border-radius:5px;padding:8px 10px;text-align:center}
  .sum-card .val{font-size:14px;font-weight:900;color:#1565C0;margin-bottom:2px}
  .sum-card .lbl{font-size:8px;color:#607D8B;font-weight:700;text-transform:uppercase}
  .sum-card.profit .val{color:#2E7D32}
  .sum-card.disc .val{color:#C62828}
  table{width:100%;border-collapse:collapse;font-size:8.5px;margin-bottom:12px}
  th{background:#1565C0;color:#fff;padding:5px 6px;text-align:left;font-size:8px}
  td{padding:4px 6px;border-bottom:1px solid #eee}
  tr:nth-child(even) td{background:#F8FAFC}
  .profit-pos{color:#2E7D32;font-weight:700}
  .profit-neg{color:#C62828;font-weight:700}
  .footer{text-align:center;margin-top:14px;padding-top:8px;border-top:1px solid #ddd;font-size:8.5px;color:#888}
  @media print{.no-print{display:none}}
</style></head><body>
<button class="no-print" onclick="window.print()" style="margin-bottom:12px;padding:7px 20px;background:#1565C0;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:700">🖨️ Print / Save PDF</button>
<div class="header">
  <h1>${SHOP.name.toUpperCase()}</h1>
  <p>${SHOP.address}</p>
  <p>Ph: ${SHOP.phone} | GSTIN: ${SHOP.gst} | Drug Lic: ${SHOP.dlNo}</p>
</div>
<div class="report-title">
  <span>📊 Sales & Profit Report</span>
  <span>Period: ${fmtD(fromDate)} to ${fmtD(toDate)} | Generated: ${fmtD(new Date().toISOString().split('T')[0])}</span>
</div>
<div class="summary-grid">
  <div class="sum-card"><div class="val">Rs.${totalSales.toFixed(2)}</div><div class="lbl">Total Sales</div></div>
  <div class="sum-card"><div class="val">Rs.${totalPurchaseCost.toFixed(2)}</div><div class="lbl">Purchase Cost</div></div>
  <div class="sum-card profit"><div class="val">Rs.${totalProfit.toFixed(2)}</div><div class="lbl">Gross Profit</div></div>
  <div class="sum-card disc"><div class="val">Rs.${totalDiscount.toFixed(2)}</div><div class="lbl">Total Discount</div></div>
  <div class="sum-card"><div class="val">${bills.length}</div><div class="lbl">Total Bills</div></div>
  <div class="sum-card"><div class="val">Rs.${totalGST.toFixed(2)}</div><div class="lbl">GST Collected</div></div>
  <div class="sum-card profit"><div class="val">${totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : 0}%</div><div class="lbl">Profit Margin</div></div>
  <div class="sum-card"><div class="val">${bills.length > 0 ? 'Rs.' + (totalSales / bills.length).toFixed(2) : 'Rs.0.00'}</div><div class="lbl">Avg Bill Value</div></div>
</div>
<table>
  <thead><tr><th>Bill No</th><th>Date</th><th>Medicine</th><th>Batch</th><th>Qty</th><th>MRP</th><th>PTR</th><th>Disc%</th><th>Disc Amt</th><th>GST%</th><th>GST Amt</th><th>Sale Price</th><th>Purchase</th><th>Gross Profit</th><th>Margin%</th></tr></thead>
  <tbody>
  ${itemRows.map(r => `<tr>
    <td>${r.billNo}</td><td>${fmtD(r.date)}</td><td><strong>${r.name}</strong></td><td>${r.batch || '—'}</td>
    <td>${r.qty}</td><td>Rs.${(+r.mrp).toFixed(2)}</td><td>Rs.${(+r.ptr).toFixed(2)}</td>
    <td>${r.disc}%</td><td>Rs.${(+r.discAmt).toFixed(2)}</td>
    <td>${r.gst}%</td><td>Rs.${(+r.gstAmt).toFixed(2)}</td>
    <td>Rs.${(+r.total).toFixed(2)}</td>
    <td>Rs.${((+r.ptr) * r.qty).toFixed(2)}</td>
    <td class="${r.profit >= 0 ? 'profit-pos' : 'profit-neg'}">Rs.${(+r.profit).toFixed(2)}</td>
    <td class="${r.profitPct >= 0 ? 'profit-pos' : 'profit-neg'}">${r.profitPct}%</td>
  </tr>`).join('')}
  </tbody>
</table>
<div class="footer">
  Report generated by ${SHOP.name} PMS | ${SHOP.email} | ${new Date().toLocaleString('en-IN')}
</div>
</body></html>`;
  return html;
}

// ══════════════════════════════════════
// STOCK / MEDICINE LIST PDF
// ══════════════════════════════════════
async function generateStockPDF() {
  const meds = await dbAll('medicines');
  const expired   = meds.filter(m => expiryStatus(m.expiry) === 'expired');
  const critical1 = meds.filter(m => expiryStatus(m.expiry) === 'critical1');
  const critical3 = meds.filter(m => expiryStatus(m.expiry) === 'critical3');
  const warning6  = meds.filter(m => expiryStatus(m.expiry) === 'warning6');
  const lowStock  = meds.filter(m => m.qty <= (m.reorderLevel || 20));
  const totalVal  = meds.reduce((s, m) => s + (m.mrp || 0) * (m.qty || 0), 0);
  const totalCost = meds.reduce((s, m) => s + (m.ptr || 0) * (m.qty || 0), 0);

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Stock Report | ${SHOP.name}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;font-size:9.5px;color:#000;padding:15px}
  .header{text-align:center;border-bottom:3px double #1565C0;padding-bottom:8px;margin-bottom:10px}
  .header h1{font-size:17px;color:#1565C0;font-weight:900}
  .header p{font-size:9px;color:#555;margin-top:2px}
  .section{margin-bottom:14px}
  .section-title{background:#37474F;color:#fff;padding:5px 10px;font-size:11px;font-weight:700;border-radius:3px;margin-bottom:6px}
  .section-title.red{background:#C62828}
  .section-title.amber{background:#E65100}
  .section-title.yellow{background:#F57F17}
  .section-title.green{background:#2E7D32}
  table{width:100%;border-collapse:collapse;font-size:8.5px}
  th{background:#455A64;color:#fff;padding:4px 6px;text-align:left}
  td{padding:4px 6px;border-bottom:1px solid #eee}
  tr.warn td{background:#FFFDE7}
  tr.danger td{background:#FFEBEE}
  .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px}
  .sc{background:#F0F4F8;border:1px solid #D0D9E4;border-radius:4px;padding:8px;text-align:center}
  .sc .v{font-size:14px;font-weight:900;color:#1565C0}
  .sc .l{font-size:8px;color:#607D8B;text-transform:uppercase;font-weight:700}
  .footer{text-align:center;margin-top:12px;padding-top:8px;border-top:1px solid #ddd;font-size:8px;color:#888}
  @media print{.no-print{display:none}}
</style></head><body>
<button class="no-print" onclick="window.print()" style="margin-bottom:12px;padding:7px 20px;background:#1565C0;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:700">🖨️ Print / Save PDF</button>
<div class="header">
  <h1>${SHOP.name.toUpperCase()}</h1>
  <p>${SHOP.address} | Ph: ${SHOP.phone}</p>
</div>
<div style="background:#1565C0;color:#fff;padding:7px 14px;font-size:13px;font-weight:700;border-radius:4px;margin-bottom:12px;display:flex;justify-content:space-between">
  <span>📦 Medicine Stock Report</span>
  <span>Generated: ${fmtD(new Date().toISOString().split('T')[0])}</span>
</div>
<div class="summary">
  <div class="sc"><div class="v">${meds.length}</div><div class="l">Total SKUs</div></div>
  <div class="sc"><div class="v" style="color:#C62828">${expired.length + critical1.length + critical3.length + warning6.length}</div><div class="l">Expiry Alerts</div></div>
  <div class="sc"><div class="v" style="color:#E65100">${lowStock.length}</div><div class="l">Low Stock</div></div>
  <div class="sc"><div class="v">Rs.${totalVal.toFixed(0)}</div><div class="l">Stock Value (MRP)</div></div>
</div>

${expired.length ? `<div class="section"><div class="section-title red">💀 EXPIRED MEDICINES (${expired.length}) — Remove Immediately</div>
<table><thead><tr><th>Name</th><th>Batch</th><th>Box No</th><th>Expiry</th><th>Stock</th><th>MRP</th><th>Value</th></tr></thead><tbody>
${expired.map(m => `<tr class="danger"><td><strong>${m.name}</strong></td><td>${m.batchNo}</td><td>${m.boxNo || '—'}</td><td><strong>${m.expiry}</strong></td><td>${m.qty} ${m.unit}</td><td>Rs.${(+m.mrp).toFixed(2)}</td><td>Rs.${((+m.mrp) * m.qty).toFixed(2)}</td></tr>`).join('')}
</tbody></table></div>` : ''}

${critical1.length ? `<div class="section"><div class="section-title red">🚨 EXPIRING IN 1 MONTH (${critical1.length})</div>
<table><thead><tr><th>Name</th><th>Batch</th><th>Box No</th><th>Expiry</th><th>Stock</th><th>Rack</th></tr></thead><tbody>
${critical1.map(m => `<tr class="danger"><td><strong>${m.name}</strong></td><td>${m.batchNo}</td><td>${m.boxNo || '—'}</td><td>${m.expiry}</td><td>${m.qty} ${m.unit}</td><td>${m.rack || '—'}</td></tr>`).join('')}
</tbody></table></div>` : ''}

${critical3.length ? `<div class="section"><div class="section-title amber">⚠️ EXPIRING IN 3 MONTHS (${critical3.length})</div>
<table><thead><tr><th>Name</th><th>Batch</th><th>Box No</th><th>Expiry</th><th>Stock</th><th>Rack</th></tr></thead><tbody>
${critical3.map(m => `<tr class="warn"><td><strong>${m.name}</strong></td><td>${m.batchNo}</td><td>${m.boxNo || '—'}</td><td>${m.expiry}</td><td>${m.qty} ${m.unit}</td><td>${m.rack || '—'}</td></tr>`).join('')}
</tbody></table></div>` : ''}

${lowStock.length ? `<div class="section"><div class="section-title amber">📉 LOW STOCK MEDICINES (${lowStock.length})</div>
<table><thead><tr><th>Name</th><th>Category</th><th>Current Stock</th><th>Reorder Level</th><th>Supplier</th><th>MRP</th></tr></thead><tbody>
${lowStock.map(m => `<tr class="warn"><td><strong>${m.name}</strong></td><td>${m.category}</td><td><strong style="color:#C62828">${m.qty} ${m.unit}</strong></td><td>${m.reorderLevel || 20}</td><td>${m.supplier || '—'}</td><td>Rs.${(+m.mrp).toFixed(2)}</td></tr>`).join('')}
</tbody></table></div>` : ''}

<div class="section"><div class="section-title green">📋 COMPLETE STOCK LIST (${meds.length} items)</div>
<table><thead><tr><th>#</th><th>Name</th><th>Salt</th><th>Cat.</th><th>Batch</th><th>Box</th><th>Expiry</th><th>MRP</th><th>PTR</th><th>Stock</th><th>Value</th><th>Rack</th></tr></thead><tbody>
${meds.map((m, i) => `<tr class="${['expired','critical1'].includes(expiryStatus(m.expiry)) ? 'danger' : ['critical3','warning6'].includes(expiryStatus(m.expiry)) ? 'warn' : ''}">
  <td>${i + 1}</td><td><strong>${m.name}</strong></td><td>${m.salt || '—'}</td><td>${m.category}</td>
  <td>${m.batchNo}</td><td>${m.boxNo || '—'}</td><td>${m.expiry || '—'}</td>
  <td>Rs.${(+m.mrp).toFixed(2)}</td><td>Rs.${(+(m.ptr || 0)).toFixed(2)}</td>
  <td>${m.qty} ${m.unit}</td><td>Rs.${((+m.mrp) * m.qty).toFixed(2)}</td><td>${m.rack || '—'}</td>
</tr>`).join('')}
</tbody></table></div>
<div class="footer">Stock Report | ${SHOP.name} | ${SHOP.email} | ${new Date().toLocaleString('en-IN')}</div>
</body></html>`;
  return html;
}

// ══════════════════════════════════════
// CUSTOMER REPORT PDF
// ══════════════════════════════════════
async function generateCustomerPDF() {
  const custs = await dbAll('customers');
  const bills = await dbAll('bills');
  const monthly = custs.filter(c => c.isMonthly);
  const reminders = await checkMonthlyReminders();

  const custStats = custs.map(c => {
    const cBills = bills.filter(b => b.customerPhone === c.phone);
    const total = cBills.reduce((s, b) => s + (b.grandTotal || 0), 0);
    return { ...c, billCount: cBills.length, totalSpent: total };
  }).sort((a, b) => b.totalSpent - a.totalSpent);

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Customer Report | ${SHOP.name}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;font-size:9.5px;color:#000;padding:15px}
  .header{text-align:center;border-bottom:3px double #1565C0;padding-bottom:8px;margin-bottom:10px}
  .header h1{font-size:17px;color:#1565C0;font-weight:900}
  .header p{font-size:9px;color:#555;margin-top:2px}
  .rt{background:#1565C0;color:#fff;padding:7px 14px;font-size:13px;font-weight:700;border-radius:4px;margin-bottom:12px;display:flex;justify-content:space-between}
  .alert-box{border-radius:5px;padding:9px 12px;margin-bottom:8px;border-left:4px solid}
  .alert-box.warn{background:#FFF3E0;border-color:#E65100}
  table{width:100%;border-collapse:collapse;margin-bottom:12px}
  th{background:#455A64;color:#fff;padding:4px 6px;text-align:left;font-size:8px}
  td{padding:4px 6px;border-bottom:1px solid #eee;font-size:8.5px}
  .footer{text-align:center;margin-top:12px;border-top:1px solid #ddd;padding-top:8px;font-size:8px;color:#888}
  @media print{.no-print{display:none}}
</style></head><body>
<button class="no-print" onclick="window.print()" style="margin-bottom:12px;padding:7px 20px;background:#1565C0;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:700">🖨️ Print / Save PDF</button>
<div class="header"><h1>${SHOP.name.toUpperCase()}</h1><p>${SHOP.address}</p></div>
<div class="rt"><span>👥 Customer Report</span><span>Generated: ${fmtD(new Date().toISOString().split('T')[0])}</span></div>
${reminders.length ? `<div style="background:#FFF3E0;border:1px solid #FFE0B2;border-radius:5px;padding:10px 14px;margin-bottom:12px">
  <div style="font-size:11px;font-weight:700;color:#E65100;margin-bottom:6px">🔔 Monthly Medicine Reminders Due (${reminders.length})</div>
  ${reminders.map(r => `<div class="alert-box warn"><strong>${r.customer.name}</strong> — Ph: ${r.customer.phone} — Last bill: ${fmtD(r.customer.lastBillDate)} (${r.days} days ago)<br>
  <em style="font-size:8px">SMS: "Dear ${r.customer.name}, your monthly medicines are due at Vijaya Medicals. Please visit or call 8973389393."</em></div>`).join('')}
</div>` : ''}
<div style="font-size:11px;font-weight:700;margin-bottom:6px;color:#1565C0">📋 All Customers (${custs.length})</div>
<table><thead><tr><th>#</th><th>Name</th><th>Phone</th><th>Address</th><th>Age</th><th>Type</th><th>Bills</th><th>Total Spent</th><th>Last Bill</th></tr></thead>
<tbody>${custStats.map((c, i) => `<tr>
  <td>${i + 1}</td><td><strong>${c.name}</strong></td><td>${c.phone || '—'}</td><td>${c.address || '—'}</td>
  <td>${c.age || '—'}</td><td>${c.isMonthly ? 'Monthly' : 'Regular'}</td>
  <td>${c.billCount}</td><td><strong>Rs.${c.totalSpent.toFixed(2)}</strong></td><td>${fmtD(c.lastBillDate)}</td>
</tr>`).join('')}</tbody></table>
<div class="footer">${SHOP.name} | ${SHOP.email} | ${new Date().toLocaleString('en-IN')}</div>
</body></html>`;
  return html;
}

// ══════════════════════════════════════
// COMPLETE DAILY / FULL REPORT PDF
// ══════════════════════════════════════
async function generateFullReport(fromDate, toDate) {
  const [allBills, allMeds, allCusts] = await Promise.all([dbAll('bills'), dbAll('medicines'), dbAll('customers')]);
  const medMap = {};
  allMeds.forEach(m => { medMap[m.id] = m; });

  const bills = allBills.filter(b => b.date >= fromDate && b.date <= toDate);
  let totalSales = 0, totalProfit = 0, totalDiscount = 0, totalGST = 0, totalCost = 0;

  bills.forEach(b => {
    totalSales    += b.grandTotal || 0;
    totalDiscount += b.disc || 0;
    totalGST      += b.gst || 0;
    (b.items || []).forEach(it => {
      const ptr = it.ptr || (medMap[it.medId] ? medMap[it.medId].ptr : 0) || 0;
      const { gross } = calcProfit(it.mrp, ptr, it.qty, it.disc);
      totalProfit += gross;
      totalCost   += ptr * it.qty;
    });
  });

  const expiring = allMeds.filter(m => expiryStatus(m.expiry) !== 'ok' && expiryStatus(m.expiry) !== 'unknown');
  const lowStock = allMeds.filter(m => m.qty <= (m.reorderLevel || 20));
  const reminders = await checkMonthlyReminders();

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Full Report | ${SHOP.name}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;font-size:9.5px;color:#000;padding:15px}
  .header{text-align:center;border-bottom:3px double #1565C0;padding-bottom:10px;margin-bottom:12px}
  .header h1{font-size:19px;color:#1565C0;font-weight:900;letter-spacing:1px}
  .header p{font-size:9px;color:#555;margin-top:2px}
  .section{margin-bottom:16px;page-break-inside:avoid}
  .st{background:#1565C0;color:#fff;padding:6px 12px;font-size:11px;font-weight:700;border-radius:4px;margin-bottom:8px}
  .st.red{background:#C62828}.st.amber{background:#E65100}.st.green{background:#2E7D32}
  .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}
  .sc{background:#F0F4F8;border:1px solid #CBD5E0;border-radius:5px;padding:9px;text-align:center}
  .sc .v{font-size:15px;font-weight:900;color:#1565C0}
  .sc .l{font-size:7.5px;color:#607D8B;text-transform:uppercase;font-weight:700;margin-top:2px}
  .sc.profit .v{color:#2E7D32}.sc.danger .v{color:#C62828}.sc.warn .v{color:#E65100}
  table{width:100%;border-collapse:collapse;font-size:8.5px}
  th{background:#37474F;color:#fff;padding:4px 6px;text-align:left}
  td{padding:4px 6px;border-bottom:1px solid #eee}
  tr.row-danger td{background:#FFF5F5}
  tr.row-warn td{background:#FFFDE7}
  .alert{border-radius:4px;padding:8px 10px;margin-bottom:6px;font-size:8.5px}
  .alert.danger{background:#FFEBEE;border-left:3px solid #C62828}
  .alert.warn{background:#FFF3E0;border-left:3px solid #E65100}
  .footer{text-align:center;margin-top:16px;padding-top:10px;border-top:2px double #1565C0;font-size:8.5px;color:#666}
  @media print{.no-print{display:none};@page{size:A4;margin:0.5in}}
</style></head><body>
<button class="no-print" onclick="window.print()" style="margin-bottom:12px;padding:7px 20px;background:#1565C0;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:700">🖨️ Print / Save as PDF</button>
<div class="header">
  <h1>${SHOP.name.toUpperCase()}</h1>
  <p>${SHOP.address}</p>
  <p>Ph: ${SHOP.phone} &nbsp;|&nbsp; ${SHOP.email} &nbsp;|&nbsp; GSTIN: ${SHOP.gst} &nbsp;|&nbsp; Drug Lic: ${SHOP.dlNo}</p>
</div>
<div style="background:#1565C0;color:#fff;padding:8px 14px;font-size:13px;font-weight:700;border-radius:5px;margin-bottom:14px;display:flex;justify-content:space-between">
  <span>📊 Complete Business Report</span>
  <span>Period: ${fmtD(fromDate)} to ${fmtD(toDate)}</span>
</div>

<!-- SALES SUMMARY -->
<div class="section">
  <div class="st">💰 Sales & Profit Summary</div>
  <div class="grid4">
    <div class="sc"><div class="v">Rs.${totalSales.toFixed(2)}</div><div class="l">Total Sales</div></div>
    <div class="sc"><div class="v">Rs.${totalCost.toFixed(2)}</div><div class="l">Purchase Cost</div></div>
    <div class="sc profit"><div class="v">Rs.${totalProfit.toFixed(2)}</div><div class="l">Gross Profit</div></div>
    <div class="sc profit"><div class="v">${totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : 0}%</div><div class="l">Profit Margin</div></div>
    <div class="sc"><div class="v">${bills.length}</div><div class="l">Bills Issued</div></div>
    <div class="sc"><div class="v">Rs.${totalGST.toFixed(2)}</div><div class="l">GST Collected</div></div>
    <div class="sc warn"><div class="v">Rs.${totalDiscount.toFixed(2)}</div><div class="l">Discounts Given</div></div>
    <div class="sc"><div class="v">Rs.${bills.length > 0 ? (totalSales / bills.length).toFixed(2) : '0.00'}</div><div class="l">Avg Bill Value</div></div>
  </div>
</div>

<!-- BILLS LIST -->
<div class="section">
  <div class="st">🧾 Bills (${bills.length})</div>
  <table><thead><tr><th>Bill No</th><th>Date</th><th>Patient</th><th>Doctor</th><th>Items</th><th>Sale</th><th>Discount</th><th>GST</th><th>Net Total</th><th>Mode</th></tr></thead>
  <tbody>${bills.map(b => `<tr><td><strong>${b.billNo}</strong></td><td>${fmtD(b.date)}</td><td>${b.customerName || 'Walk-in'}</td><td>${b.doctorName || '—'}</td><td>${b.items?.length || 0}</td><td>Rs.${(+b.gross||0).toFixed(2)}</td><td>Rs.${(+b.disc||0).toFixed(2)}</td><td>Rs.${(+b.gst||0).toFixed(2)}</td><td><strong>Rs.${(+b.grandTotal||0).toFixed(2)}</strong></td><td>${b.payMode || 'Cash'}</td></tr>`).join('')}
  ${!bills.length ? '<tr><td colspan="10" style="text-align:center;padding:10px;color:#888">No bills in this date range</td></tr>' : ''}
  </tbody></table>
</div>

<!-- EXPIRY WARNINGS -->
${expiring.length ? `<div class="section">
  <div class="st red">⚠️ Expiry Warnings (${expiring.length})</div>
  ${expiring.filter(m => expiryStatus(m.expiry) === 'expired').map(m => `<div class="alert danger"><strong>EXPIRED: ${m.name}</strong> | Batch: ${m.batchNo} | Exp: ${m.expiry} | Stock: ${m.qty} ${m.unit} | Rack: ${m.rack || '—'}</div>`).join('')}
  ${expiring.filter(m => expiryStatus(m.expiry) === 'critical1').map(m => `<div class="alert danger"><strong>1 MONTH: ${m.name}</strong> | Batch: ${m.batchNo} | Exp: ${m.expiry} | Stock: ${m.qty} ${m.unit}</div>`).join('')}
  ${expiring.filter(m => ['critical3','warning6'].includes(expiryStatus(m.expiry))).map(m => `<div class="alert warn"><strong>${expiryStatus(m.expiry) === 'critical3' ? '3 MONTHS' : '6 MONTHS'}: ${m.name}</strong> | Batch: ${m.batchNo} | Exp: ${m.expiry} | Stock: ${m.qty} ${m.unit}</div>`).join('')}
</div>` : ''}

<!-- LOW STOCK -->
${lowStock.length ? `<div class="section">
  <div class="st amber">📉 Low Stock Alerts (${lowStock.length})</div>
  <table><thead><tr><th>Medicine</th><th>Current Qty</th><th>Reorder Level</th><th>Category</th><th>Supplier</th><th>MRP</th></tr></thead>
  <tbody>${lowStock.map(m => `<tr class="row-warn"><td><strong>${m.name}</strong></td><td style="color:#C62828;font-weight:700">${m.qty} ${m.unit}</td><td>${m.reorderLevel || 20}</td><td>${m.category}</td><td>${m.supplier || '—'}</td><td>Rs.${(+m.mrp).toFixed(2)}</td></tr>`).join('')}</tbody></table>
</div>` : ''}

<!-- MONTHLY REMINDERS -->
${reminders.length ? `<div class="section">
  <div class="st amber">🔔 Monthly Customer Reminders (${reminders.length})</div>
  <table><thead><tr><th>Customer</th><th>Phone</th><th>Last Bill</th><th>Days Ago</th><th>SMS Message</th></tr></thead>
  <tbody>${reminders.map(r => `<tr class="row-warn"><td><strong>${r.customer.name}</strong></td><td>${r.customer.phone}</td><td>${fmtD(r.customer.lastBillDate)}</td><td><strong>${r.days} days</strong></td><td style="font-size:7.5px">Dear ${r.customer.name}, your monthly medicines are due at Vijaya Medicals. Call 8973389393</td></tr>`).join('')}</tbody></table>
</div>` : ''}

<div class="footer">
  Complete Business Report | ${SHOP.name} | ${SHOP.address}<br>
  ${SHOP.email} | Ph: ${SHOP.phone} | Generated: ${new Date().toLocaleString('en-IN')}
</div>
</body></html>`;
  return html;
}

// ══════════════════════════════════════
// OPEN PDF IN NEW WINDOW
// ══════════════════════════════════════
function openPDFWindow(html, title) {
  const w = window.open('', '_blank', 'width=1000,height=800');
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 700);
}

// ══════════════════════════════════════
// EMAIL VIA MAILTO (opens email client)
// ══════════════════════════════════════
function sendReportByEmail(reportType, fromDate, toDate) {
  const subject = encodeURIComponent(`${SHOP.name} — ${reportType} (${fromDate} to ${toDate})`);
  const body = encodeURIComponent(
    `Dear Team,\n\nPlease find attached the ${reportType} for ${SHOP.name}.\n\nPeriod: ${fmtD(fromDate)} to ${fmtD(toDate)}\n\nTo view the report:\n1. Click the Download PDF button in the software\n2. Save the PDF\n3. Attach it to this email\n\nShop: ${SHOP.name}\nAddress: ${SHOP.address}\nPhone: ${SHOP.phone}\nGSTIN: ${SHOP.gst}\n\nGenerated by Vijaya Medicals PMS\n${new Date().toLocaleString('en-IN')}`
  );
  window.open(`mailto:${SHOP.email}?subject=${subject}&body=${body}`);
  toast('Email client opened — attach the PDF and send', 'info');
}
