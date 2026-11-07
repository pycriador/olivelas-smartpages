# Portal Olivelas — Tecnologia, IA & Engenharia (v1.1.0)

Portal editorial estático multilíngue (**PT-BR**, **EN**, **ES**) de notícias sobre **Inteligência Artificial**, **Engenharia de Software**, **Cloud & DevOps**, **Segurança Cibernética** e **Semicondutores**, desenvolvido em **TypeScript** seguindo a identidade visual **Copan Design System (Olivelas)** e o layout editorial de grandes portais (UOL Tilt / Terra Tecnologia).

---

## Novidades da Release `1.1.0`

- **Seletor de Idiomas Dinâmico (`🇧🇷 PT-BR` | `🇺🇸 EN` | `🇪🇸 ES`)**: Tradução instantânea de toda a interface editorial, editorias, Plantão Tech, enquete interativa e das **7 reportagens completas** (títulos, subtítulos, resumos executivos, corpo da matéria, legendas e links relacionados), com persistência em `localStorage` e suporte a `?lang=pt-BR|en|es`.
- **Lista de Leitura Pessoal / Favoritos (`🔖 Salvar` / `★ Salvo`)**: Salve reportagens nos cards ou no leitor de matéria para ler depois, filtre o feed pelas matérias salvas e acesse o widget lateral **"Sua Lista de Leitura"**.
- **Resumo Executivo IA Inline (`⚡ Resumo IA` / `TL;DR`)**: Expanda os pontos-chave de qualquer reportagem diretamente no card da home sem precisar abrir o modal.
- **Narração em Áudio Nativa (`🎧 Ouvir Matéria` / `Listen` / `Escuchar`)**: Leitura em voz alta da reportagem pelo sintetizador nativo do navegador (`Web Speech API`) na voz do idioma selecionado (`pt-BR`, `en-US`, `es-ES`).
- **Barra de Tópicos em Alta (`#MCP`, `#TypeScript`, `#Kubernetes`, `#Rust`, etc.)**: Filtragem rápida por tags técnicas combinada com busca por atalho de teclado (`/`).
- **Barra de Progresso de Leitura & Animações Top-Layer**: Indicador de leitura no topo do modal `<dialog>` e transições suaves (`@starting-style` + `allow-discrete`).

---

## Estrutura do Projeto

- `src/types.ts` — Tipagens estritas em TypeScript para matérias, internacionalização (`PortalLocale = 'pt-BR' | 'en' | 'es'`), editorias, cotações tech, enquetes e estado da aplicação.
- `src/data/i18n.ts` — Dicionário completo de internacionalização (`PT-BR`, `EN`, `ES`) para a interface e todas as reportagens.
- `src/data/articles.ts` — Base editorial e seletores localizados de notícias reais de tecnologia, desenvolvimento e IA.
- `src/app.ts` — Motor interativo do portal (i18n reativo, favoritos, resumo IA inline, filtro por tags, leitor de matéria com áudio `speechSynthesis`, barra de progresso e tema Claro/Escuro Copan).
- `public/index.html` — Estrutura semântica HTML5 do portal.
- `public/css/styles.css` — Estilização completa Copan Editorial (responsiva, suporte a Light/Dark mode, grid estilo UOL/Terra).
- `public/img/` — Imagens editoriais das reportagens.
- `dist/` — Build final estática (`1.1.0`) contendo **exclusivamente** `index.html`, `css/`, `js/` e `img/`.

---

## Como rodar o HTML Estático localmente (Pasta `dist/` ou Build Baixada)

A build gerada é 100% estática (`HTML + CSS + JS + IMG`) com caminhos relativos (`./css/styles.css`, `./js/app.js`, `./img/...`). Você pode rodá-la em qualquer servidor HTTP local:

### Opção 1: Usando Python (Nativo no macOS / Linux / Windows)
```bash
python3 -m http.server 8080
```
Depois acesse: **http://localhost:8080**

### Opção 2: Usando Node.js (`npx serve`)
```bash
npx serve . -l 8080
```

---

## Como compilar o Código-Fonte TypeScript

```bash
npm install
npm run build
```
O comando `npm run build` valida e transpila o TypeScript (`src/*.ts`) para `dist/js/app.js` e copia `index.html`, `css/styles.css` e `img/*` para `dist/`.
