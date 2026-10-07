const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const rules = require('../public/app-rules.js');
const rulesSource = fs.readFileSync(path.join(__dirname, '../public/app-rules.js'), 'utf8');

describe('resolvePerfil', () => {
  it('usa ministro quando a URL não tem parâmetro', () => {
    assert.equal(rules.resolvePerfil(), 'ministro');
    assert.equal(rules.resolvePerfil(undefined), 'ministro');
    assert.equal(rules.resolvePerfil(null), 'ministro');
    assert.equal(rules.resolvePerfil(''), 'ministro');
    assert.equal(rules.resolvePerfil('?'), 'ministro');
    assert.equal(rules.resolvePerfil('?v=174'), 'ministro');
  });

  it('não aceita o parâmetro antigo perfil=membro', () => {
    assert.equal(rules.resolvePerfil('?perfil=membro'), 'ministro');
    assert.equal(rules.resolvePerfil('?p=membro'), 'ministro');
  });

  it('abre membro só com o código opaco', () => {
    assert.equal(rules.resolvePerfil('?k=8f2c'), 'membro');
    assert.equal(rules.resolvePerfil('k=8f2c'), 'membro');
    assert.equal(rules.resolvePerfil('?foo=1&k=8f2c'), 'membro');
  });

  it('abre membro pelo caminho /membro/', () => {
    assert.equal(rules.isMembroPath('/membro'), true);
    assert.equal(rules.isMembroPath('/membro/'), true);
    assert.equal(rules.isMembroPath('/membro/index.html'), true);
    assert.equal(rules.isMembroPath('/'), false);
    assert.equal(rules.isMembroPath('/membership'), false);
    assert.equal(rules.isMembroPath(''), false);
    assert.equal(rules.resolvePerfil('', '/membro/'), 'membro');
    assert.equal(rules.resolvePerfil('?v=1', '/membro'), 'membro');
    assert.equal(rules.resolvePerfil('', '/'), 'ministro');
  });

  it('indica a URL de instalação de cada perfil', () => {
    assert.equal(rules.urlInstalacao('ministro'), '/');
    assert.equal(rules.urlInstalacao('membro'), '/membro/');
    assert.equal(rules.urlInstalacao(undefined), '/');
  });

  it('mostra mi para ministro e me para membro', () => {
    assert.equal(rules.codigoPerfil('ministro'), 'mi');
    assert.equal(rules.codigoPerfil('membro'), 'me');
    assert.equal(rules.codigoPerfil(undefined), 'mi');
  });

  it('ignora o código se o nome do parâmetro estiver errado', () => {
    assert.equal(rules.resolvePerfil('?x=8f2c'), 'ministro');
    assert.equal(rules.resolvePerfil('?k=membro'), 'ministro');
    assert.equal(rules.resolvePerfil('?k=8F2C'), 'ministro');
  });
});

describe('isMinistro', () => {
  it('só o perfil membro deixa de ser ministro', () => {
    assert.equal(rules.isMinistro('membro'), false);
    assert.equal(rules.isMinistro('ministro'), true);
    assert.equal(rules.isMinistro(undefined), true);
    assert.equal(rules.isMinistro(''), true);
  });
});

