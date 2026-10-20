/* ============================================================
   Family Strategic Reserve App
   Progressive stock management for household of 6
   WhatsApp infrastructure ready — sending disabled until API key provided
   ============================================================ */

const DEFAULT_ITEMS = [
  { id: 'maize', name: 'Dry Maize (for milling)', unit: 'kg', target: 92, category: 'staple' },
  { id: 'rice', name: 'Rice', unit: 'kg', target: 36, category: 'staple' },
  { id: 'beans', name: 'Beans', unit: 'kg', target: 18, category: 'staple' },
  { id: 'dengu', name: 'Dengu (Green Grams)', unit: 'kg', target: 12, category: 'staple' },
  { id: 'sugar', name: 'Sugar', unit: 'kg', target: 15, category: 'staple' },
  { id: 'oil', name: 'Cooking Oil', unit: 'L', target: 13.5, category: 'staple' },
  { id: 'wheat', name: 'Wheat Flour / Pasta / Spaghetti', unit: 'kg', target: 18, category: 'staple' },
  { id: 'tea', name: 'Tea Leaves', unit: 'kg', target: 3.6, category: 'staple' },
  { id: 'salt', name: 'Salt', unit: 'kg', target: 3, category: 'staple' },
  { id: 'soap_powder', name: 'Powdered Soap / Detergent', unit: 'kg', target: 7.5, category: 'nonfood' },
  { id: 'soap_bar', name: 'Bathing Soap', unit: 'bars', target: 24, category: 'nonfood' },
  { id: 'toilet_paper', name: 'Toilet Paper', unit: 'rolls', target: 36, category: 'nonfood' },
  { id: 'lpg', name: 'LPG Cylinders (full reserve)', unit: 'cylinders', target: 1, category: 'energy' }
];

// ---------- Storage helpers ----------
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------- State ----------
let items = load('sr_items', DEFAULT_ITEMS);
let transactions = load('sr_transactions', []);
let settings = load('sr_settings', {
  waApiKey: '',
  waPhone: '',
  waEnabled: false
});

// ---------- Status logic ----------
function getStatus(current, target) {
  if (target <= 0) return { level: 'green', label: 'OK', pct: 100 };
  const pct = Math.min(100, Math.round((current / target) * 100));
  if (pct >= 150) return { level: 'green', label: 'Strong', pct };
  if (pct >= 100) return { level: 'green', label: 'On Target', pct };
  if (pct >= 75) return { level: 'yellow', label: 'Watch', pct };      // ~2.25–3 months
  if (pct >= 50) return { level: 'orange', label: 'Low', pct };        // ~1.5–2.25 months
  return { level: 'red', label: 'Critical', pct };                     // < 1.5 months
}

function getCurrentStock(itemId) {
  return transactions
    .filter(t => t.itemId === itemId)
    .reduce((sum, t) => sum + (t.type === 'in' ? t.qty : -t.qty), 0);
}

// ---------- WhatsApp infrastructure (sending disabled) ----------
function prepareWhatsAppMessage(item, status, current) {
  const msg = `⚠️ Strategic Reserve Alert\n\nItem: ${item.name}\nStatus: ${status.label.toUpperCase()}\nCurrent: ${current.toFixed(1)} ${item.unit}\nTarget (3-mo): ${item.target} ${item.unit}\n\nAction needed to protect the family buffer.`;
  return msg;
}

function sendAlert(item, status, current) {
  const message = prepareWhatsAppMessage(item, status, current);
  // Always log locally
  console.log('[ALERT]', message);
  showToast(`Alert prepared: ${item.name} is ${status.label}`, 'success');

  // Infrastructure ready — actual send only when enabled + key present
  if (settings.waEnabled && settings.waApiKey && settings.waPhone) {
    // PLACEHOLDER for future WhatsApp Business API / Twilio / Meta Cloud API
    // Example:
    // fetch('https://graph.facebook.com/v18.0/PHONE_NUMBER_ID/messages', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${settings.waApiKey}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     messaging_product: 'whatsapp',
    //     to: settings.waPhone,
    //     type: 'text',
    //     text: { body: message }
    //   })
    // });
    console.log('[WhatsApp] Would send to', settings.waPhone, '— sending currently disabled');
  } else {
    console.log('[WhatsApp] Sending disabled or credentials missing. Message logged only.');
  }
}

