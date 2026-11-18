// entrega.js
(function () {
  'use strict';

  function brl(n) { return 'R$ ' + (Number(n) || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function num(s) { return parseFloat(String(s).replace(/[^\d,]/g, '').replace(',', '.')) || 0; }
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function toast(msg, err) { var t = document.createElement('div'); t.className = 'br-toast'; t.style.background = err ? '#b3261e' : '#2b0a0a'; t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3000); }
  function pedir(metodo, endereco, dados) { return fetch(endereco, { method: metodo, headers: { 'Content-Type': 'application/json' }, body: dados ? JSON.stringify(dados) : undefined }).then(function (r) { return r.json(); }).catch(function () { return { ok: false, erro: 'Servidor offline.' }; }); }

  var IMGS_PADRAO = '../img/produtos/placeholder.jpg';
  function imagemDoProduto(prod) {
    if (prod.imagem) return '../' + prod.imagem;
    var mapa = {
      'Boi Ralado Tradicional':  '../img/produtos/boi-ralado.jpg', 'Hambúrguer Boi Ralado':   '../img/produtos/hamburguer.jpg',
      'Pastel de Boi Ralado':    '../img/produtos/pastel.jpg', 'Picanha na Chapa':        '../img/produtos/picanha.jpg',
      'Prato Executivo da Casa': '../img/produtos/executivo.jpg', 'Batata Rústica':          '../img/produtos/batata.jpg',
      'Suco de Laranja':         '../img/produtos/suco.jpg', 'Mousse de Maracujá':      '../img/produtos/mousse.webp'
    };
    return mapa[prod.nome] || IMGS_PADRAO;
  }

  var tbody = document.getElementById('tbodyEntrega');
  if (!tbody) return;

  function atualizarLinhaVazia() {
    var linhas = tbody.querySelectorAll('tr[data-produto]');
    var vazia = document.getElementById('linhaVazia');
    if (linhas.length === 0) {
      if (!vazia) {
        var tr = document.createElement('tr');
        tr.id = 'linhaVazia';
        tr.innerHTML = '<td colspan="5" class="text-center">Nenhum item na entrega ainda. Clique em <strong>"Adicionar Item"</strong> para começar.</td>';
        tbody.appendChild(tr);
      }
    } else {
      if (vazia) vazia.remove();
    }
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
    var taxa = num(document.getElementById('entregaTaxa').value);
    var total = subtotal + taxa;
    document.getElementById('entregaSubtotal').value = brl(subtotal);
    document.getElementById('entregaTotal').value = brl(total);
  }

  function adicionarLinha(produto, qtdInicial) {
    qtdInicial = qtdInicial || 1;
    var tr = document.createElement('tr');
    tr.dataset.produto = produto.nome;
    tr.dataset.preco = produto.preco;
    tr.dataset.img = produto.img || '';
    tr.innerHTML =
      '<td><input type="checkbox" /></td>' +
      '<td><div class="entrega-produto-cell">' +
        '<img src="' + (produto.img || '') + '" alt="' + esc(produto.nome) + '" class="entrega-produto-img" onerror="this.style.display=\'none\'">' +
        '<span class="entrega-produto-nome">' + esc(produto.nome) + '</span>' +
      '</div></td>' +
      '<td class="num"><input type="number" class="qtd-input" min="1" value="' + qtdInicial + '"></td>' +
      '<td class="num">' + brl(produto.preco) + '</td>' +
      '<td class="num subtotal-cell">' + brl(produto.preco * qtdInicial) + '</td>';
    tbody.appendChild(tr);

    var qtdInp = tr.querySelector('.qtd-input');
    qtdInp.addEventListener('input', function () {
      if (this.value === '' || parseInt(this.value, 10) < 1) this.value = 1;
      recalcular();
    });
    qtdInp.addEventListener('blur', function () {
      if (this.value === '' || parseInt(this.value, 10) < 1) this.value = 1;
      recalcular();
    });

    atualizarLinhaVazia();
    recalcular();
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
          '<button type="button" class="produto-detalhe__btn" id="btnAdicionarPedido"><i class="fa-solid fa-cart-plus"></i> Adicionar à Entrega</button>' +
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
      var produtosApi = (r.ok ? r.dados : []) || [];
      
      var PRODUTOS_EXEMPLO = [
        { nome: 'Boi Ralado Tradicional', preco: 34.90, categoria: 'Prato Principal', descricao: 'O clássico da casa!', estoque: 50, img: '../img/produtos/boi-ralado.jpg' },
        { nome: 'Hambúrguer Boi Ralado', preco: 32.00, categoria: 'Lanches', descricao: 'Blend especial de 180g', estoque: 40, img: '../img/produtos/hamburguer.jpg' },
        { nome: 'Pastel de Boi Ralado', preco: 14.00, categoria: 'Salgados', descricao: 'Pastel grande e crocante', estoque: 80, img: '../img/produtos/pastel.jpg' },
        { nome: 'Picanha na Chapa', preco: 68.90, categoria: 'Prato Principal', descricao: 'Picanha nobre fatiada', estoque: 25, img: '../img/produtos/picanha.jpg' },
        { nome: 'Prato Executivo da Casa', preco: 29.90, categoria: 'Executivo', descricao: 'A refeição completa', estoque: 60, img: '../img/produtos/executivo.jpg' },
        { nome: 'Batata Rústica', preco: 24.90, categoria: 'Acompanhamento', descricao: 'Batatas com casca', estoque: 90, img: '../img/produtos/batata.jpg' },
        { nome: 'Suco de Laranja', preco: 9.00, categoria: 'Bebida', descricao: 'Suco 100% natural', estoque: 100, img: '../img/produtos/suco.jpg' },
        { nome: 'Mousse de Maracujá', preco: 12.00, categoria: 'Sobremesa', descricao: 'Mousse cremosa', estoque: 45, img: '../img/produtos/mousse.webp' }
      ];
      
      var produtos = [];
      var nomesVistos = {};
      
      produtosApi.forEach(function(p) {
        produtos.push({ nome: p.nome, preco: Number(p.preco) || 0, img: imagemDoProduto(p), estoque: p.estoque || 0, categoria: p.categoria, descricao: p.descricao });
        nomesVistos[p.nome] = true;
      });
      
      PRODUTOS_EXEMPLO.forEach(function(p) {
        if (!nomesVistos[p.nome]) produtos.push(p);
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
        html += '<tr data-idx="' + i + '"><td><div class="br-prod-img"><img src="' + p.img + '" onerror="this.style.display=\'none\'"></div></td><td><span class="br-prod-nome">' + esc(p.nome) + '</span></td><td class="num">' + brl(p.preco) + '</td><td><small class="br-prod-estoque">' + p.estoque + ' un</small></td><td><span class="br-add-ico"><i class="fa-solid fa-eye"></i></span></td></tr>';
      });
      html += '</tbody></table></div>';
      md.innerHTML = html;

      var acts = document.createElement('div'); acts.className = 'acts';
      var fechar = document.createElement('button'); fechar.type = 'button'; fechar.className = 'btn btn--outline'; fechar.textContent = 'Fechar';
      fechar.addEventListener('click', function () { ov.remove(); });
      acts.appendChild(fechar); md.appendChild(acts);

      md.querySelectorAll('tbody tr').forEach(function (tr) {
        tr.addEventListener('click', function () {
          var idx = parseInt(tr.dataset.idx, 10);
          var p = produtos[idx];
          if (!p) return;
          abrirDetalheProduto(p, function (produto, qtd) {
            adicionarItemNaEntrega(produto, qtd);
            ov.remove();
          });
        });
      });

      ov.appendChild(md); document.body.appendChild(ov);
      ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    });
  }

  function adicionarItemNaEntrega(produto, qtd) {
    var existente = null;
    tbody.querySelectorAll('tr[data-produto]').forEach(function (tr) {
      if (tr.dataset.produto === produto.nome) existente = tr;
    });
    if (existente) {
      var inp = existente.querySelector('.qtd-input');
      inp.value = (parseInt(inp.value, 10) || 1) + qtd;
      recalcular();
      toast('"' + produto.nome + '" +' + qtd + ' un.');
      return;
    }
    adicionarLinha(produto, qtd);
    toast('"' + produto.nome + '" adicionado (' + qtd + ' un).');
  }

  window.__brAbrirProdutosEntrega = abrirModalProdutos;

  document.getElementById('btnRemoverItem').addEventListener('click', function () {
    var selecionados = tbody.querySelectorAll('tr[data-produto] input[type="checkbox"]:checked');
    if (!selecionados.length) return toast('Marque os itens que deseja remover.', true);
    selecionados.forEach(function (chk) {
      var tr = chk.closest('tr');
      if (tr) tr.remove();
    });
    atualizarLinhaVazia(); recalcular();
    toast('Item(ns) removido(s).');
  });

  document.getElementById('chkTodos').addEventListener('change', function () {
    var marcado = this.checked;
    tbody.querySelectorAll('tr[data-produto] input[type="checkbox"]').forEach(function (chk) {
      chk.checked = marcado;
    });
  });

  document.getElementById('entregaTaxa').addEventListener('input', function () {
    var v = this.value.replace(/\D/g, '');
    if (!v) { this.value = ''; recalcular(); return; }
    while (v.length < 3) v = '0' + v;
    var inteiro = v.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    this.value = inteiro + ',' + v.slice(-2);
    recalcular();
  });

  document.getElementById('btnLimparEntrega').addEventListener('click', function () {
    if (!confirm('Limpar todos os itens da entrega?')) return;
    tbody.querySelectorAll('tr[data-produto]').forEach(function (tr) { tr.remove(); });
    document.getElementById('entregaTaxa').value = 'R$ 0,00';
    atualizarLinhaVazia(); recalcular();
    toast('Entrega limpa.');
  });

  document.getElementById('btnImprimirEntrega').addEventListener('click', function () {
    toast('Ordem enviada para impressão! 🖨️');
    window.print();
  });

  document.getElementById('btnGerarOrdem').addEventListener('click', function () {
    var linhas = tbody.querySelectorAll('tr[data-produto]');
    if (!linhas.length) return toast('Adicione pelo menos 1 item antes de gerar a ordem.', true);

    var itens = [];
    linhas.forEach(function (tr) {
      itens.push({ nome: tr.dataset.produto, qtd: parseInt(tr.querySelector('.qtd-input').value, 10) || 1, preco: parseFloat(tr.dataset.preco) || 0 });
    });

    var entregaObj = {
      numero: document.getElementById('entregaNumero').value,
      data: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      pagamento: document.getElementById('entregaPagamento').value,
      taxa: num(document.getElementById('entregaTaxa').value),
      subtotal: num(document.getElementById('entregaSubtotal').value),
      total: num(document.getElementById('entregaTotal').value),
      status: 'Em rota',
      itens: itens
    };

    var btnGerar = document.getElementById('btnGerarOrdem');
    btnGerar.disabled = true;
    btnGerar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Gerando...';

    pedir('POST', '/api/entregas', entregaObj).then(function(r) {
      btnGerar.disabled = false;
      btnGerar.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Gerar Ordem';
      if (!r.ok) return toast(r.erro || 'Erro ao gerar ordem.', true);
      toast('Ordem ' + entregaObj.numero + ' gerada no banco! 🛵');
      setTimeout(function () {
        tbody.querySelectorAll('tr[data-produto]').forEach(function (tr) { tr.remove(); });
        document.getElementById('entregaTaxa').value = 'R$ 0,00';
        atualizarLinhaVazia(); recalcular();
      }, 1000);
    });
  });

  recalcular();
})();