describe('visão de membro em Servir com o Tempo', () => {
  it('ministro vê todos os tipos', () => {
    assert.deepEqual(rules.stTiposPara('ministro'), [
      'Dedicação na Unidade Religiosa',
      'Assistência religiosa',
      'Prática Específica',
      'Outros'
    ]);
  });

  it('membro usa a lista do Diário como stTiposPara', () => {
    assert.deepEqual(rules.stTiposPara('membro'), [
      'Servir com o tempo no Solo Sagrado',
      'Servir com o tempo na Igreja Mato Grosso do Sul',
      'Servir com o tempo no Johrei Center',
      'Servir com o tempo no Lar(com altar)'
    ]);
  });

  it('membro registra no Diário os quatro locais de servir', () => {
    assert.deepEqual(rules.stTiposDiarioPara('membro'), rules.ST_TIPOS_DIARIO_MEMBRO);
    assert.equal(rules.stTiposDiarioPara('membro').length, 4);
  });

  it('membro define em Objetivos só Servir com o tempo no Takamahara', () => {
    assert.deepEqual(rules.stTiposObjetivosPara('membro'), [
      'Servir com o tempo no Takamahara'
    ]);
    assert.deepEqual(rules.stTiposObjetivosPara('ministro'), rules.ST_TIPOS_MINISTRO);
  });

  it('ausência de perfil segue a visão de ministro', () => {
    assert.deepEqual(rules.stTiposPara(rules.resolvePerfil('')), rules.ST_TIPOS_MINISTRO);
    assert.deepEqual(rules.stTiposDiarioPara(rules.resolvePerfil('')), rules.ST_TIPOS_MINISTRO);
    assert.deepEqual(rules.stTiposObjetivosPara(rules.resolvePerfil('')), rules.ST_TIPOS_MINISTRO);
  });

  it('tempo lançado nos locais do Diário conta na meta Takamahara', () => {
    const tipos = rules.stTiposQueContamNaMeta('membro', 'Servir com o tempo no Takamahara');
    rules.ST_TIPOS_DIARIO_MEMBRO.forEach((tipo) => {
      assert.ok(tipos.includes(tipo), tipo);
    });
    assert.ok(tipos.includes('Servir com o tempo no Takamahara'));
    assert.ok(tipos.includes('Dedicação na Unidade Religiosa'));
  });

  it('ministro só conta o tipo exatamente igual à meta', () => {
    assert.deepEqual(
      rules.stTiposQueContamNaMeta('ministro', 'Assistência religiosa'),
      ['Assistência religiosa']
    );
    assert.deepEqual(rules.stTiposQueContamNaMeta('membro', ''), []);
    assert.deepEqual(rules.stTiposQueContamNaMeta('membro', undefined), []);
    assert.deepEqual(rules.stTiposQueContamNaMeta('membro', 'Outros'), ['Outros']);
  });

  it('membro não pode escolher Vezes por mês', () => {
    assert.equal(rules.membroPodeEscolherVezes('membro'), false);
    assert.equal(rules.unidadeMetaServirTempo('membro', 'vezes'), 'tempo');
    assert.equal(rules.unidadeMetaServirTempo('membro', 'tempo'), 'tempo');
  });

  it('ministro pode escolher tempo ou vezes', () => {
    assert.equal(rules.membroPodeEscolherVezes('ministro'), true);
    assert.equal(rules.unidadeMetaServirTempo('ministro', 'vezes'), 'vezes');
    assert.equal(rules.unidadeMetaServirTempo('ministro', 'tempo'), 'tempo');
    assert.equal(rules.unidadeMetaServirTempo('ministro', undefined), 'tempo');
    assert.equal(rules.unidadeMetaServirTempo('ministro', ''), 'tempo');
  });

  it('devolve uma cópia das listas de tipos', () => {
    const ministro = rules.stTiposPara('ministro');
    const diario = rules.stTiposDiarioPara('membro');
    const objetivos = rules.stTiposObjetivosPara('membro');
    const familia = rules.stFamiliaTempoMembro();
    ministro.push('extra');
    diario.push('extra');
    objetivos.push('extra');
    familia.push('extra');
    assert.deepEqual(rules.stTiposPara('ministro'), rules.ST_TIPOS_MINISTRO);
    assert.deepEqual(rules.stTiposDiarioPara('membro'), rules.ST_TIPOS_DIARIO_MEMBRO);
    assert.deepEqual(rules.stTiposObjetivosPara('membro'), rules.ST_TIPOS_OBJETIVOS_MEMBRO);
    assert.deepEqual(rules.stFamiliaTempoMembro().slice(0, 4), rules.ST_TIPOS_DIARIO_MEMBRO);
    assert.deepEqual(
      rules.stTiposQueContamNaMeta('membro', 'Servir com o tempo no Solo Sagrado').slice(0, 4),
      rules.ST_TIPOS_DIARIO_MEMBRO
    );
  });
});

describe('Servir Monetário: percentual só no Mensal', () => {
  it('Mensal usa percentual quando a meta do mês é percentual', () => {
    assert.equal(rules.donativoUsaPercentual('Mensal', 'percentual'), true);
  });

  it('Mensal usa valor quando a meta do mês é valor', () => {
    assert.equal(rules.donativoUsaPercentual('Mensal', 'valor'), false);
  });

  it('os demais tipos usam valor mesmo com meta percentual', () => {
    ['Diário', 'Sorei-Saishi', 'Pedido de Prece', 'Construção', 'Outros'].forEach((tipo) => {
      assert.equal(rules.donativoUsaPercentual(tipo, 'percentual'), false);
      assert.equal(rules.donativoUsaPercentual(tipo, 'valor'), false);
    });
  });

  it('sem tipo ou sem meta não usa percentual', () => {
    assert.equal(rules.donativoUsaPercentual(undefined, 'percentual'), false);
    assert.equal(rules.donativoUsaPercentual('Mensal', undefined), false);
    assert.equal(rules.donativoUsaPercentual('', ''), false);
  });
});

