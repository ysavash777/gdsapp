// ═══════════════════════════════════════════════
//  MODULES · EXPORT
//  Exportación de los registros del proyecto activo
//  a un archivo .xlsx con una hoja por tipo.
// ═══════════════════════════════════════════════

function exportXLSX(){
  if(!entries.length){showToast('No hay registros para exportar','warn');return;}
  const date=new Date().toISOString().slice(0,10);
  document.body.insertAdjacentHTML('beforeend',`
    <div class="dialog-backdrop filename-dialog" id="filename-dialog">
      <div class="dialog-box">
        <h3>Nombre del archivo</h3><p>El archivo se exportará en formato .xlsx</p>
        <input class="filename-input" id="filename-input" type="text" value="${activeProjectName||'mapeo'}_${date}" autocomplete="off"/>
        <div class="dialog-btns">
          <button class="d-cancel" onclick="closeFilenameDialog()">Cancelar</button>
          <button class="d-confirm safe" onclick="doExport()">Exportar</button>
        </div>
      </div>
    </div>`);
  const inp=document.getElementById('filename-input'); inp.focus(); inp.select();
  inp.addEventListener('keydown',e=>{if(e.key==='Enter')doExport();});
}
function closeFilenameDialog(){const d=document.getElementById('filename-dialog');if(d)d.remove();}
function doExport(){
  const inp=document.getElementById('filename-input');
  const name=(inp?inp.value.trim():'')||`mapeo_${new Date().toISOString().slice(0,10)}`;
  closeFilenameDialog();
  const headerFill={patternType:'solid',fgColor:{rgb:'1E3A5F'}};
  const headerFont={bold:true,color:{rgb:'FFFFFF'},sz:11};
  const headerAlign={horizontal:'center',vertical:'center',wrapText:true};
  const cellAlign={horizontal:'center',vertical:'center'};
  const border={style:'thin',color:{rgb:'B0C4DE'}};
  const allBorders={top:border,bottom:border,left:border,right:border};
  function hCell(v){return{v,t:'s',s:{fill:headerFill,font:headerFont,alignment:headerAlign,border:allBorders}};}
  function dCell(v,t='s'){return{v,t,s:{alignment:cellAlign,border:allBorders}};}
  function buildSheet(rows,cols){
    const ws={};const R=rows.length;const C=cols.length;
    cols.forEach((col,ci)=>{ws[XLSX.utils.encode_cell({r:0,c:ci})]=hCell(col.header);});
    rows.forEach((e,ri)=>{cols.forEach((col,ci)=>{ws[XLSX.utils.encode_cell({r:ri+1,c:ci})]=dCell(col.fn(e),col.type||'s');});});
    ws['!ref']=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:R,c:C-1}});
    ws['!cols']=cols.map(c=>({wch:c.w||18})); ws['!rows']=[{hpt:22}];
    return ws;
  }
  const wb=XLSX.utils.book_new();
  const unidades=entries.filter(e=>e.tipo==='unidades');
  if(unidades.length) XLSX.utils.book_append_sheet(wb,buildSheet(unidades,[{header:'Referencia',fn:e=>e.ref||'',w:18},{header:'Descripción',fn:e=>e.desc||'',w:38},{header:'Cantidad',fn:e=>e.qty,type:'n',w:12},{header:'Fecha Venc.',fn:e=>e.fechaVenc||'',w:14},{header:'Usuario',fn:e=>e.user||'',w:12}]),'Unidades');
  const roturaRappi=entries.filter(e=>e.tipo==='rotura'&&e.subtipo==='RAPPI');
  if(roturaRappi.length) XLSX.utils.book_append_sheet(wb,buildSheet(roturaRappi,[{header:'Referencia',fn:e=>e.ref||'',w:18},{header:'Descripción',fn:e=>e.desc||'',w:38},{header:'Cantidad',fn:e=>e.qty,type:'n',w:12},{header:'Responsable',fn:e=>e.subtipo||'',w:14},{header:'Usuario',fn:e=>e.user||'',w:12}]),'Rotura RAPPI');
  const roturaIdl=entries.filter(e=>e.tipo==='rotura'&&e.subtipo==='IDL');
  if(roturaIdl.length) XLSX.utils.book_append_sheet(wb,buildSheet(roturaIdl,[{header:'Referencia',fn:e=>e.ref||'',w:18},{header:'Descripción',fn:e=>e.desc||'',w:38},{header:'Cantidad',fn:e=>e.qty,type:'n',w:12},{header:'Responsable',fn:e=>e.subtipo||'',w:14},{header:'Usuario',fn:e=>e.user||'',w:12}]),'Rotura IDL');
  const vencido=entries.filter(e=>e.tipo==='vencido');
  if(vencido.length) XLSX.utils.book_append_sheet(wb,buildSheet(vencido,[{header:'Referencia',fn:e=>e.ref||'',w:18},{header:'Descripción',fn:e=>e.desc||'',w:38},{header:'Cantidad',fn:e=>e.qty,type:'n',w:12},{header:'Usuario',fn:e=>e.user||'',w:12}]),'Vencido');
  const otro=entries.filter(e=>e.tipo==='otro'||e.tipo==='bulto');
  if(otro.length) XLSX.utils.book_append_sheet(wb,buildSheet(otro,[{header:'Referencia',fn:e=>e.ref||'',w:18},{header:'Descripción',fn:e=>e.desc||'',w:38},{header:'Cantidad',fn:e=>e.qty,type:'n',w:12},{header:'Comentario',fn:e=>e.comentario||'',w:30},{header:'Usuario',fn:e=>e.user||'',w:12}]),'Otro');
  if(!wb.SheetNames.length){showToast('No hay registros para exportar','warn');return;}
  XLSX.writeFile(wb,name.endsWith('.xlsx')?name:name+'.xlsx');
  soundExport();
}
