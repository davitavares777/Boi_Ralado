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

  var inputData = document.getElementById('inputDataBalcao');
  var btnConsultar = document.getElementById('btnConsultarBalcao');
  if (inputData) inputData.value = new Date().toISOString().split('T')[0];

  function popularDadosExemplo() {
      var hoje = new Date().toISOString().split('T')[0];
      var ontem = new Date(); ontem.setDate(ontem.getDate() - 1);
      var ontemIso = ontem.toISOString().split('T')[0];
      
      var exemplos = [
          { numero: '#C1001', cliente: 'João', total: 150.00, data: hoje, hora: '12:30', status: 'Pago' },
          { numero: '#C1002', cliente: 'Maria', total: 85.50, data: hoje, hora: '13:00', status: 'Pago' },
          { numero: '#C1003', cliente: 'Pedro', total: 120.00, data: ontemIso, hora: '12:15', status: 'Pago' },
          { numero: '#C1004', cliente: 'Ana', total: 45.00, data: ontemIso, hora: '13:45', status: 'Pago' }
      ];
      localStorage.setItem('br_relatorio_balcao', JSON.stringify(exemplos));
  }
  if (!localStorage.getItem('br_relatorio_balcao')) {
      popularDadosExemplo();
  }

  function carregarRelatorioBalcao(dataIso) {
    var dataBr = dataIso.split('-').reverse().join('/');
    var todosDados = JSON.parse(localStorage.getItem('br_relatorio_balcao')) || [];
    var pedidosDoDia = todosDados.filter(function (p) { return p.data === dataIso || p.data === dataBr; });
    
    var totalValor = 0;
    var tb = document.querySelector('#tabelaRelatorioBalcao tbody');
    if (tb) tb.innerHTML = '';
    
    if (!pedidosDoDia.length) {
      if (tb) tb.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma venda de balcão nesta data.</td></tr>';
      if (document.getElementById('totalGeralBalcao')) document.getElementById('totalGeralBalcao').textContent = brl(0);
      if (document.getElementById('totalQtdBalcao')) document.getElementById('totalQtdBalcao').textContent = '0';
      return;
    }
    pedidosDoDia.forEach(function (p) {
      var v = num(p.total); totalValor += v;
      if (tb) {
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + p.hora + '</td>' +
          '<td>' + (p.mesa ? 'Mesa ' + p.mesa : 'Balcão') + '</td>' +
          '<td>' + p.cliente + '</td>' +
          '<td class="num">' + brl(v) + '</td>' +
          '<td><span class="pill pill--paid">' + (p.status || 'Pago') + '</span></td>';
        tb.appendChild(tr);
      }
    });
    if (document.getElementById('totalGeralBalcao')) document.getElementById('totalGeralBalcao').textContent = brl(totalValor);
    if (document.getElementById('totalQtdBalcao')) document.getElementById('totalQtdBalcao').textContent = pedidosDoDia.length;
  }

  if (btnConsultar && inputData) {
    btnConsultar.addEventListener('click', function () {
      carregarRelatorioBalcao(inputData.value);
      toast('Relatório atualizado.');
    });
  }

  carregarRelatorioBalcao(inputData.value);
})();