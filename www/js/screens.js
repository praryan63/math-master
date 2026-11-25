/* ============================================================
   MAIN SCREENS: Practice home, Stats, Learn, Profile
   ============================================================ */

/* ---------------- PRACTICE HOME ---------------- */
function renderHome(){
  const t = todayKey();
  const count = todayCount();
  const pct = Math.min(100, Math.round(count / DAILY_GOAL * 100));

  /* ring math: r = 34, circumference = 2 * PI * 34 */
  const CIRC = 213.6;
  const offset = CIRC - (CIRC * pct / 100);

  const acc = DB.stats.totalSolved ? overallAccuracy() : null;
  const speed = avgSpeedMs();

  const topicRows = TOPIC_LIST.map(function(tp){
    let right = icon('chevron-right', 'ico-chevron');

    if (tp.id === 'mistakes'){
      const n = DB.stats.mistakes.length;
      right = n
        ? '<span class="badge">' + n + ' to review</span>'
        : '<span class="topic-sub">Nothing yet</span>';
    }

    return '<button class="topic-row" data-topic="' + tp.id + '">' +
             '<span class="topic-ico">' + icon(tp.icon) + '</span>' +
             '<span class="topic-text">' +
               '<span class="topic-name">' + esc(tp.name) + '</span>' +
               '<span class="topic-sub">' + esc(tp.sub) + '</span>' +
             '</span>' + right +
           '</button>';
  }).join('');

  const html =
  '<section class="screen">' +
    '<header class="topbar">' +
      '<div class="brand">' +
        '<div class="logo">M</div>' +
        '<h1>Math Master</h1>' +
      '</div>' +
      '<button class="icon-btn white" id="btn-profile">' + icon('more-vertical') + '</button>' +
    '</header>' +

    '<div class="scroll">' +

      /* daily goal card */
      '<div class="card goal-card">' +
        '<div class="ring-wrap">' +
          '<svg class="ring" viewBox="0 0 80 80">' +
            '<circle class="ring-bg" cx="40" cy="40" r="34"/>' +
            '<circle class="ring-fg" cx="40" cy="40" r="34" ' +
              'style="stroke-dasharray:' + CIRC + ';stroke-dashoffset:' + offset + '"/>' +
          '</svg>' +
          '<div class="ring-label">' + pct + '%</div>' +
        '</div>' +
        '<div class="goal-info">' +
          '<div class="goal-label">Daily goal</div>' +
          '<div class="goal-value">' + count + ' of ' + DAILY_GOAL + ' questions</div>' +
          '<button class="btn btn-primary btn-sm" id="btn-continue">Continue workout</button>' +
        '</div>' +
      '</div>' +

      /* streak / accuracy / speed */
      '<div class="mini-row">' +
        '<div class="mini-card">' +
          '<span class="mini-ico">' + icon('flame') + '</span>' +
          '<span class="mini-label">Streak</span>' +
          '<span class="mini-value">' + (DB.stats.currentStreak || 0) + '</span>' +
        '</div>' +
        '<div class="mini-card">' +
          '<span class="mini-ico">' + icon('target') + '</span>' +
          '<span class="mini-label">Accuracy</span>' +
          '<span class="mini-value">' + (acc === null ? '--' : acc + '%') + '</span>' +
        '</div>' +
        '<div class="mini-card">' +
          '<span class="mini-ico">' + icon('clock') + '</span>' +
          '<span class="mini-label">Speed</span>' +
          '<span class="mini-value">' + (speed ? fmtSeconds(speed) : '--') + '</span>' +
        '</div>' +
      '</div>' +

      '<div class="section-title">Topics</div>' +
      '<div class="topic-list">' + topicRows + '</div>' +

    '</div>' +
  '</section>';

  App.setView(html);

  /* wire up buttons */
  document.getElementById('btn-profile').onclick = function(){ App.go('profile'); };

  document.getElementById('btn-continue').onclick = function(){
    Session.start({
      topicId: 'game',
      topicName: 'Workout',
      typeId: 'custom',
      difficulty: DB.settings.difficulty,
      count: 10,
      memory: false
    });
  };

  document.querySelectorAll('.topic-row').forEach(function(row){
    row.onclick = function(){ openTopicSheet(row.getAttribute('data-topic')); };
  });
}

