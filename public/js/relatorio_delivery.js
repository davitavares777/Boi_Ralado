// relatorio_delivery.js — Lógica específica do relatório de delivery
(function () {
  'use strict';

  function brl(n) {
    return 'R$ ' + (Number(n) || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function num(s) {
    return parseFloat(String(s).replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  }

  var tb = document.querySelector('.data-table tbody');
  var dt = document.querySelector('.filter-bar input[type=date]');
  if (!tb || !dt) return;

  dt.value = new Date().toISOString().split('T')[0];

  function popularDadosExemplo() {
      var hoje = new Date().toISOString().split('T')[0];
      var ontem = new Date(); ontem.setDate(ontem.getDate() - 1);
      var ontemIso = ontem.toISOString().split('T')[0];
      
      var exemplos = [
          { numero: '#D1001', cliente: 'Carlos', endereco: 'Rua A, 10', total: 75.00, data: hoje, hora: '19:00', status: 'Entregue', pagamento: 'PIX' },
          { numero: '#D1002', cliente: 'Julia', endereco: 'Rua B, 20', total: 55.00, data: hoje, hora: '19:30', status: 'Entregue', pagamento: 'Cartão' },
          { numero: '#D1003', cliente: 'Marcos', endereco: 'Rua C, 30', total: 90.00, data: ontemIso, hora: '20:00', status: 'Entregue', pagamento: 'Dinheiro' }
      ];
      localStorage.setItem('br_relatorio_delivery', JSON.stringify(exemplos));
  }
  if (!localStorage.getItem('br_relatorio_delivery')) {
      popularDadosExemplo();
  }

  function desenharDelivery() {
    var dataIso = dt.value;
    var dataBr = dataIso.split('-').reverse().join('/');
    
    var todosDados = JSON.parse(localStorage.getItem('br_relatorio_delivery')) || [];
    var lista = todosDados.filter(function (e) { return e.data === dataIso || e.data === dataBr; });
    
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
    var cv = document.querySelectorAll('.total-cell__value');
    [brl(tot), lista.length, brl(pg.Dinheiro), brl(pg['Cartão']), brl(pg.PIX), brl(taxa)]
      .forEach(function (x, i) { if (cv[i]) cv[i].textContent = x; });
  }

  var bc = document.querySelector('.filter-bar .btn--primary');
  if (bc) bc.addEventListener('click', desenharDelivery);

  desenharDelivery();
})();