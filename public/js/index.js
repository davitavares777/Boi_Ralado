// index.js — Lógica específica da página inicial (Dashboard)
(function () {
  'use strict';

  function brl(n) {
    return 'R$ ' + (Number(n) || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  // =========================================================
  // PRODUTOS EM DESTAQUE (mesma ordem dos cards no HTML)
  // =========================================================
  var PRODUTOS = [
    {
      nome: 'Boi Ralado Tradicional',
      preco: 34.90,
      img: '../img/produtos/boi-ralado.jpg',
      estoque: 50,
      categoria: 'Prato Principal',
      descricao: 'O clássico da casa! Carne bovina desfiada e refogada no ponto certo, servida com arroz branco soltinho, feijão tropeiro, farofa crocante e vinagrete fresco.'
    },
    {
      nome: 'Hambúrguer Boi Ralado',
      preco: 32.00,
      img: '../img/produtos/hamburguer.jpg',
      estoque: 40,
      categoria: 'Lanches',
      descricao: 'Blend especial de 180g preparado na chapa quente, servido no pão brioche artesanal. Acompanha queijo cheddar, bacon crocante, cebola caramelizada e molho secreto.'
    },
    {
      nome: 'Pastel de Boi Ralado',
      preco: 14.00,
      img: '../img/produtos/pastel.jpg',
      estoque: 80,
      categoria: 'Salgados',
      descricao: 'Pastel grande e crocante, recheado com boi ralado temperado, queijo mussarela derretido e um toque de orégano. Frito na hora.'
    },
    {
      nome: 'Picanha na Chapa',
      preco: 68.90,
      img: '../img/produtos/picanha.jpg',
      estoque: 25,
      categoria: 'Prato Principal',
      descricao: 'Picanha nobre fatiada, grelhada na chapa quente. Acompanha arroz, farofa da casa, vinagrete e batata frita crocante.'
    },
    {
      nome: 'Prato Executivo da Casa',
      preco: 29.90,
      img: '../img/produtos/executivo.jpg',
      estoque: 60,
      categoria: 'Executivo',
      descricao: 'Arroz, feijão, bife grelhado, batata frita e salada fresca. A refeição completa do dia a dia com sabor caseiro.'
    },
    {
      nome: 'Batata Rústica',
      preco: 24.90,
      img: '../img/produtos/batata.jpg',
      estoque: 90,
      categoria: 'Acompanhamento',
      descricao: 'Batatas com casca em gomos grossos, temperadas com páprica, alho e ervas finas. Acompanha maionese verde.'
    },
    {
      nome: 'Suco de Laranja',
      preco: 9.00,
      img: '../img/produtos/suco.jpg',
      estoque: 100,
      categoria: 'Bebida',
      descricao: 'Suco de laranja 100% natural, feito na hora, sem açúcar adicionado, sem conservantes. 400ml gelado.'
    },
    {
      nome: 'Mousse de Maracujá',
      preco: 12.00,
      img: '../img/produtos/mousse.webp',
      estoque: 45,
      categoria: 'Sobremesa',
      descricao: 'Mousse cremosa com polpa de maracujá natural, leite condensado e creme de leite. Doce e azedinho na medida.'
    }
  ];

  // =========================================================
  // MODAL DE DETALHES DO PRODUTO
  // =========================================================
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
            '<div class="produto-detalhe__info-item">' +
              '<div class="produto-detalhe__info-label">Preço Unitário</div>' +
              '<div class="produto-detalhe__info-valor">' + brl(produto.preco) + '</div>' +
            '</div>' +
            '<div class="produto-detalhe__info-item">' +
              '<div class="produto-detalhe__info-label">Estoque</div>' +
              '<div class="produto-detalhe__info-valor">' + produto.estoque + ' un</div>' +
            '</div>' +
          '</div>' +
          '<a href="pedido.html" class="produto-detalhe__btn">' +
            '<i class="fa-solid fa-cart-plus"></i> Adicionar ao Pedido' +
          '</a>' +
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

  // =========================================================
  // CLIQUE NOS CARDS DO CARDÁPIO
  // =========================================================
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
})();