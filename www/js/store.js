/* ============================================================
   SAVE / LOAD everything in localStorage
   ============================================================ */
const STORAGE_KEY = 'mathmaster_v1';
const DAILY_GOAL = 50;

/* ---- small date helpers ---- */
function pad2(n){ return n < 10 ? '0' + n : '' + n; }

function dayKey(d){
  d = d || new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

function shiftDay(key, amount){
  const p = key.split('-').map(Number);
  const d = new Date(p[0], p[1] - 1, p[2]);
  d.setDate(d.getDate() + amount);
  return dayKey(d);
}

function todayKey(){ return dayKey(new Date()); }

/* list of last n day keys, oldest first */
function dayRange(n){
  const t = todayKey();
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(shiftDay(t, -i));
  return out;
}

/* ---- default empty database (no fake numbers) ---- */
function defaultDB(){
  return {
    version: 1,
    name: '',
    settings: {
      sound: true,
      haptics: true,
      autoCheck: true,
      theme: 'system',
      reminder: '20:00',
      difficulty: 'medium',
      keypad: 'medium'
    },
    stats: {
      totalSolved: 0,
      totalCorrect: 0,
      bestStreak: 0,
      currentStreak: 0,
      lastSessionDay: '',
      xp: 0,
      topics: {},
      days: {},
      speed: [],
      mistakes: []
    }
  };
}

let DB = defaultDB();

/* merge saved object onto defaults so new keys never break */
function mergeDefaults(target, src){
  if (!src || typeof src !== 'object') return target;
  Object.keys(src).forEach(function(k){
    const sv = src[k];
    const tv = target[k];
    if (tv && typeof tv === 'object' && !Array.isArray(tv) &&
        sv && typeof sv === 'object' && !Array.isArray(sv)){
      mergeDefaults(tv, sv);
    } else if (sv !== undefined){
      target[k] = sv;
    }
  });
  return target;
}

function saveDB(){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(DB)); } catch(e){}
}

function loadDB(){
  let raw = null;
  try { raw = localStorage.getItem(STORAGE_KEY); } catch(e){}
  DB = defaultDB();
  if (raw){
    try { mergeDefaults(DB, JSON.parse(raw)); } catch(e){}
  }
  houseKeeping();
  saveDB();
}

/* remove very old days + fix streak if a day was missed */
function houseKeeping(){
  const t = todayKey();
  const cutoff = shiftDay(t, -40);
  Object.keys(DB.stats.days).forEach(function(k){
    if (k < cutoff) delete DB.stats.days[k];
  });
  const last = DB.stats.lastSessionDay;
  if (!last){
    DB.stats.currentStreak = 0;
  } else if (last !== t && last !== shiftDay(t, -1)){
    DB.stats.currentStreak = 0;
  }
}

/* ---- recording ---- */
function recordAnswer(topicId, correct, ms){
  const t = todayKey();
  const s = DB.stats;

  s.totalSolved++;
  if (correct) s.totalCorrect++;

  if (!s.topics[topicId]) s.topics[topicId] = { correct: 0, total: 0 };
  s.topics[topicId].total++;
  if (correct) s.topics[topicId].correct++;

  if (!s.days[t]) s.days[t] = { count: 0, correct: 0 };
  s.days[t].count++;
  if (correct) s.days[t].correct++;

  s.speed.push({ ms: ms, day: t });
  if (s.speed.length > 600) s.speed = s.speed.slice(-600);

  saveDB();
}

function addMistake(item){
  const s = DB.stats;
  s.mistakes = s.mistakes.filter(function(m){ return m.q !== item.q; });
  s.mistakes.unshift(item);
  if (s.mistakes.length > 100) s.mistakes.length = 100;
  saveDB();
}

function removeMistake(questionText){
  DB.stats.mistakes = DB.stats.mistakes.filter(function(m){ return m.q !== questionText; });
  saveDB();
}

function addXP(n){
  DB.stats.xp += n;
  saveDB();
}

/* called once when a session is completed */
function finishSession(){
  const t = todayKey();
  const s = DB.stats;
  if (s.lastSessionDay !== t){
    if (s.lastSessionDay === shiftDay(t, -1)) s.currentStreak += 1;
    else s.currentStreak = 1;
    s.lastSessionDay = t;
    if (s.currentStreak > s.bestStreak) s.bestStreak = s.currentStreak;
  }
  saveDB();
}

/* ---- reading stats ---- */
function todayCount(){
  const d = DB.stats.days[todayKey()];
  return d ? d.count : 0;
}

function overallAccuracy(){
  const s = DB.stats;
  return s.totalSolved ? Math.round(s.totalCorrect / s.totalSolved * 100) : 0;
}

function avgSpeedMs(windowDays){
  const s = DB.stats;
  let arr = s.speed;
  if (windowDays){
    const set = {};
    dayRange(windowDays).forEach(function(k){ set[k] = 1; });
    arr = arr.filter(function(x){ return set[x.day]; });
  }
  if (!arr.length) return 0;
  let sum = 0;
  arr.forEach(function(x){ sum += x.ms; });
  return sum / arr.length;
}

function rangeStats(n){
  const s = DB.stats;
  let count = 0, correct = 0;
  dayRange(n).forEach(function(k){
    const d = s.days[k];
    if (d){ count += d.count; correct += d.correct; }
  });
  return {
    count: count,
    correct: correct,
    accuracy: count ? Math.round(correct / count * 100) : 0,
    avgMs: avgSpeedMs(n)
  };
}

/* accuracy between two day keys (inclusive) */
function accuracyBetween(fromKey, toKey){
  const s = DB.stats;
  let c = 0, t = 0;
  Object.keys(s.days).forEach(function(k){
    if (k >= fromKey && k <= toKey){
      c += s.days[k].correct;
      t += s.days[k].count;
    }
  });
  return t ? Math.round(c / t * 100) : 0;
}

function topicPercent(topicId){
  const t = DB.stats.topics[topicId];
  if (!t || !t.total) return null;
  return Math.round(t.correct / t.total * 100);
}

/* weakest practiced topic, or null */
function weakestTopic(){
  let best = null;
  Object.keys(DB.stats.topics).forEach(function(id){
    const p = topicPercent(id);
    if (p === null) return;
    if (!best || p < best.pct) best = { id: id, pct: p };
  });
  return best;
}