describe('Dia inicial do período', () => {
  it('normaliza o dia para o intervalo 1–31', () => {
    assert.equal(rules.normalizeDiaInicial(undefined), 1);
    assert.equal(rules.normalizeDiaInicial(''), 1);
    assert.equal(rules.normalizeDiaInicial(0), 1);
    assert.equal(rules.normalizeDiaInicial(-4), 1);
    assert.equal(rules.normalizeDiaInicial('abc'), 1);
    assert.equal(rules.normalizeDiaInicial('03'), 3);
    assert.equal(rules.normalizeDiaInicial(31), 31);
    assert.equal(rules.normalizeDiaInicial(32), 31);
  });

  it('ajusta o dia ao último dia do mês', () => {
    assert.equal(rules.ultimoDiaDoMes(2026, 9), 30);
    assert.equal(rules.ultimoDiaDoMes(2026, 2), 28);
    assert.equal(rules.ultimoDiaDoMes(2024, 2), 29);
    assert.equal(rules.clampDiaNoMes(2026, 9, 3), 3);
    assert.equal(rules.clampDiaNoMes(2026, 2, 31), 28);
    assert.equal(rules.clampDiaNoMes(2024, 2, 31), 29);
    assert.equal(rules.clampDiaNoMes('x', 9, 3), 1);
    assert.equal(rules.clampDiaNoMes(2026, 0, 3), 1);
    assert.equal(rules.clampDiaNoMes(2026, 13, 3), 1);
  });

  it('calcula o mês seguinte e o anterior', () => {
    assert.deepEqual(rules.proximoMes(2026, 9), { year: 2026, month: 10 });
    assert.deepEqual(rules.proximoMes(2026, 12), { year: 2027, month: 1 });
    assert.equal(rules.mesAnterior('2026-09'), '2026-08');
    assert.equal(rules.mesAnterior('2026-01'), '2025-12');
    assert.equal(rules.mesAnterior(''), '');
    assert.equal(rules.mesAnterior('abc'), '');
    assert.equal(rules.mesAnterior('2026-00'), '');
  });

  it('monta o período 03/09/2026 a 03/10/2026', () => {
    assert.deepEqual(rules.periodoDoMes('2026-09', 3), {
      start: '2026-09-03',
      end: '2026-10-03'
    });
    assert.equal(rules.fmtPeriodoBR('2026-09', 3), '03/09/2026 a 03/10/2026');
  });

  it('com dia 1 o período coincide com o mês civil', () => {
    assert.deepEqual(rules.periodoDoMes('2026-09', 1), {
      start: '2026-09-01',
      end: '2026-10-01'
    });
    assert.equal(rules.dateInPeriodo('2026-09-30', '2026-09', 1), true);
    assert.equal(rules.dateInPeriodo('2026-10-01', '2026-09', 1), false);
  });

  it('não fecha o período no dia inicial do mês seguinte', () => {
    assert.equal(rules.dateInPeriodo('2026-09-03', '2026-09', 3), true);
    assert.equal(rules.dateInPeriodo('2026-10-02', '2026-09', 3), true);
    assert.equal(rules.dateInPeriodo('2026-10-03', '2026-09', 3), false);
    assert.equal(rules.dateInPeriodo('2026-09-02', '2026-09', 3), false);
    assert.equal(rules.dateInPeriodo('', '2026-09', 3), false);
    assert.equal(rules.dateInPeriodo('2026-09-03', 'invalido', 3), false);
  });

  it('associa cada data ao mês de referência do período', () => {
    assert.equal(rules.monthKeyParaData('2026-09-03', 3), '2026-09');
    assert.equal(rules.monthKeyParaData('2026-10-02', 3), '2026-09');
    assert.equal(rules.monthKeyParaData('2026-10-03', 3), '2026-10');
    assert.equal(rules.monthKeyParaData('2026-01-02', 3), '2025-12');
    assert.equal(rules.monthKeyParaData('2026-09-15', 1), '2026-09');
    assert.equal(rules.monthKeyParaData('', 3), '');
    assert.equal(rules.monthKeyParaData('abc', 3), '');
  });

  it('vira o ano em dezembro e ignora mês inválido', () => {
    assert.deepEqual(rules.periodoDoMes('2026-12', 5), {
      start: '2026-12-05',
      end: '2027-01-05'
    });
    assert.deepEqual(rules.periodoDoMes('', 3), { start: '', end: '' });
    assert.deepEqual(rules.periodoDoMes('2026-13', 3), { start: '', end: '' });
    assert.equal(rules.fmtPeriodoBR('nope', 3), '');
  });

  it('conta os dias do período para a média de leitura', () => {
    assert.equal(rules.diasDoPeriodo('2026-09', 3), 30);
    assert.equal(rules.diasDoPeriodo('2026-09', 1), 30);
    assert.equal(rules.diasDoPeriodo('2026-02', 1), 28);
    assert.equal(rules.diasDoPeriodo('2024-02', 1), 29);
    assert.equal(rules.diasDoPeriodo('2026-12', 5), 31);
    assert.equal(rules.diasDoPeriodo('', 3), 0);
    assert.equal(rules.diasNoIntervalo('', '2026-10-03'), 0);
    assert.equal(rules.diasNoIntervalo('2026-10-03', '2026-09-03'), 0);
  });

  it('média de leitura é o total de minutos dividido pelos dias do período', () => {
    assert.equal(rules.mediaLeitura(300, 30), 10);
    assert.equal(Math.round(rules.mediaLeitura(100, 30)), 3);
    assert.equal(rules.mediaLeitura(0, 30), 0);
    assert.equal(rules.mediaLeitura(100, 0), 0);
    assert.equal(rules.mediaLeitura(undefined, 30), 0);
    assert.equal(rules.diasInclusivos('2026-09-03', '2026-10-02'), 30);
    assert.equal(rules.diasInclusivos('2026-09-03', '2026-09-03'), 1);
    assert.equal(rules.diasInclusivos('2026-10-03', '2026-09-03'), 0);
    assert.equal(rules.diasInclusivos('', '2026-09-03'), 0);
    assert.equal(rules.diasInclusivos('2026-09-03', 'nope'), 0);
  });

  it('média de leitura usa os dias desde o início até o dia atual', () => {
    assert.equal(rules.diasDecorridosPeriodo('2026-09', 3, '2026-09-03'), 1);
    assert.equal(rules.diasDecorridosPeriodo('2026-09', 3, '2026-09-04'), 2);
    assert.equal(rules.diasDecorridosPeriodo('2026-09', 3, '2026-09-29'), 27);
    assert.equal(rules.diasDecorridosPeriodo('2026-09', 3, '2026-10-02'), 30);
    assert.equal(rules.diasDecorridosPeriodo('2026-09', 3, '2026-10-03'), 30);
    assert.equal(rules.diasDecorridosPeriodo('2026-09', 3, '2026-11-01'), 30);
    assert.equal(rules.diasDecorridosPeriodo('2026-09', 3, '2026-09-02'), 0);
    assert.equal(rules.diasDecorridosPeriodo('2026-09', 3, ''), 0);
    assert.equal(rules.diasDecorridosPeriodo('', 3, '2026-09-03'), 0);
    assert.equal(Math.round(rules.mediaLeitura(30, rules.diasDecorridosPeriodo('2026-09', 3, '2026-09-03'))), 30);
    assert.equal(Math.round(rules.mediaLeitura(30, rules.diasDecorridosPeriodo('2026-09', 3, '2026-09-04'))), 15);
  });
});

