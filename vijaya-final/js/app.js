// ── Vijaya Medicals PMS v3 ── App Logic ──
let editId=null, billItems=[], billCount=1000, selPayMode='Cash';
const $=id=>document.getElementById(id);
const fmtDate=s=>{if(!s)return'—';const d=new Date(s);return d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})};
const fmtMoney=n=>'₹'+(+n||0).toFixed(2);
const today=()=>new Date().toISOString().split('T')[0];
const nowISO=()=>new Date().toISOString();

// ── NAVIGATION ──
function goto(page){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.ni').forEach(n=>n.classList.remove('active'));
  $('pg-'+page)?.classList.add('active');
  document.querySelector(`[data-p="${page}"]`)?.classList.add('active');
  const titles={dashboard:'Dashboard',medicines:'Medicine Inventory',billing:'New Bill',bills:'Bill History',suppliers:'Suppliers',customers:'Customers',expiry:'Expiry Manager',reports:'Reports',alerts:'Alerts & Reminders',downloads:'Downloads & PDF Reports',settings:'Settings'};
  $('page-ttl').textContent=titles[page]||page;
  closeSidebar();
  ({dashboard:loadDash,medicines:loadMeds,billing:initBill,bills:loadBills,suppliers:loadSups,customers:loadCusts,expiry:loadExpiry,reports:loadReports,alerts:loadAlerts,downloads:loadDownloads,settings:loadSettings}[page]||Function)();
}

// ── SIDEBAR MOBILE ──
function openSidebar(){$('sidebar').classList.add('open');$('sidebar-overlay').classList.add('open')}
function closeSidebar(){$('sidebar').classList.remove('open');$('sidebar-overlay').classList.remove('open')}

