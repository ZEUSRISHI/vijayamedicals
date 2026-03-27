// ══════════════════════════════════════════════
// VIJAYA MEDICALS PMS — Database Layer v4
// ══════════════════════════════════════════════
const DB_NAME = 'VijayaMedicalsPMS', DB_VER = 1;
let db;

function checkAuth() {
  if (sessionStorage.getItem('vm_auth') !== '1') { window.location.href = 'login.html'; return false; }
  return true;
}
function logout() { sessionStorage.clear(); window.location.href = 'login.html'; }
setInterval(() => { const t = parseInt(sessionStorage.getItem('vm_login_time') || '0'); if (t && Date.now() - t > 8 * 3600 * 1000) logout(); }, 60000);

function initDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = e => {
      db = e.target.result;
      const cfg = { medicines: ['name','batchNo','boxNo','category','salt','manufacturer'], bills: ['billNo','date','customerPhone','customerName'], suppliers: ['name'], customers: ['name','phone'] };
      for (const [name, idx] of Object.entries(cfg)) {
        if (!db.objectStoreNames.contains(name)) {
          const st = db.createObjectStore(name, { keyPath: 'id', autoIncrement: true });
          idx.forEach(i => st.createIndex(i, i, { unique: false }));
        }
      }
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
    };
    req.onsuccess = e => { db = e.target.result; res(db); };
    req.onerror = e => rej(e.target.error);
  });
}

const _tx = (s, m = 'readonly') => db.transaction(s, m).objectStore(s);
const dbAll = s => new Promise((r, j) => { const q = _tx(s).getAll(); q.onsuccess = () => r(q.result); q.onerror = () => j([]); });
const dbGet = (s, id) => new Promise((r, j) => { const q = _tx(s).get(id); q.onsuccess = () => r(q.result); q.onerror = () => j(null); });
const dbAdd = (s, d) => new Promise((r, j) => { const q = _tx(s, 'readwrite').add(d); q.onsuccess = () => r(q.result); q.onerror = () => j(); });
const dbPut = (s, d) => new Promise((r, j) => { const q = _tx(s, 'readwrite').put(d); q.onsuccess = () => r(q.result); q.onerror = () => j(); });
const dbDel = (s, id) => new Promise((r, j) => { const q = _tx(s, 'readwrite').delete(id); q.onsuccess = () => r(true); q.onerror = () => j(); });
async function getSetting(k, d = '') { try { const r = await dbGet('settings', k); return r ? r.value : d; } catch { return d; } }
async function setSetting(k, v) { await dbPut('settings', { key: k, value: v }); }

function expiryStatus(ym) {
  if (!ym) return 'unknown';
  const [y, m] = ym.split('-').map(Number);
  const diff = (new Date(y, m - 1, 1) - new Date()) / (1000 * 60 * 60 * 24 * 30);
  if (diff < 0) return 'expired';
  if (diff <= 1) return 'critical1';
  if (diff <= 3) return 'critical3';
  if (diff <= 6) return 'warning6';
  return 'ok';
}
function expiryBadge(ym) {
  const s = expiryStatus(ym);
  const map = { expired: '<span class="badge b-err">Expired</span>', critical1: '<span class="badge b-err">1 Month!</span>', critical3: '<span class="badge b-amb">3 Months</span>', warning6: '<span class="badge b-warn">6 Months</span>', ok: '<span class="badge b-ok">Valid</span>', unknown: '—' };
  return map[s] || '—';
}

function calcProfit(sellPrice, purchasePrice, qty, discPct) {
  const actual = sellPrice * (1 - (discPct || 0) / 100);
  const gross = (actual - (purchasePrice || 0)) * (qty || 1);
  const pct = purchasePrice > 0 ? ((actual - purchasePrice) / purchasePrice * 100) : 0;
  return { actual: +actual.toFixed(2), gross: +gross.toFixed(2), pct: +pct.toFixed(1) };
}

async function checkMonthlyReminders() {
  const custs = await dbAll('customers');
  return custs.filter(c => c.isMonthly && c.lastBillDate && Math.floor((Date.now() - new Date(c.lastBillDate)) / 86400000) >= 25)
    .map(c => ({ customer: c, days: Math.floor((Date.now() - new Date(c.lastBillDate)) / 86400000) }));
}

