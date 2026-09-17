(function(){
  if (window.__etopInvitacionesSharePointPatch) return;
  window.__etopInvitacionesSharePointPatch = true;

  const URL_ESTUDIANTES_SEGUIMIENTO = 'https://default8fbed393d03b49f8be79cd5e1f590f.b2.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/06/workflows/7125e222e80a4f3cb819e7353360154a/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=LcQickXz3zG2Lk9SUoToNGLMZertcp6VbYFJjF6Wsas';

  const CORREOS_TUTOR_EXTRA = {
    'ORIETTA CORTES': 'tutoriaonline04@unab.cl'
  };

  let estudiantesSeguimientoInv = [];
  let nrcSeguimientoInv = '';

  function normalizar(v){
    return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();
  }

  function obtenerNrcInv(){
    try {
      const desdePadre = parent && parent !== window && parent.BUSQUEDA && parent.BUSQUEDA.nrc;
      if (desdePadre) return String(desdePadre).trim();
    } catch(e) {}

    const p = new URLSearchParams(location.search);
    const desdeUrl = p.get('nrc');
    if (desdeUrl) return String(desdeUrl).trim();

    const nombreCurso = document.getElementById('curso-search')?.value || document.getElementById('curso')?.value || '';
    try {
      if (Array.isArray(window.nrcsObCacheInv)) {
        const fila = window.nrcsObCacheInv.find(r => normalizar(r['nombre curso']) === normalizar(nombreCurso));
        if (fila?.nrc) return String(fila.nrc).trim();
      }
    } catch(e) {}
    return '';
  }

  function enriquecerDatosFinalesConNrc(){
    const nrc = obtenerNrcInv();
    try {
      if (typeof datosFinales === 'undefined' || !Array.isArray(datosFinales) || !datosFinales.length) return;
      datosFinales = datosFinales.map(fila => ({
        ...fila,
        'NRC_COD_CAL_FILTRO': String(fila?.NRC_COD_CAL_FILTRO || nrc || '').trim()
      }));
    } catch(e) {
      console.warn('No se pudo agregar NRC_COD_CAL_FILTRO a invitaciones:', e);
    }
  }

  const enviarSharePointOriginal = window.enviarSharePoint;
  const enviarSharePointMiguelOriginal = window.enviarSharePointMiguel;
  const enviarSharePointPabloDanielaOriginal = window.enviarSharePointPabloDaniela;

  if (typeof enviarSharePointOriginal === 'function') {
    window.enviarSharePoint = function(){
      enriquecerDatosFinalesConNrc();
      return enviarSharePointOriginal.apply(this, arguments);
    };
  }

  if (typeof enviarSharePointMiguelOriginal === 'function') {
    window.enviarSharePointMiguel = function(){
      enriquecerDatosFinalesConNrc();
      return enviarSharePointMiguelOriginal.apply(this, arguments);
    };
  }

  if (typeof enviarSharePointPabloDanielaOriginal === 'function') {
    window.enviarSharePointPabloDaniela = function(){
      enriquecerDatosFinalesConNrc();
      return enviarSharePointPabloDanielaOriginal.apply(this, arguments);
    };
  }

  function aplicarTutorInvLocal(){
    const nombre = normalizar(document.getElementById('nombre-tutor')?.value);
    const correo = document.getElementById('correo-tutor');
    if (correo && CORREOS_TUTOR_EXTRA[nombre]) correo.value = CORREOS_TUTOR_EXTRA[nombre];
  }
  window.aplicarTutorInvLocal = aplicarTutorInvLocal;

  async function cargarEstudiantesSeguimientoInv(silencioso=false){
    const status = document.getElementById('seguimiento-inv-status');
    const nrc = obtenerNrcInv();

    if (!nrc) {
      estudiantesSeguimientoInv = [];
      nrcSeguimientoInv = '';
      if (!silencioso && status) status.innerHTML = '<div class="alert info">ℹ️ Primero busca y selecciona arriba el NRC del curso de inducción y pulsa “Cargar datos del curso”.</div>';
      return false;
    }

    if (status) status.innerHTML = '<div class="alert info"><span class="spinner"></span> Consultando BASE/SEMAFORO_2.0 para <strong>'+nrc+'</strong>...</div>';

    try {
      const res = await fetch(URL_ESTUDIANTES_SEGUIMIENTO, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({nrc})
      });
      if (!res.ok) throw new Error('HTTP '+res.status+' '+res.statusText);
      const data = await res.json();
      const lista = Array.isArray(data?.estudiantes) ? data.estudiantes : [];
      estudiantesSeguimientoInv = lista.filter(e => String(e?.nrcCodCalFiltro||'').trim().toUpperCase() === nrc.toUpperCase());
      nrcSeguimientoInv = nrc;

      if (estudiantesSeguimientoInv.length) {
        const conCorreo = estudiantesSeguimientoInv.filter(e => String(e?.correoPersonal || e?.correoUnab || '').includes('@')).length;
        if (status) status.innerHTML = '<div class="alert success">✅ Se encontraron <strong>'+estudiantesSeguimientoInv.length+'</strong> estudiantes en BASE/SEMAFORO_2.0 para <strong>'+nrc+'</strong>. '+conCorreo+' tienen correo disponible. <strong>No necesita subir el Excel.</strong></div>';
        return true;
      }

      if (status) status.innerHTML = '<div class="alert info">⚠️ No se encontraron estudiantes en BASE/SEMAFORO_2.0 para <strong>'+nrc+'</strong>. Puede usar la nómina Excel como respaldo.</div>';
      return false;
    } catch(err) {
      estudiantesSeguimientoInv = [];
      nrcSeguimientoInv = '';
      if (status) status.innerHTML = '<div class="alert error">No fue posible consultar la base de seguimiento: '+err.message+'. Puede continuar usando el Excel de respaldo.</div>';
      console.error('Consulta estudiantes invitación:', err);
      return false;
    }
  }
  window.cargarEstudiantesSeguimientoInv = cargarEstudiantesSeguimientoInv;

  function prepararInterfaz(){
    const header = document.querySelector('.container .header');
    if (header) {
      const p = header.querySelector('p');
      if (p) p.textContent = 'Usa los estudiantes ya cargados en BASE/SEMAFORO_2.0 o, si aún no están disponibles, sube la nómina original como respaldo.';
    }

    if (!document.getElementById('seguimiento-inv-helper')) {
      const fileGroup = document.getElementById('drop-nomina')?.closest('.form-group');
      if (fileGroup) {
        const bloque = document.createElement('div');
        bloque.id = 'seguimiento-inv-helper';
        bloque.innerHTML = `
          <div class="helper">
            <strong>Fuente de estudiantes:</strong> primero se buscarán los estudiantes del NRC de inducción en <strong>BASE/SEMAFORO_2.0</strong>. Si aún no están cargados, puede usarse el Excel como respaldo. Los datos consultados desde SharePoint sólo se mantienen en memoria del navegador.
          </div>
          <div class="btn-row" style="margin-top:0;margin-bottom:.75rem;">
            <button class="btn primary" type="button" id="btn-buscar-seguimiento-inv">🔎 Buscar estudiantes en seguimiento</button>
          </div>
          <div id="seguimiento-inv-status"></div>`;
        fileGroup.parentNode.insertBefore(bloque, fileGroup);
        document.getElementById('btn-buscar-seguimiento-inv')?.addEventListener('click', () => cargarEstudiantesSeguimientoInv(false));
      }
    }

    const label = document.querySelector('#drop-nomina')?.closest('.form-group')?.querySelector('label');
    if (label) label.innerHTML = '📥 Nómina original <span style="font-weight:400;text-transform:none;color:#64748b;">(respaldo si no hay estudiantes en seguimiento)</span>';

    aplicarTutorInvLocal();
  }

  const procesarInvitacionesOriginal = window.procesarInvitaciones;

  window.procesarInvitaciones = async function(){
    const nrcActual = obtenerNrcInv();
    const puedeUsarSeguimiento = estudiantesSeguimientoInv.length > 0 && nrcSeguimientoInv && nrcActual && nrcSeguimientoInv.toUpperCase() === nrcActual.toUpperCase();

    if (!puedeUsarSeguimiento) {
      const r = await procesarInvitacionesOriginal.apply(this, arguments);
      enriquecerDatosFinalesConNrc();
      return r;
    }

    const resultEl = document.getElementById('resultado');
    const accionesEl = document.getElementById('acciones');
    accionesEl.style.display = 'none';
    resultEl.innerHTML = '<div class="alert info"><span class="spinner"></span> Construyendo invitaciones desde BASE/SEMAFORO_2.0...</div>';

    try {
      aplicarTutorInvLocal();
      const curso       = document.getElementById('curso').value || document.getElementById('curso-search').value.trim();
      const fechaInicio = document.getElementById('fecha-inicio').value;
      const link        = document.getElementById('link').value;
      const fechaSesion = document.getElementById('fecha-sesion').value;
      const hora        = document.getElementById('hora').value;
      const correoTutor = document.getElementById('correo-tutor').value;
      const nombreTutor = document.getElementById('nombre-tutor').value;

      const fechaHoraDisplay = fechaSesion ? formatSyncDisplay(fechaSesion, hora) : '';
      const formatoFechaHora = fechaSesion ? `${fechaSesion} ${hora}` : '';
      const fechaInicioDMY = fechaInicio ? formatDateDMY(fechaInicio) : '';
      const vistos = new Set();
      const salida = [];

      for (const e of estudiantesSeguimientoInv) {
        const nombre = String(e?.nombre || '').trim().toUpperCase();
        const correoEst = String(e?.correoPersonal || e?.correoUnab || '').trim().toLowerCase();
        const rut = String(e?.rut || '').trim().toUpperCase();
        if (!correoEst || !correoEst.includes('@')) continue;
        const clave = (rut || correoEst).toUpperCase();
        if (vistos.has(clave)) continue;
        vistos.add(clave);
        salida.push({
          'NOMBRE ESTUDIANTE': nombre,
          'RUT': rut,
          'CORREO ESTUDIANTE': correoEst,
          'CURSO DE INDUCCION': curso,
          'FECHA INICIO CURSO DE INDUCCION': fechaInicioDMY,
          'FECHA Y HORA SESION SINCRONICA': fechaHoraDisplay,
          'FORMATO FECHA HORA': formatoFechaHora,
          'LINK SESION SINCRONICA': link,
          'CORREO TUTOR': correoTutor,
          'NOMBRE TUTOR': nombreTutor.toUpperCase(),
          'NRC_COD_CAL_FILTRO': nrcActual
        });
      }

      if (!salida.length) {
        resultEl.innerHTML = '<div class="alert info">No se encontraron estudiantes con correo válido en BASE/SEMAFORO_2.0.</div>';
        return;
      }

      datosFinales = salida;
      resultEl.innerHTML = `<div class="alert success">🎉 Plantilla de invitación generada desde seguimiento. <span class="badge">${salida.length}</span> registros.</div>`;
      const tableDiv = document.createElement('div');
      resultEl.appendChild(tableDiv);
      renderTable(salida, tableDiv);
      accionesEl.style.display = 'flex';
    } catch(err) {
      resultEl.innerHTML = `<div class="alert error">Error: ${err.message}</div>`;
      console.error(err);
    }
  };

  prepararInterfaz();
  setTimeout(prepararInterfaz, 250);
})();