/* ---------------- TOPIC OPTIONS SHEET ---------------- */
function openTopicSheet(topicId){
  const topic = getTopic(topicId);
  if (!topic) return;

  /* mistakes: start directly */
  if (topicId === 'mistakes'){
    const n = DB.stats.mistakes.length;
    if (!n){ toast('No mistakes yet. Keep practicing.'); return; }

    openSheet(
      '<h3 class="sheet-title">Mistakes Practice</h3>' +
      '<p class="sheet-sub">You have ' + n + ' question' + (n === 1 ? '' : 's') + ' to review.</p>' +
      '<button class="btn btn-primary btn-full" id="start-session">Start practice</button>',
      function(body){
        body.querySelector('#start-session').onclick = function(){
          closeSheet();
          Session.start({
            topicId: 'mistakes',
            topicName: 'Mistakes',
            typeId: 'mistakes',
            difficulty: DB.settings.difficulty,
            count: Math.min(n, 20),
            memory: false
          });
        };
      }
    );
    return;
  }

  /* working state of the sheet */
  const state = {
    typeId: topic.types[0].id,
    diff: DB.settings.difficulty,
    count: 10,
    table: 2,
    tablePicked: false
  };

  function buildBody(){
    let html = '<h3 class="sheet-title">' + esc(topic.name) + '</h3>';

    if (topic.tablePicker){
      html += '<div class="sheet-label">Table number</div><div class="num-grid">';
      for (let i = 1; i <= 50; i++){
        const on = (state.tablePicked && state.table === i) ? ' on' : '';
        html += '<button class="num-cell' + on + '" data-table="' + i + '">' + i + '</button>';
      }
      html += '</div>';
    }

    if (topic.types.length > 0){
      html += '<div class="sheet-label">Type</div><div class="chip-row">';
      topic.types.forEach(function(ty){
        html += '<button class="pick' + (state.typeId === ty.id ? ' on' : '') +
                '" data-type="' + ty.id + '">' + esc(ty.name) + '</button>';
      });
      html += '</div>';
    }

    html += '<div class="sheet-label">Difficulty</div><div class="seg">';
    [['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']].forEach(function(d){
      html += '<button class="seg-btn' + (state.diff === d[0] ? ' on' : '') +
              '" data-diff="' + d[0] + '">' + d[1] + '</button>';
    });
    html += '</div>';

    html += '<div class="sheet-label">Questions</div><div class="seg">';
    [10, 20, 30].forEach(function(c){
      html += '<button class="seg-btn' + (state.count === c ? ' on' : '') +
              '" data-count="' + c + '">' + c + '</button>';
    });
    html += '</div>';

    html += '<div style="height:16px"></div>' +
            '<button class="btn btn-primary btn-full" id="start-session">Start practice</button>';

    return html;
  }

  openSheet(buildBody(), function(body){
    body.addEventListener('click', function(e){
      const btn = e.target.closest('button');
      if (!btn) return;

      if (btn.hasAttribute('data-table')){
        state.table = Number(btn.getAttribute('data-table'));
        state.tablePicked = true;
        body.innerHTML = buildBody();
        return;
      }
      if (btn.hasAttribute('data-type')){
        state.typeId = btn.getAttribute('data-type');
        body.innerHTML = buildBody();
        return;
      }
      if (btn.hasAttribute('data-diff')){
        state.diff = btn.getAttribute('data-diff');
        body.innerHTML = buildBody();
        return;
      }
      if (btn.hasAttribute('data-count')){
        state.count = Number(btn.getAttribute('data-count'));
        body.innerHTML = buildBody();
        return;
      }
      if (btn.id === 'start-session'){
        if (topic.tablePicker && !state.tablePicked){
          toast('Pick a table number first');
          return;
        }
        closeSheet();
        Session.start({
          topicId: topic.id,
          topicName: topic.tablePicker ? ('Table of ' + state.table) : topic.name,
          typeId: state.typeId,
          difficulty: state.diff,
          count: state.count,
          table: state.table,
          memory: state.typeId === 'memory'
        });
      }
    });
  });
}

/* ---------------- STATS SCREEN ---------------- */
let statsRange = 7;   /* 7 or 30 days */

