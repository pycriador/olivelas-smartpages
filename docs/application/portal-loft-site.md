---
title: "Portal Olivelas — Aplicação Estática de Exemplo em TypeScript (sites/portal-loft)"
status: "ACCEPTED"
owner: "olivelas-platform-team"
created: "2026-10-20"
updated: "2026-11-07"
review_date: "2027-02-07"
version: "2.0"
---

> Language: pt-BR
>
> Status: ACCEPTED
>
> Documentation Standard v1.0 (Olivelas)

# Level 2 — Portal de Exemplo em TypeScript (`application/portal-loft-site.md`)

## 1. Propósito (`Confirmed`)

O diretório [`sites/portal-loft/`](../../sites/portal-loft/) contém o código-fonte em **TypeScript** de uma aplicação estática de referência pronta para compilação e upload no **Olivelas SmartPages (`Olivelas OpsPages`)**: um portal editorial multilíngue (**PT-BR**, **EN**, **ES**) de notícias de Tecnologia, Inteligência Artificial, Cloud Computing, Cibersegurança e Semicondutores.

> **Nota sobre o Estado Inicial do Banco**: Conforme definido no ADR-0004, o banco de produção no Supabase (`smartpages`) inicia com **0 projetos cadastrados** para permitir que os administradores cadastrem seus próprios projetos do zero. Este diretório permanece disponível no repositório como template e exemplo de build TypeScript para testes ou publicação manual.

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
│   ├── data/                 # Acervo completo de notícias reais de tecnologia traduzidas em 3 idiomas
│   └── app.ts                # Motor de renderização, busca, filtro por editoria, modal de leitura e i18n
├── public/
│   ├── index.html            # Estrutura semântica HTML5
│   ├── css/styles.css        # Design responsivo editorial Copan
│   └── img/                  # Imagens fotojornalísticas das reportagens
└── dist/                     # Artefato final estático (HTML + CSS + JS + IMG)
```

---

## 3. Como Compilar e Publicar no Olivelas SmartPages (`Confirmed`)

```bash
# 1. Compilar código TypeScript para dist/ (HTML, CSS, JS e IMG)
cd sites/portal-loft
npm run build

# 2. Empacotar o diretório dist/ em um arquivo .zip para upload na plataforma
cd dist && zip -r ../portal-build-v1.1.0.zip .
```
