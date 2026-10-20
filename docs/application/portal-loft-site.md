---
title: "Portal Loft — Página Estática Real em TypeScript (sites/portal-loft)"
status: "ACCEPTED"
owner: "aiops-platform-team"
created: "2026-10-20"
updated: "2026-10-20"
review_date: "2027-01-20"
version: "1.1"
---

> Language: pt-BR
>
> Status: ACCEPTED
>
> Documentation Standard v1.0 (Loft AIOps)

# Level 2 — Portal Loft (`application/portal-loft-site.md`)

## 1. Propósito (`Confirmed`)

O diretório [`sites/portal-loft/`](../../sites/portal-loft/) contém o código-fonte em **TypeScript** da primeira aplicação estática 100% real hospedada e versionada no **AIOps OpsPages**: o **Portal Loft**, um portal editorial de notícias de Tecnologia, Inteligência Artificial, Cloud Computing, Cibersegurança e Semicondutores inspirado em grandes portais (UOL Tilt / Terra Tecnologia) com a identidade visual **Loft Copan (`#FF5A26`)**.

---

## 2. Estrutura do Projeto (`Confirmed`)

```text
sites/portal-loft/
├── package.json              # Scripts de build TypeScript + empacotamento estático
├── tsconfig.json             # Configuração do compilador TypeScript (strict, ES2020)
├── scripts/
│   └── build.mjs             # Compila TS -> JS e empacota HTML, CSS, JS e IMG em dist/
├── src/
│   ├── types.ts              # Tipagens de artigos, categorias, cotações e traduções (PT-BR, EN, ES)
│   ├── data.ts               # Acervo completo de notícias reais de tecnologia traduzidas em 3 idiomas
│   └── main.ts               # Motor de renderização, busca, filtro por editoria, modal de leitura e i18n
├── public/
│   ├── index.html            # Estrutura semântica HTML5 do Portal Loft
│   ├── styles.css            # Design responsivo editorial Copan
│   └── img/                  # 6 imagens fotojornalísticas geradas por IA
└── dist/                     # Artefato final estático (HTML + CSS + JS + IMG + build-manifest.json)
```

---

## 3. Releases Publicadas em `/repos/portal-loft` (`Confirmed`)

| Versão | Status | Recursos | URL de Acesso / Preview |
| :---: | :---: | :--- | :--- |
| **`1.0.0`** | `ready` (Tag Git `v1.0.0`) | Portal editorial completo com 6 reportagens ilustradas, busca, filtro por editoria, leitura em modal e tema claro/escuro | `http://localhost:8005/pages/portal-loft/v/1.0.0/` |
| **`1.1.0`** | `published` (**LIVE** / Tag Git `v1.1.0`) | Seletor de idiomas completo em **PT-BR**, **EN** e **ES** (com sincronização em `?lang=` e `localStorage`), barra de progresso de leitura, compartilhamento de link traduzido e filtro rápido por tags | `http://localhost:8005/pages/portal-loft/` |

---

## 4. Como Compilar e Baixar (`Confirmed`)

```bash
# Compilar código TypeScript para dist/ (HTML, CSS, JS e IMG)
cd sites/portal-loft
npm run build

# Baixar o pacote HTML estático pronto para qualquer servidor local (.zip)
curl -O "http://localhost:8005/api/v1/public/projects/portal-loft/download-build?version=1.1.0"

# Baixar o código-fonte completo em TypeScript (.zip)
curl -O "http://localhost:8005/api/v1/public/projects/portal-loft/download-source?version=1.1.0"
```
