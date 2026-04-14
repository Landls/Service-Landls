let clients = JSON.parse(localStorage.getItem('tibia_clients') || '[]');
let addFormOpen = false;

function save() {
  localStorage.setItem('tibia_clients', JSON.stringify(clients));
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return fmt(mon) + ' — ' + fmt(sun);
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(el => el.classList.toggle('active', el.dataset.tab === tab));
  document.querySelectorAll('.panel').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  if (tab === 'client') { renderSelector(); renderClientView(); }
}

function toggleAddForm() {
  addFormOpen = !addFormOpen;
  const form = document.getElementById('add-form');
  const icon = document.getElementById('add-toggle-icon');
  form.classList.toggle('collapsed', !addFormOpen);
  icon.textContent = addFormOpen ? '✕' : '+';
}

function addClient() {
  const name = document.getElementById('f-client').value.trim();
  const char = document.getElementById('f-char').value.trim();
  const lvlStart = parseInt(document.getElementById('f-lvl-start').value) || 0;
  const lvlNow = parseInt(document.getElementById('f-lvl-now').value) || 0;
  const hours = parseFloat(document.getElementById('f-hours').value) || 0;
  const rate = parseFloat(document.getElementById('f-rate').value) || 0;

  if (!name || !char) { toast('⚠ Preencha nome e personagem.'); return; }

  clients.push({ id: Date.now(), name, char, lvlStart, lvlNow, hours, rate });
  save();
  renderClients();

  ['f-client','f-char','f-lvl-start','f-lvl-now','f-hours','f-rate'].forEach(id => {
    document.getElementById(id).value = '';
  });

  toggleAddForm();
  toast('✓ Cliente adicionado!');
}

function deleteClient(id) {
  if (!confirm('Remover este cliente?')) return;
  clients = clients.filter(c => c.id !== id);
  save();
  renderClients();
  renderSelector();
  document.getElementById('client-view').innerHTML = '';
  toast('Cliente removido.');
}

function updateField(id, field, val) {
  const c = clients.find(c => c.id === id);
  if (!c) return;
  if (['lvlStart', 'lvlNow'].includes(field)) c[field] = parseInt(val) || 0;
  else if (['hours', 'rate'].includes(field)) c[field] = parseFloat(val) || 0;
  else c[field] = val;
  save();
  renderMetrics(id);
}

function renderMetrics(id) {
  const c = clients.find(c => c.id === id);
  if (!c) return;
  const lvls = c.lvlNow - c.lvlStart;
  const total = (c.hours * c.rate).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const el = document.getElementById('metrics-' + id);
  if (!el) return;

  el.querySelector('.m-hours').textContent = c.hours + 'h';
  el.querySelector('.m-lvls').textContent = (lvls > 0 ? '+' : '') + lvls;
  el.querySelector('.m-total').textContent = 'R$ ' + total;
}

function copyFechamento(id) {
  const c = clients.find(c => c.id === id);
  if (!c) return;
  const total = (c.hours * c.rate).toFixed(2).replace('.', ',');
  const rate = c.rate.toFixed(2).replace('.', ',');
  const lvls = c.lvlNow - c.lvlStart;

  const txt =
`⚔️ Fechamento Semanal — ${getWeekRange()}
━━━━━━━━━━━━━━━━━━━━━━
Personagem: ${c.char}
━━━━━━━━━━━━━━━━━━━━━━
🕐 Total de horas caçadas: ${c.hours}h
📈 Levels upados: ${lvls > 0 ? '+' + lvls : lvls} (${c.lvlStart} → ${c.lvlNow})
💰 Valor por hora: R$ ${rate}
💵 Total a pagar: R$ ${total}
━━━━━━━━━━━━━━━━━━━━━━
🔑 PIX: dd319af3-da68-4f30-b90b-8511f06ad34d
━━━━━━━━━━━━━━━━━━━━━━
Obrigado pela confiança! 🐉`;

  navigator.clipboard.writeText(txt)
    .then(() => toast('✓ Fechamento copiado!'))
    .catch(() => toast('Erro ao copiar.'));
}

