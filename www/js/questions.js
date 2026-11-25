/* ============================================================
   TOPICS and QUESTION GENERATORS
   Every generator returns: { q: "text", a: number, label: "..." }
   ============================================================ */

const TOPIC_LIST = [
  {
    id: 'basics', name: 'Basics', sub: '4 types', icon: 'plus',
    types: [
      { id: 'add', name: 'Addition' },
      { id: 'sub', name: 'Subtraction' },
      { id: 'mul', name: 'Multiplication' },
      { id: 'div', name: 'Division' }
    ]
  },
  {
    id: 'tables', name: 'Tables', sub: '1 to 50', icon: 'multiply', tablePicker: true,
    types: [ { id: 'table', name: 'Times table' } ]
  },
  {
    id: 'combined', name: 'Combined', sub: '3 types', icon: 'plus-minus',
    types: [
      { id: 'ops', name: 'Order of operations' },
      { id: 'mix', name: 'Mixed operators' },
      { id: 'bracket', name: 'Brackets' }
    ]
  },
  {
    id: 'advanced', name: 'Advanced', sub: 'Roots, powers', icon: 'square-root',
    types: [
      { id: 'sqrt', name: 'Square roots' },
      { id: 'square', name: 'Squares' },
      { id: 'cube', name: 'Cubes' },
      { id: 'power', name: 'Powers' }
    ]
  },
  {
    id: 'percent', name: 'Percentage & Fraction', sub: '3 types', icon: 'percent',
    types: [
      { id: 'pct', name: 'Percent of number' },
      { id: 'f2p', name: 'Fraction to percent' },
      { id: 'fadd', name: 'Fraction addition' }
    ]
  },
  {
    id: 'game', name: 'Game Modes', sub: 'Custom, Memory', icon: 'target',
    types: [
      { id: 'custom', name: 'Custom' },
      { id: 'memory', name: 'Memory' }
    ]
  },
  {
    id: 'mistakes', name: 'Mistakes Practice', sub: 'Review your wrong answers', icon: 'exclamation',
    types: []
  }
];

function getTopic(id){
  for (let i = 0; i < TOPIC_LIST.length; i++){
    if (TOPIC_LIST[i].id === id) return TOPIC_LIST[i];
  }
  return null;
}

/* ---- random helpers ---- */
function rnd(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

const SUP = { 0:'\u2070', 1:'\u00b9', 2:'\u00b2', 3:'\u00b3', 4:'\u2074', 5:'\u2075', 6:'\u2076', 7:'\u2077', 8:'\u2078', 9:'\u2079' };

function supNum(n){ return String(n).split('').map(function(c){ return SUP[c] || c; }).join(''); }

/* number ranges per difficulty */
const RANGE = {
  add: { easy: [2, 50], medium: [10, 200], hard: [100, 2000] },
  sub: { easy: [2, 50], medium: [10, 200], hard: [100, 2000] },
  mul: { easy: [2, 9],  medium: [2, 12],  hard: [2, 20] }
};

/* ---------- BASICS ---------- */
function genAdd(d){
  const r = RANGE.add[d];
  const a = rnd(r[0], r[1]);
  const b = rnd(r[0], r[1]);
  return { q: a + ' + ' + b, a: a + b, label: 'Find the value' };
}

function genSub(d){
  const r = RANGE.sub[d];
  let a = rnd(r[0], r[1]);
  let b = rnd(r[0], r[1]);
  if (a < b){ const t = a; a = b; b = t; }
  return { q: a + ' - ' + b, a: a - b, label: 'Find the value' };
}

function genMul(d){
  const r = RANGE.mul[d];
  const a = rnd(r[0], r[1]);
  const b = rnd(r[0], r[1]);
  return { q: a + ' \u00d7 ' + b, a: a * b, label: 'Find the value' };
}

function genDiv(d){
  const r = RANGE.mul[d];
  const b = rnd(r[0], r[1]);
  const ans = rnd(r[0], r[1]);
  return { q: (b * ans) + ' \u00f7 ' + b, a: ans, label: 'Find the value' };
}

/* ---------- TABLES ---------- */
function genTable(d, opts){
  const t = (opts && opts.table) ? opts.table : 2;
  const max = d === 'easy' ? 10 : (d === 'medium' ? 12 : 20);
  const n = rnd(1, max);
  return { q: t + ' \u00d7 ' + n, a: t * n, label: 'Find the value' };
}

/* ---------- COMBINED ---------- */
function genOps(d){
  const r = d === 'easy' ? [2, 9] : (d === 'medium' ? [2, 12] : [2, 20]);
  const a = rnd(r[0], r[1]);
  const b = rnd(r[0], r[1]);
  const c = rnd(r[0], r[1]);
  const k = rnd(1, 3);
  if (k === 1) return { q: a + ' + ' + b + ' \u00d7 ' + c, a: a + b * c, label: 'Calculate' };
  if (k === 2) return { q: a + ' \u00d7 ' + b + ' + ' + c, a: a * b + c, label: 'Calculate' };
  const big = a * b;
  const small = Math.min(c, big);
  return { q: big + ' - ' + small, a: big - small, label: 'Calculate' };
}

function genMix(d){
  const r = d === 'easy' ? [2, 9] : (d === 'medium' ? [2, 12] : [2, 20]);
  const b = rnd(r[0], r[1]);
  const k = rnd(r[0], r[1]);
  const a = b * k;                       /* so a / b is a whole number */
  const c = rnd(r[0], r[1]);
  const e = rnd(r[0], r[1]);
  return {
    q: a + ' \u00f7 ' + b + ' + ' + c + ' \u00d7 ' + e,
    a: k + c * e,
    label: 'Calculate'
  };
}

function genBracket(d){
  const r = d === 'easy' ? [2, 9] : (d === 'medium' ? [2, 12] : [2, 20]);
  const a = rnd(r[0], r[1]);
  const b = rnd(r[0], r[1]);
  const c = rnd(r[0], r[1]);
  if (rnd(1, 2) === 1){
    return { q: '(' + a + ' + ' + b + ') \u00d7 ' + c, a: (a + b) * c, label: 'Calculate' };
  }
  return { q: a + ' \u00d7 (' + b + ' + ' + c + ')', a: a * (b + c), label: 'Calculate' };
}

/* ---------- ADVANCED ---------- */
function genSqrt(d){
  const max = d === 'easy' ? 12 : (d === 'medium' ? 20 : 30);
  const n = rnd(2, max);
  return { q: '\u221a' + (n * n), a: n, label: 'Evaluate' };
}

function genSquare(d){
  const max = d === 'easy' ? 12 : (d === 'medium' ? 20 : 30);
  const n = rnd(2, max);
  return { q: n + '\u00b2', a: n * n, label: 'Evaluate' };
}

function genCube(d){
  const max = d === 'easy' ? 5 : (d === 'medium' ? 8 : 12);
  const n = rnd(2, max);
  return { q: n + '\u00b3', a: n * n * n, label: 'Evaluate' };
}

function genPower(d){
  const base = d === 'easy' ? rnd(2, 4) : (d === 'medium' ? rnd(2, 6) : rnd(2, 9));
  const exp = d === 'easy' ? rnd(2, 3) : (d === 'medium' ? rnd(2, 4) : rnd(2, 5));
  return { q: base + supNum(exp), a: Math.pow(base, exp), label: 'Evaluate' };
}

/* ---------- PERCENTAGE & FRACTION ---------- */
const PCTS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 75, 80, 90];
const BASES = [20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 240, 300, 400, 500, 600, 800, 1000];

