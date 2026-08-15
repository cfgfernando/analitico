# ESPECIFICAÇÃO DE PROJETO & PROMPT MESTRE — SAAS FISCAL MULTI-TENANT PARA PREFEITURAS

## 1. VISÃO DO PRODUTO

Sistema SaaS multi-tenant especializado no consumo de APIs públicas, portais de transparência e bases abertas governamentais (Siconfi/STN, Transferegov, Obrasgov, SIOPE, TCEs estaduais) para **PREFEITURAS MUNICIPAIS**, focado exclusivamente em **DADOS FINANCEIROS, CONTÁBEIS, FISCAIS E DE INVESTIMENTO PÚBLICO**.

Cada prefeitura opera como um "tenant" rigorosamente isolado.

### Ambientes do Sistema:
1. **Painel Administrativo Master (Provedor do SaaS)**:
   - Gestão de prefeituras clientes (Onboarding via CNPJ e Código IBGE de 7 dígitos).
   - Gerenciador de credenciais de APIs por prefeitura (chaves criptografadas).
   - Controle de planos, limites de usuários (`user_limit`) e faturamento mensal de usuários excedentes.
   - Monitoramento das rotinas de sincronização em segundo plano (BullMQ/Redis).
2. **Painel da Prefeitura (Workspace Municipal do Tenant)**:
   - Dashboard Executivo com semáforos de conformidade fiscal.
   - Análise de Receitas e Despesas com comparativo histórico e LOA.
   - Radar de Limites da Lei de Responsabilidade Fiscal (LRF) e alertas do TCE.
   - Gestão de Captação Externa (Emendas Parlamentares e Convênios Transferegov).
   - Matrizes do FUNDEB e SIOPE (Piso do Magistério).
   - Mapa Georreferenciado SVG de Obras Públicas e avanço físico-financeiro.
   - Diagnóstico Contábil Automatizado com Inteligência Artificial.
   - Gestão de Usuários Municipais com controle estrito de cotas do plano.

---

## 2. STACK TECNOLÓGICA (FIXA — NÃO ALTERAR)

- **Backend**: Node.js + TypeScript + **NestJS** (Arquitetura modular em camadas: Controllers, Services, Repositories, Workers, DTOs com `class-validator`).
- **Frontend**: React 18+ (SPA) + TypeScript + **Vite**.
- **Banco de Dados Relacional**: **MySQL 8.x**.
- **ORM**: **Prisma ORM** com extensões de isolamento automático de tenant.
- **Cache e Filas Assíncronas**: **Redis** + **BullMQ** (ingestão paralela de APIs, scraping e relatórios assíncronos).
- **Autenticação & Segurança**: JWT (Access Token stateless de 15 min + Refresh Token persistido com rotação) + `bcrypt`/`argon2` para senhas.
- **Criptografia de Dados em Repouso**: **AES-256-GCM** para chaves de API, certificados e segredos de cada prefeitura.
- **Infraestrutura e Deploy**: VPS Digital Ocean / Docker / docker-compose / Nginx (Reverse Proxy com HTTP/2 e SSL Certbot).
- **Faturamento e Cobrança**: Cobrança recorrente mensal por município com emissão e controle de NFSe (faturamento gerenciado).

---

## 3. DESIGN SYSTEM OBRIGATÓRIO — DSGOV.BR (PADRÃO DIGITAL DE GOVERNO)

TODO o frontend DEVE seguir estritamente o **Design System do Governo Federal (DSGov.br)**, disponível em https://www.gov.br/ds/home. Este é um requisito obrigatório e inegociável para garantir conformidade pública, autoridade institucional e acessibilidade.

