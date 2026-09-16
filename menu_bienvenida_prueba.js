(function(){
  const CORREOS_EXTRA = {
    'ORIETTA CORTES': 'tutoriaonline04@unab.cl'
  };

  function normalizarNombreTutor(v){
    return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();
  }

  function correoTutor(nombre){
    const key = normalizarNombreTutor(nombre);
    if (typeof TC !== 'undefined' && TC[key]) return TC[key];
    return CORREOS_EXTRA[key] || '';
  }

  function datosNrcSeleccionado(){
    if (!BUSQUEDA?.nrc || !Array.isArray(catalogoNRC) || !catalogoNRC.length) return null;
    return catalogoNRC.find(n => String(n.nrc||'').trim() === String(BUSQUEDA.nrc||'').trim()) || null;
  }

  function cargarCamposEnIframe(){
    const visor = document.getElementById('visor');
    const nd = datosNrcSeleccionado();
    if (!visor || !nd) return false;
    try {
      const w = visor.contentWindow;
      const d = visor.contentDocument;
      if (!w || !d) return false;

      const set = (id, valor) => {
        const el = d.getElementById(id);
        if (el && valor !== undefined && valor !== null && String(valor).trim() !== '') el.value = valor;
      };

      const tutor = nd.tutor || '';
      set('nombre-tutor', tutor);
      set('correo-tutor', correoTutor(tutor));
      if (typeof TA !== 'undefined') set('anexo-tutor', TA[normalizarNombreTutor(tutor)] || '');
      set('programa', nd['nombre programa'] || '');
      set('nrc-induccion', nd['nombre curso'] ? `${BUSQUEDA.nrc} — ${nd['nombre curso']}` : BUSQUEDA.nrc);

      const toISO = v => {
        const s = String(v||'').trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0,10);
        const m=s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);
        return m ? `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}` : '';
      };
      set('fecha-inicio', toISO(nd['fecha inicio']));
      set('fecha-fin', toISO(nd['fecha fin']));

      if (typeof w.autocompletarPrimerCursoDesdeContexto === 'function') {
        w.autocompletarPrimerCursoDesdeContexto();
      }

      const st = d.getElementById('datos-auto-prueba-status');
      if (st) st.innerHTML = '<div class="alert success">✅ Datos del curso cargados automáticamente. Revise los campos antes de construir la plantilla.</div>';
      return true;
    } catch(e) {
      console.warn('No se pudieron completar los campos de la prueba:', e);
      return false;
    }
  }

  function prepararIframePrueba(){
    const visor = document.getElementById('visor');
    if (!visor) return;
    try {
      const d = visor.contentDocument;
      if (!d || !d.body || !String(visor.src||'').includes('generador_bienvenidas.html')) return;

      const tutorEl = d.getElementById('nombre-tutor');
      const correoEl = d.getElementById('correo-tutor');
      if (tutorEl && correoEl && !correoEl.value.trim()) {
        correoEl.value = correoTutor(tutorEl.value);
      }

      if (!d.getElementById('bloque-auto-prueba')) {
        const formGrid = d.querySelector('.form-grid');
        if (formGrid) {
          const bloque = d.createElement('div');
          bloque.id = 'bloque-auto-prueba';
          bloque.style.marginBottom = '1rem';
          bloque.innerHTML = `
            <div class="helper" style="margin-bottom:.65rem;">
              <strong>Completar datos del curso:</strong> usa el NRC UNI118 seleccionado en Gestión para completar automáticamente tutor, correo, programa, curso de inducción, fechas y primer curso.
            </div>
            <div class="btn-row" style="margin-top:0;">
              <button type="button" class="btn primary" id="btn-cargar-datos-prueba">⚡ Cargar datos del curso</button>
            </div>
            <div id="datos-auto-prueba-status"></div>`;
          formGrid.parentNode.insertBefore(bloque, formGrid);
          d.getElementById('btn-cargar-datos-prueba').addEventListener('click', function(){
            if (!cargarCamposEnIframe()) {
              const st = d.getElementById('datos-auto-prueba-status');
              if (st) st.innerHTML = '<div class="alert error">No hay un NRC seleccionado en Gestión. Seleccione primero el UNI118 y vuelva a intentar.</div>';
            }
          });
        }
      }
    } catch(e) {
      console.warn('No se pudo preparar la interfaz de prueba:', e);
    }
  }

  window.cargarBienvenidaPrueba = function(btn){
    try {
      vistaActual = 'BIENVENIDA_PRUEBA';
      configurarFiltros('CORREOS');
      const guia = document.getElementById('guia-correos');
      if (guia) guia.style.display = 'none';

      document.getElementById('canal-splash')?.classList.remove('visible');
      const visor = document.getElementById('visor');
      if (!visor) return;
      visor.style.display = 'block';

      const url = new URL('https://tutoriaonlinepostgrado.github.io/sitiowebetop/generador_bienvenidas.html');
      const nd = datosNrcSeleccionado();
      if (nd) {
        const tutorKey = normalizarNombreTutor(nd.tutor);
        const params = {
          nombreTutor: nd.tutor || '',
          correoTutor: correoTutor(nd.tutor),
          anexoTutor: (typeof TA !== 'undefined' && TA[tutorKey]) ? TA[tutorKey] : '',
          nrc: BUSQUEDA.nrc,
          fechaInicio: nd['fecha inicio'] || '',
          fechaFin: nd['fecha fin'] || '',
          nombrePrograma: nd['nombre programa'] || '',
          nombreCurso: nd['nombre curso'] ? `${BUSQUEDA.nrc} — ${nd['nombre curso']}` : BUSQUEDA.nrc
        };
        Object.entries(params).forEach(([k,v]) => { if (v) url.searchParams.set(k,v); });
      }

      url.searchParams.set('_t', Date.now().toString());
      visor.onload = function(){
        prepararIframePrueba();
        setTimeout(prepararIframePrueba, 250);
      };
      visor.src = url.toString();
      document.querySelectorAll('.menu-btn,.canal-btn').forEach(b => b.classList.remove('active'));
      btn?.classList.add('active');
      const titulo = document.getElementById('titulo-vista');
      if (titulo) titulo.textContent = 'Bienvenida · Prueba SharePoint';
      if (window.innerWidth < 800 && typeof toggleSidebar === 'function') toggleSidebar();
    } catch (e) {
      console.error('Error abriendo prueba de bienvenida:', e);
      alert('No se pudo abrir la página de prueba de bienvenida.');
    }
  };

  function agregarAcceso(){
    const menu = document.querySelector('.sidebar-menu');
    if (!menu || document.getElementById('btn-bienvenida-prueba')) return;

    const categoria = document.createElement('div');
    categoria.className = 'menu-category';
    categoria.textContent = 'Prueba';

    const btn = document.createElement('button');
    btn.id = 'btn-bienvenida-prueba';
    btn.className = 'menu-btn';
    btn.type = 'button';
    btn.innerHTML = '🧪 Bienvenida SharePoint (Prueba)';
    btn.addEventListener('click', function(){ cargarBienvenidaPrueba(btn); });

    menu.appendChild(categoria);
    menu.appendChild(btn);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', agregarAcceso);
  else agregarAcceso();
})();