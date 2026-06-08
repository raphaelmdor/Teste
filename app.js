'use strict';

/* ─── State ─── */
let taskCount = 0;
let planCount = 0;

/* ─── DOM refs ─── */
const form           = document.getElementById('report-form');
const tasksContainer = document.getElementById('tasks-container');
const plansContainer = document.getElementById('plans-container');
const previewPanel   = document.getElementById('preview-panel');
const previewContent = document.getElementById('preview-content');
const statusBadge    = document.getElementById('status-badge');
const hoursStart     = document.getElementById('hours-start');
const hoursEnd       = document.getElementById('hours-end');
const hoursTotal     = document.getElementById('hours-total');
const toast          = document.getElementById('toast');

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
  document.getElementById('btn-close-preview').addEventListener('click', closePreview);
  document.getElementById('btn-clear').addEventListener('click', clearForm);
  hoursStart.addEventListener('change', calcHours);
  hoursEnd.addEventListener('change', calcHours);

  document.getElementById('btn-save-toggle').addEventListener('click', e => {
    e.stopPropagation();
    toggleMenu('save-menu', 'btn-save-toggle');
  });
  document.getElementById('btn-save-preview-toggle').addEventListener('click', e => {
    e.stopPropagation();
    toggleMenu('save-menu-preview', 'btn-save-preview-toggle');
  });
  document.getElementById('save-menu').addEventListener('click', e => {
    const btn = e.target.closest('.save-option');
    if (btn) { closeAllMenus(); saveAs(btn.dataset.format); }
  });
  document.getElementById('save-menu-preview').addEventListener('click', e => {
    const btn = e.target.closest('.save-option');
    if (btn) { closeAllMenus(); saveAs(btn.dataset.format); }
  });
  document.addEventListener('click', closeAllMenus);
}

/* ─── Dropdown ─── */
function toggleMenu(menuId, toggleId) {
  const menu   = document.getElementById(menuId);
  const toggle = document.getElementById(toggleId);
  const isOpen = !menu.classList.contains('hidden');
  closeAllMenus();
  if (!isOpen) {
    menu.classList.remove('hidden');
    toggle.querySelector('.chevron-icon')?.classList.add('open');
  }
}

function closeAllMenus() {
  ['save-menu', 'save-menu-preview'].forEach(id => {
    document.getElementById(id)?.classList.add('hidden');
  });
  document.querySelectorAll('.chevron-icon').forEach(el => el.classList.remove('open'));
}

/* ─── Task rows ─── */
function addTask() {
  taskCount++;
  const row = document.createElement('div');
  row.className = 'task-row';
  row.dataset.id = taskCount;
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
    desc:   row.querySelector('.task-desc').value.trim(),
    hours:  row.querySelector('.task-hours').value || '—',
    status: row.querySelector('.status-select').value,
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
  if (!data.date)         { showToast('Informe a data do relatório.', 'error');      return false; }
  if (!data.name)         { showToast('Informe o nome do colaborador.', 'error');    return false; }
  if (!data.tasks.length) { showToast('Adicione ao menos uma tarefa realizada.', 'error'); return false; }
  return true;
}