function renderStats(){
  const s = DB.stats;

  if (s.totalSolved === 0){
    App.setView(
      '<section class="screen">' +
        '<header class="topbar"><h2 class="topbar-title">Stats</h2></header>' +
        '<div class="scroll">' +
          '<div class="card empty-card">' +
            '<div class="empty-ico">' + icon('bar-chart') + '</div>' +
            '<p>No data yet</p>' +
            '<p class="sub">Finish one practice session to see your stats here.</p>' +
            '<button class="btn btn-primary" id="go-practice">Start practicing</button>' +
          '</div>' +
        '</div>' +
      '</section>'
    );
    document.getElementById('go-practice').onclick = function(){ App.go('home'); };
    renderNav('stats');
    return;
  }

  const range = rangeStats(statsRange);
  const week = rangeStats(7);

  /* accuracy change: this week vs last week */
  const t = todayKey();
  const curAcc = accuracyBetween(shiftDay(t, -6), t);
  const prevAcc = accuracyBetween(shiftDay(t, -13), shiftDay(t, -7));
  const hasPrev = Object.keys(s.days).some(function(k){ return k >= shiftDay(t, -13) && k <= shiftDay(t, -7); });
  const delta = curAcc - prevAcc;

  let accNote = 'All time';
  let accNoteClass = '';
  if (hasPrev){
    if (delta > 0){ accNote = 'Up ' + delta + '% this week'; accNoteClass = 'note-up'; }
    else if (delta < 0){ accNote = 'Down ' + Math.abs(delta) + '% this week'; accNoteClass = 'note-down'; }
    else { accNote = 'Same as last week'; }
  }

  /* chart data */
  const days = dayRange(statsRange);
  let maxCount = 1;
  days.forEach(function(k){
    const d = s.days[k];
    if (d && d.count > maxCount) maxCount = d.count;
  });

  const dayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const bars = days.map(function(k, i){
    const d = s.days[k];
    const c = d ? d.count : 0;
    const h = Math.round((c / maxCount) * 100);
    const isToday = k === t;

    const parts = k.split('-').map(Number);
    const dt = new Date(parts[0], parts[1] - 1, parts[2]);
    const letter = dayLetters[dt.getDay()];

    const showLabel = statsRange === 7 || (i % 5 === 0) || (i === days.length - 1);

    return '<div class="bar-col">' +
             '<div class="bar-track">' +
               '<div class="bar-fill' + (isToday ? ' today' : '') + '" ' +
                 'style="height:' + (c ? Math.max(h, 5) : 0) + '%"></div>' +
             '</div>' +
             '<div class="bar-label">' + (showLabel ? letter : '') + '</div>' +
           '</div>';
  }).join('');

  /* topic strength */
  const practiced = TOPIC_LIST.filter(function(tp){
    return tp.id !== 'mistakes' && topicPercent(tp.id) !== null;
  });

  let strengthHtml = '';
  if (practiced.length === 0){
    strengthHtml = '<p class="note" style="text-align:left">No topic data yet.</p>';
  } else {
    strengthHtml = practiced.map(function(tp){
      const p = topicPercent(tp.id);
      const weak = p < 60;
      return '<div class="strength-row">' +
               '<div class="strength-head">' +
                 '<span class="strength-name">' + esc(tp.name) + '</span>' +
                 '<span class="strength-pct">' + p + '%</span>' +
               '</div>' +
               '<div class="strength-track">' +
                 '<div class="strength-fill' + (weak ? ' weak' : '') + '" style="width:' + p + '%"></div>' +
               '</div>' +
             '</div>';
    }).join('');
  }

  const weak = weakestTopic();
  let weakBtn = '';
  if (weak){
    const weakTopic = getTopic(weak.id);
    weakBtn = '<button class="btn btn-primary btn-full" id="weak-btn">Practice ' +
              esc(weakTopic ? weakTopic.name : weak.id) + '</button>';
  }

  const html =
  '<section class="screen">' +
    '<header class="topbar"><h2 class="topbar-title">Stats</h2></header>' +
    '<div class="scroll">' +

      '<div class="seg" style="margin-bottom:14px">' +
        '<button class="seg-btn' + (statsRange === 7 ? ' on' : '') + '" data-range="7">7 days</button>' +
        '<button class="seg-btn' + (statsRange === 30 ? ' on' : '') + '" data-range="30">30 days</button>' +
      '</div>' +

      '<div class="stat-grid">' +
        '<div class="stat-card">' +
          '<div class="lbl">Accuracy</div>' +
          '<div class="val">' + range.accuracy + '%</div>' +
          '<div class="note ' + accNoteClass + '">' + esc(accNote) + '</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="lbl">Average speed</div>' +
          '<div class="val">' + fmtSeconds(range.avgMs) + '</div>' +
          '<div class="note">Per question</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="lbl">Solved</div>' +
          '<div class="val">' + s.totalSolved + '</div>' +
          '<div class="note">' + week.count + ' this week</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="lbl">Best streak</div>' +
          '<div class="val">' + s.bestStreak + '</div>' +
          '<div class="note">Current ' + s.currentStreak + '</div>' +
        '</div>' +
      '</div>' +

      '<div class="section-title">Questions per day</div>' +
      '<div class="card"><div class="chart">' + bars + '</div></div>' +

      '<div class="section-title">Topic strength</div>' +
      '<div class="card">' + strengthHtml + '</div>' +

      '<div style="height:16px"></div>' + weakBtn +

    '</div>' +
  '</section>';

  App.setView(html);
  renderNav('stats');

  document.querySelectorAll('[data-range]').forEach(function(btn){
    btn.onclick = function(){
      statsRange = Number(btn.getAttribute('data-range'));
      renderStats();
    };
  });

  if (weak){
    document.getElementById('weak-btn').onclick = function(){
      openTopicSheet(weak.id);
    };
  }
}

