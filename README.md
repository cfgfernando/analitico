# 📊 Plataforma de Inteligência Fiscal e Gestão Estratégica para Prefeituras (V4.0.0)

Sistema SaaS Multi-Tenant corporativo para governança orçamentária, inteligência contábil e tomada de decisão de prefeitos e secretários de fazenda municipais.

---

## 🌟 Principais Funcionalidades da Versão 4.0.0

1. **Painel do Prefeito (Gabinete Executivo)**:
   - Semáforo Fiscal consolidado com parecer simplificado.
   - Segregação de Caixa: Saldo Livre (recursos desvinculados) vs Saldo Vinculado (Saúde, Educação, FUNDEB).
   - **Margem da Folha de Pagamento em R$ Nominais** até os limites de Alerta, Prudencial e Legal da LRF.
   - **Top 3 Decisões Urgentes da Semana** com prazo, impacto orçamentário em R$ e ação sugerida ao Chefe do Executivo.

2. **Radar de Captação Ativo (Transferegov & Convênios)**:
   - Catálogo de editais e programas federais/estaduais abertos.
   - **Algoritmo de Elegibilidade Municipal**: Checagem de adimplência no CAUC, limite de pessoal da LRF e CAPAG.
   - **Simulador de Contrapartida**: Cálculo do impacto financeiro do aporte municipal no caixa livre.

3. **Simulador de Cenários da Reforma Tributária (EC 132/2023)**:
   - Projeção ano a ano (**2026 a 2033**) da transição gradual de ICMS/ISS para o **IBS no destino**.
   - Modelagem do **Fundo de Compensação de Perdas da EC 132 (Art. 131 ADCT)**.
   - Plano de Ação Estratégico com 4 Medidas Compensatórias de Arrecadação Própria (PGV/IPTU, CIP, ISSQN Bancário e Dívida Ativa).

4. **Benchmark Regional & Eficiência Fiscal**:
   - Pareamento automático de municípios por porte e região geográfica.
   - Indicadores per capita padronizados: RCL/hab, Arrecadação Própria/hab e Investimento/hab.
   - Score Geral de Eficiência Fiscal (0 a 100 pontos) e ranking comparativo.

5. **Selo de Conformidade Fiscal & Certificado Oficial**:
   - Auditoria dos 6 pilares legais (Folha LRF, Educação 25%, Saúde 15%, CAUC, Dívida Consolidada e SICONFI).
   - Certificado Oficial de Alta Resolução assinado digitalmente com código de autenticidade SHA-256 para impressão e prestígio político.
   - Widget HTML incorporável para exibição no Portal da Transparência do município.

6. **Radar de Alertas Proativos & Prazos Críticos**:
   - Monitoramento 24/7 de vencimentos de certidões do CAUC, prazos do SICONFI (RREO/RGF), envio da LOA e prestação de contas no Transferegov.
   - Contagem regressiva em dias, sanção prevista em lei e plano de ação imediato.

7. **Transparência de Dados (`DataSourceBadge`)**:
   - Rastreabilidade total com badges visuais `[OFICIAL]` (verde) e `[DEMONSTRAÇÃO]` (âmbar).

---

## 🛠️ Stack Tecnológica

- **Backend**: NestJS 11 + Express + Prisma ORM 6 + MySQL 8 + TypeScript.
- **Frontend**: React 19 + TypeScript + Tailwind CSS 4 + Lucide Icons + Motion.
- **Segurança**: Criptografia AES-256-GCM, JWT com rotação de refresh tokens, Helmet, CORS restrito e Rate Limiting.
- **Design System**: Segue rigorosamente o padrão do Gov.br (DSGov) e fontes monoespaciadas JetBrains Mono para dados numéricos.

---

## 🚀 Como Executar o Projeto

### 1. Pré-requisitos
- Node.js 20+ ou 22+
- MySQL 8 instalado e rodando
- Git

### 2. Instalação e Configuração

```bash
# Clone o repositório
git clone https://github.com/cfgfernando/analitico.git
cd analitico

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com as credenciais do seu banco MySQL e chaves de segurança
```

### 3. Banco de Dados e Migrations

```bash
# Gere o cliente do Prisma ORM
npm run prisma:generate

# Execute as migrações no MySQL
npx prisma migrate dev
```

### 4. Executando em Desenvolvimento

```bash
# Inicia o servidor NestJS integrado com o Vite
npm run dev
```
Acesse a aplicação no navegador em: `http://localhost:3000`

---

## 🧪 Execução de Testes Automatizados

O sistema conta com **150 testes automatizados** cobrindo todas as 12 fases do projeto:

```bash
# Executa toda a suíte de testes unificada
npm run test:all
```

---

## 📦 Build para Produção

```bash
# Compila o frontend e o bundle do servidor NestJS
npm run build

# Inicia em ambiente de produção
npm start
```
