(function () {
  const { api, fmt, waLink, esc, meusAgendamentos } = window.Salao;
  const $ = (s, el = document) => el.querySelector(s);
  const app = $('#app');
  const bar = $('#bar');
  const barInfo = $('#bar-info');
  const barBtn = $('#bar-btn');

  /* ---------- Ícones ---------- */
  const I = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>',
    scissors: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    sunset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M17 18a5 5 0 0 0-10 0M12 9V2M4.2 10.2l1.4 1.4M1 18h2M21 18h2M18.4 11.6l1.4-1.4M23 22H1M16 5l-4 4-4-4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4C2.7 15.6 2.2 13.8 2.2 12 2.2 6.6 6.6 2.2 12 2.2c2.6 0 5.1 1 6.9 2.9 1.8 1.8 2.9 4.3 2.9 6.9 0 5.4-4.4 9.8-9.8 9.8zM20.4 3.6C18.2 1.3 15.2 0 12 0 5.4 0 0 5.4 0 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6c1.8 1 3.8 1.5 5.8 1.5 6.6 0 12-5.4 12-12 0-3.2-1.2-6.2-3.6-8.3z"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M10 15.5l1.5 1.5 3-3"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    wifi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 1l22 22M16.7 11.1A10.9 10.9 0 0 1 19 12.5M5 12.5a10.9 10.9 0 0 1 5.2-2.4M10.7 5A16 16 0 0 1 22.6 9M1.4 9a16 16 0 0 1 4.7-2.9M8.5 16.1a5 5 0 0 1 7 0M12 20h.01"/></svg>',
  };

  /* ---------- Estado ---------- */
  let C = null; // config vinda da planilha
  let primeiroRender = true;
  let modoCancelar = false;
  const st = {
    servicos: [], // ids, na ordem em que foram escolhidos
    prefs: {}, // {servicoId: profId | 'qualquer'}
    date: null,
    hora: null,
    dados: carregarCliente(),
    dias: null, // cache do calendário
    slots: {}, // cache: chave -> {horarios, planos}
    erroHorario: '',
    enviando: false,
    reagendar: null, // agendamento existente quando a cliente está trocando o horário
  };

  const PASSOS = [
    { id: 'servicos', nome: 'Serviços' },
    { id: 'profissional', nome: 'Profissional' },
    { id: 'horario', nome: 'Dia e horário' },
    { id: 'dados', nome: 'Seus dados' },
    { id: 'revisao', nome: 'Confirmação' },
  ];

  const atende = (p, s) => p.categorias.includes('*') || p.categorias.includes(s.categoria);
  const quemFaz = (s) => C.profissionais.filter((p) => atende(p, s));
  /** O passo "Com quem?" só aparece se algum serviço escolhido tiver mais de uma profissional. */
  const temEscolha = () => servicosEscolhidos().some((s) => quemFaz(s).length > 1);
  const passosAtivos = () => {
    if (st.reagendar) return [{ id: 'horario', nome: 'Novo dia e horário' }, { id: 'revisao', nome: 'Confirmação' }];
    return PASSOS.filter((p) => p.id !== 'profissional' || (st.servicos.length ? temEscolha() : C.profissionais.length > 1));
  };
  const prazoH = () => (C && C.cfg && C.cfg.prazoAlteracaoHoras) || 5;
  const linkGerenciar = (token) => location.origin + location.pathname + '?gerenciar=' + token;

  function carregarCliente() {
    try {
      return JSON.parse(localStorage.getItem('salao_cliente') || '{}');
    } catch (e) {
      return {};
    }
  }
  function salvarCliente(d) {
    try {
      localStorage.setItem('salao_cliente', JSON.stringify({ nome: d.nome, whatsapp: d.whatsapp, email: d.email }));
    } catch (e) {}
  }

  const servicosEscolhidos = () => st.servicos.map((id) => C.servicos.find((s) => s.id === id)).filter(Boolean);
  const duracaoTotal = () => servicosEscolhidos().reduce((a, s) => a + s.duracao, 0);
  const totalPreco = () => servicosEscolhidos().reduce((a, s) => a + (s.preco || 0), 0);
  const temAPartir = () => servicosEscolhidos().some((s) => s.aPartirDe || s.preco == null);
  const prefsAtivas = () => {
    const out = {};
    st.servicos.forEach((id) => { if (st.prefs[id] && st.prefs[id] !== 'qualquer') out[id] = st.prefs[id]; });
    return out;
  };
  const chaveAgenda = () => st.servicos.join(',') + '|' + JSON.stringify(prefsAtivas()) + '|' + (st.reagendar ? st.reagendar.token : '');
  const excluir = () => (st.reagendar ? st.reagendar.token : '');
  const precoTotalTxt = () => (temAPartir() ? 'a partir de ' : '') + fmt.brl(totalPreco());
  const planoAtual = () => (st.hora && st.slots[chaveAgenda() + '|' + st.date]?.planos[st.hora]) || null;

  /* ---------- Navegação (cada passo tem um #endereço, então o botão voltar do celular funciona) ---------- */
  function ir(passo, replace) {
    const url = location.pathname + location.search.replace(/[?&]servico=[^&]*/, '') + '#' + passo;
    if (replace) history.replaceState(null, '', url);
    else history.pushState(null, '', url);
    render();
  }

  function passoAtual() {
    const h = location.hash.slice(1) || 'servicos';
    const ativos = passosAtivos().map((p) => p.id);
    if (h === 'sucesso') return st.ultimo ? 'sucesso' : 'servicos';
    // Não deixa pular etapas (ex.: alguém abriu direto o link #revisao).
    const req = {
      servicos: true,
      profissional: st.servicos.length > 0,
      horario: st.servicos.length > 0,
      dados: !!planoAtual(),
      revisao: !!planoAtual() && !!st.dados.nome && (!!st.dados.whatsapp || !!st.reagendar),
    };
    if (!ativos.includes(h) || !req[h]) {
      for (let i = ativos.length - 1; i >= 0; i--) if (req[ativos[i]] && ativos.indexOf(ativos[i]) <= Math.max(0, ativos.indexOf(h))) return ativos[i];
      return 'servicos';
    }
    return h;
  }

  function proximo(atual) {
    const ativos = passosAtivos().map((p) => p.id);
    return ativos[ativos.indexOf(atual) + 1];
  }

  $('#btn-voltar').addEventListener('click', () => {
    const p = passoAtual();
    if (st.reagendar && p === 'horario') location.href = '?gerenciar=' + st.reagendar.token;
    else if (modoCancelar || p === 'servicos' || p === 'sucesso') location.href = 'index.html';
    else history.back();
  });
  window.addEventListener('popstate', render);

  /* ---------- Cabeçalho e barra inferior ---------- */
  function header(passo) {
    const ativos = passosAtivos();
    const i = ativos.findIndex((p) => p.id === passo);
    if (i < 0) {
      $('#passo-label').textContent = passo === 'sucesso' ? 'Tudo certo!' : 'Seu agendamento';
      $('#progress').style.width = '100%';
      return;
    }
    $('.bk-header__title strong').textContent = st.reagendar ? 'Alterar horário' : 'Agendar horário';
    $('#passo-label').textContent = `Passo ${i + 1} de ${ativos.length} · ${ativos[i].nome}`;
    $('#progress').style.width = `${((i + 1) / ativos.length) * 100}%`;
    document.title = `${ativos[i].nome} · Agendar | Elainy Ferraz`;
  }

  function setBar(info, label, enabled, onClick) {
    if (!label) {
      bar.hidden = true;
      return;
    }
    bar.hidden = false;
    barInfo.innerHTML = info || '';
    barBtn.innerHTML = label;
    barBtn.disabled = !enabled;
    barBtn.onclick = onClick;
  }

  /* ---------- Render principal ---------- */
  function render() {
    if (!C) return;
    const passo = passoAtual();
    if (location.hash.slice(1) !== passo) history.replaceState(null, '', '#' + passo);
    header(passo);
    ({ servicos: viewServicos, profissional: viewProfissional, horario: viewHorario, dados: viewDados, revisao: viewRevisao, sucesso: viewSucesso })[passo]();
    window.scrollTo({ top: 0 });
    // Leva o foco para o título do passo (leitores de tela anunciam a mudança).
    const h1 = $('h1', app);
    if (h1 && !primeiroRender) h1.focus({ preventScroll: true });
    primeiroRender = false;
  }

  /* ---------- Passo 1: Serviços ---------- */
  function viewServicos() {
    const meus = meusAgendamentos.list();
    const cats = [...new Set(C.servicos.map((s) => s.categoria))];
    app.innerHTML = `
      <section class="bk-step">
        ${meus.length ? `
          <div class="mine">
            <div class="mine__title">Seus próximos horários</div>
            ${meus.map((b) => `
              <div class="mine__item">
                <span><b>${esc(fmt.extenso(b.data))}, ${esc(b.hora)}</b><br><small>${esc(b.servicos)}</small></span>
                <a href="?gerenciar=${esc(b.token)}">Ver ou alterar</a>
              </div>`).join('')}
          </div>` : ''}
        <h1 tabindex="-1">O que vamos fazer?</h1>
        <p class="bk-sub">Escolha um ou mais serviços. A gente organiza a ordem e quem atende.</p>
        ${cats.map((cat) => `
          <div class="bk-group" role="group" aria-labelledby="cat-${esc(cat)}">
            <div class="bk-group__title" id="cat-${esc(cat)}">${esc(cat)}</div>
            <div class="opt-list">
              ${C.servicos.filter((s) => s.categoria === cat).map((s) => `
                <label class="opt">
                  <input type="checkbox" name="servico" value="${esc(s.id)}" ${st.servicos.includes(s.id) ? 'checked' : ''}>
                  <span class="opt__check">${I.check}</span>
                  <span class="opt__body">
                    <span class="opt__name">${esc(s.nome)}</span>
                    ${s.descricao ? `<span class="opt__desc">${esc(s.descricao)}</span>` : ''}
                  </span>
                  <span class="opt__aside">
                    <span class="opt__price">${s.aPartirDe ? '<small>a partir de</small>' : ''}${s.preco == null ? 'Sob consulta' : fmt.brl(s.preco)}</span>
                    <span class="opt__time">${fmt.duracao(s.duracao)}</span>
                  </span>
                </label>`).join('')}
            </div>
          </div>`).join('')}
      </section>`;

    app.querySelectorAll('input[name=servico]').forEach((inp) =>
      inp.addEventListener('change', () => {
        if (inp.checked) st.servicos.push(inp.value);
        else st.servicos = st.servicos.filter((id) => id !== inp.value);
        st.date = st.hora = null;
        barServicos();
      })
    );
    barServicos();
  }

  function barServicos() {
    const n = st.servicos.length;
    const info = n
      ? `<strong>${n} ${n === 1 ? 'serviço' : 'serviços'} · ${fmt.duracao(duracaoTotal())}</strong><span>${precoTotalTxt()}</span>`
      : '<strong>Nenhum serviço escolhido</strong><span>Toque para escolher</span>';
    setBar(info, 'Continuar', n > 0, () => ir(proximo('servicos')));
  }

  /* ---------- Passo 2: Com quem? (por serviço, só quando há escolha) ---------- */
  function viewProfissional() {
    const avatar = (p) => `<span class="avatar">${p.foto ? `<img src="${esc(p.foto)}" alt="">` : esc(p.nome.charAt(0))}</span>`;
    const blocos = servicosEscolhidos().map((s) => {
      const quem = quemFaz(s);
      if (quem.length <= 1) {
        return `<div class="bk-group"><div class="bk-group__title">${esc(s.nome)}</div>
          <div class="opt opt--static">${quem[0] ? avatar(quem[0]) : ''}<span class="opt__body"><span class="opt__name">${esc(quem[0]?.nome || '—')}</span><span class="opt__desc">Profissional deste serviço</span></span></div></div>`;
      }
      const atual = st.prefs[s.id] || 'qualquer';
      const opcao = (id, nome, av, desc) => `
        <label class="opt">
          <input type="radio" name="prof-${esc(s.id)}" value="${esc(id)}" data-serv="${esc(s.id)}" ${atual === id ? 'checked' : ''}>
          ${av}
          <span class="opt__body"><span class="opt__name">${esc(nome)}</span>${desc ? `<span class="opt__desc">${esc(desc)}</span>` : ''}</span>
          <span class="opt__check">${I.check}</span>
        </label>`;
      return `<div class="bk-group" role="radiogroup" aria-label="Profissional para ${esc(s.nome)}">
        <div class="bk-group__title">${esc(s.nome)}</div>
        <div class="opt-list">
          ${opcao('qualquer', 'Sem preferência', `<span class="avatar avatar--any">${I.users}</span>`, 'Mostra mais horários livres')}
          ${quem.map((p) => opcao(p.id, p.nome, avatar(p), '')).join('')}
        </div></div>`;
    });

    app.innerHTML = `
      <section class="bk-step">
        <h1 tabindex="-1">Com quem?</h1>
        <p class="bk-sub">Escolha a profissional de cada serviço, ou deixe "Sem preferência" para ver mais horários.</p>
        ${blocos.join('')}
      </section>`;

    app.querySelectorAll('input[type=radio]').forEach((inp) =>
      inp.addEventListener('change', () => {
        st.prefs[inp.dataset.serv] = inp.value;
        st.date = st.hora = null;
      })
    );
    setBar('<strong>Profissionais</strong><span>Pode mudar depois</span>', 'Continuar', true, () => ir('horario'));
  }

  /* ---------- Passo 3: Dia e horário ---------- */
  async function viewHorario() {
    app.innerHTML = `
      <section class="bk-step">
        <h1 tabindex="-1">Quando fica bom?</h1>
        <p class="bk-sub">${esc(servicosEscolhidos().map((s) => s.nome).join(' + '))} · ${fmt.duracao(duracaoTotal())}</p>
        ${st.erroHorario ? `<div class="alert alert--error" role="alert">${I.alert}<span>${esc(st.erroHorario)}</span></div>` : ''}
        <div class="bk-group">
          <div class="bk-group__title" id="dias-label">Escolha o dia</div>
          <div class="days" id="days" role="group" aria-labelledby="dias-label">
            ${Array.from({ length: 7 }, () => '<div class="skeleton" style="flex:none;width:68px;height:88px"></div>').join('')}
          </div>
        </div>
        <div class="bk-group" id="slots-wrap"></div>
      </section>`;
    st.erroHorario = '';
    barHorario();

    const key = chaveAgenda();
    try {
      if (!st.dias || st.dias.key !== key) {
        const r = await api.days(st.servicos, prefsAtivas(), excluir());
        st.dias = { key, lista: r.dias };
      }
    } catch (e) {
      return erroConexao($('#days'), viewHorario);
    }
    if (passoAtual() !== 'horario' || !$('#days')) return;

    const disponiveis = new Set(st.dias.lista);
    if (!disponiveis.size) {
      $('#days').outerHTML = `
        <div class="state">
          <div class="state__icon">${I.cal}</div>
          <h2>Agenda cheia por enquanto</h2>
          <p>Não encontramos horário em que ${st.servicos.length > 1 ? 'todos esses serviços caibam' : 'esse serviço caiba'} nos próximos ${C.cfg.diasAFrente} dias. Tente separar os serviços ou chame a gente no WhatsApp que a gente encaixa você.</p>
          ${botaoWhats('Oi! Tentei agendar pelo site mas não achei horário livre. Vocês conseguem me encaixar?')}
        </div>`;
      return;
    }

    // Mostra todos os dias do período (fechados ficam desabilitados) para dar noção de calendário.
    const hoje = new Date();
    const todos = [];
    for (let i = 0; i <= C.cfg.diasAFrente; i++) todos.push(fmt.iso(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i, 12)));
    if (!st.date || !disponiveis.has(st.date)) st.date = st.dias.lista[0];

    const days = $('#days');
    days.innerHTML = todos.map((iso) => {
      const ok = disponiveis.has(iso);
      const d = fmt.parse(iso);
      const rotulo = iso === fmt.iso(hoje) ? 'hoje' : fmt.diaSemana(iso, true);
      return `<button type="button" class="day" data-date="${iso}" aria-pressed="${iso === st.date}" ${ok ? '' : 'disabled'}
        aria-label="${fmt.extenso(iso)}${ok ? '' : ', sem horários'}">
        <span class="day__wd">${rotulo}</span><span class="day__n">${d.getDate()}</span><span class="day__m">${fmt.mes(iso).slice(0, 3)}</span>
      </button>`;
    }).join('');
    days.onclick = (e) => {
      const b = e.target.closest('.day');
      if (!b || b.disabled) return;
      st.date = b.dataset.date;
      st.hora = null;
      days.querySelectorAll('.day').forEach((x) => x.setAttribute('aria-pressed', x === b));
      carregarSlots();
      barHorario();
    };
    const sel = days.querySelector('[aria-pressed=true]');
    if (sel) days.scrollLeft = Math.max(0, sel.offsetLeft - days.offsetLeft - 8);
    carregarSlots();
  }

  async function carregarSlots() {
    const wrap = $('#slots-wrap');
    if (!wrap) return;
    const date = st.date;
    const key = chaveAgenda() + '|' + date;
    wrap.innerHTML = `<div class="bk-group__title">Horários de ${esc(fmt.extenso(date))}</div>
      <div class="slots">${Array.from({ length: 8 }, () => '<div class="skeleton" style="height:48px"></div>').join('')}</div>`;
    try {
      if (!st.slots[key]) {
        const r = await api.slots(date, st.servicos, prefsAtivas(), excluir());
        st.slots[key] = { horarios: r.horarios, planos: r.planos };
      }
    } catch (e) {
      return erroConexao(wrap, carregarSlots);
    }
    if (st.date !== date || !$('#slots-wrap')) return; // trocou de dia enquanto carregava
    const lista = st.slots[key].horarios;
    if (!lista.length) {
      wrap.innerHTML = `<div class="state"><div class="state__icon">${I.cal}</div><h2>Esse dia lotou</h2><p>Os horários acabaram de ser preenchidos. Escolha outro dia acima.</p></div>`;
      return;
    }
    const grupos = [
      ['Manhã', I.sun, lista.filter((h) => h < '12:00')],
      ['Tarde', I.sunset, lista.filter((h) => h >= '12:00' && h < '18:00')],
      ['Noite', I.moon, lista.filter((h) => h >= '18:00')],
    ].filter((g) => g[2].length);
    wrap.innerHTML = `<div class="bk-group__title">Horários de ${esc(fmt.extenso(date))}</div>` + grupos.map(([nome, icon, hs]) => `
      <div class="period">
        <div class="period__title">${icon}${nome}</div>
        <div class="slots" role="group" aria-label="${nome}">
          ${hs.map((h) => `<button type="button" class="slot" data-hora="${h}" aria-pressed="${h === st.hora}">${h}</button>`).join('')}
        </div>
      </div>`).join('') + '<div id="roteiro"></div>';
    wrap.onclick = (e) => {
      const b = e.target.closest('.slot');
      if (!b) return;
      st.hora = b.dataset.hora;
      wrap.querySelectorAll('.slot').forEach((x) => x.setAttribute('aria-pressed', x === b));
      mostrarRoteiro();
      barHorario();
    };
    mostrarRoteiro();
  }

  /** Mostra "quem faz o quê e quando" logo abaixo dos horários — transparência para a cliente. */
  function mostrarRoteiro() {
    const el = $('#roteiro');
    const plano = planoAtual();
    if (!el) return;
    if (!plano || (plano.length === 1 && C.profissionais.length === 1)) {
      el.innerHTML = '';
      return;
    }
    el.innerHTML = `<div class="roteiro" aria-live="polite">
      <div class="roteiro__title">Seu roteiro</div>
      ${plano.map((p) => `<div class="roteiro__item"><span class="roteiro__hora">${p.ini}</span><span><b>${esc(p.servico)}</b> com ${esc(p.prof)}</span></div>`).join('')}
      <div class="roteiro__item roteiro__item--fim"><span class="roteiro__hora">${plano[plano.length - 1].fim}</span><span>Fim, tudo pronto ✨</span></div>
    </div>`;
  }

  function barHorario() {
    const info = planoAtual()
      ? `<strong>${dataCurta(st.date)} · ${st.hora}</strong><span>termina por volta de ${horaFim()}</span>`
      : '<strong>Escolha um horário</strong><span>Só aparecem horários livres</span>';
    setBar(info, 'Continuar', !!planoAtual(), () => ir(proximo('horario')));
  }

  function dataCurta(iso) {
    const d = fmt.parse(iso);
    const wd = fmt.diaSemana(iso, true);
    return `${wd.charAt(0).toUpperCase() + wd.slice(1)}, ${d.getDate()} ${fmt.mes(iso).slice(0, 3)}`;
  }

  function horaFim() {
    const p = planoAtual();
    return p ? p[p.length - 1].fim : '';
  }

  /* ---------- Passo 4: Dados ---------- */
  function viewDados() {
    const d = st.dados;
    app.innerHTML = `
      <section class="bk-step">
        <h1 tabindex="-1">Quase lá! Quem vem?</h1>
        <p class="bk-sub">Usamos esses dados só para confirmar seu horário.</p>
        <form id="form-dados" novalidate>
          <div class="field">
            <label for="f-nome">Nome</label>
            <input class="input" id="f-nome" name="nome" autocomplete="name" placeholder="Como podemos te chamar?" value="${esc(d.nome || '')}" required aria-describedby="e-nome">
            <span class="field__error" id="e-nome"></span>
          </div>
          <div class="field">
            <label for="f-wa">WhatsApp</label>
            <input class="input" id="f-wa" name="whatsapp" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="(77) 9 0000-0000" value="${esc(d.whatsapp ? fmt.fone(d.whatsapp) : '')}" required aria-describedby="e-wa">
            <span class="field__error" id="e-wa"></span>
          </div>
          <div class="field">
            <label for="f-email">E-mail <small>(opcional: para receber confirmação e lembrete)</small></label>
            <input class="input" id="f-email" name="email" type="email" inputmode="email" autocomplete="email" placeholder="voce@email.com" value="${esc(d.email || '')}" aria-describedby="e-email">
            <span class="field__error" id="e-email"></span>
          </div>
          <div class="field">
            <label for="f-obs">Alguma observação? <small>(opcional)</small></label>
            <textarea class="input" id="f-obs" name="obs" maxlength="300" placeholder="Ex.: cabelo bem comprido, alergia a algum produto…">${esc(d.obs || '')}</textarea>
          </div>
          <input class="hp" name="site" tabindex="-1" autocomplete="off" aria-hidden="true">
          <button type="submit" hidden></button>
        </form>
      </section>`;

    const form = $('#form-dados');
    const wa = $('#f-wa');
    wa.addEventListener('input', (e) => {
      if (e.inputType && e.inputType.startsWith('delete')) return; // deixa apagar à vontade
      wa.value = fmt.fone(wa.value.replace(/\D/g, '').slice(0, 11));
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      enviarDados();
    });
    setBar('<strong>Seus dados</strong><span>Leva 20 segundos</span>', 'Revisar', true, enviarDados);
  }

  function enviarDados() {
    const form = $('#form-dados');
    const v = Object.fromEntries(new FormData(form));
    const erros = {};
    if (v.nome.trim().length < 2) erros.nome = 'Digite seu nome.';
    const digitos = v.whatsapp.replace(/\D/g, '');
    if (digitos.length < 10) erros.wa = 'Digite o número com DDD. Ex.: (77) 9 9999-9999';
    if (v.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email.trim())) erros.email = 'Confira o e-mail. Parece que falta alguma coisa.';

    [['nome', 'f-nome'], ['wa', 'f-wa'], ['email', 'f-email']].forEach(([k, id]) => {
      $('#e-' + k).textContent = erros[k] || '';
      $('#' + id).setAttribute('aria-invalid', erros[k] ? 'true' : 'false');
    });
    const primeiro = Object.keys(erros)[0];
    if (primeiro) {
      $({ nome: '#f-nome', wa: '#f-wa', email: '#f-email' }[primeiro]).focus();
      return;
    }
    st.dados = { nome: v.nome.trim(), whatsapp: digitos, email: v.email.trim(), obs: v.obs.trim(), site: v.site };
    salvarCliente(st.dados);
    ir('revisao');
  }

  /* ---------- Passo 5: Revisão ---------- */
  function linhaResumo(icon, label, valor, editar) {
    return `<div class="summary__row">${icon}<div><div class="summary__label">${label}</div><div class="summary__value">${valor}</div></div>
      ${editar ? `<button type="button" class="summary__edit" data-ir="${editar}">Alterar</button>` : ''}</div>`;
  }

  function roteiroHTML(plano) {
    return plano.map((p) => `${esc(p.servico)}<small>${p.ini}–${p.fim} · com ${esc(p.prof)}</small>`).join('<span class="summary__gap"></span>');
  }

  function resumoHTML(editavel, plano, dataIso, dados, semCliente) {
    return `<div class="summary">
      ${linhaResumo(I.cal, st.reagendar && editavel ? 'Novo horário' : 'Quando', `${esc(fmt.extenso(dataIso))}<small>das ${plano[0].ini} às ${plano[plano.length - 1].fim}</small>`, editavel && 'horario')}
      ${linhaResumo(I.scissors, 'Serviços', roteiroHTML(plano), editavel && !st.reagendar && 'servicos')}
      ${semCliente ? '' : linhaResumo(I.user, 'Cliente', `${esc(dados.nome)}${dados.whatsapp ? `<small>${fmt.fone(dados.whatsapp)}${dados.email ? ' · ' + esc(dados.email) : ''}</small>` : ''}`, editavel && !st.reagendar && 'dados')}
      <div class="summary__row summary__total">${I.money}<div><div class="summary__label">Valor estimado</div><div class="summary__value">${precoTotalTxt()}<small>Pagamento no salão</small></div></div></div>
    </div>`;
  }

  function notaPrazo() {
    return `<p class="note">${I.info}<span>Precisou mudar? Dá para <b>alterar ou cancelar pelo site até ${prazoH()} horas antes</b> do horário. Depois disso, só pelo WhatsApp do salão.</span></p>`;
  }

  function viewRevisao(erro) {
    const r = st.reagendar;
    app.innerHTML = `
      <section class="bk-step">
        <h1 tabindex="-1">${r ? 'Confirma o novo horário?' : 'Confere se está tudo certo'}</h1>
        <p class="bk-sub">${r ? `Seu horário atual é <b>${esc(r.dataExtenso)}, às ${esc(r.hora)}</b>. Ele será trocado por este:` : 'Se precisar mudar algo, toque em "Alterar".'}</p>
        ${typeof erro === 'string' ? `<div class="alert alert--error" role="alert">${I.alert}<span>${esc(erro)}</span></div>` : ''}
        ${resumoHTML(true, planoAtual(), st.date, st.dados, !!r)}
        ${notaPrazo()}
      </section>`;
    app.querySelectorAll('[data-ir]').forEach((b) => b.addEventListener('click', () => ir(b.dataset.ir)));
    setBar(`<strong>${dataCurta(st.date)} · ${esc(st.hora)}</strong><span>${precoTotalTxt()}</span>`, r ? 'Confirmar novo horário' : 'Confirmar', true, confirmar);
  }

  async function confirmar() {
    if (st.enviando) return;
    st.enviando = true;
    barBtn.disabled = true;
    barBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Confirmando…';
    try {
      const r = st.reagendar
        ? await api.reschedule({ token: st.reagendar.token, date: st.date, hora: st.hora, prefs: prefsAtivas() })
        : await api.book({
          servicos: st.servicos,
          prefs: prefsAtivas(),
          date: st.date,
          hora: st.hora,
          nome: st.dados.nome,
          whatsapp: st.dados.whatsapp,
          email: st.dados.email,
          obs: st.dados.obs,
          site: st.dados.site,
        });
      st.ultimo = r;
      meusAgendamentos.add({ token: r.token, data: r.data, hora: r.hora, servicos: r.servicos, servicoIds: r.servicoIds, plano: r.plano, profissional: r.profissional, nome: r.nome, dataExtenso: r.dataExtenso });
      st.slots = {};
      st.dias = null;
      ir('sucesso', true);
    } catch (e) {
      if (e.code === 'SLOT_TAKEN') {
        st.hora = null;
        st.slots = {};
        st.dias = null;
        st.erroHorario = 'Poxa, esse horário acabou de ser reservado por outra pessoa. Escolha outro, por favor.';
        ir('horario', true);
      } else if (e instanceof TypeError) {
        viewRevisao('Sem conexão com a internet. Verifique o Wi-Fi ou os dados móveis e toque em "Confirmar" de novo.');
      } else {
        viewRevisao(e.message || 'Não conseguimos confirmar agora. Tente de novo em instantes.');
      }
    } finally {
      st.enviando = false;
    }
  }

  /* ---------- Sucesso ---------- */
  function viewSucesso() {
    const r = st.ultimo;
    const roteiro = r.plano.map((p) => `${p.ini} ${p.servico} (com ${p.prof})`).join('\n');
    const msg = r.alterado
      ? `Oi! Alterei meu horário pelo site ✨\n\nNovo horário: ${fmt.extenso(r.data)}\n${roteiro}\n\nNome: ${r.nome}`
      : `Oi! Acabei de agendar pelo site ✨\n\n${fmt.extenso(r.data)}\n${roteiro}\n\nNome: ${r.nome}`;
    const wa = waLink(C.cfg.whatsapp, msg);
    const gerenciar = '?gerenciar=' + encodeURIComponent(r.token);

    app.innerHTML = `
      <section class="bk-step success">
        <div class="success__check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg></div>
        <h1 tabindex="-1">${r.alterado ? 'Horário alterado!' : 'Horário confirmado!'}</h1>
        <p class="bk-sub">Te esperamos, ${esc(r.nome.split(' ')[0])}. ${st.dados.email && !r.alterado ? 'Mandamos os detalhes para o seu e-mail.' : ''}</p>
        ${r.demo ? `<div class="alert alert--info">${I.info}<span>Modo demonstração: nada foi gravado na agenda.</span></div>` : ''}
        ${resumoHTML(false, r.plano, r.data, st.dados, true)}
        <div class="success__actions">
          ${wa ? `<a class="btn btn--wa btn--block" href="${wa}" target="_blank" rel="noopener">${I.wa} Avisar o salão no WhatsApp</a>` : ''}
          <a class="btn btn--ghost btn--block" href="${linkGoogleAgenda(r)}" target="_blank" rel="noopener">${I.cal} Salvar na minha agenda</a>
          <a class="btn btn--ghost btn--block" href="${gerenciar}#alterar">${I.edit} Alterar horário</a>
        </div>
        <p class="success__cancel">Imprevisto? Você pode alterar ou <a href="${gerenciar}#cancelar">cancelar</a> até ${prazoH()}h antes. Este horário fica salvo neste aparelho.</p>
        <p class="success__cancel"><a href="index.html">Voltar para o site</a></p>
      </section>`;
    // Se já estamos em ?gerenciar=token (depois de alterar), só trocar o # não recarrega: força a abertura.
    app.querySelectorAll(`a[href^="${gerenciar}"]`).forEach((a) => a.addEventListener('click', (e) => {
      const u = new URL(a.href);
      if (u.search !== location.search) return;
      e.preventDefault();
      history.replaceState(null, '', u.search + u.hash);
      location.reload();
    }));
    setBar(null);
  }

  function linkGoogleAgenda(r) {
    const d = r.data.replace(/-/g, '');
    const p = new URLSearchParams({
      action: 'TEMPLATE',
      text: `${r.servicos} · ${C.cfg.nome}`,
      dates: `${d}T${r.hora.replace(':', '')}00/${d}T${r.fim.replace(':', '')}00`,
      ctz: 'America/Bahia',
      details: r.plano.map((x) => `${x.ini} ${x.servico} (com ${x.prof})`).join('\n') + `\n\nPara ver ou alterar: ${linkGerenciar(r.token)}`,
      location: C.cfg.endereco || 'Vitória da Conquista - BA',
    });
    return 'https://calendar.google.com/calendar/render?' + p.toString();
  }

  /* ---------- Gerenciar (?gerenciar=token): ver, alterar ou cancelar ---------- */
  async function viewGerenciar(token) {
    $('.bk-header__title strong').textContent = 'Seu horário';
    $('#passo-label').textContent = 'Ver, alterar ou cancelar';
    $('#progress').style.width = '100%';
    setBar(null);
    let b;
    try {
      b = await api.booking(token);
    } catch (e) {
      app.innerHTML = estado(I.alert, 'Não encontramos esse horário', e instanceof TypeError ? 'Parece que você está sem internet. Verifique a conexão e tente de novo.' : esc(e.message),
        `<a class="btn" href="agendar.html">Fazer um novo agendamento</a>`);
      return;
    }
    b.token = token;
    if (b.status === 'Cancelado') {
      meusAgendamentos.remove(token);
      app.innerHTML = estado(I.check, 'Esse horário foi cancelado', 'Ele está livre de novo na agenda. Quando quiser, é só marcar outro.', `<a class="btn" href="agendar.html">Agendar novo horário</a>`);
      return;
    }
    if (b.passou || ['Concluído', 'Não compareceu'].includes(b.status)) {
      app.innerHTML = estado(I.cal, 'Esse horário já passou', `Era ${esc(b.dataExtenso)}, às ${esc(b.hora)}. Que tal marcar o próximo?`, `<a class="btn" href="agendar.html">Agendar novo horário</a>`);
      return;
    }
    const zap = waLink(C.cfg.whatsapp, `Oi! Preciso mudar meu horário de ${b.dataExtenso}, às ${b.hora} (${b.servicos}). Nome: ${b.nome}`);
    const podeOnline = b.podeAlterar && b.servicoIds && b.servicoIds.length;

    app.innerHTML = `
      <section class="bk-step">
        <h1 tabindex="-1">Seu horário</h1>
        <p class="bk-sub">Olá, ${esc(String(b.nome).split(' ')[0])}! Estes são os detalhes do seu agendamento.</p>
        <div class="summary">
          ${linhaResumo(I.cal, 'Quando', `${esc(b.dataExtenso)}<small>às ${esc(b.hora)}</small>`)}
          ${linhaResumo(I.scissors, 'Serviços', b.plano && b.plano.length ? roteiroHTML(b.plano) : esc(b.servicos))}
        </div>
        <div id="ger-erro"></div>
        ${podeOnline ? `
          <div class="success__actions">
            <button class="btn btn--block" type="button" id="btn-alterar">${I.edit} Alterar horário</button>
            <a class="btn btn--ghost btn--block" href="index.html">Manter meu horário</a>
          </div>
          <p class="success__cancel">Não vai poder vir? <button type="button" class="link-inline" id="btn-cancelar">Cancelar horário</button></p>
          ${notaPrazo()}` : `
          <div class="alert alert--info" role="status">${I.info}<span>${b.podeAlterar ? 'Esse agendamento não pode ser alterado pelo site.' : `Faltam menos de ${b.prazoHoras || prazoH()} horas para o seu horário, então não dá mais para alterar ou cancelar pelo site.`} Fale com a gente pelo WhatsApp que a gente resolve.</span></div>
          <div class="success__actions">
            ${zap ? `<a class="btn btn--wa btn--block" href="${zap}" target="_blank" rel="noopener">${I.wa} Falar com o salão</a>` : ''}
            <a class="btn btn--ghost btn--block" href="index.html">Voltar para o site</a>
          </div>`}
      </section>`;

    if (!podeOnline) return;
    $('#btn-alterar').addEventListener('click', () => iniciarReagendamento(b));
    $('#btn-cancelar').addEventListener('click', () => dialogoCancelar(b));
    if (location.hash === '#alterar') iniciarReagendamento(b);
    else if (location.hash === '#cancelar') dialogoCancelar(b);
  }

  function iniciarReagendamento(b) {
    modoCancelar = false;
    st.reagendar = b;
    st.servicos = b.servicoIds.slice();
    st.prefs = {};
    st.dados = { nome: b.nome };
    st.date = st.hora = null;
    st.slots = {};
    st.dias = null;
    ir('horario', true);
  }

  /** Janela de confirmação do cancelamento, com a regra das X horas e a opção de só trocar o horário. */
  function dialogoCancelar(b) {
    let dlg = $('#dlg-cancelar');
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.id = 'dlg-cancelar';
      dlg.className = 'modal';
      document.body.appendChild(dlg);
    }
    dlg.innerHTML = `
      <form method="dialog">
        <div class="modal__icon">${I.alert}</div>
        <h2>Cancelar seu horário?</h2>
        <p>${esc(b.dataExtenso)}, às ${esc(b.hora)}<br><small>${esc(b.servicos)}</small></p>
        <div class="modal__rule">${I.info}<span>Cancelamentos e alterações pelo site só podem ser feitos <b>até ${b.prazoHoras || prazoH()} horas antes</b> do horário. Assim a profissional não fica com o horário vazio e outra cliente pode usar.</span></div>
        <p class="modal__hint">Se for só mudar o dia ou a hora, você pode <b>alterar o horário</b> em vez de cancelar.</p>
        <div id="dlg-erro"></div>
        <div class="modal__actions">
          <button class="btn btn--block" value="alterar">${I.edit} Prefiro alterar o horário</button>
          <button class="btn btn--ghost btn--danger btn--block" value="cancelar" id="dlg-sim">Sim, cancelar</button>
          <button class="link-inline" value="voltar">Voltar</button>
        </div>
      </form>`;
    dlg.returnValue = '';
    dlg.showModal();
    dlg.querySelector('form').addEventListener('submit', async (e) => {
      const acao = e.submitter && e.submitter.value;
      if (acao === 'alterar') return iniciarReagendamento(b);
      if (acao !== 'cancelar') return;
      e.preventDefault(); // mantém aberta enquanto cancela
      const btn = $('#dlg-sim');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Cancelando…';
      try {
        await api.cancel(b.token);
        meusAgendamentos.remove(b.token);
        dlg.close();
        app.innerHTML = estado(I.check, 'Horário cancelado', 'Obrigada por avisar! Assim outra cliente pode usar esse horário. Quando quiser, é só marcar de novo.',
          `<a class="btn" href="agendar.html">Agendar novo horário</a>`);
      } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Sim, cancelar';
        $('#dlg-erro').innerHTML = `<div class="alert alert--error" role="alert">${I.alert}<span>${esc(err instanceof TypeError ? 'Sem conexão. Verifique a internet e tente de novo.' : err.message)}</span></div>`;
      }
    });
  }

  /* ---------- Estados auxiliares ---------- */
  function estado(icon, titulo, texto, acoes) {
    return `<section class="bk-step state"><div class="state__icon">${icon}</div><h2 tabindex="-1">${esc(titulo)}</h2><p>${texto}</p>${acoes || ''}</section>`;
  }

  function botaoWhats(msg) {
    const wa = waLink(C?.cfg?.whatsapp, msg);
    return wa ? `<a class="btn btn--wa" href="${wa}" target="_blank" rel="noopener">${I.wa} Chamar no WhatsApp</a>` : '';
  }

  function erroConexao(el, tentarDeNovo) {
    if (!el) return;
    el.outerHTML = `<div class="state" id="erro-conexao">
      <div class="state__icon">${I.wifi}</div>
      <h2>Não conseguimos carregar os horários</h2>
      <p>Pode ser a internet. Verifique a conexão e tente de novo. Se continuar, chame a gente no WhatsApp.</p>
      <div class="state__actions">
        <button class="btn" type="button" id="btn-retry">Tentar de novo</button>
        ${botaoWhats('Oi! Tentei agendar pelo site mas não carregou. Pode me ajudar?')}
      </div>
    </div>`;
    $('#btn-retry').addEventListener('click', () => (passoAtual() === 'horario' ? viewHorario() : tentarDeNovo()));
  }

  /* ---------- Início ---------- */
  (async function init() {
    C = await api.config();
    if (api.demo) $('#demo-banner').innerHTML = '<div class="demo-banner"><b>Modo demonstração:</b> os agendamentos não são gravados.</div>';

    const params = new URLSearchParams(location.search);
    // ?gerenciar= (novo) ou ?cancelar= (links antigos): ver, alterar ou cancelar
    const tokenGer = params.get('gerenciar') || params.get('cancelar');
    if (tokenGer) {
      modoCancelar = true;
      return viewGerenciar(tokenGer);
    }

    if (C.offline) {
      app.innerHTML = estado(I.wifi, 'A agenda está fora do ar agora', 'Tente de novo em alguns minutos. Se tiver pressa, chame a gente no WhatsApp.',
        `<button class="btn" type="button" onclick="location.reload()">Tentar de novo</button>`);
      return;
    }
    const pre = params.get('servico');
    if (pre && C.servicos.some((s) => s.id === pre)) st.servicos = [pre];
    render();
  })();
})();