/* PART 2 STARTS HERE */
/* ---------------- LEARN SCREEN ---------------- */
const LEARN_DATA = [
  {
    id: 'basics', title: 'Basics', icon: 'plus',
    tips: [
      'Add in tens first: <b>48 + 27</b> is <b>40 + 20 = 60</b>, then <b>8 + 7 = 15</b>, so <b>75</b>.',
      'Subtract by adding up: <b>63 - 28</b> means "28 to 30 is 2, 30 to 63 is 33", so <b>35</b>.',
      'Multiply by splitting: <b>7 \u00d7 24</b> is <b>7 \u00d7 20 = 140</b> plus <b>7 \u00d7 4 = 28</b>, so <b>168</b>.',
      'Any number times 10 just gets a zero: <b>46 \u00d7 10 = 460</b>.',
      'Dividing is the opposite of multiplying: ask "how many times does <b>8</b> fit into <b>56</b>?"'
    ]
  },
  {
    id: 'tables', title: 'Times tables', icon: 'multiply',
    tips: [
      'The 9 table trick: <b>9 \u00d7 7</b> is <b>70 - 7 = 63</b>. Always 10 times minus one time.',
      'The 5 table always ends in <b>0</b> or <b>5</b>. So <b>7 \u00d7 5 = 35</b>.',
      'The 11 table up to 9: just repeat the digit. <b>4 \u00d7 11 = 44</b>.',
      'For 11 with two digits, add the digits and put them in the middle: <b>23 \u00d7 11 = 2 (2+3) 3 = 253</b>.',
      'The 4 table is "double then double": <b>7 \u00d7 4</b> is <b>7 \u00d7 2 = 14</b>, then <b>14 \u00d7 2 = 28</b>.'
    ]
  },
  {
    id: 'combined', title: 'Combined rules', icon: 'plus-minus',
    tips: [
      'Always do <b>multiplication and division</b> before <b>addition and subtraction</b>.',
      'Brackets win first: <b>(2 + 3) \u00d7 4 = 20</b>, but <b>2 + 3 \u00d7 4 = 14</b>.',
      'Same level goes left to right: <b>20 \u00f7 4 \u00d7 2 = 10</b>.',
      'Split problems into pieces. Write the value of each small part below the number.',
      'Check by estimating: if your answer is far from your rough guess, recheck the order.'
    ]
  },
  {
    id: 'advanced', title: 'Roots and powers', icon: 'square-root',
    tips: [
      'A square root asks "what number times itself gives this?" <b>\u221a81 = 9</b>.',
      'Learn the first squares: <b>1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144</b>.',
      'Square of a number ending in <b>5</b>: <b>35\u00b2</b> is <b>3 \u00d7 4 = 12</b>, then write <b>25</b>, so <b>1225</b>.',
      'A cube is three of the same multiplied: <b>4\u00b3 = 4 \u00d7 4 \u00d7 4 = 64</b>.',
      'Powers of 2 are easy to chain: <b>2, 4, 8, 16, 32, 64, 128, 256</b>.'
    ]
  },
  {
    id: 'percent', title: 'Percent and fractions', icon: 'percent',
    tips: [
      '10% is just one decimal step: <b>10% of 240 = 24</b>.',
      '5% is half of 10%: <b>5% of 240 = 12</b>.',
      'Build any percent from pieces: <b>35% = 30% + 5%</b>.',
      'A fraction to percent: multiply by 100. <b>3/4 \u00d7 100 = 75%</b>.',
      'Percent of a number: <b>25%</b> is one quarter, <b>50%</b> is half, <b>75%</b> is three quarters.',
      'Fraction addition first makes the bottoms equal: <b>1/2 + 1/4 = 2/4 + 1/4 = 3/4 = 0.75</b>.'
    ]
  },
  {
    id: 'game', title: 'Practice smarter', icon: 'target',
    tips: [
      'Use <b>Memory</b> mode to train holding numbers in your head.',
      'Keep a steady rhythm. Accuracy first, speed comes later.',
      'Write down the questions you got wrong and redo them the same day.',
      'A short session every day beats one long session per week.'
    ]
  }
];

