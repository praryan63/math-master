/* ============================================================
   PRACTICE SESSION
   ============================================================ */

const Session = {
  active: false,
  data: null,
  lastOpts: null,
  typed: '',
  locked: false,
  checking: false,
  qStart: 0,
  timerId: null,
  memTimer: null,

  /* ---------- START ---------- */
  start: function(opts){
    const questions = buildQuestions(opts);

    if (!questions.length){
      toast('No questions available for this topic');
      return;
    }

    this.data = {
      topicId: opts.topicId,
      topicName: opts.topicName,
      typeId: opts.typeId,
      difficulty: opts.difficulty,
      count: questions.length,
      memory: !!opts.memory,
      questions: questions,
      index: 0,
      correct: 0,
      combo: 0,
      bestCombo: 0,
      xp: 0,
      results: []
    };

    this.lastOpts = opts;
    this.active = true;
    this.typed = '';
    this.locked = false;
    this.checking = false;

    App.screen = 'session';
    renderNav(null);
    this.renderShell();
    this.loadQuestion();
  },

  /* ---------- SCREEN LAYOUT ---------- */
  renderShell: function(){
    const d = this.data;
    const keypadSize = DB.settings.keypad;

    let keys = '';
    ['1','2','3','4','5','6','7','8','9','.','0','back'].forEach(function(k){
      if (k === 'back'){
        keys += '<button class="key key-icon" data-key="back">' + icon('backspace') + '</button>';
      } else {
        keys += '<button class="key" data-key="' + k + '">' + k + '</button>';
      }
    });

    const html =
    '<section class="screen session-screen">' +

      '<div class="session-top">' +
        '<button class="icon-btn" id="s-close">' + icon('close') + '</button>' +
        '<div class="session-title">' +
          '<div class="t1">' + esc(d.topicName) + '</div>' +
          '<div class="t2" id="s-count">Question 1 of ' + d.count + '</div>' +
        '</div>' +
        '<div class="timer-box">' + icon('clock') + '<span id="s-timer">0:00</span></div>' +
      '</div>' +

      '<div class="session-progress">' +
        '<div class="progress"><i id="s-bar" style="width:0%"></i></div>' +
      '</div>' +

      '<div class="chips" id="s-chips"></div>' +

      '<div class="qcard">' +
        '<div class="qlabel" id="s-label">Find the value</div>' +
        '<div class="qtext" id="s-question">--</div>' +
        '<div class="answer-box" id="s-answer"><span class="placeholder">Your answer</span></div>' +
        '<div class="feedback" id="s-feedback"></div>' +
        '<button class="btn btn-primary btn-sm hidden" id="s-check">Check answer</button>' +
      '</div>' +

      '<div class="keypad size-' + keypadSize + '" id="s-keypad">' + keys + '</div>' +

    '</section>';

    App.setView(html);

    const self = this;

    document.getElementById('s-close').onclick = function(){ self.confirmQuit(); };

    document.getElementById('s-check').onclick = function(){ self.checkAnswer(true); };

    document.getElementById('s-keypad').addEventListener('click', function(e){
      const key = e.target.closest('.key');
      if (!key) return;
      self.onKeyPress(key.getAttribute('data-key'));
    });

    this.updateChips();
  },

  /* ---------- LOAD ONE QUESTION ---------- */
  loadQuestion: function(){
    const d = this.data;
    const q = d.questions[d.index];

    this.typed = '';
    this.checking = false;

    document.getElementById('s-label').textContent = q.label || 'Find the value';

    const qText = document.getElementById('s-question');
    qText.textContent = q.q;
    qText.classList.remove('blurred');

    const box = document.getElementById('s-answer');
    box.className = 'answer-box';
    box.innerHTML = '<span class="placeholder">Your answer</span>';

    document.getElementById('s-feedback').textContent = '';
    document.getElementById('s-count').textContent = 'Question ' + (d.index + 1) + ' of ' + d.count;
    document.getElementById('s-bar').style.width = Math.round((d.index / d.count) * 100) + '%';

    const checkBtn = document.getElementById('s-check');
    if (DB.settings.autoCheck) checkBtn.classList.add('hidden');
    else checkBtn.classList.remove('hidden');

    clearInterval(this.timerId);
    clearTimeout(this.memTimer);
    document.getElementById('s-timer').textContent = '0:00';

    const keypad = document.getElementById('s-keypad');
    const self = this;

    if (d.memory){
      /* show the question for 2 seconds, then blur it */
      this.locked = true;
      keypad.classList.add('locked');
      this.memTimer = setTimeout(function(){
        qText.classList.add('blurred');
        self.locked = false;
        keypad.classList.remove('locked');
        self.startQuestionTimer();
      }, 2000);
    } else {
      this.locked = false;
      keypad.classList.remove('locked');
      this.startQuestionTimer();
    }
  },

  /* ---------- TIMER ---------- */
  startQuestionTimer: function(){
    const self = this;
    this.qStart = Date.now();
    clearInterval(this.timerId);
    document.getElementById('s-timer').textContent = '0:00';

    this.timerId = setInterval(function(){
      const el = document.getElementById('s-timer');
      if (!el) return;
      el.textContent = fmtClock(Date.now() - self.qStart);
    }, 250);
  },

  /* ---------- CHIPS ---------- */
  updateChips: function(){
    const d = this.data;
    const el = document.getElementById('s-chips');
    if (!el) return;
    el.innerHTML =
      '<span class="chip">Combo ' + d.combo + '</span>' +
      '<span class="chip">XP ' + d.xp + '</span>' +
      '<span class="chip">Target 5 s</span>';
  },

  /* ---------- KEYPAD ---------- */
  onKeyPress: function(key){
    if (this.locked || this.checking) return;

    if (key === 'back'){
      this.typed = this.typed.slice(0, -1);
    } else if (key === '.'){
      if (this.typed.indexOf('.') !== -1) return;
      this.typed = this.typed === '' ? '0.' : this.typed + '.';
    } else {
      if (this.typed.length >= 10) return;
      if (this.typed === '0') this.typed = key;
      else this.typed += key;
    }

    this.paintAnswer();
    haptic(7);
    sfxTap();

    if (DB.settings.autoCheck) this.maybeAutoCheck();
  },

  paintAnswer: function(){
    const box = document.getElementById('s-answer');
    if (!box) return;
    if (this.typed === ''){
      box.innerHTML = '<span class="placeholder">Your answer</span>';
    } else {
      box.innerHTML = '<span>' + esc(this.typed) + '</span>';
    }
  },

  /* auto check when the typed length matches the answer length */
  maybeAutoCheck: function(){
    const q = this.data.questions[this.data.index];
    const needed = fmtNum(q.a).length;
    if (this.typed.length >= needed) this.checkAnswer(false);
  },

  /* ---------- CHECK ANSWER ---------- */
    checkAnswer: function(manual){
    if (this.checking) return;

    if (this.typed === ''){
      if (manual) toast('Type an answer first');
      return;
    }

    const d = this.data;
    const q = d.questions[d.index];
    const elapsed = Date.now() - this.qStart;

    const value = parseFloat(this.typed);
    const isRight = isFinite(value) && Math.abs(value - q.a) < 0.005;

    this.checking = true;
    clearInterval(this.timerId);

    const box = document.getElementById('s-answer');
    const feedback = document.getElementById('s-feedback');
    box.classList.remove('correct', 'wrong');

    if (isRight){
      d.correct++;
      d.combo++;
      if (d.combo > d.bestCombo) d.bestCombo = d.combo;

      let gained = 10;
      if (elapsed < 5000) gained += 5;
      d.xp += gained;
      addXP(gained);

      box.classList.add('correct');
      box.innerHTML = '<span>' + esc(this.typed) + '</span>' + icon('check');
      feedback.textContent = 'Correct. Next question in a moment.';

      sfxCorrect();
      haptic(16);

      /* answered a mistake correctly, so remove it from the list */
      if (d.topicId === 'mistakes') removeMistake(q.q);
    } else {
      d.combo = 0;

      box.classList.add('wrong');
      box.innerHTML = '<span>' + esc(fmtNum(q.a)) + '</span>';
      feedback.textContent = 'Correct answer is ' + fmtNum(q.a) + '. Next in a moment.';

      sfxWrong();
      haptic([14, 40, 14]);

      addMistake({
        q: q.q,
        a: q.a,
        label: q.label || 'Find the value',
        topicId: d.topicId,
        day: todayKey()
      });
    }

    d.results.push({ right: isRight, ms: elapsed });

    const topicForStats = (d.topicId === 'mistakes')
      ? ((q.topicId) ? q.topicId : 'basics')
      : d.topicId;

    recordAnswer(topicForStats, isRight, elapsed);
    this.updateChips();

    const self = this;
    setTimeout(function(){ self.nextQuestion(); }, 1000);
  },

  /* ---------- NEXT ---------- */
  nextQuestion: function(){
    const d = this.data;
    d.index++;
    if (d.index >= d.count){
      this.finish();
      return;
    }
    this.loadQuestion();
  },

  /* ---------- QUIT ---------- */
  confirmQuit: function(){
    const self = this;
    openDialog('End session?', 'Your unfinished session will stop here.', [
      { label: 'Keep going' },
      {
        label: 'End session',
        primary: true,
        onClick: function(){ self.stop(); }
      }
    ]);
  },

  stop: function(){
    this.active = false;
    clearInterval(this.timerId);
    clearTimeout(this.memTimer);
    App.go('home');
  },

  /* ---------- FINISH ---------- */
  finish: function(){
    clearInterval(this.timerId);
    clearTimeout(this.memTimer);

    const d = this.data;
    this.active = false;

    finishSession();
    sfxFinish();
    haptic(30);

    App.screen = 'result';
    renderNav(null);
    this.renderResult();
  },

  renderResult: function(){
    const d = this.data;
    const total = d.results.length || 1;
    const accuracy = Math.round((d.correct / total) * 100);

    let totalMs = 0;
    d.results.forEach(function(r){ totalMs += r.ms; });
    const avgMs = d.results.length ? totalMs / d.results.length : 0;

    const self = this;

    const html =
    '<section class="screen">' +
      '<div class="result-screen">' +

        '<div class="result-score">' +
          '<div class="big">' + d.correct + ' / ' + d.results.length + '</div>' +
          '<div class="sub">' + esc(d.topicName) + ' session complete</div>' +
        '</div>' +

        '<div class="result-grid">' +
          '<div class="result-cell">' +
            '<div class="lbl">Accuracy</div>' +
            '<div class="val">' + accuracy + '%</div>' +
          '</div>' +
          '<div class="result-cell">' +
            '<div class="lbl">Avg speed</div>' +
            '<div class="val">' + fmtSeconds(avgMs) + '</div>' +
          '</div>' +
          '<div class="result-cell">' +
            '<div class="lbl">XP earned</div>' +
            '<div class="val">' + d.xp + '</div>' +
          '</div>' +
        '</div>' +

        '<div style="height:6px"></div>' +

        '<button class="btn btn-primary btn-full" id="again-btn">Practice again</button>' +
        '<button class="btn btn-ghost btn-full" id="home-btn">Home</button>' +

      '</div>' +
    '</section>';

    App.setView(html);

    document.getElementById('again-btn').onclick = function(){
      if (self.lastOpts) self.start(self.lastOpts);
    };

    document.getElementById('home-btn').onclick = function(){ App.go('home'); };
  }
};