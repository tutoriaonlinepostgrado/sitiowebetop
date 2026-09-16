(function(){
  function esInvitaciones(){
    const visor = document.getElementById('visor');
    return !!(visor && String(visor.src||'').includes('onboarding_invitaciones.html'));
  }

  function inyectarPatch(){
    const visor = document.getElementById('visor');
    if (!visor || !esInvitaciones()) return;
    try {
      const d = visor.contentDocument;
      if (!d || !d.head || d.getElementById('etop-invitaciones-sp-patch')) return;
      const s = d.createElement('script');
      s.id = 'etop-invitaciones-sp-patch';
      s.src = 'https://tutoriaonlinepostgrado.github.io/sitiowebetop/onboarding_invitaciones_sharepoint_patch.js?v='+Date.now();
      d.head.appendChild(s);
    } catch(e) {
      console.warn('No se pudo cargar complemento SharePoint de invitaciones:', e);
    }
  }

  function configurarBotonSuperior(){
    if (!esInvitaciones()) return;
    const guia = document.getElementById('guia-correos');
    if (!guia) return;
    guia.style.display = 'flex';

    const texto = guia.querySelector('.guia-correos-texto');
    if (texto) texto.innerHTML = '<strong>¿Cómo cargar los datos?</strong> Busca arriba tu curso de inducción, selecciónalo y luego haz clic aquí.';

    const boton = guia.querySelector('.guia-correos-btn');
    if (!boton) return;
    boton.textContent = '↻ Cargar datos del curso';

    if (!boton.dataset.etopInvSp) {
      boton.dataset.etopInvSp = '1';
      boton.addEventListener('click', function(){
        setTimeout(() => {
          try {
            const w = document.getElementById('visor')?.contentWindow;
            if (typeof w?.aplicarTutorInvLocal === 'function') w.aplicarTutorInvLocal();
            if (typeof w?.cargarEstudiantesSeguimientoInv === 'function') w.cargarEstudiantesSeguimientoInv(false);
          } catch(e) {
            console.warn('No se pudo consultar estudiantes para invitaciones:', e);
          }
        }, 350);
      });
    }
  }

  function preparar(){
    if (!esInvitaciones()) return;
    inyectarPatch();
    configurarBotonSuperior();
    setTimeout(() => {
      inyectarPatch();
      configurarBotonSuperior();
    }, 250);
  }

  function iniciar(){
    const visor = document.getElementById('visor');
    if (!visor) return;
    visor.addEventListener('load', preparar);
    const obs = new MutationObserver(preparar);
    obs.observe(visor, {attributes:true, attributeFilter:['src']});
    preparar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