// ── TOAST ──
function toast(msg,type='ok'){
  const icons={ok:'✅',err:'❌',warn:'⚠️',info:'ℹ️'};
  const d=document.createElement('div');
  d.className=`toast ${type}`;
  d.innerHTML=`<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  $('toasts').appendChild(d);
  setTimeout(()=>d.remove(),3500);
}

// ── MODALS ──
function openModal(id){$(id).classList.add('open')}
function closeModal(id){$(id).classList.remove('open');editId=null}
document.addEventListener('click',e=>{if(e.target.classList.contains('overlay'))e.target.classList.remove('open')});

// ═══════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════
async function loadDash(){
  const[meds,bills,custs]=await Promise.all([dbAll('medicines'),dbAll('bills'),dbAll('customers')]);
  const td=today();
  const tdBills=bills.filter(b=>b.date===td);
  const rev=tdBills.reduce((s,b)=>s+(b.grandTotal||0),0);
  const expiring=meds.filter(m=>expiryStatus(m.expiry)!=='ok'&&expiryStatus(m.expiry)!=='unknown');
  const lowStock=meds.filter(m=>m.qty<=(m.reorderLevel||20));
  $('d-meds').textContent=meds.length;
  $('d-rev').textContent=fmtMoney(rev);
  $('d-bills').textContent=tdBills.length;
  $('d-exp').textContent=expiring.length;
  $('d-low').textContent=lowStock.length;
  // update nav badge
  const nb=$('nav-exp-nb');if(nb){nb.textContent=expiring.length;nb.style.display=expiring.length?'':'none';}
  // recent bills
  const rb=bills.sort((a,b)=>b.id-a.id).slice(0,7);
  $('d-bills-tb').innerHTML=rb.length?rb.map(b=>`<tr>
    <td><strong>${b.billNo}</strong></td><td>${b.customerName||'Walk-in'}</td>
    <td>${b.doctorName||'—'}</td><td>${fmtDate(b.date)}</td>
    <td><strong>${fmtMoney(b.grandTotal)}</strong></td>
    <td><span class="badge b-info">${b.payMode||'Cash'}</span></td>
    <td><button class="btn btn-xs btn-out" onclick="reprintBill(${b.id})">🖨️</button></td>
  </tr>`).join(''):`<tr><td colspan="7"><div class="empty"><div class="ei">🧾</div><p>No bills today</p></div></td></tr>`;
  // expiry preview
  $('d-exp-tb').innerHTML=expiring.slice(0,5).map(m=>`<tr class="${['expired','critical1'].includes(expiryStatus(m.expiry))?'tr-danger':'tr-warn'}">
    <td><strong>${m.name}</strong></td><td><code>${m.batchNo}</code></td>
    <td>${m.expiry}</td><td>${expiryBadge(m.expiry)}</td>
  </tr>`).join('')||`<tr><td colspan="4"><div class="empty"><p>🎉 No alerts</p></div></td></tr>`;
}

// ═══════════════════════════════════
// MEDICINES CRUD
// ═══════════════════════════════════
async function loadMeds(q=''){
  let meds=await dbAll('medicines');
  if(q){const s=q.toLowerCase();meds=meds.filter(m=>m.name?.toLowerCase().includes(s)||m.batchNo?.toLowerCase().includes(s)||m.boxNo?.toLowerCase().includes(s)||m.salt?.toLowerCase().includes(s)||m.manufacturer?.toLowerCase().includes(s))}
  $('med-cnt').textContent=meds.length+' items';
  $('med-tb').innerHTML=meds.length?meds.map(m=>{
    const es=expiryStatus(m.expiry);
    const rc=['expired','critical1'].includes(es)?'tr-danger':['critical3','warning6'].includes(es)?'tr-warn':'';
    const sk=m.qty<=0?'<span class="badge b-err">Out</span>':m.qty<=(m.reorderLevel||20)?'<span class="badge b-amb">Low</span>':'<span class="badge b-ok">OK</span>';
    return`<tr class="${rc}">
      <td><strong>${m.name}</strong><br><small style="color:var(--txt3)">${m.salt||''}</small></td>
      <td><span class="tag">${m.category||'—'}</span></td>
      <td>${m.manufacturer||'—'}</td>
      <td><code>${m.batchNo||'—'}</code></td>
      <td><code>${m.boxNo||'—'}</code></td>
      <td>${m.expiry||'—'} ${expiryBadge(m.expiry)}</td>
      <td>${fmtMoney(m.mrp)}</td>
      <td>${fmtMoney(m.ptr)}</td>
      <td>${m.qty} ${m.unit||''} ${sk}</td>
      <td>${m.gst||0}%</td>
      <td><span class="badge ${m.prescription?'b-err':'b-tl'}">${m.schedule||'OTC'}</span></td>
      <td><div style="display:flex;gap:4px">
        <button class="btn btn-xs btn-out" onclick="editMed(${m.id})">✏️ Edit</button>
        <button class="btn btn-xs btn-red" onclick="delMed(${m.id})">🗑️</button>
      </div></td>
    </tr>`;
  }).join(''):`<tr><td colspan="12"><div class="empty"><div class="ei">💊</div><p>No medicines found. <a href="#" onclick="openAddMed()">Add one now</a></p></div></td></tr>`;
}

function openAddMed(){editId=null;$('med-form').reset();$('med-modal-ttl').textContent='➕ Add New Medicine';openModal('med-modal')}
async function editMed(id){
  editId=id;const m=await dbGet('medicines',id);if(!m)return;
  $('med-modal-ttl').textContent='✏️ Edit Medicine';
  ['name','salt','category','manufacturer','supplier','batchNo','boxNo','hsnCode','mrp','ptr','pts','gst','qty','reorderLevel','unit','expiry','rack','schedule'].forEach(f=>{const e=$('mf-'+f);if(e)e.value=m[f]??''});
  $('mf-prescription').checked=m.prescription||false;
  openModal('med-modal');
}
async function saveMed(){
  const fs=['name','salt','category','manufacturer','supplier','batchNo','boxNo','hsnCode','mrp','ptr','pts','gst','qty','reorderLevel','unit','expiry','rack','schedule'];
  const data={};
  for(const f of fs){const e=$('mf-'+f);if(e)data[f]=['mrp','ptr','pts','gst','qty','reorderLevel'].includes(f)?parseFloat(e.value)||0:e.value}
  data.prescription=$('mf-prescription').checked;
  data.cgst=(data.gst/2);data.sgst=(data.gst/2);
  if(!data.name)return toast('Medicine name required','err');
  if(!data.batchNo)return toast('Batch number required','err');
  if(editId){data.id=editId;await dbPut('medicines',data);toast('Medicine updated ✓')}
  else{data.createdAt=nowISO();await dbAdd('medicines',data);toast('Medicine added ✓')}
  closeModal('med-modal');loadMeds();loadDash();
}
async function delMed(id){
  if(!confirm('⚠️ Delete this medicine? This cannot be undone.'))return;
  await dbDel('medicines',id);toast('Medicine deleted','warn');loadMeds();
}

// ═══════════════════════════════════
// BILLING
// ═══════════════════════════════════
async function initBill(){
  billItems=[];renderItems();calcBill();
  $('bf-no').value='VM-'+(++billCount);
  $('bf-date').value=today();
  $('bf-time').value=new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  selPayMode='Cash';
  document.querySelectorAll('.pb').forEach(b=>b.classList.toggle('sel',b.dataset.mode==='Cash'));
}

let _sTimeout;
async function searchMed(){
  clearTimeout(_sTimeout);
  _sTimeout=setTimeout(async()=>{
    const q=($('bf-msearch').value||'').trim().toLowerCase();
    const dd=$('bf-mdd');
    if(!q){dd.style.display='none';return}
    const all=await dbAll('medicines');
    const res=all.filter(m=>m.name?.toLowerCase().includes(q)||m.batchNo?.toLowerCase().includes(q)||m.salt?.toLowerCase().includes(q));
    if(!res.length){dd.style.display='none';return}
    dd.style.display='block';
    dd.innerHTML=res.slice(0,8).map(m=>`
      <div onclick="pickMed(${m.id})" style="padding:9px 13px;cursor:pointer;border-bottom:1px solid #eee;transition:.1s" onmouseenter="this.style.background='#EEF2F7'" onmouseleave="this.style.background='#fff'">
        <strong style="font-size:12px">${m.name}</strong>${m.prescription?'<span class="badge b-err" style="margin-left:6px;font-size:9px">Rx</span>':''}
        <br><span style="font-size:10px;color:#666">${m.batchNo} | Box:${m.boxNo||'—'} | Exp:${m.expiry} | MRP:${fmtMoney(m.mrp)} | Stock:${m.qty} ${m.unit}</span>
      </div>`).join('');
  },200);
}

async function pickMed(id){
  const m=await dbGet('medicines',id);if(!m)return;
  $('bf-msearch').value=m.name;$('bf-mdd').style.display='none';
  $('bf-medid').value=m.id;$('bf-batch').value=m.batchNo;
  $('bf-boxno').value=m.boxNo||'';$('bf-expiry').value=m.expiry||'';
  $('bf-mrp').value=m.mrp;$('bf-gst').value=m.gst||12;
  $('bf-qty').value=1;$('bf-disc').value=0;$('bf-qty').focus();
}

function addItem(){
  const name=($('bf-msearch').value||'').trim();
  const medId=parseInt($('bf-medid').value)||0;
  const batch=($('bf-batch').value||'').trim();
  const boxno=($('bf-boxno').value||'').trim();
  const expiry=($('bf-expiry').value||'').trim();
  const mrp=parseFloat($('bf-mrp').value)||0;
  const qty=parseInt($('bf-qty').value)||1;
  const disc=parseFloat($('bf-disc').value)||0;
  const gst=parseFloat($('bf-gst').value)||0;
  if(!name||mrp<=0)return toast('Select medicine and enter price','err');
  const gross=mrp*qty, discAmt=gross*disc/100, taxable=gross-discAmt;
  const cgst=(taxable*gst/2)/100, sgst=(taxable*gst/2)/100, gstAmt=taxable*gst/100;
  const total=taxable+gstAmt;
  billItems.push({medId,name,batch,boxno,expiry,mrp,qty,disc,discAmt,gst,cgst,sgst,gstAmt,total});
  renderItems();calcBill();
  ['bf-msearch','bf-medid','bf-batch','bf-boxno','bf-expiry','bf-mrp','bf-qty','bf-disc','bf-gst'].forEach(id=>{const e=$(id);if(e)e.value=''});
  $('bf-msearch').focus();
}

function removeItem(i){billItems.splice(i,1);renderItems();calcBill()}

function renderItems(){
  $('bf-items').innerHTML=billItems.length?billItems.map((it,i)=>`<tr>
    <td><strong>${it.name}</strong></td><td><code>${it.batch}</code></td>
    <td><code>${it.boxno||'—'}</code></td><td>${it.expiry||'—'}</td>
    <td>${fmtMoney(it.mrp)}</td><td>${it.qty}</td><td>${it.disc||0}%</td>
    <td>${it.gst}%</td><td>${fmtMoney(it.discAmt)}</td>
    <td>${fmtMoney(it.cgst)}</td><td>${fmtMoney(it.sgst)}</td>
    <td><strong>${fmtMoney(it.total)}</strong></td>
    <td><button class="btn btn-xs btn-red" onclick="removeItem(${i})">✕</button></td>
  </tr>`).join(''):`<tr><td colspan="13" style="text-align:center;padding:18px;color:var(--txt3)">Add medicines to this bill</td></tr>`;
}

function calcBill(){
  const gross=billItems.reduce((s,i)=>s+i.mrp*i.qty,0);
  const disc=billItems.reduce((s,i)=>s+i.discAmt,0);
  const cgst=billItems.reduce((s,i)=>s+i.cgst,0);
  const sgst=billItems.reduce((s,i)=>s+i.sgst,0);
  const gst=billItems.reduce((s,i)=>s+i.gstAmt,0);
  const net=billItems.reduce((s,i)=>s+i.total,0);
  const exDisc=parseFloat($('bf-xdisc')?.value)||0;
  const exDiscAmt=net*exDisc/100;
  const grand=Math.round(net-exDiscAmt);
  $('bs-gross').textContent=fmtMoney(gross);
  $('bs-disc').textContent=fmtMoney(disc);
  $('bs-cgst').textContent=fmtMoney(cgst);
  $('bs-sgst').textContent=fmtMoney(sgst);
  $('bs-gst').textContent=fmtMoney(gst);
  $('bs-xdisc').textContent=fmtMoney(exDiscAmt);
  $('bs-net').textContent=fmtMoney(grand);
  $('bs-cnt').textContent=billItems.length+' item(s)';
}

async function saveBill(print=true){
  if(!billItems.length)return toast('Add at least one medicine','err');
  const gross=billItems.reduce((s,i)=>s+i.mrp*i.qty,0);
  const disc=billItems.reduce((s,i)=>s+i.discAmt,0);
  const cgst=billItems.reduce((s,i)=>s+i.cgst,0);
  const sgst=billItems.reduce((s,i)=>s+i.sgst,0);
  const gst=billItems.reduce((s,i)=>s+i.gstAmt,0);
  const net=billItems.reduce((s,i)=>s+i.total,0);
  const exDisc=parseFloat($('bf-xdisc')?.value)||0;
  const exDiscAmt=net*exDisc/100;
  const grand=Math.round(net-exDiscAmt);
  const bill={
    billNo:$('bf-no').value,date:$('bf-date').value,time:$('bf-time').value,
    customerName:($('bf-cust').value||'').trim(),customerPhone:($('bf-phone').value||'').trim(),
    doctorName:($('bf-doctor').value||'').trim(),regNo:($('bf-regno').value||'').trim(),
    payMode:selPayMode,items:[...billItems],
    gross,disc,cgst,sgst,gst,exDisc,exDiscAmt,net,grandTotal:grand,createdAt:nowISO()
  };
  // deduct stock
  for(const it of billItems){
    if(it.medId){const med=await dbGet('medicines',it.medId);if(med){med.qty=Math.max(0,med.qty-it.qty);await dbPut('medicines',med)}}
  }
  // update customer last bill date
  const phone=($('bf-phone').value||'').trim();
  if(phone){
    const all=await dbAll('customers');
    const cust=all.find(c=>c.phone===phone);
    if(cust){cust.lastBillDate=today();await dbPut('customers',cust);}
  }
  await dbAdd('bills',bill);
  toast('Bill saved — '+bill.billNo);
  if(print)doPrint(bill);
  initBill();
}

async function reprintBill(id){const b=await dbGet('bills',id);if(b)doPrint(b)}

// ═══════════════════════════════════
// APOLLO-STYLE PRINT BILL
// ═══════════════════════════════════

async function loadBills(q=''){
  let bills=await dbAll('bills');
  bills=bills.sort((a,b)=>b.id-a.id);
  if(q){const s=q.toLowerCase();bills=bills.filter(b=>b.billNo?.toLowerCase().includes(s)||b.customerName?.toLowerCase().includes(s)||b.customerPhone?.includes(q))}
  const total=bills.reduce((s,b)=>s+(b.grandTotal||0),0);
  $('bills-info').textContent=`${bills.length} bills | Total: ${fmtMoney(total)}`;
  $('bills-tb').innerHTML=bills.length?bills.map(b=>`<tr>
    <td><strong>${b.billNo}</strong></td>
    <td>${fmtDate(b.date)} ${b.time||''}</td>
    <td>${b.customerName||'Walk-in'}</td>
    <td>${b.customerPhone||'—'}</td>
    <td>${b.doctorName||'—'}</td>
    <td>${b.items?.length||0}</td>
    <td><strong>${fmtMoney(b.grandTotal)}</strong></td>
    <td><span class="badge b-info">${b.payMode||'Cash'}</span></td>
    <td><div style="display:flex;gap:4px">
      <button class="btn btn-xs btn-out" onclick="reprintBill(${b.id})">🖨️</button>
      <button class="btn btn-xs btn-red" onclick="delBill(${b.id})">🗑️</button>
    </div></td>
  </tr>`).join(''):`<tr><td colspan="9"><div class="empty"><div class="ei">🧾</div><p>No bills</p></div></td></tr>`;
}
async function delBill(id){if(!confirm('Delete bill?'))return;await dbDel('bills',id);toast('Deleted','warn');loadBills()}

// ═══════════════════════════════════
// SUPPLIERS
// ═══════════════════════════════════
async function loadSups(q=''){
  let sups=await dbAll('suppliers');
  if(q){const s=q.toLowerCase();sups=sups.filter(x=>x.name?.toLowerCase().includes(s))}
  $('sup-tb').innerHTML=sups.length?sups.map(s=>`<tr>
    <td><strong>${s.name}</strong></td><td>${s.contact||'—'}</td>
    <td>${s.phone||'—'}</td><td>${s.email||'—'}</td>
    <td>${s.address||'—'}</td><td><code>${s.gstNo||'—'}</code></td>
    <td><code>${s.dlNo||'—'}</code></td>
    <td><div style="display:flex;gap:4px">
      <button class="btn btn-xs btn-out" onclick="editSup(${s.id})">✏️</button>
      <button class="btn btn-xs btn-red" onclick="delSup(${s.id})">🗑️</button>
    </div></td>
  </tr>`).join(''):`<tr><td colspan="8"><div class="empty"><div class="ei">🚚</div><p>No suppliers</p></div></td></tr>`;
}
function openAddSup(){editId=null;$('sup-form').reset();$('sup-modal-ttl').textContent='➕ Add Supplier';openModal('sup-modal')}
async function editSup(id){
  editId=id;const s=await dbGet('suppliers',id);if(!s)return;
  $('sup-modal-ttl').textContent='✏️ Edit Supplier';
  ['name','contact','phone','email','address','gstNo','dlNo'].forEach(f=>{const e=$('sf-'+f);if(e)e.value=s[f]||''});
  openModal('sup-modal');
}
async function saveSup(){
  const data={};['name','contact','phone','email','address','gstNo','dlNo'].forEach(f=>{const e=$('sf-'+f);if(e)data[f]=e.value});
  if(!data.name)return toast('Name required','err');
  if(editId){data.id=editId;await dbPut('suppliers',data);toast('Supplier updated')}
  else{data.createdAt=nowISO();await dbAdd('suppliers',data);toast('Supplier added')}
  closeModal('sup-modal');loadSups();
}
async function delSup(id){if(!confirm('Delete?'))return;await dbDel('suppliers',id);toast('Deleted','warn');loadSups()}

// ═══════════════════════════════════
// CUSTOMERS
// ═══════════════════════════════════
async function loadCusts(q=''){
  let custs=await dbAll('customers');
  if(q){const s=q.toLowerCase();custs=custs.filter(c=>c.name?.toLowerCase().includes(s)||c.phone?.includes(q))}
  $('cust-tb').innerHTML=custs.length?custs.map(c=>`<tr>
    <td><strong>${c.name}</strong></td><td>${c.phone||'—'}</td>
    <td>${c.address||'—'}</td><td>${c.age||'—'}</td>
    <td><span class="badge ${c.isMonthly?'b-info':'b-tl'}">${c.isMonthly?'Monthly':'Regular'}</span></td>
    <td>${c.lastBillDate?fmtDate(c.lastBillDate):'—'}</td>
    <td>${fmtDate(c.createdAt)}</td>
    <td><div style="display:flex;gap:4px">
      <button class="btn btn-xs btn-out" onclick="editCust(${c.id})">✏️</button>
      <button class="btn btn-xs btn-red" onclick="delCust(${c.id})">🗑️</button>
    </div></td>
  </tr>`).join(''):`<tr><td colspan="8"><div class="empty"><div class="ei">👤</div><p>No customers</p></div></td></tr>`;
}
function openAddCust(){editId=null;$('cust-form').reset();$('cust-modal-ttl').textContent='➕ Add Customer';openModal('cust-modal')}
async function editCust(id){
  editId=id;const c=await dbGet('customers',id);if(!c)return;
  $('cust-modal-ttl').textContent='✏️ Edit Customer';
  ['name','phone','address','age'].forEach(f=>{const e=$('cf-'+f);if(e)e.value=c[f]||''});
  $('cf-isMonthly').checked=c.isMonthly||false;
  openModal('cust-modal');
}
async function saveCust(){
  const data={};['name','phone','address','age'].forEach(f=>{const e=$('cf-'+f);if(e)data[f]=f==='age'?parseInt(e.value)||0:e.value});
  data.isMonthly=$('cf-isMonthly').checked;
  if(!data.name)return toast('Name required','err');
  if(editId){data.id=editId;await dbPut('customers',data);toast('Updated')}
  else{data.createdAt=nowISO();await dbAdd('customers',data);toast('Customer added')}
  closeModal('cust-modal');loadCusts();
}
async function delCust(id){if(!confirm('Delete?'))return;await dbDel('customers',id);toast('Deleted','warn');loadCusts()}

// ═══════════════════════════════════
// EXPIRY MANAGER
// ═══════════════════════════════════
async function loadExpiry(){
  const meds=await dbAll('medicines');
  const groups={expired:[],critical1:[],critical3:[],warning6:[]};
  meds.forEach(m=>{const s=expiryStatus(m.expiry);if(groups[s])groups[s].push(m)});
  $('exp-n-exp').textContent=groups.expired.length;
  $('exp-n-c1').textContent=groups.critical1.length;
  $('exp-n-c3').textContent=groups.critical3.length;
  $('exp-n-w6').textContent=groups.warning6.length;
  const all=[...groups.expired,...groups.critical1,...groups.critical3,...groups.warning6];
  $('exp-tb').innerHTML=all.length?all.map(m=>`<tr class="${['expired','critical1'].includes(expiryStatus(m.expiry))?'tr-danger':'tr-warn'}">
    <td><strong>${m.name}</strong><br><small>${m.salt||''}</small></td>
    <td>${m.manufacturer||'—'}</td><td><code>${m.batchNo}</code></td>
    <td><code>${m.boxNo||'—'}</code></td><td>${m.rack||'—'}</td>
    <td>${m.qty} ${m.unit||''}</td><td><strong>${m.expiry}</strong></td>
    <td>${expiryBadge(m.expiry)}</td>
    <td><button class="btn btn-xs btn-out" onclick="editMed(${m.id});goto('medicines')">Update</button></td>
  </tr>`).join(''):`<tr><td colspan="9"><div class="empty"><div class="ei">🎉</div><p>All medicines valid!</p></div></td></tr>`;
}

// ═══════════════════════════════════
// ALERTS & REMINDERS
// ═══════════════════════════════════
async function loadAlerts(){
  const[meds,custs]=await Promise.all([dbAll('medicines'),dbAll('customers')]);
  // expiry alerts
  const exp1=meds.filter(m=>expiryStatus(m.expiry)==='critical1');
  const exp3=meds.filter(m=>expiryStatus(m.expiry)==='critical3');
  const exp6=meds.filter(m=>expiryStatus(m.expiry)==='warning6');
  const expired=meds.filter(m=>expiryStatus(m.expiry)==='expired');

  let html='';
  if(expired.length)html+=`<div class="alert-box expired"><div class="ai">💀</div><div><div class="at" style="color:var(--red)">${expired.length} medicines EXPIRED</div><div class="as">${expired.map(m=>`${m.name} (${m.batchNo}) — Expired: ${m.expiry}`).join('<br>')}</div></div></div>`;
  if(exp1.length)html+=`<div class="alert-box expired"><div class="ai">🚨</div><div><div class="at" style="color:var(--red)">${exp1.length} medicines expiring within 1 MONTH</div><div class="as">${exp1.map(m=>`${m.name} (${m.batchNo}) — Exp: ${m.expiry} | Qty: ${m.qty}`).join('<br>')}</div></div></div>`;
  if(exp3.length)html+=`<div class="alert-box critical"><div class="ai">⚠️</div><div><div class="at" style="color:var(--amb)">${exp3.length} medicines expiring within 3 MONTHS</div><div class="as">${exp3.map(m=>`${m.name} (${m.batchNo}) — Exp: ${m.expiry} | Qty: ${m.qty}`).join('<br>')}</div></div></div>`;
  if(exp6.length)html+=`<div class="alert-box warning"><div class="ai">📅</div><div><div class="at" style="color:var(--ylw)">${exp6.length} medicines expiring within 6 MONTHS</div><div class="as">${exp6.map(m=>`${m.name} (${m.batchNo}) — Exp: ${m.expiry} | Qty: ${m.qty}`).join('<br>')}</div></div></div>`;
  if(!html)html=`<div class="alert-box warning" style="background:var(--grn-lt);border-color:#A5D6A7"><div class="ai">🎉</div><div><div class="at" style="color:var(--grn)">All medicines are within valid expiry!</div></div></div>`;
  $('exp-alerts').innerHTML=html;

  // monthly reminders
  const reminders=await checkMonthlyReminders();
  let rhtml='';
  if(reminders.length){
    rhtml=reminders.map(r=>`<div class="alert-box critical">
      <div class="ai">🔔</div>
      <div>
        <div class="at" style="color:var(--amb)">Monthly Reminder: ${r.customer.name}</div>
        <div class="as">Phone: ${r.customer.phone} | Last bill: ${r.customer.lastBillDate} (${r.days} days ago)</div>
        <div style="margin-top:6px;font-size:11px;background:white;padding:6px 10px;border-radius:6px;border:1px solid #FFE0B2">
          💬 SMS to send: "Dear ${r.customer.name}, your monthly medicines are due at Vijaya Medicals, Oddanchatram. Please visit or call 8973389393."
        </div>
      </div>
    </div>`).join('');
  } else {
    rhtml=`<div class="alert-box warning" style="background:var(--grn-lt);border-color:#A5D6A7"><div class="ai">✅</div><div><div class="at" style="color:var(--grn)">No monthly reminders due right now</div></div></div>`;
  }
  $('monthly-reminders').innerHTML=rhtml;
}

// ═══════════════════════════════════
// REPORTS
// ═══════════════════════════════════
async function loadReports(){
  const[meds,bills]=await Promise.all([dbAll('medicines'),dbAll('bills')]);
  const t=today(),tm=t.slice(0,7);
  const tB=bills.filter(b=>b.date===t);
  const mB=bills.filter(b=>b.date?.startsWith(tm));
  $('r-t-rev').textContent=fmtMoney(tB.reduce((s,b)=>s+(b.grandTotal||0),0));
  $('r-t-cnt').textContent=tB.length;
  $('r-m-rev').textContent=fmtMoney(mB.reduce((s,b)=>s+(b.grandTotal||0),0));
  $('r-m-cnt').textContent=mB.length;
  $('r-inv').textContent=fmtMoney(meds.reduce((s,m)=>s+(m.mrp||0)*(m.qty||0),0));
  $('r-sku').textContent=meds.length;
  $('r-gst').textContent=fmtMoney(mB.reduce((s,b)=>s+(b.gst||0),0));
  const cats={};meds.forEach(m=>cats[m.category||'Other']=(cats[m.category||'Other']||0)+1);
  $('r-cat').innerHTML=Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`
    <tr><td>${k}</td><td>${v}</td>
    <td><div class="prog-bar"><div class="prog-fill" style="width:${Math.min(100,(v/meds.length)*100).toFixed(0)}%"></div></div></td>
    </tr>`).join('');
}

// ═══════════════════════════════════
// SETTINGS
// ═══════════════════════════════════
async function loadSettings(){
  const fields=['shopName','address','phone','email','gst','dlNo','owner'];
  for(const f of fields){const val=await getSetting('s_'+f,'');const e=$('st-'+f);if(e)e.value=val}
}
async function saveSettings(){
  const fields=['shopName','address','phone','email','gst','dlNo','owner'];
  for(const f of fields){const e=$('st-'+f);if(e)await setSetting('s_'+f,e.value)}
  toast('Settings saved ✓');
}

// ── EXPORT JSON BACKUP ──
async function exportBackup(){
  const[meds,bills,sups,custs]=await Promise.all([dbAll('medicines'),dbAll('bills'),dbAll('suppliers'),dbAll('customers')]);
  const data={medicines:meds,bills,suppliers:sups,customers:custs,exportedAt:nowISO()};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download='vijaya-medicals-backup-'+today()+'.json';
  a.click();URL.revokeObjectURL(url);
  toast('Backup downloaded ✓');
}

// ── INIT ──
window.addEventListener('DOMContentLoaded',async()=>{
  checkAuth();
  await initDB();
  await seedData();
  $('tb-date').textContent=new Date().toLocaleDateString('en-IN',{weekday:'short',day:'2-digit',month:'short',year:'numeric'});
  goto('dashboard');
  // set pay mode handlers
  document.querySelectorAll('.pb').forEach(b=>b.addEventListener('click',()=>{
    selPayMode=b.dataset.mode;
    document.querySelectorAll('.pb').forEach(x=>x.classList.toggle('sel',x===b));
  }));
  // nav badge update
  async function updateNavBadge(){
    try{const meds=await dbAll('medicines');const cnt=meds.filter(m=>expiryStatus(m.expiry)!=='ok'&&expiryStatus(m.expiry)!=='unknown').length;const nb=$('nav-exp-nb');if(nb){nb.textContent=cnt;nb.style.display=cnt?'':'none';}}catch{}
  }
  updateNavBadge();setInterval(updateNavBadge,30000);
});

// ═══════════════════════════════════════════════
// DOWNLOADS & REPORTS PAGE
// ═══════════════════════════════════════════════
function applyQuickDate(val) {
  const today = new Date();
  const pad = n => String(n).padStart(2, '0');
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  let from, to;
  to = fmt(today);
  if (val === 'today') { from = to; }
  else if (val === 'yesterday') { const y = new Date(today); y.setDate(y.getDate()-1); from = to = fmt(y); }
  else if (val === 'week') { const w = new Date(today); w.setDate(w.getDate() - w.getDay()); from = fmt(w); }
  else if (val === 'month') { from = `${today.getFullYear()}-${pad(today.getMonth()+1)}-01`; }
  else if (val === 'lastmonth') { const lm = new Date(today.getFullYear(), today.getMonth()-1, 1); const lme = new Date(today.getFullYear(), today.getMonth(), 0); from = fmt(lm); to = fmt(lme); }
  else if (val === 'year') { from = `${today.getFullYear()}-01-01`; }
  else return;
  if ($('dl-from')) $('dl-from').value = from;
  if ($('dl-to')) $('dl-to').value = to;
  loadDownloadPreview();
}

async function loadDownloadPreview() {
  const from = $('dl-from')?.value || new Date().toISOString().split('T')[0];
  const to   = $('dl-to')?.value   || new Date().toISOString().split('T')[0];
  if (from > to) return toast('From date must be before To date', 'err');
  const allBills = await dbAll('bills');
  const allMeds  = await dbAll('medicines');
  const medMap = {};
  allMeds.forEach(m => { medMap[m.id] = m; });
  const bills = allBills.filter(b => b.date >= from && b.date <= to);
  let sales = 0, disc = 0, profit = 0;
  bills.forEach(b => {
    sales += b.grandTotal || 0;
    disc  += b.disc || 0;
    (b.items||[]).forEach(it => {
      const ptr = it.ptr || (medMap[it.medId] ? medMap[it.medId].ptr : 0) || 0;
      profit += calcProfit(it.mrp, ptr, it.qty, it.disc).gross;
    });
  });
  $('dl-preview').style.display = 'block';
  $('prev-sales').textContent = fmtMoney(sales);
  $('prev-profit').textContent = fmtMoney(profit);
  $('prev-disc').textContent = fmtMoney(disc);
  $('prev-bills').textContent = bills.length;
}

function getDlDates() {
  const from = $('dl-from')?.value || new Date().toISOString().split('T')[0];
  const to   = $('dl-to')?.value   || new Date().toISOString().split('T')[0];
  return { from, to };
}

async function dlSalesProfit() {
  const { from, to } = getDlDates();
  toast('Generating Sales & Profit PDF...', 'info');
  const html = await generateSalesProfitPDF(from, to);
  if (html) openPDFWindow(html, 'Sales & Profit');
}

async function dlStock() {
  toast('Generating Stock Report PDF...', 'info');
  const html = await generateStockPDF();
  if (html) openPDFWindow(html, 'Stock Report');
}

async function dlCustomers() {
  toast('Generating Customer Report PDF...', 'info');
  const html = await generateCustomerPDF();
  if (html) openPDFWindow(html, 'Customer Report');
}

async function dlFullReport() {
  const { from, to } = getDlDates();
  toast('Generating Complete Business Report...', 'info');
  const html = await generateFullReport(from, to);
  if (html) openPDFWindow(html, 'Full Business Report');
}

function emailSalesProfit() { const { from, to } = getDlDates(); sendReportByEmail('Sales & Profit Report', from, to); }
function emailStock()        { sendReportByEmail('Stock Report', new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0]); }
function emailCustomers()    { sendReportByEmail('Customer Report', new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0]); }
function emailFullReport()   { const { from, to } = getDlDates(); sendReportByEmail('Complete Business Report', from, to); }

// update goto to handle downloads page
const _origGoto = goto;
// extend navigation
document.addEventListener('DOMContentLoaded', () => {
  // init date fields to today
  const td = new Date().toISOString().split('T')[0];
  if ($('dl-from')) $('dl-from').value = td;
  if ($('dl-to'))   $('dl-to').value   = td;
});

function loadDownloads() {
  const td = new Date().toISOString().split('T')[0];
  if ($('dl-from') && !$('dl-from').value) $('dl-from').value = td;
  if ($('dl-to')   && !$('dl-to').value)   $('dl-to').value   = td;
  loadDownloadPreview();
}
