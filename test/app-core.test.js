const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = require('../public/app-core.js');
const coreSource = fs.readFileSync(path.join(__dirname, '../public/app-core.js'), 'utf8');

function day(overrides) {
  return Object.assign(core.blankDay(), overrides);
}

describe('datas e máscaras', () => {
  it('formata e interpreta DD/MM/AAAA', () => {
    assert.equal(core.fmtDateBR('2026-09-03'), '03/09/2026');
    assert.equal(core.fmtDateBR(''), '');
    assert.equal(core.fmtDateBR('2026'), '');
    assert.equal(core.parseDateBR('03/09/2026'), '2026-09-03');
    assert.equal(core.parseDateBR('3/9/2026'), '2026-09-03');
    assert.equal(core.parseDateBR('31/02/2026'), '');
    assert.equal(core.parseDateBR('abc'), '');
    assert.equal(core.maskDateBR('03092026'), '03/09/2026');
    assert.equal(core.maskDateBR(''), '');
    assert.equal(core.maskDateBR('03'), '03');
    assert.equal(core.maskDateBR('0309'), '03/09');
    assert.equal(core.parseDateBR(''), '');
  });

  it('formata e interpreta MM/AAAA', () => {
    assert.equal(core.fmtMonthBR('2026-09'), '09/2026');
    assert.equal(core.fmtMonthBR(''), '');
    assert.equal(core.fmtMonthBR('2026'), '');
    assert.equal(core.parseMonthBR('09/2026'), '2026-09');
    assert.equal(core.parseMonthBR('1/2026'), '2026-01');
    assert.equal(core.parseMonthBR('0/2026'), '');
    assert.equal(core.parseMonthBR('13/2026'), '');
    assert.equal(core.parseMonthBR('abc'), '');
    assert.equal(core.parseMonthBR(), '');
    assert.equal(core.maskMonthBR('092026'), '09/2026');
    assert.equal(core.maskMonthBR(''), '');
    assert.equal(core.maskMonthBR('09'), '09');
  });

  it('navega dias, semanas e datas longas', () => {
    assert.equal(core.shiftIsoDate('2026-09-30', 1).slice(0, 7), '2026-10');
    assert.equal(core.shiftIsoDate('2026-09-03', 0), core.shiftIsoDate('2026-09-03'));
    assert.equal(core.shiftIsoDate('invalido', 1), '');
    assert.equal(core.getWeekStart('2026-09-29'), '2026-09-28');
    assert.equal(core.getWeekStart('2026-09-28'), '2026-09-28');
    assert.equal(core.getWeekStart('2026-09-27'), '2026-09-21');
    assert.equal(core.getWeekStart('nope'), '');
    assert.equal(core.getWeekEnd('2026-09-28'), '2026-10-04');
    assert.equal(core.getWeekEnd('nope'), '');
    assert.equal(core.fmtDateShort('2026-09-03'), '03/09');
    assert.equal(core.fmtDateShort(''), '');
    assert.equal(core.fmtDateShort('2026'), '');
    assert.match(core.fmtDateLong('2026-09-29'), /Terça-feira, 29 de setembro de 2026/);
    assert.match(core.fmtDateLong('2026-09-27'), /domingo/i);
    assert.match(core.fmtDateLong('2026-09-26'), /sábado/i);
    assert.equal(core.fmtDateLong(''), '');
    assert.equal(core.fmtDateLong('2026-00-01'), '');
    assert.equal(core.toIsoLocal(new Date(2026, 8, 3)), '2026-09-03');
    assert.equal(core.toIsoLocal(null), '');
    assert.equal(core.toIsoLocal(new Date('invalid')), '');
    assert.equal(core.pad2(3), '03');
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(core.todayISO()));
    assert.equal(core.todayISO(new Date('2026-09-29T15:00:00-03:00')), '2026-09-29');
  });
});

