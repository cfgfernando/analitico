# 📡 CATÁLOGO DE ENDPOINTS RESTful — API FISCAL MULTI-TENANT (V4.0.0)

A API do SaaS Fiscal é construída sobre **NestJS** e expõe endpoints RESTful protegidos por autenticação JWT e isolamento multi-tenant.

---

## 🔐 1. Autenticação & Gestão de Sessão (`/api/auth`)

| Método | Rota | Descrição | Roles Permitidas |
|---|---|---|---|
| `POST` | `/api/auth/login` | Realiza autenticação e retorna Access Token (15m) e Refresh Token (7d) | Público |
| `POST` | `/api/auth/refresh` | Renova o Access Token rotacionando o Refresh Token | Público |
| `POST` | `/api/auth/logout` | Revoga os tokens e encerra a sessão | Autenticado |
| `GET` | `/api/auth/me` | Retorna o perfil do usuário logado e contexto do tenant | Autenticado |

---

## 🏛️ 2. Módulos Fiscais e Executivos (`/api/fiscal`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/fiscal/summary` | KPIs consolidados, RCL nominal, % de pessoal e semáforos da LRF |
| `GET` | `/api/fiscal/painel-prefeito` | Visão executiva resumida, caixa livre vs vinculado, margem em R$ e Top 3 Decisões |
| `GET` | `/api/fiscal/receitas` | Arrecadação orçamentária por fonte (ICMS, ISS, IPTU, FPM) |
| `GET` | `/api/fiscal/despesas` | Execução orçamentária por função de governo e natureza de despesa |
| `GET` | `/api/fiscal/limites` | Limites legais da LRF (Pessoal 54%, Saúde 15%, Educação 25%, Dívida 120%) |
| `GET` | `/api/fiscal/radar-captacao` | Catálogo de programas abertos no Transferegov com status de elegibilidade municipal |
| `POST` | `/api/fiscal/radar-captacao/simular` | Simula valor de contrapartida necessária em R$ e avalia impacto no caixa livre |
| `GET` | `/api/fiscal/simulador-reforma` | Projeção ano a ano (2026-2033) da transição ICMS/ISS para IBS e medidas compensatórias |
| `POST` | `/api/fiscal/simulador-reforma/ajustar`| Recalcula a projeção tributária com base no esforço fiscal próprio |
| `GET` | `/api/fiscal/benchmark` | Comparativo pareado de municípios com RCL/hab, Arrecadação/hab e Score de Eficiência |
| `GET` | `/api/fiscal/selo-conformidade` | Certificado de conformidade fiscal, pontuação 0-100 e widget HTML incorporável |
| `GET` | `/api/fiscal/alertas-proativos` | Radar de prazos regulatórios (SICONFI, CAUC, LOA, Transferegov) e riscos da LRF |

---

## 🔄 3. Integração SICONFI & Ingestão Contábil (`/api/siconfi`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/siconfi/status` | Verifica conectividade e latência com a API de Dados Abertos do Tesouro Nacional |
| `POST` | `/api/siconfi/sync` | Dispara pipeline de sincronização e persistência de dados contábeis oficiais |
| `GET` | `/api/siconfi/logs` | Retorna o histórico e auditoria das sincronizações automáticas e manuais |

---

## 🏢 4. Gestão Multi-Tenant & Prefeituras (`/api/tenants` & `/api/municipios`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/tenants` | Lista todas as prefeituras cadastradas na plataforma |
| `GET` | `/api/municipios/auto-discovery` | Retorna o tenant configurado para o código IBGE informado |
| `GET` | `/health` | Healthcheck da aplicação e versão do backend NestJS |
