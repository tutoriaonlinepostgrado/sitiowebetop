(function(){
  function normalizar(v){
    return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
  }

  function quitarAccesoPrueba(){
    const btn=document.getElementById('btn-bienvenida-prueba');
    if(btn){
      const anterior=btn.previousElementSibling;
      btn.remove();
      if(anterior && anterior.classList.contains('menu-category') && normalizar(anterior.textContent)==='prueba') anterior.remove();
    }
  }

  function vincularCorreosBienvenida(){
    quitarAccesoPrueba();
    const botones=[...document.querySelectorAll('.menu-btn')];
    const btn=botones.find(b=>normalizar(b.textContent).includes('correos de bienvenida'));
    if(!btn) return false;

    btn.removeAttribute('onclick');
    btn.onclick=function(e){
      e?.preventDefault?.();
      if(typeof window.cargarBienvenidaPrueba==='function'){
        window.cargarBienvenidaPrueba(btn);
        setTimeout(()=>{
          const titulo=document.getElementById('titulo-vista');
          if(titulo) titulo.textContent='Correos de Bienvenida';
        },0);
      }
    };
    return true;
  }

  function iniciar(){
    if(vincularCorreosBienvenida()) return;
    let intentos=0;
    const t=setInterval(()=>{
      intentos++;
      if(vincularCorreosBienvenida() || intentos>20) clearInterval(t);
    },150);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',iniciar);
  else iniciar();
})();