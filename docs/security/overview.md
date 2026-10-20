---
title: "Visão Geral de Segurança — AIOps OpsPages"
status: "ACCEPTED"
owner: "AIOps Platform Team (Loft)"
created: "2026-10-20"
updated: "2026-10-20"
review_date: "2027-01-20"
version: "1.0.0"
---

> **Language:** pt-BR
> **Status:** ACCEPTED
> **Documentation Standard v1.0 (Loft AIOps)**

# Visão Geral de Segurança (Nível 5)

## 1. Princípios de Segurança da Plataforma

O **AIOps OpsPages** implementa uma arquitetura de defesa em profundidade (*Defense-in-Depth*) projetada especificamente para hospedagem de aplicações estáticas corporativas integradas ao ecossistema **AIOps OpsBase**:

1. **Zero Segredos no Código ou Bundle (`P-13`)**: Nenhuma credencial privada reside em código-fonte ou no bundle estático. Configurações públicas com escopo restrito são injetadas em runtime via `/pages/{slug}/opspages-config.js`.
2. **Autenticação Estrita por Header (`P-8`)**: Tokens JWT e API Tokens (`opspages_...`) são aceitos exclusivamente via header HTTP `Authorization: Bearer <token>`. Tokens na query string (`?token=`) são rejeitados com `HTTP 401` para evitar vazamento em logs de proxy e cabeçalhos `Referer`.
3. **Autorização Baseada em Host/Projeto (HBAC)**: Mesmo usuários autenticados só operam em projetos para os quais possuam regra HBAC ativa ou papel compatível.
4. **Validação Exata de Origem CORS (`P-9`, `P-10`)**: Nenhuma rota de API ou de projeto estático combina `Access-Control-Allow-Origin: *` com `Access-Control-Allow-Credentials: true`.
5. **Isolamento de Previews Não Aprovados (`P-4`)**: Builds com status `pending_approval`, `rejected` ou `archived` exigem autenticação válida para visualização em `/preview/{slug}/{version}/`.

---

## 2. Mecanismos de Autenticação

| Mecanismo | Formato | Uso Principal | Validação |
| :--- | :--- | :--- | :--- |
| **JWT (Sessão Console)** | `Authorization: Bearer eyJ...` | Operadores humanos no Frontend Console (`http://localhost:5176`) | Assinado com `HS256` (`SECRET_KEY`), expiração configurável (`ACCESS_TOKEN_EXPIRE_MINUTES`). |
| **API Token de Automação** | `Authorization: Bearer opspages_<random>` | Pipelines CI/CD (GitHub Actions, scripts de deploy) | Persistido apenas como hash `SHA-256` (`token_hash`) em `api_tokens`, com validação de `scopes`, `project_id` e `expires_at`. |

---

## 3. Segurança do Servidor de Páginas (`/pages` e `/preview`)

- **Proteção contra Path Traversal**: Todos os caminhos solicitados em `/pages/{slug}/{file_path}` e `/preview/{slug}/{version}/{file_path}` são resolvidos com `.resolve()` e validados contra o diretório base da release antes da leitura em disco.
- **Proteção contra Zip Slip**: Durante o upload de pacotes `.zip`, cada entrada tem seu caminho normalizado e verificado para impedir escrita fora do diretório da release (`../`).
- **Headers de Segurança Padrão (`P-2`)**: Todas as respostas de páginas incluem `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options`, `Referrer-Policy` e `Strict-Transport-Security`, customizáveis por projeto.

---

## 4. Documentos Relacionados

- [Fronteiras de Confiança (Trust Boundaries)](./trust-boundaries.md)
- [Controles de Segurança e Conformidade (`P-1` a `P-13`)](./controls-and-compliance.md)
- [Matriz HBAC & Escopos de Token](../contracts/hbac-matrix.md)