describe('formatação de valores', () => {
  it('formata tempo, moeda, percentual e HTML', () => {
    assert.equal(core.fmtMin(undefined), '0 min');
    assert.equal(core.fmtMin(45), '45 min');
    assert.equal(core.fmtMin(60), '1h');
    assert.equal(core.fmtMin(90), '1h 30min');
    assert.equal(core.fmtHMS(0), '00:00:00');
    assert.equal(core.fmtHMS(3661), '01:01:01');
    assert.equal(core.fmtHMS(-5), '00:00:00');
    assert.match(core.fmtBRL(10), /R\$\s*10,00/);
    assert.equal(core.fmtPct(12.5), '12,5%');
    assert.equal(core.fmtPct(undefined), '0%');
    assert.equal(core.escapeHtml('<a "b" \'c\' & d>'), '&lt;a &quot;b&quot; &#039;c&#039; &amp; d&gt;');
    assert.equal(core.escapeHtml(null), '');
  });

  it('máscara e parse de donativo', () => {
    assert.equal(core.formatCurrencyValue(''), 'R$ 0,00');
    assert.equal(core.formatCurrencyValue('1'), 'R$ 0,01');
    assert.equal(core.formatCurrencyValue('12'), 'R$ 0,12');
    assert.equal(core.formatCurrencyValue('1234'), 'R$ 12,34');
    assert.equal(core.formatCurrencyValue('1234567'), 'R$ 12.345,67');
    assert.equal(core.parseCurrencyValue(''), 0);
    assert.equal(core.parseCurrencyValue('R$ 12,34'), 12.34);
    assert.equal(core.parsePercentual('10,5'), 10.5);
    assert.equal(core.parsePercentual('0'), null);
    assert.equal(core.parsePercentual('101'), null);
    assert.equal(core.parsePercentual('abc'), null);
    assert.equal(core.parsePercentual(null), null);
    assert.equal(core.donUnidade(null), 'valor');
    assert.equal(core.donUnidade({unidade:'percentual'}), 'percentual');
    assert.match(core.fmtDonValor({valor:10, unidade:'valor'}), /10,00/);
    assert.equal(core.fmtDonValor({valor:10, unidade:'percentual'}), '10%');
    assert.equal(core.sumDonativosPorUnidade([{valor:10,unidade:'valor'},{valor:5,unidade:'percentual'}], 'valor'), 10);
    assert.equal(core.sumDonativosPorUnidade(null, 'valor'), 0);
    assert.equal(core.sumDonativosPorUnidade([{valor:'x',unidade:'valor'}], 'valor'), 0);
    assert.match(core.fmtServirResumo(10, 5), /10,00/);
    assert.match(core.fmtServirResumo(10, 0), /10,00/);
    assert.equal(core.fmtServirResumo(0, 5), '5%');
    assert.equal(core.fmtServirResumo(0, 0, 'percentual'), '0%');
    assert.match(core.fmtServirResumo(0, 0, 'valor'), /0,00/);
    assert.equal(core.fmtDonValor({valor:undefined, unidade:'percentual'}), '0%');
  });
});

