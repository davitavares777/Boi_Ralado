
  (function () {
    'use strict';

    /* =========================================================
       PRODUTOS
       ========================================================= */
    var PRODUTOS = [
      { nome: 'Boi Ralado Tradicional',  preco: 34.90, img: 'img/produtos/boi-ralado.jpg',  estoque: 50,  categoria: 'Prato Principal',  descricao: 'O clássico da casa! Carne bovina desfiada e refogada no ponto certo, servida com arroz branco soltinho, feijão tropeiro, farofa crocante e vinagrete fresco.' },
      { nome: 'Hambúrguer Boi Ralado',   preco: 32.00, img: 'img/produtos/hamburguer.jpg',  estoque: 40,  categoria: 'Lanches',          descricao: 'Blend especial de 180g preparado na chapa quente, servido no pão brioche artesanal. Acompanha queijo cheddar, bacon crocante, cebola caramelizada e molho secreto.' },
      { nome: 'Pastel de Boi Ralado',    preco: 14.00, img: 'img/produtos/pastel.jpg',      estoque: 80,  categoria: 'Salgados',         descricao: 'Pastel grande e crocante, recheado com boi ralado temperado, queijo mussarela derretido e um toque de orégano. Frito na hora.' },
      { nome: 'Picanha na Chapa',        preco: 68.90, img: 'img/produtos/picanha.jpg',     estoque: 25,  categoria: 'Prato Principal',  descricao: 'Picanha nobre fatiada, grelhada na chapa quente. Acompanha arroz, farofa da casa, vinagrete e batata frita crocante.' },
      { nome: 'Prato Executivo da Casa', preco: 29.90, img: 'img/produtos/executivo.jpg',   estoque: 60,  categoria: 'Executivo',        descricao: 'Arroz, feijão, bife grelhado, batata frita e salada fresca. A refeição completa do dia a dia com sabor caseiro.' },
      { nome: 'Batata Rústica',          preco: 24.90, img: 'img/produtos/batata.jpg',      estoque: 90,  categoria: 'Acompanhamento',   descricao: 'Batatas com casca em gomos grossos, temperadas com páprica, alho e ervas finas. Acompanha maionese verde.' },
      { nome: 'Suco de Laranja',         preco: 9.00,  img: 'img/produtos/suco.jpg',        estoque: 100, categoria: 'Bebida',           descricao: 'Suco de laranja 100% natural, feito na hora, sem açúcar adicionado, sem conservantes. 400ml gelado.' },
      { nome: 'Mousse de Maracujá',      preco: 12.00, img: 'img/produtos/mousse.webp',     estoque: 45,  categoria: 'Sobremesa',        descricao: 'Mousse cremosa com polpa de maracujá natural, leite condensado e creme de leite. Doce e azedinho na medida.' }
    ];

    function brl(n) {
      return 'R$ ' + (Number(n) || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    function toast(msg, err) {
      var t = document.createElement('div');
      t.className = 'br-toast';
      t.style.background = err ? '#b3261e' : '#2b0a0a';
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(function () { t.remove(); }, 3000);
    }

    var tbody = document.getElementById('tbodyPedido');

    /* =========================================================
       SALVAR CARRINHO A PARTIR DA TABELA
       ========================================================= */
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

    /* =========================================================
       TABELA
       ========================================================= */
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
          '<img src="' + (produto.img || '') + '" alt="' + produto.nome + '" class="pedido-produto-img" onerror="this.style.display=\'none\'">' +
          '<span class="pedido-produto-nome">' + produto.nome + '</span>' +
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
        var pc = PRODUTOS.filter(function (p) { return p.nome === item.nome; })[0];
        adicionarLinha(pc || { nome: item.nome, preco: item.preco, img: item.img || '' }, item.qtd);
      });
    }

    /* =========================================================
       MODAL DE DETALHES
       ========================================================= */
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
            '<span class="produto-detalhe__tag">' + (produto.categoria || 'Produto') + '</span>' +
            '<h3>' + produto.nome + '</h3>' +
            '<p class="produto-detalhe__desc">' + (produto.descricao || '') + '</p>' +
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

    /* =========================================================
       MODAL DE LISTA DE PRODUTOS
       ========================================================= */
    function abrirModalProdutos() {
      var ov = document.createElement('div');
      ov.className = 'br-ov';
      var md = document.createElement('div');
      md.className = 'br-md br-md--produtos';

      var html = '<h3>Consultar itens do cardápio</h3><div class="br-tabela"><table><thead><tr>' +
        '<th style="width:60px"></th><th>Produto</th><th class="num" style="width:110px">Preço</th><th style="width:120px">Estoque</th><th style="width:50px"></th>' +
        '</tr></thead><tbody>';
      PRODUTOS.forEach(function (p, i) {
        html += '<tr data-idx="' + i + '">' +
          '<td><div class="br-prod-img"><img src="' + p.img + '" onerror="this.style.display=\'none\'"></div></td>' +
          '<td><span class="br-prod-nome">' + p.nome + '</span></td>' +
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
          var p = PRODUTOS[idx];
          if (!p) return;
          abrirDetalheProduto(p, function (produto, qtd) {
            adicionarItemNoPedido(produto, qtd);
            ov.remove();
          });
        });
      });

      ov.appendChild(md); document.body.appendChild(ov);
      ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    }

    /* =========================================================
       ADICIONAR ITEM NA TABELA
       ========================================================= */
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

    /* =========================================================
       EXPOE FUNÇÃO GLOBAL (por segurança)
       ========================================================= */
    window.__brAbrirProdutos = abrirModalProdutos;

    /* =========================================================
       BOTÕES
       ========================================================= */
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