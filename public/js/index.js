// index.js — Lógica específica da página inicial (Dashboard)
(function () {
  'use strict';

  function brl(n) {
    return 'R$ ' + (Number(n) || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function num(s) {
    return parseFloat(String(s).replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  }
  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'br-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3000);
  }

  // --- CARDÁPIO (clique nos cards) ---
  var pgrid = document.getElementById('pgridCardapio');
  if (pgrid) {
    var PRODUTOS_EXEMPLO = [
      { nome: 'Boi Ralado Tradicional', preco: 34.90, img: 'img/produtos/boi-ralado.jpg', estoque: 50, categoria: 'Prato Principal', descricao: 'O clássico da casa! Carne bovina desfiada...' },
      { nome: 'Hambúrguer Boi Ralado', preco: 32.00, img: 'img/produtos/hamburguer.jpg', estoque: 40, categoria: 'Lanches', descricao: 'Blend especial de 180g...' },
      { nome: 'Pastel de Boi Ralado', preco: 14.00, img: 'img/produtos/pastel.jpg', estoque: 80, categoria: 'Salgados', descricao: 'Pastel grande e crocante...' },
      { nome: 'Picanha na Chapa', preco: 68.90, img: 'img/produtos/picanha.jpg', estoque: 25, categoria: 'Prato Principal', descricao: 'Picanha nobre fatiada...' },
      { nome: 'Prato Executivo da Casa', preco: 29.90, img: 'img/produtos/executivo.jpg', estoque: 60, categoria: 'Executivo', descricao: 'A refeição completa...' },
      { nome: 'Batata Rústica', preco: 24.90, img: 'img/produtos/batata.jpg', estoque: 90, categoria: 'Acompanhamento', descricao: 'Batatas com casca...' },
      { nome: 'Suco de Laranja', preco: 9.00, img: 'img/produtos/suco.jpg', estoque: 100, categoria: 'Bebida', descricao: 'Suco de laranja 100% natural...' },
      { nome: 'Mousse de Maracujá', preco: 12.00, img: 'img/produtos/mousse.webp', estoque: 45, categoria: 'Sobremesa', descricao: 'Mousse cremosa...' }
    ];

    pgrid.addEventListener('click', function (e) {
      var card = e.target.closest('.pcard');
      if (!card) return;
      var idx = parseInt(card.dataset.produto, 10);
      if (isNaN(idx) || !PRODUTOS_EXEMPLO[idx]) return;
      toast('"' + PRODUTOS_EXEMPLO[idx].nome + '" — ' + brl(PRODUTOS_EXEMPLO[idx].preco));
    });
  }
})();