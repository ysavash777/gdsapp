// ═══════════════════════════════════════════════
//  MODULES · ENTRY SHEET
//  El bottom sheet de captura: procesa el código
//  escaneado/ingresado, muestra el producto encontrado
//  y arma el formulario (tipo, subtipo, fecha, comentario,
//  cantidad) hasta confirmar el registro.
// ═══════════════════════════════════════════════

function processCode(code) {
  const trimmed = String(code).trim().replace(/[^0-9a-zA-Z\-]/g, '');
  if (!trimmed) return;
  const now = Date.now();
  if (trimmed === lastCode && now - lastCodeTime < 2500) return;
  lastCode = trimmed; lastCodeTime = now;
  const product = lookupProduct(trimmed);
  currentProduct = product; currentTipo = null; currentRotura = null;
  if (!product) { soundNotFound(); sheetOpen(null, trimmed); }
  else { soundFound(); if (document.activeElement) document.activeElement.blur(); sheetOpen(product, trimmed); }
}

// ── Bottom sheet ─────────────────────────────────
const TIPO_LABELS = { unidades:'Unidades', rotura:'Rotura', vencido:'Vencido', otro:'Otro' };

function sheetOpen(product, rawCode) {
  closeSearchBar();
  if (product && scannerActive) stopScanner();
  const hdr = document.getElementById('sh-product-header');
  if (product) {
    const desc = product.desc || product.ref || rawCode;
    hdr.innerHTML = `
      <div class="sheet-product-found">
        <div class="spf-top">
          <div class="spf-icon-wrap"><svg viewBox="0 0 14 14" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 7l3 3 6-6"/></svg></div>
          <div class="spf-desc">${desc}</div>
          <button class="spf-close" onclick="sheetDismiss()"><svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 2l6 6M8 2l-6 6"/></svg></button>
        </div>
        <div class="spf-divider"></div>
        <div class="spf-grid">
          <div class="spf-cell"><span class="spf-cell-label">EAN</span><span class="spf-cell-value" title="${product.id||'—'}">${product.id||'—'}</span></div>
          <div class="spf-cell"><span class="spf-cell-label">Grupo</span><span class="spf-cell-value" title="${product.grupo||'—'}">${product.grupo||'—'}</span></div>
          <div class="spf-cell"><span class="spf-cell-label">Referencia</span><span class="spf-cell-value" title="${product.ref||'—'}">${product.ref||'—'}</span></div>
        </div>
      </div>`;
    document.getElementById('sh-tipo-section').style.display = '';
  } else {
    showToast(`Ref. no encontrada: ${rawCode}`, 'error');
    return;
  }
  ['sh-row-rotura','sh-row-fecha','sh-row-comentario'].forEach(id => document.getElementById(id).classList.remove('visible'));
  document.getElementById('sh-stock-section').style.display    = 'none';
  document.getElementById('sh-ubicaciones-section').style.display = 'none';
  document.getElementById('sh-qty-row').style.display  = 'none';
  document.getElementById('sh-qty-sep').style.display  = 'none';
  document.getElementById('sh-qty').value = '';
  document.getElementById('sh-comentario').value = '';
  shClearDate();
  ['unidades','rotura','vencido','otro'].forEach(t => document.getElementById('sh-btn-'+t).className = 'sh-tipo-btn');
  currentTipo=null; currentRotura=null;
  document.getElementById('entry-sheet-backdrop').classList.add('open');
  document.getElementById('entry-sheet').classList.add('open');
  if (product) renderStockSection(product.ref);
}

function sheetDismiss() {
  if (document.activeElement) document.activeElement.blur();
  document.getElementById('entry-sheet-backdrop').classList.remove('open');
  const sheet = document.getElementById('entry-sheet');
  sheet.classList.remove('open'); sheet.style.bottom='';
  currentProduct=null; currentTipo=null; currentRotura=null;
  lastCode=''; lastCodeTime=0;
  if (!scannerActive) startScanner();
}

function closeSearchBar() {
  if (!_searchOpen) return;
  _searchOpen=false;
  const bar=document.getElementById('list-search-fixed');
  bar.classList.remove('open'); bar.style.bottom='';
  document.getElementById('btn-search-toggle').classList.remove('active');
  document.getElementById('list-search-input').value='';
  applyListFilters();
}

