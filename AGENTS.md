# 🤖 AGENTS.md — Governança e Regras de Desenvolvimento

Este documento define os princípios arquiteturais, padrões de código e regras de segurança para o sistema **SaaS Fiscal Multi-Tenant para Prefeituras**.

---

## 1. Princípios Arquiteturais

1. **Isolamento de Tenants (Multi-Tenancy Estrito)**:
   - Nenhum dado de um município pode vazar ou ser visualizado por outro município.
   - Cada prefeitura possui seu `tenantId` e código IBGE único de 7 dígitos.
   - Toda consulta fiscal é filtrada pelo `tenantId` ativo.

2. **Separação de Acessos**:
   - **Administrador do SaaS (Master Admin)**: Acesso exclusivo ao painel de gestão SaaS via portal administrativo isolado (`/admin` / `/admin/login`).
   - **Usuários Municipais (Prefeituras)**: Acesso pelo portal único institucional com identificação automática de município através de **E-mail** ou **CPF**. Toda sessão exige autenticação com login e senha.

3. **Tipografia e Padrão Visual**:
   - Todo dado técnico, valor monetário, percentual, código IBGE, CPF, CNPJ e indicador financeiro DEVE ser renderizado com a fonte **`JetBrains Mono`** (`font-mono`).
   - Todo o design do sistema deve seguir estritamente o `DESIGN_SYSTEM.md` e o `DESIGN.md`.

4. **White-Label e Customização**:
   - Pacote Básico: Exibe a marca da empresa dona do SaaS ("Escrita.Online").
   - Pacote 100% Personalizado: Permite customização de logos, cores e identidade visual da prefeitura mediante taxa de implantação e mensalidade adicional gerenciadas pelo Administrador SaaS.
