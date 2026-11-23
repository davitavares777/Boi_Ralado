// Gráficos dinâmicos do Boi Ralado — Chart.js
(function () {
  'use strict';
  var instancias = {};
  function carregarGraficos() {
    if (typeof Chart === 'undefined') return;
    var pagina = location.pathname.split('/').pop().toLowerCase();
    var contexto = pagina === 'relatorio_balcao.html' ? 'balcao' : (pagina === 'relatorio_delivery.html' ? 'delivery' : 'geral');
    fetch('/api/graficos?contexto=' + contexto).then(function(r) { return r.json(); }).then(function(res) {
      if (!res || !res.ok || !res.dados) return;
      var d = res.dados;
      function criar(id, config) {
        var el = document.getElementById(id); if (!el) return;
        if (instancias[id]) instancias[id].destroy();
        instancias[id] = new Chart(el, config);
      }
      var cores = ['#E85D26','#38BDF8','#4ADE80','#FBBF24','#A78BFA','#F87171','#C9B393'];
      var vazio = ['Sem dados'];
      criar('graficoPizza', { type:'pie', data:{ labels:d.categorias.length ? d.categorias.map(x=>x.nome) : vazio, datasets:[{data:d.categorias.length ? d.categorias.map(x=>x.qtd) : [1],backgroundColor:cores}] }, options:{responsive:true,plugins:{legend:{position:'bottom'}}} });
      criar('graficoRosca', { type:'doughnut', data:{ labels:d.pagamentos.length ? d.pagamentos.map(x=>x.nome) : vazio, datasets:[{data:d.pagamentos.length ? d.pagamentos.map(x=>x.valor) : [1],backgroundColor:cores}] }, options:{responsive:true,plugins:{legend:{position:'bottom'}}} });
      criar('graficoLinha', { type:'line', data:{ labels:d.faturamento7dias.map(x=>x.dia),datasets:[{label:'Faturamento (R$)',data:d.faturamento7dias.map(x=>x.valor),borderColor:'#E85D26',backgroundColor:'rgba(232,93,38,.18)',fill:true,tension:.3}] }, options:{responsive:true,plugins:{legend:{display:true}}} });
      criar('graficoBarra', { type:'bar', data:{ labels:d.maisVendidos.length ? d.maisVendidos.map(x=>x.nome) : vazio,datasets:[{label:'Quantidade vendida',data:d.maisVendidos.length ? d.maisVendidos.map(x=>x.qtd) : [0],backgroundColor:'#4ADE80'}] }, options:{responsive:true,indexAxis:'y',plugins:{legend:{display:false}}} });
      criar('graficoColuna', { type:'bar', data:{ labels:['Pedidos balcão','Entregas','Faturamento balcão','Faturamento delivery'],datasets:[{label:'Quantidade / R$',data:d.totais || [0,0,0,0],backgroundColor:cores}] }, options:{responsive:true,plugins:{legend:{display:false}}} });
    }).catch(function(e) { console.error('Erro ao carregar gráficos:', e); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', carregarGraficos); else carregarGraficos();
})();
