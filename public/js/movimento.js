// movimento.js
(function () {
  'use strict';

  function brl(n) { return 'R$ ' + (Number(n) || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function pedir(metodo, endereco, dados) {
    return fetch(endereco, {
      method: metodo, headers: { 'Content-Type': 'application/json' },
      body: dados ? JSON.stringify(dados) : undefined
    }).then(r => r.json()).catch(() => ({ ok: false, erro: 'Servidor offline.' }));
  }

  function carregarDados() {
    var hoje = new Date().toISOString().split('T')[0];

    Promise.all([pedir('GET', '/api/pedidos'), pedir('GET', '/api/entregas')]).then(function (rs) {
      var pedidos = (rs[0].ok && rs[0].dados) ? rs[0].dados : [];
      var entregas = (rs[1].ok && rs[1].dados) ? rs[1].dados : [];

      // Cards
      var pedidosAbertos = pedidos.filter(p => p.status !== 'Pago' && p.status !== 'Cancelado').length;
      var comandasAbertas = pedidos.filter(p => p.status === 'Pendente').length;
      var entregasRota = entregas.filter(e => e.status === 'Em rota').length;
      var totalDia = pedidos.filter(p => p.data === hoje).reduce((s, p) => s + (Number(p.total) || 0), 0) +
                     entregas.filter(e => e.data === hoje).reduce((s, e) => s + (Number(e.total) || 0), 0);

      document.getElementById('cardPedidosAbertos').textContent = pedidosAbertos;
      document.getElementById('cardComandasAbertas').textContent = comandasAbertas;
      document.getElementById('cardEntregasRota').textContent = entregasRota;
      document.getElementById('cardTotalDia').textContent = brl(totalDia);

      // Tabela Últimos Pedidos (unificada)
      var tbody = document.getElementById('tbodyUltimosPedidos');
      if (!tbody) return;

      var unificados = [];
      pedidos.forEach(p => unificados.push({ ...p, tipo: 'Balcão', local: p.mesa ? 'Mesa ' + p.mesa : 'Balcão', api: 'pedidos' }));
      entregas.forEach(e => unificados.push({ ...e, tipo: 'Delivery', local: 'Delivery', api: 'entregas' }));
      unificados.sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora));

      tbody.innerHTML = '';
      if (!unificados.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum pedido encontrado.</td></tr>';
        return;
      }

      unificados.slice(0, 15).forEach(function (item) {
        var tr = document.createElement('tr');
        var dataFmt = item.data ? item.data.split('-').reverse().join('/') : '—';
        var horaFmt = item.hora || '—';
        tr.innerHTML = `
          <td><strong>${item.numero}</strong></td>
          <td>${item.tipo}</td>
          <td>${item.local || '—'}</td>
          <td>${dataFmt} às ${horaFmt}</td>
          <td class="num">${brl(item.total)}</td>
          <td><span class="pill pill--paid">${item.status}</span></td>
          <td style="text-align:center;">
            <div style="display:flex;gap:6px;justify-content:center;">
              <button class="btn btn--ghost btn--sm btn-editar" data-api="${item.api}" data-id="${item.id}" data-numero="${item.numero}" data-status="${item.status}" title="Editar"><i class="fa-solid fa-pen"></i></button>
              <button class="btn btn--danger-outline btn--sm btn-excluir" data-api="${item.api}" data-id="${item.id}" title="Excluir"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });

      // Eventos de excluir
      tbody.querySelectorAll('.btn-excluir').forEach(btn => {
        btn.addEventListener('click', function () {
          if (!confirm('Deseja realmente excluir este pedido?')) return;
          pedir('DELETE', '/api/' + this.dataset.api + '/' + this.dataset.id).then(r => {
            if (r.ok) { alert('Pedido excluído!'); carregarDados(); }
            else alert(r.erro || 'Erro ao excluir.');
          });
        });
      });

      // Eventos de editar (simplificado: abre prompt para status)
      tbody.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', function () {
          var novoStatus = prompt('Novo status para o pedido ' + this.dataset.numero + ':', this.dataset.status);
          if (!novoStatus) return;
          pedir('PUT', '/api/' + this.dataset.api + '/' + this.dataset.id, { numero: this.dataset.numero, status: novoStatus }).then(r => {
            if (r.ok) { alert('Pedido atualizado!'); carregarDados(); }
            else alert(r.erro || 'Erro ao atualizar.');
          });
        });
      });
    });
  }

  carregarDados();
})();