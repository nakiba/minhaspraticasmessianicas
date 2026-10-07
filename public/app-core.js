// Núcleo do Diário de Práticas Messiânicas (formatação, dados e agregação).
// Usado pelo app e pelos testes unitários.
(function (root) {
  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function toIsoLocal(d) {
    if (!d || !Number.isFinite(d.getTime())) return '';
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  const core = {
    MESES: ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'],
    MESES_CURTO: ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'],
    DIAS_SEMANA: ['domingo','segunda','terça','quarta','quinta','sexta','sábado'],
    CULTO_ITEMS_BASE: [
      {key:'solo_guarapiranga', label:'Culto Mensal de Agradecimento do Solo Sagrado de Guarapiranga'},
      {key:'igreja', label:'Culto Mensal de Agradecimento da Igreja'},
      {key:'johrei_center', label:'Culto Mensal de Agradecimento do Johrei Center'},
      {key:'oracao_paraiso_lar', label:'Oração Pela Construção do Paraíso no Lar'}
    ],
    CULTO_ITEMS_ESPECIAIS_POR_MES: {
      6: [
        {key:'paraiso_terrestre_solo', label:'Culto do Paraíso Terrestre — Solo Sagrado de Guarapiranga'},
        {key:'paraiso_terrestre_johrei_center', label:'Culto do Paraíso Terrestre — Johrei Center'}
      ],
      11: [
        {key:'almas_antepassados_solo', label:'Culto às Almas dos Antepassados — Solo Sagrado de Guarapiranga'},
        {key:'almas_antepassados_johrei_center', label:'Culto às Almas dos Antepassados — Johrei Center'}
      ],
      12: [
        {key:'natalicio_meishu_solo', label:'Culto do Natalício de Meishu-Sama — Solo Sagrado de Guarapiranga'},
        {key:'natalicio_meishu_johrei_center', label:'Culto do Natalício de Meishu-Sama — Johrei Center'}
      ]
    },

    isMonthKey: function (monthKey) {
      return /^\d{4}-\d{2}$/.test(monthKey || '');
    },

    todayISO: function (now) {
      const d = now ? new Date(now) : new Date();
      const off = d.getTimezoneOffset();
      const local = new Date(d.getTime() - off * 60000);
      return local.toISOString().slice(0, 10);
    },

    fmtDateBR: function (dt) {
      if (!dt) return '';
      const parts = String(dt).split('-');
      if (parts.length < 3) return '';
      return parts[2] + '/' + parts[1] + '/' + parts[0];
    },

    parseDateBR: function (str) {
      const match = String(str || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (!match) return '';
      const d = parseInt(match[1], 10);
      const mo = parseInt(match[2], 10);
      const y = parseInt(match[3], 10);
      const dt = new Date(y, mo - 1, d);
      if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return '';
      return y + '-' + pad2(mo) + '-' + pad2(d);
    },

    maskDateBR: function (raw) {
      const digits = String(raw || '').replace(/\D/g, '').slice(0, 8);
      if (digits.length <= 2) return digits;
      if (digits.length <= 4) return digits.slice(0, 2) + '/' + digits.slice(2);
      return digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
    },

    fmtMonthBR: function (ym) {
      if (!ym) return '';
      const parts = String(ym).split('-');
      if (parts.length < 2) return '';
      return parts[1] + '/' + parts[0];
    },

    parseMonthBR: function (str) {
      const match = String(str || '').trim().match(/^(\d{1,2})\/(\d{4})$/);
      if (!match) return '';
      const mo = parseInt(match[1], 10);
      const y = parseInt(match[2], 10);
      if (mo < 1 || mo > 12) return '';
      return y + '-' + pad2(mo);
    },

    maskMonthBR: function (raw) {
      const digits = String(raw || '').replace(/\D/g, '').slice(0, 6);
      if (digits.length <= 2) return digits;
      return digits.slice(0, 2) + '/' + digits.slice(2);
    },

    fmtDateShort: function (dt) {
      if (!dt) return '';
      const parts = String(dt).split('-');
      if (parts.length < 3) return '';
      return parts[2] + '/' + parts[1];
    },

    fmtDateLong: function (iso) {
      const parts = String(iso || '').split('-').map(Number);
      const y = parts[0], m = parts[1], d = parts[2];
      if (!y || !m || !d) return '';
      const dt = new Date(y, m - 1, d);
      const wd = core.DIAS_SEMANA[dt.getDay()];
      const weekday = (wd === 'domingo' || wd === 'sábado') ? wd : wd + '-feira';
      const raw = weekday + ', ' + d + ' de ' + core.MESES[m - 1] + ' de ' + y;
      return raw.charAt(0).toUpperCase() + raw.slice(1);
    },

    shiftIsoDate: function (iso, days) {
      const d = new Date(iso + 'T00:00:00');
      if (!Number.isFinite(d.getTime())) return '';
      d.setDate(d.getDate() + (Number(days) || 0));
      return d.toISOString().slice(0, 10);
    },

    getWeekStart: function (dt) {
      const d = new Date(dt + 'T00:00:00');
      if (!Number.isFinite(d.getTime())) return '';
      const day = d.getDay();
      const diff = (day === 0 ? -6 : 1) - day;
      d.setDate(d.getDate() + diff);
      return d.toISOString().slice(0, 10);
    },

    getWeekEnd: function (weekStart) {
      const d = new Date(weekStart + 'T00:00:00');
      if (!Number.isFinite(d.getTime())) return '';
      d.setDate(d.getDate() + 6);
      return d.toISOString().slice(0, 10);
    },

    fmtMin: function (min) {
      const n = Number(min) || 0;
      if (n >= 60) {
        const h = Math.floor(n / 60);
        const r = n % 60;
        return r ? h + 'h ' + r + 'min' : h + 'h';
      }
      return n + ' min';
    },

    fmtHMS: function (totalSeconds) {
      const sec = Math.max(0, Number(totalSeconds) || 0);
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = sec % 60;
      return pad2(h) + ':' + pad2(m) + ':' + pad2(s);
    },

    fmtBRL: function (n) {
      return 'R$ ' + (Number(n) || 0).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
    },

    fmtPct: function (n) {
      const num = Number(n) || 0;
      return num.toLocaleString('pt-BR', {maximumFractionDigits:2, minimumFractionDigits:0}) + '%';
    },

    escapeHtml: function (str) {
      return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    parseJsonSafe: function (raw, fallback) {
      if (!raw) return fallback;
      try {
        return JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    },

    formatCurrencyValue: function (raw) {
      let digits = String(raw || '').replace(/\D/g, '');
      if (digits === '') digits = '0';
      while (digits.length < 3) digits = '0' + digits;
      digits = digits.replace(/^0+(?=\d)/, '');
      while (digits.length < 3) digits = '0' + digits;
      const cents = digits.slice(-2);
      let reais = digits.slice(0, -2).replace(/^0+(?=\d)/, '');
      reais = reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return 'R$ ' + reais + ',' + cents;
    },

    parseCurrencyValue: function (raw) {
      const digits = String(raw || '').replace(/\D/g, '');
      if (digits === '') return 0;
      return parseInt(digits, 10) / 100;
    },

    parsePercentual: function (raw) {
      const valor = parseFloat(String(raw || '').replace(',', '.'));
      if (!Number.isFinite(valor) || valor <= 0 || valor > 100) return null;
      return valor;
    },

    donUnidade: function (don) {
      return don && don.unidade === 'percentual' ? 'percentual' : 'valor';
    },

    fmtDonValor: function (don) {
      if (core.donUnidade(don) === 'percentual') return core.fmtPct(don && don.valor);
      return core.fmtBRL(don && don.valor);
    },

    sumDonativosPorUnidade: function (donativos, unidade) {
      return (donativos || []).filter(function (d) {
        return core.donUnidade(d) === unidade;
      }).reduce(function (s, x) {
        return s + (Number(x.valor) || 0);
      }, 0);
    },

    fmtServirResumo: function (donValor, donPct, preferUnidade) {
      const parts = [];
      if (donValor) parts.push(core.fmtBRL(donValor));
      if (donPct) parts.push(core.fmtPct(donPct));
      if (parts.length) return parts.join(' · ');
      return preferUnidade === 'percentual' ? core.fmtPct(0) : core.fmtBRL(0);
    },

    blankGoal: function () {
      return {
        ministrado: 0,
        recebido: 0,
        leituraDia: 0,
        encaminhamentos: 0,
        outorgas: 0,
        servir: 0,
        servirTempoMetas: [],
        servirTipoMeta: 'valor',
        servirMetaPercentual: 0,
        servirMensalChecked: false,
        servirMensalOpened: false
      };
    },

    ensureGoal: function (goalsData, monthKey) {
      if (!core.isMonthKey(monthKey)) return core.blankGoal();
      if (!goalsData[monthKey]) goalsData[monthKey] = core.blankGoal();
      const g = goalsData[monthKey];
      g.ministrado = g.ministrado || 0;
      g.recebido = g.recebido || 0;
      g.leituraDia = g.leituraDia || 0;
      g.encaminhamentos = g.encaminhamentos || 0;
      g.outorgas = g.outorgas || 0;
      g.servir = g.servir || 0;
      g.servirTempoMetas = g.servirTempoMetas || [];
      g.servirTipoMeta = g.servirTipoMeta === 'percentual' ? 'percentual' : 'valor';
      g.servirMetaPercentual = g.servirMetaPercentual || 0;
      g.servirMensalChecked = !!g.servirMensalChecked;
      g.servirMensalOpened = !!g.servirMensalOpened;
      return g;
    },

    peekGoal: function (goalsData, monthKey) {
      return goalsData && goalsData[monthKey] ? goalsData[monthKey] : core.blankGoal();
    },

    goalHasAnyValue: function (g) {
      if (!g) return false;
      return (g.ministrado || 0) + (g.recebido || 0) + (g.leituraDia || 0) + (g.encaminhamentos || 0) + (g.outorgas || 0) + (g.servir || 0) + (g.servirMetaPercentual || 0) > 0 || (g.servirTempoMetas && g.servirTempoMetas.length > 0);
    },

    blankDay: function () {
      return {
        johrei: {ministrado:0, recebido:0, auto:0},
        leitura: 0,
        enc: {encaminhamentos:0, outorgas:0},
        donativos: [],
        servirTempo: [],
        anotacao: ''
      };
    },

    normalizeDay: function (d) {
      if (!d || typeof d !== 'object') return core.blankDay();
      d.johrei = d.johrei || {ministrado:0, recebido:0, auto:0};
      d.enc = d.enc || {encaminhamentos:0, outorgas:0};
      d.donativos = d.donativos || [];
      d.servirTempo = d.servirTempo || [];
      if (typeof d.leitura !== 'number') d.leitura = 0;
      if (typeof d.anotacao !== 'string') d.anotacao = '';
      return d;
    },

    snapshotDay: function (day) {
      const d = core.normalizeDay(day);
      return {
        johrei: {ministrado: d.johrei.ministrado, recebido: d.johrei.recebido, auto: d.johrei.auto},
        enc: {encaminhamentos: d.enc.encaminhamentos, outorgas: d.enc.outorgas},
        leitura: d.leitura,
        donativos: d.donativos.map(function (x) { return Object.assign({}, x); }),
        servirTempo: d.servirTempo.map(function (e) { return Object.assign({}, e); }),
        anotacao: d.anotacao
      };
    },

    restoreDaySnap: function (day, snap) {
      const d = core.normalizeDay(day);
      d.johrei.ministrado = snap.johrei.ministrado;
      d.johrei.recebido = snap.johrei.recebido;
      d.johrei.auto = snap.johrei.auto;
      d.enc.encaminhamentos = snap.enc.encaminhamentos;
      d.enc.outorgas = snap.enc.outorgas;
      d.leitura = snap.leitura;
      d.donativos = snap.donativos.map(function (x) { return Object.assign({}, x); });
      d.servirTempo = snap.servirTempo.map(function (e) { return Object.assign({}, e); });
      d.anotacao = snap.anotacao;
      return d;
    },

    dayHasRecord: function (d) {
      if (!d) return false;
      const hasJohrei = d.johrei && (d.johrei.ministrado || d.johrei.recebido || d.johrei.auto);
      const hasEnc = d.enc && (d.enc.encaminhamentos || d.enc.outorgas);
      return !!(hasJohrei || hasEnc || d.leitura || (d.donativos && d.donativos.length) || (d.servirTempo && d.servirTempo.length));
    },

    servirTempoContavel: function (entry) {
      if (entry && entry.tipo === 'Prática Específica' && typeof entry.concluida === 'boolean') {
        return entry.concluida === true;
      }
      return true;
    },

    buildPraticaBreakdown: function (entries) {
      const map = {};
      (entries || []).forEach(function (entry) {
        if (entry.tipo === 'Prática Específica') {
          const key = entry.descricao || '(sem descrição)';
          if (!map[key]) map[key] = {minutos:0, vezes:0};
          if (entry.minutos > 0) map[key].minutos += entry.minutos;
          else map[key].vezes += 1;
        }
      });
      return map;
    },

    mergePraticaBreakdown: function (target, source) {
      const out = target || {};
      Object.keys(source || {}).forEach(function (k) {
        if (!out[k]) out[k] = {minutos:0, vezes:0};
        out[k].minutos += source[k].minutos;
        out[k].vezes += source[k].vezes;
      });
      return out;
    },

    aggregate: function (dates, keyFn, getDay) {
      const groups = {};
      (dates || []).forEach(function (dt) {
        const key = keyFn(dt);
        if (!groups[key]) {
          groups[key] = {
            johrei:{ministrado:0,recebido:0,auto:0},
            leitura:0,
            enc:{encaminhamentos:0,outorgas:0},
            donTotal:0,
            donPct:0,
            servirTempoTotal:0,
            praticaBreakdown:{},
            dias:0
          };
        }
        const d = getDay(dt);
        const g = groups[key];
        g.johrei.ministrado += d.johrei.ministrado;
        g.johrei.recebido += d.johrei.recebido;
        g.johrei.auto += d.johrei.auto;
        g.leitura += d.leitura;
        g.enc.encaminhamentos += d.enc.encaminhamentos;
        g.enc.outorgas += d.enc.outorgas;
        g.donTotal += core.sumDonativosPorUnidade(d.donativos, 'valor');
        g.donPct += core.sumDonativosPorUnidade(d.donativos, 'percentual');
        const contaveis = (d.servirTempo || []).filter(core.servirTempoContavel);
        g.servirTempoTotal += contaveis.reduce(function (s, x) { return s + x.minutos; }, 0);
        core.mergePraticaBreakdown(g.praticaBreakdown, core.buildPraticaBreakdown(contaveis));
        g.dias += 1;
      });
      return groups;
    },

    getCultoItemsForMonth: function (monthKey) {
      const mm = parseInt(String(monthKey || '').split('-')[1], 10);
      const items = core.CULTO_ITEMS_BASE.slice();
      if (core.CULTO_ITEMS_ESPECIAIS_POR_MES[mm]) {
        items.push.apply(items, core.CULTO_ITEMS_ESPECIAIS_POR_MES[mm]);
      }
      return items;
    },

    cultoStatsForMonth: function (monthKey, state) {
      const items = core.getCultoItemsForMonth(monthKey);
      const st = state || {};
      const done = items.filter(function (it) { return st[it.key]; }).length;
      return { done: done, total: core.CULTO_META_MES };
    },

    cultoStatsForYear: function (yearKey, cultosData) {
      let done = 0, total = 0;
      for (let m = 1; m <= 12; m++) {
        const mk = yearKey + '-' + pad2(m);
        const s = core.cultoStatsForMonth(mk, cultosData && cultosData[mk]);
        done += s.done;
        total += s.total;
      }
      return { done: done, total: total };
    },

    metaStLabel: function (m) {
      return m && m.tipo === 'Prática Específica' ? 'Prática Específica — ' + m.descricao : (m && m.tipo) || '';
    },

    metaStValorLabel: function (m) {
      if (!m) return '';
      return m.unidade === 'vezes' ? m.vezes + ' vezes' : core.fmtMin(m.minutos);
    },

    realizadoParaMetaSt: function (entries, meta, tiposAceitos) {
      const tipos = Array.isArray(tiposAceitos)
        ? tiposAceitos
        : (meta && meta.tipo ? [meta.tipo] : []);
      let minutos = 0, vezes = 0;
      (entries || []).forEach(function (entry) {
        const tipoMatch = tipos.indexOf(entry.tipo) >= 0;
        const descMatch = !meta || meta.tipo !== 'Prática Específica' || (entry.descricao || '') === (meta.descricao || '');
        if (tipoMatch && descMatch) {
          minutos += entry.minutos || 0;
          vezes += 1;
        }
      });
      return { minutos: minutos, vezes: vezes };
    },

    progressPct: function (realizado, meta) {
      const m = Number(meta) || 0;
      if (m <= 0) return 0;
      return Math.min(100, Math.round((Number(realizado) || 0) / m * 100));
    },

    chartLinePoints: function (values, max, padX, step, zeroY, innerH) {
      return (values || []).map(function (v, i) {
        const x = padX + i * step;
        const y = max > 0 ? zeroY - (Number(v) || 0) / max * innerH : zeroY;
        return {x: x, y: y, v: Number(v) || 0};
      });
    },

    yearChartPeak: function (actual, goals, fmt, meses) {
      const names = meses || core.MESES;
      let aMax = 0, aIdx = -1;
      (actual || []).forEach(function (v, i) {
        if (v > aMax) { aMax = v; aIdx = i; }
      });
      const gMax = Math.max(0, ...(goals && goals.length ? goals : [0]));
      const parts = [];
      if (aMax > 0 && aIdx >= 0) parts.push('realizado máx. ' + fmt(aMax) + ' em ' + names[aIdx]);
      if (gMax > 0) parts.push('meta ' + fmt(gMax));
      return parts.join(' · ') || 'sem registro';
    },

    datesInRange: function (dates, start, end) {
      return (dates || []).filter(function (dt) {
        return dt >= start && dt <= end;
      });
    },

    periodEndInclusive: function (endExclusive) {
      const d = new Date(endExclusive + 'T00:00:00');
      if (!Number.isFinite(d.getTime())) return '';
      d.setDate(d.getDate() - 1);
      return toIsoLocal(d);
    },

    daysBetweenInclusive: function (startIso, endIso) {
      const a = new Date(startIso + 'T00:00:00');
      const b = new Date(endIso + 'T00:00:00');
      if (!Number.isFinite(a.getTime()) || !Number.isFinite(b.getTime()) || endIso < startIso) return 0;
      return Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
    },

    daysSinceMs: function (thenMs, nowMs) {
      const t = Number(thenMs);
      if (!t) return null;
      return Math.floor(((nowMs || Date.now()) - t) / 86400000);
    },

    daysSince: function (isoDate, todayIso) {
      if (!isoDate) return null;
      const then = new Date(isoDate + 'T00:00:00');
      const now = new Date(todayIso + 'T00:00:00');
      if (!Number.isFinite(then.getTime()) || !Number.isFinite(now.getTime())) return null;
      return Math.floor((now.getTime() - then.getTime()) / 86400000);
    },

    normalizeTab: function (tab) {
      if (tab !== 'diario' && tab !== 'objetivos' && tab !== 'mais') return 'diario';
      return tab;
    },

    mergeBackup: function (current, incoming) {
      const out = Object.assign({}, current);
      Object.keys(incoming || {}).forEach(function (key) {
        out[key] = incoming[key];
      });
      return out;
    }
  };

  core.CULTO_META_MES = core.CULTO_ITEMS_BASE.length;
  core.toIsoLocal = toIsoLocal;
  core.pad2 = pad2;

  root.PraticasCore = core;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = core;
  }
})(globalThis);