/* ─── Helpers ─── */
function fmtDate(str) {
  if (!str) return '—';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

function makeFilename(data, ext) {
  const safeName = (data.name || 'relatorio').replace(/\s+/g, '_').toLowerCase();
  return `relatorio_${safeName}_${data.date.replace(/-/g, '')}.${ext}`;
}

const statusLabel = { done: 'Concluída', prog: 'Em andamento', blocked: 'Bloqueada' };
const statusClass = { done: 'status-done', prog: 'status-prog', blocked: 'status-blocked' };

/* ─── Build report HTML ─── */
function buildReportHTML(data, forExport = false) {
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
      ${data.hoursEnd   ? `<span><strong>Saída</strong>${data.hoursEnd}</span>`     : ''}
      ${data.hoursTotal ? `<span><strong>Total</strong>${data.hoursTotal}h</span>`  : ''}
    </div>` : '<p class="rp-empty">Não informado.</p>';

  const exportStyles = forExport ? `<style>
    *{box-sizing:border-box;margin:0;padding:0}
    body,div{font-family:Segoe UI,Calibri,Arial,sans-serif;font-size:11pt;color:#1e293b}
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
    .rp-list{list-style:none;padding:0}
    .rp-list li{padding:5px 0 5px 18px;position:relative;border-bottom:1px solid #f1f5f9;font-size:10pt}
    .rp-list li::before{content:"›";position:absolute;left:4px;color:#4F6EF7;font-weight:700}
    .rp-text{background:#f1f5f9;border-radius:7px;padding:10px 14px;white-space:pre-wrap;font-size:10pt}
    .rp-empty{color:#64748b;font-style:italic}
    .rp-hours{display:flex;gap:24px;padding:12px 16px;background:#f1f5f9;border-radius:8px}
    .rp-hours span strong{display:block;font-size:8pt;text-transform:uppercase;letter-spacing:.05em;color:#64748b}
    .rp-footer{margin-top:28px;padding-top:14px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:8pt;color:#64748b}
  </style>` : '';

  return `${exportStyles}
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
      ${data.blockers ? `<div class="rp-text">${escHtml(data.blockers)}</div>` : '<p class="rp-empty">Nenhum bloqueio reportado.</p>'}
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

/* ─── Save dispatcher ─── */
async function saveAs(format) {
  const data = collectData();
  if (!validate(data)) return;
  if (format === 'doc')  { await saveWord(data); return; }
  if (format === 'pdf')  { savePDF(data);  return; }
  if (format === 'png')  { await saveImage(data, 'png');  return; }
  if (format === 'jpeg') { await saveImage(data, 'jpeg'); return; }
}

/* ─── Word (.docx real) ─── */
async function saveWord(data) {
  if (typeof docx === 'undefined') {
    showToast('Biblioteca Word não carregada. Recarregue a página.', 'error');
    return;
  }

  const overlay = showLoading('Gerando documento Word…');

  try {
    const {
      Document, Paragraph, TextRun, Table, TableRow, TableCell,
      AlignmentType, WidthType, BorderStyle, ShadingType, Packer,
    } = docx;

    const PRIMARY  = '4F6EF7';
    const LIGHT_BG = 'F1F5F9';
    const MUTED    = '64748B';

    const sectionHead = text => new Paragraph({
      children: [new TextRun({ text: text.toUpperCase(), bold: true, color: PRIMARY, size: 20 })],
      spacing: { before: 300, after: 140 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: PRIMARY } },
    });

    const cell = (children, shade) => new TableCell({
      children,
      ...(shade ? { shading: { type: ShadingType.CLEAR, fill: shade } } : {}),
    });

    const metaFields = [
      ['DATA', fmtDate(data.date)],
      ['COLABORADOR', data.name],
      ...(data.department ? [['DEPARTAMENTO', data.department]] : []),
      ...(data.project    ? [['PROJETO', data.project]]          : []),
    ];

    const taskHeaderRow = new TableRow({
      tableHeader: true,
      children: [
        cell([new Paragraph({ children: [new TextRun({ text: 'DESCRIÇÃO', bold: true, color: PRIMARY, size: 18 })] })], 'EEF1FE'),
        cell([new Paragraph({ children: [new TextRun({ text: 'HORAS',     bold: true, color: PRIMARY, size: 18 })] })], 'EEF1FE'),
        cell([new Paragraph({ children: [new TextRun({ text: 'STATUS',    bold: true, color: PRIMARY, size: 18 })] })], 'EEF1FE'),
      ],
    });

    const taskRows = data.tasks.map(t => new TableRow({
      children: [
        cell([new Paragraph(t.desc)]),
        cell([new Paragraph({ children: [new TextRun(t.hours)], alignment: AlignmentType.CENTER })]),
        cell([new Paragraph(statusLabel[t.status])]),
      ],
    }));

    const children = [
      new Paragraph({
        children: [new TextRun({ text: 'Relatório de Atividades Diário', bold: true, color: PRIMARY, size: 48 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Gerado em ${new Date().toLocaleString('pt-BR')}`, color: MUTED, size: 18 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 360 },
      }),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [new TableRow({
          children: metaFields.map(([label, value]) => new TableCell({
            shading: { type: ShadingType.CLEAR, fill: LIGHT_BG },
            children: [
              new Paragraph({ children: [new TextRun({ text: label, bold: true, color: MUTED, size: 16 })] }),
              new Paragraph({ children: [new TextRun({ text: value || '—', size: 20 })] }),
            ],
          })),
        })],
      }),

      sectionHead('Tarefas Realizadas'),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [taskHeaderRow, ...taskRows],
      }),

      sectionHead('Problemas / Bloqueios'),
      new Paragraph({
        children: [new TextRun({
          text: data.blockers || 'Nenhum bloqueio reportado.',
          italics: !data.blockers,
          color: data.blockers ? undefined : MUTED,
        })],
        ...(data.blockers ? { shading: { type: ShadingType.CLEAR, fill: LIGHT_BG } } : {}),
      }),

      sectionHead('Plano para Amanhã'),
      ...(data.plans.length
        ? data.plans.map(p => new Paragraph({ children: [new TextRun(`› ${p}`)], spacing: { after: 80 } }))
        : [new Paragraph({ children: [new TextRun({ text: 'Nenhum item informado.', italics: true, color: MUTED })] })]),

      ...(data.notes ? [
        sectionHead('Observações Gerais'),
        new Paragraph({
          children: [new TextRun(data.notes)],
          shading: { type: ShadingType.CLEAR, fill: LIGHT_BG },
        }),
      ] : []),

      sectionHead('Horas Trabalhadas'),
      new Paragraph({
        children: [
          ...(data.hoursStart ? [new TextRun({ text: `Entrada: ${data.hoursStart}    `, bold: true })] : []),
          ...(data.hoursEnd   ? [new TextRun({ text: `Saída: ${data.hoursEnd}    `,    bold: true })] : []),
          ...(data.hoursTotal ? [new TextRun({ text: `Total: ${data.hoursTotal}h`,     bold: true })] : []),
          ...(!data.hoursStart && !data.hoursEnd
            ? [new TextRun({ text: 'Não informado.', italics: true, color: MUTED })] : []),
        ],
        shading: { type: ShadingType.CLEAR, fill: LIGHT_BG },
      }),

      new Paragraph({
        children: [new TextRun({ text: `${data.name} — ${fmtDate(data.date)}`, color: MUTED, size: 18 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 480 },
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' } },
      }),
    ];

    const document = new Document({ sections: [{ children }] });
    const blob     = await Packer.toBlob(document);

    hideLoading(overlay);
    shareOrDownload(blob, makeFilename(data, 'docx'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    markSaved();
  } catch (e) {
    hideLoading(overlay);
    console.error(e);
    showToast('Erro ao gerar documento Word.', 'error');
  }
}

/* ─── PDF ─── */
function savePDF(data) {
  const printArea = document.getElementById('print-area');
  printArea.innerHTML = buildReportHTML(data, true);
  window.print();
  setTimeout(() => { printArea.innerHTML = ''; }, 3000);
}

/* ─── Image PNG / JPEG ─── */
async function saveImage(data, format) {
  if (typeof html2canvas === 'undefined') {
    showToast('Biblioteca não carregada. Recarregue a página.', 'error');
    return;
  }

  const overlay = showLoading('Gerando imagem…');

  const container = document.createElement('div');
  container.style.cssText = 'position:absolute;left:-9999px;top:0;width:720px;background:#fff;';
  container.innerHTML = buildReportHTML(data, true);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const quality  = format === 'jpeg' ? 0.92 : undefined;
    const ext      = format === 'jpeg' ? 'jpg' : 'png';

    canvas.toBlob(blob => {
      hideLoading(overlay);
      shareOrDownload(blob, makeFilename(data, ext), mimeType);
      markSaved();
    }, mimeType, quality);

  } catch {
    hideLoading(overlay);
    showToast('Erro ao gerar imagem.', 'error');
  } finally {
    document.body.removeChild(container);
  }
}

/* ─── Share or Download ─── */
function shareOrDownload(blob, filename, mimeType) {
  const isIOS = /iP(ad|hone|od)/.test(navigator.userAgent);

  if (isIOS && navigator.share) {
    const file = new File([blob], filename, { type: mimeType });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: 'Relatório Diário' })
        .then(() => { markSaved(); showToast('Compartilhado com sucesso!', 'success'); })
        .catch(err => { if (err.name !== 'AbortError') showToast('Erro ao compartilhar.', 'error'); });
      return;
    }
  }

  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
  markSaved();
  showToast('Arquivo salvo com sucesso!', 'success');
}

function markSaved() {
  statusBadge.textContent = 'Salvo';
  statusBadge.classList.add('saved');
}

/* ─── Loading overlay ─── */
function showLoading(msg) {
  const el = document.createElement('div');
  el.className = 'loading-overlay';
  el.innerHTML = `<div class="loading-spinner"><div class="spinner"></div><span>${msg}</span></div>`;
  document.body.appendChild(el);
  return el;
}

function hideLoading(el) {
  if (el?.parentNode) el.parentNode.removeChild(el);
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
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
