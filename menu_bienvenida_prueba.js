(function(){
  const CORREOS_EXTRA = {
    'ORIETTA CORTES': 'tutoriaonline04@unab.cl'
  };
  const ANEXOS_EXTRA = {
    'ORIETTA CORTES': '6005858550 – Anexo 5230'
  };

  function normalizarNombreTutor(v){
    return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();
  }

  function correoTutor(nombre){
    const key = normalizarNombreTutor(nombre);
    if (typeof TC !== 'undefined' && TC[key]) return TC[key];
    return CORREOS_EXTRA[key] || '';
  }

  function anexoTutor(nombre){
    const key = normalizarNombreTutor(nombre);
    if (typeof TA !== 'undefined' && TA[key]) return TA[key];
    return ANEXOS_EXTRA[key] || '';
  }

  function datosNrcSeleccionado(){
    if (!BUSQUEDA?.nrc || !Array.isArray(catalogoNRC) || !catalogoNRC.length) return null;
    return catalogoNRC.find(n => String(n.nrc||'').trim() === String(BUSQUEDA.nrc||'').trim()) || null;
  }

  function inyectarFix(visor){
    try{
      const d=visor?.contentDocument;
      if(!d || !d.head || d.getElementById('etop-bienvenida-fix')) return;
      const s=d.createElement('script');
      s.id='etop-bienvenida-fix';
      s.src='https://tutoriaonlinepostgrado.github.io/sitiowebetop/generador_bienvenidas_fix.js?v='+Date.now();
      d.head.appendChild(s);
    }catch(e){console.warn('No se pudo cargar complemento de bienvenida:',e);}
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
      set('anexo-tutor', anexoTutor(tutor));
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

      if (typeof w.autocompletarPrimerCursoDesdeContexto === 'function') w.autocompletarPrimerCursoDesdeContexto();
      if (typeof w.cargarEstudiantesSeguimiento === 'function') w.cargarEstudiantesSeguimiento(false);
      return true;
    } catch(e) {
      console.warn('No se pudieron completar los campos de la prueba:', e);
      return false;
    }
  }

  function configurarGuiaSuperior(){
    const guia = document.getElementById('guia-correos');
    if (!guia) return;
    guia.style.display = 'flex';

    const texto = guia.querySelector('.guia-correos-texto');
    if (texto) texto.innerHTML = '<strong>¿Cómo cargar los datos?</strong> Busca arriba tu curso de inducción, selecciónalo y luego haz clic aquí.';

    const boton = guia.querySelector('.guia-correos-btn');
    if (boton) {
      boton.textContent = '↻ Cargar datos del curso';
      boton.removeAttribute('onclick');
      boton.onclick = function(){
        if (!BUSQUEDA?.nrc) {
          const input = document.getElementById('input-nrc');
          if (input) {
            input.classList.add('guia-atencion');
            input.focus();
            setTimeout(() => input.classList.remove('guia-atencion'), 1800);
          }
          alert('Primero busca y selecciona arriba el NRC de tu curso de inducción. Después vuelve a pulsar “Cargar datos del curso”.');
          return;
        }
        if (!cargarCamposEnIframe()) alert('No fue posible cargar los datos del curso seleccionado.');
      };
    }
  }

  function ocultarCargaInterna(d){
    try {
      const btnInterno = d.querySelector('button[onclick*="cargarDatosCursoAutomatico"]');
      if (btnInterno) {
        const bloque = btnInterno.closest('.helper');
        if (bloque) bloque.style.display='none';
        else btnInterno.style.display='none';
      }
      const extra = d.getElementById('bloque-auto-prueba');
      if (extra) extra.remove();
    } catch(e) {}
  }

  function prepararIframePrueba(){
    const visor = document.getElementById('visor');
    if (!visor) return;
    try {
      const d = visor.contentDocument;
      if (!d || !d.body || !String(visor.src||'').includes('generador_bienvenidas.html')) return;
      inyectarFix(visor);
      ocultarCargaInterna(d);

      const tutorEl = d.getElementById('nombre-tutor');
      const correoEl = d.getElementById('correo-tutor');
      const anexoEl = d.getElementById('anexo-tutor');
      if (tutorEl) {
        if (correoEl && !correoEl.value.trim()) correoEl.value = correoTutor(tutorEl.value);
        if (anexoEl && !anexoEl.value.trim()) anexoEl.value = anexoTutor(tutorEl.value);
      }
    } catch(e) {
      console.warn('No se pudo preparar la interfaz de prueba:', e);
    }
  }

  window.cargarBienvenidaPrueba = function(btn){
    try {
      vistaActual = 'BIENVENIDA_PRUEBA';
      configurarFiltros('CORREOS');
      configurarGuiaSuperior();

      document.getElementById('canal-splash')?.classList.remove('visible');
      const visor = document.getElementById('visor');
      if (!visor) return;
      visor.style.display = 'block';

      const url = new URL('https://tutoriaonlinepostgrado.github.io/sitiowebetop/generador_bienvenidas.html');
      const nd = datosNrcSeleccionado();
      if (nd) {
        const params = {
          nombreTutor: nd.tutor || '',
          correoTutor: correoTutor(nd.tutor),
          anexoTutor: anexoTutor(nd.tutor),
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