function renderLearn(){
  let openId = renderLearn.lastOpen || '';

  const cards = LEARN_DATA.map(function(item){
    const isOpen = openId === item.id;
    const tips = item.tips.map(function(tip){
      return '<div class="tip"><span class="tip-dot"></span><span class="tip-text">' + tip + '</span></div>';
    }).join('');

    return '<div class="learn-card' + (isOpen ? ' open' : '') + '" data-learn="' + item.id + '">' +
             '<button class="learn-head">' +
               '<span class="topic-ico">' + icon(item.icon) + '</span>' +
               '<span class="learn-title">' + esc(item.title) + '</span>' +
               icon('chevron-right', 'ico-chevron') +
             '</button>' +
             '<div class="learn-body"><div class="learn-inner">' + tips + '</div></div>' +
           '</div>';
  }).join('');

  App.setView(
    '<section class="screen">' +
      '<header class="topbar"><h2 class="topbar-title">Learn</h2></header>' +
      '<div class="scroll">' +
        '<p class="note" style="text-align:left;margin:0 4px 14px">Short tricks that make practice easier.</p>' +
        cards +
      '</div>' +
    '</section>'
  );

  renderNav('learn');

  document.querySelectorAll('.learn-card').forEach(function(card){
    card.querySelector('.learn-head').onclick = function(){
      const id = card.getAttribute('data-learn');
      const wasOpen = card.classList.contains('open');

      document.querySelectorAll('.learn-card').forEach(function(c){ c.classList.remove('open'); });
      if (!wasOpen) card.classList.add('open');

      renderLearn.lastOpen = wasOpen ? '' : id;
      haptic(6);
    };
  });
}

