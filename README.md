# 🐂 Boi Ralado — Sistema de Gerenciamento de Restaurante

## 1. Sobre o projeto

O **Boi Ralado** é um sistema web desenvolvido para auxiliar no gerenciamento de um restaurante, reunindo funcionalidades administrativas e operacionais em uma única plataforma.

O objetivo é facilitar o controle de clientes, produtos, fornecedores, pedidos, entregas e relatórios, tornando a administração do restaurante mais organizada e eficiente.

## 2. Tecnologias utilizadas

O projeto foi desenvolvido utilizando as seguintes tecnologias:

- **HTML5:** estrutura das páginas do sistema.
- **CSS3:** estilização e responsividade da interface.
- **JavaScript:** funcionalidades e interatividade do sistema.
- **Node.js:** execução do servidor e comunicação com o banco de dados.
- **SQLite3:** banco de dados responsável pelo armazenamento das informações.
- **Chart.js:** criação de gráficos e visualização de dados.

## 3. Funcionalidades do sistema

### Dashboard
- Visualização de indicadores gerais.
- Resumo das vendas de balcão e delivery.
- Acompanhamento de pedidos em andamento.
- Exibição de gráficos e produtos em destaque.

### Cadastro
- Cadastro de usuários.
- Cadastro de clientes.
- Cadastro de funcionários.

### Clientes
- Registro de informações dos clientes.
- Armazenamento de dados pessoais e endereços.
- Consulta dos clientes cadastrados.

### Produtos
- Cadastro e gerenciamento de produtos.
- Organização por categorias.
- Controle de preços e estoque.
- Cadastro de imagens e informações dos produtos.

### Fornecedores
- Cadastro de fornecedores.
- Registro de informações comerciais e de contato.

### Pedidos
- Registro de pedidos.
- Adição de produtos e quantidades.
- Controle de valores e taxas.
- Acompanhamento do status dos pedidos.

### Delivery
- Registro de entregas.
- Controle de endereço e taxa de entrega.
- Registro de produtos e formas de pagamento.
- Acompanhamento das entregas.

### Relatórios
- Relatórios de vendas.
- Gráficos de faturamento.
- Análise de produtos mais vendidos.
- Visualização das formas de pagamento.
- Separação de informações de balcão e delivery.

## 4. Banco de dados

O sistema utiliza o **SQLite3**, um banco de dados relacional que armazena as informações localmente em um arquivo chamado `banco.db`.

A conexão e a criação das tabelas são realizadas pelo arquivo `db.js`.

Principais tabelas utilizadas:

| Tabela | Finalidade |
|---|---|
| usuario | Armazenar usuários do sistema |
| funcionario | Registrar funcionários e cargos |
| cliente | Armazenar clientes |
| endereco | Registrar endereços |
| fornecedor | Armazenar fornecedores |
| produto | Registrar produtos |
| categoria | Organizar categorias |
| pedido | Armazenar pedidos |
| pedido_item | Registrar itens dos pedidos |
| entrega | Armazenar entregas |
| entrega_item | Registrar itens das entregas |

O banco de dados utiliza relacionamentos entre tabelas e chaves estrangeiras para manter a organização das informações.

## 5. Organização dos arquivos

```text
Boi_Ralado/
│
├── db.js
├── servidorbanco.js
├── banco.db
│
└── public/
    ├── html/
    │   ├── index.html
    │   ├── login.html
    │   ├── cadastro.html
    │   ├── cliente.html
    │   ├── produto.html
    │   ├── fornecedor.html
    │   ├── pedido.html
    │   ├── entrega.html
    │   ├── movimento.html
    │   ├── relatorios.html
    │   ├── relatorio_balcao.html
    │   └── relatorio_delivery.html
    │
    ├── css/
    │   ├── style.css
    │   └── demais arquivos de estilo
    │
    ├── js/
    │   ├── app.js
    │   ├── index.js
    │   ├── grafico.js
    │   ├── pedido.js
    │   ├── entrega.js
    │   └── demais arquivos JavaScript
    │
    └── img/
        ├── logo.png
        └── produtos/
```

## 6. Como executar o projeto

### Pré-requisitos

- Node.js instalado.
- NPM instalado.
- Navegador atualizado.

### Instalação

1. Abra a pasta do projeto no Visual Studio Code.
2. Abra o terminal.
3. Inicialize o projeto e instale a dependência SQLite3:

```bash
npm init -y
npm install sqlite3
```

### Executando o sistema

No terminal, execute:

```bash
node servidorbanco.js
```

Quando o servidor iniciar, aparecerá a mensagem:

```text
Servidor rodando em http://localhost:3000
```

Acesse o sistema pelo navegador:

http://localhost:3000

O banco de dados será criado automaticamente pelo arquivo `db.js` quando o servidor for iniciado.

## 7. Gráficos e relatórios

O sistema utiliza a biblioteca Chart.js para apresentar informações por meio de gráficos.

Quando não existem vendas cadastradas, os gráficos podem apresentar dados demonstrativos para ilustrar o funcionamento do sistema.

Quando existem vendas reais, os relatórios utilizam as informações armazenadas no SQLite3.

## 8. Considerações finais

O projeto Boi Ralado busca oferecer uma solução para melhorar a organização e o gerenciamento de um restaurante.

A integração entre as tecnologias utilizadas permite centralizar informações, facilitar o acompanhamento das operações e apresentar dados importantes para auxiliar na administração do estabelecimento.

O sistema também permite futuras melhorias e implementações, possibilitando sua expansão conforme as necessidades do restaurante.