### Regras de UI/UX Obrigatórias:
1. **Biblioteca Oficial**: Utilizar o pacote oficial `@govbr-ds/react-components` (npm). NUNCA criar componentes visuais básicos do zero quando houver equivalente oficial no DSGov.br.
2. **Tipografia Padrão**: Fonte institucional **Rawline** (com fallback obrigatório para *Raleway* e subsequentemente *sans-serif*). Respeitar a escala tipográfica, line-height e pesos de fonte (regular, semi-bold, bold) oficiais do padrão Gov.br.
3. **Tokens de Cores Oficiais**:
   - Primárias Institucionais: Azul Padrão Governo Federal (`#0c326f`, `#1351b4`, `#071d41`), Azul Claro e Branco.
   - Neutras: Escala de cinzas oficial do DSGov (`#f8f8f8`, `#ededed`, `#cccccc`, `#555555`, `#333333`).
   - Estados: Sucesso (Verde `#168821`), Erro (Vermelho `#e52207`), Alerta (Amarelo/Âmbar `#ffcd07`), Informativo (Azul `#155bcb`).
   - PROIBIDO inventar paletas fora dos design tokens do DSGov.br.
4. **Acessibilidade (WCAG 2.1 AA)**:
   - Taxa de contraste de texto e elementos interativos em conformidade AA.
   - Suporte nativo à navegação integral por teclado (tabulação e focus ring visível).
   - Semântica de cabeçalhos estrita (`h1` até `h6` sequenciais sem pular níveis).
   - Atributos `aria-label`, `aria-expanded`, `aria-live` e textos alternativos em gráficos e dados tabulares.
5. **Componentes Padrão do DSGov**:
   - `Header` institucional do Governo, `Footer`, `Button`, `Input`, `Select`, `Checkbox`, `Radio`, `Table`, `Modal`, `Alert/Message`, `Tabs`, `Breadcrumb`, `Pagination`, `DatePicker`, `Badge`, `Card`, `Tooltip`, `Divider`, `Loading/Spinner`.
6. **Grid e Espaçamento**: Grade responsiva de 12 colunas com gutter de 16px/24px, densidade de dados adaptada a painéis corporativos públicos e abordagem estritamente *mobile-first*.
7. **Estados Interativos**: Implementação completa de `hover`, `focus`, `active`, `disabled` e `loading` com a identidade visual do DSGov.
8. **Iconografia**: Uso exclusivo dos ícones oficiais do DSGov (Font Awesome 5/6 Free ou Font DSGov).
9. **Consistência de Identidade**: Tanto o painel Master SaaS Admin quanto o painel de cada Prefeitura compartilham a mesma linguagem visual DSGov. A customização por prefeitura restringe-se ao brasão/logo municipal e nome da entidade no Header.
10. **Validação e Mensageria**: Mensagens de erro de validação (inline e toasts) utilizando o componente oficial `Message` do DSGov.

---

## 4. REGRAS DE NEGÓCIO & MULTI-TENANCY

### 4.1. Isolamento Absoluto de Dados (Multi-Tenancy)
- Cada prefeitura é identificada por um `tenant_id` (UUIDv4) e código IBGE único de 7 dígitos.
- Todas as tabelas transacionais e contábeis possuem a coluna `tenant_id` indexada.
- **Middleware/Interceptor Global no NestJS**: O `tenant_id` é extraído do token JWT validado no backend. NUNCA confiar em `tenant_id` enviado no payload ou query string do cliente.
- **Prisma Extension / Tenant Filter**: Todas as consultas ao banco aplicam automaticamente a cláusula `where: { tenantId }` via contexto de execução assíncrono (`AsyncLocalStorage`).

### 4.2. Pacote Base e Gestão de Usuários (Licenciamento SaaS)
- **Pacote Básico Padrão**:
  - Toda nova prefeitura cadastrada tem direito no plano base a **até 2 (dois) usuários inclusos**:
    1. **Prefeito**: Acesso total de consulta a todos os módulos, aprovação de relatórios e gestão de usuários municipais.
    2. **Secretário de Finanças / Fazenda**: Acesso irrestrito a todos os módulos financeiros, contábeis e fiscais (sem poder de exclusão da entidade).
- **Cobrança por Usuário Excedente**:
  - Campo `user_limit` na tabela do Tenant (valor inicial padrão = 2).
  - Se a prefeitura desejar cadastrar novos usuários (ex: Controladoria Geral, Contador-Geral, Secretário de Obras, Secretário de Saúde, Secretário de Educação), cada usuário além do limite base acarreta uma taxa mensal adicional configurada no plano (ex: R$ 150,00/mês por usuário extra).
  - O sistema impede a criação de novos usuários se a contagem ativa atingir `user_limit`, instruindo o Prefeito a solicitar expansão de licença ao administrador do SaaS.
