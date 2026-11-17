// index.js — Lógica específica da página inicial (Dashboard)
(function () {
  'use strict';

  function brl(n) {
    return 'R$ ' + (Number(n) || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function parseNum(s) {
    return parseFloat(String(s).replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  }

  // =========================================================
  // PRODUTOS EM DESTAQUE (mesma ordem dos cards no HTML)
  // =========================================================
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

  // =========================================================
  // DASHBOARD DINÂMICO
  // =========================================================
  function atualizarDashboard() {
    var dadosExemplo = { vendasHoje: 3482.50, pedidos: 42, delivery: 18, clientes: 60 };

    var pedidos = [];
    try { pedidos = JSON.parse(localStorage.getItem('br_pedidos')) || []; } catch (e) {}
    var comandas = [];
    try { comandas = JSON.parse(localStorage.getItem('br_comandas')) || []; } catch (e) {}
    var entregas = [];
    try { entregas = JSON.parse(localStorage.getItem('br_entregas')) || []; } catch (e) {}

    var totalVendas = dadosExemplo.vendasHoje;
    var totalPedidos = dadosExemplo.pedidos;
    var totalDelivery = dadosExemplo.delivery;
    var totalClientes = dadosExemplo.clientes;

    // Soma os dados salvos no navegador
    pedidos.forEach(function (p) { totalVendas += parseNum(p.total); totalPedidos++; });
    comandas.forEach(function (c) { totalVendas += parseNum(c.total); totalPedidos++; });
    entregas.forEach(function (e) { totalVendas += parseNum(e.total); totalDelivery++; });

    var elVendas = document.getElementById('statVendas');
    if (elVendas) elVendas.textContent = brl(totalVendas);
    var elPedidos = document.getElementById('statPedidos');
    if (elPedidos) elPedidos.textContent = totalPedidos;
    var elDelivery = document.getElementById('statDelivery');
    if (elDelivery) elDelivery.textContent = totalDelivery;
    var elClientes = document.getElementById('statClientes');
    if (elClientes) elClientes.textContent = totalClientes;

    // GRÁFICO: MAIS VENDIDOS
    var contagemProdutos = {};
    function addItens(itens) {
      if (!itens || !Array.isArray(itens)) return;
      itens.forEach(function(item) {
        var nome = item.nome || item.produto;
        if (nome) contagemProdutos[nome] = (contagemProdutos[nome] || 0) + (parseInt(item.qtd) || 1);
      });
    }
    pedidos.forEach(function(p) { addItens(p.itens); });
    comandas.forEach(function(c) { addItens(c.itens); });
    entregas.forEach(function(e) { addItens(e.itens); });

    var maisVendidos = Object.keys(contagemProdutos).map(function(k) {
      return { nome: k, qtd: contagemProdutos[k] };
    }).sort(function(a, b) { return b.qtd - a.qtd; }).slice(0, 6);

    if (!maisVendidos.length) {
      maisVendidos = [
        { nome: 'Boi Ralado', qtd: 132 }, { nome: 'Hambúrguer', qtd: 108 }, { nome: 'Picanha', qtd: 84 },
        { nome: 'Pastel', qtd: 70 }, { nome: 'Batata Rústica', qtd: 54 }, { nome: 'Mousse', qtd: 37 }
      ];
    }
    var maxQtd = Math.max.apply(Math, maisVendidos.map(function(o) { return o.qtd; })) || 132;
    var chartHtml = maisVendidos.map(function (item) {
      var w = Math.round((item.qtd / maxQtd) * 100);
      return '<div class="hb"><span>' + item.nome + '</span><div><i style="--w:' + w + '%"></i></div><b>' + item.qtd + '</b></div>';
    }).join('');
    var chartContainer = document.getElementById('maisVendidosChart');
    if (chartContainer) chartContainer.innerHTML = chartHtml;

    // GRÁFICO: FATURAMENTO 7 DIAS
    var faturamento = [];
    var diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    for (var i = 6; i >= 0; i--) {
      var d = new Date(); d.setDate(d.getDate() - i);
      var iso = d.toISOString().split('T')[0];
      var valorDia = 0;
      pedidos.forEach(function(p) { if (p.data === iso) valorDia += parseNum(p.total); });
      comandas.forEach(function(c) { if (c.data === iso) valorDia += parseNum(c.total); });
      entregas.forEach(function(e) { if (e.data === iso) valorDia += parseNum(e.total); });
      faturamento.push({ dia: diasSemana[d.getDay()], valor: valorDia });
    }
    var temDados = faturamento.some(function(f) { return f.valor > 0; });
    if (!temDados) {
      faturamento = [
        { dia: 'Qui', valor: 2940 }, { dia: 'Sex', valor: 3210 }, { dia: 'Sáb', valor: 4480 },
        { dia: 'Dom', valor: 4120 }, { dia: 'Seg', valor: 2680 }, { dia: 'Ter', valor: 2350 }, { dia: 'Qua', valor: 3482 }
      ];
    }
    var maxFat = Math.max.apply(Math, faturamento.map(function(o) { return o.valor; })) || 4480;
    var fatHtml = faturamento.map(function (item) {
      var h = Math.round((item.valor / maxFat) * 100);
      return '<div title="' + brl(item.valor) + '"><i style="--h:' + h + '%"></i>' + item.dia + '</div>';
    }).join('');
    var fatContainer = document.getElementById('faturamentoChart');
    if (fatContainer) fatContainer.innerHTML = fatHtml;

    // ÚLTIMOS PEDIDOS
    var tbody = document.getElementById('ultimosPedidosTbody');
    if (tbody) {
      var todosPedidos = [];
      pedidos.forEach(function(p) { p.tipo = 'Balcão'; todosPedidos.push(p); });
      comandas.forEach(function(c) { c.tipo = 'Comanda'; todosPedidos.push(c); });
      entregas.forEach(function(e) { e.tipo = 'Delivery'; e.cliente = e.cliente || 'Cliente'; e.mesa = '—'; todosPedidos.push(e); });
      
      todosPedidos.sort(function(a, b) {
        var dtA = new Date((a.data || '') + 'T' + (a.hora || '00:00'));
        var dtB = new Date((b.data || '') + 'T' + (b.hora || '00:00'));
        return dtB - dtA;
      });

      var ultimos = todosPedidos.slice(0, 5);
      if (!ultimos.length) {
        ultimos = [
          { numero: '#1104', cliente: 'Maria Oliveira', mesa: 'Mesa 03', tipo: 'Balcão', total: 84.90, status: 'Pago', hora: '13:22' },
          { numero: '#1103', cliente: 'Carlos Souza', mesa: '—', tipo: 'Delivery', total: 62.40, status: 'Pago', hora: '13:08' },
          { numero: '#1102', cliente: 'Ana Silva', mesa: 'Mesa 07', tipo: 'Balcão', total: 128.60, status: 'Pago', hora: '12:54' },
          { numero: '#1101', cliente: 'Bruno Costa', mesa: '—', tipo: 'Delivery', total: 45.80, status: 'Pago', hora: '12:40' },
          { numero: '#1100', cliente: 'Fernanda Lima', mesa: 'Mesa 01', tipo: 'Balcão', total: 96.30, status: 'Pago', hora: '12:22' }
        ];
      }
      tbody.innerHTML = ultimos.map(function (p) {
        return '<tr>' +
          '<td><strong>' + (p.numero || '#000') + '</strong></td>' +
          '<td>' + (p.cliente || 'Cliente') + '</td>' +
          '<td>' + (p.mesa ? (String(p.mesa).indexOf('Mesa') > -1 ? p.mesa : 'Mesa ' + p.mesa) : '—') + '</td>' +
          '<td>' + (p.tipo || 'Balcão') + '</td>' +
          '<td class="num">' + brl(p.total) + '</td>' +
          '<td><span class="pill pill--paid">' + (p.status || 'Pago') + '</span></td>' +
          '<td>' + (p.hora || '12:00') + '</td>' +
        '</tr>';
      }).join('');
    }
  }

  atualizarDashboard();
  setInterval(atualizarDashboard, 10000); // Atualiza a cada 10 segundos para ser mais responsivo
})();