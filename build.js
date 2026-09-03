// 建置腳本：`npm run build` 會先跑 tsc 把 .ts 編到 dist/，再執行本檔。
// 本檔負責：
//   1. 把 manifest.json、popup.html、popup.css、icons/ 複製進 dist/
//   2. 把安裝說明放進 dist/
//   3. 把整個 dist/ 壓成 NTOU-Helper-Local.zip（manifest.json 在 zip 最上層，
//      使用者解壓後直接選那個資料夾即可載入）
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const DOCS = path.join(ROOT, 'docs');
const manifest = JSON.parse(fs.readFileSync(path.join(SRC, 'manifest.json'), 'utf8'));
const ZIP_NAME = 'NTOU-Helper-Local.zip';

function copy(rel) {
  const from = path.join(SRC, rel);
  const to = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
  console.log('copy:', rel);
}

// 確保圖示存在（第一次 clone 下來時 src/icons 可能還沒產生）
if (!fs.existsSync(path.join(SRC, 'icons', 'icon128.png'))) {
  require('./scripts/make-icons.js');
}

fs.mkdirSync(DIST, { recursive: true });
['manifest.json', 'popup.html', 'popup.css', 'icons'].forEach(copy);

// 安裝說明（給不會寫程式的使用者）
for (const f of ['安裝說明.txt', '安裝說明.html']) {
  const from = path.join(DOCS, f);
  if (fs.existsSync(from)) {
    fs.copyFileSync(from, path.join(DIST, f));
    console.log('copy:', f);
  }
}

// 移除 tsc 可能留下的多餘檔案
for (const f of fs.readdirSync(DIST)) {
  if (f.endsWith('.d.ts') || f.endsWith('.map')) fs.rmSync(path.join(DIST, f));
}

// 打包
const zip = new AdmZip();
zip.addLocalFolder(DIST);
const out = path.join(ROOT, ZIP_NAME);
zip.writeZip(out);
const kb = (fs.statSync(out).size / 1024).toFixed(1);
console.log(`\n✅ 建置完成：${ZIP_NAME} (${kb} KB)  版本 ${manifest.version}`);
