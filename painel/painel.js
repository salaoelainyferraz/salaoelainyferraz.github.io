/* Painel do salão — a tela fica no GitHub Pages e conversa com o Google Apps Script (painel/Painel.gs) por POST. */
(function () {
  // Endereço do painel no Google (o mesmo deploy de sempre: clasp deploy -i <ID do README>)
  var API = 'https://script.google.com/macros/s/AKfycbxEh4DRgVu-UeZ2ZjUbA-6KX9n2Tcve6MDeCP7rksrZcqVdCZBBFLkuEE5qy3MGnd8J/exec';
  // API do site (Code.gs): depois de mudar preços ou equipe, pede para o site ler a planilha de novo
  var API_DO_SITE = 'https://script.google.com/macros/s/AKfycbzOps3hOYQi9Qv3mQW0KQ3PFB1K6skpernm4XKzFrNX4_6YL_G6y3M1G_xMLgXJ59DXQA/exec';
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var D = null;               // dados do dia
  var filtroProf = 'todas';
  var visao = 'afazer';       // 'afazer' | 'todos'
  var dataAtual = '';
  var fichaToken = null;
  var MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  var DIAS = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
  var ROTULO = { 'Confirmado': 'Aguardando', 'Em atendimento': 'Em atendimento', 'Concluído': 'Concluído', 'Não compareceu': 'Não veio', 'Cancelado': 'Cancelado' };
  var CLASSE = { 'Confirmado': 'aguardando', 'Em atendimento': 'atendimento', 'Concluído': 'concluido', 'Não compareceu': 'falta', 'Cancelado': 'cancelado' };
  var A_FAZER = ['Confirmado', 'Em atendimento'];
  var ICON = {
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6c1.8 1 3.8 1.5 5.8 1.5 6.6 0 12-5.4 12-12S18.6 0 12 0zm0 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4C2.7 15.6 2.2 13.8 2.2 12 2.2 6.6 6.6 2.2 12 2.2S21.8 6.6 21.8 12 17.4 21.8 12 21.8zm5.5-7.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3 2.4 1 2.9.8 3.4.7.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3z"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:16px;height:16px"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  };

  /* ---------- sessão (token guardado neste aparelho) ---------- */
  var CHAVE = 'painel_sessao';
  function lerToken() {
    try { return localStorage.getItem(CHAVE) || sessionStorage.getItem(CHAVE) || ''; } catch (e) { return ''; }
  }
  function guardarToken(t, lembrar) {
    try {
      localStorage.removeItem(CHAVE); sessionStorage.removeItem(CHAVE);
      if (t) (lembrar ? localStorage : sessionStorage).setItem(CHAVE, t);
    } catch (e) { /* navegador sem armazenamento: fica só na memória */ }
    TOKEN = t;
  }
  var TOKEN = lerToken();
  // O último dia aberto fica guardado neste aparelho: ao abrir o painel ele aparece na hora e atualiza em seguida
  var CHAVE_DIA = 'painel_ultimo_dia';
  function guardarDia(d) {
    try { (localStorage.getItem(CHAVE) ? localStorage : sessionStorage).setItem(CHAVE_DIA, JSON.stringify(d)); } catch (e) { /* sem espaço: tudo bem */ }
  }
  function lerDiaGuardado() {
    try { return JSON.parse(localStorage.getItem(CHAVE_DIA) || sessionStorage.getItem(CHAVE_DIA) || 'null'); } catch (e) { return null; }
  }

  function mostrarLogin(msg) {
    guardarToken('', false);
    try { localStorage.removeItem(CHAVE_DIA); sessionStorage.removeItem(CHAVE_DIA); } catch (e) { /* nada */ }
    D = null; DIAS_MEM = {}; MESES_MEM = {}; CLIENTES = null; CFG = null;
    $$('dialog[open]').forEach(function (d) { d.close(); });
    document.body.classList.add('deslogado');
    $('#login-erro').innerHTML = msg ? '<div class="aviso aviso--warn">' + esc(msg) + '</div>' : '';
    $('#login-senha').value = '';
    setTimeout(function () { ($('#login-usuario').value ? $('#login-senha') : $('#login-usuario')).focus(); }, 50);
  }

  /* ---------- servidor ---------- */
  // Uma chamada ao Google: POST { fn, args } → { ok, r } ou { ok: false, erro }.
  // "text/plain" evita a consulta extra (preflight) do navegador, como no site.
  function chamar(fn, args) {
    if (window.__PAINEL_MOCK) return window.__PAINEL_MOCK(fn, args); // npm run painel-dev (dados de exemplo)
    return fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ fn: fn, args: args }) })
      .then(function (r) {
        if (!r.ok) throw new Error('O Google não respondeu agora (' + r.status + '). Tente de novo em instantes.');
        return r.json();
      }, function () { throw new Error('Sem conexão com a internet. Confira o Wi-Fi ou os dados e tente de novo.'); });
  }
  // Toda chamada (menos "entrar") leva o token da sessão como primeiro argumento.
  function rodar(fn) {
    var args = Array.prototype.slice.call(arguments, 1);
    if (fn !== 'entrar') args.unshift(TOKEN);
    return chamar(fn, args).then(function (j) {
      if (j && j.ok) return j.r;
      var e = new Error(j && j.erro || 'Algo deu errado. Tente de novo.');
      if (/SESSAO/.test(e.message)) mostrarLogin('Sua sessão terminou. Entre de novo, por favor.');
      throw e;
    });
  }

  /* ---------- login ---------- */
  $('#ver-senha').addEventListener('click', function () {
    var i = $('#login-senha'), mostrar = i.type === 'password';
    i.type = mostrar ? 'text' : 'password';
    this.textContent = mostrar ? 'Ocultar' : 'Mostrar';
    this.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
  });
  $('#form-login').addEventListener('submit', function (e) {
    e.preventDefault();
    var u = $('#login-usuario').value.trim(), s = $('#login-senha').value, lembrar = $('#login-lembrar').checked;
    if (!u || !s) { $('#login-erro').innerHTML = '<div class="aviso aviso--erro">Informe usuário e senha.</div>'; return; }
    var btn = $('#login-ok'); btn.disabled = true; btn.textContent = 'Entrando…';
    rodar('entrar', u, s, lembrar).then(function (r) {
      guardarToken(r.token, lembrar);
      $('#login-erro').innerHTML = '';
      $('#login-senha').value = '';
      document.body.classList.remove('deslogado');
      carregar('');
    }).catch(function (er) {
      $('#login-erro').innerHTML = '<div class="aviso aviso--erro">' + esc(msgErro(er)) + '</div>';
      $('#login-senha').select();
    }).then(function () { btn.disabled = false; btn.textContent = 'Entrar'; });
  });
  $('#sair').addEventListener('click', function () {
    var t = TOKEN;
    mostrarLogin('');
    fecharMenu();
    chamar('sair', [t]).catch(function () { /* sem internet: a sessão vence sozinha */ }); // encerra no servidor também
  });

  /* ---------- utilidades ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function brl(n) { return Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  function parse(iso) { var p = iso.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2], 12); }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function somaDias(isoStr, n) { var d = parse(isoStr); d.setDate(d.getDate() + n); return iso(d); }
  function extenso(isoStr) { var d = parse(isoStr); return DIAS[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()]; }
  function dataBR(isoStr) { var p = isoStr.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function fone(f) { var d = String(f || '').replace(/\D/g, ''); if (d.length > 11 && d.indexOf('55') === 0) d = d.slice(2); return d.length === 11 ? '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7) : d.length === 10 ? '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6) : d; }
  function wa(f, txt) { var d = String(f || '').replace(/\D/g, ''); if (!d) return ''; if (d.length <= 11) d = '55' + d; return 'https://wa.me/' + d + (txt ? '?text=' + encodeURIComponent(txt) : ''); }
  function prof(idOuNome) { return (D.profissionais || []).filter(function (x) { return x.id === idOuNome || x.nome === idOuNome; })[0]; }
  function corProf(idOuNome) { var p = prof(idOuNome); return p ? p.cor : (D.cores && D.cores[idOuNome]) || '#9c8a6a'; }
  function minutos(h) { return +h.slice(0, 2) * 60 + +h.slice(3, 5); }
  var toastT;
  function toast(msg, erro) {
    var t = $('#toast'); t.textContent = msg; t.className = 'toast on' + (erro ? ' erro' : '');
    // com uma janela aberta, o aviso vai para dentro dela (senão fica escondido atrás)
    var abertas = $$('dialog[open]'), alvo = abertas.length ? abertas[abertas.length - 1] : document.body;
    if (t.parentNode !== alvo) alvo.appendChild(t);
    clearTimeout(toastT); toastT = setTimeout(function () { t.className = 'toast'; }, 3600);
  }
  function msgErro(e) { return (e && e.message ? e.message : String(e)).replace(/^(Exception|Error): /, '').replace(/^SESSAO: /, ''); }
  function atendimento(token) { return D.atendimentos.filter(function (a) { return a.token === token; })[0]; }
  var ehFuturo = function () { return D.data > D.hoje; };
  // Elainy (Dona) e o login "adm" (Administrador) podem tudo
  var podeTudo = function () { return !!(D && D.usuario && (D.usuario.perfil === 'Dona' || D.usuario.perfil === 'Administrador')); };
  function semAcento(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
  var TAG_ORIGEM = { 'Painel': 'encaixe', 'Recepção': 'marcado no salão' };
  var primeiraVez = function (a) { var h = a.historico || {}; return !h.visitas && !h.faltas && !h.cancelados; };

  /* ---------- carregar ---------- */
  // Dias já vistos ficam na memória: trocar de dia mostra na hora e confere com o Google em seguida.
  var DIAS_MEM = {}, dataAlvo = '';
  function guardarNaMemoria(d) {
    DIAS_MEM[d.data] = { d: d, t: Date.now() };
    if (d.mes) MESES_MEM[d.mes.mes] = d.mes;
  }
  function mostrar(d) {
    D = d; dataAtual = d.data; render();
    if (fichaToken && $('#dlg-ficha').open) abrirFicha(fichaToken, true);
    if ($('#dlg-mes').open && d.mes && d.mes.mes === mesVisto) renderMes();
  }
  function carregar(data, silencioso) {
    var alvo = data || dataAtual;
    dataAlvo = alvo;
    var mem = alvo && DIAS_MEM[alvo];
    if (mem && !silencioso) { mostrar(mem.d); silencioso = true; } // aparece na hora; a conferência vem logo atrás
    if (!silencioso) $('#main').classList.add('carregando');
    return rodar('painelDia', alvo).then(function (d) {
      guardarNaMemoria(d);
      if (alvo && d.data !== dataAlvo) return; // a pessoa já foi para outro dia
      mostrar(d);
      if (d.data === d.hoje) guardarDia(d);
      preCarregar(somaDias(d.data, 1)); preCarregar(somaDias(d.data, -1));
    }).catch(function (e) { if (!/SESSAO/.test(e && e.message || '')) toast('Não foi possível carregar: ' + msgErro(e), true); })
      .then(function () { $('#main').classList.remove('carregando'); });
  }
  // Busca o dia vizinho sem mostrar (as setas ← → ficam instantâneas)
  function preCarregar(data) {
    var mem = DIAS_MEM[data];
    if (mem && Date.now() - mem.t < 120000) return;
    rodar('painelDia', data).then(guardarNaMemoria).catch(function () { /* tenta quando ela for para lá */ });
  }

  /* ---------- tela principal ---------- */
  function render() {
    var ext = extenso(D.data);
    if (window.innerWidth <= 600) {
      var dd = parse(D.data), curto = DIAS[dd.getDay()].slice(0, 3) + ', ' + dd.getDate() + ' ' + MESES[dd.getMonth()].slice(0, 3);
      $('#dia-label').textContent = D.data === D.hoje ? 'Hoje · ' + curto : curto.charAt(0).toUpperCase() + curto.slice(1);
    } else {
      $('#dia-label').textContent = D.data === D.hoje ? 'Hoje, ' + ext : ext.charAt(0).toUpperCase() + ext.slice(1);
    }
    if (D.usuario) $('#quem-nome').textContent = D.usuario.nome;
    $('#btn-precos').hidden = $('#btn-equipe').hidden = !podeTudo();
    $('#chips').hidden = D.profissionais.length < 2;
    document.title = 'Painel · ' + ext;

    var r = D.resumo;
    $('#resumo').innerHTML =
      tile(r.aFazer, r.aFazer === 1 ? 'a fazer' : 'a fazer') + tile(r.concluidos, r.concluidos === 1 ? 'concluído' : 'concluídos') +
      tile(r.faltas, r.faltas === 1 ? 'não veio' : 'não vieram') + tile(brl(r.recebido), 'recebido', true) + tile(brl(r.aReceber), 'a receber');

    var doProf = function (x) { return filtroProf === 'todas' || (x.roteiro ? x.roteiro.some(function (s) { return s.profId === filtroProf; }) : x.profId === filtroProf); };
    var lista = D.atendimentos.filter(doProf);
    var aFazer = lista.filter(function (a) { return A_FAZER.indexOf(a.status) >= 0; });
    var feitos = lista.filter(function (a) { return a.status === 'Concluído' || a.status === 'Não compareceu'; });
    var cancel = lista.filter(function (a) { return a.status === 'Cancelado'; });
    var bloq = D.bloqueios.filter(doProf);

    $('#visao').innerHTML =
      '<button type="button" data-v="afazer" aria-pressed="' + (visao === 'afazer') + '">A fazer<b>' + aFazer.length + '</b></button>' +
      '<button type="button" data-v="todos" aria-pressed="' + (visao === 'todos') + '">Todos do dia<b>' + (aFazer.length + feitos.length) + '</b></button>';
    $('#chips').innerHTML = '<button class="chip" type="button" data-p="todas" aria-pressed="' + (filtroProf === 'todas') + '">Todas</button>' +
      D.profissionais.map(function (p) {
        return '<button class="chip" type="button" data-p="' + esc(p.id) + '" aria-pressed="' + (filtroProf === p.id) + '"><span class="dot" style="background:' + p.cor + '"></span>' + esc(p.nome) + '</button>';
      }).join('');

    // "Agora": quem está em atendimento ou a próxima da fila (só hoje)
    var destaque = null;
    if (D.data === D.hoje) {
      destaque = aFazer.filter(function (a) { return a.status === 'Em atendimento'; })[0] ||
        aFazer.filter(function (a) { return a.status === 'Confirmado' && a.fim > D.agora; })[0];
    }

    var mostrar = visao === 'afazer' ? aFazer : aFazer.concat(feitos);
    var itens = mostrar.map(function (a) { return { hora: a.hora, html: cardHTML(a, a === destaque) }; })
      .concat(bloq.map(function (b) { return { hora: b.ini || '00:00', html: bloqHTML(b) }; })) // bloqueios aparecem nas duas visões
      .sort(function (x, y) { return x.hora < y.hora ? -1 : x.hora > y.hora ? 1 : 0; });

    var html = itens.map(function (i) { return i.html; }).join('');
    if (!mostrar.length) {
      html = '<div class="vazio">' + (visao === 'afazer' && feitos.length
        ? '<b>Tudo feito por ' + (D.data === D.hoje ? 'hoje' : 'este dia') + ' ✨</b>Veja os atendimentos concluídos em "Todos do dia".'
        : '<b>Nenhum atendimento ' + (D.data === D.hoje ? 'hoje' : 'neste dia') + '</b>Use "Novo atendimento" para marcar alguém que ligou ou chegou sem horário.') + '</div>' + html;
    }
    if (visao === 'todos' && cancel.length) {
      html += '<h3 class="secao-titulo">Cancelados (' + cancel.length + ')</h3>' + cancel.map(function (a) { return cardHTML(a, false); }).join('');
    }
    $('#grade').innerHTML = html;
  }

  function tile(v, l, gold) { return '<div class="tile' + (gold ? ' tile--gold' : '') + '"><b>' + v + '</b><span>' + l + '</span></div>'; }

  function cardHTML(a, agora) {
    var pago = a.pagamento === 'Pago';
    var falta = a.status === 'Não compareceu';
    var serv = a.roteiro.map(function (s) {
      return '<div><span class="dot" style="background:' + corProf(s.profId || s.prof) + '"></span>' + esc(s.servico) + ' <span style="color:var(--muted)">· ' + esc(s.prof) + '</span></div>';
    }).join('');
    var valor = pago ? brl(a.valorPago != null ? a.valorPago : a.valor) : brl(a.valor);
    var pagPill = falta ? '<span class="pill pill--pendente">não cobrado</span>' : a.status === 'Cancelado' ? '' :
      '<span class="pill pill--' + (pago ? 'pago' : 'pendente') + '">' + (pago ? 'Pago · ' + esc(a.forma) : 'A receber') + '</span>';
    return '<button type="button" class="card st-' + CLASSE[a.status] + (agora ? ' card--agora' : '') + '" data-ficha="' + esc(a.token) + '" aria-label="' + esc(a.hora + ', ' + a.cliente + ', ' + ROTULO[a.status]) + '. Abrir ficha">' +
      '<div class="card__status"><span><i></i>' + ROTULO[a.status] + '</span>' + (agora ? '<span class="agora-tag">' + (a.status === 'Em atendimento' ? 'agora' : 'próxima') + '</span>' : '') + '</div>' +
      '<div class="card__corpo">' +
        '<div class="card__hora"><b>' + esc(a.hora) + '</b><small>até ' + esc(a.fim) + '</small></div>' +
        '<div class="card__cliente">' + esc(a.cliente) + (TAG_ORIGEM[a.origem] ? ' <span class="tag">' + TAG_ORIGEM[a.origem] + '</span>' : '') + (primeiraVez(a) ? ' <span class="tag">1ª vez</span>' : '') + '</div>' +
        '<div class="card__serv">' + serv + '</div>' +
        '<div class="card__pe"><span class="card__valor">' + valor + '</span>' + pagPill + '</div>' +
      '</div></button>';
  }

  function bloqHTML(b) {
    return '<div class="card bloq">' +
      '<div class="card__status"><span>' + ICON.lock + 'Bloqueado</span><button class="link" type="button" data-desbloq data-ag="' + esc(b.agendaId) + '" data-ev="' + esc(b.eventoId) + '" data-de="' + esc(b.de || '') + '" data-ate="' + esc(b.ate || '') + '">Remover</button></div>' +
      '<div class="card__corpo">' +
        '<div class="card__hora"><b>' + (b.diaInteiro ? 'Dia todo' : esc(b.ini)) + '</b>' + (b.ate ? '<small>de ' + esc(dataBR(b.de).slice(0, 5)) + ' até ' + esc(dataBR(b.ate).slice(0, 5)) + '</small>' : b.diaInteiro ? '' : '<small>até ' + esc(b.fim) + '</small>') + '</div>' +
        '<div class="card__cliente"><span class="dot" style="background:' + corProf(b.profId) + '"></span> ' + esc(b.prof) + '</div>' +
        '<div class="card__serv">' + esc(b.titulo.replace(/^🔒\s*/, '')) + '</div>' +
      '</div></div>';
  }

  /* ---------- ficha completa ---------- */
  function abrirFicha(token, recarregando) {
    var a = atendimento(token);
    if (!a) { if (recarregando) $('#dlg-ficha').close(); return; }
    fichaToken = token;
    var pago = a.pagamento === 'Pago', falta = a.status === 'Não compareceu', cancelado = a.status === 'Cancelado';
    var h = a.historico || {};
    var futuro = ehFuturo();
    var passos = ['Confirmado', 'Em atendimento', 'Concluído', 'Não compareceu'].map(function (s) {
      var trava = futuro && s !== 'Confirmado';
      return '<button type="button" data-status="' + s + '" class="st-' + CLASSE[s] + '" aria-pressed="' + (a.status === s) + '"' + (trava || cancelado ? ' disabled' : '') + '>' + ROTULO[s] + '</button>';
    }).join('');
    var histTags = primeiraVez(a)
      ? '<span class="novo">✨ Primeira vez no salão</span>'
      : h.visitas === 0 ? '<span>Ainda não teve atendimento concluído</span>'
      : '<span>' + h.visitas + (h.visitas === 1 ? ' visita' : ' visitas') + ' antes</span>' + (h.ultimaVisita ? '<span>Última: ' + dataBR(h.ultimaVisita) + '</span>' : '') + (h.gasto ? '<span>Já gastou ' + brl(h.gasto) + '</span>' : '');
    if (h.faltas) histTags += '<span class="alerta">' + h.faltas + (h.faltas === 1 ? ' falta' : ' faltas') + '</span>';
    if (h.cancelados) histTags += '<span>' + h.cancelados + (h.cancelados === 1 ? ' cancelamento' : ' cancelamentos') + '</span>';

    var pagamentoHTML;
    if (cancelado) {
      pagamentoHTML = '<p style="margin:0;color:var(--muted)">Atendimento cancelado.</p>';
    } else if (pago) {
      pagamentoHTML = '<div class="pago-box">' +
        '<div class="dado"><span>Recebido</span><b style="font-weight:500;color:var(--ok)">' + brl(a.valorPago != null ? a.valorPago : a.valor) + '</b></div>' +
        '<div class="dado"><span>Forma</span>' + esc(a.forma) + '</div>' +
        (a.pagoEm ? '<div class="dado"><span>Pago em</span>' + esc(a.pagoEm) + '</div>' : '') +
        '<div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn--ghost btn--sm" type="button" id="f-recibo">Ver recibo</button><button class="link" type="button" id="f-despagar">Desfazer pagamento</button></div></div>' +
        (a.valorPago != null && a.valorPago !== a.valor ? '<p class="dica">Estimado no agendamento: ' + brl(a.valor) + '</p>' : '');
    } else if (falta) {
      pagamentoHTML = '<p style="margin:0;color:var(--muted)">A cliente não veio. Nada a cobrar (estimado era ' + brl(a.valor) + ').</p>';
    } else {
      pagamentoHTML =
        '<div class="rot">Forma de pagamento</div><div class="opcoes" id="f-formas">' + D.formas.map(function (f) { return '<button type="button" aria-pressed="false" data-f="' + esc(f) + '">' + esc(f) + '</button>'; }).join('') + '</div>' +
        '<div style="display:flex;gap:10px;align-items:flex-end;margin-top:12px;flex-wrap:wrap">' +
          '<label class="f" style="flex:1;min-width:160px">Valor recebido (R$)<input class="input" id="f-valor" type="number" inputmode="decimal" min="0" step="0.01" value="' + (a.valor ? a.valor.toFixed(2) : '') + '"></label>' +
          '<button class="btn" type="button" id="f-pagar" disabled>Confirmar pagamento</button></div>' +
        '<p class="dica">Estimado: ' + brl(a.valor) + '. Ajuste o valor se mudou algo (cabelo comprido, serviço extra, desconto).</p>';
    }

    $('#ficha').innerHTML =
      '<div class="dlg__head st-' + CLASSE[a.status] + '"><div class="ficha__titulo"><h2 id="ficha-nome" tabindex="-1" autofocus style="outline:none">' + esc(a.cliente) + '</h2><span class="st-pill">' + ROTULO[a.status] + '</span>' +
        '<span class="tag">' + (TAG_ORIGEM[a.origem] || 'pelo site') + '</span></div>' +
        '<button class="icon icon--plain" type="button" data-fechar aria-label="Fechar">✕</button></div>' +
      '<div class="dlg__body">' +
        (cancelado ? '' : '<div class="bloco"><div class="bloco__t">Andamento</div><div class="passos">' + passos + '</div>' +
          (futuro ? '<p class="dica">Esse atendimento é em ' + dataBR(D.data) + '. O andamento pode ser marcado a partir do dia dele.</p>' : '') + '</div>') +
        '<div class="grade2">' +
          '<div class="bloco"><div class="bloco__t">Horário e serviços</div>' +
            '<div class="dado" style="margin-bottom:10px"><span>Dia</span>' + esc(extenso(D.data)) + '</div>' +
            '<div class="rot-lista">' + a.roteiro.map(function (s, i) {
              return '<div><time>' + esc(s.ini) + '–' + esc(s.fim) + '</time><span><span class="dot" style="background:' + corProf(s.profId || s.prof) + '"></span> ' + esc(s.servico) + ' <span style="color:var(--muted)">· ' + esc(s.prof) + '</span>' +
                (podeTrocar(a) ? ' <button class="link" type="button" data-trocar="' + i + '">trocar</button>' : '') + '</span></div>' +
                '<div class="trocar" data-trocar-box="' + i + '" hidden></div>';
            }).join('') + '</div>' +
            (a.criadoEm ? '<p class="dica">Marcado ' + (a.origem === 'Site' || !a.origem ? 'pelo site' : 'no painel') + ' em ' + esc(a.criadoEm) + '</p>' : '') +
          '</div>' +
          '<div class="bloco"><div class="bloco__t">Cliente</div>' +
            '<div class="dado"><span>Telefone</span>' + (a.fone ? esc(fone(a.fone)) : '—') + '</div>' +
            (a.email ? '<div class="dado" style="margin-top:6px"><span>E-mail</span>' + esc(a.email) + '</div>' : '') +
            (a.obs ? '<div class="dado" style="margin-top:6px"><span>Observação da cliente</span>📝 ' + esc(a.obs) + '</div>' : '') +
            '<div class="hist">' + histTags + '</div>' +
            (a.fone ? '<div style="margin-top:12px"><a class="btn btn--wa btn--sm" target="_blank" rel="noopener" href="' + wa(a.fone, 'Oi, ' + String(a.cliente).split(' ')[0] + '! Aqui é do Salão Elainy Ferraz.') + '">' + ICON.wa + 'Chamar no WhatsApp</a></div>' : '') +
          '</div>' +
        '</div>' +
        '<div class="bloco"><div class="bloco__t">Pagamento</div>' + pagamentoHTML + '</div>' +
        '<div class="bloco"><div class="bloco__t">Nota fiscal e anotações da equipe</div>' +
          '<div class="linha2">' +
            '<label class="f">Nota fiscal<select class="input" id="f-nota">' + D.notas.map(function (n) { return '<option' + (a.nota === n ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('') + '</select></label>' +
            '<label class="f">CPF ou CNPJ para a nota <small>(se pedir)</small><input class="input" id="f-doc" inputmode="numeric" value="' + esc(a.docNota) + '"></label>' +
          '</div>' +
          '<label class="f" style="margin-top:12px">Anotações internas <small>(só a equipe vê: preferências, fórmula da cor, alergias…)</small><textarea class="input" id="f-obsint">' + esc(a.obsInterna) + '</textarea></label>' +
          '<div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn btn--ghost btn--sm" type="button" id="f-salvar-det" disabled>Salvar anotações</button></div>' +
        '</div>' +
      '</div>' +
      '<div class="dlg__foot">' +
        (cancelado ? '' : '<button class="link link--bad esq" type="button" id="f-cancelar">Cancelar atendimento</button>') +
        '<button class="btn btn--ghost" type="button" data-fechar>Fechar</button>' +
      '</div>';

    if (!recarregando || !$('#dlg-ficha').open) $('#dlg-ficha').showModal();
    ligarFicha(a);
  }

  function ligarFicha(a) {
    var dlg = $('#dlg-ficha');
    $$('[data-status]', dlg).forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.getAttribute('aria-pressed') === 'true') return;
        salvar(a.token, { status: b.dataset.status }, ROTULO[b.dataset.status] + ': ' + a.cliente);
      });
    });
    var forma = null;
    if ($('#f-formas', dlg)) {
      $('#f-formas', dlg).addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        forma = b.dataset.f;
        $$('button', this).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        $('#f-pagar', dlg).disabled = false;
      });
      $('#f-pagar', dlg).addEventListener('click', function () {
        var v = $('#f-valor', dlg).value;
        if (v !== '' && Number(v) < 0) return toast('O valor não pode ser negativo.', true);
        salvar(a.token, { pagamento: 'Pago', forma: forma, valorPago: v }, 'Pagamento de ' + a.cliente + ' registrado');
      });
    }
    if ($('#f-despagar', dlg)) $('#f-despagar', dlg).addEventListener('click', function () {
      confirmar('Desfazer o pagamento de ' + a.cliente + '?', 'O atendimento volta a aparecer como "a receber".', 'Desfazer', 'Voltar').then(function (sim) {
        if (sim) salvar(a.token, { pagamento: 'Pendente' }, 'Pagamento desfeito');
      });
    });
    if ($('#f-recibo', dlg)) $('#f-recibo', dlg).addEventListener('click', function () { abrirRecibo(a); });
    var det = $('#f-salvar-det', dlg);
    ['#f-nota', '#f-doc', '#f-obsint'].forEach(function (s) { $(s, dlg).addEventListener('input', function () { det.disabled = false; }); });
    det.addEventListener('click', function () {
      det.disabled = true;
      rodar('salvarDetalhes', a.token, { nota: $('#f-nota', dlg).value, docNota: $('#f-doc', dlg).value, obsInterna: $('#f-obsint', dlg).value })
        .then(function () { toast('Anotações salvas'); carregar(null, true); })
        .catch(function (e) { det.disabled = false; toast('Não salvou: ' + msgErro(e), true); });
    });
    $$('[data-trocar]', dlg).forEach(function (b) {
      b.addEventListener('click', function () { abrirTroca(a, Number(b.dataset.trocar)); });
    });
    if ($('#f-cancelar', dlg)) $('#f-cancelar', dlg).addEventListener('click', function () {
      confirmar('Cancelar o horário de ' + a.cliente + '?',
        (a.pagamento === 'Pago' ? 'Atenção: esse atendimento já foi PAGO. Combine a devolução com a cliente. ' : '') + 'O horário fica livre de novo no site. Isso não pode ser desfeito.',
        'Sim, cancelar', 'Manter').then(function (sim) {
        if (sim) salvar(a.token, { status: 'Cancelado' }, 'Horário de ' + a.cliente + ' cancelado');
      });
    });
  }

  /* ---------- trocar a profissional de um serviço ---------- */
  function podeTrocar(a) {
    return D.usuario && D.usuario.perfil !== 'Profissional' && A_FAZER.indexOf(a.status) >= 0 && D.profissionais.length > 1 &&
      a.roteiro.every(function (s) { return s.profId; });
  }
  function quemFaz(passo) {
    var s = D.servicos.filter(function (x) { return x.id === passo.servicoId || x.nome === passo.servico; })[0];
    return D.profissionais.filter(function (p) {
      return p.id !== passo.profId && (!s || p.categorias.indexOf('*') >= 0 || p.categorias.indexOf(s.categoria) >= 0);
    });
  }
  function abrirTroca(a, i) {
    var box = $('[data-trocar-box="' + i + '"]', $('#dlg-ficha'));
    if (!box.hidden) { box.hidden = true; return; }
    var passo = a.roteiro[i], lista = quemFaz(passo);
    box.innerHTML = lista.length
      ? '<select class="input" aria-label="Nova profissional para ' + esc(passo.servico) + '">' + lista.map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.nome) + '</option>'; }).join('') + '</select>' +
        '<button class="btn btn--sm" type="button" data-ok>Trocar</button><button class="link" type="button" data-nao>Cancelar</button>'
      : '<span class="dica" style="margin:0">Nenhuma outra profissional faz ' + esc(passo.servico) + '.</span><button class="link" type="button" data-nao>Fechar</button>';
    box.hidden = false;
    $('[data-nao]', box).addEventListener('click', function () { box.hidden = true; });
    if (!lista.length) return;
    var ok = $('[data-ok]', box);
    function enviar(confirmar) {
      var profId = $('select', box).value;
      ok.disabled = true; ok.textContent = 'Trocando…';
      rodar('trocarProfissional', a.token, i, profId, confirmar).then(function (r) {
        if (r && r.foraDoHorario) {
          return confirmar('Fora do horário dela', r.mensagem + ' Trocar mesmo assim?', 'Trocar mesmo assim', 'Voltar').then(function (sim) {
            if (sim) return enviar(true);
            ok.disabled = false; ok.textContent = 'Trocar';
          });
        }
        toast(r && r.mensagem ? r.mensagem : 'Profissional trocada');
        carregar(null, true);
      }).catch(function (e) {
        ok.disabled = false; ok.textContent = 'Trocar';
        toast(msgErro(e), true);
      });
    }
    ok.addEventListener('click', function () { enviar(false); });
  }

  function abrirRecibo(a) {
    var valor = a.valorPago != null ? a.valorPago : a.valor;
    $('#recibo-area').innerHTML =
      '<h3>Salão de Beleza Elainy Ferraz</h3>' +
      '<div class="sub">Elainy Ferraz Santos · CNPJ 10.885.554/0001-77<br>Rua Siqueira Campos, 1025 · Vitória da Conquista - BA · (77) 99972-7445</div>' +
      '<table>' +
        '<tr><td>Cliente</td><td>' + esc(a.cliente) + '</td></tr>' +
        '<tr><td>Data do atendimento</td><td>' + dataBR(D.data) + ', ' + esc(a.hora) + '</td></tr>' +
        a.roteiro.map(function (s) { return '<tr><td>' + esc(s.servico) + '</td><td>' + esc(s.prof) + '</td></tr>'; }).join('') +
        '<tr><td>Forma de pagamento</td><td>' + esc(a.forma) + '</td></tr>' +
        (a.pagoEm ? '<tr><td>Pago em</td><td>' + esc(a.pagoEm) + '</td></tr>' : '') +
        '<tr class="total"><td>Total recebido</td><td>' + brl(valor) + '</td></tr>' +
      '</table>' +
      '<div class="rodape">Recebemos de ' + esc(a.cliente) + ' a quantia acima pelos serviços prestados.<br>Este recibo não substitui a nota fiscal.</div>';
    $('#dlg-recibo').showModal();
  }
  $('#imprimir').addEventListener('click', function () { window.print(); });

  /* ---------- cliques gerais ---------- */
  document.addEventListener('click', function (e) {
    var fechar = e.target.closest('[data-fechar]');
    if (fechar) { fechar.closest('dialog').close(); return; }
    var v = e.target.closest('#visao [data-v]');
    if (v) { visao = v.dataset.v; render(); return; }
    var chip = e.target.closest('.chip');
    if (chip) { filtroProf = chip.dataset.p; render(); return; }
    var desb = e.target.closest('[data-desbloq]');
    if (desb) {
      var periodo = desb.dataset.ate ? ' Isso libera o período inteiro, de ' + dataBR(desb.dataset.de).slice(0, 5) + ' até ' + dataBR(desb.dataset.ate).slice(0, 5) + '.' : '';
      confirmar('Remover este bloqueio?', 'O horário volta a aparecer livre no site.' + periodo, 'Remover', 'Voltar').then(function (sim) {
        if (!sim) return;
        rodar('removerBloqueio', desb.dataset.ag, desb.dataset.ev).then(function () {
          toast('Bloqueio removido');
          [desb.dataset.de, desb.dataset.ate, dataAtual].forEach(function (x) { if (x) delete MESES_MEM[x.slice(0, 7)]; });
          DIAS_MEM = {}; carregar(null, true);
        })
          .catch(function (er) { toast(msgErro(er), true); });
      });
      return;
    }
    var card = e.target.closest('[data-ficha]');
    if (card) abrirFicha(card.dataset.ficha);
  });
  $('#dlg-ficha').addEventListener('close', function () { fichaToken = null; });

  function salvar(token, campos, msg) {
    // Atualiza a tela na hora e confirma no servidor
    var a = atendimento(token);
    var antes = JSON.stringify(a);
    Object.keys(campos).forEach(function (k) { a[k] = campos[k]; });
    if (campos.pagamento === 'Pago') {
      a.valorPago = campos.valorPago === '' ? null : Number(campos.valorPago);
      if (campos.status === undefined && A_FAZER.indexOf(a.status) >= 0 && !ehFuturo()) a.status = 'Concluído';
    }
    render();
    if ($('#dlg-ficha').open && fichaToken === token) abrirFicha(token, true);
    rodar('atualizarAtendimento', token, campos).then(function () { toast(msg); carregar(null, true); })
      .catch(function (e) {
        Object.assign(a, JSON.parse(antes)); render();
        if ($('#dlg-ficha').open && fichaToken === token) abrirFicha(token, true);
        toast('Não salvou: ' + msgErro(e), true);
      });
  }

  /* ---------- encaixe ---------- */
  function profsQueFazem(ids) {
    var servs = D.servicos.filter(function (s) { return ids.indexOf(s.id) >= 0; });
    return D.profissionais.filter(function (p) {
      return p.categorias.indexOf('*') >= 0 || servs.every(function (s) { return p.categorias.indexOf(s.categoria) >= 0; });
    });
  }
  function atualizarProfsEncaixe() {
    var ids = $$('#enc-servs input:checked').map(function (i) { return i.value; });
    var atual = $('#enc-prof').value;
    var lista = ids.length ? profsQueFazem(ids) : D.profissionais;
    $('#enc-prof').innerHTML = lista.length
      ? lista.map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === atual ? ' selected' : '') + '>' + esc(p.nome) + '</option>'; }).join('')
      : '<option value="">Ninguém faz todos esses serviços juntos</option>';
  }
  function horaSugerida() {
    if (D.data !== D.hoje) return '09:00';
    var m = minutos(D.agora); m = Math.min(Math.ceil((m + 1) / 30) * 30, 23 * 60 + 30); // nunca "24:00"
    return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  }
  var tipoNovo = 'agendar';   // 'agendar' (horário livre) | 'encaixe' (hora livre, pode ser fora da agenda)
  var horaEscolhida = '';
  var buscaLivres = 0;
  $('#btn-encaixe').addEventListener('click', function () {
    var cats = {};
    D.servicos.forEach(function (s) { (cats[s.categoria] = cats[s.categoria] || []).push(s); });
    $('#enc-servs').innerHTML = Object.keys(cats).map(function (c) {
      return '<div class="cat">' + esc(c) + '</div>' + cats[c].map(function (s) {
        return '<label><input type="checkbox" value="' + esc(s.id) + '"> ' + esc(s.nome) + '<small>' + s.duracao + ' min</small></label>';
      }).join('');
    }).join('');
    $('#form-enc').reset();
    escolhida = null; mostrarCliente(null); fecharSug();
    carregarClientes().catch(function () { /* sem lista: dá para digitar normalmente */ });
    atualizarProfsEncaixe();
    if (filtroProf !== 'todas') $('#enc-prof').value = filtroProf;
    $('#enc-data').value = D.data < D.hoje ? D.hoje : D.data;
    $('#enc-hora').value = horaSugerida();
    mudarTipo('agendar');
    $('#dlg-enc').showModal();
    $('#enc-nome').focus();
  });
  function mudarTipo(t) {
    tipoNovo = t;
    $$('#enc-abas [data-tipo]').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.tipo === t); });
    $('#enc-hora-box').hidden = t === 'agendar';
    $('#enc-livres-box').hidden = t !== 'agendar';
    if (t === 'encaixe' && $('#enc-data').value === D.hoje) $('#enc-hora').value = horaSugerida();
    resetEncaixe();
    carregarLivres();
  }
  $('#enc-abas').addEventListener('click', function (e) {
    var b = e.target.closest('[data-tipo]');
    if (b && b.dataset.tipo !== tipoNovo) mudarTipo(b.dataset.tipo);
  });
  function servsEscolhidos() { return $$('#enc-servs input:checked').map(function (i) { return i.value; }); }
  function carregarLivres() {
    horaEscolhida = '';
    if (tipoNovo !== 'agendar') return;
    var box = $('#enc-livres'), d = { prof: $('#enc-prof').value, data: $('#enc-data').value, servicos: servsEscolhidos() };
    if (!d.servicos.length) { box.innerHTML = '<p>Escolha os serviços para ver os horários livres.</p>'; return; }
    if (!d.prof) { box.innerHTML = '<p>Ninguém faz todos esses serviços juntos. Marque em dois atendimentos.</p>'; return; }
    if (!d.data) { box.innerHTML = '<p>Escolha o dia.</p>'; return; }
    var minha = ++buscaLivres;
    box.innerHTML = '<p>Procurando horários livres…</p>';
    rodar('horariosLivres', d).then(function (lista) {
      if (minha !== buscaLivres) return; // o usuário mudou algo nesse meio-tempo
      box.innerHTML = lista.length
        ? lista.map(function (h) { return '<button type="button" aria-pressed="false" data-h="' + h + '">' + h + '</button>'; }).join('')
        : '<p>Nenhum horário livre nesse dia para esses serviços. Tente outro dia ou outra profissional, ou use a aba <b>Encaixe</b>.</p>';
    }).catch(function (e) { if (minha === buscaLivres) box.innerHTML = '<p>Não consegui buscar os horários: ' + esc(msgErro(e)) + '</p>'; });
  }
  $('#enc-livres').addEventListener('click', function (e) {
    var b = e.target.closest('[data-h]'); if (!b) return;
    horaEscolhida = b.dataset.h;
    $$('button', this).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
    $('#enc-aviso').innerHTML = '';
  });
  $('#enc-servs').addEventListener('change', function () { atualizarProfsEncaixe(); carregarLivres(); });
  $('#enc-prof').addEventListener('change', carregarLivres);
  $('#enc-data').addEventListener('change', carregarLivres);
  function resetEncaixe() {
    $('#enc-aviso').innerHTML = '';
    $('#enc-ok').textContent = tipoNovo === 'agendar' ? 'Agendar horário' : 'Salvar encaixe';
    $('#enc-ok').dataset.foraHorario = '';
  }
  // Telefone: só números, no máximo 11 (DDD + celular), já formatado
  $('#enc-fone').addEventListener('input', function (e) {
    if (e.inputType && e.inputType.indexOf('delete') === 0) return; // deixa apagar à vontade
    this.value = fone(this.value.replace(/\D/g, '').slice(0, 11));
  });
  $('#form-enc').addEventListener('input', function (e) {
    if (e.target.closest('#enc-livres')) return;
    if ($('#enc-ok').dataset.foraHorario || $('#enc-aviso').innerHTML) resetEncaixe();
  });
  $('#form-enc').addEventListener('submit', function (e) {
    e.preventDefault();
    var agendar = tipoNovo === 'agendar';
    var dados = {
      tipo: tipoNovo, nome: $('#enc-nome').value.trim(), fone: $('#enc-fone').value, email: $('#enc-email').value.trim(), prof: $('#enc-prof').value,
      servicos: servsEscolhidos(), data: $('#enc-data').value, hora: agendar ? horaEscolhida : $('#enc-hora').value, obs: $('#enc-obs').value,
      confirmarForaHorario: $('#enc-ok').dataset.foraHorario === '1',
    };
    var digitos = dados.fone.replace(/\D/g, '');
    var falta = !dados.nome ? 'Informe o nome da cliente.' : !digitos ? 'Informe o telefone da cliente (é obrigatório).' : digitos.length < 10 || digitos.length > 11 ? 'Confira o telefone: DDD + número, por exemplo (77) 99999-0000.'
      : dados.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(dados.email) ? 'Confira o e-mail (ou deixe em branco).' : !dados.servicos.length ? 'Escolha pelo menos um serviço.' : !dados.prof ? 'Ninguém faz todos esses serviços juntos. Marque em dois atendimentos.' : !dados.data ? 'Informe o dia.'
      : !dados.hora ? (agendar ? 'Escolha um dos horários livres.' : 'Informe o horário.') : '';
    if (falta) { $('#enc-aviso').innerHTML = '<div class="aviso aviso--erro">' + esc(falta) + '</div>'; $('#enc-aviso').scrollIntoView({ block: 'nearest' }); return; }
    $('#enc-ok').disabled = true;
    rodar('criarEncaixe', dados).then(function (r) {
      $('#enc-ok').disabled = false;
      if (r && r.foraDoHorario) {
        $('#enc-aviso').innerHTML = '<div class="aviso aviso--warn">⚠️ ' + esc(r.mensagem) + ' Confirme só se ela vai mesmo atender nesse horário.</div>';
        $('#enc-ok').textContent = 'Salvar mesmo fora do horário';
        $('#enc-ok').dataset.foraHorario = '1';
        $('#enc-aviso').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        return;
      }
      $('#dlg-enc').close();
      CLIENTES = null; // a lista de clientes vem de novo, já com ela
      delete MESES_MEM[dados.data.slice(0, 7)];
      toast(agendar ? 'Horário de ' + dados.nome + ' agendado para ' + dataBR(dados.data) + ' às ' + dados.hora : 'Encaixe de ' + dados.nome + ' salvo');
      carregar(dados.data);
    }).catch(function (er) {
      $('#enc-ok').disabled = false;
      $('#enc-aviso').innerHTML = '<div class="aviso aviso--erro">⛔ ' + esc(msgErro(er)) + '</div>';
      $('#enc-aviso').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      if (agendar) carregarLivres(); // alguém pode ter pegado o horário
    });
  });

  /* ---------- busca de clientes (Novo atendimento) ---------- */
  // Digite "cl" e aparecem as clientes com alguma palavra do nome começando por "cl" (sem ligar para acento).
  // Ao escolher, o telefone e o e-mail já vêm preenchidos.
  var CLIENTES = null, clientesEm = 0, sug = [], sugIdx = -1, escolhida = null;
  function carregarClientes() {
    if (CLIENTES && Date.now() - clientesEm < 300000) return Promise.resolve(CLIENTES);
    return rodar('clientes').then(function (l) {
      CLIENTES = l; clientesEm = Date.now();
      if (document.activeElement === $('#enc-nome')) mostrarSug(); // ela já estava digitando
      return l;
    });
  }
  // Já na 1ª letra aparece a lista (com rolagem): primeiro quem tem o 1º nome começando assim, depois o sobrenome
  var MAX_SUG = 60;
  function buscar(txt) {
    var q = semAcento(txt).trim(), dig = String(txt).replace(/\D/g, '');
    if (!CLIENTES) return [];
    if (dig.length >= 3) return CLIENTES.filter(function (c) { return c.f.indexOf(dig) >= 0; }).slice(0, MAX_SUG);
    if (!q) return [];
    var partes = q.split(/\s+/);
    return CLIENTES.map(function (c) {
      var palavras = semAcento(c.n).split(/\s+/);
      var ok = partes.every(function (p) { return palavras.some(function (w) { return w.indexOf(p) === 0; }); });
      return ok ? { c: c, rank: palavras[0].indexOf(partes[0]) === 0 ? 0 : 1 } : null;
    }).filter(Boolean).sort(function (a, b) { return a.rank - b.rank; }).slice(0, MAX_SUG).map(function (x) { return x.c; }); // a lista já vem em ordem alfabética
  }
  // Deixa em negrito o começo das palavras que bateram com o que foi digitado
  function realce(nome, txt) {
    var partes = semAcento(txt).trim().split(/\s+/).filter(String);
    return String(nome).split(' ').map(function (w) {
      var p = partes.filter(function (x) { return semAcento(w).indexOf(x) === 0; }).sort(function (a, b) { return b.length - a.length; })[0];
      return p ? '<mark>' + esc(w.slice(0, p.length)) + '</mark>' + esc(w.slice(p.length)) : esc(w);
    }).join(' ');
  }
  function detalheCliente(c) {
    return fone(c.f) + (c.v ? ' · ' + c.v + (c.v === 1 ? ' visita' : ' visitas') : ' · ainda sem visita concluída') + (c.u ? ' · última ' + dataBR(c.u) : '');
  }
  function mostrarSug() {
    var txt = $('#enc-nome').value, lista = $('#enc-sug');
    sug = escolhida && escolhida.n === txt ? [] : buscar(txt);
    sugIdx = -1;
    if (!sug.length) { fecharSug(); return; }
    lista.innerHTML = '<li class="sug__topo" aria-hidden="true">' + (sug.length >= MAX_SUG ? 'Mais de ' + MAX_SUG + ' clientes: continue digitando' : sug.length + (sug.length === 1 ? ' cliente encontrada' : ' clientes encontradas')) + '</li>' + sug.map(function (c, i) {
      return '<li role="option" id="sug-' + i + '" data-i="' + i + '" aria-selected="false"><b>' + realce(c.n, txt) + '</b><small>' + esc(detalheCliente(c)) + '</small></li>';
    }).join('') + '<li class="sug__nova" aria-disabled="true">Não achou? Continue digitando: é uma cliente nova.</li>';
    lista.hidden = false;
    $('#enc-nome').setAttribute('aria-expanded', 'true');
  }
  function fecharSug() {
    $('#enc-sug').hidden = true; sug = []; sugIdx = -1;
    $('#enc-nome').setAttribute('aria-expanded', 'false'); $('#enc-nome').removeAttribute('aria-activedescendant');
  }
  function marcarSug(i) {
    sugIdx = (i + sug.length) % sug.length;
    $$('#enc-sug [data-i]').forEach(function (li) { li.setAttribute('aria-selected', Number(li.dataset.i) === sugIdx); });
    $('#enc-nome').setAttribute('aria-activedescendant', 'sug-' + sugIdx);
    var li = $('#sug-' + sugIdx); if (li) li.scrollIntoView({ block: 'nearest' });
  }
  function escolher(c) {
    escolhida = c;
    $('#enc-nome').value = c.n;
    $('#enc-fone').value = fone(c.f);
    if (c.e) $('#enc-email').value = c.e;
    fecharSug();
    mostrarCliente(c);
    var primeiro = $('#enc-servs input'); if (primeiro) primeiro.focus();
  }
  function mostrarCliente(c) {
    var box = $('#enc-cliente');
    box.hidden = !c;
    if (c) box.innerHTML = '<span class="ok">✓ Cliente já cadastrada</span><span>' + esc(detalheCliente(c)) + '</span><button class="link" type="button" id="enc-limpar">não é ela? limpar</button>';
  }
  $('#enc-nome').addEventListener('input', function () {
    if (escolhida && this.value !== escolhida.n) { escolhida = null; mostrarCliente(null); }
    mostrarSug();
  });
  $('#enc-nome').addEventListener('focus', mostrarSug);
  $('#enc-nome').addEventListener('blur', function () { setTimeout(fecharSug, 150); });
  $('#enc-nome').addEventListener('keydown', function (e) {
    if ($('#enc-sug').hidden) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); marcarSug(sugIdx + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); marcarSug(sugIdx - 1); }
    else if (e.key === 'Enter' && sugIdx >= 0) { e.preventDefault(); escolher(sug[sugIdx]); }
    else if (e.key === 'Escape') { e.preventDefault(); fecharSug(); }
  });
  // mousedown (e não click) para escolher antes de o campo perder o foco
  $('#enc-sug').addEventListener('mousedown', function (e) {
    var li = e.target.closest('[data-i]'); if (!li) return;
    e.preventDefault(); escolher(sug[Number(li.dataset.i)]);
  });
  $('#enc-cliente').addEventListener('click', function (e) {
    if (!e.target.closest('#enc-limpar')) return;
    escolhida = null; mostrarCliente(null);
    $('#enc-nome').value = $('#enc-fone').value = $('#enc-email').value = '';
    $('#enc-nome').focus();
  });

  /* ---------- preços e equipe (só a Elainy e o administrador) ---------- */
  var CFG = null, modoSalao = 'precos', editandoProf = null, novoAcesso = false, boasVindas = null, avisoEquipe = '';
  var DIAS_SEMANA = [1, 2, 3, 4, 5, 6, 0]; // segunda primeiro
  var CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  var PASSOS = ['Nome e o que faz', 'Dias e horários', 'Acesso ao painel', 'Agenda no celular'];
  var PERFIL_TXT = { 'Dona': 'acesso total (dona)', 'Administrador': 'acesso total (computador do salão)', 'Recepção': 'vê a agenda de todas e marca horários' };

  // O site guarda os preços por alguns minutos; isso pede para ele ler a planilha de novo agora.
  function avisarSite() {
    if (!API_DO_SITE) return;
    var url = API_DO_SITE + '?action=atualizar&t=' + Date.now();
    try { fetch(url, { mode: 'no-cors' }).catch(function () { new Image().src = url; }); } catch (e) { new Image().src = url; }
  }

  function carregarSalao() {
    var corpo = $('#salao-corpo'), topo = corpo.scrollTop;
    return rodar('configSalao').then(function (c) { CFG = c; renderSalao(); corpo.scrollTop = topo; })
      .catch(function (e) { corpo.innerHTML = '<div class="aviso aviso--erro">' + esc(msgErro(e)) + '</div>'; });
  }
  function abrirSalao(modo) {
    modoSalao = modo; editandoProf = null; novoAcesso = false; boasVindas = null; avisoEquipe = ''; avisoPrecos = ''; catEditando = catExcluindo = '';
    $('#salao-h').textContent = modo === 'precos' ? 'Serviços e preços' : 'Equipe e acessos';
    $('#salao-dica').textContent = modo === 'precos' ? 'O que você salvar aqui aparece no site na hora.' : 'Quem está ativa na equipe aparece no site para as clientes escolherem.';
    $('#salao-corpo').innerHTML = CFG ? '' : '<p class="dica">Carregando…</p>';
    if (CFG) renderSalao();
    $('#dlg-salao').showModal();
    carregarSalao();
  }
  $('#btn-precos').addEventListener('click', function () { abrirSalao('precos'); });
  $('#btn-equipe').addEventListener('click', function () { abrirSalao('equipe'); });
  function renderSalao() {
    if (modoSalao === 'precos') renderServicos();
    else if (boasVindas) renderBoasVindas();
    else if (editandoProf) renderFormProf();
    else if (novoAcesso) renderFormAcesso();
    else renderEquipe();
  }
  function depoisDeSalvar(msg) {
    toast(msg);
    avisarSite();
    carregar(null, true); // atualiza os serviços e a equipe usados no resto do painel
    return carregarSalao();
  }
  function avisoForm(id, msg) {
    $(id).innerHTML = msg ? '<div class="aviso aviso--erro">' + esc(msg) + '</div>' : '';
    if (msg) $(id).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  // Usuário a partir do nome ("Maria Clara" → "maria"), sem acento nem espaço
  function sugerirUsuario(nome) { return semAcento(String(nome || '').trim().split(/\s+/)[0]).replace(/[^a-z0-9._]/g, ''); }
  // Senha fácil de ditar (sem 0/O, 1/l)
  function gerarSenha() {
    var letras = 'abcdefghjkmnpqrstuvwxyz', nums = '23456789', s = '';
    var r = function (txt) { var a = new Uint32Array(1); (window.crypto || window.msCrypto).getRandomValues(a); return txt[a[0] % txt.length]; };
    for (var i = 0; i < 4; i++) s += r(letras);
    for (i = 0; i < 3; i++) s += r(nums);
    return s;
  }

  /* Serviços e preços */
  function opcoesCategorias(atual) { return CFG.categorias.map(function (c) { return '<option' + (c === atual ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join(''); }
  // Categorias: a Elainy cria, renomeia, muda a ordem e exclui (os serviços nunca ficam sem categoria)
  var avisoPrecos = '', catEditando = '', catExcluindo = '';
  function blocoCategorias() {
    var conta = {};
    CFG.servicos.forEach(function (s) { conta[s.categoria] = (conta[s.categoria] || 0) + 1; });
    var n = CFG.categorias.length;
    return '<div class="bloco cats"><div class="bloco__t">Categorias</div>' +
      '<p class="dica" style="margin:0 0 8px">São as abas do site (Cabelo, Manicure…), nesta ordem. Use as setas para mudar a ordem.</p>' +
      CFG.categorias.map(function (c, i) {
        var q = conta[c] || 0;
        var linha = '<div class="cat-linha" data-cat="' + esc(c) + '">' +
          '<span class="cat-setas"><button class="icon icon--mini" type="button" data-cat-sobe' + (i === 0 ? ' disabled' : '') + ' aria-label="Subir ' + esc(c) + '">↑</button>' +
          '<button class="icon icon--mini" type="button" data-cat-desce' + (i === n - 1 ? ' disabled' : '') + ' aria-label="Descer ' + esc(c) + '">↓</button></span>' +
          '<span class="cat-nome"><b>' + esc(c) + '</b><small>' + (q ? q + (q === 1 ? ' serviço' : ' serviços') : 'sem serviços ainda (não aparece no site)') + '</small></span>' +
          '<button class="link" type="button" data-cat-ren>Renomear</button>' +
          '<button class="link link--bad" type="button" data-cat-del>Excluir</button></div>';
        if (catEditando === c) {
          linha += '<div class="cat-caixa"><input class="input" id="cat-ren-nome" maxlength="30" value="' + esc(c) + '" aria-label="Novo nome de ' + esc(c) + '">' +
            '<button class="btn btn--sm" type="button" data-cat-ren-ok>Salvar nome</button><button class="link" type="button" data-cat-cancela>Cancelar</button></div>';
        }
        if (catExcluindo === c) {
          var outras = CFG.categorias.filter(function (x) { return x !== c; });
          linha += '<div class="cat-caixa cat-caixa--bad">' + (q
            ? '<span>Os ' + q + (q === 1 ? ' serviço' : ' serviços') + ' de "' + esc(c) + '" vão para:</span><select class="input" id="cat-mover">' + outras.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('') + '</select>'
            : '<span>Excluir a categoria "' + esc(c) + '"?</span>') +
            '<button class="btn btn--sm btn--danger" type="button" data-cat-del-ok>Excluir</button><button class="link" type="button" data-cat-cancela>Cancelar</button></div>';
        }
        return linha;
      }).join('') +
      '<div class="cat-caixa cat-nova"><input class="input" id="cat-nova" maxlength="30" placeholder="Nome da nova categoria"><button class="btn btn--ghost btn--sm" type="button" id="cat-nova-ok">+ Criar categoria</button></div>' +
      '</div>';
  }
  function categoriaAcao(d, msgPadrao) {
    return rodar('salvarCategorias', d).then(function (r) {
      catEditando = catExcluindo = '';
      avisoPrecos = (r && r.mensagem) || msgPadrao || '';
      return depoisDeSalvar(avisoPrecos || 'Categorias salvas');
    }).catch(function (er) { toast(msgErro(er), true); carregarSalao(); });
  }
  function renderServicos() {
    var grupos = {};
    CFG.servicos.forEach(function (s) { (grupos[s.categoria] = grupos[s.categoria] || []).push(s); });
    var ordem = CFG.categorias.concat(Object.keys(grupos).filter(function (c) { return CFG.categorias.indexOf(c) < 0; }));
    var linhas = ordem.map(function (c) {
      return '<div class="cat-t">' + esc(c) + '</div>' + (grupos[c] || []).map(function (s) {
        return '<div class="srv' + (s.ativo ? '' : ' srv--off') + '" data-linha="' + s.linha + '">' +
          '<div class="srv__nome"><b>' + esc(s.nome) + '</b>' + (s.ativo ? '' : '<small>Escondido do site</small>') + (s.descricao ? '<small>' + esc(s.descricao) + '</small>' : '') + '</div>' +
          '<label class="f">Categoria<select class="input" data-k="categoria">' + opcoesCategorias(s.categoria) + '</select></label>' +
          '<label class="f">Preço (R$)<input class="input" data-k="preco" type="number" inputmode="decimal" min="0" step="0.01" value="' + (s.preco == null ? '' : s.preco) + '" placeholder="sob consulta"></label>' +
          '<label class="f">Tempo (min)<input class="input" data-k="duracao" type="number" inputmode="numeric" min="5" max="600" step="5" value="' + s.duracao + '"></label>' +
          '<label class="check" title="No site aparece &quot;a partir de&quot; antes do preço"><input type="checkbox" data-k="aPartirDe"' + (s.aPartirDe ? ' checked' : '') + '> A partir de</label>' +
          '<label class="check" title="Desmarque para esconder do site"><input type="checkbox" data-k="ativo"' + (s.ativo ? ' checked' : '') + '> No site</label>' +
          '<button class="btn btn--sm" type="button" data-salvar-srv disabled>Salvar</button>' +
        '</div>';
      }).join('') + (grupos[c] ? '' : '<p class="dica" style="margin:4px 0 8px">Nenhum serviço nesta categoria ainda. Use <b>+ Novo serviço</b> ou mude a categoria de um serviço.</p>');
    }).join('');
    $('#salao-corpo').innerHTML =
      (avisoPrecos ? '<div class="aviso aviso--ok">✅ ' + esc(avisoPrecos) + '</div>' : '') +
      blocoCategorias() +
      '<div class="topo-lista"><p>Mude o preço, o tempo ou a categoria e toque em <b>Salvar</b> na mesma linha. Desmarque <b>No site</b> para esconder um serviço.</p>' +
        '<button class="btn btn--ghost btn--sm" type="button" id="srv-novo">+ Novo serviço</button></div>' +
      '<div class="novo-srv" id="srv-form" hidden>' +
        '<div class="linha2"><label class="f">Nome do serviço<input class="input" id="ns-nome" maxlength="60"></label>' +
          '<label class="f">Categoria<select class="input" id="ns-cat">' + opcoesCategorias(CFG.categorias[0]) + '</select></label></div>' +
        '<label class="f"><span>Descrição curta <small>(opcional, aparece no site)</small></span><input class="input" id="ns-desc" maxlength="140"></label>' +
        '<div class="linha2"><label class="f">Preço (R$)<input class="input" id="ns-preco" type="number" inputmode="decimal" min="0" step="0.01" placeholder="vazio = sob consulta"></label>' +
          '<label class="f">Tempo (min)<input class="input" id="ns-dur" type="number" inputmode="numeric" min="5" max="600" step="5" value="60"></label></div>' +
        '<label class="check"><input type="checkbox" id="ns-apartir"> Preço "a partir de" (pode variar com o cabelo)</label>' +
        '<div id="ns-aviso"></div>' +
        '<div style="display:flex;justify-content:flex-end;gap:8px"><button class="btn btn--ghost btn--sm" type="button" id="ns-cancelar">Cancelar</button><button class="btn btn--sm" type="button" id="ns-salvar">Adicionar serviço</button></div>' +
      '</div>' + linhas;
  }
  $('#salao-corpo').addEventListener('input', function (e) {
    var linha = e.target.closest('.srv'); if (linha) $('[data-salvar-srv]', linha).disabled = false;
  });
  $('#salao-corpo').addEventListener('change', function (e) {
    var linha = e.target.closest('.srv'); if (linha) $('[data-salvar-srv]', linha).disabled = false;
  });
  $('#salao-corpo').addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    if (e.target.id === 'cat-nova') { e.preventDefault(); $('#cat-nova-ok').click(); }
    if (e.target.id === 'cat-ren-nome') { e.preventDefault(); $('[data-cat-ren-ok]').click(); }
  });
  $('#salao-corpo').addEventListener('click', function (e) {
    var t = e.target;
    /* Categorias */
    var catLinha = t.closest('[data-cat]'), catNome = catLinha ? catLinha.dataset.cat : '';
    if (t.closest('[data-cat-sobe]') || t.closest('[data-cat-desce]')) {
      var lista = CFG.categorias.slice(), i = lista.indexOf(catNome), j = i + (t.closest('[data-cat-sobe]') ? -1 : 1);
      lista.splice(j, 0, lista.splice(i, 1)[0]);
      CFG.categorias = lista; avisoPrecos = ''; renderServicos(); // muda na tela na hora
      categoriaAcao({ acao: 'ordem', lista: lista }, 'Ordem das categorias salva. O site já mostra nessa ordem.');
      return;
    }
    if (t.closest('[data-cat-ren]')) { catEditando = catNome; catExcluindo = ''; avisoPrecos = ''; renderServicos(); $('#cat-ren-nome').select(); return; }
    if (t.closest('[data-cat-del]')) { catExcluindo = catNome; catEditando = ''; avisoPrecos = ''; renderServicos(); return; }
    if (t.closest('[data-cat-cancela]')) { catEditando = catExcluindo = ''; renderServicos(); return; }
    if (t.closest('[data-cat-ren-ok]')) { t.disabled = true; categoriaAcao({ acao: 'renomear', de: catEditando, para: $('#cat-ren-nome').value }); return; }
    if (t.closest('[data-cat-del-ok]')) { t.disabled = true; categoriaAcao({ acao: 'excluir', nome: catExcluindo, moverPara: $('#cat-mover') ? $('#cat-mover').value : '' }); return; }
    if (t.closest('#cat-nova-ok')) {
      var nomeCat = $('#cat-nova').value.trim();
      if (!nomeCat) { $('#cat-nova').focus(); return toast('Escreva o nome da nova categoria.', true); }
      t.disabled = true; categoriaAcao({ acao: 'criar', nome: nomeCat });
      return;
    }

    if (t.closest('#srv-novo')) { $('#srv-form').hidden = false; $('#ns-nome').focus(); return; }
    if (t.closest('#ns-cancelar')) { $('#srv-form').hidden = true; return; }
    if (t.closest('#ns-salvar')) {
      var novo = { nome: $('#ns-nome').value, categoria: $('#ns-cat').value, descricao: $('#ns-desc').value, preco: $('#ns-preco').value, duracao: $('#ns-dur').value, aPartirDe: $('#ns-apartir').checked };
      t.disabled = true;
      rodar('salvarServico', novo).then(function () { return depoisDeSalvar(novo.nome.trim() + ' foi adicionado ao site'); })
        .catch(function (er) { t.disabled = false; $('#ns-aviso').innerHTML = '<div class="aviso aviso--erro">' + esc(msgErro(er)) + '</div>'; });
      return;
    }
    var salvarSrv = t.closest('[data-salvar-srv]');
    if (salvarSrv) {
      var linha = salvarSrv.closest('.srv'), s = CFG.servicos.filter(function (x) { return x.linha === Number(linha.dataset.linha); })[0];
      var campo = function (k) { var i = $('[data-k="' + k + '"]', linha); return i.type === 'checkbox' ? i.checked : i.value; };
      salvarSrv.disabled = true; salvarSrv.textContent = 'Salvando…';
      rodar('salvarServico', { linha: s.linha, nome: s.nome, categoria: campo('categoria'), preco: campo('preco'), duracao: campo('duracao'), aPartirDe: campo('aPartirDe'), ativo: campo('ativo') })
        .then(function () { return depoisDeSalvar(s.nome + ': salvo. O site já mostra o valor novo.'); })
        .catch(function (er) { salvarSrv.disabled = false; salvarSrv.textContent = 'Salvar'; toast(msgErro(er), true); });
      return;
    }

    /* Equipe */
    if (t.closest('#prof-nova')) { editandoProf = { nova: true, passo: 1, escala: [] }; avisoEquipe = ''; renderFormProf(); return; }
    var ed = t.closest('[data-editar-prof]');
    if (ed) { editandoProf = CFG.profissionais.filter(function (p) { return p.id === ed.dataset.editarProf; })[0]; avisoEquipe = ''; renderFormProf(); return; }
    if (t.closest('[data-voltar-equipe]')) { editandoProf = null; novoAcesso = false; boasVindas = null; renderEquipe(); return; }
    var cat = t.closest('#pf-cats [data-cat]');
    if (cat) {
      var todas = cat.dataset.cat === 'Todas', marcar = cat.getAttribute('aria-pressed') !== 'true';
      $$('#pf-cats [data-cat]').forEach(function (b) {
        if (b === cat) b.setAttribute('aria-pressed', marcar);
        else if (marcar && (todas || b.dataset.cat === 'Todas')) b.setAttribute('aria-pressed', 'false');
      });
      return;
    }
    var modo = t.closest('#pf-modo [data-modo]');
    if (modo) {
      $$('#pf-modo [data-modo]').forEach(function (b) { b.setAttribute('aria-pressed', b === modo); });
      $('#pf-escala').hidden = modo.dataset.modo !== 'escala';
      return;
    }
    var gerar = t.closest('[data-gerar]');
    if (gerar) { $('#' + gerar.dataset.gerar).value = gerarSenha(); return; }
    if (t.closest('#pf-prox')) { irPasso(editandoProf.passo + 1); return; }
    if (t.closest('#pf-ant')) { irPasso(editandoProf.passo - 1); return; }
    if (t.closest('#pf-salvar')) { salvarProf(t.closest('#pf-salvar')); return; }
    if (t.closest('#pf-excluir')) {
      var px = editandoProf;
      confirmar('Excluir ' + px.nome + ' da equipe?',
        'Isso NÃO pode ser desfeito. ' + px.nome + ' some do site e do painel, os dias de trabalho dela são apagados' + (px.usuario ? ' e o login "' + px.usuario + '" para de funcionar' : '') +
        '. O histórico de atendimentos dela continua guardado. Se ela só vai se afastar por um tempo, prefira "Bloquear > Vários dias (férias)" ou desmarcar "Atende no salão".',
        'Sim, excluir para sempre', 'Voltar').then(function (sim) {
        if (!sim) return;
        rodar('excluirProfissional', px.id).then(function (r) {
          editandoProf = null;
          avisoEquipe = '🗑️ <b>' + esc(r.nome) + '</b> foi excluída da equipe.';
          return depoisDeSalvar(r.nome + ' excluída');
        }).catch(function (er) { avisoForm('#pf-aviso', msgErro(er)); });
      });
      return;
    }

    /* Acessos (Elainy, administrador, recepção) */
    if (t.closest('#acesso-novo')) { novoAcesso = true; avisoEquipe = ''; renderFormAcesso(); return; }
    var perfilBtn = t.closest('#ac-perfil [data-perfil]');
    if (perfilBtn) { $$('#ac-perfil [data-perfil]').forEach(function (b) { b.setAttribute('aria-pressed', b === perfilBtn); }); return; }
    if (t.closest('#ac-salvar')) { salvarAcesso(t.closest('#ac-salvar')); return; }
    var acSenha = t.closest('[data-ac-senha]');
    if (acSenha) { var box = $('[data-ac-box="' + acSenha.dataset.acSenha + '"]'); box.hidden = !box.hidden; if (!box.hidden) $('input', box).focus(); return; }
    var acSalvar = t.closest('[data-ac-salvar]');
    if (acSalvar) {
      var nv = $('input', acSalvar.closest('[data-ac-box]')).value;
      if (nv.length < 6) return toast('A senha precisa ter pelo menos 6 caracteres.', true);
      acSalvar.disabled = true;
      rodar('trocarSenhaAcesso', acSalvar.dataset.acSalvar, nv).then(function () {
        avisoEquipe = '✅ Senha de <b>' + esc(acSalvar.dataset.acSalvar) + '</b> trocada para <b>' + esc(nv) + '</b>. Entregue a senha nova para a pessoa.';
        renderEquipe();
      }).catch(function (er) { acSalvar.disabled = false; toast(msgErro(er), true); });
      return;
    }
    var acExcluir = t.closest('[data-ac-excluir]');
    if (acExcluir) {
      var nomeAc = acExcluir.dataset.nome;
      confirmar('Excluir o acesso de ' + nomeAc + '?', 'Isso NÃO pode ser desfeito. O login "' + acExcluir.dataset.acExcluir + '" para de funcionar na hora.', 'Sim, excluir para sempre', 'Voltar').then(function (sim) {
        if (!sim) return;
        rodar('excluirAcesso', acExcluir.dataset.acExcluir).then(function () {
          avisoEquipe = '🗑️ O acesso de <b>' + esc(nomeAc) + '</b> foi excluído.';
          return depoisDeSalvar('Acesso excluído');
        }).catch(function (er) { toast(msgErro(er), true); });
      });
      return;
    }

    /* Mensagem de boas-vindas */
    if (t.closest('#bv-copiar')) {
      var txt = $('#bv-msg').textContent;
      var feito = function () { toast('Mensagem copiada. Agora é só colar no WhatsApp dela.'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(feito, function () { selecionar($('#bv-msg')); });
      else selecionar($('#bv-msg'));
      return;
    }
  });
  $('#salao-corpo').addEventListener('change', function (e) {
    var dia = e.target.closest('[data-dia]');
    if (dia) $$('input[type=time]', dia.closest('.escala > div')).forEach(function (i) { i.disabled = !dia.checked; });
  });
  function selecionar(el) {
    var r = document.createRange(); r.selectNodeContents(el);
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    toast('Mensagem selecionada: toque em Copiar no celular (ou Ctrl+C).');
  }

  /* Equipe */
  function resumoEscala(p) {
    if (!p.escala.length) return p.escalaComDatas ? 'escala com datas (na planilha)' : 'todo o horário do salão';
    return p.escala.slice().sort(function (a, b) { return ((a.dia + 6) % 7) - ((b.dia + 6) % 7); })
      .map(function (e) { return CURTO[e.dia] + ' ' + e.ini + '–' + e.fim; }).join(' · ');
  }
  function renderEquipe() {
    var euAdm = D && D.usuario && D.usuario.perfil === 'Administrador';
    var como = '<details class="como"' + (CFG.profissionais.length <= 1 ? ' open' : '') + '><summary>Como funciona</summary><ul>' +
      '<li><b>Elainy e Administrador</b>: veem e mudam tudo (preços, equipe e senhas).</li>' +
      '<li><b>Recepção</b>: vê a agenda de todas e marca horários. Não mexe em preços nem na equipe.</li>' +
      '<li><b>Profissional</b>: entra com o login dela e vê <b>só os próprios</b> atendimentos e bloqueios.</li>' +
      '<li>Cada profissional tem uma agenda no Google Agenda. Com o <b>Gmail dela</b> cadastrado, os horários aparecem no celular dela.</li>' +
      '<li>Esqueceu a senha? Você troca aqui: <b>Editar</b> (profissional) ou <b>Trocar senha</b> (acessos).</li></ul></details>';
    var profs = CFG.profissionais.map(function (p) {
      return '<div class="pessoa"><span class="dot" style="background:' + (p.ativo ? corProf(p.id) : 'var(--line-strong)') + '"></span><div>' +
        '<b style="font-weight:500">' + esc(p.nome) + '</b>' + (p.ativo ? '' : ' <span class="tag">desativada</span>') +
        '<small>Faz: ' + esc(p.categorias.join(', ')) + '</small>' +
        '<small>Dias: ' + esc(resumoEscala(p)) + '</small>' +
        '<small>Painel: ' + (p.dona ? 'usuário <b>' + esc(p.usuario) + '</b> · acesso total' : p.usuario ? 'usuário <b>' + esc(p.usuario) + '</b> · vê só a própria agenda' : 'sem acesso') + '</small>' +
        '<small>Agenda no celular: ' + (p.gmail ? esc(p.gmail) : 'não ligada') + '</small>' +
        '</div><button class="btn btn--ghost btn--sm" type="button" data-editar-prof="' + esc(p.id) + '">Editar</button></div>';
    }).join('');
    var acessos = CFG.acessos.map(function (a) {
      var podeSenha = !a.eu && (a.perfil !== 'Dona' || euAdm), podeExcluir = !a.eu && a.perfil !== 'Dona';
      return '<div class="pessoa"><span class="dot" style="background:var(--line-strong)"></span><div><b style="font-weight:500">' + esc(a.nome) + '</b>' +
        (a.eu ? ' <span class="tag">você</span>' : '') + (a.ativo ? '' : ' <span class="tag">desativado</span>') +
        '<small>Usuário <b>' + esc(a.usuario) + '</b> · ' + esc(PERFIL_TXT[a.perfil] || a.perfil) + '</small>' +
        (a.eu ? '<small>Para a sua senha: toque no seu nome, lá em cima, e em "Trocar minha senha".</small>' : '') +
        (podeSenha ? '<div class="trocar" data-ac-box="' + esc(a.usuario) + '" hidden style="margin:8px 0 0"><input class="input" type="text" autocomplete="off" placeholder="Senha nova (mínimo 6)" aria-label="Senha nova de ' + esc(a.nome) + '"><button class="btn btn--sm" type="button" data-ac-salvar="' + esc(a.usuario) + '">Salvar</button></div>' : '') +
        '</div>' +
        (podeExcluir ? '<button class="link link--bad" type="button" data-ac-excluir="' + esc(a.usuario) + '" data-nome="' + esc(a.nome) + '">Excluir</button>' : '') +
        (podeSenha ? '<button class="btn btn--ghost btn--sm" type="button" data-ac-senha="' + esc(a.usuario) + '">Trocar senha</button>' : '') + '</div>';
    }).join('');
    $('#salao-corpo').innerHTML =
      (avisoEquipe ? '<div class="aviso aviso--ok">' + avisoEquipe + '</div>' : '') + como +
      '<div class="topo-lista"><h3 class="sec-t">Profissionais</h3><button class="btn btn--sm" type="button" id="prof-nova">+ Cadastrar profissional</button></div>' +
      '<p class="dica" style="margin:-6px 0 0">Quem atende no salão. Quem está ativa aparece no site para as clientes escolherem.</p>' + profs +
      '<div class="topo-lista" style="margin-top:10px"><h3 class="sec-t">Acessos ao painel</h3><button class="btn btn--ghost btn--sm" type="button" id="acesso-novo">+ Novo acesso</button></div>' +
      '<p class="dica" style="margin:-6px 0 0">Logins que não são de profissional: a Elainy, o administrador (computador do salão) e a recepção.</p>' + acessos;
  }

  /* Cadastro de profissional: nova = passo a passo (4 passos); editar = tudo numa tela */
  function renderFormProf() {
    var p = editandoProf, nova = !!p.nova;
    var cats = nova ? [] : p.categorias;
    var porDia = {};
    (p.escala || []).forEach(function (e) { porDia[e.dia] = e; });
    var temEscala = !nova && p.escala.length > 0;
    var secao = function (n, html) { return '<section class="passo" data-passo="' + n + '"' + (nova && n !== 1 ? ' hidden' : '') + '>' + html + '</section>'; };
    var html =
      '<div><button class="link" type="button" data-voltar-equipe style="padding-left:0">‹ Voltar para a equipe</button></div>' +
      '<h3 style="font-size:1.25rem">' + (nova ? 'Cadastrar profissional' : esc(p.nome)) + '</h3>' +
      (nova ? '<div class="passos-topo" id="pf-passos" aria-live="polite"></div>' : '') +
      secao(1,
        (nova ? '<label class="f">Nome <small>(como vai aparecer no site)</small><input class="input" id="pf-nome" maxlength="40" autocomplete="off"></label>' : '') +
        '<div><div class="rot">O que ela faz</div><div class="opcoes" id="pf-cats">' +
          ['Todas'].concat(CFG.categorias).map(function (c) { return '<button type="button" data-cat="' + esc(c) + '" aria-pressed="' + (cats.indexOf(c) >= 0) + '">' + esc(c) + '</button>'; }).join('') +
        '</div><p class="dica">O site só oferece cada serviço com quem faz aquela categoria.</p></div>') +
      secao(2,
        '<div><div class="rot">Dias e horários</div><div class="opcoes" id="pf-modo">' +
          '<button type="button" data-modo="salao" aria-pressed="' + !temEscala + '">Todo o horário do salão</button>' +
          '<button type="button" data-modo="escala" aria-pressed="' + temEscala + '">Só em alguns dias</button></div>' +
          '<div class="escala" id="pf-escala"' + (temEscala ? '' : ' hidden') + '>' + DIAS_SEMANA.map(function (d) {
            var e = porDia[d], on = !!e;
            return '<div><label class="check"><input type="checkbox" data-dia="' + d + '"' + (on ? ' checked' : '') + '> ' + CFG.dias[d] + '</label>' +
              '<input class="input" type="time" step="300" aria-label="' + CFG.dias[d] + ', das" data-ini value="' + (on ? e.ini : '08:00') + '"' + (on ? '' : ' disabled') + '>' +
              '<input class="input" type="time" step="300" aria-label="' + CFG.dias[d] + ', até" data-fim value="' + (on ? e.fim : '18:00') + '"' + (on ? '' : ' disabled') + '></div>';
          }).join('') + '</div>' +
          (p.escalaComDatas ? '<p class="dica">Ela também tem uma escala com datas ("Válido de/até") na planilha. Essa parte continua valendo e não muda por aqui.</p>' : '') +
          '<p class="dica">Férias ou folga de um dia? Não precisa mudar aqui: use <b>Bloquear</b>, no topo do painel.</p>' +
        '</div>') +
      secao(3, p.dona
        ? '<div class="bloco"><div class="bloco__t">Acesso ao painel</div><p style="margin:0">Usuário <b>' + esc(p.usuario) + '</b> · acesso total. A senha dela se troca em "Trocar minha senha" (no nome, lá em cima).</p></div>'
        : '<div class="bloco"><div class="bloco__t">Acesso ao painel' + (nova || p.usuario ? '' : ' <span style="text-transform:none;letter-spacing:0;color:var(--muted)">(opcional)</span>') + '</div>' +
          (p.usuario
            ? '<p style="margin:0 0 10px">Usuário: <b>' + esc(p.usuario) + '</b></p><div class="com-botao"><label class="f">Nova senha <small>(deixe vazio para manter a atual)</small><input class="input" id="pf-senha" type="text" autocomplete="off"></label><button class="btn btn--ghost btn--sm" type="button" data-gerar="pf-senha">Gerar senha</button></div>'
            : '<div class="linha2"><label class="f">Usuário <small>(sem espaço)</small><input class="input" id="pf-usuario" autocomplete="off" autocapitalize="none" spellcheck="false"></label>' +
              '<div class="com-botao"><label class="f">Senha <small>(mínimo 6)</small><input class="input" id="pf-senha" type="text" autocomplete="off"></label><button class="btn btn--ghost btn--sm" type="button" data-gerar="pf-senha">Gerar</button></div></div>') +
          '<p class="dica">Com esse login ela vê só a própria agenda. No final eu monto a mensagem com o link, o usuário e a senha para você mandar no WhatsApp dela.</p></div>') +
      secao(4,
        '<div class="bloco"><div class="bloco__t">Agenda no celular dela <span style="text-transform:none;letter-spacing:0;color:var(--muted)">(opcional)</span></div>' +
          '<label class="f">Gmail dela<input class="input" id="pf-gmail" type="email" inputmode="email" autocomplete="off" placeholder="nome@gmail.com" value="' + esc(p.gmail || '') + '"></label>' +
          '<p class="dica">Ela recebe um convite do Google Agenda e passa a ver os horários dela no app do celular, com aviso antes de cada cliente. Ela só vê; quem marca e desmarca é o painel.</p></div>') +
      (nova ? '' : '<label class="check"><input type="checkbox" id="pf-ativo"' + (p.ativo ? ' checked' : '') + '> Atende no salão (aparece no site)</label>') +
      '<div id="pf-aviso" aria-live="assertive"></div>' +
      '<div class="pf-botoes">' +
        (nova ? '<button class="btn btn--ghost" type="button" id="pf-ant" hidden>‹ Voltar</button><button class="btn" type="button" id="pf-prox">Próximo ›</button><button class="btn" type="button" id="pf-salvar" hidden>Cadastrar profissional</button>'
          : (p.dona ? '' : '<button class="link link--bad" type="button" id="pf-excluir" style="margin-right:auto">Excluir da equipe</button>') + '<button class="btn" type="button" id="pf-salvar">Salvar alterações</button>') +
      '</div>';
    $('#salao-corpo').innerHTML = html;
    if (nova) irPasso(p.passo || 1, true);
  }
  function irPasso(n, sem) {
    var p = editandoProf;
    if (!sem && n > p.passo) { var erro = erroPasso(p.passo); if (erro) return avisoForm('#pf-aviso', erro); }
    avisoForm('#pf-aviso', '');
    p.passo = n;
    $$('#salao-corpo .passo').forEach(function (s) { s.hidden = Number(s.dataset.passo) !== n; });
    $('#pf-passos').innerHTML = '<div class="passos-barra">' + PASSOS.map(function (_, i) { return '<span' + (i < n ? ' class="on"' : '') + '></span>'; }).join('') + '</div>' +
      '<p>Passo ' + n + ' de ' + PASSOS.length + ' · <b>' + PASSOS[n - 1] + '</b></p>';
    $('#pf-ant').hidden = n === 1;
    $('#pf-prox').hidden = n === PASSOS.length;
    $('#pf-salvar').hidden = n !== PASSOS.length;
    if (n === 3 && $('#pf-usuario') && !$('#pf-usuario').value) $('#pf-usuario').value = sugerirUsuario($('#pf-nome').value);
    if (n === 3 && $('#pf-senha') && !$('#pf-senha').value) $('#pf-senha').value = gerarSenha();
    var foco = $('#salao-corpo .passo[data-passo="' + n + '"] input:not([disabled]), #salao-corpo .passo[data-passo="' + n + '"] button');
    if (foco && !sem) foco.focus();
    if (n === 1 && $('#pf-nome')) $('#pf-nome').focus();
  }
  function lerFormProf() {
    var p = editandoProf, nova = !!p.nova;
    var cats = $$('#pf-cats [aria-pressed=true]').map(function (b) { return b.dataset.cat; });
    var porEscala = $('#pf-modo [data-modo="escala"]').getAttribute('aria-pressed') === 'true';
    return {
      linha: nova ? null : p.linha, id: nova ? '' : p.id, nome: nova ? $('#pf-nome').value.trim() : p.nome,
      todas: cats.indexOf('Todas') >= 0, categorias: cats.filter(function (c) { return c !== 'Todas'; }),
      escala: porEscala ? $$('#pf-escala [data-dia]:checked').map(function (c) {
        var linha = c.closest('.escala > div');
        return { dia: Number(c.dataset.dia), ini: $('[data-ini]', linha).value, fim: $('[data-fim]', linha).value };
      }) : null,
      usuario: $('#pf-usuario') ? $('#pf-usuario').value.trim() : '', senha: $('#pf-senha') ? $('#pf-senha').value.trim() : '',
      gmail: $('#pf-gmail').value.trim(),
      ativo: nova ? true : $('#pf-ativo').checked,
    };
  }
  function erroPasso(n) {
    var d = lerFormProf(), nova = !!editandoProf.nova;
    if (n === 1 && nova && d.nome.length < 2) return 'Escreva o nome dela.';
    if (n === 1 && !d.todas && !d.categorias.length) return 'Toque no que ela faz (pode marcar mais de um).';
    if (n === 2 && d.escala && !d.escala.length) return 'Marque pelo menos um dia de trabalho (ou escolha "Todo o horário do salão").';
    if (n === 2 && d.escala && d.escala.some(function (e) { return !e.ini || !e.fim || e.fim <= e.ini; })) return 'Confira os horários: o fim precisa ser depois do início.';
    if (n === 3 && nova && (!d.usuario || d.senha.length < 6)) return 'Crie o usuário e a senha dela (mínimo 6 letras ou números). São obrigatórios para ela entrar no painel.';
    if (n === 3 && !nova && d.senha && d.senha.length < 6) return 'A senha precisa ter pelo menos 6 letras ou números.';
    if (n === 4 && d.gmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.gmail)) return 'Confira o Gmail dela (ou deixe em branco).';
    return '';
  }
  function salvarProf(btn) {
    var p = editandoProf, nova = !!p.nova;
    for (var n = 1; n <= PASSOS.length; n++) {
      var erro = erroPasso(n);
      if (erro) { if (nova) irPasso(n, true); return avisoForm('#pf-aviso', erro); }
    }
    var d = lerFormProf();
    var rotulo = btn.textContent;
    btn.disabled = true; btn.textContent = 'Salvando…';
    rodar('salvarProfissional', d).then(function (r) {
      var avisoGmail = r.aviso ? ' ⚠️ ' + esc(r.aviso) : '';
      if (nova) {
        editandoProf = null;
        boasVindas = { nome: r.nome, usuario: r.usuario || d.usuario, senha: d.senha, perfil: 'Profissional', gmail: r.gmail, aviso: r.aviso };
      } else {
        editandoProf = null;
        avisoEquipe = '✅ Alterações de <b>' + esc(r.nome) + '</b> salvas.' +
          (d.senha ? ' Senha nova: <b>' + esc(d.senha) + '</b> (entregue para ela).' : '') +
          (r.gmail && r.gmail !== p.gmail && !r.aviso ? ' A agenda dela foi compartilhada com ' + esc(r.gmail) + '.' : '') + avisoGmail;
      }
      return depoisDeSalvar(nova ? r.nome + ' cadastrada' : 'Alterações salvas');
    }).catch(function (er) {
      btn.disabled = false; btn.textContent = rotulo;
      avisoForm('#pf-aviso', msgErro(er));
    });
  }

  /* Novo acesso (administrador ou recepção) */
  function renderFormAcesso() {
    $('#salao-corpo').innerHTML =
      '<div><button class="link" type="button" data-voltar-equipe style="padding-left:0">‹ Voltar para a equipe</button></div>' +
      '<h3 style="font-size:1.25rem">Novo acesso ao painel</h3>' +
      '<div><div class="rot">Tipo de acesso</div><div class="opcoes" id="ac-perfil">' +
        '<button type="button" data-perfil="Recepção" aria-pressed="true">Recepção<small>Vê a agenda de todas e marca horários</small></button>' +
        '<button type="button" data-perfil="Administrador" aria-pressed="false">Administrador<small>Acesso total, como a Elainy</small></button>' +
      '</div></div>' +
      '<label class="f">Nome <small>(quem vai usar, ou "Computador do salão")</small><input class="input" id="ac-nome" maxlength="40" autocomplete="off"></label>' +
      '<div class="linha2"><label class="f">Usuário <small>(sem espaço)</small><input class="input" id="ac-usuario" autocomplete="off" autocapitalize="none" spellcheck="false"></label>' +
        '<div class="com-botao"><label class="f">Senha <small>(mínimo 6)</small><input class="input" id="ac-senha" type="text" autocomplete="off"></label><button class="btn btn--ghost btn--sm" type="button" data-gerar="ac-senha">Gerar</button></div></div>' +
      '<p class="dica">Profissionais não entram aqui: cadastre em <b>+ Cadastrar profissional</b>, que já cria o login dela.</p>' +
      '<div id="ac-aviso" aria-live="assertive"></div>' +
      '<div class="pf-botoes"><button class="btn" type="button" id="ac-salvar">Criar acesso</button></div>';
    $('#ac-nome').addEventListener('input', function () { if (!$('#ac-usuario').dataset.mexeu) $('#ac-usuario').value = sugerirUsuario(this.value); });
    $('#ac-usuario').addEventListener('input', function () { this.dataset.mexeu = '1'; });
    $('#ac-senha').value = gerarSenha();
    $('#ac-nome').focus();
  }
  function salvarAcesso(btn) {
    var d = { perfil: $('#ac-perfil [aria-pressed=true]').dataset.perfil, nome: $('#ac-nome').value.trim(), usuario: $('#ac-usuario').value.trim(), senha: $('#ac-senha').value.trim() };
    var falta = d.nome.length < 2 ? 'Escreva o nome.' : !d.usuario ? 'Escreva o usuário.' : d.senha.length < 6 ? 'A senha precisa ter pelo menos 6 letras ou números.' : '';
    if (falta) return avisoForm('#ac-aviso', falta);
    btn.disabled = true;
    rodar('criarAcesso', d).then(function (r) {
      novoAcesso = false;
      boasVindas = { nome: r.nome, usuario: r.usuario, senha: d.senha, perfil: d.perfil };
      return depoisDeSalvar('Acesso criado');
    }).catch(function (er) { btn.disabled = false; avisoForm('#ac-aviso', msgErro(er)); });
  }

  /* Cartão de boas-vindas: a mensagem pronta para mandar no WhatsApp */
  function renderBoasVindas() {
    var b = boasVindas, primeiro = String(b.nome).split(' ')[0];
    var oQue = b.perfil === 'Profissional' ? 'No painel você vê os seus atendimentos, marca o andamento e bloqueia os seus horários.'
      : b.perfil === 'Administrador' ? 'Esse acesso pode tudo no painel (agenda, preços, equipe e senhas).'
      : 'No painel você vê a agenda do salão e marca os horários das clientes.';
    var msg = 'Oi, ' + primeiro + '! Este é o seu acesso ao painel do Salão Elainy Ferraz 💇‍♀️\n\n' +
      '🔗 ' + CFG.painelUrl + '\n👤 Usuário: ' + b.usuario + '\n🔑 Senha: ' + b.senha + '\n\n' + oQue +
      '\nDica: abra o link no celular e toque em "Adicionar à tela inicial".' +
      (b.gmail ? '\n\n📅 Você também vai receber um convite do Google Agenda no ' + b.gmail + '. Aceite para ver seus horários no app do celular.' : '');
    $('#salao-corpo').innerHTML =
      '<div class="boas-vindas"><h3>✅ ' + esc(b.nome) + (b.perfil === 'Profissional' ? ' foi cadastrada' : ' já tem acesso') + '</h3>' +
        '<p>Agora mande para ' + (b.perfil === 'Profissional' ? 'ela' : 'a pessoa') + ' a mensagem abaixo. Ela tem o link, o usuário e a senha.</p>' +
        (b.aviso ? '<div class="aviso aviso--warn">⚠️ ' + esc(b.aviso) + '</div>' : '') +
        '<div class="bv-msg" id="bv-msg">' + esc(msg) + '</div>' +
        '<div class="pf-botoes"><button class="btn btn--ghost" type="button" id="bv-copiar">Copiar mensagem</button>' +
          '<a class="btn btn--wa" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(msg) + '">' + ICON.wa + 'Enviar pelo WhatsApp</a>' +
          '<button class="btn" type="button" data-voltar-equipe>Concluir</button></div>' +
        '<p class="dica">Por segurança, a senha não fica guardada em lugar nenhum. Se ela perder, é só criar outra em Equipe.</p></div>';
  }

  /* ---------- bloqueio (horas, dia inteiro ou férias) ---------- */
  var tipoBloq = 'horas';
  function mudarTipoBloq(t) {
    tipoBloq = t;
    $$('#bloq-tipo [data-tipo]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.tipo === t); });
    $('#bloq-horas').hidden = t !== 'horas';
    $('#bloq-ate-box').hidden = t !== 'periodo';
    $('#bloq-data-rot').textContent = t === 'periodo' ? 'Primeiro dia fora' : 'Dia';
    $('#bloq-motivo').placeholder = t === 'periodo' ? 'Ex.: férias, licença' : t === 'dia' ? 'Ex.: folga, feriado, curso' : 'Ex.: almoço, médico, curso';
    $('#bloq-ok').textContent = t === 'periodo' ? 'Bloquear o período' : 'Bloquear';
    resumoBloq();
  }
  function resumoBloq() {
    var de = $('#bloq-data').value, ate = $('#bloq-ate').value, r = $('#bloq-resumo');
    $('#bloq-ate').min = de || '';
    if (tipoBloq !== 'periodo' || !de || !ate || ate < de) { r.hidden = true; return; }
    var dias = Math.round((parse(ate) - parse(de)) / 864e5) + 1;
    r.hidden = false;
    r.innerHTML = 'Fica fora de <b>' + dataBR(de).slice(0, 5) + '</b> a <b>' + dataBR(ate).slice(0, 5) + '</b> (' + dias + (dias === 1 ? ' dia' : ' dias') + ') e volta a atender em <b>' + extenso(somaDias(ate, 1)) + '</b>.';
  }
  $('#btn-bloq').addEventListener('click', function () {
    $('#bloq-prof').innerHTML = D.profissionais.map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.nome) + '</option>'; }).join('');
    $('#form-bloq').reset();
    if (filtroProf !== 'todas') $('#bloq-prof').value = filtroProf;
    $('#bloq-data').value = D.data < D.hoje ? D.hoje : D.data;
    $('#bloq-aviso').innerHTML = '';
    mudarTipoBloq('horas');
    $('#dlg-bloq').showModal();
  });
  $('#bloq-tipo').addEventListener('click', function (e) { var b = e.target.closest('[data-tipo]'); if (b) mudarTipoBloq(b.dataset.tipo); });
  $('#form-bloq').addEventListener('input', function () { $('#bloq-aviso').innerHTML = ''; resumoBloq(); });
  $('#form-bloq').addEventListener('submit', function (e) {
    e.preventDefault();
    var dados = { prof: $('#bloq-prof').value, tipo: tipoBloq, data: $('#bloq-data').value, ate: $('#bloq-ate').value, ini: $('#bloq-ini').value, fim: $('#bloq-fim').value, motivo: $('#bloq-motivo').value };
    var falta = !dados.data ? 'Informe o dia.'
      : tipoBloq === 'periodo' && !dados.ate ? 'Informe o último dia fora.'
      : tipoBloq === 'periodo' && dados.ate < dados.data ? 'O último dia precisa ser depois do primeiro.'
      : tipoBloq === 'horas' && (!dados.ini || !dados.fim) ? 'Informe o horário de início e de fim.'
      : tipoBloq === 'horas' && dados.fim <= dados.ini ? 'O fim precisa ser depois do início.' : '';
    if (falta) { $('#bloq-aviso').innerHTML = '<div class="aviso aviso--erro">' + esc(falta) + '</div>'; return; }
    $('#bloq-ok').disabled = true;
    rodar('criarBloqueio', dados).then(function () {
      $('#bloq-ok').disabled = false;
      $('#dlg-bloq').close();
      var nome = (prof(dados.prof) || {}).nome || '';
      toast(tipoBloq === 'periodo' ? 'Agenda de ' + nome + ' bloqueada de ' + dataBR(dados.data).slice(0, 5) + ' a ' + dataBR(dados.ate).slice(0, 5) : 'Horário bloqueado');
      delete MESES_MEM[dados.data.slice(0, 7)];
      if (dados.ate) delete MESES_MEM[dados.ate.slice(0, 7)];
      carregar(dados.data);
    }).catch(function (er) {
      $('#bloq-ok').disabled = false;
      $('#bloq-aviso').innerHTML = '<div class="aviso aviso--erro">⛔ ' + esc(msgErro(er)) + '</div>';
    });
  });

  /* ---------- calendário do mês (quantas clientes em cada dia) ---------- */
  var MESES_MEM = {}, mesVisto = '';
  function nivel(n) { return n >= 8 ? 3 : n >= 4 ? 2 : 1; }
  function abrirMes() {
    if (!D) return;
    mesVisto = (dataAtual || D.hoje).slice(0, 7);
    renderMes();
    $('#dlg-mes').showModal();
    var sel = $('#mes-grade [aria-current="date"]') || $('#mes-grade .mes__dia:not(.fora)');
    if (sel) sel.focus();
  }
  function renderMes() {
    var info = MESES_MEM[mesVisto], p = mesVisto.split('-').map(Number);
    var nome = MESES[p[1] - 1];
    $('#mes-h').textContent = nome.charAt(0).toUpperCase() + nome.slice(1) + ' de ' + p[0];
    var vazios = (new Date(p[0], p[1] - 1, 1, 12).getDay() + 6) % 7, nDias = new Date(p[0], p[1], 0).getDate();
    var html = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'].map(function (d) { return '<div class="mes__sem" aria-hidden="true">' + d + '</div>'; }).join('');
    for (var i = 0; i < vazios; i++) html += '<span class="mes__dia fora" aria-hidden="true"></span>';
    var total = 0;
    for (var dia = 1; dia <= nDias; dia++) {
      var iso = mesVisto + '-' + String(dia).padStart(2, '0');
      var n = info ? info.dias[iso] || 0 : null, bloq = info && info.bloqueados[iso];
      total += n || 0;
      var cls = 'mes__dia' + (iso === D.hoje ? ' hoje' : '') + (iso < D.hoje ? ' passado' : '');
      var rotulo = extenso(iso) + ': ' + (n === null ? 'carregando' : n ? n + (n === 1 ? ' cliente' : ' clientes') : 'nenhuma cliente') + (bloq ? '. Bloqueio: ' + bloq.join(', ') : '');
      html += '<button type="button" class="' + cls + '" data-dia="' + iso + '"' + (iso === dataAtual ? ' aria-current="date"' : '') + ' aria-label="' + esc(rotulo) + '" title="' + esc(rotulo) + '">' +
        '<b>' + dia + '</b>' +
        (n === null ? '<span class="mes__vazio">…</span>' : n ? '<span class="mes__qtd n' + nivel(n) + '">' + n + '</span>' : '<span class="mes__vazio">–</span>') +
        (bloq ? '<i class="mes__bloq" aria-hidden="true">' + ICON.lock + '</i>' : '') + '</button>';
    }
    $('#mes-grade').innerHTML = html;
    var minha = D.usuario && D.usuario.perfil === 'Profissional';
    $('#mes-legenda').innerHTML = info
      ? (minha ? 'Você tem ' : '') + '<b>' + total + (total === 1 ? ' cliente' : ' clientes') + '</b> em ' + nome + ' (sem contar cancelados). O número embaixo de cada dia é quantas clientes estão marcadas; o cadeado mostra folga ou férias de alguém. Toque no dia para abrir.'
      : 'Carregando o mês…';
    if (!info) {
      var pedido = mesVisto;
      rodar('contagemMes', pedido).then(function (m) {
        MESES_MEM[m.mes] = m;
        if (mesVisto === pedido && $('#dlg-mes').open) renderMes();
      }).catch(function (e) { if (mesVisto === pedido) $('#mes-legenda').textContent = 'Não consegui carregar: ' + msgErro(e); });
    }
  }
  function mudarMes(n) {
    var p = mesVisto.split('-').map(Number), d = new Date(p[0], p[1] - 1 + n, 1, 12);
    mesVisto = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    renderMes();
  }
  $('#btn-mes').addEventListener('click', abrirMes);
  $('#dia-label').addEventListener('click', abrirMes);
  $('#mes-ant').addEventListener('click', function () { mudarMes(-1); });
  $('#mes-prox').addEventListener('click', function () { mudarMes(1); });
  $('#mes-hoje').addEventListener('click', function () { $('#dlg-mes').close(); carregar(D.hoje); });
  $('#mes-grade').addEventListener('click', function (e) {
    var b = e.target.closest('[data-dia]'); if (!b) return;
    $('#dlg-mes').close();
    carregar(b.dataset.dia);
  });
  // No calendário, as setas andam pelos dias
  $('#mes-grade').addEventListener('keydown', function (e) {
    var b = e.target.closest('[data-dia]'); if (!b) return;
    var passo = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (!passo) return;
    e.preventDefault();
    var alvo = somaDias(b.dataset.dia, passo);
    if (alvo.slice(0, 7) !== mesVisto) mudarMes(passo > 0 ? 1 : -1);
    var novo = $('#mes-grade [data-dia="' + alvo + '"]'); if (novo) novo.focus();
  });

  /* ---------- minha conta: trocar a senha e sair ---------- */
  function fecharMenu() { $('#quem-menu').hidden = true; $('#quem-btn').setAttribute('aria-expanded', 'false'); }
  $('#quem-btn').addEventListener('click', function (e) {
    e.stopPropagation();
    var abrir = $('#quem-menu').hidden;
    $('#quem-menu').hidden = !abrir; this.setAttribute('aria-expanded', abrir);
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.quem')) fecharMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fecharMenu(); });
  $('#minha-senha').addEventListener('click', function () {
    fecharMenu();
    $('#form-senha').reset(); $('#ms-aviso').innerHTML = '';
    $('#dlg-senha').showModal(); $('#ms-atual').focus();
  });
  $('#form-senha').addEventListener('submit', function (e) {
    e.preventDefault();
    var atual = $('#ms-atual').value, nova = $('#ms-nova').value;
    var falta = !atual ? 'Digite a sua senha atual.' : nova.length < 6 ? 'A senha nova precisa ter pelo menos 6 letras ou números.' : nova !== $('#ms-nova2').value ? 'As duas senhas novas não são iguais.' : '';
    if (falta) { $('#ms-aviso').innerHTML = '<div class="aviso aviso--erro">' + esc(falta) + '</div>'; return; }
    var bt = $('#ms-salvar'); bt.disabled = true;
    rodar('trocarMinhaSenha', atual, nova).then(function () {
      $('#dlg-senha').close();
      toast('Senha trocada. Nos outros aparelhos, o painel vai pedir para entrar de novo.');
    }).catch(function (er) { $('#ms-aviso').innerHTML = '<div class="aviso aviso--erro">' + esc(msgErro(er)) + '</div>'; })
      .then(function () { bt.disabled = false; });
  });

  /* ---------- confirmação ---------- */
  function confirmar(titulo, texto, sim, nao) {
    $('#conf-titulo').textContent = titulo; $('#conf-texto').textContent = texto;
    $('#conf-sim').textContent = sim; $('#conf-nao').textContent = nao;
    var dlg = $('#dlg-conf'); dlg.showModal();
    return new Promise(function (ok) {
      function fim(v) { $('#conf-sim').onclick = $('#conf-nao').onclick = null; dlg.removeEventListener('close', fechou); dlg.close(); ok(v); }
      function fechou() { fim(false); }
      $('#conf-sim').onclick = function () { fim(true); };
      $('#conf-nao').onclick = function () { fim(false); };
      dlg.addEventListener('close', fechou);
    });
  }

  /* ---------- navegação de datas ---------- */
  $('#ant').addEventListener('click', function () { carregar(somaDias(dataAtual, -1)); });
  $('#prox').addEventListener('click', function () { carregar(somaDias(dataAtual, 1)); });
  $('#hoje').addEventListener('click', function () { carregar(D ? D.hoje : ''); });
  document.addEventListener('keydown', function (e) {
    if (document.querySelector('dialog[open]') || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === 'ArrowLeft') $('#ant').click();
    if (e.key === 'ArrowRight') $('#prox').click();
  });

  // Atualiza sozinho a cada minuto — mas nunca com uma janela aberta (para não apagar o que está sendo digitado)
  setInterval(function () {
    if (TOKEN && !document.hidden && !document.querySelector('dialog[open]')) carregar(null, true);
  }, 60000);

  if (TOKEN) {
    document.body.classList.remove('deslogado');
    // Mostra na hora o dia de hoje guardado neste aparelho (se for mesmo de hoje) e atualiza em seguida
    var guardado = lerDiaGuardado();
    if (guardado && guardado.data === iso(new Date()) && guardado.hoje === guardado.data) { guardarNaMemoria(guardado); DIAS_MEM[guardado.data].t = 0; }
    carregar(guardado && DIAS_MEM[guardado.data] ? guardado.data : '');
  } else mostrarLogin('');
})();
