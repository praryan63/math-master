/* ============================================================
   SMALL UI HELPERS: text escape, toast, sheet, dialog
   ============================================================ */

function esc(s){
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* 12 -> "12"  0.75 -> "0.75"  0.1 -> "0.1" */
function fmtNum(v){
  if (Number.isInteger(v)) return String(v);
  return String(Number(v.toFixed(2)));
}

/* 42000 -> "0:42" */
function fmtClock(ms){
  const total = Math.max(0, Math.round(ms / 1000));
  return Math.floor(total / 60) + ':' + pad2(total % 60);
}

/* 4200 -> "4.2 s" */
function fmtSeconds(ms){
  if (!ms) return '--';
  return (Math.round(ms / 100) / 10).toFixed(1) + ' s';
}

/* ---------- TOAST ---------- */
let toastTimer = null;

function toast(msg){
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ el.classList.remove('show'); }, 1800);
}

/* ---------- BOTTOM SHEET ---------- */
let sheetIsOpen = false;

function openSheet(html, onMount){
  const sheet = document.getElementById('sheet');
  const backdrop = document.getElementById('sheet-backdrop');
  const body = document.getElementById('sheet-body');

  body.innerHTML = html;
  body.scrollTop = 0;
  sheet.classList.add('open');
  backdrop.classList.add('open');
  sheetIsOpen = true;

  if (onMount) onMount(body);
}

function closeSheet(){
  if (!sheetIsOpen) return;
  sheetIsOpen = false;
  document.getElementById('sheet').classList.remove('open');
  document.getElementById('sheet-backdrop').classList.remove('open');
}

/* ---------- DIALOG ---------- */
let dialogIsOpen = false;

function openDialog(title, text, actions){
  const dlg = document.getElementById('dialog');
  const backdrop = document.getElementById('dialog-backdrop');

  let html = '<h3>' + esc(title) + '</h3>';
  if (text) html += '<p>' + esc(text) + '</p>';
  html += '<div class="dialog-actions">';

  actions.forEach(function(a, i){
    html += '<button class="btn ' + (a.primary ? 'btn-primary' : 'btn-ghost') +
            '" data-act="' + i + '">' + esc(a.label) + '</button>';
  });
  html += '</div>';

  dlg.innerHTML = html;
  dlg.classList.add('open');
  backdrop.classList.add('open');
  dialogIsOpen = true;

  dlg.querySelectorAll('[data-act]').forEach(function(btn){
    btn.onclick = function(){
      const action = actions[Number(btn.getAttribute('data-act'))];
      closeDialog();
      if (action && typeof action.onClick === 'function') action.onClick();
    };
  });
}

function closeDialog(){
  if (!dialogIsOpen) return;
  dialogIsOpen = false;
  document.getElementById('dialog').classList.remove('open');
  document.getElementById('dialog-backdrop').classList.remove('open');
}

/* ---------- RADIO ROW BUILDER ---------- */
/* options: [{ value, label }]  attr: data attribute name */
function radioRows(options, current, attr){
  return options.map(function(o){
    const on = o.value === current;
    return '<button class="opt-row" data-' + attr + '="' + esc(o.value) + '">' +
             '<span class="opt-label">' + esc(o.label) + '</span>' +
             '<span class="radio' + (on ? ' on' : '') + '"></span>' +
           '</button>';
  }).join('');
}