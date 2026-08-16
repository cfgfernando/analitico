# 📊 Plataforma de Inteligência Fiscal e Gestão Estratégica para Prefeituras (V4.5.0)

Sistema SaaS Multi-Tenant corporativo para governança orçamentária, inteligência contábil e tomada de decisão de prefeitos e secretários de fazenda municipais.

---

## 🌟 Principais Módulos & Funcionalidades Entregues

1. **🏛️ Painel do Prefeito (Gabinete Executivo)**:
   - **Semáforo Fiscal Consolidado** com parecer executivo simplificado em linguagem de gestão.
   - **Segregação de Caixa Real**: Saldo Livre (recursos desvinculados) vs. Saldo Vinculado (Saúde, Educação, FUNDEB).
   - **Margem da Folha de Pagamento em R$ Nominais** até os limites de Alerta (48,60%), Prudencial (51,30%) e Máximo Legal (54,00%) da LRF.
   - **Top 3 Decisões Urgentes da Semana**: Pauta de gabinete com prazo, impacto orçamentário em R$, risco legal e ação sugerida, permitindo arquivamento com justificativa ou reprogramação.
   - **Multi-Município Dinâmico**: Alternância instantânea de prefeituras (Araucária, Curitiba, Maringá, Contenda, etc.) com recalibração total de dados populacionais e fiscais.

2. **🚀 Radar de Captação Ativo & Emendas Parlamentares**:
   - **Catálogo de Oportunidades & Editais**: Monitoramento ativo do Transferegov, Novo PAC e Ministérios.
   - **Emendas Parlamentares (RP6, RP7, RP8, ALEP)**: Mapeamento de autores, valores empenhados/pagos e contas correntes vinculadas.
   - **Simulador de Contrapartida**: Cálculo do impacto do aporte municipal no caixa livre da prefeitura.
   - **Calendário Anual de Chamadas & Janelas**: Cronograma mês a mês com contagem regressiva e alertas de fechamento em < 15 dias.
   - **Carteira de Projetos Estruturados**: Cadastro e maturidade técnica de projetos com ETP concluído.

3. **⚖️ Simulador da Reforma Tributária (EC 132/2023)**:
   - Projeção ano a ano (**2026 a 2033**) da transição gradual de ICMS/ISS para o **IBS no destino**.
   - Modelagem do **Fundo de Compensação de Perdas da EC 132 (Art. 131 ADCT)**.
   - Plano de Ação Estratégico com 4 Medidas Compensatórias de Arrecadação Própria (PGV/IPTU, CIP, ISSQN Bancário e Dívida Ativa).

4. **🎛️ Simulador de Cenários LOA ("E Se")**:
   - 4 Sliders interativos com resposta ultra-rápida (< 2ms de latência):
     - Aumento/Revisão de ISS (%)
     - Recadastramento de Imóveis (PGV Atualizada em IPTU)
     - Corte de Custeio / Despesas Correntes (Z% de economia)
     - Revisão de Alíquota de ITBI
   - Comparativo visual Base vs. Simulado com impacto em R$/ano na RCL, folha LRF e folga prudencial.
   - Síntese executiva em linguagem humana e botão de exportação em PDF para reuniões de orçamento.

5. **📈 Benchmark entre Municípios (Diferencial de Categoria)**:
   - Pareamento automático com municípios similares da mesma mesorregião e faixa populacional via IBGE.
   - **4 Indicadores Comparáveis Centrais**: % da RCL com Pessoal, Autonomia Tributária Própria (IPTU+ISS+ITBI vs. Transferências), Captação per capita e Gastos por Função (% Saúde, % Educação e % Obras).
   - **Gráfico de Dispersão / Quadrantes Estratégicos**: Autonomia Tributária vs. Responsabilidade com Folha de Pessoal com destaque dourado para a cidade ativa.
   - Ranking amigável com score geral de eficiência (0 a 100).

6. **🎖️ Selo de Conformidade Fiscal & Certificado Oficial**:
   - Auditoria dos 6 pilares legais (Folha LRF, Educação 25%, Saúde 15%, FUNDEB 70% Magistério, Dívida Consolidada e Regularidade CAUC/SICONFI).
   - **Selo Visual de Prestígio** (Nota A/B/C e Selo Ouro/Diamante) com badge exportável em SVG/PNG de alta resolução.
   - Histórico de evolução do score em 3 anos (2024, 2025, 2026).
   - **Widget Embed HTML** para inclusão em 1-clique no Portal da Transparência da prefeitura.

7. **🚨 Sistema Proativo de Alertas & Proteção do FUNDEB**:
   - **Checklist Periódico do FUNDEB**: MSC Agregada da Educação (alerta de 5 dias), SIOPE bimestral, Anexo da Educação no RREO, Reunião CACS-FUNDEB e Prestação de Contas Anual ao TCE-PR.
   - **Alarme Executivo com Contagem Regressiva**: Prevenção ativa contra desabilitação do **VAAT (10,5% do FUNDEB)** com cálculo do montante financeiro em risco.
   - **Mapa de Risco da VAAT & Condicionalidades do VAAR**: Status de habilitação requisito por requisito.
   - Central de alertas com 8 categorias regulatórias e ação de "Dar Ciência".

