/**
 * Núcleo compartilhado: comunicação com a API (ou modo demonstração)
 * e pequenos utilitários de formatação.
 */
(function () {
  const S = window.SALAO;
  const DEMO = !S.API_URL;
  const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  /* ---------------- formatação ---------------- */
  const fmt = {
    brl(n) {
      return Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: n % 1 ? 2 : 0 });
    },
    preco(s) {
      if (s.preco === null || s.preco === undefined || s.preco === '') return 'Sob consulta';
      return (s.aPartirDe ? 'a partir de ' : '') + fmt.brl(s.preco);
    },
    duracao(min) {
      const h = Math.floor(min / 60), m = min % 60;
      if (!h) return m + ' min';
      return h + 'h' + (m ? String(m).padStart(2, '0') : '');
    },
    fone(d) {
      d = String(d || '').replace(/\D/g, '');
      if (d.length > 11 && d.startsWith('55')) d = d.slice(2);
      if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
      if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
      return d;
    },
    /** 'yyyy-mm-dd' -> Date local (meio-dia, evita problema de fuso) */
    parse(iso) {
      const [y, m, d] = iso.split('-').map(Number);
      return new Date(y, m - 1, d, 12);
    },
    iso(date) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },
    diaSemana(iso, curto) {
      const d = DIAS[fmt.parse(iso).getDay()];
      return curto ? d.slice(0, 3) : d;
    },
    extenso(iso) {
      const d = fmt.parse(iso);
      const wd = d.getDay();
      return `${DIAS[wd]}${wd > 0 && wd < 6 ? '-feira' : ''}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
    },
    mes(iso) {
      return MESES[fmt.parse(iso).getMonth()];
    },
  };

  /* ---------------- links ---------------- */
  function waLink(numero, texto) {
    let d = String(numero || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.length <= 11) d = '55' + d;
    return `https://wa.me/${d}${texto ? '?text=' + encodeURIComponent(texto) : ''}`;
  }

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ---------------- API real ---------------- */
  async function get(params) {
    const url = S.API_URL + '?' + new URLSearchParams(params).toString();
    const res = await fetch(url, { redirect: 'follow' });
    const json = await res.json();
    if (!json.ok) throw Object.assign(new Error(json.error), { code: json.code });
    return json.data;
  }

  async function post(body) {
    // text/plain evita o "preflight" de CORS, que o Apps Script não suporta.
    const res = await fetch(S.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      redirect: 'follow',
    });
    const json = await res.json();
    if (!json.ok) throw Object.assign(new Error(json.error), { code: json.code });
    return json.data;
  }

  /* ---------------- Modo demonstração (usa o mesmo MotorAgenda da agenda real) ---------------- */
  const demo = {
    wait: (ms = 450) => new Promise((r) => setTimeout(r, ms)),
    servicos: (ids) => ids.map((id) => S.fallback.servicos.find((s) => s.id === id)).filter(Boolean),
    planos(iso, ids, prefs) {
      const fb = S.fallback;
      const wd = fmt.parse(iso).getDay();
      const escalas = {};
      Object.keys(fb.escalasDemo || {}).forEach((pid) => (escalas[pid] = fb.escalasDemo[pid][wd] || []));
      // Simula alguns horários já ocupados de cada profissional (sempre os mesmos para o mesmo dia)
      const seed = Number(iso.replace(/-/g, '')) % 7;
      const ocupados = {};
      fb.profissionais.forEach((p, i) => {
        ocupados[p.id] = [[(9 + ((seed + i) % 3)) * 60, (10 + ((seed + i) % 3)) * 60], [(15 + ((seed + i * 2) % 2)) * 60, (16 + ((seed + i * 2) % 2)) * 60]];
      });
      const agora = new Date();
      return MotorAgenda.planejarDia({
        servicos: demo.servicos(ids),
        prefs,
        profissionais: fb.profissionais,
        horarioSalao: fb.horarios[wd],
        escalas,
        ocupados,
        passo: fb.cfg.passoMin,
        minimo: iso === fmt.iso(agora) ? agora.getHours() * 60 + agora.getMinutes() + fb.cfg.antecedenciaHoras * 60 : -Infinity,
      });
    },
  };

  const api = {
    demo: DEMO,

    async config() {
      if (DEMO) return structuredClone(S.fallback);
      const cacheKey = 'salao_cfg';
      try {
        const data = await get({ action: 'config' });
        try { sessionStorage.setItem(cacheKey, JSON.stringify(data)); } catch (e) {}
        return data;
      } catch (e) {
        try {
          const c = sessionStorage.getItem(cacheKey);
          if (c) return JSON.parse(c);
        } catch (e2) {}
        const fb = structuredClone(S.fallback);
        fb.offline = true;
        return fb;
      }
    },

    /**
     * Próximos dias com horário livre para esses serviços (prefs = {servicoId: profId|'qualquer'}).
     * `excluir` = token de um agendamento cujo horário não conta como ocupado (ao reagendar).
     */
    async days(servicos, prefs, excluir) {
      if (DEMO) {
        await demo.wait();
        const dias = [];
        const hoje = new Date();
        for (let i = 0; i <= S.fallback.cfg.diasAFrente; i++) {
          const iso = fmt.iso(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i, 12));
          if (Object.keys(demo.planos(iso, servicos, prefs)).length) dias.push(iso);
        }
        return { dias };
      }
      return get({ action: 'days', servicos: servicos.join(','), prefs: JSON.stringify(prefs || {}), excluir: excluir || '' });
    },

    /** Horários livres num dia + o roteiro de cada um (quem faz o quê e quando). */
    async slots(date, servicos, prefs, excluir) {
      if (DEMO) {
        await demo.wait(300);
        const planos = demo.planos(date, servicos, prefs);
        return { date, horarios: Object.keys(planos).sort(), planos };
      }
      return get({ action: 'slots', date, servicos: servicos.join(','), prefs: JSON.stringify(prefs || {}), excluir: excluir || '' });
    },

    async book(payload) {
      if (DEMO) {
        await demo.wait(900);
        return demo.montar('demo' + Math.random().toString(16).slice(2).padEnd(28, '0'), payload);
      }
      return post({ action: 'book', ...payload });
    },

    /** Troca o dia/horário de um agendamento existente (mesmo link). */
    async reschedule(payload) {
      if (DEMO) {
        await demo.wait(900);
        const atual = meusAgendamentos.list().find((b) => b.token === payload.token);
        if (!atual) throw new Error('Não encontramos esse agendamento.');
        return { ...demo.montar(payload.token, { ...payload, nome: atual.nome, servicos: atual.servicoIds }), alterado: true };
      }
      return post({ action: 'reschedule', ...payload });
    },

    async booking(token) {
      if (DEMO) {
        await demo.wait();
        const saved = meusAgendamentos.list().find((b) => b.token === token);
        if (!saved) throw new Error('Não encontramos esse agendamento. Ele pode ter sido removido.');
        const inicio = fmt.parse(saved.data);
        inicio.setHours(+saved.hora.slice(0, 2), +saved.hora.slice(3), 0, 0);
        const prazo = S.fallback.cfg.prazoAlteracaoHoras;
        return { ...saved, status: 'Confirmado', passou: inicio < new Date(), podeAlterar: inicio - Date.now() >= prazo * 3600e3, prazoHoras: prazo };
      }
      return get({ action: 'booking', token });
    },

    async cancel(token) {
      if (DEMO) {
        await demo.wait(700);
        return { cancelado: true };
      }
      return post({ action: 'cancel', token });
    },
  };

  /** Monta a resposta de um agendamento no modo demonstração. */
  demo.montar = function (token, payload) {
    const plano = demo.planos(payload.date, payload.servicos, payload.prefs)[payload.hora];
    if (!plano) throw Object.assign(new Error('Esse horário acabou de ser reservado.'), { code: 'SLOT_TAKEN' });
    const servs = demo.servicos(payload.servicos);
    return {
      token,
      nome: payload.nome,
      profissional: [...new Set(plano.map((p) => p.prof))].join(', '),
      servicos: plano.map((p) => p.servico).join(' + '),
      servicoIds: servs.map((s) => s.id),
      plano,
      data: payload.date,
      hora: payload.hora,
      fim: plano[plano.length - 1].fim,
      dataExtenso: fmt.extenso(payload.date),
      total: servs.reduce((a, s) => a + (s.preco || 0), 0),
      aPartirDe: servs.some((s) => s.aPartirDe),
      prazoHoras: S.fallback.cfg.prazoAlteracaoHoras,
      demo: true,
    };
  };

  /* ---------------- "Meus agendamentos" (só neste aparelho) ---------------- */
  const meusAgendamentos = {
    key: 'salao_meus_agendamentos',
    list() {
      try {
        const all = JSON.parse(localStorage.getItem(this.key) || '[]');
        const hoje = fmt.iso(new Date());
        return all.filter((b) => b.data >= hoje);
      } catch (e) {
        return [];
      }
    },
    add(b) {
      try {
        const all = this.list().filter((x) => x.token !== b.token);
        all.push(b);
        localStorage.setItem(this.key, JSON.stringify(all));
      } catch (e) {}
    },
    remove(token) {
      try {
        localStorage.setItem(this.key, JSON.stringify(this.list().filter((b) => b.token !== token)));
      } catch (e) {}
    },
  };

  window.Salao = { api, fmt, waLink, esc, meusAgendamentos };
})();
