---
title: "ADR-0001: Armazenamento de Releases Estáticas com Versionamento Git em /repos"
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

# ADR-0001: Armazenamento de Releases Estáticas com Versionamento Git em `/repos`

## 1. Contexto
Aplicações frontend estáticas na Olivelas necessitavam de um mecanismo de hospedagem que combinasse a simplicidade do GitHub Pages com governança corporativa: histórico de versões imutável, capacidade de travar a versão ativa em produção (`Version Lock`), previews isolados por versão antes da aprovação e rollback imediato sem perda de assets.

## 2. Decisão
Adotar uma arquitetura híbrida em `/repos/{slug}` gerenciada por [`GitStorageService`](../../backend/app/services/git_storage_service.py) aliada à persistência em `smartpages.opspages_release_files`:
1. **`/repos/{slug}/git_repo/`**: Repositório Git real inicializado automaticamente (`git init -b main`), onde cada deploy gera um commit assinado com `.opspages-release.json` e uma tag Git semântica (`v1.0.0`, `v1.1.0`).
2. **`/repos/{slug}/releases/{version}/`**: Diretório contendo os artefatos estáticos descompactados de cada versão, garantindo que:
   - O preview `/pages/{slug}/v/{version}/` sirva exatamente os assets da própria versão (`P-5`).
   - Após um rollback, assets hasheados (`/assets/*`) referenciados por clientes em transição continuem acessíveis via fallback entre releases (`P-3`).
3. **`/repos/{slug}/current/`**: Cópia atômica da versão ativa em produção servida em `/pages/{slug}/`.

## 3. Consequências
- **Positivas:** Rollback instantâneo em `O(1)`, auditoria completa via `git diff` entre tags, zero tela em branco pós-rollback (`P-3`) e isolamento total entre preview e produção (`P-5`).
- **Trade-offs:** Maior consumo de disco por manter snapshots extraídos em `releases/`, mitigado pela quota configurável `max_retained_versions` e `max_storage_mb` por projeto.
