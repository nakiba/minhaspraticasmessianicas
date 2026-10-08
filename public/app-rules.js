// Regras das visões ministro/membro, Servir Monetário e período de acompanhamento.
// Usado pelo app e pelos testes unitários.
(function (root) {
  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function isoDeYMD(year, month, day) {
    return year + '-' + pad2(month) + '-' + pad2(day);
  }

  const rules = {
    VIEW_QS: 'k',
    VIEW_MEMBRO: '8f2c',
    MEMBRO_PATH: '/membro/',
    SENHA_MINISTRO: 'makoto',
    ST_TIPOS_MINISTRO: [
      'Dedicação na Unidade Religiosa',
      'Assistência religiosa',
      'Prática Específica',
      'Outros'
    ],
    ST_TIPOS_OBJETIVOS_MEMBRO: [
      'Servir com o tempo no Takamahara'
    ],
    ST_TIPOS_DIARIO_MEMBRO: [
      'Servir com o tempo no Solo Sagrado',
      'Servir com o tempo na Igreja Mato Grosso do Sul',
      'Servir com o tempo no Johrei Center',
      'Servir com o tempo no Lar(com altar)'
    ],
    ST_TIPOS_MEMBRO_LEGADO: [
      'Dedicação na Unidade Religiosa'
    ],

    isMembroPath: function (pathname) {
      const path = String(pathname || '').split('?')[0];
      return /(^|\/)membro(\/|$)/.test(path);
    },

    resolvePerfil: function (search, pathname) {
      if (rules.isMembroPath(pathname)) return 'membro';
      const raw = String(search || '');
      const query = raw.charAt(0) === '?' ? raw.slice(1) : raw;
      const params = new URLSearchParams(query);
      if (params.get(rules.VIEW_QS) === rules.VIEW_MEMBRO) return 'membro';
      return 'ministro';
    },

    urlInstalacao: function (perfil) {
      return rules.isMinistro(perfil) ? '/' : rules.MEMBRO_PATH;
    },

    codigoPerfil: function (perfil) {
      return rules.isMinistro(perfil) ? 'mi' : 'me';
    },

    senhaMinistroValida: function (senha) {
      return String(senha || '').trim().toLowerCase() === rules.SENHA_MINISTRO;
    },

    precisaSenhaMinistro: function (perfil, jaLiberado) {
      return rules.isMinistro(perfil) && !jaLiberado;
    },

    isMinistro: function (perfil) {
      return perfil !== 'membro';
    },

    stTiposDiarioPara: function (perfil) {
      return rules.isMinistro(perfil)
        ? rules.ST_TIPOS_MINISTRO.slice()
        : rules.ST_TIPOS_DIARIO_MEMBRO.slice();
    },

    stTiposObjetivosPara: function (perfil) {
      return rules.isMinistro(perfil)
        ? rules.ST_TIPOS_MINISTRO.slice()
        : rules.ST_TIPOS_OBJETIVOS_MEMBRO.slice();
    },

    stTiposPara: function (perfil) {
      return rules.stTiposDiarioPara(perfil);
    },

    stFamiliaTempoMembro: function () {
      return rules.ST_TIPOS_DIARIO_MEMBRO
        .concat(rules.ST_TIPOS_OBJETIVOS_MEMBRO)
        .concat(rules.ST_TIPOS_MEMBRO_LEGADO);
    },

    stTiposQueContamNaMeta: function (perfil, metaTipo) {
      if (!metaTipo) return [];
      if (rules.isMinistro(perfil)) return [metaTipo];
      const familia = rules.stFamiliaTempoMembro();
      if (familia.indexOf(metaTipo) >= 0) return familia.slice();
      return [metaTipo];
    },

    unidadeMetaServirTempo: function (perfil, selecionada) {
      if (!rules.isMinistro(perfil)) return 'tempo';
      return selecionada === 'vezes' ? 'vezes' : 'tempo';
    },

    membroPodeEscolherVezes: function (perfil) {
      return rules.isMinistro(perfil);
    },

    donativoUsaPercentual: function (tipo, servirTipoMeta) {
      return servirTipoMeta === 'percentual' && tipo === 'Mensal';
    },

    normalizeDiaInicial: function (dia) {
      const n = parseInt(dia, 10);
      if (!Number.isFinite(n) || n < 1) return 1;
      if (n > 31) return 31;
      return n;
    },

    ultimoDiaDoMes: function (year, month) {
      return new Date(year, month, 0).getDate();
    },

    clampDiaNoMes: function (year, month, dia) {
      const y = parseInt(year, 10);
      const m = parseInt(month, 10);
      if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return 1;
      return Math.min(rules.normalizeDiaInicial(dia), rules.ultimoDiaDoMes(y, m));
    },

    proximoMes: function (year, month) {
      const y = parseInt(year, 10);
      const m = parseInt(month, 10);
      if (m === 12) return { year: y + 1, month: 1 };
      return { year: y, month: m + 1 };
    },

    mesAnterior: function (monthKey) {
      const parts = String(monthKey || '').split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return '';
      if (m === 1) return (y - 1) + '-12';
      return y + '-' + pad2(m - 1);
    },

    periodoDoMes: function (monthKey, diaInicial) {
      const parts = String(monthKey || '').split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
        return { start: '', end: '' };
      }
      const dia = rules.normalizeDiaInicial(diaInicial);
      const startDay = rules.clampDiaNoMes(year, month, dia);
      const next = rules.proximoMes(year, month);
      const endDay = rules.clampDiaNoMes(next.year, next.month, dia);
      return {
        start: isoDeYMD(year, month, startDay),
        end: isoDeYMD(next.year, next.month, endDay)
      };
    },

    dateInPeriodo: function (dateStr, monthKey, diaInicial) {
      const p = rules.periodoDoMes(monthKey, diaInicial);
      if (!p.start || !dateStr) return false;
      return dateStr >= p.start && dateStr < p.end;
    },

    monthKeyParaData: function (dateStr, diaInicial) {
      const parts = String(dateStr || '').split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return '';
      const startThis = rules.clampDiaNoMes(y, m, diaInicial);
      if (d >= startThis) return y + '-' + pad2(m);
      return rules.mesAnterior(y + '-' + pad2(m));
    },

    assetsInstalacao: function (perfil) {
      if (rules.isMinistro(perfil)) {
        return {
          manifest: 'manifest.webmanifest',
          favicon: 'icons/favicon.png',
          appleTouch: 'icons/apple-touch-icon.png',
          appleTitle: 'Práticas Messiânicas'
        };
      }
      return {
        manifest: 'manifest-membro.webmanifest',
        favicon: 'icons/favicon-membro.png',
        appleTouch: 'icons/apple-touch-icon-membro.png',
        appleTitle: 'Práticas membro'
      };
    },

    fmtPeriodoBR: function (monthKey, diaInicial) {
      const p = rules.periodoDoMes(monthKey, diaInicial);
      if (!p.start) return '';
      function br(iso) {
        const bits = iso.split('-');
        return bits[2] + '/' + bits[1] + '/' + bits[0];
      }
      return br(p.start) + ' a ' + br(p.end);
    },

    diasNoIntervalo: function (start, endExclusive) {
      if (!start || !endExclusive) return 0;
      const a = new Date(start + 'T00:00:00');
      const b = new Date(endExclusive + 'T00:00:00');
      const ms = b.getTime() - a.getTime();
      if (!Number.isFinite(ms) || ms <= 0) return 0;
      return Math.round(ms / 86400000);
    },

    diasDoPeriodo: function (monthKey, diaInicial) {
      const p = rules.periodoDoMes(monthKey, diaInicial);
      return rules.diasNoIntervalo(p.start, p.end);
    },

    diasInclusivos: function (start, endInclusive) {
      if (!start || !endInclusive || endInclusive < start) return 0;
      const d = new Date(endInclusive + 'T00:00:00');
      if (!Number.isFinite(d.getTime())) return 0;
      d.setDate(d.getDate() + 1);
      const next = isoDeYMD(d.getFullYear(), d.getMonth() + 1, d.getDate());
      return rules.diasNoIntervalo(start, next);
    },

    mediaLeitura: function (totalMinutos, dias) {
      const min = Number(totalMinutos) || 0;
      const n = Number(dias) || 0;
      if (n <= 0) return 0;
      return min / n;
    },

    diasDecorridosPeriodo: function (monthKey, diaInicial, dataRef) {
      const p = rules.periodoDoMes(monthKey, diaInicial);
      if (!p.start || !p.end || !dataRef) return 0;
      if (dataRef < p.start) return 0;
      if (dataRef >= p.end) return rules.diasNoIntervalo(p.start, p.end);
      return rules.diasInclusivos(p.start, dataRef);
    }
  };

  root.PraticasRules = rules;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = rules;
  }
})(globalThis);
