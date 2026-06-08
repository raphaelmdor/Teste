'use strict';

/* ─── State ─── */
let taskCount = 0;
let planCount = 0;

/* ─── DOM refs ─── */
const form            = document.getElementById('report-form');
const tasksContainer  = document.getElementById('tasks-container');
const plansContainer  = document.getElementById('plans-container');
const formPanel       = document.getElementById('form-panel');
const previewPanel    = document.getElementById('preview-panel');
const previewContent  = document.getElementById('preview-content');
const statusBadge     = document.getElementById('status-badge');
const hoursStart      = document.getElementById('hours-start');
const hoursEnd        = document.getElementById('hours-end');
const hoursTotal      = document.getElementById('hours-total');
const toast           = document.getElementById('toast');

/* ─── Init ─── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('date').valueAsDate = new Date();
  addTask();
  addPlan();
  bindEvents();
});

function bindEvents() {
  document.getElementById('btn-add-task').addEventListener('click', addTask);
  document.getElementById('btn-add-plan').addEventListener('click', addPlan);
  document.getElementById('btn-preview').addEventListener('click', showPreview);
  document.getElementById('btn-save').addEventListener('click', saveDoc);
  document.getElementById('btn-save-from-preview').addEventListener('click', saveDoc);
  document.getElementById('btn-close-preview').addEventListener('click', closePreview);
  document.getElementById('btn-clear').addEventListener('click', clearForm);
  hoursStart.addEventListener('change', calcHours);
  hoursEnd.addEventListener('change', calcHours);
}

/* ─── Task rows ─── */
function addTask() {
  taskCount++;
  const id = taskCount;
  const row = document.createElement('div');
  row.className = 'task-row';
  row.dataset.id = id;
  row.innerHTML = `
    <input type="text" class="task-desc" placeholder="Descrição da tarefa…" />
    <input type="number" class="task-hours" min="0" max="24" step="0.5" placeholder="h" title="Horas dedicadas" />
    <select class="status-select">
      <option value="done">Concluída</option>
      <option value="prog">Em andamento</option>
      <option value="blocked">Bloqueada</option>
    </select>
    <button type="button" class="btn-remove" title="Remover" onclick="removeRow(this)">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>`;
  tasksContainer.appendChild(row);
}

function addPlan() {
  planCount++;
  const row = document.createElement('div');
  row.className = 'plan-row';
  row.innerHTML = `
    <input type="text" placeholder="Descreva a atividade planejada…" />
    <button type="button" class="btn-remove" title="Remover" onclick="removeRow(this)">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>`;
  plansContainer.appendChild(row);
}

function removeRow(btn) {
  const row = btn.closest('.task-row, .plan-row');
  row.style.opacity = '0';
  row.style.transition = 'opacity .15s';
  setTimeout(() => row.remove(), 150);
}

/* ─── Hours calc ─── */
function calcHours() {
  if (!hoursStart.value || !hoursEnd.value) { hoursTotal.value = ''; return; }
  const [sh, sm] = hoursStart.value.split(':').map(Number);
  const [eh, em] = hoursEnd.value.split(':').map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  hoursTotal.value = (diff / 60).toFixed(1);
}

/* ─── Collect data ─── */
function collectData() {
  const tasks = [...tasksContainer.querySelectorAll('.task-row')].map(row => ({
    desc:    row.querySelector('.task-desc').value.trim(),
    hours:   row.querySelector('.task-hours').value || '—',
    status:  row.querySelector('.status-select').value,
  })).filter(t => t.desc);

  const plans = [...plansContainer.querySelectorAll('.plan-row input')]
    .map(i => i.value.trim()).filter(Boolean);

  return {
    date:       document.getElementById('date').value,
    name:       document.getElementById('name').value.trim(),
    department: document.getElementById('department').value.trim(),
    project:    document.getElementById('project').value.trim(),
    blockers:   document.getElementById('blockers').value.trim(),
    notes:      document.getElementById('notes').value.trim(),
    hoursStart: hoursStart.value,
    hoursEnd:   hoursEnd.value,
    hoursTotal: hoursTotal.value,
    tasks,
    plans,
  };
}

/* ─── Validate ─── */
function validate(data) {
  if (!data.date) { showToast('Informe a data do relatório.', 'error'); return false; }
  if (!data.name) { showToast('Informe o nome do colaborador.', 'error'); return false; }
  if (!data.tasks.length) { showToast('Adicione ao menos uma tarefa realizada.', 'error'); return false; }
  return true;
}