describe('dia, meta e registro', () => {
  it('normaliza dia parcial e detecta registro', () => {
    const d = core.normalizeDay({});
    assert.equal(d.leitura, 0);
    assert.equal(d.anotacao, '');
    assert.deepEqual(core.normalizeDay(null).johrei, {ministrado:0,recebido:0,auto:0});
    assert.equal(core.normalizeDay('x').leitura, 0);
    const full = core.normalizeDay({leitura:8, anotacao:'ok', johrei:{ministrado:1,recebido:0,auto:0}, enc:{encaminhamentos:0,outorgas:1}, donativos:[], servirTempo:[]});
    assert.equal(full.leitura, 8);
    assert.equal(full.anotacao, 'ok');
    assert.equal(core.dayHasRecord(core.blankDay()), false);
    assert.equal(core.dayHasRecord(null), false);
    assert.equal(core.dayHasRecord({leitura:0}), false);
    assert.equal(core.dayHasRecord(day({leitura:10})), true);
    assert.equal(core.dayHasRecord(day({johrei:{ministrado:1,recebido:0,auto:0}})), true);
    assert.equal(core.dayHasRecord(day({johrei:{ministrado:0,recebido:2,auto:0}})), true);
    assert.equal(core.dayHasRecord(day({johrei:{ministrado:0,recebido:0,auto:1}})), true);
    assert.equal(core.dayHasRecord(day({enc:{encaminhamentos:1,outorgas:0}})), true);
    assert.equal(core.dayHasRecord(day({enc:{encaminhamentos:0,outorgas:2}})), true);
    assert.equal(core.dayHasRecord(day({donativos:[{valor:1}]})), true);
    assert.equal(core.dayHasRecord(day({servirTempo:[{tipo:'Outros',minutos:5}]})), true);
  });

  it('tira e restaura snapshot do dia', () => {
    const original = day({leitura:20, anotacao:'graça', donativos:[{valor:1,tipo:'Diário'}], servirTempo:[{tipo:'Outros',minutos:8}]});
    const snap = core.snapshotDay(original);
    original.leitura = 0;
    original.donativos.push({valor:2});
    core.restoreDaySnap(original, snap);
    assert.equal(original.leitura, 20);
    assert.equal(original.donativos.length, 1);
    assert.equal(original.servirTempo[0].minutos, 8);
  });

  it('cria e lê metas sem corromper chave reservada', () => {
    const goals = {};
    const created = core.ensureGoal(goals, '2026-09');
    created.ministrado = 10;
    assert.equal(goals['2026-09'].ministrado, 10);
    assert.equal(core.ensureGoal(goals, '__diaInicial').ministrado, 0);
    assert.equal(goals.__diaInicial, undefined);
    const pct = core.ensureGoal(goals, '2026-10');
    pct.servirTipoMeta = 'percentual';
    assert.equal(core.ensureGoal(goals, '2026-10').servirTipoMeta, 'percentual');
    pct.servirTipoMeta = 'outro';
    assert.equal(core.ensureGoal(goals, '2026-10').servirTipoMeta, 'valor');
    assert.equal(core.peekGoal({}, '2026-09').ministrado, 0);
    assert.equal(core.peekGoal(null, '2026-09').ministrado, 0);
    assert.equal(core.peekGoal(goals, '2026-09').ministrado, 10);
    const parcial = core.ensureGoal({'2026-08': {servirMensalOpened: true, servirMensalChecked: true}}, '2026-08');
    assert.equal(parcial.servir, 0);
    assert.equal(parcial.servirMensalOpened, true);
    assert.equal(parcial.servirMensalChecked, true);
    assert.equal(core.goalHasAnyValue(core.blankGoal()), false);
    assert.equal(core.goalHasAnyValue(null), false);
    assert.equal(core.goalHasAnyValue({ministrado:1}), true);
    assert.equal(core.goalHasAnyValue({recebido:1}), true);
    assert.equal(core.goalHasAnyValue({leituraDia:1}), true);
    assert.equal(core.goalHasAnyValue({encaminhamentos:1}), true);
    assert.equal(core.goalHasAnyValue({outorgas:1}), true);
    assert.equal(core.goalHasAnyValue({servir:1}), true);
    assert.equal(core.goalHasAnyValue({servirMetaPercentual:1}), true);
    assert.equal(core.goalHasAnyValue({servirTempoMetas:[]}), false);
    assert.equal(core.goalHasAnyValue({servirTempoMetas:[{tipo:'Outros'}]}), true);
    assert.equal(core.isMonthKey('2026-09'), true);
    assert.equal(core.isMonthKey('x'), false);
    assert.equal(core.isMonthKey(), false);
  });
});