- **Níveis de Acesso & RBAC (Role-Based Access Control)**:
  - `MASTER_ADMIN` (Usuário do Provedor SaaS com acesso global ao painel master).
  - `PREFEITO` (Administrador do Tenant: visualização completa + convite e gestão de usuários municipais).
  - `SECRETARIO_FINANCAS` (Acesso total às receitas, despesas, LRF, FUNDEB e captações).
  - `CONTROLADORIA` (Acesso pleno de auditoria, alertas e conformidade TCE/STN, somente leitura analítica).
  - `SECRETARIA_SETORIAL` (Acesso restrito estritamente aos dados da pasta vinculada ao campo `secretaria` do usuário, ex: SMED apenas Educação, SMSA apenas Saúde, SMOP apenas Obras).
  - `VISUALIZADOR_GERAL` (Consulta de painéis consolidados de alto nível).
  - `PERFIL_CUSTOMIZADO` (Matriz granular de permissões por módulo: Leitura, Exportação, Diagnóstico IA).

### 4.3. Gestão de Credenciais e APIs por Prefeitura
- Cada prefeitura possui suas próprias configurações e credenciais de integração:
  - **Siconfi / Tesouro Nacional**: Código IBGE municipal + API Pública / Token de autenticação.
  - **Transferegov / Obrasgov**: Credenciais de convênios e transferências voluntárias da União.
  - **TCE Estadual** (ex: TCE-PR, TCE-SP, TCE-MG): Chaves de API para leitura de julgamento de contas e certidões.
  - **Portal da Transparência / ERP Local**: Conectores para extração de empenhos, liquidações e arrecadação diária.
- Todas as chaves secretas (`client_secret`, `api_token`, senhas de certificado) são gravadas no MySQL criptografadas com **AES-256-GCM** utilizando chave mestre definida em variável de ambiente segura (`ENCRYPTION_KEY`).

### 4.4. Sincronização Assíncrona de Dados (BullMQ + Redis)
- **Frequência Padrão**: 2 vezes ao dia (ex: 06:00 e 18:00 horário de Brasília).
- **Agendamento Dinâmico**: Cron expression customizável por fonte e por prefeitura na tabela `tenant_sync_configs`.
- **Execução em Fila (Workers)**: Filas separadas com controle de concorrência, retry automático com exponential backoff e logging detalhado de status de ingestão (`PENDING`, `RUNNING`, `SUCCESS`, `FAILED`).
- **Trigger Manual sob Demanda**: Usuários com permissão podem solicitar sincronização imediata respeitando rate-limit de segurança (máximo 1 trigger manual a cada 30 minutos).

### 4.5. Multi-Exercício Histórico
- Suporte nativo a múltiplos exercícios financeiros (anos fiscais, ex: 2023, 2024, 2025, 2026).
- Todos os endpoints de consulta financeira aceitam o parâmetro `ano` (exercício), preservando a série histórica contábil do município.

---

## 5. REGRAS DE CÁLCULO E CONCEITOS FISCAIS OBRIGATÓRIOS

1. **Receita Corrente Líquida (RCL)**:
   - Soma das receitas correntes tributárias, de contribuições, patrimoniais, agropecuárias, industriais, de serviços e transferências correntes nos últimos 12 meses, deduzidas as contribuições dos servidores para o RPPS e compensações financeiras entre regimes. Base legal: Art. 2º, IV da LRF (LC 101/2000).
2. **Despesa Liquidada vs. Empenhada vs. Paga**:
   - *Empenhada*: Reserva orçamentária prévia.
   - *Liquidada*: Verificação do direito adquirido pelo credor após entrega do bem ou serviço (estágio contábil determinante para apuração de limites constitucionais).
   - *Paga*: Efetiva emissão de ordem bancária.
