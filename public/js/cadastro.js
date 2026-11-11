// ---------- TROCA DE ABAS (LOGIN / CADASTRO) ----------
    const tabs = document.querySelectorAll('.auth-tab');
    const panels = {
      login: document.getElementById('panelLogin'),
      register: document.getElementById('panelRegister'),
    };
    const sideQuote = document.getElementById('sideQuote');

    const quotes = {
      login: 'Sabor que <span>conquista</span>,<br />gestão que <span>funciona</span>.',
      register: 'Faça parte do time <span>Boi Ralado</span> e ajude a servir esse <span>sucesso</span>.',
    };

    function switchTab(target) {
      tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === target));
      Object.entries(panels).forEach(([key, panel]) => panel.classList.toggle('active', key === target));
      sideQuote.innerHTML = quotes[target];
    }

    tabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));
    document.querySelectorAll('[data-tab]').forEach(el => {
      if (!el.classList.contains('auth-tab')) {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          switchTab(el.dataset.tab);
        });
      }
    });

    // ---------- MOSTRAR/OCULTAR SENHA ----------
    document.querySelectorAll('.toggle-pass').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        btn.innerHTML = isPass
          ? '<i class="fa-solid fa-eye-slash"></i>'
          : '<i class="fa-solid fa-eye"></i>';
      });
    });

    // ---------- MÁSCARA DE CPF ----------
    const cpfInput = document.getElementById('regCpf');
    cpfInput.addEventListener('input', () => {
      let v = cpfInput.value.replace(/\D/g, '').slice(0, 11);
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      cpfInput.value = v;
    });

    // ---------- MÁSCARA DE TELEFONE ----------
    const telInput = document.getElementById('regTelefone');
    telInput.addEventListener('input', () => {
      let v = telInput.value.replace(/\D/g, '').slice(0, 11);
      v = v.replace(/^(\d{2})(\d)/, '($1) $2');
      v = v.replace(/(\d{5})(\d{1,4})$/, '$1-$2');
      telInput.value = v;
    });

    // ---------- SUBMIT LOGIN ----------
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = document.getElementById('loginUser').value.trim();
      const pass = document.getElementById('loginPass').value.trim();

      if (user.length === 0 || pass.length === 0) {
        loginError.querySelector('span').textContent = 'Preencha e-mail/CPF e senha para continuar.';
        loginError.classList.add('show');
        return;
      }

      // Simulação de autenticação — substituir pela chamada real ao backend.
      loginError.classList.remove('show');
    });

    // ---------- SUBMIT CADASTRO ----------
    const registerForm = document.getElementById('registerForm');
    const registerError = document.getElementById('registerError');
    const registerSuccess = document.getElementById('registerSuccess');

    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      registerSuccess.classList.remove('show');

      const nome = document.getElementById('regNome').value.trim();
      const cpf = document.getElementById('regCpf').value.trim();
      const codigo = document.getElementById('regCodigo').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const telefone = document.getElementById('regTelefone').value.trim();
      const senha = document.getElementById('regSenha').value;
      const senhaConfirma = document.getElementById('regSenhaConfirma').value;
      const termos = document.getElementById('regTermos').checked;

      const cpfValido = cpf.replace(/\D/g, '').length === 11;
      const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const telefoneValido = telefone.replace(/\D/g, '').length >= 10;

      let mensagemErro = '';
      if (!nome || !cpf || !codigo || !email || !telefone || !senha || !senhaConfirma) {
        mensagemErro = 'Preencha todos os campos obrigatórios.';
      } else if (!cpfValido) {
        mensagemErro = 'Informe um CPF válido.';
      } else if (!emailValido) {
        mensagemErro = 'Informe um e-mail válido.';
      } else if (!telefoneValido) {
        mensagemErro = 'Informe um telefone válido.';
      } else if (senha.length < 6) {
        mensagemErro = 'A senha deve ter no mínimo 6 caracteres.';
      } else if (senha !== senhaConfirma) {
        mensagemErro = 'As senhas informadas não coincidem.';
      } else if (!termos) {
        mensagemErro = 'Você precisa aceitar os termos de uso para continuar.';
      }

      if (mensagemErro) {
        registerError.querySelector('span').textContent = mensagemErro;
        registerError.classList.add('show');
        return;
      }

      // Simulação de cadastro — substituir pela chamada real ao backend.
      registerError.classList.remove('show');
      registerSuccess.classList.add('show');
      registerForm.reset();

      setTimeout(() => {
        switchTab('login');
        registerSuccess.classList.remove('show');
        document.getElementById('loginUser').value = email;
      }, 1600);
    });7