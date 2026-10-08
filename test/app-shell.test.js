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
    assert.match(html, /src="app-rules\.js"/);
    assert.match(html, /src="app-core\.js"/);
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
    assert.equal(membro.start_url, '/membro/');
    assert.equal(ministro.scope, '/');
    assert.equal(membro.scope, '/membro/');
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
    assert.match(html, /location\.replace\('\/membro\/'/);
    assert.doesNotMatch(html, /id="installVersoes"/);
  });
});