3. **Limites de Despesa com Pessoal (Poder Executivo Municipal)**:
   - Limite Máximo Legal: **54,00%** da RCL (Art. 19 e 20 da LRF).
   - Limite Prudencial: **51,30%** da RCL (95% do limite legal - Art. 22, parágrafo único). Vedações imediatas a horas extras, reajustes e contratações.
   - Limite de Alerta do TCE: **48,60%** da RCL (90% do limite legal - Art. 59, § 1º, II). Emissão formal de notificação de alerta pelo Tribunal de Contas.
4. **Piso Constitucional da Saúde**:
   - Aplicação mínima obrigatória de **15,00%** da receita resultante de impostos e transferências constitucionais (Art. 198, § 2º, III da CF/88 e LC 141/2012).
5. **Piso Constitucional da Educação (MDE)**:
   - Aplicação mínima obrigatória de **25,00%** da receita de impostos e transferências na Manutenção e Desenvolvimento do Ensino (Art. 212 da CF/88).
6. **Subvinculação do FUNDEB ao Magistério**:
   - Aplicação mínima de **70,00%** dos recursos do FUNDEB na remuneração dos profissionais da educação básica em efetivo exercício (Art. 212-A, XI da CF/88 e Lei 14.113/2020).

---

## 6. MODELO DE DADOS CONCEITUAL (PRISMA SCHEMA)

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum TenantStatus {
  ATIVO
  SUSPENSO
  INADIMPLENTE
  CANCELADO
  EM_IMPLANTACAO
}

enum UserRole {
  MASTER_ADMIN
  PREFEITO
  SECRETARIO_FINANCAS
  CONTROLADORIA
  SECRETARIA_SETORIAL
  VISUALIZADOR_GERAL
  CUSTOMIZADO
}

enum SyncStatus {
  PENDENTE
  EM_EXECUCAO
  SUCESSO
  ERRO
}

model Tenant {
  id                  String       @id @default(uuid())
  codigoIbge          String       @unique @map("codigo_ibge") @db.VarChar(7)
  nomePrefeitura      String       @map("nome_prefeitura") @db.VarChar(255)
  cnpj                String       @unique @db.VarChar(18)
  estadoUf            String       @map("estado_uf") @db.VarChar(2)
  status              TenantStatus @default(EM_IMPLANTACAO)
  
  // Limites e Faturamento SaaS
  planoNome           String       @default("Plano Básico Municipal") @map("plano_nome")
  valorMensalBase     Decimal      @map("valor_mensal_base") @db.Decimal(10, 2)
  userLimit           Int          @default(2) @map("user_limit")
  valorPorUsuarioExtra Decimal     @default(150.00) @map("valor_usuario_extra") @db.Decimal(10, 2)
  diaVencimento       Int          @default(10) @map("dia_vencimento")
  
  // Contatos Institucionais
  emailFaturamento    String       @map("email_faturamento")
  telefoneContato     String?      @map("telefone_contato")
  
  createdAt           DateTime     @default(now()) @map("created_at")
  updatedAt           DateTime     @updatedAt @map("updated_at")

  // Relacionamentos
  users               User[]
  apiConfigs          TenantApiConfig[]
  syncConfigs         TenantSyncConfig[]
  invoices            SaaSInvoice[]
  financialRecords    FinancialSummary[]

  @@map("tenants")
}

model User {
  id              String       @id @default(uuid())
  tenantId        String?      @map("tenant_id")
  nomeCompleto    String       @map("nome_completo") @db.VarChar(255)
  cpf             String       @unique @db.VarChar(14)
  email           String       @unique @db.VarChar(255)
  senhaHash       String       @map("senha_hash") @db.VarChar(255)
  role            UserRole     @default(SECRETARIA_SETORIAL)
  secretaria      String?      @db.VarChar(100) // Ex: "SMOP", "SMED", "SMSA"
  ativo           Boolean      @default(true)
  ultimoAcesso    DateTime?    @map("ultimo_acesso")
  
  createdAt       DateTime     @default(now()) @map("created_at")
  updatedAt       DateTime     @updatedAt @map("updated_at")

  tenant          Tenant?      @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@map("users")
}