function genPct(){
  for (let i = 0; i < 80; i++){
    const p = pick(PCTS);
    const n = pick(BASES);
    const v = p * n / 100;
    if (Number.isInteger(v)) return { q: p + '% of ' + n, a: v, label: 'Find the value' };
  }
  return { q: '50% of 200', a: 100, label: 'Find the value' };
}

/* denominators that divide 100 give a clean whole percentage */
const FRAC_DEN = [2, 4, 5, 10, 20, 25, 50, 100];

function genF2P(){
  const b = pick(FRAC_DEN);
  const a = rnd(1, b - 1);
  return { q: a + '/' + b + ' = ? %', a: (a * 100) / b, label: 'Convert to percent' };
}

/* these denominators always give an exact 2-decimal answer */
const FADD_DEN = [2, 4, 5, 10, 20];

function genFAdd(){
  const b = pick(FADD_DEN);
  const d = pick(FADD_DEN);
  const a = rnd(1, b - 1);
  const c = rnd(1, d - 1);
  const val = a / b + c / d;
  return {
    q: a + '/' + b + ' + ' + c + '/' + d,
    a: Math.round(val * 100) / 100,
    label: 'Add fractions (decimal answer)'
  };
}

/* ---------- MIXED MODES ---------- */
function genCustom(d){
  const k = rnd(1, 7);
  if (k === 1) return genAdd(d);
  if (k === 2) return genSub(d);
  if (k === 3) return genMul(d);
  if (k === 4) return genDiv(d);
  if (k === 5) return genPct();
  if (k === 6) return genSquare(d);
  return genSqrt(d);
}

/* ---------- DISPATCHER ---------- */
function generateQuestion(typeId, diff, opts){
  switch (typeId){
    case 'add':     return genAdd(diff);
    case 'sub':     return genSub(diff);
    case 'mul':     return genMul(diff);
    case 'div':     return genDiv(diff);
    case 'table':   return genTable(diff, opts);
    case 'ops':     return genOps(diff);
    case 'mix':     return genMix(diff);
    case 'bracket': return genBracket(diff);
    case 'sqrt':    return genSqrt(diff);
    case 'square':  return genSquare(diff);
    case 'cube':    return genCube(diff);
    case 'power':   return genPower(diff);
    case 'pct':     return genPct();
    case 'f2p':     return genF2P();
    case 'fadd':    return genFAdd();
    case 'custom':  return genCustom(diff);
    case 'memory':  return genCustom(diff);
    default:        return genAdd(diff);
  }
}

/* build a full set of questions with no duplicates */
function buildQuestions(opts){
  if (opts.topicId === 'mistakes'){
    return DB.stats.mistakes.slice(0, opts.count).map(function(m){
      return { q: m.q, a: m.a, label: m.label || 'Find the value', topicId: m.topicId };
    });
  }

  const out = [];
  const seen = {};
  let guard = 0;

  while (out.length < opts.count && guard < opts.count * 80){
    guard++;
    const item = generateQuestion(opts.typeId, opts.difficulty, opts);
    if (!item) continue;
    if (seen[item.q]) continue;
    seen[item.q] = true;
    out.push(item);
  }

  /* tiny generators may run out of unique text, then allow repeats */
  while (out.length < opts.count){
    const item = generateQuestion(opts.typeId, opts.difficulty, opts);
    if (!item) break;
    out.push(item);
  }

  return out;
}