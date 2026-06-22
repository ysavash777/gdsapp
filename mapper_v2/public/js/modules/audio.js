// ═══════════════════════════════════════════════
//  MODULES · AUDIO
//  Feedback sonoro: escaneo OK, no encontrado,
//  confirmación de registro, alerta, exportación.
// ═══════════════════════════════════════════════

let _audioCtx = null;

function _getCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function _note(freq, startTime, duration, gainPeak, type, ctx) {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = type; osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.start(startTime); osc.stop(startTime + duration + 0.01);
}

function soundFound() {
  const ctx = _getCtx(), t = ctx.currentTime;
  _note(880, t, .08, .13, 'sine', ctx);
  _note(1320, t + .07, .10, .10, 'sine', ctx);
}

function soundNotFound() {
  const ctx = _getCtx(), t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(280, t);
  o.frequency.exponentialRampToValueAtTime(120, t + .25);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(.28, t + .01);
  g.gain.exponentialRampToValueAtTime(.0001, t + .32);
  o.start(t); o.stop(t + .33);
}

function soundConfirm() {
  const ctx = _getCtx(), t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(2200, t);
  f.frequency.exponentialRampToValueAtTime(600, t + .18);
  o.connect(f); f.connect(g); g.connect(ctx.destination);
  o.type = 'sine';
  o.frequency.setValueAtTime(1040, t);
  o.frequency.exponentialRampToValueAtTime(820, t + .18);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(.13, t + .008);
  g.gain.exponentialRampToValueAtTime(.0001, t + .22);
  o.start(t); o.stop(t + .23);
}

function soundAlert() {
  const ctx = _getCtx(), t = ctx.currentTime;
  _note(480, t, .10, .14, 'triangle', ctx);
  _note(480, t + .18, .10, .10, 'triangle', ctx);
}

function soundExport() {
  const ctx = _getCtx(), t = ctx.currentTime;
  [523, 659, 784, 1047].forEach((f, i) => _note(f, t + i * .10, .18, .09, 'sine', ctx));
  _note(1047, t + .42, .28, .07, 'sine', ctx);
}
