const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');

function read(rel) {
  return fs.readFileSync(path.join(publicDir, rel), 'utf8');
}

describe('casca do aplicativo', () => {
  it('alinha a versão em index.html e no service worker', () => {
    const html = read('index.html');
    const sw = read('sw.js');
    const meta = html.match(/<meta name="app-version" content="([^"]+)">/);
    const constHtml = html.match(/const APP_VERSION = '([^']+)'/);
    const label = html.match(/id="appVersion">versão ([^<]+)</);
    const constSw = sw.match(/const APP_VERSION = '([^']+)'/);
    assert.ok(meta && constHtml && label && constSw);
    assert.equal(meta[1], constHtml[1]);
    assert.equal(constHtml[1], label[1]);
    assert.equal(constHtml[1], constSw[1]);
  });

  it('carrega as regras, o núcleo e os dois manifestos', () => {
    const html = read('index.html');
    assert.match(html, /src="app-rules\.js(\?v=[^"]+)?"/);
    assert.match(html, /src="app-core\.js(\?v=[^"]+)?"/);
    assert.match(html, /manifest-membro\.webmanifest/);
    assert.match(html, /favicon-membro\.png/);
    assert.ok(fs.existsSync(path.join(publicDir, 'app-rules.js')));
    assert.ok(fs.existsSync(path.join(publicDir, 'app-core.js')));
    assert.ok(fs.existsSync(path.join(publicDir, 'manifest.webmanifest')));
    assert.ok(fs.existsSync(path.join(publicDir, 'manifest-membro.webmanifest')));
  });

  it('mantém os ícones de ministro e membro', () => {
    [
      'icons/favicon.png',
      'icons/apple-touch-icon.png',
      'icons/icon-192.png',
      'icons/icon-512.png',
      'icons/favicon-membro.png',
      'icons/apple-touch-icon-membro.png',
      'icons/icon-192-membro.png',
      'icons/icon-512-membro.png'
    ].forEach((rel) => {
      assert.ok(fs.existsSync(path.join(publicDir, rel)), rel);
    });
  });

  it('manifesta start_url distinta para membro', () => {
    const ministro = JSON.parse(read('manifest.webmanifest'));
    const membro = JSON.parse(read('manifest-membro.webmanifest'));
    assert.equal(ministro.start_url, '/');
    assert.equal(membro.start_url, '/?k=8f2c');
    assert.equal(ministro.scope, '/');
    assert.equal(membro.scope, '/');
    assert.equal(ministro.id, '/diario-ministro');
    assert.equal(membro.id, '/diario-membro');
    assert.notEqual(ministro.id, membro.id);
    assert.ok(membro.icons[0].src.includes('membro'));
    assert.ok(fs.existsSync(path.join(publicDir, 'membro/index.html')));
  });

  it('expõe as abas principais no HTML', () => {
    const html = read('index.html');
    ['tabDiario', 'tabObjetivos', 'tabMais', 'objDiaInicial', 'objMonthPicker', 'goal-leitura'].forEach((id) => {
      assert.match(html, new RegExp('id="' + id + '"'));
    });
  });

  it('liga o HTML ao núcleo e às chaves de armazenamento', () => {
    const html = read('index.html');
    const sw = read('sw.js');
    assert.match(html, /window\.PraticasCore/);
    assert.match(html, /window\.PraticasRules/);
    assert.match(html, /praticas-messianicas-data-v1/);
    assert.match(html, /praticas-messianicas-goals-v1/);
    assert.match(html, /praticas-messianicas-cultos-v1/);
    assert.match(html, /8f2c/);
    assert.match(html, /perfil-membro/);
    assert.match(sw, /praticas-messianicas-cache-v/);
    assert.match(html, /id="stTipo"/);
    assert.match(html, /id="goalStTipo"/);
    assert.match(html, /id="goalStDesc"/);
    assert.match(html, /id="appPerfilLabel"/);
    assert.match(html, /id="ministroSenhaOverlay"/);
    assert.match(html, /id="ministroSenhaForm"/);
    assert.match(html, /name="servirTipoMeta"/);
    assert.match(html, /<base href="\/">/);
    assert.doesNotMatch(html, /location\.replace\('\/membro\/'/);
    assert.doesNotMatch(html, /id="installVersoes"/);
  });

  it('não esconde o importador de backup com display:none (quebra o iOS)', () => {
    const html = read('index.html');
    const input = html.match(/<input type="file" id="importFile"[^>]*>/);
    assert.ok(input, 'campo de importação');
    assert.match(input[0], /class="[^"]*sr-only/);
    assert.doesNotMatch(input[0], /display:\s*none/);
  });

  it('reconhece iPadOS (UA Macintosh) no convite de instalação', () => {
    const html = read('index.html');
    assert.match(html, /MacIntel/);
    assert.match(html, /maxTouchPoints/);
    assert.match(html, /navigator\.canShare/);
    assert.match(html, /praticas-messianicas-st-timer-v1/);
  });

  it('o service worker não intercepta o próprio script', () => {
    const sw = read('sw.js');
    assert.match(sw, /pathname\.endsWith\('\/sw\.js'\)/);
  });

  it('as abas grudam abaixo da área segura do iOS', () => {
    const html = read('index.html');
    assert.match(html, /top:\s*var\(--safe-top\)/);
    assert.match(html, /top:\s*calc\(var\(--tabbar-h\) \+ var\(--safe-top\)\)/);
  });

  it('os campos de horas do Servir com o Tempo cabem no iPhone', () => {
    const html = read('index.html');
    assert.match(html, /id="stTimeInputsWrap"/);
    assert.match(html, /::-webkit-inner-spin-button/);
    assert.match(html, /grid-template-columns:minmax\(0,1fr\) auto minmax\(0,1fr\) auto/);
    assert.match(html, /stTimeInputsWrap'\)\.style\.display = isVezes \? 'none' : ''/);
  });
});
