// ═══════════════════════════════════════════════
//  MODULES · STOCK PREFIX CONFIG
//  Configuración de prefijos de ubicación que
//  determinan qué filas cuentan como "stock ficticio".
// ═══════════════════════════════════════════════

let _spcTags=[];
function openStockPrefixConfig(){
  const p=document.getElementById('settings-panel-wrap');if(p)p.remove();
  _spcTags=[...stockPrefixes];
  document.body.insertAdjacentHTML('beforeend',`
    <div class="dialog-backdrop" id="stock-prefix-dialog" onclick="closeStockPrefixIfOutside(event)">
      <div class="dialog-box" style="max-width:340px">
        <div class="dialog-icon-wrap safe"><svg viewBox="0 0 20 20" fill="none" stroke="#6366f1" stroke-width="1.8"><rect x="3" y="4" width="14" height="12" rx="2"/><path d="M3 8h14M7 4V3M13 4V3M7 12h6" stroke-linecap="round"/></svg></div>
        <h3 style="margin-bottom:4px">Prefijos de Stock</h3>
        <p style="margin-bottom:12px;font-size:12px;color:var(--muted)">Las ubicaciones que comiencen con estos prefijos aparecerán en el stock ficticio.</p>
        <div class="spc-tag-area" id="spc-tag-area" onclick="document.getElementById('spc-input').focus()">
          <span id="spc-tags-render"></span>
          <input id="spc-input" class="spc-tag-input" placeholder="Escribí y presioná Enter…" onkeydown="spcKeydown(event)" oninput="spcInput(event)" autocomplete="off" autocorrect="off" spellcheck="false"/>
        </div>
        <div class="spc-hint"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="6" cy="6" r="5"/><path d="M6 5v4M6 3.5v.5"/></svg>Enter, coma o espacio para agregar · Tap ✕ para eliminar</div>
        <div style="margin-top:10px;font-size:10px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Sugeridos</div>
        <div class="spc-defaults">${DEFAULT_STOCK_PREFIXES.map(p=>`<span class="spc-default-chip" onclick="spcAddTag('${p}')">${p}</span>`).join('')}</div>
        <div class="dialog-btns" style="margin-top:14px">
          <button class="d-cancel" onclick="closeStockPrefixDialog()">Cancelar</button>
          <button class="d-confirm safe" onclick="saveStockPrefixConfig()">Guardar</button>
        </div>
      </div>
    </div>`);
  spcRenderTags();
}
function spcRenderTags(){
  const r=document.getElementById('spc-tags-render');
  if(!r)return;
  r.innerHTML=_spcTags.map((t,i)=>`<span class="spc-tag">${t}<button class="spc-tag-del" onclick="spcRemoveTag(${i})"><svg viewBox="0 0 8 8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M1 1l6 6M7 1L1 7"/></svg></button></span>`).join('');
}
function spcAddTag(val){
  const v=val.trim().toLowerCase();
  if(!v||_spcTags.includes(v))return;
  _spcTags.push(v); spcRenderTags();
  const inp=document.getElementById('spc-input');if(inp)inp.value='';
}
function spcRemoveTag(i){_spcTags.splice(i,1);spcRenderTags();}
function spcKeydown(e){
  if((e.key==='Enter'||e.key===',')){e.preventDefault();spcAddTag(e.target.value);}
  else if(e.key==='Backspace'&&e.target.value===''){spcRemoveTag(_spcTags.length-1);}
}
function spcInput(e){
  const v=e.target.value;
  if(v.includes(',')||v.endsWith(' ')){
    const parts=v.split(/[, ]+/).map(s=>s.trim()).filter(Boolean);
    const toAdd=v.endsWith(' ')||v.endsWith(',')?parts:parts.slice(0,-1);
    const remaining=v.endsWith(' ')||v.endsWith(',')?'':parts[parts.length-1];
    toAdd.forEach(spcAddTag); e.target.value=remaining;
  }
}
function closeStockPrefixIfOutside(e){if(e.target.id==='stock-prefix-dialog')closeStockPrefixDialog();}
function closeStockPrefixDialog(){const d=document.getElementById('stock-prefix-dialog');if(d)d.remove();}
function saveStockPrefixConfig(){
  const inp=document.getElementById('spc-input');
  if(inp&&inp.value.trim())spcAddTag(inp.value.trim());
  stockPrefixes=_spcTags.length?[..._spcTags]:[...DEFAULT_STOCK_PREFIXES];
  saveStockPrefixes(stockPrefixes);
  closeStockPrefixDialog();
  showToast('Prefijos guardados','success');
}
