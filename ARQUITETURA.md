# 🏛️ ARQUITETURA DO SISTEMA — SAAS FISCAL MULTI-TENANT (V4.0.0)

Este documento descreve a arquitetura técnica, os padrões de projeto, o fluxo de dados e os mecanismos de segurança implementados na versão **V4.0.0** da plataforma de inteligência fiscal para prefeituras brasileiras.

---

## 1. Visão Geral da Arquitetura

O sistema adota o padrão **Monólito Modular** construído sobre o ecossistema **NestJS + Express**, integrando o frontend SPA em **React 19 + TypeScript + Tailwind CSS** servido através do middleware do **Vite**.

```
                           ┌──────────────────────────────────────────────┐
                           │            CLIENTE (SPA REACT 19)            │
                           │  • Design System Gov.br (DSGov)              │
                           │  • JetBrains Mono para dados numéricos       │
                           │  • Tailwind CSS + Lucide Icons + Motion      │
                           └──────────────────────┬───────────────────────┘
                                                  │ HTTPS / JWT Bearer
                                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                             BACKEND MONÓLITO MODULAR (NESTJS)                               │
│                                                                                             │
│  ┌─────────────────┐   ┌──────────────────┐   ┌──────────────────┐   ┌───────────────────┐  │
│  │ Security Module │   │   Auth & RBAC    │   │  Tenant Module   │   │  Database Module  │  │
│  │ (Helmet, CORS,  │   │  (JWT, Refresh,  │   │ (Multi-Tenancy,  │   │ (Prisma ORM,      │  │
│  │ Rate Limiting,  │   │  Guards, Roles:  │   │  IBGE Auto-Disc, │   │  MySQL 8 Repo,    │  │
│  │ AES-256-GCM)    │   │  PREFEITO, SEC)  │   │  Tenants Guard)  │   │  FinancialRecord) │  │
│  └─────────────────┘   └──────────────────┘   └──────────────────┘   └───────────────────┘  │
│                                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                 FISCAL CORE MODULE                                    │  │
│  │  • Motor de Diagnóstico LRF (Pessoal, Saúde, Educação, DCL)                           │  │
│  │  • Painel do Prefeito (5 Cards Executivos, Margem da Folha em R$, Top 3 Decisões)     │  │
│  │  • Radar de Captação Ativo (Transferegov, Elegibilidade CAUC, Simulador Contrapartida)│  │
│  │  • Simulador de Cenários Reforma Tributária EC 132/2023 (IBS 2026-2033 & ADCT 131)   │  │
│  │  • Benchmark Municipal Regional (Pareamento por porte, RCL/hab e Score Eficiência)   │  │
│  │  • Selo de Conformidade Fiscal (Certificado Oficial SHA-256 e Widget Embeddable)      │  │
│  │  • Alertas Proativos & Prazos Críticos (SICONFI, CAUC, LOA, Transferegov)             │  │
│  └───────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                  │                                          │
│  ┌───────────────────────────────────────────────┴───────────────────────────────────────┐  │
│  │                                SICONFI INTEGRATION MODULE                             │  │
│  │  • SiconfiClient (Resilient HTTP com Timeout 8s e Exponential Backoff)                │  │
│  │  • SiconfiSyncService (Cron Jobs 06:00 / 18:00, Ingestão RREO/RGF e SyncLog)          │  │
│  └───────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┬──────────────────────────────────────────┘
                                                   │
                                ┌──────────────────┴──────────────────┐
                                │                                     │
                                ▼                                     ▼
                ┌───────────────────────────────┐     ┌───────────────────────────────┐
                │   PERSISTÊNCIA (MYSQL 8)      │     │  APIS GOVERNAMENTAIS EXTERNAS │
                │  • Prisma ORM Client          │     │  • SICONFI (Tesouro Nacional) │
                │  • 9 Tabelas Relacionais      │     │  • Transferegov / SICONV      │
                │  • Tenant Isolation Estrito   │     │  • TCE / SIAFI / CAUC         │
                └───────────────────────────────┘     └───────────────────────────────┘
```

---

## 2. Padrão de Multi-Tenancy e Isolamento de Dados

A plataforma suporta múltiplas prefeituras simultaneamente garantindo **isolamento lógico estrito** através das seguintes camadas:

1. **Auto-Descoberta Municipal**: Mapeamento do município a partir do código IBGE (`4101804` para Araucária, `4106902` para Curitiba, etc.) ou cabeçalho `x-tenant-id`.
2. **Guards e Interceptors NestJS**:
   - `TenantGuard`: Bloqueia requisições cruzadas (ex: usuário autenticado no Município A tentando acessar dados do Município B retorna `403 Forbidden`).
   - `TenantInterceptor`: Injeta automaticamente o contexto do tenant na requisição.
3. **Persistência Segregada**: Todas as tabelas de dados contábeis, logs e usuários possuem a coluna `tenantId` indexada, com consultas sempre filtradas pelo tenant ativo.

---

## 3. Segurança, Criptografia e RBAC

- **Criptografia Simétrica em Repouso**: Chaves de API, credenciais do Siconfi e tokens de terceiros são cifrados utilizando **AES-256-GCM** com vetor de inicialização (IV) de 12 bytes e tag de autenticação de 16 bytes (`enc:v1:iv:tag:data`).
- **Autenticação JWT com Rotação**:
  - `Access Token`: Assinado com algoritmo HS256, validade curta de 15 minutos.
  - `Refresh Token`: Cifrado e armazenado no banco com rotação obrigatória a cada renovação (validade de 7 dias).
- **Controle de Acesso Baseado em Funções (RBAC)**:
  - `MASTER_ADMIN`: Gestão global da plataforma e faturamento SaaS.
  - `PREFEITO`: Acesso executivo total ao painel do chefe do executivo, decisões urgentes e selo.
  - `SECRETARIO_FAZENDA`: Acesso analítico aos demonstrativos orçamentários, LRF e simulações.
  - `AUDITOR_CONTABIL`: Consulta e auditoria de demonstrativos contábeis e SICONFI.
- **Proteção de Rede**:
  - `Helmet`: Headers de segurança (CSP, HSTS, X-Frame-Options).
  - `CORS`: Restrição estrita de origens permitidas via variável de ambiente.
  - `Rate Limiter`: Proteção contra ataques de força bruta (100 reqs/15 min por IP).

---

## 4. Rastreabilidade e Transparência de Dados (`DataSourceBadge`)

Seguindo o princípio de integridade de dados públicos:
- Todos os endpoints e componentes visuais anexam o objeto de metadados `dataSource`.
- As origens são explicitamente classificadas em:
  - `[OFICIAL]`: Dados homologados diretamente do SICONFI, RREO, RGF ou TCE.
  - `[DEMONSTRAÇÃO]`: Estimativas, modelos econométricos da LOA ou dados simulados para municípios sem histórico completo sincronizado.

---

## 5. Modelagem da Reforma Tributária (EC 132/2023)

O motor fiscal projeta o impacto da migração tributária para o período **2026 a 2033**:
- **2026**: Alíquota teste de 0,1% do IBS.
- **2027**: Entrada da CBS Federal e extinção do PIS/Cofins; transição inicial do ICMS.
- **2029 a 2032**: Redução anual progressiva de 10% na arrecadação de ICMS e ISS (10%, 20%, 30%, 40%) substituídos pelo IBS no destino.
- **2033**: Plena vigência do IBS no destino e extinção integral do ICMS/ISS.
- **Fundo de Compensação Federativo (Art. 131 ADCT)**: Aplicação automática da regra de amortização para municípios com perfil industrial perdedores na transição origem -> destino.