function renderClients() {
  const list = document.getElementById('clients-list');
  const count = document.getElementById('client-count');
  count.textContent = clients.length + (clients.length === 1 ? ' cliente' : ' clientes');

  if (!clients.length) {
    list.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">⚔</span>
        <p>Nenhum cliente ainda.</p>
        <p>Clique em "Novo cliente" para começar.</p>
      </div>`;
    return;
  }

  list.innerHTML = clients.map(c => {
    const lvls = c.lvlNow - c.lvlStart;
    const total = (c.hours * c.rate).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return `
    <div class="client-card">
      <div class="card-header">
        <div class="card-identity">
          <p class="card-name">${c.name}</p>
          <p class="card-char">${c.char}</p>
        </div>
        <div class="card-actions">
          <button class="btn-copy" onclick="copyFechamento(${c.id})">⎘ Copiar fechamento</button>
          <button class="btn-danger" onclick="deleteClient(${c.id})">✕</button>
        </div>
      </div>

      <div class="metrics-row" id="metrics-${c.id}">
        <div class="metric">
          <p class="metric-label">Horas caçadas</p>
          <p class="metric-value m-hours">${c.hours}h</p>
        </div>
        <div class="metric">
          <p class="metric-label">Levels upados</p>
          <p class="metric-value accent m-lvls">${lvls > 0 ? '+' : ''}${lvls}</p>
        </div>
        <div class="metric">
          <p class="metric-label">Total a receber</p>
          <p class="metric-value green m-total">R$ ${total}</p>
        </div>
      </div>

      <hr class="card-divider" />

      <div class="card-fields">
        <div class="form-group">
          <label>Level inicial</label>
          <input type="number" value="${c.lvlStart}" onchange="updateField(${c.id},'lvlStart',this.value)" />
        </div>
        <div class="form-group">
          <label>Level atual</label>
          <input type="number" value="${c.lvlNow}" onchange="updateField(${c.id},'lvlNow',this.value)" />
        </div>
        <div class="form-group">
          <label>Horas caçadas</label>
          <input type="number" step="0.5" value="${c.hours}" onchange="updateField(${c.id},'hours',this.value)" />
        </div>
        <div class="form-group">
          <label>Valor/hora (R$)</label>
          <input type="number" value="${c.rate}" onchange="updateField(${c.id},'rate',this.value)" />
        </div>
      </div>
    </div>`;
  }).join('');
}

function renderSelector() {
  const sel = document.getElementById('client-selector');
  const cur = sel.value;
  sel.innerHTML = '<option value="">— Selecionar cliente —</option>' +
    clients.map(c => `<option value="${c.id}" ${c.id == cur ? 'selected' : ''}>${c.name} — ${c.char}</option>`).join('');
}

function renderClientView() {
  const id = parseInt(document.getElementById('client-selector').value);
  const view = document.getElementById('client-view');
  if (!id) { view.innerHTML = ''; return; }

  const c = clients.find(x => x.id === id);
  if (!c) { view.innerHTML = ''; return; }

  const total = (c.hours * c.rate).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const lvls = c.lvlNow - c.lvlStart;
  const initials = c.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  view.innerHTML = `
    <div class="cv-card">
      <div class="cv-header">
        <div class="cv-avatar">${initials}</div>
        <div>
          <p class="cv-name">${c.name}</p>
          <p class="cv-char">${c.char}</p>
        </div>
        <div class="cv-week">${getWeekRange()}</div>
      </div>

      <div class="cv-metrics">
        <div class="cv-metric">
          <p class="cv-metric-label">Horas caçadas</p>
          <p class="cv-metric-value">${c.hours}h</p>
        </div>
        <div class="cv-metric">
          <p class="cv-metric-label">Levels upados</p>
          <p class="cv-metric-value" style="color:var(--accent)">${lvls > 0 ? '+' : ''}${lvls}</p>
        </div>
        <div class="cv-metric">
          <p class="cv-metric-label">Valor por hora</p>
          <p class="cv-metric-value">R$&nbsp;${c.rate.toFixed(2).replace('.', ',')}</p>
        </div>
      </div>

      <div class="cv-rows">
        <div class="cv-row">
          <span class="cv-key">Personagem</span>
          <span class="cv-val">${c.char}</span>
        </div>
        <div class="cv-row">
          <span class="cv-key">Level inicial</span>
          <span class="cv-val">${c.lvlStart}</span>
        </div>
        <div class="cv-row">
          <span class="cv-key">Level final</span>
          <span class="cv-val">${c.lvlNow}</span>
        </div>
        <div class="cv-row">
          <span class="cv-key">Levels upados</span>
          <span class="cv-val" style="color:var(--accent)">${lvls > 0 ? '+' : ''}${lvls}</span>
        </div>
        <div class="cv-row">
          <span class="cv-key">Horas caçadas</span>
          <span class="cv-val">${c.hours}h</span>
        </div>
      </div>

      <div class="cv-total">
        <span class="cv-total-label">Total a pagar</span>
        <span class="cv-total-value">R$ ${total}</span>
      </div>
    </div>`;
}

// Init
document.getElementById('week-chip').textContent = getWeekRange();
renderClients();
