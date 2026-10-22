(function () {
  const { api, fmt, waLink, esc } = window.Salao;
  const $ = (s) => document.querySelector(s);
  const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const ORDEM_DIAS = [1, 2, 3, 4, 5, 6, 0]; // segunda primeiro

  /* ---------- Interações de página ---------- */
  const header = $('.header');
  const bar = $('#mobile-bar');
  const heroLogo = $('.hero__logo');
  const hero = $('.hero');
  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
    // A logo pequena do topo aparece quando a logo grande sai de vista
    header.classList.toggle('show-brand', heroLogo.getBoundingClientRect().bottom < 70);
    bar.classList.toggle('is-visible', hero.getBoundingClientRect().bottom < 140);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in'));
  }
  $('#ano').textContent = new Date().getFullYear();

  /* ---------- Trabalhos: pontinhos do carrossel (só aparecem no celular) ---------- */
  const galeria = $('#gallery');
  const pontos = $('#gallery-dots');
  if (galeria && pontos) {
    const itens = [...galeria.children];
    pontos.innerHTML = itens.map(() => '<span></span>').join('');
    const marcar = () => {
      // A foto ativa é a mais perto do centro da tela
      const g = galeria.getBoundingClientRect();
      const meio = g.left + g.width / 2;
      let atual = 0, menor = Infinity;
      itens.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - meio);
        if (d < menor) { menor = d; atual = i; }
      });
      [...pontos.children].forEach((p, i) => p.classList.toggle('is-on', i === atual));
    };
    galeria.addEventListener('scroll', marcar, { passive: true });
    marcar();
  }

  /* ---------- Serviços: abas por categoria + lista de preços ---------- */
  let servicos = [];
  let categoriaAtiva = null;

  function renderTabs() {
    const cats = [...new Set(servicos.map((s) => s.categoria))];
    if (!categoriaAtiva) categoriaAtiva = cats[0];
    $('#tabs').innerHTML = cats.length < 2 ? '' : cats
      .map((c) => `<button type="button" class="tab" role="tab" aria-selected="${c === categoriaAtiva}" data-cat="${esc(c)}">${esc(c)}</button>`)
      .join('');
  }

  function renderLista() {
    const lista = servicos.filter((s) => s.categoria === categoriaAtiva);
    $('#price-list').innerHTML = lista.map((s) => `
      <li class="price-item">
        <div class="price-item__info">
          <span class="price-item__name">${esc(s.nome)}</span>
          <span class="price-item__meta">${fmt.duracao(s.duracao)}${s.descricao ? ' · ' + esc(s.descricao) : ''}</span>
        </div>
        <div class="price-item__price">${s.aPartirDe ? '<small>a partir de</small>' : ''}${s.preco == null ? 'Sob consulta' : fmt.brl(s.preco)}</div>
        <a class="btn btn--sm price-item__btn" href="agendar.html?servico=${encodeURIComponent(s.id)}" aria-label="Agendar ${esc(s.nome)}">Agendar</a>
      </li>`).join('');
  }

  $('#tabs').addEventListener('click', (e) => {
    const b = e.target.closest('.tab');
    if (!b) return;
    categoriaAtiva = b.dataset.cat;
    renderTabs();
    renderLista();
  });

  /* ---------- Horários ---------- */
  const hhmm = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h + 'h' + (m ? String(m).padStart(2, '0') : '');
  };

  /** Agrupa dias seguidos com o mesmo horário: "Ter a Sex 8h–18h · Sáb 8h–14h". */
  function resumoHorarios(horarios) {
    const grupos = [];
    ORDEM_DIAS.forEach((d) => {
      const h = horarios[d];
      if (!h) return;
      const faixa = `${hhmm(h.abre)}–${hhmm(h.fecha)}`;
      const ult = grupos[grupos.length - 1];
      if (ult && ult.faixa === faixa && ORDEM_DIAS.indexOf(ult.fim) === ORDEM_DIAS.indexOf(d) - 1) ult.fim = d;
      else grupos.push({ ini: d, fim: d, faixa });
    });
    return grupos.map((g) => {
      const dias = g.ini === g.fim ? CURTO[g.ini]
        : ORDEM_DIAS.indexOf(g.fim) - ORDEM_DIAS.indexOf(g.ini) === 1 ? `${CURTO[g.ini]} e ${CURTO[g.fim]}`
        : `${CURTO[g.ini]} a ${CURTO[g.fim]}`;
      return `<b>${dias}</b> ${g.faixa}`;
    }).join('<span class="sep" aria-hidden="true">·</span>');
  }

  function abertoAgora(horarios) {
    const h = horarios[new Date().getDay()];
    const agora = new Date();
    const min = agora.getHours() * 60 + agora.getMinutes();
    const toMin = (t) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
    const naPausa = h && h.pausaIni && h.pausaFim && min >= toMin(h.pausaIni) && min < toMin(h.pausaFim);
    return !!(h && min >= toMin(h.abre) && min < toMin(h.fecha) && !naPausa);
  }

  function renderHorarios(horarios) {
    const hoje = new Date().getDay();
    $('#hours').innerHTML = ORDEM_DIAS.map((d) => {
      const h = horarios[d];
      const txt = h ? `${h.abre} – ${h.fecha}` : '<span class="closed">Fechado</span>';
      return `<li class="${d === hoje ? 'is-today' : ''}"><span>${DIAS[d]}${d === hoje ? ' (hoje)' : ''}</span><span>${txt}</span></li>`;
    }).join('');

    const badge = abertoAgora(horarios)
      ? '<span class="badge badge--open">Aberto agora</span>'
      : '<span class="badge badge--closed">Fechado agora</span>';
    $('#open-badge').innerHTML = badge;
    $('#hero-hours-text').innerHTML = resumoHorarios(horarios);
    $('#hero-open').innerHTML = badge;
  }

  /* ---------- Dados de contato vindos da planilha ---------- */
  function renderContato(cfg) {
    if (cfg.endereco) $('#endereco').textContent = cfg.endereco;
    if (cfg.linkAvaliacao) $('#btn-avaliar').href = cfg.linkAvaliacao;
    if (cfg.linkMapa) $('#btn-rota').href = cfg.linkMapa;
    const wa = waLink(cfg.whatsapp, 'Olá! Vim pelo site e gostaria de uma informação.');
    if (wa) {
      $('#btn-wa').href = wa;
      $('#fab-wa').href = wa;
      $('#bar-wa').href = wa;
      $('#btn-wa').lastChild.textContent = ' ' + fmt.fone(cfg.whatsapp);
    }
  }

  /* ---------- Inicialização ---------- */
  api.config().then((data) => {
    servicos = data.servicos;
    renderTabs();
    renderLista();
    renderHorarios(data.horarios);
    renderContato(data.cfg);
    if (api.demo) {
      $('#demo-banner').innerHTML = '<div class="demo-banner"><b>Modo demonstração:</b> os agendamentos não são gravados.</div>';
    }
  });
})();