describe('servir com o tempo, cultos e progresso', () => {
  it('só conta prática específica marcada como concluída', () => {
    assert.equal(core.servirTempoContavel(null), true);
    assert.equal(core.servirTempoContavel({tipo:'Outros'}), true);
    assert.equal(core.servirTempoContavel({tipo:'Prática Específica', concluida:false}), false);
    assert.equal(core.servirTempoContavel({tipo:'Prática Específica', concluida:true}), true);
    assert.equal(core.servirTempoContavel({tipo:'Prática Específica'}), true);
  });

  it('agrega práticas específicas e o dia', () => {
    const days = {
      '2026-09-03': day({
        johrei:{ministrado:1,recebido:2,auto:0},
        leitura:30,
        enc:{encaminhamentos:1,outorgas:0},
        donativos:[{valor:10,unidade:'valor'},{valor:5,unidade:'percentual'}],
        servirTempo:[
          {tipo:'Prática Específica', descricao:'Limpeza', minutos:20, concluida:true},
          {tipo:'Prática Específica', descricao:'Limpeza', minutos:0, concluida:true},
          {tipo:'Prática Específica', descricao:'', minutos:5, concluida:false}
        ]
      })
    };
    days['2026-09-04'] = day({johrei:{ministrado:0,recebido:0,auto:1}, servirTempo:[{tipo:'Outros',minutos:7}]});
    days['2026-09-05'] = Object.assign(core.blankDay(), {servirTempo: null});
    const groups = core.aggregate(['2026-09-03', '2026-09-04', '2026-09-05'], () => 'm', dt => days[dt]);
    assert.equal(groups.m.johrei.ministrado, 1);
    assert.equal(groups.m.johrei.auto, 1);
    assert.equal(groups.m.leitura, 30);
    assert.equal(groups.m.servirTempoTotal, 27);
    assert.equal(groups.m.dias, 3);
    assert.equal(groups.m.donTotal, 10);
    assert.equal(groups.m.donPct, 5);
    assert.equal(groups.m.praticaBreakdown.Limpeza.minutos, 20);
    assert.equal(groups.m.praticaBreakdown.Limpeza.vezes, 1);
    const merged = core.mergePraticaBreakdown({A:{minutos:1,vezes:0}}, {A:{minutos:2,vezes:3}, B:{minutos:4,vezes:1}});
    assert.equal(merged.A.minutos, 3);
    assert.equal(merged.B.vezes, 1);
    assert.equal(core.mergePraticaBreakdown(null, {X:{minutos:1,vezes:0}}).X.minutos, 1);
    assert.deepEqual(core.mergePraticaBreakdown({}, null), {});
    assert.deepEqual(core.buildPraticaBreakdown(null), {});
    assert.deepEqual(core.buildPraticaBreakdown([{tipo:'Outros',minutos:9}]), {});
    assert.equal(core.buildPraticaBreakdown([{tipo:'Prática Específica',descricao:'',minutos:0}])['(sem descrição)'].vezes, 1);
    assert.deepEqual(core.aggregate(null, () => 'm', () => core.blankDay()), {});
    assert.deepEqual(core.aggregate([], () => 'm', () => core.blankDay()), {});
    const split = core.aggregate(['2026-09-03', '2026-09-04'], dt => dt, dt => days[dt]);
    assert.ok(split['2026-09-03'] && split['2026-09-04']);
  });

  it('lista cultos especiais e estatísticas', () => {
    assert.equal(core.getCultoItemsForMonth('2026-01').length, 4);
    assert.equal(core.getCultoItemsForMonth('2026-06').length, 6);
    assert.equal(core.getCultoItemsForMonth('2026-11').length, 6);
    assert.equal(core.getCultoItemsForMonth('2026-12').length, 6);
    assert.equal(core.getCultoItemsForMonth('').length, 4);
    const month = core.cultoStatsForMonth('2026-09', {igreja:true});
    assert.equal(month.done, 1);
    assert.equal(month.total, 4);
    assert.equal(core.cultoStatsForMonth('2026-09').done, 0);
    const year = core.cultoStatsForYear('2026', {'2026-09':{igreja:true}});
    assert.equal(year.done, 1);
    assert.equal(year.total, 48);
    assert.equal(core.cultoStatsForYear('2026').done, 0);
  });

  it('calcula realizado de meta e percentual de barra', () => {
    assert.equal(core.metaStLabel({tipo:'Outros'}), 'Outros');
    assert.equal(core.metaStLabel({tipo:'Prática Específica', descricao:'Limpeza'}), 'Prática Específica — Limpeza');
    assert.equal(core.metaStLabel(null), '');
    assert.equal(core.metaStValorLabel({unidade:'vezes', vezes:3}), '3 vezes');
    assert.equal(core.metaStValorLabel({unidade:'tempo', minutos:90}), '1h 30min');
    assert.equal(core.metaStValorLabel(null), '');
    const entries = [
      {tipo:'Outros', minutos:10},
      {tipo:'Prática Específica', descricao:'Limpeza', minutos:20}
    ];
    assert.deepEqual(core.realizadoParaMetaSt(entries, {tipo:'Outros'}), {minutos:10, vezes:1});
    assert.deepEqual(core.realizadoParaMetaSt(entries, {tipo:'Prática Específica', descricao:'Limpeza'}), {minutos:20, vezes:1});
    assert.deepEqual(core.realizadoParaMetaSt(entries, {tipo:'Prática Específica', descricao:'Outra'}), {minutos:0, vezes:0});
    assert.deepEqual(core.realizadoParaMetaSt([{tipo:'Prática Específica', minutos:4}], {tipo:'Prática Específica'}), {minutos:4, vezes:1});
    assert.deepEqual(core.realizadoParaMetaSt(null, {tipo:'Outros'}), {minutos:0, vezes:0});
    assert.deepEqual(core.realizadoParaMetaSt([{tipo:'Outros'}], {tipo:'Outros'}), {minutos:0, vezes:1});
    assert.deepEqual(core.realizadoParaMetaSt(entries, {tipo:'Meta agrupada'}, ['Outros', 'Prática Específica']), {minutos:30, vezes:2});
    assert.deepEqual(core.realizadoParaMetaSt(entries, {tipo:'Outros'}, []), {minutos:0, vezes:0});
    assert.deepEqual(core.realizadoParaMetaSt(entries, null), {minutos:0, vezes:0});
    assert.equal(core.progressPct(5, 10), 50);
    assert.equal(core.progressPct(20, 10), 100);
    assert.equal(core.progressPct(5, 0), 0);
    assert.equal(core.progressPct(undefined, 10), 0);
  });
});