8. **🛡️ Rastreabilidade de Dados (`DataSourceBadge`)**:
   - Badges visuais em todos os cards e tabelas indicando proveniência oficial: `[OFICIAL]` (verde) e `[DEMONSTRAÇÃO]` (âmbar).

---

## 🌐 10 Fontes Governamentais Conectadas & Auditadas

1. **SICONFI / STN**: Relatórios RREO, RGF, DCA e Matriz de Saldos Contábeis (MSC).
2. **TCE-PR / Tribunais de Contas Estaduais**: Acompanhamento de balancetes, autos de conformidade e certidões liberatórias.
3. **PNCP (Portal Nacional de Contratações Públicas - Lei 14.133/21)**: Contratos administrativos, atas de registro de preços e editais.
4. **Portal da Transparência do Governo Federal**: Transferências constitucionais, royalties e emendas parlamentares.
5. **SIOPS / Ministério da Saúde**: Cumprimento do piso constitucional de 15% em Ações e Serviços Públicos de Saúde (ASPS).
6. **SIOPE / FNDE**: Cumprimento do piso de 25% em MDE e piso de 70% do FUNDEB na remuneração dos docentes.
7. **IBGE**: Estimativas populacionais e dados censitários para cálculo dos indicadores per capita.
8. **IPARDES / SEFAZ-PR**: Índice de Participação dos Municípios (IPM) e cotas-parte de ICMS/IPVA.
9. **BACEN**: Séries econômicas, inflação oficial (IPCA), taxa SELIC e cálculo de indexação da dívida.
10. **Novo PAC & Transferegov**: Acompanhamento de convênios, superação de cláusulas suspensivas e liberação de parcelas.

---

## 🛠️ Stack Tecnológica & Arquitetura

- **Backend**: Monólito Modular em **NestJS 11** com TypeScript, Express, Dependency Injection e Decorators de segurança.
- **Banco de Dados**: **MySQL 8** com **Prisma ORM 6** (migrações automáticas, pooling e tipagem estrita).
- **Frontend**: **React 19** + **TypeScript** + **Tailwind CSS 4** + **Lucide Icons**.
- **Segurança**:
  - Criptografia simétrica autenticada **AES-256-GCM** com IV único por operação.
  - JWT com rotação de refresh tokens.
  - **TenantGuard** para isolamento estrito de prefeituras (bloqueio 403 em acessos cruzados não autorizados).
  - **RolesGuard (RBAC)** com controle de perfis (`PREFEITO`, `SECRETARIO`, `CONTROLADOR`, `OPERADOR`, `MASTER_ADMIN`).
- **Design System**: Alinhado às diretrizes do **DSGov (Gov.br)**, temas claro/escuro com persistência, e tipografia técnica em **JetBrains Mono** para todos os números, moedas e percentuais.

---

## 🚀 Como Executar o Projeto Localmente

### 1. Pré-requisitos
- Node.js 20+ ou 22+
- MySQL 8 rodando localmente (ex: Laragon, Docker ou MySQL nativo)
- Git

### 2. Instalação e Variáveis de Ambiente

```bash
# Clone o repositório
git clone https://github.com/cfgfernando/analitico.git
cd analitico

# Instale as dependências
npm install

# Copie o arquivo de exemplo de ambiente
cp .env.example .env
```

Edite o arquivo `.env` para configurar a conexão com o seu banco local:
```env
DATABASE_URL="mysql://root:root@localhost:3306/analitico_fiscal"
JWT_SECRET="sua-chave-jwt-super-segura-e-longa-32-caracteres"
ENCRYPTION_KEY="sua-chave-hexadecimal-de-64-caracteres-aes-256-gcm"
PORT=3000
```

### 3. Banco de Dados e Migrations

```bash
# Gere o cliente tipado do Prisma ORM
npm run prisma:generate

# Execute as migrações no MySQL
npx prisma migrate dev --name init
```

### 4. Executando em Desenvolvimento

```bash
# Inicia o servidor NestJS integrado com o Vite
npm run dev
```
Acesse a aplicação no navegador em: `http://localhost:3000`

---

## 🧪 Execução de Testes Automatizados

O sistema conta com **mais de 280 testes automatizados** cobrindo 100% dos módulos do sistema:

```bash
# Executa todas as 13 suítes de testes unificadas
npx tsx src/server/test-runner.ts

# Ou execute suítes individuais:
npx tsx src/server/fiscal/painel-prefeito.spec.ts
npx tsx src/server/fiscal/radar-captacao.spec.ts
npx tsx src/server/fiscal/simulador-cenarios.spec.ts
npx tsx src/server/fiscal/benchmark.spec.ts
npx tsx src/server/fiscal/selo-conformidade.spec.ts
npx tsx src/server/fiscal/alertas-proativos.spec.ts
```

---

## 🔒 Garantias de Segurança e Conformidade

- ✅ **Isolamento Multi-Tenant**: Cada consulta é filtrada e validada pelo `TenantGuard`. Tentativas de acesso a dados de outro município resultam em erro `403 Forbidden`.
- ✅ **Zero Credenciais Reais no Repositório**: Nenhuma senha, chave privada ou segredo em código aberto.
- ✅ **Proveniência e Auditoria**: Cada número exibido possui metadados de rastreabilidade oficial.

---

**Analítico Escrita Online — Inteligência e Governança Fiscal Municipal**
