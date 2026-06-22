// ═══════════════════════════════════════════════
//  MODULES · FILTER & SEARCH
//  Filtro por tipo y búsqueda de texto sobre la
//  lista de registros del proyecto activo.
// ═══════════════════════════════════════════════

let _activeFilter='all';
let _searchOpen=false;

function toggleListSearch(){
  if(_searchOpen){closeSearchBar();return;}
  _searchOpen=true;
  const bar=document.getElementById('list-search-fixed');
  bar.classList.add('open');
  document.getElementById('btn-search-toggle').classList.add('active');
  setTimeout(()=>document.getElementById('list-search-input').focus(),200);
}
function toggleListFilter(){openFilterSheet();}
function openFilterSheet(){
  const bd=document.getElementById('filter-sheet-backdrop');
  const sh=document.getElementById('filter-sheet');
  bd.style.opacity='1';bd.style.pointerEvents='auto';
  sh.style.transform='translateX(-50%) translateY(0)';
  document.getElementById('btn-filter-toggle').classList.add('active');
}
function closeFilterSheet(){
  const bd=document.getElementById('filter-sheet-backdrop');
  const sh=document.getElementById('filter-sheet');
  bd.style.opacity='0';bd.style.pointerEvents='none';
  sh.style.transform='translateX(-50%) translateY(100%)';
  document.getElementById('btn-filter-toggle').classList.remove('active');
}
function fsSetFilter(tipo,btn){
  _activeFilter=tipo;
  document.querySelectorAll('.fs-opt').forEach(b=>{b.classList.remove('active');b.querySelector('.fso-check').innerHTML='';});
  btn.classList.add('active');
  btn.querySelector('.fso-check').innerHTML='<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round"><path d="M2.5 7l3 3 6-6"/></svg>';
  applyListFilters(); setTimeout(closeFilterSheet,160);
}
function setFilter(tipo,btn){
  _activeFilter=tipo;
  document.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));
  btn.classList.add('active'); applyListFilters();
}
function applyListFilters(){
  const q=(document.getElementById('list-search-input')?.value||'').toLowerCase().trim();
  document.querySelectorAll('.entry-card').forEach(card=>{
    const entryId=card.id.replace('entry-','');
    const e=entries.find(x=>x.id===entryId); if(!e) return;
    const matchTipo=_activeFilter==='all'||e.tipo===_activeFilter;
    const searchStr=[e.desc,e.ref,e.dun,e.tipo,e.subtipo,e.comentario,e.fechaVenc,e.user].filter(Boolean).join(' ').toLowerCase();
    const matchSearch=!q||searchStr.includes(q);
    card.style.display=(matchTipo&&matchSearch)?'':'none';
  });
  updateListCount();
}
function updateListCount(){
  const countEl=document.getElementById('list-count'); if(!countEl)return;
  let visible=0;
  document.querySelectorAll('.entry-card').forEach(c=>{if(c.style.display!=='none')visible++;});
  const total=entries.length;
  countEl.textContent=(_activeFilter!=='all'||(document.getElementById('list-search-input')&&document.getElementById('list-search-input').value.trim()))?visible:total;
  countEl.style.display=total?'':'none';
}
