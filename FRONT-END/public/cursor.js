/* ============================================================
   CURSOR BRASA — Boi Ralado
   Auto-contido. Ativa em todas as páginas que carregarem este script.
   Fallback: se algo falhar, cursor nativo permanece.
   ============================================================ */
(function () {
  'use strict';

  // Evita duplicação se o script for incluído mais de uma vez
  if (window.__brCursorLoaded) return;
  window.__brCursorLoaded = true;

  // Só ativa em mouse real (desktop)
  try {
    if (!window.matchMedia || !window.matchMedia('(pointer: fine)').matches) return;
  } catch (e) { return; }

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}

  // ---- Cria elementos ----
  var dot = document.createElement('div');
  var ring = document.createElement('div');
  var trail = document.createElement('div');
  dot.className = 'cursor-dot';
  ring.className = 'cursor-ring';
  trail.className = 'cursor-trail';

  // ---- CSS inline (independente do style.css) ----
  var css =
    '.cursor-dot,.cursor-ring,.cursor-trail{' +
    'position:fixed;top:0;left:0;pointer-events:none;z-index:2147483647;' +
    'border-radius:50%;transform:translate(-50%,-50%);' +
    'will-change:transform;opacity:0;' +
    'transition:opacity .2s ease,width .18s ease,height .18s ease,' +
    'background .18s ease,border-color .18s ease,box-shadow .18s ease;}' +
    'html.br-cursor-ready,html.br-cursor-ready *{cursor:none !important;}' +
    'html.br-cursor-ready .cursor-dot,html.br-cursor-ready .cursor-ring,html.br-cursor-ready .cursor-trail{opacity:1;}' +
    '.cursor-dot{width:8px;height:8px;' +
    'background:radial-gradient(circle,#FFD1A8 0%,#FF7A3D 45%,#E85D26 75%,#B33E0F 100%);' +
    'box-shadow:0 0 10px rgba(255,122,61,.9),0 0 24px rgba(232,93,38,.7),0 0 40px rgba(232,93,38,.35);}' +
    '.cursor-ring{width:40px;height:40px;border:1.5px solid rgba(232,93,38,.6);' +
    'background:radial-gradient(circle,rgba(232,93,38,.10) 0%,transparent 70%);' +
    'box-shadow:inset 0 0 12px rgba(232,93,38,.18),0 0 20px rgba(232,93,38,.15);}' +
    '.cursor-trail{width:4px;height:4px;background:rgba(255,180,140,.75);' +
    'box-shadow:0 0 8px rgba(255,180,140,.8);}' +
    '.cursor-ring.is-hover{width:62px;height:62px;border-color:rgba(255,122,61,.95);' +
    'background:radial-gradient(circle,rgba(232,93,38,.18) 0%,transparent 70%);' +
    'box-shadow:inset 0 0 18px rgba(232,93,38,.35),0 0 30px rgba(232,93,38,.4);}' +
    '.cursor-dot.is-hover{width:12px;height:12px;' +
    'background:radial-gradient(circle,#FFF 0%,#FFD1A8 45%,#FF7A3D 100%);' +
    'box-shadow:0 0 16px rgba(255,255,255,.9),0 0 32px rgba(232,93,38,.9);}' +
    '.cursor-ring.is-down{width:30px;height:30px;' +
    'background:radial-gradient(circle,rgba(255,122,61,.35) 0%,transparent 70%);' +
    'border-color:rgba(255,255,255,.9);}' +
    '.cursor-dot.is-down{width:5px;height:5px;background:#fff;' +
    'box-shadow:0 0 20px #fff,0 0 40px #FF7A3D;}' +
    '.cursor-ring.is-text{width:4px;height:28px;border-radius:2px;' +
    'background:rgba(232,93,38,.85);border-color:transparent;' +
    'box-shadow:0 0 10px rgba(232,93,38,.6);}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ---- Anexa ao DOM (compatível com carregamento tardio) ----
  function attach() {
    if (document.querySelector('.cursor-dot')) return; // já anexado
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.body.appendChild(trail);
    document.documentElement.classList.add('br-cursor-ready');
  }
  if (document.body && document.body.children.length) attach();
  else document.addEventListener('DOMContentLoaded', attach);

  // ---- Estado ----
  var tx = window.innerWidth / 2, ty = window.innerHeight / 2;
  var dx = tx, dy = ty;
  var rx = tx, ry = ty;
  var lx = tx, ly = ty;
  var dotEase   = reduceMotion ? 1 : 0.55;
  var ringEase  = reduceMotion ? 1 : 0.18;
  var trailEase = reduceMotion ? 1 : 0.10;

  // ---- Listeners ----
  window.addEventListener('mousemove', function (e) {
    tx = e.clientX; ty = e.clientY;
  }, { passive: true });

  var interactive =
    'a,button,.btn,input,select,textarea,label,[role="button"],' +
    '.access-card,.stat-card,.card,.sidebar__nav a,' +
    '.row-actions button,.header__icon-btn,.header__user,.access-card__link';
  var textLike = 'input,textarea,[contenteditable="true"]';

  document.addEventListener('mouseover', function (e) {
    var t = e.target;
    if (!t || t.nodeType !== 1 || !t.closest) return;
    if (t.closest(textLike)) {
      ring.classList.add('is-text');
      ring.classList.remove('is-hover');
      dot.classList.add('is-hover');
      return;
    }
    ring.classList.remove('is-text');
    if (t.closest(interactive)) {
      ring.classList.add('is-hover');
      dot.classList.add('is-hover');
    } else {
      ring.classList.remove('is-hover');
      dot.classList.remove('is-hover');
    }
  }, { passive: true });

  window.addEventListener('mousedown', function () {
    ring.classList.add('is-down');
    dot.classList.add('is-down');
  }, { passive: true });
  window.addEventListener('mouseup', function () {
    ring.classList.remove('is-down');
    dot.classList.remove('is-down');
  }, { passive: true });

  document.addEventListener('mouseleave', function () {
    dot.style.opacity = '0';
    ring.style.opacity = '0';
    trail.style.opacity = '0';
  });
  document.addEventListener('mouseenter', function () {
    dot.style.opacity = '';
    ring.style.opacity = '';
    trail.style.opacity = '';
  });

  // ---- Loop de animação ----
  function loop() {
    dx += (tx - dx) * dotEase;
    dy += (ty - dy) * dotEase;
    rx += (tx - rx) * ringEase;
    ry += (ty - ry) * ringEase;
    lx += (tx - lx) * trailEase;
    ly += (ty - ly) * trailEase;

    dot.style.transform   = 'translate3d(' + dx + 'px,' + dy + 'px,0) translate(-50%,-50%)';
    ring.style.transform  = 'translate3d(' + rx + 'px,' + ry + 'px,0) translate(-50%,-50%)';
    trail.style.transform = 'translate3d(' + lx + 'px,' + ly + 'px,0) translate(-50%,-50%)';

    requestAnimationFrame(loop);
  }
  loop();
})();