/* ─── Format helpers ─── */
function fmtDate(str) {
  if (!str) return '—';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

const statusLabel = { done: 'Concluída', prog: 'Em andamento', blocked: 'Bloqueada' };
const statusClass = { done: 'status-done', prog: 'status-prog', blocked: 'status-blocked' };

/* ─── Build HTML report ─── */
function buildReportHTML(data, forDoc = false) {
  const now = new Date().toLocaleString('pt-BR');

  const tasksRows = data.tasks.map(t => `
    <tr>
      <td>${escHtml(t.desc)}</td>
      <td style="text-align:center">${escHtml(t.hours)}</td>
      <td><span class="status-chip ${statusClass[t.status]}">${statusLabel[t.status]}</span></td>
    </tr>`).join('');

  const planItems = data.plans.length
    ? data.plans.map(p => `<li>${escHtml(p)}</li>`).join('')
    : '<li class="rp-empty">Nenhum item informado.</li>';

  const hoursBlock = (data.hoursStart || data.hoursEnd || data.hoursTotal) ? `
    <div class="rp-hours">
      ${data.hoursStart ? `<span><strong>Entrada</strong>${data.hoursStart}</span>` : ''}
      ${data.hoursEnd   ? `<span><strong>Saída</strong>${data.hoursEnd}</span>`   : ''}
      ${data.hoursTotal ? `<span><strong>Total</strong>${data.hoursTotal}h</span>` : ''}
    </div>` : '<p class="rp-empty">Não informado.</p>';

  const docStyles = forDoc ? `<style>
    body{font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#1e293b;margin:0;padding:0}
    .report-preview{max-width:700px;margin:0 auto;padding:32px 40px}
    .rp-header{text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #4F6EF7}
    .rp-header h1{font-size:16pt;color:#4F6EF7;margin-bottom:4px}
    .rp-header p{color:#64748b;font-size:9pt}
    .rp-meta{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;margin-bottom:20px;padding:14px 16px;background:#f1f5f9;border-radius:8px}
    .rp-meta-item strong{display:block;font-size:8pt;text-transform:uppercase;letter-spacing:.05em;color:#64748b;margin-bottom:1px}
    .rp-section{margin-bottom:20px}
    .rp-section h2{font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#4F6EF7;margin-bottom:10px;padding-bottom:5px;border-bottom:1px solid #eef1fe}
    .rp-task-table{width:100%;border-collapse:collapse;font-size:10pt}
    .rp-task-table th{background:#eef1fe;color:#4F6EF7;text-align:left;padding:6px 10px;font-size:8pt;font-weight:700;text-transform:uppercase}
    .rp-task-table td{padding:7px 10px;border-bottom:1px solid #e2e8f0}
    .status-chip{display:inline-block;padding:2px 8px;border-radius:99px;font-size:8pt;font-weight:600}
    .status-done{background:#dcfce7;color:#166534}
    .status-prog{background:#dbeafe;color:#1d4ed8}
    .status-blocked{background:#fee2e2;color:#991b1b}
    .rp-list{list-style:none;margin:0;padding:0}
    .rp-list li{padding:5px 0 5px 18px;position:relative;border-bottom:1px solid #f1f5f9}
    .rp-list li::before{content:"›";position:absolute;left:4px;color:#4F6EF7;font-weight:700}
    .rp-text{background:#f1f5f9;border-radius:7px;padding:10px 14px;white-space:pre-wrap}
    .rp-empty{color:#64748b;font-style:italic}
    .rp-hours{display:flex;gap:24px;padding:12px 16px;background:#f1f5f9;border-radius:8px}
    .rp-hours span strong{display:block;font-size:8pt;text-transform:uppercase;letter-spacing:.05em;color:#64748b}
    .rp-footer{margin-top:28px;padding-top:14px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:8pt;color:#64748b}
  </style>` : '';

  return `${docStyles}
  <div class="report-preview">
    <div class="rp-header">
      <h1>Relatório de Atividades Diário</h1>
      <p>Gerado em ${now}</p>
    </div>

    <div class="rp-meta">
      <div class="rp-meta-item"><strong>Data</strong>${fmtDate(data.date)}</div>
      <div class="rp-meta-item"><strong>Colaborador</strong>${escHtml(data.name) || '—'}</div>
      ${data.department ? `<div class="rp-meta-item"><strong>Departamento</strong>${escHtml(data.department)}</div>` : ''}
      ${data.project    ? `<div class="rp-meta-item"><strong>Projeto / Cliente</strong>${escHtml(data.project)}</div>` : ''}
    </div>

    <div class="rp-section">
      <h2>Tarefas Realizadas</h2>
      <table class="rp-task-table">
        <thead><tr><th>Descrição</th><th>Horas</th><th>Status</th></tr></thead>
        <tbody>${tasksRows}</tbody>
      </table>
    </div>

    <div class="rp-section">
      <h2>Problemas / Bloqueios</h2>
      ${data.blockers
        ? `<div class="rp-text">${escHtml(data.blockers)}</div>`
        : '<p class="rp-empty">Nenhum bloqueio reportado.</p>'}
    </div>

    <div class="rp-section">
      <h2>Plano para Amanhã</h2>
      <ul class="rp-list">${planItems}</ul>
    </div>

    ${data.notes ? `
    <div class="rp-section">
      <h2>Observações Gerais</h2>
      <div class="rp-text">${escHtml(data.notes)}</div>
    </div>` : ''}

    <div class="rp-section">
      <h2>Horas Trabalhadas</h2>
      ${hoursBlock}
    </div>

    <div class="rp-footer">
      <span>${escHtml(data.name)} — ${fmtDate(data.date)}</span>
      <span>Relatório Diário</span>
    </div>
  </div>`;
}

/* ─── Preview ─── */
function showPreview() {
  const data = collectData();
  if (!validate(data)) return;
  previewContent.innerHTML = buildReportHTML(data, false);
  previewPanel.classList.remove('hidden');
  previewPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closePreview() {
  previewPanel.classList.add('hidden');
}

/* ─── Save .doc ─── */
function saveDoc() {
  const data = collectData();
  if (!validate(data)) return;

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8"/>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <!--[if gte mso 9]>
  <xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml>
  <![endif]-->
  <title>Relatório Diário — ${fmtDate(data.date)}</title>
</head>
<body>${buildReportHTML(data, true)}</body>
</html>`;

  const blob = new Blob(['﻿' + html], {
    type: 'application/msword;charset=utf-8'
  });

  const safeName = (data.name || 'relatorio').replace(/\s+/g, '_').toLowerCase();
  const dateStr  = data.date.replace(/-/g, '');
  const filename = `relatorio_${safeName}_${dateStr}.doc`;

  const isIOS = /iP(ad|hone|od)/.test(navigator.userAgent);

  if (isIOS && navigator.share) {
    const file = new File([blob], filename, { type: 'application/msword' });
    const canShare = navigator.canShare && navigator.canShare({ files: [file] });

    if (canShare) {
      navigator.share({ files: [file], title: 'Relatório Diário' })
        .then(() => {
          statusBadge.textContent = 'Salvo';
          statusBadge.classList.add('saved');
          showToast('Relatório compartilhado!', 'success');
        })
        .catch(err => { if (err.name !== 'AbortError') showToast('Erro ao compartilhar.', 'error'); });
      return;
    }

    // Fallback iOS: abre em nova aba para salvar manualmente
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    showToast('Use o botão Compartilhar do Safari para salvar.', 'success');
    return;
  }

  // Desktop: download padrão
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href    = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);

  statusBadge.textContent = 'Salvo';
  statusBadge.classList.add('saved');
  showToast('Relatório salvo com sucesso!', 'success');
}

/* ─── Clear ─── */
function clearForm() {
  if (!confirm('Limpar todos os dados do formulário?')) return;
  form.reset();
  document.getElementById('date').valueAsDate = new Date();
  tasksContainer.innerHTML = '';
  plansContainer.innerHTML = '';
  taskCount = 0;
  planCount = 0;
  addTask();
  addPlan();
  closePreview();
  statusBadge.textContent = 'Rascunho';
  statusBadge.classList.remove('saved');
  showToast('Formulário limpo.');
}

/* ─── Toast ─── */
function showToast(msg, type = '') {
  toast.textContent = msg;
  toast.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.className = 'toast'; }, 3200);
}

/* ─── Escape HTML ─── */
function escHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
