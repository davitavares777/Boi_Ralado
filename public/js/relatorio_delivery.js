// relatorio_delivery.js — Lógica específica do relatório de delivery
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

  // --- Lógica do Gráfico (Chart.js) ---
  var chartInstance = null;
  var canvasElement = document.getElementById('graficoDelivery');

  function renderizarGrafico() {
    if (!canvasElement) return;

    // Dados de exemplo coerentes para o delivery
    var dados = {
      labels: ['App Próprio', 'WhatsApp', 'Telefone', 'iFood', 'Outros'],
      datasets: [{
        data: [45, 25, 15, 10, 5], // Percentuais
        backgroundColor: [
          '#E85D26', // Ember
          '#4ADE80', // Verde (WhatsApp)
          '#38BDF8', // Azul claro (Telefone)
          '#A61B1B', // Vermelho escuro (iFood)
          '#C9B393'  // Bege (Outros)
        ],
        borderColor: '#17100A',
        borderWidth: 2,
        hoverOffset: 8
      }]
    };

    var config = {
      type: 'doughnut',
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
        cutout: '60%',
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
  var tb  = document.querySelector('.data-table tbody');
  var dt  = document.querySelector('.filter-bar input[type="date"]');
  var btn = document.querySelector('.filter-bar .btn--primary');

  if (!tb || !dt || !btn) return;

  dt.value = new Date().toISOString().split('T')[0];

  function popularDadosExemplo() {
    var hoje = new Date().toISOString().split('T')[0];
    var ontem = new Date(); ontem.setDate(ontem.getDate() - 1);
    var ontemIso = ontem.toISOString().split('T')[0];
    var exemplos = [
      { numero: '#D1001', cliente: 'Carlos', endereco: 'Rua A, 10', total: 75.00, taxa: 6.00, subtotal: 69.00, data: hoje, hora: '19:00', status: 'Entregue', pagamento: 'PIX' },
      { numero: '#D1002', cliente: 'Julia',  endereco: 'Rua B, 20', total: 55.00, taxa: 6.00, subtotal: 49.00, data: hoje, hora: '19:30', status: 'Entregue', pagamento: 'Cartão' },
      { numero: '#D1003', cliente: 'Marcos', endereco: 'Rua C, 30', total: 90.00, taxa: 6.00, subtotal: 84.00, data: ontemIso, hora: '20:00', status: 'Entregue', pagamento: 'Dinheiro' }
    ];
    localStorage.setItem('br_relatorio_delivery', JSON.stringify(exemplos));
  }
  if (!localStorage.getItem('br_relatorio_delivery')) popularDadosExemplo();

  function desenharDelivery() {
    var dataIso = dt.value;
    var dataBr  = dataIso.split('-').reverse().join('/');
    var todos   = JSON.parse(localStorage.getItem('br_relatorio_delivery')) || [];
    var lista   = todos.filter(function (e) { return e.data === dataIso || e.data === dataBr; });

    var tot = 0, taxa = 0, pg = { Dinheiro: 0, 'Cartão': 0, PIX: 0 };
    tb.innerHTML = '';
    if (!lista.length) {
      tb.innerHTML = '<tr><td colspan="9" class="text-center">Nenhuma entrega nesta data.</td></tr>';
    } else {
      lista.forEach(function (e) {
        var t = num(e.total); tot += t; taxa += e.taxa || 0;
        pg[e.pagamento] = (pg[e.pagamento] || 0) + t;
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td><strong>' + e.numero + '</strong></td>' +
          '<td>' + (e.hora || '') + '</td>' +
          '<td>' + e.cliente + '</td>' +
          '<td>' + e.endereco + '</td>' +
          '<td>' + (e.pagamento || '—') + '</td>' +
          '<td class="num">' + brl(e.taxa || 0) + '</td>' +
          '<td class="num">' + brl(e.subtotal || 0) + '</td>' +
          '<td class="num">' + brl(t) + '</td>' +
          '<td><span class="pill pill--paid">' + (e.status || 'Entregue') + '</span></td>';
        tb.appendChild(tr);
      });
    }

    var elTotal = document.getElementById('val-total');
    if (elTotal) elTotal.textContent = brl(tot);
    var elEntregas = document.getElementById('val-entregas');
    if (elEntregas) elEntregas.textContent = lista.length;
    var elDinheiro = document.getElementById('val-dinheiro');
    if (elDinheiro) elDinheiro.textContent = brl(pg.Dinheiro);
    var elCartao = document.getElementById('val-cartao');
    if (elCartao) elCartao.textContent = brl(pg['Cartão']);
    var elPix = document.getElementById('val-pix');
    if (elPix) elPix.textContent = brl(pg.PIX);
  }

  // Inicializa
  renderizarGrafico();
  desenharDelivery();

  btn.addEventListener('click', function () {
    desenharDelivery();
    toast('Relatório atualizado.');
  });

})();