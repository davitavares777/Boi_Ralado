// index.js — Lógica específica da página inicial (Dashboard)
(function () {
  'use strict';

  function brl(n) { return 'R$ ' + (Number(n) || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function parseNum(s) { return parseFloat(String(s).replace(/[^\d,]/g, '').replace(',', '.')) || 0; }
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function todayIso() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function pedir(metodo, endereco) { return fetch(endereco, { method: metodo }).then(function (r) { return r.json(); }).catch(function () { return { ok: false, erro: 'Servidor offline.' }; }); }

  var PRODUTOS = [
    { nome: 'Boi Ralado Tradicional', preco: 34.90, img: '../img/produtos/boi-ralado.jpg', estoque: 50, categoria: 'Prato Principal', descricao: 'O clássico da casa! Carne bovina desfiada e refogada no ponto certo, servida com arroz branco soltinho, feijão tropeiro, farofa crocante e vinagrete fresco.' },
    { nome: 'Hambúrguer Boi Ralado', preco: 32.00, img: '../img/produtos/hamburguer.jpg', estoque: 40, categoria: 'Lanches', descricao: 'Blend especial de 180g preparado na chapa quente, servido no pão brioche artesanal. Acompanha queijo cheddar, bacon crocante, cebola caramelizada e molho secreto.' },
    { nome: 'Pastel de Boi Ralado', preco: 14.00, img: '../img/produtos/pastel.jpg', estoque: 80, categoria: 'Salgados', descricao: 'Pastel grande e crocante, recheado com boi ralado temperado, queijo mussarela derretido e um toque de orégano. Frito na hora.' },
    { nome: 'Picanha na Chapa', preco: 68.90, img: '../img/produtos/picanha.jpg', estoque: 25, categoria: 'Prato Principal', descricao: 'Picanha nobre fatiada, grelhada na chapa quente. Acompanha arroz, farofa da casa, vinagrete e batata frita crocante.' },
    { nome: 'Prato Executivo da Casa', preco: 29.90, img: '../img/produtos/executivo.jpg', estoque: 60, categoria: 'Executivo', descricao: 'Arroz, feijão, bife grelhado, batata frita e salada fresca. A refeição completa do dia a dia com sabor caseiro.' },
    { nome: 'Batata Rústica', preco: 24.90, img: '../img/produtos/batata.jpg', estoque: 90, categoria: 'Acompanhamento', descricao: 'Batatas com casca em gomos grossos, temperadas com páprica, alho e ervas finas. Acompanha maionese verde.' },
    { nome: 'Suco de Laranja', preco: 9.00, img: '../img/produtos/suco.jpg', estoque: 100, categoria: 'Bebida', descricao: 'Suco de laranja 100% natural, feito na hora, sem açúcar adicionado, sem conservantes. 400ml gelado.' },
    { nome: 'Mousse de Maracujá', preco: 12.00, img: '../img/produtos/mousse.webp', estoque: 45, categoria: 'Sobremesa', descricao: 'Mousse cremosa com polpa de maracujá natural, leite condensado e creme de leite. Doce e azedinho na medida.' }
  ];

  function abrirDetalheProduto(produto) {
    var ov = document.createElement('div');
    ov.className = 'br-ov';
    ov.innerHTML =
      '<div class="produto-detalhe">' +
        '<div class="produto-detalhe__img">' +
          '<img src="' + produto.img + '" alt="' + produto.nome + '" onerror="this.style.display=\'none\'">' +
          '<div class="produto-detalhe__close" id="fecharDetalhe"><i class="fa-solid fa-xmark"></i></div>' +
        '</div>' +
        '<div class="produto-detalhe__body">' +
          '<span class="produto-detalhe__tag">' + produto.categoria + '</span>' +
          '<h3>' + produto.nome + '</h3>' +
          '<p class="produto-detalhe__desc">' + produto.descricao + '</p>' +
          '<div class="produto-detalhe__info">' +
            '<div class="produto-detalhe__info-item"><div class="produto-detalhe__info-label">Preço Unitário</div><div class="produto-detalhe__info-valor">' + brl(produto.preco) + '</div></div>' +
            '<div class="produto-detalhe__info-item"><div class="produto-detalhe__info-label">Estoque</div><div class="produto-detalhe__info-valor">' + produto.estoque + ' un</div></div>' +
          '</div>' +
          '<a href="pedido.html" class="produto-detalhe__btn"><i class="fa-solid fa-cart-plus"></i> Adicionar ao Pedido</a>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);

    function fechar() { ov.remove(); }
    ov.querySelector('#fecharDetalhe').addEventListener('click', fechar);
    ov.addEventListener('click', function (e) { if (e.target === ov) fechar(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { fechar(); document.removeEventListener('keydown', esc); }
    });
  }

  var pgrid = document.getElementById('pgridCardapio');
  if (pgrid) {
    pgrid.addEventListener('click', function (e) {
      var card = e.target.closest('.pcard');
      if (!card) return;
      var idx = parseInt(card.dataset.produto, 10);
      if (isNaN(idx) || !PRODUTOS[idx]) return;
      abrirDetalheProduto(PRODUTOS[idx]);
    });
  }

  function atualizarDashboard() {
    var hoje = todayIso();
    
    Promise.all([pedir('GET', '/api/pedidos'), pedir('GET', '/api/entregas')]).then(function(rs) {
        var pedidosApi = (rs[0].ok && rs[0].dados) ? rs[0].dados : [];
        var entregasApi = (rs[1].ok && rs[1].dados) ? rs[1].dados : [];

        var todosPedidos = [];

        // Dados demonstrativos somente quando o banco está vazio; nada é gravado.
        if (!pedidosApi.length && !entregasApi.length) {
            var hojeDemo = todayIso();
            var ontemDemo = new Date(); ontemDemo.setDate(ontemDemo.getDate() - 1);
            var isoOntemDemo = ontemDemo.getFullYear() + '-' + String(ontemDemo.getMonth()+1).padStart(2,'0') + '-' + String(ontemDemo.getDate()).padStart(2,'0');
            pedidosApi = [
              { id:'demo-b1', numero:'#B2041', mesa:'04', data:hojeDemo, hora:'12:20', total:128.50, status:'Pago', itens:[{nome_item:'Boi Ralado Tradicional',quantidade:2,valor_unit:34.90},{nome_item:'Suco de Laranja',quantidade:2,valor_unit:9}] },
              { id:'demo-b2', numero:'#B2042', mesa:'07', data:hojeDemo, hora:'13:05', total:89.80, status:'Em preparo', itens:[{nome_item:'Prato Executivo da Casa',quantidade:2,valor_unit:29.90},{nome_item:'Batata Rústica',quantidade:1,valor_unit:24.90}] },
              { id:'demo-b3', numero:'#B2038', mesa:'02', data:isoOntemDemo, hora:'12:45', total:68.90, status:'Pago', itens:[{nome_item:'Picanha na Chapa',quantidade:1,valor_unit:68.90}] }
            ];
            entregasApi = [
              { id:'demo-d1', numero:'#D3011', data:hojeDemo, hora:'13:30', total:75.00, status:'Em rota', itens:[{nome_item:'Hambúrguer Boi Ralado',quantidade:1,valor_unit:32},{nome_item:'Pastel de Boi Ralado',quantidade:2,valor_unit:14}] },
              { id:'demo-d2', numero:'#D3008', data:isoOntemDemo, hora:'19:10', total:92.90, status:'Entregue', itens:[{nome_item:'Boi Ralado Tradicional',quantidade:1,valor_unit:34.90},{nome_item:'Picanha na Chapa',quantidade:1,valor_unit:58}] }
            ];
        }

        pedidosApi.forEach(function(p) { 
            p.tipo = 'Balcão'; 
            p.cliente = p.cliente_id ? 'Cliente ID ' + p.cliente_id : (p.mesa ? 'Mesa ' + p.mesa : 'Cliente Balcão');
            if(p.itens && p.itens.length) p.itens = p.itens.map(function(i){ return { nome: i.nome_item, qtd: i.quantidade, preco: i.valor_unit }; });
            todosPedidos.push(p); 
        });
        
        entregasApi.forEach(function(e) { 
            e.tipo = 'Delivery'; 
            e.cliente = 'Cliente Delivery';
            if(e.itens && e.itens.length) e.itens = e.itens.map(function(i){ return { nome: i.nome_item, qtd: i.quantidade, preco: i.valor_unit }; });
            todosPedidos.push(e); 
        });

        var pedidosHoje = todosPedidos.filter(function(p) {
            var isHoje = p.data === hoje;
            var isValido = p.status !== 'Cancelado';
            return isHoje && isValido;
        });

        var balcaoHoje = pedidosHoje.filter(function(p) { return p.tipo === 'Balcão'; });
        var deliveryHoje = pedidosHoje.filter(function(p) { return p.tipo === 'Delivery'; });

        var totalBalcao = balcaoHoje.reduce(function(acc, p) { return acc + parseNum(p.total); }, 0);
        var totalDelivery = deliveryHoje.reduce(function(acc, p) { return acc + parseNum(p.total); }, 0);
        var totalGeral = totalBalcao + totalDelivery;
        
        var emAndamento = pedidosHoje.filter(function(p) { 
            return p.status === 'Pendente' || p.status === 'Em preparo' || p.status === 'Em rota'; 
        }).length;

        var elVendas = document.getElementById('statVendas'); if (elVendas) elVendas.textContent = brl(totalGeral);
        var elBalcao = document.getElementById('statBalcao'); if (elBalcao) elBalcao.textContent = brl(totalBalcao);
        var elDelivery = document.getElementById('statDelivery'); if (elDelivery) elDelivery.textContent = brl(totalDelivery);
        var elAndamento = document.getElementById('statAndamento'); if (elAndamento) elAndamento.textContent = emAndamento;

        renderizarTabela('tbodyBalcao', balcaoHoje.slice(0, 5));
        renderizarTabela('tbodyDelivery', deliveryHoje.slice(0, 5));

        var contagemProdutos = {};
        pedidosHoje.forEach(function(p) {
            if (p.itens && Array.isArray(p.itens)) {
                p.itens.forEach(function(item) {
                    if (item.nome) contagemProdutos[item.nome] = (contagemProdutos[item.nome] || 0) + (parseInt(item.qtd) || 1);
                });
            }
        });
        var maisVendidos = Object.keys(contagemProdutos).map(function(k) {
            return { nome: k, qtd: contagemProdutos[k] };
        }).sort(function(a, b) { return b.qtd - a.qtd; }).slice(0, 6);

        if (!maisVendidos.length) maisVendidos = [{ nome: 'Aguardando pedidos...', qtd: 0 }];
        
        var maxQtd = Math.max.apply(Math, maisVendidos.map(function(o) { return o.qtd; })) || 1;
        var chartHtml = maisVendidos.map(function(item) {
            var w = Math.round((item.qtd / maxQtd) * 100);
            return '<div class="hb"><span>' + esc(item.nome) + '</span><div><i style="--w:' + w + '%"></i></div><b>' + item.qtd + '</b></div>';
        }).join('');
        var chartContainer = document.getElementById('maisVendidosChart');
        if (chartContainer) chartContainer.innerHTML = chartHtml;

        var faturamento = [];
        var diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        for (var i = 6; i >= 0; i--) {
            var d = new Date(); d.setDate(d.getDate() - i);
            var iso = d.toISOString().split('T')[0];
            var valorDia = 0;
            todosPedidos.forEach(function(p) {
                if (p.data === iso && p.status !== 'Cancelado') valorDia += parseNum(p.total);
            });
            faturamento.push({ dia: diasSemana[d.getDay()], valor: valorDia });
        }
        var maxFat = Math.max.apply(Math, faturamento.map(function(o) { return o.valor; })) || 1;
        var fatHtml = faturamento.map(function(item) {
            var h = item.valor > 0 ? Math.max(Math.round((item.valor / maxFat) * 100), 5) : 0;
            return '<div title="' + brl(item.valor) + '"><i style="--h:' + h + '%"></i>' + item.dia + '</div>';
        }).join('');
        var fatContainer = document.getElementById('faturamentoChart');
        if (fatContainer) fatContainer.innerHTML = fatHtml;
    });
  }

  function renderizarTabela(idTbody, lista) {
      var tbody = document.getElementById(idTbody);
      if (!tbody) return;
      if (!lista.length) {
          tbody.innerHTML = '<tr><td colspan="4" class="text-center" style="color:#A89078;">Nenhum pedido recente.</td></tr>';
          return;
      }
      tbody.innerHTML = lista.map(function(p) {
          var statusClass = p.status === 'Cancelado' ? 'danger' : (p.status === 'Pago' || p.status === 'Entregue' ? 'success' : 'warn');
          return '<tr>' +
              '<td><strong>' + esc(p.numero || '#000') + '</strong></td>' +
              '<td>' + esc(p.cliente || 'Cliente') + '</td>' +
              '<td class="num">' + brl(p.total) + '</td>' +
              '<td><span class="pill pill--' + statusClass + '">' + esc(p.status || 'Pago') + '</span></td>' +
          '</tr>';
      }).join('');
  }

  atualizarDashboard();
  setInterval(atualizarDashboard, 10000);
})();