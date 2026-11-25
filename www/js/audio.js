/* ============================================================
   SOUND (Web Audio beeps, no audio files) + vibration
   ============================================================ */
let audioCtxRef = null;

function getAudioCtx(){
  try {
    if (!audioCtxRef){
      const A = window.AudioContext || window.webkitAudioContext;
      if (!A) return null;
      audioCtxRef = new A();
    }
    if (audioCtxRef.state === 'suspended') audioCtxRef.resume();
    return audioCtxRef;
  } catch(e){ return null; }
}

/* one short beep */
function tone(freq, dur, type, vol, delay){
  if (!DB.settings.sound) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  const start = ctx.currentTime + (delay || 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(vol || 0.10, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.03);
}

function sfxTap(){ tone(640, 0.05, 'square', 0.035); }
function sfxCorrect(){ tone(680, 0.08, 'sine', 0.10, 0); tone(920, 0.12, 'sine', 0.10, 0.085); }
function sfxWrong(){ tone(190, 0.16, 'sawtooth', 0.07, 0); }
function sfxFinish(){ tone(523, 0.10, 'sine', 0.09, 0); tone(659, 0.10, 'sine', 0.09, 0.11); tone(784, 0.17, 'sine', 0.09, 0.22); }

/* vibrate if the user allowed it */
function haptic(ms){
  if (!DB.settings.haptics) return;
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch(e){}
}