function checkAllAlerts() {
  items.forEach(item => {
    const current = getCurrentStock(item.id);
    const status = getStatus(current, item.target);
    if (status.level === 'red' || status.level === 'orange') {
      // Only fire once per session per item to avoid spam (simple flag)
      const key = `alerted_${item.id}_${status.level}`;
      if (!sessionStorage.getItem(key)) {
        sendAlert(item, status, current);
        sessionStorage.setItem(key, '1');
      }
    }
  });
}

// ---------- UI Rendering ----------
function renderSummary() {
  const cards = document.getElementById('summary-cards');
  let critical = 0, low = 0, ok = 0;
  items.forEach(item => {
    const current = getCurrentStock(item.id);
    const status = getStatus(current, item.target);
    if (status.level === 'red') critical++;
    else if (status.level === 'orange' || status.level === 'yellow') low++;
    else ok++;
  });
  cards.innerHTML = `
    <div class="summary-card red"><div class="value">${critical}</div><div class="label">Critical</div></div>
    <div class="summary-card yellow"><div class="value">${low}</div><div class="label">Watch / Low</div></div>
    <div class="summary-card green"><div class="value">${ok}</div><div class="label">On Target</div></div>
  `;
}

function renderStockList() {
  const list = document.getElementById('stock-list');
  list.innerHTML = items.map(item => {
    const current = Math.max(0, getCurrentStock(item.id));
    const status = getStatus(current, item.target);
    const pct = Math.min(100, status.pct);
    return `
      <div class="stock-item ${status.level}">
        <div class="stock-header">
          <div class="stock-name">${item.name}</div>
          <span class="stock-status ${status.level}">${status.label}</span>
        </div>
        <div class="stock-numbers">
          <span class="stock-current">${current.toFixed(1)} ${item.unit}</span>
          <span class="stock-target">Target: ${item.target} ${item.unit}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${status.level}" style="width:${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

function populateSelects() {
  const inSelect = document.getElementById('in-item');
  const outSelect = document.getElementById('out-item');
  const histFilter = document.getElementById('history-filter');
  const options = items.map(i => `<option value="${i.id}">${i.name}</option>`).join('');
  inSelect.innerHTML = options;
  outSelect.innerHTML = options;
  histFilter.innerHTML = `<option value="all">All Items</option>` + options;

  // Unit updates
  function updateUnit(selectId, unitId) {
    const item = items.find(i => i.id === document.getElementById(selectId).value);
    if (item) document.getElementById(unitId).textContent = item.unit;
  }
  inSelect.onchange = () => updateUnit('in-item', 'in-unit');
  outSelect.onchange = () => updateUnit('out-item', 'out-unit');
  updateUnit('in-item', 'in-unit');
  updateUnit('out-item', 'out-unit');
}

function renderHistory() {
  const filter = document.getElementById('history-filter').value;
  const list = document.getElementById('history-list');
  let rows = [...transactions].reverse();
  if (filter !== 'all') rows = rows.filter(t => t.itemId === filter);

  if (rows.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:#6B7280;padding:2rem;">No transactions yet</p>';
    return;
  }

  list.innerHTML = rows.map(t => {
    const item = items.find(i => i.id === t.itemId);
    const name = item ? item.name : t.itemId;
    const typeClass = t.type === 'in' ? 'type-in' : 'type-out';
    const sign = t.type === 'in' ? '+' : '−';
    return `
      <div class="history-item">
        <div>
          <span class="${typeClass}">${t.type === 'in' ? 'IN' : 'OUT'}</span>
          ${name}: ${sign}${t.qty} ${item ? item.unit : ''}
        </div>
        <div class="history-meta">${t.date}${t.notes ? ' • ' + t.notes : ''}</div>
      </div>
    `;
  }).join('');
}

function renderTargetsEditor() {
  const editor = document.getElementById('targets-editor');
  editor.innerHTML = items.map(item => `
    <div class="target-row">
      <label>${item.name}</label>
      <input type="number" step="0.1" min="0" data-id="${item.id}" value="${item.target}">
      <span style="font-size:0.8rem;color:#6B7280;min-width:2.5rem;">${item.unit}</span>
    </div>
  `).join('');
}

function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast ' + type;
  setTimeout(() => toast.classList.add('hidden'), 2800);
}

// ---------- Event handlers ----------
function initDates() {
  const today = new Date().toISOString().slice(0, 10);
  document.getElementById('in-date').value = today;
  document.getElementById('out-date').value = today;
}

document.getElementById('form-incoming').addEventListener('submit', e => {
  e.preventDefault();
  const itemId = document.getElementById('in-item').value;
  const qty = parseFloat(document.getElementById('in-qty').value);
  const date = document.getElementById('in-date').value;
  const notes = document.getElementById('in-notes').value.trim();

  if (qty <= 0) return showToast('Quantity must be positive', 'error');

  transactions.push({
    id: Date.now().toString(),
    type: 'in',
    itemId,
    qty,
    date,
    notes,
    createdAt: new Date().toISOString()
  });
  save('sr_transactions', transactions);

  document.getElementById('in-qty').value = '';
  document.getElementById('in-notes').value = '';
  showToast('Stock added successfully', 'success');
  refreshAll();
  checkAllAlerts();
});

document.getElementById('form-withdraw').addEventListener('submit', e => {
  e.preventDefault();
  const itemId = document.getElementById('out-item').value;
  const qty = parseFloat(document.getElementById('out-qty').value);
  const date = document.getElementById('out-date').value;
  const notes = document.getElementById('out-notes').value.trim();

  if (qty <= 0) return showToast('Quantity must be positive', 'error');

  const current = getCurrentStock(itemId);
  if (qty > current + 0.01) {
    return showToast(`Only ${current.toFixed(1)} available. Cannot withdraw more.`, 'error');
  }

  transactions.push({
    id: Date.now().toString(),
    type: 'out',
    itemId,
    qty,
    date,
    notes,
    createdAt: new Date().toISOString()
  });
  save('sr_transactions', transactions);

  document.getElementById('out-qty').value = '';
  document.getElementById('out-notes').value = '';
  showToast('Withdrawal recorded', 'success');
  refreshAll();
  checkAllAlerts();
});

// Tabs
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'history') renderHistory();
  });
});

document.getElementById('history-filter').addEventListener('change', renderHistory);
document.getElementById('btn-refresh').addEventListener('click', refreshAll);

// Settings modal
document.getElementById('btn-settings').addEventListener('click', () => {
  renderTargetsEditor();
  document.getElementById('wa-api-key').value = settings.waApiKey || '';
  document.getElementById('wa-phone').value = settings.waPhone || '';
  document.getElementById('wa-enabled').checked = !!settings.waEnabled;
  document.getElementById('modal-settings').classList.remove('hidden');
});
document.getElementById('btn-close-settings').addEventListener('click', () => {
  document.getElementById('modal-settings').classList.add('hidden');
});
document.getElementById('btn-save-settings').addEventListener('click', () => {
  // Save targets
  document.querySelectorAll('#targets-editor input').forEach(input => {
    const id = input.dataset.id;
    const val = parseFloat(input.value);
    const item = items.find(i => i.id === id);
    if (item && !isNaN(val) && val >= 0) item.target = val;
  });
  save('sr_items', items);

  // Save WhatsApp settings
  settings.waApiKey = document.getElementById('wa-api-key').value.trim();
  settings.waPhone = document.getElementById('wa-phone').value.trim();
  settings.waEnabled = document.getElementById('wa-enabled').checked;
  save('sr_settings', settings);

  showToast('Settings saved', 'success');
  document.getElementById('modal-settings').classList.add('hidden');
  refreshAll();
});

document.getElementById('btn-test-alert').addEventListener('click', () => {
  const item = items[0];
  const current = getCurrentStock(item.id);
  const status = getStatus(current, item.target);
  sendAlert(item, status, current);
  showToast('Test alert logged to console (sending disabled)', 'success');
});

// ---------- Init ----------
function refreshAll() {
  renderSummary();
  renderStockList();
  populateSelects();
  renderHistory();
}

initDates();
refreshAll();
checkAllAlerts();

// Expose for debugging
window.SR = { items, transactions, settings, getCurrentStock, checkAllAlerts };

// Progressive Web App - Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registered', reg.scope))
      .catch(err => console.log('SW registration failed', err));
  });
}