describe('gráficos, período de relatório e backup', () => {
  it('monta pontos do gráfico e o pico do ano', () => {
    const pts = core.chartLinePoints([10, 0], 10, 0, 10, 50, 40);
    assert.equal(pts[0].y, 10);
    assert.equal(pts[1].v, 0);
    assert.equal(core.chartLinePoints([10], 0, 0, 10, 50, 40)[0].y, 50);
    assert.equal(core.chartLinePoints([undefined], 10, 0, 10, 50, 40)[0].v, 0);
    assert.deepEqual(core.chartLinePoints([], 10, 0, 10, 50, 40), []);
    assert.deepEqual(core.chartLinePoints(null, 10, 0, 10, 50, 40), []);
    const fmt = (v) => String(v);
    assert.equal(core.yearChartPeak([], [], fmt), 'sem registro');
    assert.match(core.yearChartPeak([4, 9, 1], [0, 0, 0], fmt), /realizado máx\. 9 em fevereiro/);
    assert.match(core.yearChartPeak([0, 0], [8, 1], fmt), /meta 8/);
    assert.match(core.yearChartPeak([2], [3], fmt, ['jan']), /em jan/);
    assert.equal(core.yearChartPeak(undefined, undefined, fmt), 'sem registro');
  });

  it('filtra datas e calcula o fim inclusivo do período', () => {
    assert.deepEqual(core.datesInRange(['2026-09-01','2026-09-10','2026-10-01'], '2026-09-03', '2026-09-30'), ['2026-09-10']);
    assert.deepEqual(core.datesInRange(null, '2026-09-03', '2026-09-30'), []);
    assert.equal(core.periodEndInclusive('2026-10-03'), '2026-10-02');
    assert.equal(core.periodEndInclusive('nope'), '');
    assert.equal(core.daysBetweenInclusive('2026-09-03', '2026-09-03'), 1);
    assert.equal(core.daysBetweenInclusive('2026-09-03', '2026-09-04'), 2);
    assert.equal(core.daysBetweenInclusive('2026-09-04', '2026-09-03'), 0);
    assert.equal(core.daysBetweenInclusive('nope', '2026-09-03'), 0);
  });

  it('mede dias desde backup e mescla importação', () => {
    assert.equal(core.daysSinceMs(0), null);
    assert.equal(core.daysSinceMs('abc'), null);
    assert.equal(core.daysSinceMs(Date.now() - 2 * 86400000, Date.now()), 2);
    assert.equal(typeof core.daysSinceMs(Date.now() - 86400000), 'number');
    assert.equal(core.daysSince(null, '2026-09-29'), null);
    assert.equal(core.daysSince('2026-09-01', '2026-09-29'), 28);
    assert.equal(core.daysSince('nope', '2026-09-29'), null);
    assert.equal(core.daysSince('2026-09-01', 'nope'), null);
    assert.equal(core.normalizeTab('diario'), 'diario');
    assert.equal(core.normalizeTab('objetivos'), 'objetivos');
    assert.equal(core.normalizeTab('mais'), 'mais');
    assert.equal(core.normalizeTab('x'), 'diario');
    assert.deepEqual(core.mergeBackup({a:1}, {b:2, a:3}), {a:3, b:2});
    assert.deepEqual(core.mergeBackup({}, null), {});
    assert.deepEqual(core.parseJsonSafe('', {ok:1}), {ok:1});
    assert.deepEqual(core.parseJsonSafe('{', {ok:1}), {ok:1});
    assert.deepEqual(core.parseJsonSafe('{"a":1}', {}), {a:1});
  });
});

describe('carregamento do núcleo', () => {
  it('expõe PraticasCore no globalThis sem CommonJS', () => {
    const context = { globalThis: {} };
    vm.runInNewContext(coreSource, context);
    assert.equal(context.globalThis.PraticasCore.fmtMin(60), '1h');
  });

  it('exporta as mesmas regras via module.exports', () => {
    const context = { globalThis: {}, module: { exports: {} } };
    vm.runInNewContext(coreSource, context);
    assert.equal(context.module.exports, context.globalThis.PraticasCore);
  });

  it('não atribui exports quando o module não tem essa propriedade', () => {
    const context = { globalThis: {}, module: {} };
    vm.runInNewContext(coreSource, context);
    assert.ok(context.globalThis.PraticasCore);
    assert.equal(context.module.exports, undefined);
  });
});
