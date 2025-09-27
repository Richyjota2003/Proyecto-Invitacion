/* script.js - carrusel, visores, música, RSVP, contador, lista canciones */
(function () {
  // --------------------
  // CONTADOR
  // --------------------
  const fechaEvento = new Date("2025-11-22T20:00:00");
  function actualizarContador() {
    const ahora = new Date();
    let diferencia = fechaEvento - ahora;
    if (diferencia < 0) diferencia = 0;

    let diferenciaMeses = (fechaEvento.getFullYear() - ahora.getFullYear()) * 12;
    diferenciaMeses += fechaEvento.getMonth() - ahora.getMonth();
    if (fechaEvento.getDate() < ahora.getDate()) diferenciaMeses--;
    let meses = diferenciaMeses > 0 ? diferenciaMeses : 0;

    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24) % 30);
    const horas = Math.floor(diferencia / (1000 * 60 * 60) % 24);
    const minutos = Math.floor(diferencia / (1000 * 60) % 60);
    const segundos = Math.floor(diferencia / 1000 % 60);

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };
    setText('meses', meses);
    setText('dias', dias);
    setText('horas', horas);
    setText('minutos', minutos);
    setText('segundos', segundos);
  }

  window.addEventListener('load', () => {
    actualizarContador();
    setInterval(actualizarContador, 1000);

    // --------------------
    // MÚSICA - intento autoplay
    // --------------------
    const bgMusic = document.getElementById('bg-music');
    const musicBtn = document.getElementById('music-btn');
    if (bgMusic && musicBtn) {
      bgMusic.volume = 0.7;
      bgMusic.play().then(() => {
        musicBtn.textContent = '⏸';
      }).catch(() => {
        musicBtn.textContent = '🎵'; // autoplay bloqueada por navegador
      });

      musicBtn.addEventListener('click', () => {
        if (bgMusic.paused) {
          bgMusic.play(); musicBtn.textContent = '⏸';
        } else {
          bgMusic.pause(); musicBtn.textContent = '🎵';
        }
      });
    }

    // --------------------
    // RSVP (simple)
    // --------------------
    const formRsvp = document.getElementById('form-rsvp');
    if (formRsvp) {
      formRsvp.addEventListener('submit', (e) => {
        e.preventDefault();
        const nombre = formRsvp.nombre.value.trim();
        const apellido = formRsvp.apellido.value.trim();
        const asistencia = formRsvp.asistencia ? formRsvp.asistencia.value : '';
        const comida = formRsvp.comida ? formRsvp.comida.value : '';
        const respuesta = document.getElementById('respuesta-rsvp');

        if (!nombre || !apellido || !asistencia || !comida) {
          if (respuesta) respuesta.innerHTML = 'Por favor completa todos los campos obligatorios.';
          return;
        }
        if (respuesta) respuesta.innerHTML = `Gracias <strong>${nombre} ${apellido}</strong>, tu respuesta ha sido registrada: <strong>${asistencia}</strong>, comida: <strong>${comida}</strong>.`;
        formRsvp.reset();
      });
    }

    // --------------------
    // BOTONES REGALOS / TRANSFERIR
    // --------------------
    const btnTransferir = document.getElementById('btn-transferir');
    const btnListaRegalos = document.getElementById('btn-lista-regalos');
    const datosTransferencia = document.getElementById('datos-transferencia');
    const listaRegalos = document.getElementById('lista-regalos');
    if (btnTransferir && datosTransferencia) {
      btnTransferir.addEventListener('click', () => {
        datosTransferencia.classList.toggle('oculto');
        if (listaRegalos) listaRegalos.classList.add('oculto');
      });
    }
    if (btnListaRegalos && listaRegalos) {
      btnListaRegalos.addEventListener('click', () => {
        listaRegalos.classList.toggle('oculto');
        if (datosTransferencia) datosTransferencia.classList.add('oculto');
      });
    }

    // --------------------
    // AGREGAR CANCIONES (lista de música)
    // --------------------
    const btnAgregarCancion = document.getElementById('agregar-cancion');
    const inputCancion = document.getElementById('nueva-cancion');
    const ulListaCanciones = document.getElementById('lista-canciones');
    if (btnAgregarCancion && inputCancion && ulListaCanciones) {
      btnAgregarCancion.addEventListener('click', () => {
        const val = inputCancion.value.trim();
        if (!val) return;
        const li = document.createElement('li');
        li.textContent = val;
        ulListaCanciones.appendChild(li);
        inputCancion.value = '';
      });
    }

    // --------------------
    // VISOR GALERÍA (previa/posterior)
    // --------------------
    const visorGaleria = document.getElementById('visorGaleria');
    const imgVisor = document.getElementById('imagen-visor');
    document.querySelectorAll('.galeria-previa img, .galeria-posterior img').forEach(img => {
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => {
        if (!visorGaleria || !imgVisor) return;
        imgVisor.src = img.src;
        visorGaleria.style.display = 'flex';
        visorGaleria.setAttribute('aria-hidden', 'false');
      });
    });
    if (visorGaleria) {
      const closeBtn = visorGaleria.querySelector('.cerrar');
      closeBtn && closeBtn.addEventListener('click', () => {
        visorGaleria.style.display = 'none';
        visorGaleria.setAttribute('aria-hidden', 'true');
      });
      visorGaleria.addEventListener('click', (e) => {
        if (e.target === visorGaleria) {
          visorGaleria.style.display = 'none';
          visorGaleria.setAttribute('aria-hidden', 'true');
        }
      });
    }

    // --------------------
    // CARRUSEL
    // --------------------
    const slidesContainer = document.querySelector('.slides-container');
    const slides = Array.from(document.querySelectorAll('.slides-container .slide'));
    const prevBtn = document.querySelector('.flecha.izquierda');
    const nextBtn = document.querySelector('.flecha.derecha');
    let currentIndex = 0;

    function updateSlide() {
      if (!slidesContainer) return;
      slidesContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateSlide();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex + 1) % slides.length;
        updateSlide();
      });
    }

    // Soporte teclado flechas
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { currentIndex = (currentIndex - 1 + slides.length) % slides.length; updateSlide(); }
      if (e.key === 'ArrowRight') { currentIndex = (currentIndex + 1) % slides.length; updateSlide(); }
    });

    // Al hacer clic en la imagen del slide -> abrir visorCarrusel
    const visorCarrusel = document.getElementById('visorCarrusel');
    const imgVisorCarrusel = document.getElementById('imagen-visor-carrusel');
    slides.forEach(slide => {
      // protege si slide contiene video
      const img = slide.querySelector('img');
      if (img) {
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => {
          if (!visorCarrusel || !imgVisorCarrusel) return;
          imgVisorCarrusel.src = img.src;
          visorCarrusel.style.display = 'flex';
          visorCarrusel.setAttribute('aria-hidden', 'false');
        });
      }
    });
    if (visorCarrusel) {
      const closeC = visorCarrusel.querySelector('.cerrar');
      closeC && closeC.addEventListener('click', () => {
        visorCarrusel.style.display = 'none';
        visorCarrusel.setAttribute('aria-hidden', 'true');
      });
      visorCarrusel.addEventListener('click', (e) => {
        if (e.target === visorCarrusel) {
          visorCarrusel.style.display = 'none';
          visorCarrusel.setAttribute('aria-hidden', 'true');
        }
      });
    }

    // Asegurarse que el slide se ajuste al tamaño al resize
    window.addEventListener('resize', updateSlide);
    updateSlide();
  }); // fin load
})();

