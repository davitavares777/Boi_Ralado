// relatorio_balcao.js — Lógica específica do relatório de balcão
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

  var inputData  = document.getElementById('inputDataBalcao');
  var btnConsultar = document.getElementById('btnConsultarBalcao');
  var tb         = document.querySelector('#tabelaRelatorioBalcao tbody');

  if (!inputData || !btnConsultar || !tb) return;

  inputData.value = new Date().toISOString().split('T')[0];

  // --- Lógica do Gráfico (Chart.js) ---
  var chartInstance = null;
  var canvasElement = document.getElementById('graficoBalcao');
  
  function renderizarGrafico() {
    if (!canvasElement) return;
    
    // Dados de exemplo coerentes para o balcão
    var dados = {
      labels: ['Lanches', 'Pratos Executivos', 'Bebidas', 'Sobremesas', 'Acompanhamentos'],
      datasets: [{
        data: [35, 45, 15, 5, 10], // Percentuais
        backgroundColor: [
          '#E85D26', // Ember
          '#FFB36B', // Laranja claro
          '#A61B1B', // Vermelho escuro
          '#C9B393', // Bege
          '#38BDF8'  // Azul claro (destaque)
        ],
        borderColor: '#17100A', // Cor da borda para combinar com o fundo
        borderWidth: 2,
        hoverOffset: 8
      }]
    };

    var config = {
      type: 'doughnut', // Doughnut é mais moderno que o Pie
      data: dados,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#A89078',
              font: { family: "'Poppins', sans-serif", size: 12 },
              padding: 20
            }
          },
          tooltip: {
            backgroundColor: '#1F1610',
            titleColor: '#F1E8D8',
            bodyColor: '#E85D26',
            borderColor: 'rgba(232,93,38,0.3)',
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                return ' ' + context.label + ': ' + context.raw + '%';
              }
            }
          }
        },
        cutout: '60%', // Deixa o centro vazio (efeito doughnut)
        animation: {
          animateScale: true,
          animateRotate: true
        }
      }
    };

    if (chartInstance) {
      chartInstance.destroy();
    }
    chartInstance = new Chart(canvasElement, config);
  }

  // --- Dados de Exemplo para a Tabela ---
  function popularDadosExemplo() {
    var hoje = new Date().toISOString().split('T')[0];
    var ontem = new Date(); ontem.setDate(ontem.getDate() - 1);
    var ontemIso = ontem.toISOString().split('T')[0];
    var exemplos = [
      { numero: '#C1001', cliente: 'João',  total: 150.00, data: hoje,     hora: '12:30', status: 'Pago', mesa: '01' },
      { numero: '#C1002', cliente: 'Maria', total: 85.50,  data: hoje,     hora: '13:00', status: 'Pago', mesa: '03' },
      { numero: '#C1003', cliente: 'Pedro', total: 120.00, data: ontemIso, hora: '12:15', status: 'Pago', mesa: '07' },
      { numero: '#C1004', cliente: 'Ana',   total: 45.00,  data: ontemIso, hora: '13:45', status: 'Pago', mesa: null }
    ];
    localStorage.setItem('br_relatorio_balcao', JSON.stringify(exemplos));
  }
  if (!localStorage.getItem('br_relatorio_balcao')) popularDadosExemplo();

  function carregarRelatorioBalcao(dataIso) {
    var dataBr = dataIso.split('-').reverse().join('/');
    var todosDados = JSON.parse(localStorage.getItem('br_relatorio_balcao')) || [];
    var pedidosDoDia = todosDados.filter(function (p) { return p.data === dataIso || p.data === dataBr; });

    var totalValor = 0;
    var totalDinheiro = 0, totalCartao = 0, totalPix = 0; // Simulação de totais por forma de pagamento
    tb.innerHTML = '';

    if (!pedidosDoDia.length) {
      tb.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma venda de balcão nesta data.</td></tr>';
      if (document.getElementById('totalGeralBalcao')) document.getElementById('totalGeralBalcao').textContent = brl(0);
      if (document.getElementById('totalQtdBalcao'))   document.getElementById('totalQtdBalcao').textContent = '0';
      if (document.getElementById('val-dinheiro'))     document.getElementById('val-dinheiro').textContent = brl(0);
      if (document.getElementById('val-cartao'))       document.getElementById('val-cartao').textContent = brl(0);
      if (document.getElementById('val-pix'))          document.getElementById('val-pix').textContent = brl(0);
      return;
    }
    pedidosDoDia.forEach(function (p) {
      var v = num(p.total); 
      totalValor += v;
      
      // Simulação de distribuição de pagamento para os cards de totais
      if (p.mesa === '01' || p.mesa === '07') totalDinheiro += v;
      else if (p.mesa === '03') totalCartao += v;
      else totalPix += v; // Para os demais (Balcão)

      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + (p.hora || '12:00') + '</td>' +
        '<td>' + (p.mesa ? 'Mesa ' + p.mesa : 'Balcão') + '</td>' +
        '<td>' + (p.cliente || 'Cliente') + '</td>' +
        '<td class="num">' + brl(v) + '</td>' +
        '<td><span class="pill pill--paid">' + (p.status || 'Pago') + '</span></td>';
      tb.appendChild(tr);
    });
    
    if (document.getElementById('totalGeralBalcao')) document.getElementById('totalGeralBalcao').textContent = brl(totalValor);
    if (document.getElementById('totalQtdBalcao'))   document.getElementById('totalQtdBalcao').textContent = pedidosDoDia.length;
    if (document.getElementById('val-dinheiro'))     document.getElementById('val-dinheiro').textContent = brl(totalDinheiro);
    if (document.getElementById('val-cartao'))       document.getElementById('val-cartao').textContent = brl(totalCartao);
    if (document.getElementById('val-pix'))          document.getElementById('val-pix').textContent = brl(totalPix);
  }

  // Inicializa
  renderizarGrafico();
  carregarRelatorioBalcao(inputData.value);

  btnConsultar.addEventListener('click', function () {
    carregarRelatorioBalcao(inputData.value);
    toast('Relatório atualizado.');
  });

})();