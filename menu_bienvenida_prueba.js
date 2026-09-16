(function(){
  function normalizarNombreTutor(v){
    return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();
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

      if (BUSQUEDA?.nrc && Array.isArray(catalogoNRC) && catalogoNRC.length) {
        const nd = catalogoNRC.find(n => String(n.nrc||'').trim() === String(BUSQUEDA.nrc||'').trim());
        if (nd) {
          const tutorKey = normalizarNombreTutor(nd.tutor);
          const params = {
            nombreTutor: nd.tutor || '',
            correoTutor: (typeof TC !== 'undefined' && TC[tutorKey]) ? TC[tutorKey] : '',
            anexoTutor: (typeof TA !== 'undefined' && TA[tutorKey]) ? TA[tutorKey] : '',
            nrc: BUSQUEDA.nrc,
            fechaInicio: nd['fecha inicio'] || '',
            fechaFin: nd['fecha fin'] || '',
            nombrePrograma: nd['nombre programa'] || '',
            nombreCurso: nd['nombre curso'] ? `${BUSQUEDA.nrc} — ${nd['nombre curso']}` : BUSQUEDA.nrc
          };
          Object.entries(params).forEach(([k,v]) => { if (v) url.searchParams.set(k,v); });
        }
      }

      url.searchParams.set('_t', Date.now().toString());
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