/* ---------------- PROFILE AND SETTINGS ---------------- */
function renderProfile(){
  const s = DB.settings;
  const letter = (DB.name || 'Y').trim().charAt(0).toUpperCase() || 'Y';

  const themeText = s.theme === 'system' ? 'System' : (s.theme === 'light' ? 'Light' : 'Dark');
  const diffText = s.difficulty.charAt(0).toUpperCase() + s.difficulty.slice(1);
  const keypadText = s.keypad.charAt(0).toUpperCase() + s.keypad.slice(1);

  /* reminder shows 12-hour format */
  let reminderText = 'Off';
  if (s.reminder){
    const parts = s.reminder.split(':');
    let hh = Number(parts[0]);
    const mm = parts[1];
    const ampm = hh >= 12 ? 'PM' : 'AM';
    hh = hh % 12;
    if (hh === 0) hh = 12;
    reminderText = hh + ':' + mm + ' ' + ampm;
  }

  const html =
  '<section class="screen">' +
    '<header class="topbar">' +
      '<button class="icon-btn" id="p-back">' + icon('chevron-left') + '</button>' +
      '<h2 class="topbar-title">Profile</h2>' +
      '<span style="width:38px"></span>' +
    '</header>' +

    '<div class="scroll no-nav">' +

      '<div class="card profile-card">' +
        '<div class="avatar">' + esc(letter) + '</div>' +
        '<label class="field-label" for="name-input">Your name</label>' +
        '<input id="name-input" class="text-input" type="text" maxlength="24" ' +
          'placeholder="Type your name" value="' + esc(DB.name) + '">' +
        '<button class="btn btn-ghost btn-full" id="save-name">Save name</button>' +
        '<p class="note">Saved on this device only</p>' +
      '</div>' +

      '<div class="section-title">Settings</div>' +
      '<div class="card settings-card">' +

        '<div class="set-row">' +
          '<span class="name">Sound effects</span>' +
          '<button class="switch' + (s.sound ? ' on' : '') + '" data-toggle="sound"></button>' +
        '</div>' +

        '<div class="set-row">' +
          '<span class="name">Haptics</span>' +
          '<button class="switch' + (s.haptics ? ' on' : '') + '" data-toggle="haptics"></button>' +
        '</div>' +

        '<div class="set-row">' +
          '<span class="name">Auto-check answers</span>' +
          '<button class="switch' + (s.autoCheck ? ' on' : '') + '" data-toggle="autoCheck"></button>' +
        '</div>' +

        '<button class="set-row" data-open="theme">' +
          '<span class="name">Theme</span>' +
          '<span class="val">' + themeText + '</span>' +
          icon('chevron-right', 'ico-chevron') +
        '</button>' +

        '<button class="set-row" data-open="reminder">' +
          '<span class="name">Daily reminder</span>' +
          '<span class="val">' + reminderText + '</span>' +
          icon('chevron-right', 'ico-chevron') +
        '</button>' +

        '<button class="set-row" data-open="difficulty">' +
          '<span class="name">Default difficulty</span>' +
          '<span class="val">' + diffText + '</span>' +
          icon('chevron-right', 'ico-chevron') +
        '</button>' +

        '<button class="set-row" data-open="keypad">' +
          '<span class="name">Keypad size</span>' +
          '<span class="val">' + keypadText + '</span>' +
          icon('chevron-right', 'ico-chevron') +
        '</button>' +

        '<button class="set-row" data-open="backup">' +
          '<span class="name">Backup and restore</span>' +
          '<span class="val">Export / Import</span>' +
          icon('chevron-right', 'ico-chevron') +
        '</button>' +

        '<button class="set-row" data-open="about">' +
          '<span class="name">About</span>' +
          '<span class="val">v1.0</span>' +
          icon('chevron-right', 'ico-chevron') +
        '</button>' +

      '</div>' +

      '<div style="height:20px"></div>' +
    '</div>' +
  '</section>';

  App.setView(html);
  renderNav(null);

  document.getElementById('p-back').onclick = function(){ App.go('home'); };

  document.getElementById('save-name').onclick = function(){
    const input = document.getElementById('name-input');
    DB.name = input.value.trim();
    saveDB();
    toast('Name saved');
    renderProfile();
  };

  document.querySelectorAll('[data-toggle]').forEach(function(btn){
    btn.onclick = function(){
      const key = btn.getAttribute('data-toggle');
      DB.settings[key] = !DB.settings[key];
      saveDB();
      btn.classList.toggle('on', DB.settings[key]);
      if (key === 'haptics' && DB.settings.haptics) haptic(12);
      if (key === 'sound' && DB.settings.sound) sfxTap();
    };
  });

  document.querySelectorAll('[data-open]').forEach(function(btn){
    btn.onclick = function(){ openSettingsSheet(btn.getAttribute('data-open')); };
  });
}