function shSelectTipo(tipo) {
  currentTipo=tipo;
  ['unidades','rotura','vencido','otro'].forEach(t => {
    document.getElementById('sh-btn-'+t).className = t===tipo ? `sh-tipo-btn active-${t}` : 'sh-tipo-btn';
  });
  document.getElementById('sh-row-fecha').classList.toggle('visible', tipo==='unidades');
  document.getElementById('sh-row-rotura').classList.toggle('visible', tipo==='rotura');
  document.getElementById('sh-row-comentario').classList.toggle('visible', tipo==='otro');
  document.getElementById('sh-qty-row').style.display='';
  document.getElementById('sh-qty-sep').style.display='';
  const stockWrap=document.getElementById('sh-stock-wrap');
  const ubicWrap=document.getElementById('sh-ubicaciones-wrap');
  if (stockWrap) stockWrap.classList.add('collapsed');
  if (ubicWrap)  ubicWrap.classList.add('collapsed');
  if (tipo==='rotura') {
    if (lastRotura) shSelectRotura(lastRotura, false);
    else { currentRotura=null; ['sh-btn-idl','sh-btn-rappi'].forEach(id=>document.getElementById(id).className='sh-rotura-btn'); }
  }
  setTimeout(()=>{
    if (tipo==='unidades') document.getElementById('sh-seg-dd').focus();
    else if (tipo==='otro') document.getElementById('sh-comentario').focus();
    else document.getElementById('sh-qty').select();
  },60);
}

function shSelectRotura(sub, save=true) {
  currentRotura=sub; if (save) lastRotura=sub;
  document.getElementById('sh-btn-idl').className   = sub==='IDL'   ? 'sh-rotura-btn active idl'   : 'sh-rotura-btn';
  document.getElementById('sh-btn-rappi').className = sub==='RAPPI' ? 'sh-rotura-btn active rappi' : 'sh-rotura-btn';
}

function shClearDate() {
  ['sh-seg-dd','sh-seg-mm','sh-seg-aa'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  const h=document.getElementById('sh-fecha'); if(h) h.value='';
}
function shSyncDate() {
  const dd=(document.getElementById('sh-seg-dd')||{}).value||'';
  const mm=(document.getElementById('sh-seg-mm')||{}).value||'';
  const aa=(document.getElementById('sh-seg-aa')||{}).value||'';
  const h=document.getElementById('sh-fecha');
  if(h) h.value=(dd&&mm&&aa&&aa.length===2)?`20${aa}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`:'';
}
(function initSheetDate(){
  function setup(el,maxLen,nextId){
    if(!el)return;
    el.addEventListener('input',()=>{
      let v=el.value.replace(/\D/g,'').slice(0,maxLen); el.value=v; shSyncDate();
      if(v.length===maxLen&&nextId){const n=document.getElementById(nextId);if(n)n.focus();}
    });
    el.addEventListener('keydown',e=>{
      if(e.key==='Backspace'&&el.value===''){const pm={'sh-seg-mm':'sh-seg-dd','sh-seg-aa':'sh-seg-mm'};if(pm[el.id]){const p=document.getElementById(pm[el.id]);if(p)p.focus();}}
      if(e.key==='Enter') shConfirm();
    });
  }
  setup(document.getElementById('sh-seg-dd'),2,'sh-seg-mm');
  setup(document.getElementById('sh-seg-mm'),2,'sh-seg-aa');
  setup(document.getElementById('sh-seg-aa'),2,null);
  const qEl=document.getElementById('sh-qty');
  if(qEl) qEl.addEventListener('keydown',e=>{if(e.key==='Enter')shConfirm();});
  const cEl=document.getElementById('sh-comentario');
  if(cEl) cEl.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();shConfirm();}});
})();

async function shConfirm() {
  if (!currentProduct||!currentTipo) return;
  if (currentTipo==='rotura'&&!currentRotura) { showToast('Seleccione IDL o RAPPI','warn'); return; }
  if (document.activeElement) document.activeElement.blur();
  const qty       = Math.max(1, parseInt(document.getElementById('sh-qty').value)||1);
  const fechaVenc = currentTipo==='unidades' ? document.getElementById('sh-fecha').value : null;
  const subtipo   = currentTipo==='rotura'   ? currentRotura : null;
  const comentario= currentTipo==='otro'     ? document.getElementById('sh-comentario').value.trim() : null;
  const entry = {
    id: uid(), ts: new Date().toISOString(),
    ref: currentProduct.ref, dun: currentProduct.dun,
    desc: currentProduct.desc, tipo: currentTipo,
    subtipo, fechaVenc, comentario, qty,
    user: currentUser
  };
  soundConfirm();
  sheetDismiss();
  await saveEntry(entry);
  // SSE will update the list
}

// legacy stubs
function renderProductCard(){}
function fitDescription(){}
function setActionButtonsEnabled(){}
function selectTipo(t){ shSelectTipo(t); }
function selectRotura(s,sv){ shSelectRotura(s,sv); }
function dismissProductCard(){ sheetDismiss(); }
function confirmEntry(){ shConfirm(); }
