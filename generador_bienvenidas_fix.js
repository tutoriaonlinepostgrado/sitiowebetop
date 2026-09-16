(function(){
  function obtenerDatosFinales(){
    try{
      return (typeof datosFinales !== 'undefined' && Array.isArray(datosFinales) && datosFinales.length) ? datosFinales : null;
    }catch(e){ return null; }
  }

  window.enviarSharePoint = async function(){
    const datos=obtenerDatosFinales();
    const spResult=document.getElementById('sp-result');
    if(!datos){
      if(spResult) spResult.innerHTML='<div class="alert error">No hay una tabla generada para enviar. Primero construya la plantilla.</div>';
      return;
    }
    if(spResult) spResult.innerHTML='<div class="alert info"><span class="spinner"></span> Enviando a SharePoint...</div>';
    const url='https://default8fbed393d03b49f8be79cd5e1f590f.b2.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/b5adeaa1a9f94afcbc70f296c3017b02/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=FcCHLTt4qfgvtdNJtyUSryjGMyJI2gQOvVfkG68eieI';
    try{
      const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(datos)});
      if(res.ok||res.status===202){
        if(spResult) spResult.innerHTML='<div class="alert success">✅ ¡Éxito! Datos enviados a SharePoint.</div>';
        document.getElementById('paso3')?.classList.add('visible');
      }else if(spResult) spResult.innerHTML='<div class="alert error">Error '+res.status+': '+res.statusText+'</div>';
    }catch(err){
      if(spResult) spResult.innerHTML='<div class="alert error">Error de red: '+err.message+'</div>';
    }
  };

  window.enviarSharePointMiguel = async function(){
    const datos=obtenerDatosFinales();
    const spResult=document.getElementById('sp-result-miguel');
    if(!datos){
      if(spResult) spResult.innerHTML='<div class="alert error">No hay una tabla generada para enviar. Primero construya la plantilla.</div>';
      return;
    }
    if(spResult) spResult.innerHTML='<div class="alert info"><span class="spinner"></span> Enviando a SharePoint Equipo Miguel...</div>';
    const url='https://default8fbed393d03b49f8be79cd5e1f590f.b2.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/8eb99019f23c4c28a0bdf0208ba3b54f/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=HuauXnxkP7IEAgj9HIcFgDmUUSC3tdejeJpCpjX-Ceg';
    try{
      const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(datos)});
      if(res.ok||res.status===202){
        if(spResult) spResult.innerHTML='<div class="alert success">✅ ¡Éxito! Datos enviados a SharePoint — Equipo Miguel.</div>';
        document.getElementById('paso3-miguel')?.classList.add('visible');
      }else if(spResult) spResult.innerHTML='<div class="alert error">Error '+res.status+': '+res.statusText+'</div>';
    }catch(err){
      if(spResult) spResult.innerHTML='<div class="alert error">Error de red: '+err.message+'</div>';
    }
  };

  window.enviarSharePointPabloDaniela = async function(){
    const datos=obtenerDatosFinales();
    const spResult=document.getElementById('sp-result-pablo-daniela');
    if(!datos){
      if(spResult) spResult.innerHTML='<div class="alert error">No hay una tabla generada para enviar. Primero construya la plantilla.</div>';
      return;
    }
    if(spResult) spResult.innerHTML='<div class="alert info"><span class="spinner"></span> Enviando a SharePoint Equipo Pablo_Daniela...</div>';
    const url='https://default8fbed393d03b49f8be79cd5e1f590f.b2.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/d040109474f04cebbc90300640607f30/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=35S4lnBFfc3aPPnEcX0P2g0DDpPMxCPvBeyLNZXjq7c';
    try{
      const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(datos)});
      if(res.ok||res.status===202){
        if(spResult) spResult.innerHTML='<div class="alert success">✅ ¡Éxito! Datos enviados a SharePoint — Equipo Pablo_Daniela.</div>';
        document.getElementById('paso3-pablo-daniela')?.classList.add('visible');
      }else if(spResult) spResult.innerHTML='<div class="alert error">Error '+res.status+': '+res.statusText+'</div>';
    }catch(err){
      if(spResult) spResult.innerHTML='<div class="alert error">Error de red: '+err.message+'</div>';
    }
  };

  window.buscarCurso = function(campo){
    const input=document.getElementById(campo+'-search');
    const dd=document.getElementById(campo+'-dropdown');
    const opts=document.getElementById(campo+'-options');
    if(!input||!dd||!opts) return;
    const q=input.value.trim().toLowerCase();
    if(!q||q.length<2){dd.style.display='none';return;}
    let fuente=[];
    try{
      if(typeof nrcsObData!=='undefined' && Array.isArray(nrcsObData) && nrcsObData.length) fuente=nrcsObData;
      else if(typeof nrcsData!=='undefined' && Array.isArray(nrcsData)) fuente=nrcsData;
    }catch(e){}
    const resultados=fuente.filter(r=>String(r.nrc||r.NRC||'').toLowerCase().includes(q)||String(r['nombre curso']||r.NOMBRE_CURSO||'').toLowerCase().includes(q)).slice(0,25);
    if(!resultados.length){dd.style.display='none';return;}
    opts.innerHTML='';
    resultados.forEach(r=>{
      const nrc=r.nrc||r.NRC||'';
      const nombre=r['nombre curso']||r.NOMBRE_CURSO||'';
      const div=document.createElement('div');
      div.style.cssText='padding:8px 12px;cursor:pointer;border-bottom:1px solid rgba(0,0,0,0.06);transition:background 0.1s;';
      div.onmouseenter=()=>div.style.background='#dbeafe';
      div.onmouseleave=()=>div.style.background='transparent';
      div.innerHTML='<span style="color:#1e40af;font-size:0.75rem;font-weight:700;font-family:monospace;">'+nrc+'</span><br><span style="color:#1e293b;font-size:0.82rem;">'+nombre+'</span>';
      div.onclick=()=>window.seleccionarCurso(campo,nrc,nombre);
      opts.appendChild(div);
    });
    dd.style.display='block';
  };

  window.seleccionarCurso = function(campo,nrc,nombre){
    const s=document.getElementById(campo+'-search');
    const h=document.getElementById(campo);
    const dd=document.getElementById(campo+'-dropdown');
    if(s) s.value=nombre;
    if(h) h.value=nombre;
    if(dd) dd.style.display='none';
  };
})();