describe('ícones de instalação', () => {
  it('ministro usa o manifesto e os ícones originais', () => {
    assert.deepEqual(rules.assetsInstalacao('ministro'), {
      manifest: 'manifest.webmanifest',
      favicon: 'icons/favicon.png',
      appleTouch: 'icons/apple-touch-icon.png',
      appleTitle: 'Práticas Messiânicas'
    });
  });

  it('membro usa manifesto e ícones próprios', () => {
    const assets = rules.assetsInstalacao('membro');
    assert.equal(assets.manifest, 'manifest-membro.webmanifest');
    assert.equal(assets.favicon, 'icons/favicon-membro.png');
    assert.equal(assets.appleTouch, 'icons/apple-touch-icon-membro.png');
    assert.equal(assets.appleTitle, 'Práticas membro');
    assert.deepEqual(rules.assetsInstalacao(rules.resolvePerfil('?k=8f2c')), assets);
  });
});

describe('carregamento do módulo', () => {
  it('expõe as regras no globalThis sem CommonJS', () => {
    const context = { globalThis: {}, URLSearchParams };
    vm.runInNewContext(rulesSource, context);
    assert.equal(context.globalThis.PraticasRules.resolvePerfil('?k=8f2c'), 'membro');
    assert.equal(context.module, undefined);
  });

  it('exporta as mesmas regras via module.exports', () => {
    const context = { globalThis: {}, module: { exports: {} }, URLSearchParams };
    vm.runInNewContext(rulesSource, context);
    assert.equal(context.module.exports, context.globalThis.PraticasRules);
    assert.equal(context.module.exports.VIEW_MEMBRO, '8f2c');
  });

  it('não atribui exports quando o module não tem essa propriedade', () => {
    const context = { globalThis: {}, module: {}, URLSearchParams };
    vm.runInNewContext(rulesSource, context);
    assert.ok(context.globalThis.PraticasRules);
    assert.equal(context.module.exports, undefined);
  });
});
