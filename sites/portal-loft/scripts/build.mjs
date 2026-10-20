import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Module, { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const require = createRequire(import.meta.url);
let ts = null;
try {
  ts = require('typescript');
} catch {
  try {
    ts = require(path.resolve(rootDir, '../../frontend/node_modules/typescript'));
  } catch {
    ts = null;
  }
}

const srcDir = path.join(rootDir, 'src');
const publicDir = path.join(rootDir, 'public');
const distDir = path.join(rootDir, 'dist');

console.log('🔨 [Portal Loft v1.1.0] Iniciando compilação TypeScript -> Build Estática (HTML/CSS/JS/IMG)...');

// 1. Optional full TypeScript compiler type-check when `typescript` package is present
if (ts) {
  const configPath = path.join(rootDir, 'tsconfig.json');
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, rootDir);

  const program = ts.createProgram(parsedConfig.fileNames, {
    ...parsedConfig.options,
    noEmit: true,
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);

  if (diagnostics.length > 0) {
    const formatted = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCurrentDirectory: () => rootDir,
      getCanonicalFileName: (f) => f,
      getNewLine: () => '\n',
    });
    console.error(formatted);
    process.exit(1);
  }
  console.log('✅ TypeScript (tsc) typecheck concluído com 0 erros.');
}

// 2. Clean and recreate dist/ directory (strictly HTML, CSS, JS, IMG)
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(path.join(distDir, 'css'), { recursive: true });
fs.mkdirSync(path.join(distDir, 'js'), { recursive: true });
fs.mkdirSync(path.join(distDir, 'img'), { recursive: true });

// 3. Bundle & transpile TypeScript modules (types.ts + data/i18n.ts + data/articles.ts + app.ts) into dist/js/app.js
const stripImportsAndExports = (sourceCode) => {
  return sourceCode
    .replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^\s*export\s+(interface|type|const|class|function)/gm, '$1');
};

const typesTs = fs.readFileSync(path.join(srcDir, 'types.ts'), 'utf8');
const i18nTs = fs.readFileSync(path.join(srcDir, 'data', 'i18n.ts'), 'utf8');
const articlesTs = fs.readFileSync(path.join(srcDir, 'data', 'articles.ts'), 'utf8');
const appTs = fs.readFileSync(path.join(srcDir, 'app.ts'), 'utf8');

const combinedTsSource = [
  '// ============================================================================',
  '// PORTAL LOFT — Build Estática Compilada a partir de TypeScript (v1.1.0)',
  '// Multilíngue (PT-BR / EN / ES) • Design System Copan • HTML + CSS + JS + IMG',
  '// ============================================================================',
  '(() => {',
  stripImportsAndExports(typesTs),
  stripImportsAndExports(i18nTs),
  stripImportsAndExports(articlesTs),
  stripImportsAndExports(appTs),
  '})();',
].join('\n\n');

let outputJs = '';
if (ts) {
  const transpiled = ts.transpileModule(combinedTsSource, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.None,
      removeComments: false,
      strict: true,
    },
    fileName: 'app.ts',
  });
  outputJs = transpiled.outputText;
} else if (typeof Module.stripTypeScriptTypes === 'function') {
  const normalizedTs = combinedTsSource.replace(
    /^(\s*)(public|private|protected)\s+/gm,
    '$1'
  );
  outputJs = Module.stripTypeScriptTypes(normalizedTs, { mode: 'strip' });
  console.log('✅ Compilado via Node.js native TypeScript compiler (stripTypeScriptTypes).');
} else {
  throw new Error('Nenhum compilador TypeScript disponível. Execute npm install primeiro.');
}

fs.writeFileSync(path.join(distDir, 'js', 'app.js'), outputJs, 'utf8');

// 4. Copy static HTML, CSS, and IMG assets
fs.copyFileSync(path.join(publicDir, 'index.html'), path.join(distDir, 'index.html'));
fs.copyFileSync(path.join(publicDir, 'css', 'styles.css'), path.join(distDir, 'css', 'styles.css'));

const imgFiles = fs.readdirSync(path.join(publicDir, 'img'));
for (const file of imgFiles) {
  const srcFile = path.join(publicDir, 'img', file);
  if (fs.statSync(srcFile).isFile()) {
    fs.copyFileSync(srcFile, path.join(distDir, 'img', file));
  }
}

console.log(`✅ Build 1.1.0 gerada com sucesso em: ${distDir}`);
console.log('📦 Estrutura da build: index.html, css/styles.css, js/app.js, img/* (' + imgFiles.length + ' imagens)');