// VISOR DE REGALO
const visorRegalo = document.getElementById('visorRegalo');
const tituloRegalo = document.getElementById('titulo-regalo');
const regaloHidden = document.getElementById('regalo-hidden');
const formRegalo = document.getElementById('form-regalo');

document.querySelectorAll('.regalo').forEach(item => {
  item.addEventListener('click', () => {
    const nombreRegalo = item.querySelector('p').textContent;
    tituloRegalo.textContent = "Regalar: " + nombreRegalo;
    regaloHidden.value = nombreRegalo;
    visorRegalo.style.display = "flex";
    visorRegalo.setAttribute('aria-hidden', 'false');
  });
});

// Cerrar modal regalo
if (visorRegalo) {
  visorRegalo.querySelector('.cerrar').addEventListener('click', () => {
    visorRegalo.style.display = "none";
    visorRegalo.setAttribute('aria-hidden', 'true');
  });
  visorRegalo.addEventListener('click', (e) => {
    if (e.target === visorRegalo) {
      visorRegalo.style.display = "none";
      visorRegalo.setAttribute('aria-hidden', 'true');
    }
  });
}

// Manejo de formulario
if (formRegalo) {
  formRegalo.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = formRegalo.nombre.value.trim();
    const email = formRegalo.email.value.trim();
    const regalo = formRegalo.regalo.value;
    const mensaje = formRegalo.mensaje.value.trim();

    document.getElementById('respuesta-regalo').innerHTML =
      `Gracias <strong>${nombre}</strong>! Confirmaste regalar <strong>${regalo}</strong>.`;

    formRegalo.reset();
    setTimeout(() => { visorRegalo.style.display = "none"; }, 1500);
  });
}
