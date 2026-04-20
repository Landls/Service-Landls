let clients = JSON.parse(localStorage.getItem('tibia_clients') || '[]');
let planilha = JSON.parse(localStorage.getItem('tibia_planilha') || '[]');
let addFormOpen = false;
let addRowOpen = false;

function save() {
  localStorage.setItem('tibia_clients', JSON.stringify(clients));
}

function savePlanilha() {
  localStorage.setItem('tibia_planilha', JSON.stringify(planilha));
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
  if (tab === 'planilha') renderPlanilha();
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
  refreshMetrics(id);
}

function refreshMetrics(id) {
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
    <div class="client-card" data-id="${c.id}">
      <div class="card-header">
        <div class="card-identity">
          <p class="card-name">${c.name}</p>
          <p class="card-char">${c.char}</p>
        </div>
        <div class="card-actions">
          <button class="btn-copy" data-action="copy" data-id="${c.id}">⎘ Copiar fechamento</button>
          <button class="btn-danger" data-action="delete" data-id="${c.id}">✕</button>
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
          <input type="number" data-field="lvlStart" data-id="${c.id}" value="${c.lvlStart}" />
        </div>
        <div class="form-group">
          <label>Level atual</label>
          <input type="number" data-field="lvlNow" data-id="${c.id}" value="${c.lvlNow}" />
        </div>
        <div class="form-group">
          <label>Horas caçadas</label>
          <input type="number" step="0.5" data-field="hours" data-id="${c.id}" value="${c.hours}" />
        </div>
        <div class="form-group">
          <label>Valor/hora (R$)</label>
          <input type="number" data-field="rate" data-id="${c.id}" value="${c.rate}" />
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

// ─── PLANILHA ────────────────────────────────────────────

function rcToReais(rc) {
  // 1 RC = R$ 0,09 (valor aproximado de mercado — ajustável)
  return rc * 0.09;
}

function toggleAddRow() {
  addRowOpen = !addRowOpen;
  document.getElementById('add-row-form').style.display = addRowOpen ? 'block' : 'none';
  document.getElementById('btn-add-row').textContent = addRowOpen ? '✕ Fechar' : '+ Nova entrada';
}

function addPlanilhaRow() {
  const cliente = document.getElementById('p-cliente').value.trim();
  const horas = parseFloat(document.getElementById('p-horas').value) || 0;
  const minutos = parseInt(document.getElementById('p-minutos').value) || 0;
  const custoHora = parseFloat(document.getElementById('p-custo').value) || 0;
  const rc = parseInt(document.getElementById('p-rc').value) || 0;
  const obs = document.getElementById('p-obs').value.trim();

  if (!cliente) { toast('⚠ Informe o nome do cliente.'); return; }

  const totalHoras = horas + minutos / 60;
  const totalReais = totalHoras * custoHora;

  planilha.push({ id: Date.now(), cliente, horas, minutos, custoHora, rc, obs, totalReais });
  savePlanilha();
  renderPlanilha();

  ['p-cliente','p-horas','p-minutos','p-custo','p-rc','p-obs'].forEach(id => {
    document.getElementById(id).value = '';
  });

  toggleAddRow();
  toast('✓ Entrada adicionada!');
}

function deletePlanilhaRow(id) {
  planilha = planilha.filter(r => r.id !== id);
  savePlanilha();
  renderPlanilha();
  toast('Entrada removida.');
}

function updatePlanilhaField(id, field, val) {
  const row = planilha.find(r => r.id === id);
  if (!row) return;
  if (['horas', 'custoHora'].includes(field)) row[field] = parseFloat(val) || 0;
  else if (['minutos', 'rc'].includes(field)) row[field] = parseInt(val) || 0;
  else row[field] = val;

  const totalHoras = row.horas + row.minutos / 60;
  row.totalReais = totalHoras * row.custoHora;
  savePlanilha();
  refreshPlanilhaRow(id);
}

function refreshPlanilhaRow(id) {
  const row = planilha.find(r => r.id === id);
  if (!row) return;
  const el = document.getElementById('pr-' + id);
  if (!el) return;
  const totalHoras = row.horas + row.minutos / 60;
  el.querySelector('.pr-total-reais').textContent = 'R$ ' + row.totalReais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  el.querySelector('.pr-total-rc').textContent = row.rc > 0 ? row.rc.toLocaleString('pt-BR') + ' RC' : '—';
  el.querySelector('.pr-hm').textContent = formatHM(row.horas, row.minutos);
  refreshPlanilhaTotals();
}

function formatHM(h, m) {
  if (!h && !m) return '—';
  if (h && m) return h + 'h ' + m + 'min';
  if (h) return h + 'h';
  return m + 'min';
}

function refreshPlanilhaTotals() {
  const totalR = planilha.reduce((s, r) => s + r.totalReais, 0);
  const totalRC = planilha.reduce((s, r) => s + r.rc, 0);
  const totalH = planilha.reduce((s, r) => s + r.horas + r.minutos / 60, 0);
  const hh = Math.floor(totalH);
  const mm = Math.round((totalH - hh) * 60);

  const el = document.getElementById('planilha-totals');
  if (!el) return;
  el.querySelector('.pt-horas').textContent = formatHM(hh, mm);
  el.querySelector('.pt-reais').textContent = 'R$ ' + totalR.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  el.querySelector('.pt-rc').textContent = totalRC > 0 ? totalRC.toLocaleString('pt-BR') + ' RC' : '—';
}

function renderPlanilha() {
  const wrap = document.getElementById('planilha-wrap');

  const totalR = planilha.reduce((s, r) => s + r.totalReais, 0);
  const totalRC = planilha.reduce((s, r) => s + r.rc, 0);
  const totalH = planilha.reduce((s, r) => s + r.horas + r.minutos / 60, 0);
  const hh = Math.floor(totalH);
  const mm = Math.round((totalH - hh) * 60);

  if (!planilha.length) {
    wrap.innerHTML = '<div class="empty-state"><span class="empty-icon">📋</span><p>Nenhuma entrada ainda.</p><p>Clique em "+ Nova entrada" para começar.</p></div>';
    return;
  }

  wrap.innerHTML = `
    <div class="pl-table-wrap">
      <table class="pl-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Horas / Min</th>
            <th>Custo/hora</th>
            <th>Total (R$)</th>
            <th>Total (RC)</th>
            <th>Obs</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${planilha.map(r => `
            <tr id="pr-${r.id}">
              <td><input class="pl-input" data-pl-field="cliente" data-pl-id="${r.id}" value="${r.cliente}" /></td>
              <td>
                <div style="display:flex;gap:4px;align-items:center">
                  <input class="pl-input pl-input-sm" type="number" min="0" data-pl-field="horas" data-pl-id="${r.id}" value="${r.horas}" placeholder="h" />
                  <span style="color:var(--text-3);font-size:11px">h</span>
                  <input class="pl-input pl-input-sm" type="number" min="0" max="59" data-pl-field="minutos" data-pl-id="${r.id}" value="${r.minutos || ''}" placeholder="min" />
                  <span style="color:var(--text-3);font-size:11px">min</span>
                </div>
                <span class="pr-hm" style="font-size:11px;color:var(--text-3)">${formatHM(r.horas, r.minutos)}</span>
              </td>
              <td><input class="pl-input pl-input-sm" type="number" step="0.5" data-pl-field="custoHora" data-pl-id="${r.id}" value="${r.custoHora}" /></td>
              <td><span class="pr-total-reais green" style="font-family:monospace;font-weight:700">R$ ${r.totalReais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></td>
              <td><input class="pl-input pl-input-sm" type="number" data-pl-field="rc" data-pl-id="${r.id}" value="${r.rc || ''}" placeholder="0" /><span class="pr-total-rc" style="font-size:11px;color:var(--text-3);display:block">${r.rc > 0 ? r.rc.toLocaleString('pt-BR') + ' RC' : '—'}</span></td>
              <td><input class="pl-input" data-pl-field="obs" data-pl-id="${r.id}" value="${r.obs || ''}" placeholder="—" /></td>
              <td><button class="btn-danger" data-pl-action="delete" data-pl-id="${r.id}">✕</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="pl-totals" id="planilha-totals">
      <div class="pl-total-item">
        <span class="pl-total-label">Total de horas</span>
        <span class="pl-total-val pt-horas">${formatHM(hh, mm)}</span>
      </div>
      <div class="pl-total-item">
        <span class="pl-total-label">Total a receber (R$)</span>
        <span class="pl-total-val green pt-reais">R$ ${totalR.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div class="pl-total-item">
        <span class="pl-total-label">Total em RC</span>
        <span class="pl-total-val accent pt-rc">${totalRC > 0 ? totalRC.toLocaleString('pt-BR') + ' RC' : '—'}</span>
      </div>
    </div>`;
}

// ─── EVENT DELEGATION ────────────────────────────────────

document.addEventListener('click', function(e) {
  // Admin tab
  const btn = e.target.closest('[data-action]');
  if (btn) {
    const id = parseInt(btn.dataset.id);
    if (btn.dataset.action === 'copy') copyFechamento(id);
    if (btn.dataset.action === 'delete') deleteClient(id);
  }
  // Planilha tab
  const plBtn = e.target.closest('[data-pl-action]');
  if (plBtn) {
    const id = parseInt(plBtn.dataset.plId);
    if (plBtn.dataset.plAction === 'delete') deletePlanilhaRow(id);
  }
});

document.addEventListener('change', function(e) {
  // Admin fields
  const input = e.target.closest('input[data-field]');
  if (input) {
    updateField(parseInt(input.dataset.id), input.dataset.field, input.value);
  }
  // Planilha fields
  const plInput = e.target.closest('[data-pl-field]');
  if (plInput) {
    updatePlanilhaField(parseInt(plInput.dataset.plId), plInput.dataset.plField, plInput.value);
  }
});

// Init
document.getElementById('week-chip').textContent = getWeekRange();
renderClients();