async function seedData() {
  const ex = await dbAll('medicines');
  if (ex.length) return;
  const meds = [
    { name: 'Paracetamol 500mg', salt: 'Paracetamol', category: 'Tablet', manufacturer: 'Cipla', supplier: 'Medico Dist.', batchNo: 'CPL2401', boxNo: 'BX-001', hsnCode: '30049099', mrp: 25.50, ptr: 14.00, pts: 12.00, gst: 5, qty: 200, reorderLevel: 30, unit: 'Strip', rack: 'A-01', expiry: '2026-09', schedule: 'OTC', prescription: false, createdAt: new Date().toISOString() },
    { name: 'Amoxicillin 250mg', salt: 'Amoxicillin', category: 'Capsule', manufacturer: 'Sun Pharma', supplier: 'Pharma WS', batchNo: 'SUN2402', boxNo: 'BX-002', hsnCode: '30041090', mrp: 85.00, ptr: 52.00, pts: 48.00, gst: 12, qty: 80, reorderLevel: 20, unit: 'Strip', rack: 'A-02', expiry: '2025-11', schedule: 'H', prescription: true, createdAt: new Date().toISOString() },
    { name: 'Cough Syrup 100ml', salt: 'Dextromethorphan', category: 'Syrup', manufacturer: 'Himalaya', supplier: 'Medico Dist.', batchNo: 'HIM2403', boxNo: 'BX-003', hsnCode: '30049099', mrp: 65.00, ptr: 38.00, pts: 34.00, gst: 12, qty: 35, reorderLevel: 15, unit: 'Bottle', rack: 'B-01', expiry: '2026-04', schedule: 'OTC', prescription: false, createdAt: new Date().toISOString() },
    { name: 'Metformin 500mg', salt: 'Metformin HCl', category: 'Tablet', manufacturer: 'USV Ltd', supplier: 'Pharma WS', batchNo: 'USV2404', boxNo: 'BX-004', hsnCode: '30049099', mrp: 35.00, ptr: 20.00, pts: 18.00, gst: 12, qty: 300, reorderLevel: 50, unit: 'Strip', rack: 'C-01', expiry: '2027-03', schedule: 'H', prescription: true, createdAt: new Date().toISOString() },
    { name: 'Vitamin C 500mg', salt: 'Ascorbic Acid', category: 'Tablet', manufacturer: 'Mankind', supplier: 'Medico Dist.', batchNo: 'MAN2405', boxNo: 'BX-005', hsnCode: '30049099', mrp: 45.00, ptr: 26.00, pts: 23.00, gst: 12, qty: 120, reorderLevel: 25, unit: 'Strip', rack: 'D-01', expiry: '2025-08', schedule: 'OTC', prescription: false, createdAt: new Date().toISOString() },
    { name: 'Azithromycin 500mg', salt: 'Azithromycin', category: 'Tablet', manufacturer: 'Cipla', supplier: 'Medico Dist.', batchNo: 'CPL2406', boxNo: 'BX-006', hsnCode: '30041090', mrp: 110.00, ptr: 65.00, pts: 60.00, gst: 12, qty: 60, reorderLevel: 15, unit: 'Strip', rack: 'A-03', expiry: '2026-12', schedule: 'H1', prescription: true, createdAt: new Date().toISOString() },
    { name: 'Betadine 100ml', salt: 'Povidone Iodine', category: 'Liquid', manufacturer: 'Win Medicare', supplier: 'Pharma WS', batchNo: 'WIN2408', boxNo: 'BX-008', hsnCode: '30049099', mrp: 55.00, ptr: 32.00, pts: 28.00, gst: 12, qty: 22, reorderLevel: 10, unit: 'Bottle', rack: 'E-01', expiry: '2026-03', schedule: 'OTC', prescription: false, createdAt: new Date().toISOString() },
  ];
  for (const m of meds) await dbAdd('medicines', m);
  await dbAdd('suppliers', { name: 'Medico Distributors', contact: 'Rajan Kumar', phone: '9876543210', email: 'rajan@medico.com', address: 'Anna Nagar, Chennai', gstNo: '33AABCM1234F1Z5', dlNo: 'DL-TN-12345', createdAt: new Date().toISOString() });
  await dbAdd('customers', { name: 'Ramesh Kumar', phone: '9876501234', address: 'Oddanchatram', age: 45, isMonthly: true, lastBillDate: new Date().toISOString().split('T')[0], createdAt: new Date().toISOString() });
}