model TenantApiConfig {
  id                  String   @id @default(uuid())
  tenantId            String   @map("tenant_id")
  providerName        String   @map("provider_name") @db.VarChar(50) // "SICONFI", "TRANSFEREGOV", "TCE_PR", "ERP_LOCAL"
  baseUrl             String   @map("base_url") @db.VarChar(500)
  authType            String   @default("NONE") @map("auth_type") // "NONE", "BEARER", "BASIC", "API_KEY", "CERTIFICATE"
  encryptedApiKey     String?  @map("encrypted_api_key") @db.Text
  encryptedSecretKey  String?  @map("encrypted_secret_key") @db.Text
  customHeadersJson   String?  @map("custom_headers_json") @db.Text
  ativo               Boolean  @default(true)
  
  updatedAt           DateTime @updatedAt @map("updated_at")
  tenant              Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, providerName])
  @@map("tenant_api_configs")
}

model TenantSyncConfig {
  id              String     @id @default(uuid())
  tenantId        String     @map("tenant_id")
  fonteDado       String     @map("fonte_dado") @db.VarChar(50) // "RCL", "RECEITAS", "DESPESAS", "EMENDAS", "OBRAS"
  cronExpression  String     @default("0 6,18 * * *") @map("cron_expression")
  ultimaExecucao  DateTime?  @map("ultima_execucao")
  proximaExecucao DateTime?  @map("proxima_execucao")
  ultimoStatus    SyncStatus @default(PENDENTE) @map("ultimo_status")
  logMensagem     String?    @map("log_mensagem") @db.Text
  
  tenant          Tenant     @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, fonteDado])
  @@map("tenant_sync_configs")
}

model SaaSInvoice {
  id                  String    @id @default(uuid())
  tenantId            String    @map("tenant_id")
  mesReferencia       Int       @map("mes_referencia")
  anoReferencia       Int       @map("ano_referencia")
  valorBase           Decimal   @map("valor_base") @db.Decimal(10, 2)
  quantidadeUsuarios  Int       @map("quantidade_usuarios")
  usuariosExcedentes  Int       @map("usuarios_excedentes")
  valorUsuariosExtras Decimal   @map("valor_usuarios_extras") @db.Decimal(10, 2)
  valorTotal          Decimal   @map("valor_total") @db.Decimal(10, 2)
  dataVencimento      DateTime  @map("data_vencimento")
  dataPagamento       DateTime? @map("data_pagamento")
  status              String    @default("PENDENTE") // "PENDENTE", "PAGO", "CANCELADO", "ATRASADO"
  numeroNfse          String?   @map("numero_nfse")
  linkBoletoPix       String?   @map("link_boleto_pix")
  
  tenant              Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@map("saas_invoices")
}

