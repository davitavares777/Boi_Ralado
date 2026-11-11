// pedido.js — Registrar Pedido (consome /api/produtos)
(function () {
  'use strict';

  function brl(n) {
    return 'R$ ' + (Number(n) || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function num(s) {
    return parseFloat(String(s).replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  }
  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }
  function toast(msg, err) {
    var t = document.createElement('div');
    t.className = 'br-toast';
    t.style.background = err ? '#b3261e' : '#2b0a0a';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3000);
  }
  function pedir(metodo, endereco, dados) {
    return fetch(endereco, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: dados ? JSON.stringify(dados) : undefined
    }).then(function (r) { return r.json(); }).catch(function () { return { ok: false, erro: 'Servidor offline.' }; });
  }

  var IMGS_PADRAO = '../img/produtos/placeholder.jpg';
  function imagemDoProduto(prod) {
    if (prod.imagem) return '../' + prod.imagem;
    var mapa = {
      'Boi Ralado Tradicional':  '../img/produtos/boi-ralado.jpg',
      'Hambúrguer Boi Ralado':   '../img/produtos/hamburguer.jpg',
      'Pastel de Boi Ralado':    '../img/produtos/pastel.jpg',
      'Picanha na Chapa':        '../img/produtos/picanha.jpg',
      'Prato Executivo da Casa': '../img/produtos/executivo.jpg',
      'Batata Rústica':          '../img/produtos/batata.jpg',
      'Suco de Laranja':         '../img/produtos/suco.jpg',
      'Mousse de Maracujá':      '../img/produtos/mousse.webp'
    };
    return mapa[prod.nome] || IMGS_PADRAO;
  }

  var tbody = document.getElementById('tbodyPedido');
  if (!tbody) return;

  function atualizarLinhaVazia() {
    var linhas = tbody.querySelectorAll('tr[data-produto]');
    var vazia = document.getElementById('linhaVazia');
    if (linhas.length === 0) {
      if (!vazia) {
        var tr = document.createElement('tr');
        tr.id = 'linhaVazia';
        tr.innerHTML = '<td colspan="5" class="text-center">Nenhum item no pedido ainda. Clique em <strong>"Adicionar Item"</strong> para começar.</td>';
        tbody.appendChild(tr);
      }
    } else {
      if (vazia) vazia.remove();
    }
  }

  function salvarCarrinhoDaTabela() {
    var carrinho = [];
    tbody.querySelectorAll('tr[data-produto]').forEach(function (tr) {
      carrinho.push({
        nome: tr.dataset.produto,
        preco: parseFloat(tr.dataset.preco) || 0,
        qtd: parseInt(tr.querySelector('.qtd-input').value, 10) || 1,
        img: tr.dataset.img || ''
      });
    });
    try { localStorage.setItem('br_carrinho', JSON.stringify(carrinho)); } catch (e) {}
  }

  function recalcular() {
    var subtotal = 0;
    tbody.querySelectorAll('tr[data-produto]').forEach(function (tr) {
      var preco = parseFloat(tr.dataset.preco) || 0;
      var qtd = parseInt(tr.querySelector('.qtd-input').value, 10) || 1;
      var sub = preco * qtd;
      tr.querySelector('.subtotal-cell').textContent = brl(sub);
      subtotal += sub;
    });
    var taxa = subtotal * 0.10;
    var total = subtotal + taxa;
    document.getElementById('subtotal').textContent = brl(subtotal);
    document.getElementById('taxaServico').textContent = brl(taxa);
    document.getElementById('totalPagar').textContent = brl(total);
  }

  function adicionarLinha(produto, qtdInicial) {
    qtdInicial = qtdInicial || 1;
    var tr = document.createElement('tr');
    tr.dataset.produto = produto.nome;
    tr.dataset.preco = produto.preco;
    tr.dataset.img = produto.img || '';
    tr.innerHTML =
      '<td><input type="checkbox" /></td>' +
      '<td><div class="pedido-produto-cell">' +
        '<img src="' + (produto.img || '') + '" alt="' + esc(produto.nome) + '" class="pedido-produto-img" onerror="this.style.display=\'none\'">' +
        '<span class="pedido-produto-nome">' + esc(produto.nome) + '</span>' +
      '</div></td>' +
      '<td class="num"><input type="number" class="qtd-input" min="1" value="' + qtdInicial + '"></td>' +
      '<td class="num">' + brl(produto.preco) + '</td>' +
      '<td class="num subtotal-cell">' + brl(produto.preco * qtdInicial) + '</td>';

    tbody.appendChild(tr);

    var qtdInp = tr.querySelector('.qtd-input');
    qtdInp.addEventListener('input', function () {
      if (this.value === '' || parseInt(this.value, 10) < 1) this.value = 1;
      recalcular(); salvarCarrinhoDaTabela();
    });
    qtdInp.addEventListener('blur', function () {
      if (this.value === '' || parseInt(this.value, 10) < 1) this.value = 1;
      recalcular(); salvarCarrinhoDaTabela();
    });

    atualizarLinhaVazia();
    recalcular();
    salvarCarrinhoDaTabela();
  }

  function carregarCarrinho() {
    var carrinho = [];
    try { carrinho = JSON.parse(localStorage.getItem('br_carrinho')) || []; } catch (e) {}
    if (!carrinho.length) { atualizarLinhaVazia(); return; }
    carrinho.forEach(function (item) {
      adicionarLinha({ nome: item.nome, preco: item.preco, img: item.img || '' }, item.qtd);
    });
  }

  function abrirDetalheProduto(produto, onAdicionar) {
    var ov = document.createElement('div');
    ov.className = 'br-ov';
    ov.innerHTML =
      '<div class="produto-detalhe">' +
        '<div class="produto-detalhe__img">' +
          '<img src="' + (produto.img || '') + '" onerror="this.style.display=\'none\'">' +
          '<div class="produto-detalhe__close" id="fecharDetalhe"><i class="fa-solid fa-xmark"></i></div>' +
        '</div>' +
        '<div class="produto-detalhe__body">' +
          '<span class="produto-detalhe__tag">' + esc(produto.categoria || 'Produto') + '</span>' +
          '<h3>' + esc(produto.nome) + '</h3>' +
          '<p class="produto-detalhe__desc">' + esc(produto.descricao || '') + '</p>' +
          '<div class="produto-detalhe__info">' +
            '<div class="produto-detalhe__info-item"><div class="produto-detalhe__info-label">Preço Unitário</div><div class="produto-detalhe__info-valor">' + brl(produto.preco) + '</div></div>' +
            '<div class="produto-detalhe__info-item"><div class="produto-detalhe__info-label">Estoque</div><div class="produto-detalhe__info-valor">' + (produto.estoque || 0) + ' un</div></div>' +
          '</div>' +
          '<div class="produto-detalhe__qtd-row">' +
            '<span class="produto-detalhe__qtd-label">Quantidade:</span>' +
            '<div class="qtd-picker">' +
              '<button type="button" id="btnMenos"><i class="fa-solid fa-minus"></i></button>' +
              '<input type="number" id="qtdDetalhe" min="1" value="1">' +
              '<button type="button" id="btnMais"><i class="fa-solid fa-plus"></i></button>' +
            '</div>' +
          '</div>' +
          '<div class="produto-detalhe__total">' +
            '<span class="produto-detalhe__total-label">Total</span>' +
            '<span class="produto-detalhe__total-valor" id="totalDetalhe">' + brl(produto.preco) + '</span>' +
          '</div>' +
          '<button type="button" class="produto-detalhe__btn" id="btnAdicionarPedido"><i class="fa-solid fa-cart-plus"></i> Adicionar ao Pedido</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);

    var qtdInput = ov.querySelector('#qtdDetalhe');
    var totalEl = ov.querySelector('#totalDetalhe');

    function recalc() {
      var q = parseInt(qtdInput.value, 10) || 1;
      if (q < 1) { q = 1; qtdInput.value = 1; }
      totalEl.textContent = brl(produto.preco * q);
    }
    ov.querySelector('#btnMenos').addEventListener('click', function () {
      var q = parseInt(qtdInput.value, 10) || 1;
      if (q > 1) qtdInput.value = q - 1; recalc();
    });
    ov.querySelector('#btnMais').addEventListener('click', function () {
      var q = parseInt(qtdInput.value, 10) || 1;
      qtdInput.value = q + 1; recalc();
    });
    qtdInput.addEventListener('input', recalc);

    function fechar() { ov.remove(); }
    ov.querySelector('#fecharDetalhe').addEventListener('click', fechar);
    ov.addEventListener('click', function (e) { if (e.target === ov) fechar(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { fechar(); document.removeEventListener('keydown', esc); }
    });
    ov.querySelector('#btnAdicionarPedido').addEventListener('click', function () {
      onAdicionar(produto, parseInt(qtdInput.value, 10) || 1);
      fechar();
    });
  }

  function abrirModalProdutos() {
    pedir('GET', '/api/produtos').then(function (r) {
      var produtos = (r.ok ? r.dados : []).map(function (p) {
        return {
          nome: p.nome,
          preco: Number(p.preco) || 0,
          img: imagemDoProduto(p),
          estoque: p.estoque || 0,
          categoria: p.categoria,
          descricao: p.descricao
        };
      });

      var ov = document.createElement('div');
      ov.className = 'br-ov';
      var md = document.createElement('div');
      md.className = 'br-md br-md--produtos';

      if (!produtos.length) {
        md.innerHTML = '<h3>Consultar itens</h3>' +
          '<div class="br-vazio"><i class="fa-solid fa-burger"></i><p>Nenhum produto cadastrado.</p>' +
          '<a href="produto.html" class="btn btn--primary"><i class="fa-solid fa-plus"></i> Cadastrar produto</a></div>';
        var actsV = document.createElement('div'); actsV.className = 'acts';
        var fecharV = document.createElement('button');
        fecharV.type = 'button'; fecharV.className = 'btn btn--outline'; fecharV.textContent = 'Fechar';
        fecharV.addEventListener('click', function () { ov.remove(); });
        actsV.appendChild(fecharV); md.appendChild(actsV);
        ov.appendChild(md); document.body.appendChild(ov);
        ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
        return;
      }

      var html = '<h3>Consultar itens do cardápio</h3><div class="br-tabela"><table><thead><tr>' +
        '<th style="width:60px"></th><th>Produto</th><th class="num" style="width:110px">Preço</th><th style="width:120px">Estoque</th><th style="width:50px"></th>' +
        '</tr></thead><tbody>';
      produtos.forEach(function (p, i) {
        html += '<tr data-idx="' + i + '">' +
          '<td><div class="br-prod-img"><img src="' + p.img + '" onerror="this.style.display=\'none\'"></div></td>' +
          '<td><span class="br-prod-nome">' + esc(p.nome) + '</span></td>' +
          '<td class="num">' + brl(p.preco) + '</td>' +
          '<td><small class="br-prod-estoque">' + p.estoque + ' un</small></td>' +
          '<td><span class="br-add-ico"><i class="fa-solid fa-eye"></i></span></td>' +
        '</tr>';
      });
      html += '</tbody></table></div>';
      md.innerHTML = html;

      var acts = document.createElement('div'); acts.className = 'acts';
      var fechar = document.createElement('button');
      fechar.type = 'button'; fechar.className = 'btn btn--outline'; fechar.textContent = 'Fechar';
      fechar.addEventListener('click', function () { ov.remove(); });
      acts.appendChild(fechar); md.appendChild(acts);

      md.querySelectorAll('tbody tr').forEach(function (tr) {
        tr.addEventListener('click', function () {
          var idx = parseInt(tr.dataset.idx, 10);
          var p = produtos[idx];
          if (!p) return;
          abrirDetalheProduto(p, function (produto, qtd) {
            adicionarItemNoPedido(produto, qtd);
            ov.remove();
          });
        });
      });

      ov.appendChild(md); document.body.appendChild(ov);
      ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    });
  }

  function adicionarItemNoPedido(produto, qtd) {
    var existente = null;
    tbody.querySelectorAll('tr[data-produto]').forEach(function (tr) {
      if (tr.dataset.produto === produto.nome) existente = tr;
    });
    if (existente) {
      var inp = existente.querySelector('.qtd-input');
      inp.value = (parseInt(inp.value, 10) || 1) + qtd;
      recalcular(); salvarCarrinhoDaTabela();
      toast('"' + produto.nome + '" +' + qtd + ' un.');
      return;
    }
    adicionarLinha(produto, qtd);
    toast('"' + produto.nome + '" adicionado (' + qtd + ' un).');
  }

  window.__brAbrirProdutos = abrirModalProdutos;

  var btnRemover = document.getElementById('btnRemoverItem');
  if (btnRemover) {
    btnRemover.addEventListener('click', function (e) {
      e.preventDefault();
      var selecionados = tbody.querySelectorAll('tr[data-produto] input[type="checkbox"]:checked');
      if (!selecionados.length) return toast('Marque os itens que deseja remover.', true);
      selecionados.forEach(function (chk) {
        var tr = chk.closest('tr');
        if (tr) tr.remove();
      });
      atualizarLinhaVazia(); recalcular(); salvarCarrinhoDaTabela();
      toast('Item(ns) removido(s).');
    });
  }

  var chkTodos = document.getElementById('chkTodos');
  if (chkTodos) {
    chkTodos.addEventListener('change', function () {
      var marcado = this.checked;
      tbody.querySelectorAll('tr[data-produto] input[type="checkbox"]').forEach(function (chk) {
        chk.checked = marcado;
      });
    });
  }

  var btnLimpar = document.getElementById('btnLimpar');
  if (btnLimpar) {
    btnLimpar.addEventListener('click', function (e) {
      e.preventDefault();
      if (!confirm('Limpar todos os itens do pedido?')) return;
      tbody.querySelectorAll('tr[data-produto]').forEach(function (tr) { tr.remove(); });
      try { localStorage.removeItem('br_carrinho'); } catch (e) {}
      atualizarLinhaVazia(); recalcular();
      toast('Pedido limpo.');
    });
  }

  var btnSalvar = document.getElementById('btnSalvarPedido');
  if (btnSalvar) {
    btnSalvar.addEventListener('click', function (e) {
      e.preventDefault();
      var linhas = tbody.querySelectorAll('tr[data-produto]');
      if (!linhas.length) return toast('Adicione pelo menos 1 item antes de salvar.', true);

      var pedido = {
        numero: document.getElementById('numPedido').value,
        mesa: document.getElementById('numMesa').value || '—',
        cliente: document.getElementById('nomeCliente').value || 'Cliente',
        data: new Date().toISOString().split('T')[0],
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        total: document.getElementById('totalPagar').textContent,
        status: 'Pago',
        itens: []
      };
      linhas.forEach(function (tr) {
        pedido.itens.push({
          nome: tr.dataset.produto,
          qtd: parseInt(tr.querySelector('.qtd-input').value, 10) || 1,
          preco: parseFloat(tr.dataset.preco) || 0
        });
      });

      var pedidos = [];
      try { pedidos = JSON.parse(localStorage.getItem('br_pedidos')) || []; } catch (e) {}
      pedidos.unshift(pedido);
      try { localStorage.setItem('br_pedidos', JSON.stringify(pedidos)); } catch (e) {}
      try { localStorage.removeItem('br_carrinho'); } catch (e) {}

      toast('Pedido ' + pedido.numero + ' salvo com sucesso! 🎉');
      setTimeout(function () {
        tbody.querySelectorAll('tr[data-produto]').forEach(function (tr) { tr.remove(); });
        atualizarLinhaVazia(); recalcular();
      }, 1000);
    });
  }

  carregarCarrinho();
})();