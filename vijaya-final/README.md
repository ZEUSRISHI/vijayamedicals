# 💊 Vijaya Medicals — Pharmacy Management System v3.0
## Complete User & Developer Guide

**Shop:** Vijaya Medicals  
**Address:** FPQX+8M8, Thiruvalluvar Salai, Oddanchatram, Tamil Nadu 624619  
**Phone:** 8973389393  
**Email:** care.vijayamedicals@gmail.com  

---

## 🚀 HOW TO RUN (Step-by-Step)

### Method 1 — Direct Open (Easiest)
```
1. Unzip the downloaded file
2. Open folder: vijaya-pms-v3/
3. Double-click: login.html
4. Login with:
   Email:    care.vijayamedicals@gmail.com
   Password: Vijayamedicals
```

### Method 2 — Local Server (If blank page appears)
**Windows Command Prompt:**
```cmd
cd C:\Users\YourName\Downloads\vijaya-pms-v3
python -m http.server 8080
```
Then open: **http://localhost:8080/login.html**

**Mac / Linux Terminal:**
```bash
cd ~/Downloads/vijaya-pms-v3
python3 -m http.server 8080
```
Then open: **http://localhost:8080/login.html**

**Node.js (if installed):**
```cmd
npx serve vijaya-pms-v3
```

### Method 3 — VS Code Live Server
1. Install "Live Server" extension
2. Right-click `login.html` → Open with Live Server

---

## 📱 MOBILE USE
Works on any mobile browser. Open Chrome on Android/iPhone → go to `login.html`.

---

## 🔐 LOGIN CREDENTIALS
```
Email:    care.vijayamedicals@gmail.com
Password: Vijayamedicals
```
Auto-logout after 8 hours for security.

---

## 💊 HOW TO ADD MEDICINE

1. Click **Medicines** in sidebar
2. Click **➕ Add Medicine** button
3. Fill:
   - **Medicine Name** (required) — e.g. Paracetamol 500mg
   - **Salt/Generic Name** — e.g. Paracetamol
   - **Category** — Tablet / Capsule / Syrup etc.
   - **Manufacturer** — e.g. Cipla Ltd
   - **Batch Number** (required) — e.g. CPL2401
   - **Box Number** — e.g. BX-001
   - **Expiry Date** — select month/year
   - **MRP** — selling price
   - **PTR** — price to retailer
   - **GST %** — 0/5/12/18
   - **Stock Qty** — current stock
   - **Reorder Level** — alert threshold
4. Click **💾 Save Medicine**

## ✏️ HOW TO UPDATE MEDICINE

1. Go to **Medicines** page
2. Find medicine in table
3. Click **✏️ Edit** button
4. Change fields → Click **Save Medicine**

## 🗑️ HOW TO DELETE MEDICINE

1. Go to **Medicines** page
2. Click **🗑️** button next to medicine
3. Confirm deletion

---

## 🧾 HOW TO CREATE A BILL

1. Click **New Bill** in sidebar
2. Fill patient name, phone, doctor name, doctor reg no
3. In **Add Medicine** section:
   - Type medicine name → select from dropdown
   - Batch/Box/Expiry auto-fills
   - Enter Quantity
   - Enter Discount % (if any)
   - Click **➕ Add to Bill**
4. Add more medicines as needed
5. Add Extra Discount % if needed (bill-level)
6. Select Payment Mode (Cash/UPI/Card/Credit/Insurance/Online)
7. Click **🖨️ Save & Print Bill**

---

## 🖨️ BILL FORMAT
Bill looks exactly like Apollo Pharmacy:
- Shop header with address, GST, Drug Licence
- Bill No, Date, Time, Terminal
- Patient name, Doctor, Reg No
- Item-wise: Batch, Box No, Expiry, Qty, MRP, Disc%, CGST, SGST, Amount
- Net Total with GST breakup
- Pharmacist signature area
- "WISH U SPEEDY RECOVERY" footer

---

## ⚠️ EXPIRY ALERTS

Automatic alerts trigger at:
- 🔴 **Expired** — remove immediately
- 🔴 **1 Month** — urgent action needed
- 🟠 **3 Months** — return to supplier
- 🟡 **6 Months** — use first / monitor

Go to **Expiry Manager** for full list.
Go to **Alerts & Reminders** for grouped alerts.

---

## 🔔 MONTHLY CUSTOMER REMINDERS

1. Add customer, tick "Monthly Customer" checkbox
2. System tracks their last bill date
3. After 25 days, reminder appears in **Alerts & Reminders**
4. Copy the SMS message and send via WhatsApp to customer

---

## 🗄️ WHERE IS DATA STORED?

All data is stored in **IndexedDB** on your device:

**To view in Chrome:**
1. Press F12 → DevTools
2. Click **Application** tab
3. Left panel → **IndexedDB → VijayaPMSv3**

**Tables:**
| Table | Contents |
|-------|----------|
| medicines | All medicine stock with batch/box/expiry |
| bills | All billing records |
| suppliers | Supplier master |
| customers | Customer master |
| settings | Shop configuration |

---

## 🔒 DATA SECURITY

| Feature | Status |
|---------|--------|
| Login protection | ✅ Email + Password required |
| Auto-logout | ✅ After 8 hours |
| Wrong password | ✅ Access denied |
| Data encryption | Browser IndexedDB (no cloud) |
| Backup | ✅ JSON download button |

**To stay safe:**
- Never clear Chrome browsing data
- Download backup weekly: click **💾 Backup** in topbar
- Use only on trusted device

---

## 💼 SELLING THIS SOFTWARE

**Pricing suggestion:**
- Basic Package: ₹3,000–5,000
- With Training: ₹8,000–12,000
- With Annual Support: ₹15,000

**What to customize per pharmacy:**
- Change shop name/address in login.html and index.html
- Change email/password in login.html
- Change GST number and Drug Licence

---

## 📋 FILE STRUCTURE

```
vijaya-pms-v3/
├── login.html        ← OPEN THIS FIRST
├── index.html        ← Main software
├── css/
│   └── style.css     ← All styling
├── js/
│   ├── db.js         ← Database layer
│   └── app.js        ← All app logic
└── README.md         ← This file
```