model FinancialSummary {
  id                  String   @id @default(uuid())
  tenantId            String   @map("tenant_id")
  exercicioAno        Int      @map("exercicio_ano")
  bimestre            Int      @default(6) // 1 a 6
  receitaPrevista     Decimal  @map("receita_prevista") @db.Decimal(15, 2)
  receitaArrecadada   Decimal  @map("receita_arrecadada") @db.Decimal(15, 2)
  despesaFixada       Decimal  @map("despesa_fixada") @db.Decimal(15, 2)
  despesaLiquidada    Decimal  @map("despesa_liquidada") @db.Decimal(15, 2)
  receitaCorrenteLiq  Decimal  @map("receita_corrente_liquida") @db.Decimal(15, 2)
  gastoPessoalTotal   Decimal  @map("gasto_pessoal_total") @db.Decimal(15, 2)
  percentualPessoalRcl Decimal @map("percentual_pessoal_rcl") @db.Decimal(5, 2)
  aplicacaoSaude      Decimal  @map("aplicacao_saude") @db.Decimal(5, 2)
  aplicacaoEducacao   Decimal  @map("aplicacao_educacao") @db.Decimal(5, 2)
  updatedAt           DateTime @updatedAt @map("updated_at")

  tenant              Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, exercicioAno, bimestre])
  @@map("financial_summaries")
}
```

---

## 7. ESTRUTURA DOS MÓDULOS E PAINÉIS

### Módulo A: Painel Administrativo Central do Provedor (SaaS Master Admin)
1. **Dashboard de Faturamento & Operações**: MRR, prefeituras ativas/em implantação, usuários faturados e status das filas BullMQ.
2. **Cadastro & Gestão de Prefeituras**: Formulário DSGov para inclusão de novo município (IBGE, CNPJ, dados de faturamento, pacotes).
3. **Configurador de APIs & Chaves**: Gerenciamento das credenciais criptografadas de cada prefeitura para conexão aos sistemas oficiais.
4. **Monitor de Sincronização & Logs**: Painel em tempo real das execuções agendadas, erros de ingestão e disparos manuais.
5. **Gestor de Faturamento & NFSe**: Emissão manual/controlada de faturas mensais computando a mensalidade base + taxa por usuário adicional ativo.

### Módulo B: Painel Municipal do Tenant (Visão da Prefeitura)
1. **Módulo 01: Dashboard Executivo & KPIs**:
   - Cards de Receita Arrecadada, Despesa Liquidada, Superávit/Déficit Corrente, RCL Acumulada.
   - Semáforos de Alerta com tooltips conceituais explicativos.
   - Radar de Execução Orçamentária e Limites Constitucionais (D3 / Recharts).
2. **Módulo 02: Receitas Orçamentárias**:
   - Arrecadação por fonte (ICMS/REPAR, ISS, IPTU, ITBI, FPM, Royalties).
   - Análise de desvio orçamentário em relação à LOA e projeções de arrecadação.
3. **Módulo 03: Despesas & Funções de Governo**:
   - Execução por função (Saúde, Educação, Obras, Urbanismo, Segurança, Assistência Social).
   - Desdobramento por natureza de despesa (Pessoal, Custeio, Investimentos).
4. **Módulo 04: Limites Fiscais & LRF (TCE/STN)**:
   - Acompanhamento da folha de pessoal (alerta 48,6%, prudencial 51,3%, legal 54%).
   - Piso da saúde (15%), piso da educação (25%) e endividamento consolidado líquido.
   - Sistema de notificações ativas de limites com histórico de conformidade.
5. **Módulo 05: Captação Externa & Transferegov**:
   - Acompanhamento de emendas parlamentares (individuais, bancada, relator) e convênios federais/estaduais.
   - Notificação visual de novos repasses creditados nos últimos 7 dias.
6. **Módulo 06: FUNDEB & SIOPE**:
   - Monitoramento do piso do magistério (70%/74,2%).
   - Complementação VAAT (Valor Aluno Ano Total) e VAAR (Valor Aluno Ano por Resultados).
7. **Módulo 07: Mapa de Obras & Infraestrutura**:
   - Mapa vetorial SVG interativo e georreferenciado com filtros por secretaria (SMOP, SMSA, SMED), status da obra (Em Execução, Em Licitação, Concluída) e fonte de recurso.
   - Ficha técnica lateral com medição física vs. financeira.
8. **Módulo 08: Diagnóstico Inteligente & Parecer Automatizado**:
   - Geração de pareceres fiscais de conformidade para audiências públicas e prestação de contas com Inteligência Artificial.
9. **Módulo 09: Gestão de Usuários Municipais**:
   - Controle de acessos internos do município com trava de limite de 2 usuários inclusos no plano base e solicitação de usuários adicionais.

---

## 8. DIRETRIZES DE IMPLEMENTAÇÃO E CODIFICAÇÃO

- **Tratamento de Exceções**: Retornar respostas estruturadas no padrão RFC 7807 (Problem Details).
- **Validação de DTOs**: Uso estrito de `class-validator` e `class-transformer` no NestJS.
- **Log Centralizado**: Logs estruturados em formato JSON (Winston/Pino) com identificação do `tenant_id` e `user_id`.
- **Proteção contra Vazamento de Dados**: Testes automatizados de isolamento de tenant em todos os endpoints de listagem e mutação.
- **Acessibilidade DSGov**: Testes com navegação exclusiva por teclado e leitores de tela em todos os formulários e tabelas.
