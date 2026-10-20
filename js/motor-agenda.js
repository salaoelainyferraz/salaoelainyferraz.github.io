/**
 * MOTOR DE AGENDA — regras de horário livre
 * ------------------------------------------------------------------
 * Este MESMO arquivo é usado em dois lugares:
 *   1. no site (site/js/motor-agenda.js), para o modo demonstração;
 *   2. no Apps Script (copiado como arquivo "MotorAgenda"), para a agenda real.
 * Se mudar uma regra aqui, copie de novo para o Apps Script.
 *
 * Tudo é calculado em MINUTOS do dia (ex.: 08:30 = 510), sem datas/fuso,
 * para ser simples de testar.
 */
var MotorAgenda = (function () {
  function toMin(hhmm) {
    if (!hhmm) return null;
    var p = String(hhmm).split(':');
    return Number(p[0]) * 60 + Number(p[1] || 0);
  }

  function toHHMM(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function atende(prof, servico) {
    return prof.categorias.indexOf('*') >= 0 || prof.categorias.indexOf(servico.categoria) >= 0;
  }

  /** Janelas de trabalho de uma profissional no dia: expediente do salão ∩ escala dela − pausa. */
  function janelasDoDia(prof, ctx) {
    var h = ctx.horarioSalao;
    if (!h || !h.abre || !h.fecha) return [];
    var abre = toMin(h.abre), fecha = toMin(h.fecha);
    var base = [[abre, fecha]];
    var pi = toMin(h.pausaIni), pf = toMin(h.pausaFim);
    if (pi !== null && pf !== null && pf > pi) base = [[abre, Math.min(pi, fecha)], [Math.max(pf, abre), fecha]];
    base = base.filter(function (j) { return j[1] > j[0]; });

    var escala = ctx.escalas ? ctx.escalas[prof.id] : undefined;
    if (escala === undefined) return base; // sem escala cadastrada = segue o horário do salão
    var out = [];
    escala.forEach(function (e) {
      base.forEach(function (b) {
        var ini = Math.max(e[0], b[0]), fim = Math.min(e[1], b[1]);
        if (fim > ini) out.push([ini, fim]);
      });
    });
    return out;
  }

  function permutacoes(arr) {
    if (arr.length <= 1) return [arr.slice()];
    var out = [];
    arr.forEach(function (x, i) {
      var resto = arr.slice(0, i).concat(arr.slice(i + 1));
      permutacoes(resto).forEach(function (p) { out.push([x].concat(p)); });
    });
    return out;
  }

  /**
   * Calcula os horários de início possíveis num dia.
   * ctx = {
   *   servicos:      [{id, nome, categoria, duracao}] na ordem escolhida pela cliente
   *   prefs:         {servicoId: profId | 'qualquer'}  (opcional)
   *   profissionais: [{id, nome, categorias:['Cabelo'] ou ['*']}]
   *   horarioSalao:  {abre:'08:00', fecha:'18:00', pausaIni, pausaFim} ou null (fechado)
   *   escalas:       {profId: [[iniMin, fimMin], ...]}  só para quem tem escala (opcional)
   *   ocupados:      {profId: [[iniMin, fimMin], ...]}  eventos já na agenda
   *   passo:         30   (minutos entre horários)
   *   minimo:        minuto mais cedo permitido (antecedência), ou -Infinity
   * }
   * Retorna { 'HH:MM': [{servicoId, servico, profId, prof, ini:'HH:MM', fim:'HH:MM'}] }
   */
  function planejarDia(ctx) {
    var servicos = ctx.servicos;
    var prefs = ctx.prefs || {};
    var resultado = {};
    if (!servicos.length || !ctx.horarioSalao) return resultado;

    // Quem pode fazer cada serviço
    var candidatos = {};
    for (var i = 0; i < servicos.length; i++) {
      var s = servicos[i];
      var pref = prefs[s.id];
      candidatos[s.id] = ctx.profissionais.filter(function (p) {
        return atende(p, s) && (!pref || pref === 'qualquer' || pref === p.id);
      });
      if (!candidatos[s.id].length) return resultado; // ninguém faz esse serviço
    }

    var janelas = {};
    ctx.profissionais.forEach(function (p) { janelas[p.id] = janelasDoDia(p, ctx); });

    function livre(profId, a, b) {
      var dentro = janelas[profId].some(function (j) { return a >= j[0] && b <= j[1]; });
      if (!dentro) return false;
      var occ = (ctx.ocupados && ctx.ocupados[profId]) || [];
      return !occ.some(function (o) { return a < o[1] && b > o[0]; });
    }

    // Ordem escolhida primeiro; se não couber, tenta outras ordens (até 5 serviços).
    var ordens = servicos.length <= 5 ? permutacoes(servicos) : [servicos];

    var abre = toMin(ctx.horarioSalao.abre), fecha = toMin(ctx.horarioSalao.fecha);
    var passo = ctx.passo || 30;
    var minimo = ctx.minimo === undefined ? -Infinity : ctx.minimo;
    var total = servicos.reduce(function (a, x) { return a + x.duracao; }, 0);

    for (var t = abre; t + total <= fecha; t += passo) {
      if (t < minimo) continue;
      for (var o = 0; o < ordens.length; o++) {
        var plano = [], cursor = t, ok = true, anterior = null;
        for (var k = 0; k < ordens[o].length; k++) {
          var sv = ordens[o][k], fim = cursor + sv.duracao;
          var cands = candidatos[sv.id];
          // Prefere continuar com a mesma profissional (menos troca de cadeira)
          var escolhida = null;
          if (anterior && cands.some(function (p) { return p.id === anterior.id; }) && livre(anterior.id, cursor, fim)) escolhida = anterior;
          if (!escolhida) {
            for (var c = 0; c < cands.length; c++) {
              if (livre(cands[c].id, cursor, fim)) { escolhida = cands[c]; break; }
            }
          }
          if (!escolhida) { ok = false; break; }
          plano.push({ servicoId: sv.id, servico: sv.nome, profId: escolhida.id, prof: escolhida.nome, ini: toHHMM(cursor), fim: toHHMM(fim) });
          anterior = escolhida;
          cursor = fim;
        }
        if (ok) { resultado[toHHMM(t)] = plano; break; }
      }
    }
    return resultado;
  }

  return { planejarDia: planejarDia, janelasDoDia: janelasDoDia, toMin: toMin, toHHMM: toHHMM, atende: atende };
})();
