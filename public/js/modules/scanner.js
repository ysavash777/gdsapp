// ═══════════════════════════════════════════════
//  MODULES · SCANNER
//  Escaneo de código de barras por cámara. Usa la
//  API nativa BarcodeDetector cuando está disponible
//  (más rápida) y cae a QuaggaJS como fallback.
// ═══════════════════════════════════════════════

let _stream = null;
let _rafId = null;
let _nativeDetector = null;

function _isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

async function _createVideo(stream) {
  const container = document.getElementById('interactive');
  container.innerHTML = '';
  const video = document.createElement('video');
  video.setAttribute('playsinline', ''); video.setAttribute('autoplay', ''); video.setAttribute('muted', '');
  video.muted = true; video.playsInline = true; video.srcObject = stream;
  video.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
  container.appendChild(video);
  await new Promise((resolve, reject) => { video.onloadedmetadata = resolve; video.onerror = reject; setTimeout(resolve, 3000); });
  try { await video.play(); } catch (playErr) {
    await new Promise((resolve) => {
      const retry = () => { video.play().catch(() => {}); resolve(); };
      document.addEventListener('touchstart', retry, { once: true });
      document.addEventListener('click', retry, { once: true });
    });
  }
  return video;
}

async function startScanner() {
  const wrap = document.getElementById('scanner-wrap');
  const hint = document.getElementById('scanner-toggle-hint');
  const ios  = _isIOS();

  if (window.BarcodeDetector) {
    try {
      const supported     = await BarcodeDetector.getSupportedFormats().catch(() => []);
      const wantedFormats  = ['ean_13', 'ean_8', 'itf', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'];
      const formats        = supported.length ? supported.filter(f => wantedFormats.includes(f)) : wantedFormats.slice(0, -1);
      _nativeDetector = new BarcodeDetector({ formats: formats.length ? formats : ['ean_13', 'ean_8', 'itf', 'code_128'] });
      _stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      const video = await _createVideo(_stream);
      scannerActive = true;
      if (wrap) { wrap.classList.remove('scanner-off'); wrap.classList.add('scanner-active'); }
      if (hint) hint.textContent = 'Toque para pausar';
      const useImageBitmap = ios && typeof createImageBitmap === 'function';
      const canvas = document.createElement('canvas'); const ctx2d = canvas.getContext('2d');
      async function detectLoop() {
        if (!scannerActive) return;
        if (video.readyState >= video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
          try {
            let source;
            if (useImageBitmap) { source = await createImageBitmap(video); }
            else { canvas.width = video.videoWidth; canvas.height = video.videoHeight; ctx2d.drawImage(video, 0, 0); source = canvas; }
            const barcodes = await _nativeDetector.detect(source);
            if (useImageBitmap && source.close) source.close();
            for (const b of barcodes) {
              const code = b.rawValue;
              if (code) {
                const sf = document.querySelector('.scan-frame');
                if (sf) { sf.style.borderColor = 'var(--success)'; setTimeout(() => { sf.style.borderColor = 'var(--accent)'; }, 300); }
                processCode(code);
              }
            }
          } catch (_) { /* frame ilegible, seguir intentando */ }
        }
        _rafId = setTimeout(detectLoop, ios ? 300 : 200);
      }
      detectLoop(); return;
    } catch (e) {
      if (_stream) { _stream.getTracks().forEach(t => t.stop()); _stream = null; }
    }
  }

  // ── Fallback: QuaggaJS ──────────────────────────
  try { Quagga.offDetected(); } catch (_) {}
  const workers = ios ? 0 : (navigator.hardwareConcurrency ? Math.min(navigator.hardwareConcurrency, 4) : 2);
  Quagga.init({
    inputStream: { name: 'Live', type: 'LiveStream', target: document.getElementById('interactive'), constraints: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } },
    locator: { patchSize: 'medium', halfSample: !ios },
    numOfWorkers: workers, frequency: ios ? 8 : 12,
    decoder: { readers: ['ean_reader', 'ean_8_reader', 'itf_reader', 'code_128_reader', 'code_39_reader', 'upc_reader', 'upc_e_reader'], multiple: false },
    locate: true
  }, err => {
    if (err) { if (wrap) wrap.classList.add('scanner-off'); if (hint) hint.textContent = 'Toque para activar'; return; }
    Quagga.start(); scannerActive = true;
    if (wrap) { wrap.classList.remove('scanner-off'); wrap.classList.add('scanner-active'); }
    if (hint) hint.textContent = 'Toque para pausar';
    Quagga.onDetected(result => {
      const code = result && result.codeResult && result.codeResult.code; if (!code) return;
      const errs = (result.codeResult.decodedCodes || []).filter(x => x.error !== undefined).map(x => x.error);
      const avg = errs.length ? errs.reduce((a, b) => a + b, 0) / errs.length : 1;
      if (avg > 0.3) return;
      const sf = document.querySelector('.scan-frame');
      if (sf) { sf.style.borderColor = 'var(--success)'; setTimeout(() => { sf.style.borderColor = 'var(--accent)'; }, 300); }
      processCode(code);
    });
  });
}

function stopScanner() {
  scannerActive = false;
  if (_rafId) { clearTimeout(_rafId); _rafId = null; }
  if (_stream) { _stream.getTracks().forEach(t => t.stop()); _stream = null; }
  _nativeDetector = null;
  const container = document.getElementById('interactive'); if (container) container.innerHTML = '';
  try { Quagga.offDetected(); Quagga.stop(); } catch (_) {}
  const wrap = document.getElementById('scanner-wrap');
  if (wrap) { wrap.classList.add('scanner-off'); wrap.classList.remove('scanner-active'); }
  const hint = document.getElementById('scanner-toggle-hint'); if (hint) hint.textContent = 'Toque para activar';
}

function toggleScanner() {
  if (scannerActive) { stopScanner(); }
  else { const hint = document.getElementById('scanner-toggle-hint'); if (hint) hint.textContent = 'Iniciando...'; startScanner(); }
}
