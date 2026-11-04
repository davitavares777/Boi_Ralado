/* cursor.js — efeito de cursor leve (sem alterar estrutura do site) */
(function () {
  'use strict';
  if (window.__brCursor) return;
  window.__brCursor = 1;

  // Se não for ponteiro fino (mouse), sai — mantém cursor nativo em touch
  if (!window.matchMedia || !matchMedia('(pointer: fine)').matches) return;

  var dot = document.createElement('div');
  dot.className = 'cursor-dot';
  document.body.appendChild(dot);
  document.body.classList.add('has-custom-cursor');

  var mx = window.innerWidth / 2;
  var my = window.innerHeight / 2;

  // Movimento instantâneo (sem lerp = sem atraso)
  document.addEventListener('mousemove', function (e) {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';

    var hover = e.target.closest &&
      e.target.closest('a,button,input,select,textarea,.pcard,.access-card');
    dot.classList.toggle('is-hover', !!hover);
  }, { passive: true });

  document.addEventListener('mouseleave', function () {
    dot.style.opacity = '0';
  });
  document.addEventListener('mouseenter', function () {
    dot.style.opacity = '1';
  });
})();