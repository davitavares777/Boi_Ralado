// graficos.js
(function () {
  'use strict';

  function pedir(url) { return fetch(url).then(r => r.json()).catch(() => ({ ok: false })); }
  function brl(n) { return 'R$ ' + (Number(n) || 0).toFixed(2).replace('.', ','); }

  function carregarGraficos() {
    pedir('/api/graficos').then(function (res) {
      if (!res.ok) return;
      var d = res.dados;

      // 1. Pizza
      var ctxPizza = document.getElementById('graficoPizza');
      if (ctxPizza) {
        new Chart(ctxPizza, {
          type: 'pie',
          data: {
            labels: d.categorias.map(c => c.nome),
            datasets: [{ data: d.categorias.map(c => c.qtd), backgroundColor: ['#E85D26','#38BDF8','#4ADE80','#FBBF24','#A78BFA'] }]
          },
          options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });
      }

      // 2. Rosca
      var ctxRosca = document.getElementById('graficoRosca');
      if (ctxRosca) {
        new Chart(ctxRosca, {
          type: 'doughnut',
          data: {
            labels: d.pagamentos.map(p => p.nome),
            datasets: [{ data: d.pagamentos.map(p => p.valor), backgroundColor: ['#FF1E27','#FF6B00','#FBBF24','#4ADE80'] }]
          },
          options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });
      }

      // 3. Linha (Faturamento 7 dias)
      var ctxLinha = document.getElementById('graficoLinha');
      if (ctxLinha) {
        new Chart(ctxLinha, {
          type: 'line',
          data: {
            labels: d.faturamento7dias.map(f => f.dia),
            datasets: [{ label: 'Faturamento (R$)', data: d.faturamento7dias.map(f => f.valor), borderColor: '#E85D26', backgroundColor: 'rgba(232,93,38,0.2)', fill: true, tension: 0.3 }]
          },
          options: { responsive: true, plugins: { legend: { display: false } } }
        });
      }

      // 4. Barra (Mais vendidos)
      var ctxBarra = document.getElementById('graficoBarra');
      if (ctxBarra) {
        new Chart(ctxBarra, {
          type: 'bar',
          data: {
            labels: d.maisVendidos.map(m => m.nome),
            datasets: [{ label: 'Qtd. vendida', data: d.maisVendidos.map(m => m.qtd), backgroundColor: '#4ADE80' }]
          },
          options: { responsive: true, plugins: { legend: { display: false } }, indexAxis: 'y' }
        });
      }

      // 5. Coluna (Totais)
      var ctxColuna = document.getElementById('graficoColuna');
      if (ctxColuna) {
        new Chart(ctxColuna, {
          type: 'bar',
          data: {
            labels: ['Pedidos', 'Comandas', 'Entregas', 'Total'],
            datasets: [{ label: 'Valores (R$)', data: [1200, 800, 450, 2450], backgroundColor: ['#E85D26','#FF6B00','#FBBF24','#38BDF8'] }]
          },
          options: { responsive: true, plugins: { legend: { display: false } } }
        });
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', carregarGraficos);
  else carregarGraficos();
})();