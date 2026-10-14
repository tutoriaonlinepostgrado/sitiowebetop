/* ETOP TEST01 - Recuperación local y segura desde Excel BASESEMAFORO_20 */
(()=>{
"use strict";
const normalize=v=>String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toUpperCase();
const rutKey=v=>String(v??"").replace(/[^0-9Kk]/g,"").toUpperCase();
const escapeHTML=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const get=(r,...names)=>{for(const name of names){if(r[name]!==undefined&&String(r[name]??"").trim())return String(r[name]).trim()}return""};
let source=new Map(), loaded=false, fileName="";
const bar=document.querySelector(".ri-testbar");
if(!bar)return;
const upload=document.createElement("label");
upload.style.cssText="display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap";
upload.innerHTML='<strong>📂 Base Semáforo (Excel):</strong> <input id="recExcel" type="file" accept=".xlsx,.xls" style="max-width:190px;font-size:10px"><span id="recExcelStatus">Sin archivo</span>';
bar.insertBefore(upload,document.getElementById("recCount"));
const downloadScript=()=>new Promise((resolve,reject)=>{
 if(window.XLSX)return resolve();
 const script=document.createElement("script");script.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
 script.onload=resolve;script.onerror=()=>reject(Error("No se pudo cargar el lector XLSX."));document.head.appendChild(script);
});
document.getElementById("recExcel").addEventListener("change",async event=>{
 const file=event.target.files?.[0],status=document.getElementById("recExcelStatus");
 source=new Map();loaded=false;fileName="";
 if(!file){status.textContent="Sin archivo";return}
 status.textContent="Leyendo archivo…";
 try{
 await downloadScript();
 const workbook=XLSX.read(await file.arrayBuffer(),{type:"array",cellDates:true});
 const worksheet=workbook.Sheets[workbook.SheetNames[0]];
 const rows=XLSX.utils.sheet_to_json(worksheet,{defval:"",raw:false});
 const head=rows[0]||{};
 if(!("RUT" in head)||!("NRC_COD_CAL_FILTRO" in head)||!("CORREO_UNAB" in head))throw Error("El Excel debe tener RUT, NRC_COD_CAL_FILTRO y CORREO_UNAB.");
 let accepted=0;
 for(const record of rows){
 const nrc=normalize(get(record,"NRC_COD_CAL_FILTRO","CURSO_NRC")),rut=rutKey(record.RUT),email=get(record,"CORREO_UNAB").toLowerCase();
 if(!nrc||!rut||!email.includes("@"))continue;
 if(!source.has(nrc))source.set(nrc,new Map());
 const students=source.get(nrc);
 if(!students.has(rut)){
 students.set(rut,{rut:get(record,"RUT"),name:get(record,"NOMBRE"),email,estado:get(record,"ESTADO_EST.","ESTADO_EST"),personal:get(record,"CORREO_PERSONAL","Columna7")});accepted++;
 }
 }
 if(!accepted)throw Error("No se identificaron estudiantes válidos.");
 loaded=true;fileName=file.name;
 status.textContent=accepted.toLocaleString("es-CL")+" registros · "+source.size+" NRC";
 const panel=document.getElementById("recResults");panel.style.display="none";panel.replaceChildren();
 }catch(e){status.textContent="Error: "+e.message;}
});
const review=document.getElementById("recReview");
review.addEventListener("click",event=>{
 event.stopImmediatePropagation();
 const panel=document.getElementById("recResults");panel.style.display="block";
 if(!loaded){panel.textContent="Primero cargue el Excel de Base Semáforo.";return}
 const selected=(typeof cursos!=="undefined"?cursos:[]).filter(c=>recoverySelected.has(String(c.nrc)));
 if(!selected.length){panel.textContent="Seleccione uno o más NRC de destino.";return}
 const results=selected.map(dest=>{
 const prior=recCandidate(dest).filter(x=>source.has(normalize(x.nrc))&&source.get(normalize(x.nrc)).size);
 const previous=prior[0]||null;
 const students=previous?[...source.get(normalize(previous.nrc)).values()]:[];
 const existing=source.get(normalize(dest.nrc))||new Map();
 const excluded=students.filter(x=>/RETIRO|RETIRADO/.test(normalize(x.estado)));
 const proposed=students.filter(x=>!/RETIRO|RETIRADO/.test(normalize(x.estado))&&!existing.has(rutKey(x.rut)));
 return {dest,previous,prior,students,excluded,proposed,existing};
 });
 window.__recTestResults=results;
 panel.innerHTML='<div class="notice"><b>Vista previa local:</b> '+escapeHTML(fileName)+'. Los datos permanecen en el navegador, no se publican en GitHub ni se envían a SharePoint. La información es una fotografía del Excel: confirme la inscripción antes de usarla.</div>'+
 '<div style="overflow:auto"><table><thead><tr><th>NRC destino</th><th>NRC de origen</th><th>Alumnos origen</th><th>Ya en destino</th><th>Retiro por revisar</th><th>Propuestos</th><th>Alternativas</th><th>Excel</th></tr></thead><tbody>'+
 results.map((r,i)=>'<tr><td>'+escapeHTML(r.dest.nrc)+'</td><td>'+escapeHTML(r.previous?.nrc||"No detectado")+'</td><td>'+r.students.length+'</td><td>'+r.existing.size+'</td><td>'+r.excluded.length+'</td><td>'+r.proposed.length+'</td><td>'+escapeHTML(r.prior.slice(1,3).map(x=>x.nrc).join(", ")||"—")+'</td><td>'+(r.previous?'<button type="button" data-rec-export="'+i+'">Descargar Excel</button>':"Revisar")+'</td></tr>').join("")+
 '</tbody></table></div>';
 },true);
document.getElementById("recResults").addEventListener("click",event=>{
 const button=event.target.closest("button[data-rec-export]");if(!button)return;
 const result=window.__recTestResults?.[Number(button.dataset.recExport)];
 if(!result?.previous||!result.proposed.length){alert("Sin estudiantes propuestos para descargar.");return}
 const dest=result.dest,id=String(dest.nrc),match=id.match(/^(.+)_(\d{6})$/);
 const output=result.proposed.map(p=>({
 PERIODO:match?.[2]||"",NRC_COD:match?.[1]||id,NOMBRE_CURSO:dest["nombre curso"]||"",FECHA_INICIO:fechaISO(dest["fecha inicio"]),RUT:p.rut,NOMBRE:p.name,CORREO_UNAB:p.email,Columna7:p.personal||"",NRC_COD_CAL_FILTRO:id
 }));
 const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(output),"Estudiantes");
 XLSX.writeFile(wb,"NOMINA_REVISION_"+id.replace(/[^A-Za-z0-9_-]/g,"_")+".xlsx");
});
})();