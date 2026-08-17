# 🏛️ DESIGN.md — Especificações de Telas e Navegação

Este documento especifica o fluxo visual, layout de telas e padrões de interação para os diferentes portais do sistema.

---

## 1. Portais e Telas do Sistema

### 1.1. Tela de Login Unificada de Prefeituras (`TenantLoginPage`)
- **Objetivo**: Entrada de todos os usuários municipais (Prefeitos, Secretários, Auditores, Fiscais).
- **Branding**: Vitrine da empresa dona do SaaS (*Escrita.Online*), com apresentação institucional, selos de segurança e confiabilidade de dados abertos (Siconfi, TCE, Transferegov).
- **Comportamento Interativo**:
  - Input inteligente que aceita **E-mail** ou **CPF** (com formatação automática).
  - Feedback visual dinâmico com exibição do brasão e nome da prefeitura detectada assim que o usuário digita seus dados.
  - Validação de senha segura com opção de exibir/ocultar senha.
  - Link de atalho direto para o portal administrativo de provedores (*Acesso Super Admin*).

### 1.2. Tela de Login do Super Admin SaaS (`AdminLoginPage`)
- **Objetivo**: Acesso exclusivo para administradores da empresa dona do SaaS.
- **Visual**: Tema Dark Executivo com autenticação de duplo fator / credenciais master.
- **Link**: Alternância direta para o portal de prefeituras.

### 1.3. Painel Master SaaS (`SaaSAdminPanel`)
- **Abas**:
  1. *Prefeituras Clientes*: Listagem, status, cotas, criação rápida com auto-descoberta IBGE.
  2. *Personalização & White-Label*: Módulo de configuração visual por prefeitura (logo, cores, pacote básico vs 100% personalizado, taxas de setup e mensalidade extra).
  3. *Usuários & Licenças*: Gestão global de usuários por tenant e controle de excedentes.
  4. *Conexões de APIs*: Monitoramento de status das APIs Siconfi, TCE, Transferegov.
  5. *Faturamento & Invoices*: Demonstrativo financeiro, MRR, taxas de setup e mensalidades.
