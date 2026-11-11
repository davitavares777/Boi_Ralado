// relatorio.js — Lógica específica da página de resumo de relatórios
(function () {
  'use strict';

  function brl(n) {
    return 'R$ ' + (Number(n) || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  var cards = document.querySelectorAll('.summary-card__value');
  
  if (cards.length >= 4) {
    cards[0].textContent = brl(15420.50); // Vendas do Mês
    cards[1].textContent = brl(85.50);    // Ticket Médio
    cards[2].textContent = '180';         // Total de Pedidos
    cards[3].textContent = '+12%';        // Crescimento
  }
})();