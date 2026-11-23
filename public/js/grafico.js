// Gráficos dinâmicos do Boi Ralado — visual refinado e adaptável
(function () {
  'use strict';
  var instancias = {};
  var cores = ['#E85D26','#36C99B','#F5BD3D','#5B9DF5','#A78BFA','#EF535B','#C9B393'];
  var texto = '#D8C9B8';
  var grade = 'rgba(201,179,147,.10)';

  function carregarGraficos() {
    if (typeof Chart === 'undefined') return;
    var pagina = location.pathname.split('/').pop().toLowerCase();
    var contexto = pagina === 'relatorio_balcao.html' ? 'balcao' : (pagina === 'relatorio_delivery.html' ? 'delivery' : 'geral');
    fetch('/api/graficos?contexto=' + contexto).then(function (r) { return r.json(); }).then(function (res) {
      if (!res || !res.ok || !res.dados) return;
      var d = res.dados;
      var defaults = {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 120,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { labels: { color: texto, usePointStyle: true, pointStyle: 'circle', boxWidth: 8, boxHeight: 8, padding: 16, font: { family: 'Poppins', size: 11 } } },
          tooltip: { backgroundColor: '#170f0b', titleColor: '#fff', bodyColor: texto, borderColor: 'rgba(232,93,38,.35)', borderWidth: 1, padding: 12, cornerRadius: 10, displayColors: true }
        }
      };
      var eixos = {
        x: { grid: { display: false }, ticks: { color: texto, font: { family: 'Poppins', size: 10 }, maxRotation: 0, autoSkip: true } },
        y: { beginAtZero: true, grid: { color: grade, drawBorder: false }, border: { display: false }, ticks: { color: texto, padding: 8, font: { family: 'Poppins', size: 10 } } }
      };
      function criar(id, config) {
        var el = document.getElementById(id); if (!el) return;
        if (instancias[id]) instancias[id].destroy();
        config.options = config.options || {};
        config.options.responsive = true;
        config.options.maintainAspectRatio = false;
        instancias[id] = new Chart(el, config);
      }
      var vazio = ['Sem dados'];
      var categorias = Array.isArray(d.categorias) ? d.categorias : [];
      var pagamentos = Array.isArray(d.pagamentos) ? d.pagamentos : [];
      var faturamento = Array.isArray(d.faturamento7dias) ? d.faturamento7dias : [];
      var vendidos = Array.isArray(d.maisVendidos) ? d.maisVendidos : [];
      criar('graficoPizza', { type: 'doughnut', data: { labels: categorias.length ? categorias.map(function(x){return x.nome;}) : vazio, datasets: [{ data: categorias.length ? categorias.map(function(x){return x.qtd;}) : [1], backgroundColor: categorias.length ? cores : ['rgba(201,179,147,.22)'], borderColor: '#1b120d', borderWidth: 3, hoverOffset: 7 }] }, options: Object.assign({}, defaults, { cutout: '62%', plugins: Object.assign({}, defaults.plugins, { legend: Object.assign({}, defaults.plugins.legend, { position: 'bottom' }) }) }) });
      criar('graficoRosca', { type: 'doughnut', data: { labels: pagamentos.length ? pagamentos.map(function(x){return x.nome;}) : vazio, datasets: [{ data: pagamentos.length ? pagamentos.map(function(x){return x.valor;}) : [1], backgroundColor: pagamentos.length ? cores : ['rgba(201,179,147,.22)'], borderColor: '#1b120d', borderWidth: 3, hoverOffset: 7 }] }, options: Object.assign({}, defaults, { cutout: '68%', plugins: Object.assign({}, defaults.plugins, { legend: Object.assign({}, defaults.plugins.legend, { position: 'bottom' }) }) }) });
      criar('graficoLinha', { type: 'line', data: { labels: faturamento.map(function(x){return x.dia;}), datasets: [{ label: 'Faturamento (R$)', data: faturamento.map(function(x){return x.valor;}), borderColor: '#36C99B', backgroundColor: 'rgba(54,201,155,.12)', fill: true, tension: .38, borderWidth: 3, pointRadius: 3, pointHoverRadius: 6, pointBackgroundColor: '#36C99B' }] }, options: Object.assign({}, defaults, { scales: eixos, plugins: Object.assign({}, defaults.plugins, { legend: { display: false } }) }) });
      criar('graficoBarra', { type: 'bar', data: { labels: vendidos.length ? vendidos.map(function(x){return x.nome;}) : vazio, datasets: [{ label: 'Quantidade vendida', data: vendidos.length ? vendidos.map(function(x){return x.qtd;}) : [0], backgroundColor: '#E85D26', borderRadius: 7, borderSkipped: false, maxBarThickness: 30 }] }, options: Object.assign({}, defaults, { indexAxis: 'y', scales: eixos, plugins: Object.assign({}, defaults.plugins, { legend: { display: false } }) }) });
      criar('graficoColuna', { type: 'bar', data: { labels: ['Pedidos balcão', 'Entregas', 'Fat. balcão', 'Fat. delivery'], datasets: [{ label: 'Resumo da operação', data: Array.isArray(d.totais) ? d.totais : [0,0,0,0], backgroundColor: cores, borderRadius: 7, borderSkipped: false, maxBarThickness: 42 }] }, options: Object.assign({}, defaults, { scales: eixos, plugins: Object.assign({}, defaults.plugins, { legend: { display: false } }) }) });
    }).catch(function (e) { console.error('Erro ao carregar gráficos:', e); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', carregarGraficos); else carregarGraficos();
})();
