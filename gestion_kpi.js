(() => {
  'use strict';

  const METRICAS_URL = 'metricas_estudiantes.json';
  const VISTAS_KPI = new Set(['CURSOS_ACTIVOS', 'CURSOS_CIERRE']);
  let metricasPorNrc = new Map();
  let metricasListas = false;
  let ultimaFirma = '';

  function norm(v) {
    return String(v ?? '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ').trim().toUpperCase();
  }

  // Clave NRC tolerante a espacios residuales del origen.
  // Ej.: 4136_MSPG005 _202582 y 4136_MSPG005_202582 deben ser el mismo curso.
  function nrcKey(v) {
    return String(v ?? '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/\s+/g, '')
      .trim();
  }

  function estadoObjetivo() {
    if (typeof vistaActual === 'undefined') return '';
    if (vistaActual === 'CURSOS_ACTIVOS') return 'ACTIVO';
    if (vistaActual === 'CURSOS_CIERRE') return 'EN CIERRE';
    return '';
  }

  function esEstadoVista(curso, objetivo) {
    const e = norm(curso?.estado).replace(/_/g, ' ');
    if (objetivo === 'ACTIVO') return e === 'ACTIVO';
    if (objetivo === 'EN CIERRE') return e === 'EN CIERRE';
    return false;
  }

  function asegurarEstilos() {
    if (document.getElementById('etop-kpi-style')) return;
    const style = document.createElement('style');
    style.id = 'etop-kpi-style';
    style.textContent = `
      .etop-kpis-inline{
        display:none;align-items:center;gap:9px;margin-left:10px;padding-left:10px;
        border-left:1px solid rgba(255,255,255,.10);height:26px;white-space:nowrap;
        flex-shrink:0;
      }
      .etop-kpis-inline.visible{display:flex}
      .etop-kpi-mini{display:flex;align-items:baseline;gap:4px;line-height:1}
      .etop-kpi-mini + .etop-kpi-mini{padding-left:9px;border-left:1px solid rgba(255,255,255,.08)}
      .etop-kpi-label{font-size:8px;font-weight:800;letter-spacing:.055em;color:#7f8ca3;text-transform:uppercase}
      .etop-kpi-value{font-size:14px;font-weight:800;color:#ffd700;font-variant-numeric:tabular-nums}
      .etop-kpi-value.cargando{font-size:11px;color:#94a3b8}
      @media(max-width:1500px){
        .etop-kpis-inline{gap:6px;margin-left:6px;padding-left:6px}
        .etop-kpi-mini + .etop-kpi-mini{padding-left:6px}
        .etop-kpi-label{font-size:7px}.etop-kpi-value{font-size:12px}
      }
    `;
    document.head.appendChild(style);
  }

  function asegurarContenedor() {
    let host = document.getElementById('etop-kpis-gestion');
    if (host) return host;
    const titulo = document.getElementById('titulo-vista');
    if (!titulo || !titulo.parentElement) return null;

    host = document.createElement('div');
    host.id = 'etop-kpis-gestion';
    host.className = 'etop-kpis-inline';
    host.innerHTML = `
      <div class="etop-kpi-mini" title="Cantidad de NRC visibles según la vista y los filtros aplicados">
        <span class="etop-kpi-label">Cursos</span>
        <span class="etop-kpi-value cargando" id="etop-kpi-cursos">—</span>
      </div>
      <div class="etop-kpi-mini" title="Suma de estudiantes de los NRC visibles según metricas_estudiantes.json">
        <span class="etop-kpi-label">Estudiantes</span>
        <span class="etop-kpi-value cargando" id="etop-kpi-estudiantes">—</span>
      </div>`;
    titulo.insertAdjacentElement('afterend', host);
    return host;
  }

  function formatearNumero(n) {
    return Number(n || 0).toLocaleString('es-CL');
  }

  function cursosVisiblesKpi() {
    if (typeof catalogoNRC === 'undefined' || !Array.isArray(catalogoNRC)) return [];
    let lista;
    try {
      lista = typeof nrcsFiltrados === 'function' ? nrcsFiltrados() : catalogoNRC.slice();
    } catch (_) {
      lista = catalogoNRC.slice();
    }
    const objetivo = estadoObjetivo();
    return lista.filter(c => esEstadoVista(c, objetivo));
  }

  function actualizarKpis() {
    const host = asegurarContenedor();
    if (!host) return;

    const activa = typeof vistaActual !== 'undefined' && VISTAS_KPI.has(vistaActual);
    host.classList.toggle('visible', activa);
    if (!activa) return;

    const cursos = cursosVisiblesKpi();
    const totalCursos = cursos.length;
    let totalEstudiantes = 0;
    for (const c of cursos) {
      const key = nrcKey(c?.nrc);
      totalEstudiantes += Number(metricasPorNrc.get(key) || 0);
    }

    const elCursos = document.getElementById('etop-kpi-cursos');
    const elEst = document.getElementById('etop-kpi-estudiantes');
    if (elCursos) {
      elCursos.textContent = formatearNumero(totalCursos);
      elCursos.classList.remove('cargando');
    }
    if (elEst) {
      elEst.textContent = metricasListas ? formatearNumero(totalEstudiantes) : '…';
      elEst.classList.toggle('cargando', !metricasListas);
    }
  }

  function firmaEstado() {
    try {
      return [
        typeof vistaActual !== 'undefined' ? vistaActual : '',
        typeof catalogoNRC !== 'undefined' ? catalogoNRC.length : 0,
        typeof BUSQUEDA !== 'undefined' ? JSON.stringify(BUSQUEDA) : '',
        metricasListas ? metricasPorNrc.size : -1
      ].join('|');
    } catch (_) {
      return String(Date.now());
    }
  }

  async function cargarMetricas() {
    try {
      const r = await fetch(METRICAS_URL + '?_=' + Date.now(), { cache:'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const data = await r.json();
      const mapa = new Map();
      (Array.isArray(data) ? data : []).forEach(x => {
        const k = nrcKey(x?.nrc);
        if (k) mapa.set(k, Number(x?.total_estudiantes) || 0);
      });
      metricasPorNrc = mapa;
      metricasListas = true;
      ultimaFirma = '';
      actualizarKpis();
    } catch (e) {
      console.warn('No se pudo cargar metricas_estudiantes.json para KPIs:', e);
      metricasListas = false;
      ultimaFirma = '';
      actualizarKpis();
    }
  }

  function iniciar() {
    asegurarEstilos();
    asegurarContenedor();
    cargarMetricas();

    setInterval(() => {
      const f = firmaEstado();
      if (f !== ultimaFirma) {
        ultimaFirma = f;
        actualizarKpis();
      }
    }, 350);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar, { once:true });
  } else {
    iniciar();
  }
})();