/* ---------------- SETTINGS SHEETS ---------------- */
function openSettingsSheet(which){
  const s = DB.settings;

  if (which === 'theme'){
    openSheet(
      '<h3 class="sheet-title">Theme</h3>' +
      '<p class="sheet-sub">Choose how Math Master looks.</p>' +
      radioRows([
        { value: 'system', label: 'System' },
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' }
      ], s.theme, 'theme'),
      function(body){
        body.querySelectorAll('[data-theme]').forEach(function(row){
          row.onclick = function(){
            DB.settings.theme = row.getAttribute('data-theme');
            saveDB();
            applyTheme();
            closeSheet();
            renderProfile();
          };
        });
      }
    );
    return;
  }

  if (which === 'difficulty'){
    openSheet(
      '<h3 class="sheet-title">Default difficulty</h3>' +
      '<p class="sheet-sub">Used as the starting point for each session.</p>' +
      radioRows([
        { value: 'easy', label: 'Easy' },
        { value: 'medium', label: 'Medium' },
        { value: 'hard', label: 'Hard' }
      ], s.difficulty, 'diff'),
      function(body){
        body.querySelectorAll('[data-diff]').forEach(function(row){
          row.onclick = function(){
            DB.settings.difficulty = row.getAttribute('data-diff');
            saveDB();
            closeSheet();
            renderProfile();
          };
        });
      }
    );
    return;
  }

  if (which === 'keypad'){
    openSheet(
      '<h3 class="sheet-title">Keypad size</h3>' +
      '<p class="sheet-sub">How big the number keys are during practice.</p>' +
      radioRows([
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' }
      ], s.keypad, 'kp'),
      function(body){
        body.querySelectorAll('[data-kp]').forEach(function(row){
          row.onclick = function(){
            DB.settings.keypad = row.getAttribute('data-kp');
            saveDB();
            closeSheet();
            renderProfile();
          };
        });
      }
    );
    return;
  }

  if (which === 'reminder'){
    openSheet(
      '<h3 class="sheet-title">Daily reminder</h3>' +
      '<p class="sheet-sub">Pick a time you want to practice.</p>' +
      '<input type="time" id="reminder-input" class="time-input" value="' + esc(s.reminder || '20:00') + '">' +
      '<div style="height:14px"></div>' +
      '<button class="btn btn-primary btn-full" id="save-reminder">Save time</button>' +
      '<div style="height:8px"></div>' +
      '<button class="btn btn-ghost btn-full" id="clear-reminder">Turn off reminder</button>',
      function(body){
        body.querySelector('#save-reminder').onclick = function(){
          const v = body.querySelector('#reminder-input').value;
          if (!v){ toast('Pick a time first'); return; }
          DB.settings.reminder = v;
          saveDB();
          closeSheet();
          toast('Reminder set');
          renderProfile();
        };
        body.querySelector('#clear-reminder').onclick = function(){
          DB.settings.reminder = '';
          saveDB();
          closeSheet();
          renderProfile();
        };
      }
    );
    return;
  }

  if (which === 'backup'){
    const json = JSON.stringify(DB);
    openSheet(
      '<h3 class="sheet-title">Backup and restore</h3>' +
      '<p class="sheet-sub">Copy this text to keep a backup, or paste a backup below and import.</p>' +
      '<div class="sheet-label">Export JSON</div>' +
      '<textarea class="json-area" id="export-area" readonly>' + esc(json) + '</textarea>' +
      '<div style="height:10px"></div>' +
      '<button class="btn btn-ghost btn-full" id="copy-json">Copy backup</button>' +
      '<div class="sheet-label">Import JSON</div>' +
      '<textarea class="json-area" id="import-area" placeholder="Paste your backup here"></textarea>' +
      '<div style="height:10px"></div>' +
      '<button class="btn btn-primary btn-full" id="import-json">Import backup</button>',
      function(body){
        body.querySelector('#copy-json').onclick = function(){
          const area = body.querySelector('#export-area');
          area.select();
          let ok = false;
          try { ok = document.execCommand('copy'); } catch(e){}
          if (!ok && navigator.clipboard){
            navigator.clipboard.writeText(area.value).then(function(){
              toast('Backup copied');
            }).catch(function(){ toast('Select and copy manually'); });
          } else {
            toast(ok ? 'Backup copied' : 'Select and copy manually');
          }
        };

        body.querySelector('#import-json').onclick = function(){
          const raw = body.querySelector('#import-area').value.trim();
          if (!raw){ toast('Paste a backup first'); return; }
          let parsed = null;
          try { parsed = JSON.parse(raw); } catch(e){}
          if (!parsed || typeof parsed !== 'object'){ toast('That is not valid backup data'); return; }

          DB = defaultDB();
          mergeDefaults(DB, parsed);
          saveDB();
          closeSheet();
          applyTheme();
          toast('Backup restored');
          renderProfile();
        };
      }
    );
    return;
  }

  if (which === 'about'){
    openSheet(
      '<h3 class="sheet-title">About</h3>' +
      '<p class="sheet-sub">Math Master v1.0</p>' +
      '<div class="card" style="padding:14px">' +
        '<p style="font-size:13px;line-height:1.6;color:var(--muted)">' +
          'A simple offline math practice app. Everything is stored on your phone only. ' +
          'No account, no internet needed.' +
        '</p>' +
      '</div>' +
      '<div style="height:14px"></div>' +
      '<button class="btn btn-ghost btn-full" id="close-about">Close</button>',
      function(body){
        body.querySelector('#close-about').onclick = closeSheet;
      }
    );
    return;
  }
}